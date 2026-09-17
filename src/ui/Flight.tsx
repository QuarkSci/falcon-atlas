import { useEffect } from 'react'
import { totalThrust } from '@/scene/flight'
import { FlightAudio } from '@/scene/audio'
import { useAtlas } from '@/store/useAtlas'

/** Seconds for a full liftoff-to-payload playthrough at 1× speed. */
const DURATION_S = 26

/** One audio graph for the whole app: cheap to keep around between plays. */
export const flightAudio = new FlightAudio()

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
