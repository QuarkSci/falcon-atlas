import { ChevronDown } from 'lucide-react'
import type { SystemId } from '@/data/types'
import { FALCON9, SYSTEMS } from '@/data/falcon9'
import { useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

const STRUCTURE: SystemId[] = ['airframe', 'tanks']
const ENGINES: SystemId[] = ['propulsion', 'plumbing', 'pressurization']

const populated = (ids: SystemId[]) => ids.filter((id) => FALCON9.parts.some((p) => p.system === id))
const ALL = populated(SYSTEMS.map((s) => s.id))

/**
 * Left-edge pill of vertically-set visibility presets, with a chevron that
 * expands the full systems sheet — the rail is the shortcut, the sheet is
 * the whole list.
 */
export function SideRail() {
  const t = useT()
  const { visible, showOnly, panel, setPanel } = useAtlas()
  const open = panel === 'systems'
  const items: { key: string; label: string; ids: SystemId[] }[] = [
    { key: 'all', label: t.all, ids: ALL },
    { key: 'structure', label: t.structure, ids: populated(STRUCTURE) },
    { key: 'engines', label: t.engines, ids: populated(ENGINES) },
  ]
  const sameSet = (ids: SystemId[]) => ids.length === visible.length && ids.every((id) => visible.includes(id))
  return (
    <nav className="side-rail glass" aria-label={t.systems}>
      {items.map((item) => (
        <button key={item.key} className={`rail-item ${sameSet(item.ids) ? 'active' : ''}`} aria-pressed={sameSet(item.ids)} onClick={() => showOnly(item.ids)}>
          {item.label}
        </button>
      ))}
      <button className={`rail-expand ${open ? 'open' : ''}`} onClick={() => setPanel('systems')} aria-expanded={open} aria-label={t.systems} title={t.systems}>
        <ChevronDown size={16} />
      </button>
    </nav>
  )
}
