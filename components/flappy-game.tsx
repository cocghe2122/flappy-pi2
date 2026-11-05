"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { usePiAuth } from "@/contexts/pi-auth-context"
import { detectLang, dictionary, type Lang } from "@/lib/i18n"
import { playSound } from "@/lib/sound"
import {
  GameOverScreen,
  Hud,
  IconButton,
  MEDAL_THRESHOLDS,
  MenuScreen,
  PauseScreen,
  medalForScore,
} from "@/components/game-overlays"

type Mode = "menu" | "ready" | "playing" | "paused" | "over"

interface Pipe {
  x: number
  prevX: number
  gapY: number
  gap: number
  passed: boolean
}

interface Cloud {
  x: number
  y: number
  r: number
  speed: number
}

const W = 360
const H = 600
const GROUND = 64
const BIRD_X = 96
const BIRD_R = 13
const PIPE_W = 58
const PIPE_SPACING = 200
const GRAVITY = 0.14
const FLAP = -3.9
const MAX_FALL = 3.8
const STEP_MS = 1000 / 60

const SETTINGS_KEY = "flappypi:settings"
const bestKey = (user: string | null) => `flappypi:best:${user ?? "guest"}`

function difficulty(score: number) {
  return {
    speed: Math.min(1.3 + score * 0.03, 2.6),
    gap: Math.max(118, 168 - score * 1.6),
  }
}

