import { useEffect, useRef } from 'react'
import { ArrowUpRight, ChevronRight, CornerLeftUp, Focus, TriangleAlert, X } from 'lucide-react'
import { CONCEPT_BY_ID, PART_BY_ID, SYSTEM_BY_ID } from '@/data/falcon9'
import { childrenOf, conceptLeafIds, leafIds, parentOf } from '@/data/catalogue'
import type { Part } from '@/data/types'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

export function Inspector() {
  const t = useT()
  const l = useL()
  const { selected, focus, inspectorOpen, isolate, setIsolate, clearSelection, selectParts, setInspectorOpen } = useAtlas()
  const title = useRef<HTMLHeadingElement>(null)

  // Resolve what to describe: a concept (first member as the exemplar) or a part.
  const concept = focus?.kind === 'concept' ? CONCEPT_BY_ID.get(focus.id) : undefined
  const part: Part | undefined = focus?.kind === 'part' ? PART_BY_ID.get(focus.id) : concept ? PART_BY_ID.get(concept.parts[0]) : undefined
  const system = part ? SYSTEM_BY_ID.get(part.system) : undefined
  const open = inspectorOpen && !!part
  const heading = concept ? l(concept.name) : part ? l(part.name) : ''
  const parent = part ? parentOf(part.id) : undefined
  const children = part ? childrenOf(part.id) : []
  const members = concept ? concept.parts.map((id) => PART_BY_ID.get(id)).filter((p): p is Part => !!p) : []
  const siblings = part && !concept ? CONCEPT_BY_ID.get(part.concept) : undefined

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

  const goPart = (p: Part) => selectParts(leafIds(p.id), { kind: 'part', id: p.id })

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
            {parent && !concept && (
              <button className="parent-link" onClick={() => goPart(parent)}>
                <CornerLeftUp size={13} /> {t.partOf} <strong>{l(parent.name)}</strong>
              </button>
            )}
            <button className="icon-button" style={{ position: 'absolute', top: 10, right: 8 }} onClick={() => setInspectorOpen(false)} aria-label={t.close}>
              <X size={17} />
            </button>
          </div>
          <div className="detail-scroll" key={`${focus?.kind}-${focus?.id}-${isolate}`}>
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
                  {part.specs.map((sp, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <dt>{l(sp.label)}</dt>
                      <dd>{sp.value}</dd>
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
                <strong>{concept ? concept.id : part.id}</strong>
              </span>
              <span>
                {t.selectedPieces}
                <strong>{selected.length}</strong>
              </span>
            </div>
            {children.length > 0 && !concept && (
              <div className="detail-section member-list">
                <h3>{t.contains}</h3>
                {children.map((c) => (
                  <button key={c.id} onClick={() => goPart(c)}>
                    <span>{l(c.name)}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            )}
            {members.length > 1 && (
              <div className="detail-section member-list">
                <h3>{t.includedParts}</h3>
                {members.map((m) => (
                  <button key={m.id} onClick={() => goPart(m)}>
                    <span>{l(m.name)}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            )}
            {siblings && siblings.parts.length > 1 && (
              <div className="detail-section member-list">
                <h3>{l(siblings.name)}</h3>
                <button onClick={() => selectParts(conceptLeafIds(siblings.id), { kind: 'concept', id: siblings.id })}>
                  <span>
                    {t.all} · {siblings.parts.length} {t.pieces}
                  </span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
            {part.sources && part.sources.length > 0 && (
              <div className="detail-section">
                <h3>{t.sources}</h3>
                {part.sources.map((sr) => (
                  <a key={sr.url} className="source-link" href={sr.url} target="_blank" rel="noreferrer">
                    {sr.title} <ArrowUpRight size={13} />
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
