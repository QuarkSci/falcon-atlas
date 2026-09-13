import { useEffect } from 'react'
import { Pause, Play, Rocket, RotateCcw, X } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { FLIGHT_MILESTONES } from '@/data/falcon9/flight'
import { totalThrust } from '@/scene/flight'
import { FlightAudio } from '@/scene/audio'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

/** Seconds for a full liftoff-to-payload playthrough at 1× speed. */
const DURATION_S = 26

/** One audio graph for the whole app: cheap to keep around between plays. */
const flightAudio = new FlightAudio()

/** Advances `flightTime` on a rAF loop while `flightPlaying` is true. */
export function useFlightPlayback() {
  const playing = useAtlas((s) => s.flightPlaying)
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const s = useAtlas.getState()
      if (!s.flightPlaying) return
      flightAudio.setPowered(totalThrust(s.flightTime))
      const next = s.flightTime + dt / DURATION_S
      if (next >= 1) {
        useAtlas.setState({ flightTime: 1, flightPlaying: false })
        return
      }
      // Bypass setFlightTime: that action pauses playback, which is right
      // for a manual scrub but would immediately stop this very loop.
      useAtlas.setState({ flightTime: next })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      flightAudio.stop()
    }
  }, [playing])
}

/** Button that enters the flight sequence; lives in the top actions bar. */
export function FlightToggle() {
  const t = useT()
  const { flight, setFlight } = useAtlas()
  return (
    <button className={`search-trigger ${flight ? 'active' : ''}`} onClick={() => setFlight(!flight)} aria-pressed={flight} aria-label={t.flightSequence} title={t.flightSequence}>
      <Rocket size={17} />
      <span>{t.flightSequence}</span>
    </button>
  )
}

/** Timeline controls that replace the explode slider in the bottom dock while flying. */
export function FlightDock() {
  const t = useT()
  const l = useL()
  const { flightTime, flightPlaying, setFlightTime, setFlightPlaying, setFlight } = useAtlas()
  useFlightPlayback()

  const active = [...FLIGHT_MILESTONES].reverse().find((m) => m.t <= flightTime + 1e-6) ?? FLIGHT_MILESTONES[0]
  const atEnd = flightTime >= 1 - 1e-6

  const jump = (t: number) => {
    setFlightTime(t)
  }

  const togglePlay = () => {
    if (!flightPlaying) flightAudio.ensureStarted() // must run inside this click, not a later effect
    setFlightPlaying(!flightPlaying)
  }

  return (
    <>
      <button className="dock-reset" onClick={togglePlay} aria-label={flightPlaying ? t.pause : atEnd ? t.restart : t.play}>
        {flightPlaying ? <Pause size={19} /> : atEnd ? <RotateCcw size={19} /> : <Play size={19} />}
        <span>{flightPlaying ? t.pause : atEnd ? t.restart : t.play}</span>
      </button>
      <div className="flight-control">
        <div className="flight-label">
          <strong>{l(active.name)}</strong>
          <output>{active.missionTime}</output>
        </div>
        <div className="flight-scrubber">
          <Slider aria-label={t.flightSequence} min={0} max={1000} step={1} value={[flightTime * 1000]} onValueChange={(v) => setFlightTime((Array.isArray(v) ? v[0] : v) / 1000)} />
          <div className="flight-ticks" aria-hidden>
            {FLIGHT_MILESTONES.map((m) => (
              <button key={m.id} className={`flight-tick ${m.id === active.id ? 'active' : ''}`} style={{ left: `${m.t * 100}%` }} onClick={() => jump(m.t)} title={`${l(m.name)} · ${m.missionTime}`} />
            ))}
          </div>
        </div>
      </div>
      <button className="icon-button" onClick={() => setFlight(false)} aria-label={t.exitFlight} title={t.exitFlight}>
        <X size={18} />
      </button>
    </>
  )
}
