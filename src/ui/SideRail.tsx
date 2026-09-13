import { useT } from '@/i18n'
import { SystemsToggle } from './SystemsPanel'
import { ExplodeToggle } from './Explode'

/** Left-edge vertical pill of icon-only symbols: Systems, then Explode. */
export function SideRail() {
  const t = useT()
  return (
    <nav className="side-rail glass" aria-label={t.systems}>
      <SystemsToggle />
      <ExplodeToggle />
    </nav>
  )
}
