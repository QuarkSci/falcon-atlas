import * as T from 'three'
import type { MaterialKey } from '@/models/types'

interface Preset {
  color: string
  metalness: number
  roughness: number
  clearcoat?: number
}

const PRESETS: Record<MaterialKey, Preset> = {
  // clearcoat stays at 0 everywhere: three.js's clearcoat pass on
  // MeshPhysicalMaterial does not respect clippingPlanes, which silently
  // broke the cutaway view on every glossy-painted part.
  'paint-white': { color: '#e9ebee', metalness: 0.05, roughness: 0.42 },
  'paint-grey': { color: '#9ea4ad', metalness: 0.08, roughness: 0.5 },
  'composite-black': { color: '#1c1f24', metalness: 0.15, roughness: 0.55 },
  soot: { color: '#3b3f46', metalness: 0.3, roughness: 0.7 },
  steel: { color: '#8f959d', metalness: 0.85, roughness: 0.38 },
  niobium: { color: '#a08d7a', metalness: 0.9, roughness: 0.32 },
  titanium: { color: '#7d8188', metalness: 0.8, roughness: 0.45 },
  copper: { color: '#b0745a', metalness: 0.9, roughness: 0.35 },
  inconel: { color: '#6d7078', metalness: 0.85, roughness: 0.4 },
}

export const HIGHLIGHT = new T.Color('#3ed2c0')
export const HOVER = new T.Color('#7fb4ff')
export const GLOW = new T.Color('#ff9a4d')

export interface PartMaterial extends T.MeshPhysicalMaterial {
  userData: { key: MaterialKey; base: T.Color }
}

/** One physically-based material per part so selection and hover can tint individually. */
export function createPartMaterial(key: MaterialKey): PartMaterial {
  const p = PRESETS[key]
  const m = new T.MeshPhysicalMaterial({
    color: p.color,
    metalness: p.metalness,
    roughness: p.roughness,
    clearcoat: p.clearcoat ?? 0,
    clearcoatRoughness: 0.3,
    side: T.DoubleSide,
    envMapIntensity: 0.9,
  }) as PartMaterial
  m.userData = { key, base: new T.Color(p.color) }
  return m
}

/** Tint a material toward the selection / hover colours without losing its base. */
export function tint(m: PartMaterial, selected: number, hovered: number, powered = 0) {
  const base = m.userData.base
  m.color.copy(base)
  if (selected > 0) m.color.lerp(HIGHLIGHT, selected * 0.72)
  else if (hovered > 0) m.color.lerp(HOVER, hovered * 0.35)
  m.emissive.set(0x000000)
  if (selected > 0) m.emissive.copy(HIGHLIGHT).multiplyScalar(0.12 * selected)
  else if (hovered > 0) m.emissive.copy(HOVER).multiplyScalar(0.06 * hovered)
  // Engine-firing glow during the flight sequence, additive so it still reads
  // through a hover or selection tint.
  if (powered > 0) {
    m.emissive.r += GLOW.r * 0.8 * powered
    m.emissive.g += GLOW.g * 0.8 * powered
    m.emissive.b += GLOW.b * 0.8 * powered
  }
}
