import { create } from 'zustand'
import type { SystemId } from '@/data/types'
import { SYSTEMS } from '@/data/falcon9/systems'

export type Lang = 'en' | 'uz'
export type View = 'three-quarter' | 'front' | 'side' | 'back'
export type Panel = 'systems' | 'search' | null
export type Focus = { kind: 'concept'; id: string } | { kind: 'part'; id: string }

export interface AtlasState {
  lang: Lang
  /** Systems currently shown. */
  visible: SystemId[]
  /** Selected part ids (a concept may select several). */
  selected: string[]
  /** What the inspector describes: a concept, a single part, or an assembly. */
  focus: Focus | null
  isolate: boolean
  explode: number
  view: View
  autoRotate: boolean
  /** Whether a vertical wedge is clipped away to reveal interiors. */
  cutaway: boolean
  /** Azimuth of the cut, in degrees around the vehicle's axis. */
  cutawayAngle: number
  /** Whether the flight-sequence timeline is active (mutually exclusive with explode/isolate/cutaway). */
  flight: boolean
  /** Normalized position along the flight timeline, 0 (liftoff) to 1 (payload deployed). */
  flightTime: number
  /** Whether the timeline is auto-advancing. */
  flightPlaying: boolean
  /** Bumped to force a camera re-fit. */
  resetTick: number
  panel: Panel
  inspectorOpen: boolean
  aboutOpen: boolean
  hovered: string | null
  progress: number
  error: string

  setLang: (l: Lang) => void
  toggleSystem: (id: SystemId) => void
  showOnly: (ids: SystemId[]) => void
  selectParts: (ids: string[], focus: Focus | null) => void
  clearSelection: () => void
  setIsolate: (v: boolean) => void
  setExplode: (v: number) => void
  setView: (v: View) => void
  setAutoRotate: (v: boolean) => void
  setCutaway: (v: boolean) => void
  setCutawayAngle: (deg: number) => void
  setFlight: (v: boolean) => void
  setFlightTime: (t: number) => void
  setFlightPlaying: (v: boolean) => void
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

const sceneDefaults = {
  visible: ALL_SYSTEMS,
  selected: [] as string[],
  focus: null as Focus | null,
  isolate: false,
  explode: 0,
  view: 'three-quarter' as View,
  autoRotate: false,
  cutaway: false,
  cutawayAngle: 200,
  flight: false,
  flightTime: 0,
  flightPlaying: false,
  panel: null as Panel,
  inspectorOpen: false,
  hovered: null as string | null,
}

export const useAtlas = create<AtlasState>((set) => ({
  lang: initialLang(),
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
  toggleSystem: (id) =>
    set((s) => ({
      visible: s.visible.includes(id) ? s.visible.filter((x) => x !== id) : [...s.visible, id],
      selected: [],
      focus: null,
      isolate: false,
      inspectorOpen: false,
    })),
  showOnly: (ids) => set({ visible: ids, selected: [], focus: null, isolate: false, inspectorOpen: false }),
  selectParts: (ids, focus) => set({ selected: ids, focus, isolate: false, inspectorOpen: ids.length > 0, panel: null, autoRotate: false, flight: false, flightPlaying: false }),
  clearSelection: () => set({ selected: [], focus: null, isolate: false, inspectorOpen: false }),
  setIsolate: (isolate) => set({ isolate, explode: 0, flight: false, flightPlaying: false }),
  setExplode: (explode) => set((s) => ({ explode, autoRotate: false, view: explode > 0.8 ? 'front' : s.view, flight: false, flightPlaying: false })),
  setView: (view) => set((s) => ({ view, resetTick: s.resetTick + 1, autoRotate: false })),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setCutaway: (cutaway) => set((s) => ({ cutaway, autoRotate: false, flight: cutaway ? false : s.flight, flightPlaying: cutaway ? false : s.flightPlaying })),
  setCutawayAngle: (cutawayAngle) => set({ cutawayAngle }),
  setFlight: (flight) =>
    set((s) =>
      flight
        ? { flight: true, flightTime: 0, flightPlaying: false, explode: 0, isolate: false, cutaway: false, selected: [], focus: null, panel: null, inspectorOpen: false, autoRotate: false, view: 'three-quarter', visible: ALL_SYSTEMS }
        : { flight: false, flightPlaying: false, resetTick: s.resetTick + 1 },
    ),
  setFlightTime: (flightTime) => set({ flightTime: Math.max(0, Math.min(1, flightTime)), flightPlaying: false }),
  setFlightPlaying: (flightPlaying) => set((s) => ({ flightPlaying, flightTime: flightPlaying && s.flightTime >= 1 ? 0 : s.flightTime })),
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
