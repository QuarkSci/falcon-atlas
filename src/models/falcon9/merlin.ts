import * as T from 'three'
import type { MaterialKey } from '../types'
import { box, cylinder, lathe, merge, torus, type Profile } from '../primitives'
import { MERLIN, MVAC } from './dims'

/**
 * Bell-nozzle contour from throat (s = 0) to exit (s = 1): rapid expansion
 * right after the throat, flattening toward the exit — a parabolic bell.
 */
function bellProfile(rThroat: number, rExit: number, length: number, yThroat: number, steps: number): Profile {
  const out: Profile = []
  for (let i = 0; i <= steps; i++) {
    const s = i / steps
    out.push([rThroat + (rExit - rThroat) * Math.pow(s, 0.58), yThroat - s * length])
  }
  return out.reverse() // increasing y
}

export interface EnginePiece {
  geometry: T.BufferGeometry
  material: MaterialKey
}

interface EngineOpts {
  exitRadius: number
  throatRadius: number
  chamberRadius: number
  bellLength: number
  /** Length of the radiatively cooled extension measured from the exit plane (0 = none). */
  extensionLength: number
}

/** Angled cylinder between two points. */
function strut(a: T.Vector3, b: T.Vector3, r: number, segments = 10) {
  const len = a.distanceTo(b)
  const g = new T.CylinderGeometry(r, r, len, segments)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const dir = b.clone().sub(a).normalize()
  const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir)
  g.applyQuaternion(q)
  g.translate(mid.x, mid.y, mid.z)
  return g
}

/** Smooth pipe along a set of waypoints. */
function pipe(points: T.Vector3[], r: number) {
  const curve = new T.CatmullRomCurve3(points, false, 'catmullrom', 0.3)
  return new T.TubeGeometry(curve, 40, r, 12, false)
}

/**
 * A Merlin 1D power head split into its sub-assemblies, in engine-local
 * coordinates: nozzle exit plane at y = 0, axis +Y, turbopump on the +X side.
 */
