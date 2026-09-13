import { Compass, Pause, RotateCcw, RotateCw, Slice } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { useT } from '@/i18n'
import { useAtlas, type View } from '@/store/useAtlas'
import { useDraggable } from './useDraggable'

const VIEWS: { id: View; glyph: string }[] = [
  { id: 'three-quarter', glyph: '¾' },
  { id: 'front', glyph: 'F' },
  { id: 'side', glyph: 'S' },
  { id: 'back', glyph: 'B' },
]

/** Icon-only symbol on the right edge; opens the camera view controls. */
export function ViewControlsToggle() {
  const t = useT()
  const { viewControlsOpen, setViewControlsOpen } = useAtlas()
  return (
    <nav className="side-rail side-rail-right glass" aria-label={t.viewControls}>
      <button className={viewControlsOpen ? 'active' : ''} onClick={() => setViewControlsOpen(!viewControlsOpen)} aria-pressed={viewControlsOpen} aria-label={t.viewControls} title={t.viewControls}>
        <Compass size={18} />
      </button>
    </nav>
  )
}

export function ViewControls() {
  const t = useT()
  const { view, setView, explode, autoRotate, setAutoRotate, isolate, cutaway, setCutaway, viewControlsOpen, reset } = useAtlas()
  const { panelRef, style, handleProps } = useDraggable()
  return (
    <nav ref={panelRef as React.RefObject<HTMLElement>} style={style} className={`view-controls glass floating-panel ${viewControlsOpen ? 'open' : ''}`} aria-label={t.viewControls} aria-hidden={!viewControlsOpen}>
      <div className="drag-handle" {...handleProps} />
      {VIEWS.map((v) => (
        <button key={v.id} className={view === v.id ? 'active' : ''} aria-pressed={view === v.id} disabled={explode > 0.8 && v.id !== 'front'} onClick={() => setView(v.id)} title={t.views[v.id]} aria-label={t.views[v.id]}>
          <span>{v.glyph}</span>
        </button>
      ))}
      <i />
      <button disabled={explode >= 0.4 || isolate} aria-label={autoRotate ? t.pauseRotate : t.autoRotate} title={t.autoRotate} className={autoRotate ? 'active' : ''} onClick={() => setAutoRotate(!autoRotate)}>
        {autoRotate ? <Pause size={16} /> : <RotateCw size={17} />}
      </button>
      <button disabled={explode >= 0.4} aria-pressed={cutaway} aria-label={t.cutaway} title={t.cutaway} className={cutaway ? 'active' : ''} onClick={() => setCutaway(!cutaway)}>
        <Slice size={16} />
      </button>
      <button aria-label={t.resetView} title={t.resetView} onClick={reset}>
        <RotateCcw size={16} />
      </button>
    </nav>
  )
}

/** Floating angle control for the cutaway plane; shown only while cutaway is on. */
export function CutawayPanel() {
  const t = useT()
  const { cutawayAngle, setCutawayAngle } = useAtlas()
  const { panelRef, style, handleProps } = useDraggable()
  return (
    <section ref={panelRef as React.RefObject<HTMLElement>} style={style} className="cutaway-panel glass floating-panel open" aria-label={t.cutaway}>
      <div className="drag-handle drag-handle-h" {...handleProps} />
      <div className="cutaway-label">
        <Slice size={14} />
        <span>{t.cutawayAngleLabel}</span>
        <output>{Math.round(cutawayAngle)}°</output>
      </div>
      <Slider aria-label={t.cutawayAngleLabel} min={0} max={359} step={1} value={[cutawayAngle]} onValueChange={(v) => setCutawayAngle(Array.isArray(v) ? v[0] : v)} />
    </section>
  )
}
