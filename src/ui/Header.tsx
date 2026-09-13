import { Info, Moon, Search, Sun } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FALCON9 } from '@/data/falcon9'
import { useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'
import { FlightToggle } from '@/ui/Flight'

export function Identity() {
  const t = useT()
  return (
    <header className="identity glass">
      <div className="eyebrow">
        <span className="status-dot" /> {t.eyebrow}
      </div>
      <h1>
        {t.title}
        <Badge variant="outline" className="edition">
          {t.edition}
        </Badge>
      </h1>
      <div className="identity-meta">
        {t.metaPieces(FALCON9.parts.length)} <span>·</span> {t.metaVehicle}
      </div>
    </header>
  )
}

export function TopActions() {
  const t = useT()
  const { panel, setPanel, lang, setLang, theme, setTheme, setAboutOpen } = useAtlas()
  return (
    <nav className="top-actions glass" aria-label="Explorer panels">
      <button className={`search-trigger ${panel === 'search' ? 'active' : ''}`} onClick={() => setPanel('search')} aria-label={t.findPart}>
        <Search size={17} />
        <span>{t.findPart}</span>
        <kbd>/</kbd>
      </button>
      <FlightToggle />
      <div className="lang-toggle" role="group" aria-label={t.language}>
        <button className={lang === 'uz' ? 'active' : ''} onClick={() => setLang('uz')} aria-pressed={lang === 'uz'}>
          UZ
        </button>
        <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>
          EN
        </button>
      </div>
      <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t.theme} title={t.theme}>
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <button className="icon-button" onClick={() => setAboutOpen(true)} aria-label={t.about} title={t.about}>
        <Info size={17} />
      </button>
    </nav>
  )
}
