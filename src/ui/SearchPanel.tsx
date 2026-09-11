import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { CONCEPTS, PART_BY_ID, SYSTEM_BY_ID } from '@/data/falcon9'
import type { Concept } from '@/data/types'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

const FEATURED = ['merlin-1d', 'grid-fin', 's1-lox-tank', 'mvac', 'fairing', 'landing-leg', 'octaweb', 'interstage']

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ʼ’‘`]/g, "'")
    .replace(/o'/g, 'o')
    .replace(/g'/g, 'g')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()

export function SearchPanel() {
  const t = useT()
  const l = useL()
  const { setPanel, selectParts } = useAtlas()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => input.current?.focus(), [])

  const results = useMemo<Concept[]>(() => {
    const q = normalise(query)
    if (!q) return FEATURED.map((id) => CONCEPTS.find((c) => c.id === id)).filter((c): c is Concept => !!c)
    const terms = q.split(/\s+/)
    const score = (c: Concept) => {
      const hay = normalise([c.name.en, c.name.uz, ...(c.aliases ?? []), ...c.parts.flatMap((id) => { const p = PART_BY_ID.get(id); return p ? [p.name.en, p.name.uz] : [] })].join(' '))
      let s = 0
      for (const term of terms) {
        if (!hay.includes(term)) return -1
        if (normalise(c.name.en).startsWith(term) || normalise(c.name.uz).startsWith(term)) s += 3
        else s += 1
      }
      return s
    }
    return CONCEPTS.map((c) => ({ c, s: score(c) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s || l(a.c.name).length - l(b.c.name).length)
      .map((x) => x.c)
      .slice(0, 40)
  }, [query, l])

  useEffect(() => setCursor(0), [results])

  const choose = (c: Concept) => selectParts(c.parts, c.id)

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
        <input ref={input} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKey} placeholder={t.searchPlaceholder} aria-label={t.searchAria} role="combobox" aria-expanded aria-controls="search-results" aria-activedescendant={results[cursor] ? `sr-${results[cursor].id}` : undefined} />
      </div>
      <div className="search-results" id="search-results" role="listbox">
        {results.length === 0 && <div className="search-empty">{t.noMatches}</div>}
        {results.map((c, i) => {
          const first = PART_BY_ID.get(c.parts[0])
          const system = first ? SYSTEM_BY_ID.get(first.system) : undefined
          return (
            <button key={c.id} id={`sr-${c.id}`} role="option" aria-selected={i === cursor} className="search-result" onMouseEnter={() => setCursor(i)} onClick={() => choose(c)}>
              <span>
                {l(c.name)}
                <span className="sub">
                  {system && <span className="system-dot" style={{ background: system.color, display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />}
                  {system ? l(system.name) : ''}
                </span>
              </span>
              <span className="small-number">
                {c.parts.length} {c.parts.length === 1 ? t.piece : t.pieces}
              </span>
            </button>
          )
        })}
      </div>
      <p className="search-note">{query ? t.searchHintQuery : t.searchHint}</p>
    </section>
  )
}
