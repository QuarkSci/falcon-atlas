import { Blocks, Box, Pause, Play, Rocket, RotateCcw } from 'lucide-react'
import { FLIGHT_MILESTONES } from '@/data/falcon9/flight'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'
import { flightAudio, useFlightPlayback } from './Flight'

/** Half the knob's width — the travel of a range input is inset by this much at both ends. */
const KNOB = 12

/**
 * macOS-style track: a thin rail with tick marks beneath it, an icon at each
 * end and a raised round knob. A native range input carries the interaction
 * so keyboard, touch and pointer all behave the way the platform expects.
 */
function MacSlider({
  value,
  onChange,
  label,
  ticks,
  activeTick,
  onTick,
  left,
  right,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  ticks: number[]
  activeTick?: number
  onTick?: (t: number) => void
  left: React.ReactNode
  right: React.ReactNode
}) {
  return (
    <div className="mac-slider">
      <span className="mac-slider-end">{left}</span>
      <div className="mac-slider-rail">
        <input type="range" min={0} max={1000} step={1} value={Math.round(value * 1000)} onChange={(e) => onChange(Number(e.target.value) / 1000)} aria-label={label} style={{ '--fill': `${value * 100}%` } as React.CSSProperties} />
        <div className="mac-ticks">
          {ticks.map((t) => {
            const pos = `calc(${KNOB}px + (100% - ${KNOB * 2}px) * ${t})`
            return onTick ? (
              <button key={t} className={`mac-tick pressable ${activeTick === t ? 'active' : ''}`} style={{ left: pos }} onClick={() => onTick(t)} tabIndex={-1} aria-hidden />
            ) : (
              <span key={t} className="mac-tick" style={{ left: pos }} />
            )
          })}
        </div>
      </div>
      <span className="mac-slider-end">{right}</span>
    </div>
  )
}

/** Circular progress dial: explode amount in anatomy mode, timeline position in flight. */
function Gauge() {
  const t = useT()
  const { flight, explode, flightTime, flightPlaying, setFlightPlaying, reset } = useAtlas()
  const value = flight ? flightTime : explode
  const atEnd = flightTime >= 1 - 1e-6
  const r = 21
  const circumference = 2 * Math.PI * r

  const press = () => {
    if (!flight) {
      reset()
      return
    }
    if (!flightPlaying) flightAudio.ensureStarted() // must run inside this click, not a later effect
    setFlightPlaying(!flightPlaying)
  }

  return (
    <div className="gauge-card glass">
      <button className="gauge" onClick={press} aria-label={flight ? (flightPlaying ? t.pause : atEnd ? t.restart : t.play) : t.reset} title={flight ? (flightPlaying ? t.pause : t.play) : t.reset}>
        <svg viewBox="0 0 50 50" aria-hidden>
          <circle className="gauge-track" cx="25" cy="25" r={r} />
          <circle className="gauge-value" cx="25" cy="25" r={r} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value)} />
        </svg>
        <span className="gauge-glyph">{flight ? flightPlaying ? <Pause size={16} /> : atEnd ? <RotateCcw size={16} /> : <Play size={16} /> : <RotateCcw size={15} />}</span>
      </button>
    </div>
  )
}

/** iOS-style bottom tab bar: part anatomy, or the flight sequence. */
function ModeTabs() {
  const t = useT()
  const { flight, setFlight } = useAtlas()
  return (
    <nav className="mode-tabs glass" role="tablist" aria-label={t.modeTabs}>
      <button role="tab" className={`mode-tab ${flight ? '' : 'active'}`} aria-selected={!flight} onClick={() => setFlight(false)}>
        <Blocks size={20} />
        <span>{t.tabAnatomy}</span>
      </button>
      <button role="tab" className={`mode-tab ${flight ? 'active' : ''}`} aria-selected={flight} onClick={() => setFlight(true)}>
        <Rocket size={20} />
        <span>{t.tabFlight}</span>
      </button>
    </nav>
  )
}

const EXPLODE_TICKS = [0, 0.25, 0.5, 0.75, 1]

/** The whole bottom stack: the active mode's slider, its dial, and the mode tabs. */
export function BottomBar() {
  const t = useT()
  const l = useL()
  const { flight, explode, setExplode, flightTime, setFlightTime } = useAtlas()
  useFlightPlayback()
  const milestone = [...FLIGHT_MILESTONES].reverse().find((m) => m.t <= flightTime + 1e-6) ?? FLIGHT_MILESTONES[0]

  return (
    <div className="bottom-dock">
      <div className="dock-row">
        {flight ? (
          <div className="slider-card glass">
            <div className="flight-label">
              <strong>{l(milestone.name)}</strong>
              <output>{milestone.missionTime}</output>
            </div>
            <MacSlider
              value={flightTime}
              onChange={setFlightTime}
              label={t.flightSequence}
              ticks={FLIGHT_MILESTONES.map((m) => m.t)}
              activeTick={milestone.t}
              onTick={setFlightTime}
              left={<Rocket size={15} />}
              right={<span className="end-glyph">∞</span>}
            />
          </div>
        ) : (
          // Bare track, no caption and no card: the two end icons already say
          // what the slider does, and the dial beside it reads out the value.
          <div className="slider-card bare">
            <MacSlider value={explode} onChange={setExplode} label={t.explode} ticks={EXPLODE_TICKS} left={<Box size={15} />} right={<Blocks size={16} />} />
          </div>
        )}
        <Gauge />
      </div>
      <ModeTabs />
    </div>
  )
}
