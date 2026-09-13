import * as T from 'three'

/** A layered exhaust flame: a broad soft outer cone and a brighter inner core. */
export interface Flame {
  group: T.Group
  outer: T.Mesh
  inner: T.Mesh
  outerMat: T.MeshBasicMaterial
  innerMat: T.MeshBasicMaterial
  length: number
}

/** Builds one cone tapering to a point in -Y, base (radius `r`) at local origin. */
function taper(radius: number, length: number, material: T.Material) {
  const geo = new T.ConeGeometry(radius, length, 20, 1, true)
  geo.rotateX(Math.PI) // apex was +Y; now points -Y
  geo.translate(0, -length / 2, 0) // base sits at the local origin
  return new T.Mesh(geo, material)
}

/**
 * A flame anchored at `exitRadius` (the nozzle's exit radius): hangs from the
 * parent's local origin pointing down its -Y axis. `length` scales with the
 * nozzle size so the sea-level Merlins and the much larger MVac read
 * proportionately.
 */
export function createFlame(exitRadius: number): Flame {
  const group = new T.Group()
  const length = exitRadius * 5.5
  const outerMat = new T.MeshBasicMaterial({ color: '#ff7a2e', transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })
  const innerMat = new T.MeshBasicMaterial({ color: '#fff6d6', transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })
  const outer = taper(exitRadius * 1.05, length, outerMat)
  const inner = taper(exitRadius * 0.55, length * 0.62, innerMat)
  outer.renderOrder = 10
  inner.renderOrder = 11
  group.add(outer, inner)
  group.visible = false
  group.frustumCulled = false
  outer.frustumCulled = false
  inner.frustumCulled = false
  return { group, outer, inner, outerMat, innerMat, length }
}

/** Scale and fade a flame for the current 0..1 powered amount, with a light flicker. */
export function updateFlame(flame: Flame, powered: number) {
  const visible = powered > 0.01
  flame.group.visible = visible
  if (!visible) return
  const flicker = 0.94 + Math.random() * 0.12
  const stretch = (0.55 + 0.55 * powered) * flicker
  flame.outer.scale.set(1, stretch, 1)
  flame.inner.scale.set(1, stretch * 0.9, 1)
  flame.outerMat.opacity = 0.5 * powered
  flame.innerMat.opacity = 0.85 * powered
}
