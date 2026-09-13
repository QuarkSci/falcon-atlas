import { useMemo } from 'react'
import { Layers3, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { FALCON9, SYSTEMS } from '@/data/falcon9'
import type { SystemId } from '@/data/types'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'
import { useDraggable } from './useDraggable'

const STRUCTURE: SystemId[] = ['airframe', 'tanks']
const ENGINES: SystemId[] = ['propulsion', 'plumbing', 'pressurization']

/** Icon-only symbol; lives in the left side rail. */
export function SystemsToggle() {
  const t = useT()
  const { panel, setPanel } = useAtlas()
  const open = panel === 'systems'
  return (
    <button className={open ? 'active' : ''} onClick={() => setPanel(open ? null : 'systems')} aria-pressed={open} aria-label={t.systems} title={t.systems}>
      <Layers3 size={18} />
    </button>
  )
}

export function SystemsPanel() {
  const t = useT()
  const l = useL()
  const { visible, isolate, selected, toggleSystem, showOnly, panel, setPanel } = useAtlas()
  const { panelRef, style, handleProps } = useDraggable()
  const counts = useMemo(() => Object.fromEntries(SYSTEMS.map((s) => [s.id, FALCON9.parts.filter((p) => p.system === s.id).length])) as Record<SystemId, number>, [])
  const active = SYSTEMS.filter((s) => counts[s.id] > 0)
  const visibleCount = FALCON9.parts.filter((p) => (isolate ? selected.includes(p.id) : visible.includes(p.system) || selected.includes(p.id))).length
  const sameSet = (ids: SystemId[]) => ids.length === visible.length && ids.every((id) => visible.includes(id))
  const open = panel === 'systems'

  return (
    <section ref={panelRef as React.RefObject<HTMLElement>} style={style} className={`systems-panel glass floating-panel ${open ? 'open' : ''}`} aria-label={t.systems} aria-hidden={!open}>
      <div className="drag-handle" {...handleProps} />
      <div className="panel-heading">
        <span>{t.systems}</span>
        <Badge variant="secondary" className="small-number">
          {active.length}
        </Badge>
        <button className="icon-button" onClick={() => setPanel(null)} aria-label={t.close}>
          <X size={18} />
        </button>
      </div>
      <div className="presets">
        <button aria-pressed={active.every((s) => visible.includes(s.id))} onClick={() => showOnly(active.map((s) => s.id))}>
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
