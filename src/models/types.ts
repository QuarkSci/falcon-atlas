import type * as T from 'three'

/** Physically-based material presets; the scene maps these to real materials per theme. */
export type MaterialKey =
  | 'paint-white'
  | 'paint-grey'
  | 'composite-black'
  | 'soot'
  | 'steel'
  | 'niobium'
  | 'titanium'
  | 'copper'
  | 'inconel'

export interface BuiltPart {
  id: string
  geometry: T.BufferGeometry
  material: MaterialKey
}

export type BuiltModel = Map<string, BuiltPart>
