import { Slice } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'
import { useDraggable } from './useDraggable'

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
