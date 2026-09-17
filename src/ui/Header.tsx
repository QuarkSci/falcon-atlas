import { Info, PanelLeft, Pause, RotateCw, Search, Slice } from 'lucide-react'
import { FALCON9 } from '@/data/falcon9'
import { useT } from '@/i18n'
import { useAtlas, type View } from '@/store/useAtlas'

const VIEWS: { id: View; glyph: string }[] = [
  { id: 'three-quarter', glyph: '¾' },
  { id: 'front', glyph: 'F' },
  { id: 'side', glyph: 'S' },
  { id: 'back', glyph: 'B' },
]

/** Circular mark in the top-left corner; opens the about panel. */
export function Identity() {
  const t = useT()
  const setAboutOpen = useAtlas((s) => s.setAboutOpen)
  return (
    <header className="identity">
      <button className="identity-mark glass" onClick={() => setAboutOpen(true)} aria-label={t.about} title={t.about}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          <path d="M12 2.6c2.6 2.4 4 5.8 4 9.4 0 3-.9 5.6-2.4 7.6h-3.2C8.9 17.6 8 15 8 12c0-3.6 1.4-7 4-9.4Z" fill="currentColor" />
          <path d="M8 13.4 5.2 16v3.4L8 17.6Zm8 0 2.8 2.6v3.4L16 17.6Z" fill="currentColor" opacity=".55" />
        </svg>
      </button>
      <div className="identity-text">
        <div className="eyebrow">
          <span className="status-dot" /> {t.eyebrow}
        </div>
        <h1>{t.title}</h1>
        <div className="identity-meta">
          {t.metaPieces(FALCON9.parts.length)} <span>·</span> {t.metaVehicle}
        </div>
      </div>
    </header>
  )
}

/**
 * The single top bar: a sidebar toggle, a segmented tab strip of camera
 * views plus the cutaway toggle, then search and the global preferences —
 * all inside one pill, the way a tab bar reads on iOS/macOS.
 */
export function TopActions() {
  const t = useT()
  const { panel, setPanel, view, setView, explode, cutaway, setCutaway, autoRotate, setAutoRotate, isolate, lang, setLang, setAboutOpen } = useAtlas()
  const frontOnly = explode > 0.8
  return (
    <nav className="top-actions glass" aria-label={t.tools}>
      <button className={`pill-icon ${panel === 'systems' ? 'active' : ''}`} onClick={() => setPanel('systems')} aria-pressed={panel === 'systems'} aria-label={t.systems} title={t.systems}>
        <PanelLeft size={17} />
      </button>
      <div className="tab-group" role="tablist" aria-label={t.viewControls}>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            role="tab"
            className={`tab ${view === v.id && !cutaway ? 'active' : ''}`}
            aria-selected={view === v.id && !cutaway}
            disabled={frontOnly && v.id !== 'front'}
            onClick={() => {
              if (cutaway) setCutaway(false)
              setView(v.id)
            }}
            title={t.views[v.id]}
          >
            <span className="tab-glyph">{v.glyph}</span>
            <span className="tab-text">{t.views[v.id].replace(/\s.*/, '')}</span>
          </button>
        ))}
        <button role="tab" className={`tab ${cutaway ? 'active' : ''}`} aria-selected={cutaway} disabled={explode >= 0.4} onClick={() => setCutaway(!cutaway)} title={t.cutaway}>
          <Slice size={15} />
        </button>
      </div>
      <button className={`pill-icon ${panel === 'search' ? 'active' : ''}`} onClick={() => setPanel('search')} aria-label={t.findPart} title={t.findPart}>
        <Search size={17} />
      </button>
      <i className="pill-divider" />
      <button className={`pill-icon ${autoRotate ? 'active' : ''}`} disabled={explode >= 0.4 || isolate} onClick={() => setAutoRotate(!autoRotate)} aria-label={autoRotate ? t.pauseRotate : t.autoRotate} title={t.autoRotate}>
        {autoRotate ? <Pause size={16} /> : <RotateCw size={16} />}
      </button>
      <div className="lang-toggle" role="group" aria-label={t.language}>
        <button className={lang === 'uz' ? 'active' : ''} onClick={() => setLang('uz')} aria-pressed={lang === 'uz'}>
          UZ
        </button>
        <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>
          EN
        </button>
      </div>
      <button className="pill-icon" onClick={() => setAboutOpen(true)} aria-label={t.about} title={t.about}>
        <Info size={17} />
      </button>
    </nav>
  )
}
