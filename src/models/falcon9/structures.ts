import * as T from 'three'
import { box, cylinder, lathe, merge, shell, tank, type Profile } from '../primitives'
import { DOME_RATIO, FAIRING, GRID_FIN, INTERSTAGE, LEG, MERLIN, R, S1, S2 } from './dims'

/**
 * Octaweb: an octagonal aluminium frame with eight outer engine bays, a
 * central bay, radial webs and a base heat shield.
 */
export function octaweb() {
  const h = S1.octawebTop - S1.octawebBottom
  const yMid = (S1.octawebTop + S1.octawebBottom) / 2
  const parts: T.BufferGeometry[] = []

  // Outer octagonal skin (thin) and inner octagon.
  const outer = new T.CylinderGeometry(R - 0.01, R - 0.01, h, 8, 1, true)
  outer.rotateY(Math.PI / 8)
  outer.translate(0, yMid, 0)
  parts.push(outer)
  const inner = new T.CylinderGeometry(0.62, 0.62, h, 8, 1, true)
  inner.rotateY(Math.PI / 8)
  inner.translate(0, yMid, 0)
  parts.push(inner)

  // Eight radial webs between the bays.
  for (let i = 0; i < 8; i++) {
    const web = box(R - 0.62, h, 0.06, (R + 0.62) / 2, yMid, 0)
    web.rotateY((i / 8) * Math.PI * 2 + Math.PI / 8)
    parts.push(web)
  }

  // Base heat-shield plate with the nine engine cut-outs suggested by rings.
  const plate = cylinder(R, R, 0.06, 0, S1.octawebBottom + 0.03, 0, 8)
  plate.rotateY(Math.PI / 8)
  parts.push(plate)
  const ringAt = (x: number, z: number) => {
    const ring = new T.TorusGeometry(MERLIN.chamberRadius + 0.1, 0.035, 8, 32)
    ring.rotateX(Math.PI / 2)
    ring.translate(x, S1.octawebBottom, z)
    parts.push(ring)
  }
  ringAt(0, 0)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ringAt(Math.cos(a) * MERLIN.ringRadius, Math.sin(a) * MERLIN.ringRadius)
  }

  // Top ring flange that bolts to the tank skirt.
  const flange = new T.TorusGeometry(R - 0.06, 0.05, 8, 64)
  flange.rotateX(Math.PI / 2)
  flange.translate(0, S1.octawebTop, 0)
  parts.push(flange)

  return merge(parts)
}

/** First-stage RP-1 tank: both domes; its top dome is the common bulkhead. */
export function s1Rp1Tank() {
  return tank(R, S1.rp1Bottom, S1.rp1Top + R * DOME_RATIO, DOME_RATIO)
}

/** First-stage LOX tank: cylinder + top dome; bottom is the shared bulkhead. */
export function s1LoxTank() {
  const h = R * DOME_RATIO
  const profile: Profile = [[R, S1.loxBottom], [R, S1.loxTop - h]]
  const g = lathe(profile, 72)
  const dome = lathe(domeTop(R, h, S1.loxTop - h), 72)
  return merge([g, dome])
}

function domeTop(r: number, h: number, y0: number, steps = 14): Profile {
  const out: Profile = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * (Math.PI / 2)
    out.push([Math.cos(t) * r, y0 + Math.sin(t) * h])
  }
  return out
}

/** Carbon composite interstage with the stage-2 separation ring at its top. */
export function interstage() {
  const body = shell(R, R, INTERSTAGE.bottom, INTERSTAGE.top, 72)
  const lowerRing = new T.TorusGeometry(R + 0.015, 0.03, 6, 72)
  lowerRing.rotateX(Math.PI / 2)
  lowerRing.translate(0, INTERSTAGE.bottom + 0.05, 0)
  const upperRing = new T.TorusGeometry(R + 0.015, 0.03, 6, 72)
  upperRing.rotateX(Math.PI / 2)
  upperRing.translate(0, INTERSTAGE.top - 0.05, 0)
  return merge([body, lowerRing, upperRing])
}

/**
 * Titanium grid fin, stowed flat against the interstage.
 * Built at +X: lattice plane is tangent to the body (contains Y and Z),
 * thickness along X (radial).
 */
export function gridFin() {
  const { width: w, height: h, thickness: t } = GRID_FIN
  const parts: T.BufferGeometry[] = []
  const frame = 0.045
  // Frame
  parts.push(box(t, frame, w, 0, h / 2 - frame / 2, 0))
  parts.push(box(t, frame, w, 0, -h / 2 + frame / 2, 0))
  parts.push(box(t, h, frame, 0, 0, w / 2 - frame / 2))
  parts.push(box(t, h, frame, 0, 0, -w / 2 + frame / 2))
  // Lattice
  const cols = 9,
    rows = 7,
    plate = 0.018
  for (let i = 1; i < cols; i++) parts.push(box(t * 0.92, h - frame * 2, plate, 0, 0, -w / 2 + (i / cols) * w))
  for (let j = 1; j < rows; j++) parts.push(box(t * 0.92, plate, w - frame * 2, 0, -h / 2 + (j / rows) * h, 0))
  // Hinge shaft and actuator boss on the inboard face.
  const shaft = cylinder(0.07, 0.07, w * 0.6, 0, -h / 2 - 0.02, 0, 12)
  shaft.rotateX(Math.PI / 2)
  shaft.translate(-t / 2 - 0.04, -h / 2 - 0.02, 0)
  parts.push(shaft)
  const g = merge(parts)
  g.translate(R + t / 2 + 0.06, GRID_FIN.y, 0)
  return g
}

