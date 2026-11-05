type SoundName = "flap" | "score" | "medal" | "hit"

let ctx: AudioContext | null = null

function getContext() {
  if (typeof window === "undefined") return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

function tone(freq: number, start: number, duration: number, type: OscillatorType, volume: number, endFreq?: number) {
  const audio = getContext()
  if (!audio) return
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  const t0 = audio.currentTime + start
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration)
  gain.gain.setValueAtTime(volume, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(audio.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

export function playSound(name: SoundName) {
  switch (name) {
    case "flap":
      tone(420, 0, 0.12, "sine", 0.12, 720)
      break
    case "score":
      tone(880, 0, 0.09, "triangle", 0.14)
      tone(1180, 0.07, 0.12, "triangle", 0.14)
      break
    case "medal":
      tone(660, 0, 0.12, "triangle", 0.16)
      tone(880, 0.12, 0.12, "triangle", 0.16)
      tone(1320, 0.24, 0.22, "triangle", 0.16)
      break
    case "hit":
      tone(220, 0, 0.3, "sawtooth", 0.14, 70)
      break
  }
}
