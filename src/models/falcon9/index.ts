import * as T from 'three'
import type { BuiltModel, BuiltPart, MaterialKey } from '../types'
import { box, cylinder, merge, torus } from '../primitives'
import { FAIRING, INTERSTAGE, MERLIN, R, S1, S2 } from './dims'
import { capsule, downcomer, equipmentRing, LAYOUT, manifold, satellite, separationRing, teaTebTanks, thrusterPod } from './internals'
import { buildEngine, MERLIN_OPTS, MVAC_OPTS } from './merlin'
import { fairingHalf, gridFin, heatShield, interstage, landingLeg, octaweb, payloadAdapter, s1LoxTank, s1Rp1Tank, s2LoxTank, s2Rp1Tank, s2ThrustStructure } from './structures'

/** Build every Falcon 9 part in vehicle coordinates (metres, Y up). */
export function buildFalcon9(): BuiltModel {
  const model: BuiltModel = new Map()
  const add = (id: string, geometry: T.BufferGeometry, material: MaterialKey) => {
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    const part: BuiltPart = { id, geometry, material }
    model.set(id, part)
  }

  // ── Stage 1 airframe & tanks ───────────────────────────────────────
  add('octaweb', octaweb(), 'paint-white')
  add('s1-heat-shield', heatShield(), 'titanium')
  add('s1-rp1-tank', s1Rp1Tank(), 'paint-white')
  add('s1-lox-tank', s1LoxTank(), 'paint-white')
  add('interstage', interstage(), 'composite-black')

  // ── Engines: nine Merlins (pump side facing outward) and the MVac ──
  const merlin = buildEngine(MERLIN_OPTS)
  const placeEngine = (prefix: string, pieces: ReturnType<typeof buildEngine>, x: number, y: number, z: number, facing: number) => {
    for (const [key, piece] of pieces) {
      const g = piece.geometry.clone()
      g.rotateY(facing)
      g.translate(x, y, z)
      add(`${prefix}-${key}`, g, piece.material)
    }
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    placeEngine(`merlin-${i + 1}`, merlin, Math.cos(a) * MERLIN.ringRadius, 0, Math.sin(a) * MERLIN.ringRadius, -a + MERLIN.pinwheel)
  }
  placeEngine('merlin-9', merlin, 0, 0, 0, Math.PI / 2)
  merlin.forEach((p) => p.geometry.dispose())
  const mvac = buildEngine(MVAC_OPTS)
  placeEngine('mvac', mvac, 0, S2.nozzleBottom, 0, Math.PI / 2)
  mvac.forEach((p) => p.geometry.dispose())

  // ── Stage 1 plumbing, pressurisation, avionics, RCS ────────────────
  add('s1-lox-downcomer', downcomer(0.32, S1.loxBottom + 0.1, S1.octawebTop - 0.2), 'steel')
  add('s1-lox-manifold', manifold(S1.octawebTop - 0.45, MERLIN.ringRadius, 0.13, 0.32), 'steel')
  add('s1-rp1-manifold', manifold(S1.octawebTop - 0.85, MERLIN.ringRadius - 0.25, 0.09, 0.2), 'titanium')
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    const c = LAYOUT.s1Copv
    add(`s1-copv-${i + 1}`, capsule(c.r, c.length, Math.cos(a) * c.ring, c.y, Math.sin(a) * c.ring), 'composite-black')
  }
  add('s1-avionics-bay', equipmentRing(LAYOUT.s1Avionics.y, R - 0.45, 6, [0.5, 0.45, 0.7]), 'paint-grey')
  add('s1-flight-computer', box(0.55, 0.32, 0.4, 0, LAYOUT.s1Avionics.y + 0.75, 0.9), 'titanium')
  add('s1-batteries', merge([box(0.5, 0.36, 0.34, -0.7, LAYOUT.s1Avionics.y + 0.75, -0.6), box(0.5, 0.36, 0.34, 0.7, LAYOUT.s1Avionics.y + 0.75, -0.6)]), 'composite-black')
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    add(`s1-rcs-pod-${i + 1}`, thrusterPod(Math.cos(a) * R, LAYOUT.s1Rcs.y, Math.sin(a) * R, -a), 'titanium')
  }
  add('s1-n2-tanks', merge([capsule(0.34, 1.1, 0.8, LAYOUT.n2.y, 0.8), capsule(0.34, 1.1, -0.8, LAYOUT.n2.y, -0.8)]), 'composite-black')
  add('s1-tea-teb', teaTebTanks(), 'steel')

  // ── Recovery hardware ──────────────────────────────────────────────
  const finProto = gridFin()
  for (let i = 0; i < 4; i++) {
    const g = finProto.clone()
    g.rotateY((i / 4) * Math.PI * 2 + Math.PI / 4)
    add(`grid-fin-${i + 1}`, g, 'titanium')
  }
  finProto.dispose()
  const legProto = landingLeg()
  for (let i = 0; i < 4; i++) {
    const g = legProto.clone()
    g.rotateY((i / 4) * Math.PI * 2 + Math.PI / 4)
    add(`landing-leg-${i + 1}`, g, 'composite-black')
  }
  legProto.dispose()

  // ── Separation between the stages ──────────────────────────────────
  add('stage-separation-system', separationRing(INTERSTAGE.top - 0.9, R - 0.05, 4, 0.5, Math.PI / 4), 'steel')

  // ── Stage 2 ────────────────────────────────────────────────────────
  add('s2-thrust-structure', s2ThrustStructure(), 'soot')
  add('s2-rp1-tank', s2Rp1Tank(), 'paint-white')
  add('s2-lox-tank', s2LoxTank(), 'paint-white')
  add('s2-lox-downcomer', downcomer(0.22, S2.loxBottom + 0.1, S2.thrustTop - 0.1), 'steel')
  for (let i = 0; i < 2; i++) {
    const a = i * Math.PI + Math.PI / 2
    const c = LAYOUT.s2Copv
    add(`s2-copv-${i + 1}`, capsule(c.r, c.length, Math.cos(a) * c.ring, c.y, Math.sin(a) * c.ring), 'composite-black')
  }
  add('s2-avionics-bay', equipmentRing(LAYOUT.s2Avionics.y, 1.15, 5, [0.42, 0.4, 0.6]), 'paint-grey')
  add('s2-flight-computer', box(0.5, 0.3, 0.36, 0, LAYOUT.s2Avionics.y + 0.6, 0.55), 'titanium')
  add('s2-batteries', merge([box(0.42, 0.32, 0.3, -0.5, LAYOUT.s2Avionics.y + 0.6, -0.4), box(0.42, 0.32, 0.3, 0.5, LAYOUT.s2Avionics.y + 0.6, -0.4)]), 'composite-black')
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    add(`s2-rcs-pod-${i + 1}`, thrusterPod(Math.cos(a) * (R - 0.15), LAYOUT.s2Rcs.y, Math.sin(a) * (R - 0.15), -a), 'titanium')
  }

  // ── Payload ────────────────────────────────────────────────────────
  add('payload-adapter', payloadAdapter(), 'steel')
  add('payload-separation-system', merge([torus(0.8, 0.06, S2.loxTop + 1.05, 8, 48), ...[0, 1, 2, 3].map((i) => { const b = box(0.14, 0.16, 0.2, 0.8, S2.loxTop + 1.05, 0); b.rotateY((i / 4) * Math.PI * 2); return b })]), 'titanium')
  add('payload-spacecraft', satellite(), 'paint-grey')
  add('fairing-half-1', fairingHalf(0), 'paint-white')
  add('fairing-half-2', fairingHalf(1), 'paint-white')
  add('fairing-separation-system', merge([separationRing(LAYOUT.fairingPushers.y, R + 0.25, 4, 0.45, Math.PI / 4), ...seamLatches()]), 'steel')

  return model
}

/** Latch blocks along the two fairing seams (at ±X). */
function seamLatches() {
  const out: T.BufferGeometry[] = []
  for (const sign of [1, -1]) {
    for (let k = 0; k < 6; k++) {
      const y = FAIRING.bottom + 2.2 + k * 1.75
      const r = y < FAIRING.cylinderTop ? FAIRING.radius : FAIRING.radius * Math.sqrt(1 - Math.pow((y - FAIRING.cylinderTop) / (FAIRING.top - FAIRING.cylinderTop), 1.9)) * (1 - 0.06 * ((y - FAIRING.cylinderTop) / (FAIRING.top - FAIRING.cylinderTop)))
      out.push(box(0.16, 0.3, 0.26, sign * (r - 0.12), y, 0))
    }
  }
  return out
}

export { cylinder }
