import { Pause, RotateCcw, RotateCw } from 'lucide-react'
import { useT } from '@/i18n'
import { useAtlas, type View } from '@/store/useAtlas'

const VIEWS: { id: View; glyph: string }[] = [
  { id: 'three-quarter', glyph: '¾' },
  { id: 'front', glyph: 'F' },
  { id: 'side', glyph: 'S' },
  { id: 'back', glyph: 'B' },
]

export function ViewControls() {
  const t = useT()
  const { view, setView, explode, autoRotate, setAutoRotate, isolate, reset } = useAtlas()
  return (
    <nav className="view-controls glass" aria-label="Camera controls">
      {VIEWS.map((v) => (
        <button key={v.id} className={view === v.id ? 'active' : ''} aria-pressed={view === v.id} disabled={explode > 0.8 && v.id !== 'front'} onClick={() => setView(v.id)} title={t.views[v.id]} aria-label={t.views[v.id]}>
          <span>{v.glyph}</span>
        </button>
      ))}
      <i />
      <button disabled={explode >= 0.4 || isolate} aria-label={autoRotate ? t.pauseRotate : t.autoRotate} title={t.autoRotate} className={autoRotate ? 'active' : ''} onClick={() => setAutoRotate(!autoRotate)}>
        {autoRotate ? <Pause size={16} /> : <RotateCw size={17} />}
      </button>
      <button aria-label={t.resetView} title={t.resetView} onClick={reset}>
        <RotateCcw size={16} />
      </button>
    </nav>
  )
}