export function buildEngine(o: EngineOpts): Map<string, EnginePiece> {
  const { exitRadius: re, throatRadius: rt, chamberRadius: rc, bellLength: L } = o
  const out = new Map<string, EnginePiece>()
  const put = (key: string, geometry: T.BufferGeometry, material: MaterialKey) => out.set(key, { geometry, material })

  // ── Nozzle (+ optional radiative extension) ────────────────────────
  const bell = bellProfile(rt, re, L, L, 36)
  if (o.extensionLength > 0) {
    const cut = o.extensionLength
    const ext = bell.filter(([, y]) => y <= cut + 1e-6)
    const cooled = bell.filter(([, y]) => y >= cut - 1e-6)
    const extG = lathe(ext, 56)
    // Stiffening rings along the extension.
    const rings: T.BufferGeometry[] = [extG]
    for (const f of [0.15, 0.55, 0.95]) {
      const y = cut * f
      const r = radiusAt(bell, y)
      rings.push(torus(r + 0.015, 0.02, y, 6, 56))
    }
    put('nozzle-extension', merge(rings), 'niobium')
    const flange = torus(radiusAt(bell, cut) + 0.03, 0.035, cut, 8, 48)
    put('nozzle', merge([lathe(cooled, 48), flange]), 'steel')
  } else {
    const g = lathe(bell, 48)
    const band1 = torus(re - 0.01, 0.02, 0.06, 6, 48)
    const band2 = torus(radiusAt(bell, L * 0.4) + 0.012, 0.018, L * 0.4, 6, 48)
    put('nozzle', merge([g, band1, band2]), 'steel')
  }

  // ── Chamber: converging section + cylinder ─────────────────────────
  const chamber: Profile = [
    [rt, L - 0.02],
    [rt, L],
    [rt * 1.12, L + 0.05],
    [rc, L + 0.28],
    [rc, L + 0.74],
  ]
  put('chamber', merge([lathe(chamber, 48), torus(rc + 0.02, 0.025, L + 0.72, 6, 48)]), 'copper')

  // ── Injector dome ──────────────────────────────────────────────────
  const dome: Profile = [
    [rc, L + 0.74],
    [rc * 0.96, L + 0.82],
    [rc * 0.78, L + 0.9],
    [rc * 0.45, L + 0.96],
    [0.001, L + 0.985],
  ]
  put('injector', merge([lathe(dome, 48), torus(rc + 0.03, 0.03, L + 0.75, 6, 48), cylinder(0.05, 0.05, 0.18, 0, L + 1.06, 0, 12)]), 'steel')

  // ── Turbopump stack beside the chamber ─────────────────────────────
  const px = rc + 0.3
  const y0 = L + 0.12
  const inducer = cylinder(0.11, 0.09, 0.16, px, y0 + 0.08, 0, 16) // LOX inlet, pointing down
  const loxPump = cylinder(0.19, 0.19, 0.26, px, y0 + 0.3, 0, 24)
  const volute = torus(0.19, 0.055, y0 + 0.3, 8, 24)
  volute.translate(px, 0, 0)
  const fuelPump = cylinder(0.16, 0.16, 0.22, px, y0 + 0.55, 0, 24)
  const turbine = cylinder(0.19, 0.17, 0.24, px, y0 + 0.8, 0, 24)
  const shaftCap = cylinder(0.06, 0.06, 0.08, px, y0 + 0.96, 0, 12)
  put('turbopump', merge([inducer, loxPump, volute, fuelPump, turbine, shaftCap]), 'inconel')

  // ── Gas generator on top of the turbine ────────────────────────────
  const ggY = y0 + 1.06
  const gg = cylinder(0.085, 0.085, 0.22, px + 0.02, ggY + 0.11, 0.12, 16)
  const ggDome = new T.SphereGeometry(0.085, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  ggDome.translate(px + 0.02, ggY + 0.22, 0.12)
  const ggFeed = pipe([new T.Vector3(px + 0.02, ggY + 0.04, 0.12), new T.Vector3(px + 0.05, ggY - 0.05, 0.05), new T.Vector3(px, y0 + 0.92, 0)], 0.028)
  put('gas-generator', merge([gg, ggDome, ggFeed]), 'inconel')

  // ── Turbine exhaust duct: from the turbine down into the nozzle wall ─
  const dumpY = L * 0.38
  const dumpR = radiusAt(bell, dumpY)
  const duct = pipe(
    [new T.Vector3(px + 0.18, y0 + 0.8, 0.05), new T.Vector3(px + 0.32, y0 + 0.55, 0.1), new T.Vector3(re * 0.95 + 0.12, L * 0.75, 0.12), new T.Vector3(dumpR + 0.08, dumpY + 0.1, 0.08), new T.Vector3(dumpR - 0.02, dumpY, 0.04)],
    0.075,
  )
  put('exhaust-duct', duct, 'soot')

  // ── Gimbal block and two hydraulic actuators ───────────────────────
  const top = L + 1.15
  const gimbalBlock = box(0.36, 0.2, 0.36, 0, top, 0)
  const pivot = new T.SphereGeometry(0.11, 16, 12)
  pivot.translate(0, top + 0.16, 0)
  const act1 = strut(new T.Vector3(-0.16, top + 0.02, 0.16), new T.Vector3(-0.62, top + 0.42, 0.55), 0.045)
  const act2 = strut(new T.Vector3(-0.16, top + 0.02, -0.16), new T.Vector3(-0.62, top + 0.42, -0.55), 0.045)
  const rod1 = strut(new T.Vector3(-0.42, top + 0.25, 0.39), new T.Vector3(-0.62, top + 0.42, 0.55), 0.06)
  const rod2 = strut(new T.Vector3(-0.42, top + 0.25, -0.39), new T.Vector3(-0.62, top + 0.42, -0.55), 0.06)
  put('gimbal', merge([gimbalBlock, pivot, act1, act2, rod1, rod2]), 'steel')

  // ── Main valves & inlet lines ──────────────────────────────────────
  const loxInlet = pipe([new T.Vector3(px, top + 0.55, 0), new T.Vector3(px, y0 + 1.0, 0)], 0.075)
  const loxMain = pipe([new T.Vector3(px - 0.2, y0 + 0.3, 0.14), new T.Vector3(rc + 0.02, L + 0.86, 0.1)], 0.062)
  const fuelInlet = pipe([new T.Vector3(px + 0.32, top + 0.55, -0.1), new T.Vector3(px + 0.3, y0 + 0.62, -0.1), new T.Vector3(px + 0.19, y0 + 0.55, -0.08)], 0.06)
  const fuelMain = pipe([new T.Vector3(px - 0.18, y0 + 0.55, -0.14), new T.Vector3(rc + 0.02, L + 0.7, -0.1)], 0.05)
  const loxValve = box(0.2, 0.22, 0.2, px, top + 0.05, 0)
  const fuelValve = box(0.16, 0.18, 0.16, px + 0.32, top + 0.05, -0.1)
  put('valves', merge([loxInlet, loxMain, fuelInlet, fuelMain, loxValve, fuelValve]), 'titanium')

  return out
}

function radiusAt(profile: Profile, y: number) {
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, y0] = profile[i],
      [r1, y1] = profile[i + 1]
    if (y >= y0 && y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
  }
  return profile[profile.length - 1][0]
}

export const MERLIN_OPTS: EngineOpts = { ...MERLIN, bellLength: 1.55, extensionLength: 0 }
export const MVAC_OPTS: EngineOpts = { ...MVAC, bellLength: 3.35, extensionLength: 2.3 }
