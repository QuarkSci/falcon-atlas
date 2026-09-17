import { useCallback, useMemo, useRef, useState } from 'react'
import { Eye, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { FALCON9, SYSTEMS } from '@/data/falcon9'
import type { SystemId } from '@/data/types'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

/** Distance the sheet must be pulled down before release dismisses it. */
const DISMISS_PX = 90

/**
 * iOS sheet behaviour: the grabber drags the sheet down only (never up past
 * its resting place), and a release past `DISMISS_PX` closes it instead of
 * springing back.
 */
function useSheetDrag(onDismiss: () => void) {
  const [dy, setDy] = useState(0)
  const start = useRef<number | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.preventDefault()
    start.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (start.current === null) return
    setDy(Math.max(0, e.clientY - start.current))
  }, [])

  const end = useCallback(() => {
    if (start.current === null) return
    start.current = null
    setDy((d) => {
      if (d > DISMISS_PX) onDismiss()
      return 0
    })
  }, [onDismiss])

  return {
    dy,
    handleProps: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end },
  }
}

const STRUCTURE: SystemId[] = ['airframe', 'tanks']
const ENGINES: SystemId[] = ['propulsion', 'plumbing', 'pressurization']

export function SystemsPanel() {
  const t = useT()
  const l = useL()
  const { visible, isolate, selected, toggleSystem, showOnly, panel, setPanel } = useAtlas()
  const close = useCallback(() => setPanel(null), [setPanel])
  const { dy, handleProps } = useSheetDrag(close)
  const counts = useMemo(() => Object.fromEntries(SYSTEMS.map((s) => [s.id, FALCON9.parts.filter((p) => p.system === s.id).length])) as Record<SystemId, number>, [])
  const active = SYSTEMS.filter((s) => counts[s.id] > 0)
  const visibleCount = FALCON9.parts.filter((p) => (isolate ? selected.includes(p.id) : visible.includes(p.system) || selected.includes(p.id))).length
  const sameSet = (ids: SystemId[]) => ids.length === visible.length && ids.every((id) => visible.includes(id))
  const open = panel === 'systems'

  return (
    <section
      className={`systems-panel sheet glass ${open ? 'open' : ''} ${dy ? 'dragging' : ''}`}
      style={{ '--sheet-dy': `${dy}px` } as React.CSSProperties}
      aria-label={t.systems}
      aria-hidden={!open}
    >
      <div className="sheet-grabber" {...handleProps} />
      <div className="sheet-head">
        <button className="sheet-round" onClick={close} aria-label={t.close}>
          <X size={17} />
        </button>
        <span className="sheet-title">{t.systems}</span>
        <button className="sheet-round accent" onClick={() => showOnly(active.map((s) => s.id))} aria-label={t.showAll} title={t.showAll}>
          <Eye size={16} />
        </button>
      </div>
      <div className="presets">
        <button aria-pressed={sameSet(active.map((s) => s.id))} onClick={() => showOnly(active.map((s) => s.id))}>
          {t.all}
        </button>
        <button aria-pressed={sameSet(STRUCTURE.filter((id) => counts[id] > 0))} onClick={() => showOnly(STRUCTURE.filter((id) => counts[id] > 0))}>
          {t.structure}
        </button>
        <button aria-pressed={sameSet(ENGINES.filter((id) => counts[id] > 0))} onClick={() => showOnly(ENGINES.filter((id) => counts[id] > 0))}>
          {t.engines}
        </button>
      </div>
      <div className="system-list">
        {active.map((s) => (
          <div className={`system-row ${visible.includes(s.id) ? 'enabled' : ''}`} key={s.id}>
            <button className="system-name" title={t.showOnly(l(s.name))} onClick={() => showOnly([s.id])}>
              <span className="system-dot" style={{ background: s.color }} />
              {l(s.name)}
              <span className="system-count">{counts[s.id]}</span>
            </button>
            <Switch checked={visible.includes(s.id)} onCheckedChange={() => toggleSystem(s.id)} aria-label={t.show(l(s.name))} />
          </div>
        ))}
      </div>
      <div className="panel-foot">
        <span>{t.visibleCount(visibleCount)}</span>
        <button onClick={() => showOnly([])}>{t.hideAll}</button>
      </div>
    </section>
  )
}