export function FlappyGame() {
  const { userData } = usePiAuth()
  const username = userData?.username ?? null

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modeRef = useRef<Mode>("menu")
  const soundRef = useRef(true)
  const scoreRef = useRef(0)
  const bestRef = useRef(0)
  const birdRef = useRef({ y: H / 2 - 40, prevY: H / 2 - 40, v: 0, rot: 0, prevRot: 0 })
  const groundSpeedRef = useRef(0)
  const pipesRef = useRef<Pipe[]>([])
  const cloudsRef = useRef<Cloud[]>([])
  const groundOffsetRef = useRef(0)
  const timeRef = useRef(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const [mode, setModeState] = useState<Mode>("menu")
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [newRecord, setNewRecord] = useState(false)
  const [lang, setLang] = useState<Lang>("vi")
  const [soundOn, setSoundOn] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const t = dictionary[lang]

  const setMode = useCallback((next: Mode) => {
    modeRef.current = next
    setModeState(next)
  }, [])

  const sfx = useCallback((name: Parameters<typeof playSound>[0]) => {
    if (soundRef.current) playSound(name)
  }, [])

  useEffect(() => {
    let saved: { lang?: Lang; sound?: boolean } = {}
    try {
      saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}")
    } catch {
      saved = {}
    }
    setLang(saved.lang === "vi" || saved.lang === "en" ? saved.lang : detectLang())
    const sound = saved.sound !== false
    soundRef.current = sound
    setSoundOn(sound)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    const stored = Number.parseInt(localStorage.getItem(bestKey(username)) ?? "0", 10)
    const value = Number.isFinite(stored) ? stored : 0
    bestRef.current = value
    setBest(value)
  }, [username])

  const saveSettings = (nextLang: Lang, nextSound: boolean) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ lang: nextLang, sound: nextSound }))
  }

  const toggleLang = () => {
    const next: Lang = lang === "vi" ? "en" : "vi"
    setLang(next)
    saveSettings(next, soundRef.current)
  }

  const toggleSound = () => {
    const next = !soundRef.current
    soundRef.current = next
    setSoundOn(next)
    saveSettings(lang, next)
  }

  const showToast = (message: string) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  const resetRound = useCallback(() => {
    birdRef.current = { y: H / 2 - 40, prevY: H / 2 - 40, v: 0, rot: 0, prevRot: 0 }
    pipesRef.current = []
    scoreRef.current = 0
    setScore(0)
    setNewRecord(false)
    setToast(null)
  }, [])

  const startRound = useCallback(() => {
    resetRound()
    setMode("ready")
  }, [resetRound, setMode])

  const goMenu = useCallback(() => {
    resetRound()
    setMode("menu")
  }, [resetRound, setMode])

  const pause = useCallback(() => {
    if (modeRef.current === "playing") setMode("paused")
  }, [setMode])

  const resume = useCallback(() => {
    if (modeRef.current === "paused") setMode("playing")
  }, [setMode])

  const flap = useCallback(() => {
    if (modeRef.current === "ready") setMode("playing")
    if (modeRef.current !== "playing") return
    birdRef.current.v = FLAP
    sfx("flap")
  }, [setMode, sfx])

  const endRound = useCallback(() => {
    setMode("over")
    sfx("hit")
    const finalScore = scoreRef.current
    if (finalScore > bestRef.current) {
      bestRef.current = finalScore
      setBest(finalScore)
      setNewRecord(true)
      localStorage.setItem(bestKey(username), String(finalScore))
    }
  }, [setMode, sfx, username])

  const onScore = useCallback(() => {
    scoreRef.current += 1
    const value = scoreRef.current
    setScore(value)
    const reached = MEDAL_THRESHOLDS.find((m) => m.score === value)
    if (reached) {
      sfx("medal")
      const label =
        reached.medal === "gold" ? t.medalGold : reached.medal === "silver" ? t.medalSilver : t.medalBronze
      showToast(`${t.newMedal}: ${label}`)
    } else {
      sfx("score")
    }
  }, [sfx, t])

  const endRoundRef = useRef(endRound)
  const onScoreRef = useRef(onScore)
  useEffect(() => {
    endRoundRef.current = endRound
    onScoreRef.current = onScore
  }, [endRound, onScore])

  useEffect(() => {
    cloudsRef.current = Array.from({ length: 4 }, (_, i) => ({
      x: (i * W) / 3 + Math.random() * 40,
      y: 50 + Math.random() * 220,
      r: 18 + Math.random() * 16,
      speed: 0.15 + Math.random() * 0.2,
    }))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        if (modeRef.current === "menu") startRound()
        else if (modeRef.current === "over") startRound()
        else if (modeRef.current === "paused") resume()
        else flap()
      } else if (e.code === "KeyP" || e.code === "Escape") {
        if (modeRef.current === "playing") pause()
        else if (modeRef.current === "paused") resume()
      }
    }
    const onHide = () => {
      if (document.hidden) pause()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("blur", pause)
    document.addEventListener("visibilitychange", onHide)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("blur", pause)
      document.removeEventListener("visibilitychange", onHide)
    }
  }, [flap, pause, resume, startRound])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    let raf = 0
    let last = performance.now()

    const update = (dt: number) => {
      const current = modeRef.current
      const bird = birdRef.current
      timeRef.current += dt
      bird.prevY = bird.y
      bird.prevRot = bird.rot
      for (const p of pipesRef.current) p.prevX = p.x
      groundSpeedRef.current = 0

      for (const c of cloudsRef.current) {
        if (current !== "paused") c.x -= c.speed * dt
        if (c.x < -c.r * 3) {
          c.x = W + c.r * 2
          c.y = 50 + Math.random() * 220
        }
      }

      if (current === "menu" || current === "ready") {
        groundSpeedRef.current = 1.3
        groundOffsetRef.current = (groundOffsetRef.current + 1.3 * dt) % 24
        bird.y = H / 2 - 40 + Math.sin(timeRef.current / 14) * 8
        bird.rot = 0
        return
      }
      if (current === "paused") return

      const { speed, gap } = difficulty(scoreRef.current)

      if (current === "playing") {
        groundSpeedRef.current = speed
        groundOffsetRef.current = (groundOffsetRef.current + speed * dt) % 24

        const pipes = pipesRef.current
        const lastPipe = pipes[pipes.length - 1]
        if (!lastPipe || lastPipe.x < W - PIPE_SPACING) {
          const margin = 70
          const gapY = margin + gap / 2 + Math.random() * (H - GROUND - margin * 2 - gap)
          const startX = lastPipe ? Math.max(W + 20, lastPipe.x + PIPE_SPACING) : W + 60
          pipes.push({ x: startX, prevX: startX, gapY, gap, passed: false })
        }
        for (const p of pipes) p.x -= speed * dt
        while (pipes.length && pipes[0].x < -PIPE_W) pipes.shift()
      }

      bird.v = Math.min(bird.v + GRAVITY * dt, MAX_FALL)
      bird.y += bird.v * dt
      bird.rot = Math.max(-0.4, Math.min(bird.v * 0.12, 1.0))

      if (current !== "playing") {
        const floor = H - GROUND - BIRD_R
        if (bird.y > floor) {
          bird.y = floor
          bird.v = 0
        }
        return
      }

      if (bird.y < BIRD_R) {
        bird.y = BIRD_R
        bird.v = 0
      }
      if (bird.y > H - GROUND - BIRD_R) {
        bird.y = H - GROUND - BIRD_R
        endRoundRef.current()
        return
      }

      for (const p of pipesRef.current) {
        const topH = p.gapY - p.gap / 2
        const bottomY = p.gapY + p.gap / 2
        const nearestX = Math.max(p.x, Math.min(BIRD_X, p.x + PIPE_W))
        const dx = BIRD_X - nearestX
        const hitTop = Math.hypot(dx, bird.y - Math.min(bird.y, topH)) < BIRD_R - 1
        const hitBottom = Math.hypot(dx, bird.y - Math.max(bird.y, bottomY)) < BIRD_R - 1
        if (hitTop || hitBottom) {
          endRoundRef.current()
          return
        }
        if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
          p.passed = true
          onScoreRef.current()
        }
      }
    }

    const drawCloud = (c: Cloud) => {
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
      ctx.arc(c.x + c.r * 0.9, c.y + 4, c.r * 0.75, 0, Math.PI * 2)
      ctx.arc(c.x - c.r * 0.9, c.y + 6, c.r * 0.65, 0, Math.PI * 2)
      ctx.fill()
    }

    const background = document.createElement("canvas")
    background.width = W * dpr
    background.height = H * dpr
    const bgCtx = background.getContext("2d")
    if (bgCtx) {
      bgCtx.scale(dpr, dpr)
      const sky = bgCtx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, "#2e1065")
      sky.addColorStop(0.45, "#6d28d9")
      sky.addColorStop(0.8, "#c026d3")
      sky.addColorStop(1, "#fb923c")
      bgCtx.fillStyle = sky
      bgCtx.fillRect(0, 0, W, H)

      const sunY = H - GROUND - 70
      const sun = bgCtx.createRadialGradient(W * 0.7, sunY, 6, W * 0.7, sunY, 90)
      sun.addColorStop(0, "rgba(254,243,199,0.95)")
      sun.addColorStop(0.35, "rgba(251,191,36,0.55)")
      sun.addColorStop(1, "rgba(251,146,60,0)")
      bgCtx.fillStyle = sun
      bgCtx.fillRect(0, sunY - 100, W, 200)
    }

    const draw = (alpha: number) => {
      ctx.drawImage(background, 0, 0, W, H)

      ctx.fillStyle = "rgba(255,214,235,0.22)"
      const cloudShift = modeRef.current === "paused" ? 0 : alpha
      for (const c of cloudsRef.current) {
        c.x -= c.speed * cloudShift
        drawCloud(c)
        c.x += c.speed * cloudShift
      }

      for (const p of pipesRef.current) {
        const px = p.prevX + (p.x - p.prevX) * alpha
        const topH = p.gapY - p.gap / 2
        const bottomY = p.gapY + p.gap / 2
        ctx.fillStyle = "#0d9488"
        ctx.fillRect(px, 0, PIPE_W, topH)
        ctx.fillRect(px, bottomY, PIPE_W, H - GROUND - bottomY)
        ctx.fillStyle = "#5eead4"
        ctx.fillRect(px + 6, 0, 8, topH)
        ctx.fillRect(px + 6, bottomY, 8, H - GROUND - bottomY)
        ctx.fillStyle = "#14b8a6"
        ctx.fillRect(px - 4, topH - 18, PIPE_W + 8, 18)
        ctx.fillRect(px - 4, bottomY, PIPE_W + 8, 18)
        ctx.fillStyle = "rgba(19,78,74,0.45)"
        ctx.fillRect(px - 4, topH - 4, PIPE_W + 8, 4)
        ctx.fillRect(px - 4, bottomY + 14, PIPE_W + 8, 4)
      }

      ctx.fillStyle = "#2e1065"
      ctx.fillRect(0, H - GROUND, W, GROUND)
      ctx.fillStyle = "#fbbf24"
      ctx.fillRect(0, H - GROUND, W, 5)
      ctx.fillStyle = "#4c1d95"
      const groundShift = (groundOffsetRef.current + groundSpeedRef.current * alpha) % 24
      for (let x = -24 + (24 - groundShift); x < W; x += 24) {
        ctx.fillRect(x, H - GROUND + 14, 12, 6)
      }

      const bird = birdRef.current
      const birdY = bird.prevY + (bird.y - bird.prevY) * alpha
      const birdRot = bird.prevRot + (bird.rot - bird.prevRot) * alpha
      ctx.fillStyle = "rgba(46,16,101,0.3)"
      ctx.beginPath()
      ctx.arc(BIRD_X, birdY + 3, BIRD_R, 0, Math.PI * 2)
      ctx.fill()
      ctx.save()
      ctx.translate(BIRD_X, birdY)
      ctx.rotate(birdRot)
      const body = ctx.createRadialGradient(-4, -5, 2, 0, 0, BIRD_R + 2)
      body.addColorStop(0, "#fef08a")
      body.addColorStop(1, "#f59e0b")
      ctx.fillStyle = body
      ctx.beginPath()
      ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = "#b45309"
      ctx.stroke()
      ctx.fillStyle = "#f97316"
      ctx.beginPath()
      ctx.moveTo(BIRD_R - 2, -2)
      ctx.lineTo(BIRD_R + 7, 1)
      ctx.lineTo(BIRD_R - 2, 4)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = "#4c1d95"
      ctx.font = "bold 16px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("π", 0, 1)
      ctx.restore()
    }

    let accumulator = 0
    const tick = (now: number) => {
      accumulator += Math.min(now - last, 100)
      last = now
      while (accumulator >= STEP_MS) {
        update(1)
        accumulator -= STEP_MS
      }
      draw(accumulator / STEP_MS)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handlePointer = () => {
    if (modeRef.current === "ready" || modeRef.current === "playing") flap()
  }

  const playing = mode === "ready" || mode === "playing"

  return (
    <main className="flex h-dvh w-full items-center justify-center bg-[#2e1065]">
      <div
        className="relative h-full max-h-[100dvh] w-full max-w-[min(100vw,calc(100dvh*0.6))] touch-none select-none overflow-hidden"
        style={{ aspectRatio: `${W} / ${H}` }}
        onPointerDown={handlePointer}
      >
        <canvas
          ref={canvasRef}
          className="size-full"
          role="img"
          aria-label="Flappy Pi"
        />

        {(playing || mode === "paused") && (
          <Hud
            t={t}
            score={score}
            soundOn={soundOn}
            showPause={mode === "playing"}
            onPause={pause}
            onToggleSound={toggleSound}
            toast={toast}
          />
        )}

        {mode === "ready" && (
          <p className="pointer-events-none absolute inset-x-0 top-[62%] text-center text-lg font-semibold text-white [text-shadow:0_2px_0_rgba(46,16,101,0.6)]">
            {t.tapToStart}
          </p>
        )}

        {mode === "menu" && (
          <>
            <MenuScreen
              t={t}
              username={username}
              best={best}
              lang={lang}
              onPlay={startRound}
              onToggleLang={toggleLang}
            />
            <div className="absolute right-3 top-3">
              <IconButton label={soundOn ? t.soundOff : t.soundOn} onClick={toggleSound}>
                {soundOn ? <Volume2 className="size-5" aria-hidden="true" /> : <VolumeX className="size-5" aria-hidden="true" />}
              </IconButton>
            </div>
          </>
        )}

        {mode === "paused" && <PauseScreen t={t} onResume={resume} onMenu={goMenu} />}

        {mode === "over" && (
          <GameOverScreen
            t={t}
            score={score}
            best={best}
            newRecord={newRecord}
            onReplay={startRound}
            onMenu={goMenu}
          />
        )}
      </div>
    </main>
  )
}
