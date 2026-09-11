import { useEffect } from 'react'
import { Layers3 } from 'lucide-react'
import { SceneView } from '@/scene/SceneView'
import { useAtlas } from '@/store/useAtlas'
import { useT } from '@/i18n'
import { Identity, TopActions } from '@/ui/Header'
import { SystemsPanel } from '@/ui/SystemsPanel'
import { SearchPanel } from '@/ui/SearchPanel'
import { ViewControls } from '@/ui/ViewControls'
import { Inspector } from '@/ui/Inspector'
import { About } from '@/ui/About'
import { Caption, Footer, HoverLabel, Loading } from '@/ui/Overlays'

export default function App() {
  const t = useT()
  const { theme, lang, panel, setPanel } = useAtlas()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = `${t.title} · Falcon 9`
  }, [lang, t])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (e.key === '/' && !typing) {
        e.preventDefault()
        if (useAtlas.getState().panel !== 'search') setPanel('search')
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [setPanel])

  return (
    <main className="studio">
      <SceneView />
      <div className="vignette" />
      <Identity />
      <TopActions />
      <SystemsPanel />
      {panel === 'search' && <SearchPanel />}
      <ViewControls />
      <Caption />
      <div className="bottom-dock glass">
        <button className="mobile-only dock-reset" onClick={() => setPanel('systems')} aria-label={t.systems}>
          <Layers3 size={19} />
          <span>{t.systems}</span>
        </button>
        <ExplodeDock />
      </div>
      <Footer />
      <HoverLabel />
      <Loading />
      <Inspector />
      <About />
    </main>
  )
}

import { RotateCcw } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

function ExplodeDock() {
  const t = useT()
  const { explode, setExplode, reset } = useAtlas()
  return (
    <>
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
      <button className="dock-reset" onClick={reset} aria-label={t.reset}>
        <RotateCcw size={17} />
        <span>{t.reset}</span>
      </button>
    </>
  )
}
