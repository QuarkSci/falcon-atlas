import { useEffect, useRef } from 'react'
import { ArrowUpRight, ChevronRight, Focus, TriangleAlert, X } from 'lucide-react'
import { CONCEPT_BY_ID, PART_BY_ID, SYSTEM_BY_ID } from '@/data/falcon9'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

export function Inspector() {
  const t = useT()
  const l = useL()
  const { selected, chosenConcept, inspectorOpen, isolate, setIsolate, clearSelection, selectParts, setInspectorOpen } = useAtlas()
  const title = useRef<HTMLHeadingElement>(null)
  const parts = selected.map((id) => PART_BY_ID.get(id)).filter((p) => !!p)
  const part = parts[0]
  const concept = chosenConcept ? CONCEPT_BY_ID.get(chosenConcept) : undefined
  const system = part ? SYSTEM_BY_ID.get(part.system) : undefined
  const open = inspectorOpen && !!part
  const heading = parts.length > 1 && concept ? l(concept.name) : part ? l(part.name) : ''

  useEffect(() => {
    if (open) title.current?.focus({ preventScroll: true })
  }, [open, heading])

  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspectorOpen(false)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open, setInspectorOpen])

  return (
    <aside className={`inspector glass ${open ? 'open' : ''}`} aria-hidden={!open} aria-label={heading}>
      {part && (
        <>
          <div className="detail-header">
            <div className="detail-accent" style={{ background: system?.color }} />
            <div className="eyebrow">
              {system ? l(system.name) : ''} <span style={{ opacity: 0.5 }}>·</span> {t.stages[part.stage]}
            </div>
            <h2 ref={title} tabIndex={-1} className="structure-title" style={{ outline: 'none' }}>
              {heading}
            </h2>
            <button className="icon-button" style={{ position: 'absolute', top: 10, right: 8 }} onClick={() => setInspectorOpen(false)} aria-label={t.close}>
              <X size={17} />
            </button>
          </div>
          <div className="detail-scroll" key={`${chosenConcept}-${part.id}-${isolate}`}>
            <p className="structure-description">{l(part.description)}</p>
            {part.role && (
              <div className="detail-section">
                <h3>{t.role}</h3>
                <p>{l(part.role)}</p>
              </div>
            )}
            {part.specs && part.specs.length > 0 && (
              <div className="detail-section">
                <h3>{t.specs}</h3>
                <dl className="spec-grid">
                  {part.specs.map((s, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <dt>{l(s.label)}</dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {part.material && (
              <div className="detail-section">
                <h3>{t.material}</h3>
                <p>{l(part.material)}</p>
              </div>
            )}
            {part.facts && part.facts.length > 0 && (
              <div className="detail-section">
                <h3>{t.facts}</h3>
                {part.facts.map((f, i) => (
                  <div className="fact" key={i}>
                    <span>{l(f)}</span>
                  </div>
                ))}
              </div>
            )}
            {part.schematic && (
              <div className="schematic-note">
                <TriangleAlert size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{t.schematic}</span>
              </div>
            )}
            <div className="structure-meta">
              <span>
                {t.atlasRef}
                <strong>{part.id}</strong>
              </span>
              <span>
                {t.selectedPieces}
                <strong>{selected.length}</strong>
              </span>
            </div>
            {parts.length > 1 && (
              <div className="detail-section member-list">
                <h3>{t.includedParts}</h3>
                {parts.map((p) => (
                  <button key={p.id} aria-current={false} onClick={() => selectParts([p.id], p.concept)}>
                    <span>{l(p.name)}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            )}
            {parts.length === 1 && concept && concept.parts.length > 1 && (
              <div className="detail-section member-list">
                <h3>{l(concept.name)}</h3>
                <button onClick={() => selectParts(concept.parts, concept.id)}>
                  <span>
                    {t.all} · {concept.parts.length} {t.pieces}
                  </span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
            {part.sources && part.sources.length > 0 && (
              <div className="detail-section">
                <h3>{t.sources}</h3>
                {part.sources.map((s) => (
                  <a key={s.url} className="source-link" href={s.url} target="_blank" rel="noreferrer">
                    {s.title} <ArrowUpRight size={13} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="detail-actions">
            <button className={`primary-action ${isolate ? 'active' : ''}`} onClick={() => setIsolate(!isolate)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Focus size={17} />
                {isolate ? t.showSurrounding : t.isolate}
              </span>
              <ChevronRight size={16} />
            </button>
            <button className="secondary-action" onClick={clearSelection}>
              {t.clearSelection}
            </button>
          </div>
        </>
      )}
    </aside>
  )
}
