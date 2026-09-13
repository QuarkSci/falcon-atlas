/**
 * A synthesised rocket-engine rumble: filtered brown noise plus a low sine
 * for body, both gated by the aggregate thrust amount. No licensed sound
 * asset is used or needed. Must be started from inside a real user gesture
 * (a click handler) — browsers refuse to start audio otherwise.
 */
export class FlightAudio {
  private ctx: AudioContext | null = null
  private noiseGain: GainNode | null = null
  private toneGain: GainNode | null = null
  private filter: BiquadFilterNode | null = null

  /** Creates and connects the audio graph on first use; a no-op afterwards. */
  ensureStarted() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    this.ctx = ctx

    // Brown noise: integrated white noise, which sounds like a dull roar
    // rather than a hiss — much closer to a rocket than raw white noise.
    const seconds = 2
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.2
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 220
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0
    noise.connect(filter).connect(noiseGain).connect(ctx.destination)
    noise.start()

    // A low sine underneath for the felt "body" of the engines.
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 42
    const toneGain = ctx.createGain()
    toneGain.gain.value = 0
    osc.connect(toneGain).connect(ctx.destination)
    osc.start()

    this.filter = filter
    this.noiseGain = noiseGain
    this.toneGain = toneGain
  }

  /** `amount` is the aggregate 0..1 thrust level for the current instant. */
  setPowered(amount: number) {
    const ctx = this.ctx
    if (!ctx || !this.noiseGain || !this.toneGain || !this.filter) return
    const g = Math.max(0, Math.min(1, amount))
    const now = ctx.currentTime
    this.noiseGain.gain.setTargetAtTime(g * 0.5, now, 0.06)
    this.toneGain.gain.setTargetAtTime(g * 0.22, now, 0.06)
    this.filter.frequency.setTargetAtTime(180 + g * 260, now, 0.15)
  }

  /** Fades to silence without tearing down the audio graph (cheap to resume). */
  stop() {
    if (!this.ctx) return
    this.setPowered(0)
  }

  dispose() {
    this.ctx?.close()
    this.ctx = null
  }
}
