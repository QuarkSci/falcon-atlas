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

/**
 * Loft a surface through a series of closed rings (each ring = same number of
 * points, in order). Ends are capped with triangle fans.
 */
export function loft(rings: T.Vector3[][], capStart = true, capEnd = true) {
  const n = rings[0].length
  const positions: number[] = []
  const indices: number[] = []
  for (const ring of rings) for (const p of ring) positions.push(p.x, p.y, p.z)
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < n; i++) {
      const a = r * n + i,
        b = r * n + ((i + 1) % n),
        c = (r + 1) * n + i,
        d = (r + 1) * n + ((i + 1) % n)
      indices.push(a, c, b, b, c, d)
    }
  }
  const cap = (ringIndex: number, flip: boolean) => {
    const centre = new T.Vector3()
    for (const p of rings[ringIndex]) centre.add(p)
    centre.divideScalar(n)
    const ci = positions.length / 3
    positions.push(centre.x, centre.y, centre.z)
    for (let i = 0; i < n; i++) {
      const a = ringIndex * n + i,
        b = ringIndex * n + ((i + 1) % n)
      if (flip) indices.push(ci, b, a)
      else indices.push(ci, a, b)
    }
  }
  if (capStart) cap(0, false)
  if (capEnd) cap(rings.length - 1, true)
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}

/**
 * A closed "blister" cross-section: a half-ellipse bulging toward +X from a
 * flat chord at x = x0, spanning `width` along Z. Returns `count` points.
 */
export function blisterRing(x0: number, y: number, width: number, depth: number, count = 20): T.Vector3[] {
  const pts: T.Vector3[] = []
  const arc = count - 2
  for (let i = 0; i <= arc; i++) {
    const t = (i / arc) * Math.PI
    pts.push(new T.Vector3(x0 + Math.sin(t) * depth, y, Math.cos(t) * (width / 2)))
  }
  // Close along the flat chord back to the start.
  pts.push(new T.Vector3(x0, y, 0))
  return pts
}