/**
 * Landing leg, stowed along the base of the first stage. Built at +X, hinge
 * at the bottom, tapering toward the foot at the top. Includes the telescoping
 * strut that runs from the octaweb up to the leg's mid-span.
 */
export function landingLeg() {
  const { hingeY, length, rootWidth, tipWidth } = LEG
  // Trapezoidal leg fairing extruded outward (radially) by a small depth.
  const shape = new T.Shape()
  shape.moveTo(-rootWidth / 2, 0)
  shape.lineTo(rootWidth / 2, 0)
  shape.lineTo(tipWidth / 2, length)
  shape.lineTo(-tipWidth / 2, length)
  shape.closePath()
  const leg = new T.ExtrudeGeometry(shape, { depth: 0.32, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 })
  // Shape lies in XY (x = tangential, y = along axis); extrude along Z (radial after rotation).
  leg.rotateY(Math.PI / 2) // extrusion now along +X
  leg.translate(R + 0.02, hingeY, 0)

  // Hinge block at the root.
  const hinge = box(0.3, 0.32, rootWidth + 0.1, R + 0.15, hingeY + 0.1, 0)
  // Telescoping strut (two nested tubes) from the octaweb to mid-leg.
  const strutLen = length * 0.55
  const strutOuter = cylinder(0.1, 0.1, strutLen * 0.55, 0, 0, 0, 14)
  const strutInner = cylinder(0.07, 0.07, strutLen * 0.55, 0, 0, 0, 14)
  strutOuter.translate(0, strutLen * 0.275, 0)
  strutInner.translate(0, strutLen * 0.7, 0)
  const strut = merge([strutOuter, strutInner])
  strut.translate(R + 0.55, hingeY - 0.6, 0)
  // Foot pad at the tip (folded inward).
  const foot = cylinder(0.32, 0.36, 0.12, R + 0.2, hingeY + length + 0.06, 0, 20)

  return merge([leg, hinge, strut, foot])
}

/** Conical thrust structure at the base of the second stage. */
export function s2ThrustStructure() {
  const cone = shell(0.85, R, S2.thrustBottom, S2.thrustTop, 72)
  const ring = new T.TorusGeometry(0.85, 0.06, 8, 48)
  ring.rotateX(Math.PI / 2)
  ring.translate(0, S2.thrustBottom, 0)
  // Four pneumatic separation pushers on the rim.
  const pushers: T.BufferGeometry[] = []
  for (let i = 0; i < 4; i++) {
    const p = cylinder(0.08, 0.08, 0.5, R - 0.25, S2.thrustTop - 0.3, 0, 10)
    p.rotateY((i / 4) * Math.PI * 2 + Math.PI / 4)
    pushers.push(p)
  }
  return merge([cone, ring, ...pushers])
}

export function s2Rp1Tank() {
  return tank(R, S2.rp1Bottom, S2.rp1Top + R * DOME_RATIO, DOME_RATIO)
}

export function s2LoxTank() {
  const h = R * DOME_RATIO
  const g = lathe([[R, S2.loxBottom], [R, S2.loxTop - h]], 72)
  const dome = lathe(domeTop(R, h, S2.loxTop - h), 72)
  return merge([g, dome])
}

/** Payload attach fitting: cone on top of the stage-2 forward dome. */
export function payloadAdapter() {
  const y0 = S2.loxTop - 0.15
  const cone = shell(1.25, 0.79, y0, y0 + 1.2, 48)
  const ring = new T.TorusGeometry(0.79, 0.05, 8, 48)
  ring.rotateX(Math.PI / 2)
  ring.translate(0, y0 + 1.2, 0)
  return merge([cone, ring])
}

/** Fairing half (0 → π or π → 2π): boat-tail, cylinder, ogive nose. */
export function fairingHalf(which: 0 | 1) {
  const { radius: rf, bottom, cylinderTop, top } = FAIRING
  const profile: Profile = [
    [R, bottom],
    [rf, bottom + 1.6],
    [rf, cylinderTop],
  ]
  // Tangent ogive from cylinderTop to the rounded tip.
  const L = top - cylinderTop
  const steps = 22
  for (let i = 1; i <= steps; i++) {
    const s = i / steps
    // Blend of ogive and a small spherical cap so the tip is not a spike.
    const rr = rf * Math.sqrt(1 - Math.pow(s, 1.9)) * (1 - 0.06 * s) + 0.001
    profile.push([rr, cylinderTop + s * L])
  }
  const g = lathe(profile, 48, which * Math.PI, Math.PI)
  // Separation-plane flange along the split line so each half reads as a shell.
  const lip: T.BufferGeometry[] = []
  const sign = which === 0 ? 1 : -1
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, y0] = profile[i]
    const [r1, y1] = profile[i + 1]
    const seg = cylinder(0.035, 0.035, Math.hypot(r1 - r0, y1 - y0), 0, 0, 0, 6)
    const mid = ((r0 + r1) / 2) * sign
    seg.rotateZ(-Math.atan2(y1 - y0, (r1 - r0) * sign) + Math.PI / 2)
    seg.translate(mid, (y0 + y1) / 2, 0)
    lip.push(seg)
  }
  return merge([g, ...lip])
}
