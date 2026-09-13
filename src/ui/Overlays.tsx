import { useEffect, useRef } from 'react'
import { Activity, ArrowUpRight } from 'lucide-react'
import { CONCEPT_BY_ID, PART_BY_ID, SYSTEM_BY_ID } from '@/data/falcon9'
import { FLIGHT_MILESTONES } from '@/data/falcon9/flight'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

export function Caption() {
  const t = useT()
  const l = useL()
  const { isolate, explode, focus, flight, flightTime } = useAtlas()
  const name = focus?.kind === 'concept' ? CONCEPT_BY_ID.get(focus.id)?.name : focus ? PART_BY_ID.get(focus.id)?.name : undefined
  const milestone = [...FLIGHT_MILESTONES].reverse().find((m) => m.t <= flightTime + 1e-6) ?? FLIGHT_MILESTONES[0]
  const text = flight ? `${l(milestone.name)} · ${milestone.missionTime}`.toUpperCase() : isolate ? (name ? l(name) : t.captionSelected).toUpperCase() : explode > 0.95 ? t.captionInventory : explode > 0.05 ? t.captionSeparated : t.captionAssembled
  return (
    <div className="scene-caption">
      <span className="caption-line" />
      <span>{text}</span>
      <span className="caption-line" />
    </div>
  )
}

export function Footer() {
  const t = useT()
  const { explode, flight, setAboutOpen } = useAtlas()
  return (
    <footer className="studio-footer">
      <span>
        {explode > 0.8 ? t.dragPan : t.dragOrbit} <b>·</b> {t.pinchZoom} {flight ? (
          <>
            <b>·</b> {t.flightHint}
          </>
        ) : (
          <>
            <b>·</b> {t.tapInspect}
          </>
        )}
      </span>
      <button onClick={() => setAboutOpen(true)}>
        {t.credits} <ArrowUpRight size={12} />
      </button>
    </footer>
  )
}

export function Loading() {
  const t = useT()
  const { progress, error } = useAtlas()
  if (error)
    return (
      <div className="loading glass error" role="alert">
        <p style={{ margin: 0, fontSize: 13 }}>{error}</p>
        <button className="secondary-action" onClick={() => location.reload()}>
          {t.reload}
        </button>
      </div>
    )
  if (progress >= 100) return null
  return (
    <div className="loading glass" role="status">
      <Activity size={18} />
      <div style={{ flex: 1 }}>
        <strong>{t.loadingTitle}</strong>
        <span>{t.loading(progress)}</span>
        <div className="loading-track">
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

/** Tooltip that follows the pointer while a part is hovered. */
export function HoverLabel() {
  const l = useL()
  const hovered = useAtlas((s) => s.hovered)
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const n = el.current
      if (!n) return
      const host = n.parentElement!
      const r = host.getBoundingClientRect()
      const x = Math.min(e.clientX - r.left, r.width - 240)
      const y = Math.min(e.clientY - r.top, r.height - 60)
      n.style.transform = `translate(${x + 14}px, ${y + 18}px)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  const part = hovered ? PART_BY_ID.get(hovered) : undefined
  const system = part ? SYSTEM_BY_ID.get(part.system) : undefined
  return (
    <div ref={el} className="part-hover" role="tooltip" hidden={!part} style={{ left: 0, top: 0 }}>
      {part && (
        <>
          {l(part.name)}
          <span className="sub">{system ? l(system.name) : ''}</span>
        </>
      )}
    </div>
  )
}
