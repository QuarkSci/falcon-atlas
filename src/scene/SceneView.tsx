import { useEffect, useRef } from 'react'
import { FALCON9 } from '@/data/falcon9'
import { buildFalcon9 } from '@/models/falcon9'
import { useAtlas, type AtlasState, type Lang } from '@/store/useAtlas'
import { useT } from '@/i18n'
import { RocketScene, type SceneSnapshot } from './RocketScene'

const snapshot = (s: AtlasState): SceneSnapshot => ({
  visible: s.visible,
  selected: s.selected,
  isolate: s.isolate,
  explode: s.explode,
  view: s.view,
  autoRotate: s.autoRotate,
  resetTick: s.resetTick,
  theme: s.theme,
  inspectorOpen: s.inspectorOpen,
  hovered: s.hovered,
})

const labelsFor = (lang: Lang) => Object.fromEntries(FALCON9.parts.map((p) => [p.id, p.name[lang]]))

/** Mounts the Three.js scene once and streams store changes into it. */
export function SceneView() {
  const host = useRef<HTMLDivElement>(null)
  const t = useT()
  const tRef = useRef(t)
  tRef.current = t

  useEffect(() => {
    const el = host.current
    if (!el) return
    const store = useAtlas
    const { setProgress, setError } = store.getState()
    let scene: RocketScene | null = null
    let cancelled = false
    let lang = store.getState().lang

    // Build geometry on the next frame so the loading state paints first.
    const raf = requestAnimationFrame(() => {
      if (cancelled) return
      try {
        setProgress(15)
        const model = buildFalcon9()
        setProgress(70)
        scene = new RocketScene(
          el,
          FALCON9,
          model,
          {
            onSelect: (id) => {
              const s = store.getState()
              if (!id) {
                if (!s.isolate) s.clearSelection()
                return
              }
              const part = FALCON9.parts.find((p) => p.id === id)
              if (part) s.selectParts([id], part.concept)
            },
            onHover: (id) => store.getState().setHovered(id),
            onError: (code) => setError(code === 'context-lost' ? tRef.current.contextLost : tRef.current.webgl),
          },
          store.getState().theme,
        )
        scene.setLabels(labelsFor(lang))
        scene.setState(snapshot(store.getState()))
        if (import.meta.env.DEV) (window as unknown as { __scene: RocketScene }).__scene = scene
        setProgress(100)
      } catch (e) {
        console.error(e)
        setError(tRef.current.webgl)
      }
    })

    const unsubscribe = store.subscribe((s) => {
      if (!scene) return
      scene.setState(snapshot(s))
      if (s.lang !== lang) {
        lang = s.lang
        scene.setLabels(labelsFor(lang))
      }
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      unsubscribe()
      scene?.dispose()
    }
  }, [])

  return <div className="scene" ref={host} />
}
