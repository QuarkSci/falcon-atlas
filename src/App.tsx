import { useEffect } from 'react'
import { SceneView } from '@/scene/SceneView'
import { useAtlas } from '@/store/useAtlas'
import { useT } from '@/i18n'
import { Identity, TopActions } from '@/ui/Header'
import { SideRail } from '@/ui/SideRail'
import { SystemsPanel } from '@/ui/SystemsPanel'
import { SearchPanel } from '@/ui/SearchPanel'
import { CutawayPanel } from '@/ui/ViewControls'
import { BottomBar } from '@/ui/BottomBar'
import { Inspector } from '@/ui/Inspector'
import { About } from '@/ui/About'
import { Caption, Footer, HoverLabel, Loading } from '@/ui/Overlays'

export default function App() {
  const t = useT()
  const { lang, panel, setPanel, cutaway } = useAtlas()

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
      <SideRail />
      <SystemsPanel />
      {panel === 'search' && <SearchPanel />}
      {cutaway && <CutawayPanel />}
      <Caption />
      <BottomBar />
      <Footer />
      <HoverLabel />
      <Loading />
      <Inspector />
      <About />
    </main>
  )
}
