import { create } from 'zustand'
import type { SystemId } from '@/data/types'
import { SYSTEMS } from '@/data/falcon9/systems'

export type Lang = 'en' | 'uz'
export type Theme = 'dark' | 'light'
export type View = 'three-quarter' | 'front' | 'side' | 'back'
export type Panel = 'systems' | 'search' | null

export interface AtlasState {
  lang: Lang
  theme: Theme
  /** Systems currently shown. */
  visible: SystemId[]
  /** Selected part ids (a concept may select several). */
  selected: string[]
  /** Concept id behind the current selection, if any. */
  chosenConcept: string | null
  isolate: boolean
  explode: number
  view: View
  autoRotate: boolean
  /** Bumped to force a camera re-fit. */
  resetTick: number
  panel: Panel
  inspectorOpen: boolean
  aboutOpen: boolean
  hovered: string | null
  progress: number
  error: string

  setLang: (l: Lang) => void
  setTheme: (t: Theme) => void
  toggleSystem: (id: SystemId) => void
  showOnly: (ids: SystemId[]) => void
  selectParts: (ids: string[], concept: string | null) => void
  clearSelection: () => void
  setIsolate: (v: boolean) => void
  setExplode: (v: number) => void
  setView: (v: View) => void
  setAutoRotate: (v: boolean) => void
  setPanel: (p: Panel) => void
  setInspectorOpen: (v: boolean) => void
  setAboutOpen: (v: boolean) => void
  setHovered: (id: string | null) => void
  setProgress: (n: number) => void
  setError: (s: string) => void
  reset: () => void
}

const ALL_SYSTEMS = SYSTEMS.map((s) => s.id)

const initialLang = (): Lang => {
  try {
    const saved = localStorage.getItem('fa:lang')
    if (saved === 'uz' || saved === 'en') return saved
  } catch {}
  return navigator.language?.toLowerCase().startsWith('uz') ? 'uz' : 'en'
}

const initialTheme = (): Theme => {
  try {
    const saved = localStorage.getItem('fa:theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch {}
  return 'dark'
}

const sceneDefaults = {
  visible: ALL_SYSTEMS,
  selected: [] as string[],
  chosenConcept: null as string | null,
  isolate: false,
  explode: 0,
  view: 'three-quarter' as View,
  autoRotate: false,
  panel: null as Panel,
  inspectorOpen: false,
  hovered: null as string | null,
}

export const useAtlas = create<AtlasState>((set) => ({
  lang: initialLang(),
  theme: initialTheme(),
  ...sceneDefaults,
  resetTick: 0,
  aboutOpen: false,
  progress: 0,
  error: '',

  setLang: (lang) => {
    try {
      localStorage.setItem('fa:lang', lang)
    } catch {}
    set({ lang })
  },
  setTheme: (theme) => {
    try {
      localStorage.setItem('fa:theme', theme)
    } catch {}
    set({ theme })
  },
  toggleSystem: (id) =>
    set((s) => ({
      visible: s.visible.includes(id) ? s.visible.filter((x) => x !== id) : [...s.visible, id],
      selected: [],
      chosenConcept: null,
      isolate: false,
      inspectorOpen: false,
    })),
  showOnly: (ids) => set({ visible: ids, selected: [], chosenConcept: null, isolate: false, inspectorOpen: false }),
  selectParts: (ids, concept) => set({ selected: ids, chosenConcept: concept, isolate: false, inspectorOpen: ids.length > 0, panel: null, autoRotate: false }),
  clearSelection: () => set({ selected: [], chosenConcept: null, isolate: false, inspectorOpen: false }),
  setIsolate: (isolate) => set({ isolate, explode: 0 }),
  setExplode: (explode) => set((s) => ({ explode, autoRotate: false, view: explode > 0.8 ? 'front' : s.view })),
  setView: (view) => set((s) => ({ view, resetTick: s.resetTick + 1, autoRotate: false })),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setPanel: (panel) => set((s) => ({ panel: s.panel === panel ? null : panel, inspectorOpen: panel ? false : s.inspectorOpen })),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  setAboutOpen: (aboutOpen) => set({ aboutOpen, panel: null, inspectorOpen: false }),
  setHovered: (hovered) => set({ hovered }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  reset: () => set((s) => ({ ...sceneDefaults, resetTick: s.resetTick + 1 })),
}))

export const ALL_SYSTEM_IDS = ALL_SYSTEMS

if (import.meta.env.DEV) (window as unknown as { __atlas: typeof useAtlas }).__atlas = useAtlas
