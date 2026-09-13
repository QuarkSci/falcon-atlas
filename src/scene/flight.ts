import * as T from 'three'
import type { Part } from '@/data/types'
import { LEG, R } from '@/models/falcon9/dims'
import { T as MT } from '@/data/falcon9/flight'

/** Smoothstep, clamped outside [a, b]. */
function step(a: number, b: number, t: number) {
  if (a === b) return t < a ? 0 : 1
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return x * x * (3 - 2 * x)
}

/** A short 0→1→0 bump between `start` and `end`, easing at both edges. */
function pulse(t: number, start: number, end: number, edge = 0.3) {
  if (t < start || t > end) return 0
  const ramp = (end - start) * edge
  return Math.min(step(start, start + ramp, t), 1 - step(end - ramp, end, t))
}

const LATERAL_DIR = new T.Vector3(-Math.SQRT1_2, 0, -Math.SQRT1_2)

/** Shared height gained by the whole stack before it separates — without this
 * the vehicle just sits on the pad until MECO, which reads as "not flying". */
const CLIMB_PEAK = 55
function climbHeight(t: number) {
  return CLIMB_PEAK * step(0, MT.separation, t)
}

/** Whole-booster offset: keeps the pre-separation climb, then dips back down to the ground and drifts to a landing spot. */
function boosterOffset(t: number, out: T.Vector3) {
  if (t < MT.separation) return out.set(0, climbHeight(t), 0)
  const peak = climbHeight(MT.separation)
  const u = step(MT.separation, MT.landing, t)
  const arc = peak * (1 - u)
  const lateral = 14 * u
  return out.set(LATERAL_DIR.x * lateral, arc, LATERAL_DIR.z * lateral)
}

/** Whole-upper-stage offset: keeps the pre-separation climb, then continues rising. */
function upperOffset(t: number, out: T.Vector3) {
  if (t < MT.separation) return out.set(0, climbHeight(t), 0)
  const peak = climbHeight(MT.separation)
  const u = step(MT.separation, 1, t)
  return out.set(0, peak + 60 * u, 0)
}

/** Which rigid group a part's whole-body motion belongs to. */
function groupOf(part: Part): 'booster' | 'upper' | 'fairing' {
  if (part.concept === 'payload-spacecraft') return 'upper'
  if (part.stage === 'stage1' || part.stage === 'interstage') return 'booster'
  if (part.stage === 'fairing') return 'fairing'
  return 'upper'
}

const legAzimuth = (n: number) => (n / 4) * Math.PI * 2 + Math.PI / 4
const UP = new T.Vector3(0, 1, 0)

export interface FlightPose {
  offset: T.Vector3
  quaternion: T.Quaternion
  /** 0..1 engine-glow amount for this part, if any. */
  powered: number
}

const tmpHinge = new T.Vector3()
const tmpAxis = new T.Vector3()
const tmpRotatedHinge = new T.Vector3()
const tmpGroup = new T.Vector3()

/** Compute a part's position offset, rotation and engine-glow amount at time `t`. */
export function flightPose(part: Part, centre: T.Vector3, t: number, out: FlightPose): FlightPose {
  out.quaternion.identity()
  out.powered = 0

  const group = groupOf(part)
  if (group === 'booster') boosterOffset(t, tmpGroup)
  else if (group === 'upper') upperOffset(t, tmpGroup)
  else {
    // Fairing: rides up with the stack until it separates, then falls behind
    // and drifts to its own side while the stack keeps climbing without it.
    upperOffset(Math.min(t, MT.fairing), tmpGroup)
    const u = step(MT.fairing, 1, t)
    const side = centre.z >= 0 ? 1 : -1
    tmpGroup.y += -14 * u
    tmpGroup.z += side * 10 * u
  }
  out.offset.copy(tmpGroup)

  // Landing legs: swing outward on a tangential hinge near the octaweb.
  if (part.concept === 'landing-leg') {
    const n = Number(part.id.match(/-(\d+)$/)?.[1] ?? '1') - 1
    const az = legAzimuth(n)
    const deploy = step(0.68, 0.76, t)
    const angle = -0.32 * Math.PI * deploy
    tmpHinge.set(R, LEG.hingeY, 0).applyAxisAngle(UP, az)
    tmpAxis.set(-Math.sin(az), 0, Math.cos(az))
    out.quaternion.setFromAxisAngle(tmpAxis, angle)
    tmpRotatedHinge.copy(tmpHinge).applyQuaternion(out.quaternion)
    out.offset.add(tmpHinge).sub(tmpRotatedHinge)
  }

  // Grid fins: a simplified deploy — nudge outward with a slight twist,
  // rather than a precise hinge (their exact pivot is not load-bearing here).
  if (part.concept === 'grid-fin') {
    const n = Number(part.id.match(/-(\d+)$/)?.[1] ?? '1') - 1
    const az = legAzimuth(n)
    const deploy = step(MT.separation, MT.boostback, t)
    out.offset.x += Math.cos(az) * 0.5 * deploy
    out.offset.z += Math.sin(az) * 0.5 * deploy
    out.quaternion.setFromAxisAngle(UP, 0.26 * deploy)
  }

  // Payload separates from the adapter right at the very end.
  if (part.concept === 'payload-spacecraft') {
    const sep = step(1 - 0.06, 1, t)
    out.offset.y += 6 * sep
    out.offset.z += 3 * sep
  }

  // Engine glow. Merlin/MVac sub-parts (chamber, nozzle, turbopump…) each
  // carry their own concept, not the engine group's — match on id instead.
  if (/^merlin-\d+-/.test(part.id)) {
    // All nine burn continuously from liftoff, fading out right at MECO.
    out.powered = t <= MT.meco ? 1 - step(MT.meco - 0.02, MT.meco, t) : 0
    if (part.id.startsWith('merlin-9-')) {
      // The centre engine alone relights for three short burns during recovery.
      out.powered = Math.max(out.powered, pulse(t, MT.boostback - 0.02, MT.boostback + 0.05, 0.3), pulse(t, MT.entry - 0.02, MT.entry + 0.05, 0.3), pulse(t, MT.landing - 0.05, MT.landing, 0.3))
    }
  } else if (part.id.startsWith('mvac-')) {
    // Ignites shortly after stage separation and burns until just before payload deploy.
    out.powered = t < MT.separation + 0.02 ? 0 : t > 0.92 ? 1 - step(0.92, 0.98, t) : 1
  }

  return out
}

/**
 * Aggregate 0..1 "how much thrust is firing right now", for the engine
 * rumble — cheap to call every animation frame without touching any part.
 */
export function totalThrust(t: number): number {
  const merlins = t <= MT.meco ? 1 - step(MT.meco - 0.02, MT.meco, t) : 0
  const centreBurns = Math.max(pulse(t, MT.boostback - 0.02, MT.boostback + 0.05, 0.3), pulse(t, MT.entry - 0.02, MT.entry + 0.05, 0.3), pulse(t, MT.landing - 0.05, MT.landing, 0.3))
  const mvac = t < MT.separation + 0.02 ? 0 : t > 0.92 ? 1 - step(0.92, 0.98, t) : 1
  return Math.min(1, merlins + centreBurns * 0.4 + mvac * 0.55)
}
