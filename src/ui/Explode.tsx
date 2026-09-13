import { Boxes, RotateCcw } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'
import { useDraggable } from './useDraggable'

/** Icon-only symbol; lives in the left side rail next to Systems. */
export function ExplodeToggle() {
  const t = useT()
  const { explodeOpen, setExplodeOpen, flight, setFlight } = useAtlas()
  return (
    <button
      className={explodeOpen ? 'active' : ''}
      onClick={() => {
        if (flight) setFlight(false)
        setExplodeOpen(!explodeOpen)
      }}
      aria-pressed={explodeOpen}
      aria-label={t.explode}
      title={t.explode}
    >
      <Boxes size={18} />
    </button>
  )
}

/** Bottom-centre slider dock, revealed with a rise-and-fade once the symbol above is tapped. */
export function ExplodeDock() {
  const t = useT()
  const { explode, setExplode, reset } = useAtlas()
  const { panelRef, style, handleProps } = useDraggable()
  return (
    <div ref={panelRef as React.RefObject<HTMLDivElement>} style={style} className="dock-inner">
      <div className="drag-handle drag-handle-h" {...handleProps} />
      <div className="explode-control">
        <div className="explode-label">
          <label id="explode-label">{t.explode}</label>
          <output>
            {Math.round(explode * 100)}
            <span>%</span>
          </output>
        </div>
        <Slider aria-labelledby="explode-label" min={0} max={100} step={1} value={[explode * 100]} onValueChange={(v) => setExplode((Array.isArray(v) ? v[0] : v) / 100)} />
        <div className="slider-endpoints">
          <span>{t.assembled}</span>
          <span>{t.everyPiece}</span>
        </div>
      </div>
      <button className="dock-reset" onClick={reset} aria-label={t.reset} title={t.reset}>
        <RotateCcw size={17} />
      </button>
    </div>
  )
}
