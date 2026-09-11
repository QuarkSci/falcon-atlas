/** Two-language text. Every user-facing string in the catalogue carries both. */
export interface L10n {
  en: string
  uz: string
}

export type SystemId =
  | 'airframe'
  | 'tanks'
  | 'propulsion'
  | 'recovery'
  | 'payload'
  | 'avionics'
  | 'pressurization'
  | 'plumbing'
  | 'rcs'
  | 'separation'

export interface System {
  id: SystemId
  name: L10n
  /** Accent used for UI dots and the "color by system" mode. */
  color: string
  description: L10n
}

export type StageId = 'stage1' | 'interstage' | 'stage2' | 'fairing'

export interface Spec {
  label: L10n
  value: string
}

export interface Source {
  title: string
  url: string
}

export interface Part {
  id: string
  name: L10n
  system: SystemId
  stage: StageId
  /** Parent part id for the hierarchy tree (e.g. turbopump → merlin-1). */
  parent?: string
  /** Assembly with no geometry of its own; selecting it selects its children. */
  group?: boolean
  /** Same-kind parts share a concept (all 9 Merlins → "merlin-1d"). */
  concept: string
  description: L10n
  /** Function / role of the part, shown after the description. */
  role?: L10n
  specs?: Spec[]
  material?: L10n
  /** True when the geometry is a schematic (no public CAD exists). */
  schematic?: boolean
  facts?: L10n[]
  sources?: Source[]
}

export interface Concept {
  id: string
  name: L10n
  /** Search aliases (abbreviations, alternative spellings, Uzbek variants). */
  aliases?: string[]
  parts: string[]
}

export interface Rocket {
  id: string
  name: L10n
  variant: string
  systems: System[]
  parts: Part[]
  concepts: Concept[]
  /** Overall dimensions in metres, used for camera framing. */
  height: number
  diameter: number
}
