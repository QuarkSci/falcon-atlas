import { useEffect } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

const SOURCES = [
  { title: 'SpaceX Falcon User’s Guide (2021)', url: 'https://www.spacex.com/media/falcon-users-guide-2021-09.pdf' },
  { title: 'SpaceX — Falcon 9', url: 'https://www.spacex.com/vehicles/falcon-9/' },
  { title: 'Wikipedia — Falcon 9 Block 5', url: 'https://en.wikipedia.org/wiki/Falcon_9_Block_5' },
  { title: 'Wikipedia — SpaceX Merlin', url: 'https://en.wikipedia.org/wiki/SpaceX_Merlin' },
  { title: 'Inspired by Human Atlas', url: 'https://github.com/ashemag/human-atlas' },
]

export function About() {
  const t = useT()
  const { aboutOpen, setAboutOpen } = useAtlas()
  useEffect(() => {
    if (!aboutOpen) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setAboutOpen(false)
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [aboutOpen, setAboutOpen])
  if (!aboutOpen) return null
  return (
    <>
      <div className="about-backdrop" onClick={() => setAboutOpen(false)} />
      <section className="about-panel glass" role="dialog" aria-modal aria-label={t.about}>
        <button className="icon-button" style={{ position: 'absolute', top: 14, right: 14 }} onClick={() => setAboutOpen(false)} aria-label={t.close}>
          <X size={18} />
        </button>
        <div className="eyebrow">{t.aboutEyebrow}</div>
        <h2>{t.aboutTitle}</h2>
        <p className="lead">{t.aboutLead}</p>
        <div className="about-copy">
          <p>{t.aboutBody1}</p>
          <p>{t.aboutBody2}</p>
          <h3>{t.aboutSources}</h3>
          {SOURCES.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
              {s.title} <ArrowUpRight size={14} />
            </a>
          ))}
        </div>
      </section>
    </>
  )
}
