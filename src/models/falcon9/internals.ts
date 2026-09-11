import * as T from 'three'
import { box, cylinder, merge, torus } from '../primitives'
import { FAIRING, INTERSTAGE, MERLIN, R, S1, S2 } from './dims'

/** Capsule-shaped pressure vessel, axis along Y, centred at (x, y, z). */
export function capsule(r: number, length: number, x: number, y: number, z: number) {
  const g = new T.CapsuleGeometry(r, Math.max(0.01, length - 2 * r), 6, 20)
  g.translate(x, y, z)
  return g
}

/** LOX downcomer: a straight pipe from the LOX tank floor to the engine manifold. */
export function downcomer(r: number, yTop: number, yBottom: number) {
  const pipe = cylinder(r, r, yTop - yBottom, 0, (yTop + yBottom) / 2, 0, 28)
  const flangeTop = torus(r + 0.05, 0.04, yTop - 0.1, 6, 28)
  const flangeBottom = torus(r + 0.05, 0.04, yBottom + 0.1, 6, 28)
  // Bellows joint half-way for thermal contraction.
  const bellows: T.BufferGeometry[] = []
  const mid = (yTop + yBottom) / 2
  for (let i = -3; i <= 3; i++) bellows.push(torus(r + 0.03, 0.035, mid + i * 0.09, 6, 28))
  return merge([pipe, flangeTop, flangeBottom, ...bellows])
}

/** Ring manifold inside the octaweb with a branch to each of the nine engines. */
export function manifold(y: number, ringR: number, tubeR: number, centreFeedR: number) {
  const parts: T.BufferGeometry[] = [torus(ringR, tubeR, y, 10, 72)]
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const branch = cylinder(tubeR * 0.8, tubeR * 0.8, 0.5, 0, 0, 0, 12)
    branch.translate(ringR, y - 0.25, 0)
    branch.rotateY(-a)
    parts.push(branch)
    // Spoke from the centre hub to the ring.
    const spoke = cylinder(tubeR * 0.7, tubeR * 0.7, ringR - centreFeedR, 0, 0, 0, 12)
    spoke.rotateZ(Math.PI / 2)
    spoke.translate((ringR + centreFeedR) / 2, y, 0)
    spoke.rotateY(-a + Math.PI / 8)
    parts.push(spoke)
  }
  parts.push(cylinder(centreFeedR, centreFeedR, 0.5, 0, y - 0.1, 0, 24))
  return merge(parts)
}

/** Equipment shelf ring: N boxes on a circle plus a support ring. */
export function equipmentRing(y: number, radius: number, count: number, size: [number, number, number]) {
  const parts: T.BufferGeometry[] = [torus(radius, 0.03, y - size[1] / 2 - 0.03, 6, 64)]
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.PI / count
    const b = box(size[0], size[1], size[2], radius, y, 0)
    b.rotateY(-a)
    parts.push(b)
  }
  return merge(parts)
}

/** Cold-gas thruster pod: a small housing with three nozzles. */
export function thrusterPod(x: number, y: number, z: number, facing: number) {
  const housing = box(0.34, 0.3, 0.42, 0.17, 0, 0)
  const parts: T.BufferGeometry[] = [housing]
  const nozzle = (dx: number, dy: number, dz: number, rx: number, ry: number, rz: number) => {
    const n = new T.CylinderGeometry(0.06, 0.03, 0.14, 12)
    n.rotateX(rx)
    n.rotateZ(rz)
    n.rotateY(ry)
    n.translate(dx, dy, dz)
    parts.push(n)
  }
  nozzle(0.4, 0, 0, 0, 0, -Math.PI / 2) // outward
  nozzle(0.2, 0.22, 0, 0, 0, 0) // up
  nozzle(0.2, 0, 0.28, Math.PI / 2, 0, 0) // sideways
  const g = merge(parts)
  g.rotateY(facing)
  g.translate(x, y, z)
  return g
}

/** Pneumatic pushers and latch blocks around a ring. */
export function separationRing(y: number, radius: number, count: number, pusherLength: number, offset = 0) {
  const parts: T.BufferGeometry[] = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + offset
    const pusher = merge([cylinder(0.09, 0.09, pusherLength, 0, pusherLength / 2, 0, 14), cylinder(0.05, 0.05, pusherLength * 0.6, 0, pusherLength * 1.25, 0, 10)])
    pusher.translate(radius - 0.22, y, 0)
    pusher.rotateY(-a)
    parts.push(pusher)
    const latch = box(0.16, 0.22, 0.32, radius - 0.08, y + pusherLength + 0.1, 0)
    latch.rotateY(-a - Math.PI / count)
    parts.push(latch)
  }
  return merge(parts)
}

/** Generic satellite bus with stowed solar arrays and a reflector. */
export function satellite() {
  const y0 = S2.loxTop + 1.05
  const bus = box(2.2, 3.0, 2.2, 0, y0 + 1.6, 0)
  const panel1 = box(0.08, 3.4, 2.0, 1.2, y0 + 1.7, 0)
  const panel2 = box(0.08, 3.4, 2.0, -1.2, y0 + 1.7, 0)
  const dish = new T.SphereGeometry(1.0, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.32)
  dish.rotateX(Math.PI)
  dish.translate(0, y0 + 3.9, 0)
  const feed = cylinder(0.05, 0.05, 0.9, 0, y0 + 3.45, 0, 8)
  const ring = torus(0.9, 0.06, y0 + 0.08, 8, 48)
  return merge([bus, panel1, panel2, dish, feed, ring])
}

/** Small igniter-fluid bottles tucked inside the octaweb. */
export function teaTebTanks() {
  const y = S1.octawebBottom + 1.2
  const a = capsule(0.17, 0.75, 0.9, y, 0.75)
  const b = capsule(0.17, 0.75, -0.9, y, 0.75)
  return merge([a, b])
}

export const LAYOUT = {
  s1Copv: { y: S1.loxBottom + 1.9, r: 0.3, length: 1.9, ring: 1.15 },
  s2Copv: { y: S2.loxBottom + 1.5, r: 0.26, length: 1.5, ring: 1.05 },
  s1Avionics: { y: S1.top + 0.55 },
  s2Avionics: { y: S2.loxTop - 0.05 },
  s1Rcs: { y: INTERSTAGE.top - 1.3 },
  s2Rcs: { y: S2.thrustTop - 0.5 },
  n2: { y: INTERSTAGE.top - 2.4 },
  fairingPushers: { y: FAIRING.bottom + 0.3 },
  merlinRing: MERLIN.ringRadius,
  R,
}
