import * as T from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type Profile = [radius: number, y: number][]

/** Revolve a (radius, y) profile around the Y axis. */
export function lathe(profile: Profile, segments = 64, thetaStart = 0, thetaLength = Math.PI * 2) {
  const pts = profile.map(([r, y]) => new T.Vector2(r, y))
  const g = new T.LatheGeometry(pts, segments, thetaStart, thetaLength)
  return g
}

/** Points along an elliptical dome from the equator (r, y0) to the pole. */
export function domeProfile(r: number, height: number, y0: number, up: boolean, steps = 12): Profile {
  const out: Profile = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * (Math.PI / 2)
    const rr = Math.cos(t) * r
    const yy = y0 + Math.sin(t) * height * (up ? 1 : -1)
    out.push([rr, yy])
  }
  return out
}

/** A cylindrical tank with elliptical domes at both ends (single watertight surface). */
export function tank(r: number, yBottom: number, yTop: number, domeRatio = 0.62, segments = 72) {
  const h = r * domeRatio
  const bottom = domeProfile(r, h, yBottom + h, false).reverse() // pole → equator
  const top = domeProfile(r, h, yTop - h, true) // equator → pole
  const profile: Profile = [...bottom, ...top]
  // Lathe needs strictly increasing y for clean normals; both arrays already are.
  return lathe(profile, segments)
}

/** Open cylinder shell between two heights (optionally tapered). */
export function shell(rBottom: number, rTop: number, yBottom: number, yTop: number, segments = 72, thetaStart = 0, thetaLength = Math.PI * 2) {
  return lathe([[rBottom, yBottom], [rTop, yTop]], segments, thetaStart, thetaLength)
}

export function box(w: number, h: number, d: number, x = 0, y = 0, z = 0) {
  const g = new T.BoxGeometry(w, h, d)
  g.translate(x, y, z)
  return g
}

export function cylinder(rTop: number, rBottom: number, h: number, x = 0, y = 0, z = 0, segments = 24) {
  const g = new T.CylinderGeometry(rTop, rBottom, h, segments)
  g.translate(x, y, z)
  return g
}

export function torus(r: number, tube: number, y = 0, radial = 12, tubular = 64) {
  const g = new T.TorusGeometry(r, tube, radial, tubular)
  g.rotateX(Math.PI / 2)
  g.translate(0, y, 0)
  return g
}

/** Merge geometries into one indexed buffer (non-indexed inputs are welded first). */
export function merge(geometries: T.BufferGeometry[]) {
  const indexed = geometries.map((g) => {
    const clean = g.index ? g : mergeVertices(g)
    // Drop attributes that differ between primitives so merging never fails.
    for (const name of Object.keys(clean.attributes)) if (name !== 'position' && name !== 'normal') clean.deleteAttribute(name)
    return clean
  })
  const merged = mergeGeometries(indexed, false)
  if (!merged) throw new Error('merge failed')
  merged.computeBoundingBox()
  merged.computeBoundingSphere()
  return merged
}

export function rotateY(g: T.BufferGeometry, angle: number) {
  g.rotateY(angle)
  return g
}

export function translate(g: T.BufferGeometry, x: number, y: number, z: number) {
  g.translate(x, y, z)
  return g
}

/** Place a geometry at angle θ on a ring of radius r around the Y axis (geometry built at +X). */
export function onRing(g: T.BufferGeometry, r: number, theta: number) {
  g.translate(r, 0, 0)
  g.rotateY(theta)
  return g
}
