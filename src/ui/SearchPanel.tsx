import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { CONCEPTS, PART_BY_ID, PARTS, SYSTEM_BY_ID } from '@/data/falcon9'
import { conceptLeafIds, leafIds } from '@/data/catalogue'
import type { Part, SystemId } from '@/data/types'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

const FEATURED = ['merlin-1d', 'grid-fin', 's1-lox-tank', 'mvac', 'fairing', 'turbopump', 'copv', 'landing-leg']

type Result = { kind: 'concept'; id: string; name: { en: string; uz: string }; system: SystemId; count: number } | { kind: 'part'; id: string; name: { en: string; uz: string }; system: SystemId; count: number }

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ʼ’‘`]/g, "'")
    .replace(/o'/g, 'o')
    .replace(/g'/g, 'g')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()

interface Indexed {
  result: Result
  hay: string
  primary: string[]
}

function buildIndex(): Indexed[] {
  const out: Indexed[] = []
  for (const c of CONCEPTS) {
    const first = PART_BY_ID.get(c.parts[0])
    if (!first) continue
    const members = c.parts.map((id) => PART_BY_ID.get(id)).filter((p): p is Part => !!p)
    out.push({
      result: { kind: 'concept', id: c.id, name: c.name, system: first.system, count: conceptLeafIds(c.id).length },
      hay: normalise([c.name.en, c.name.uz, ...(c.aliases ?? []), ...members.flatMap((m) => [m.name.en, m.name.uz])].join(' ')),
      primary: [normalise(c.name.en), normalise(c.name.uz), ...(c.aliases ?? []).map(normalise)],
    })
  }
  for (const p of PARTS) {
    out.push({
      result: { kind: 'part', id: p.id, name: p.name, system: p.system, count: leafIds(p.id).length },
      hay: normalise([p.name.en, p.name.uz, p.id].join(' ')),
      primary: [normalise(p.name.en), normalise(p.name.uz)],
    })
  }
  return out
}

const INDEX = buildIndex()

export function SearchPanel() {
  const t = useT()
  const l = useL()
  const { setPanel, selectParts } = useAtlas()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => input.current?.focus(), [])

  const results = useMemo<Result[]>(() => {
    const q = normalise(query)
    if (!q) return FEATURED.map((id) => INDEX.find((x) => x.result.kind === 'concept' && x.result.id === id)?.result).filter((r): r is Result => !!r)
    const terms = q.split(/\s+/)
    const scored = INDEX.map((x) => {
      let s = 0
      for (const term of terms) {
        if (!x.hay.includes(term)) return { x, s: -1 }
        if (x.primary.some((p) => p.startsWith(term))) s += 3
        else if (x.primary.some((p) => p.includes(term))) s += 2
        else s += 1
      }
      if (x.result.kind === 'concept') s += 0.5
      return { x, s }
    })
    return scored
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s || l(a.x.result.name).length - l(b.x.result.name).length)
      .map((r) => r.x.result)
      .slice(0, 60)
  }, [query, l])

  useEffect(() => setCursor(0), [results])

  const choose = (r: Result) => {
    if (r.kind === 'concept') selectParts(conceptLeafIds(r.id), { kind: 'concept', id: r.id })
    else selectParts(leafIds(r.id), { kind: 'part', id: r.id })
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setPanel(null)
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && results[cursor]) choose(results[cursor])
  }

  return (
    <section className="search-panel glass" aria-label={t.findPart}>
      <div className="panel-heading">
        <span>{t.findPart}</span>
        <button className="icon-button" onClick={() => setPanel(null)} aria-label={t.close}>
          <X size={18} />
        </button>
      </div>
      <div className="search-input">
        <Search size={15} style={{ opacity: 0.5 }} />
        <input ref={input} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKey} placeholder={t.searchPlaceholder} aria-label={t.searchAria} role="combobox" aria-expanded aria-controls="search-results" aria-activedescendant={results[cursor] ? `sr-${results[cursor].kind}-${results[cursor].id}` : undefined} />
      </div>
      <div className="search-results" id="search-results" role="listbox">
        {results.length === 0 && <div className="search-empty">{t.noMatches}</div>}
        {results.map((r, i) => {
          const system = SYSTEM_BY_ID.get(r.system)
          return (
            <button key={`${r.kind}-${r.id}`} id={`sr-${r.kind}-${r.id}`} role="option" aria-selected={i === cursor} className="search-result" onMouseEnter={() => setCursor(i)} onClick={() => choose(r)}>
              <span>
                {l(r.name)}
                <span className="sub">
                  {system && <span className="system-dot" style={{ background: system.color, display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />}
                  {system ? l(system.name) : ''}
                  {r.kind === 'concept' && <span className="kind-badge">{t.conceptBadge}</span>}
                </span>
              </span>
              <span className="small-number">
                {r.count} {r.count === 1 ? t.piece : t.pieces}
              </span>
            </button>
          )
        })}
      </div>
      <p className="search-note">{query ? t.searchHintQuery : t.searchHint}</p>
    </section>
  )
}
