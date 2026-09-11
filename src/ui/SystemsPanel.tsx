import { useMemo } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { FALCON9, SYSTEMS } from '@/data/falcon9'
import type { SystemId } from '@/data/types'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

const STRUCTURE: SystemId[] = ['airframe', 'tanks']
const ENGINES: SystemId[] = ['propulsion', 'plumbing', 'pressurization']

export function SystemsPanel() {
  const t = useT()
  const l = useL()
  const { visible, isolate, selected, toggleSystem, showOnly, panel, setPanel } = useAtlas()
  const counts = useMemo(() => Object.fromEntries(SYSTEMS.map((s) => [s.id, FALCON9.parts.filter((p) => p.system === s.id).length])) as Record<SystemId, number>, [])
  const active = SYSTEMS.filter((s) => counts[s.id] > 0)
  const visibleCount = FALCON9.parts.filter((p) => (isolate ? selected.includes(p.id) : visible.includes(p.system) || selected.includes(p.id))).length
  const sameSet = (ids: SystemId[]) => ids.length === visible.length && ids.every((id) => visible.includes(id))

  return (
    <section className={`systems-panel glass ${panel === 'systems' ? 'mobile-open' : ''}`} aria-label={t.systems}>
      <div className="panel-heading">
        <span>{t.systems}</span>
        <button className="mobile-only icon-button" onClick={() => setPanel(null)} aria-label={t.close}>
          <X size={18} />
        </button>
        <Badge variant="secondary" className="desktop-only small-number">
          {active.length}
        </Badge>
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
