"use client"

import type { ReactNode } from "react"
import { Languages, Pause, Play, RotateCcw, Home, Volume2, VolumeX } from "lucide-react"
import type { Dictionary, Lang } from "@/lib/i18n"

export type Medal = "bronze" | "silver" | "gold" | null

export const MEDAL_THRESHOLDS: { medal: Exclude<Medal, null>; score: number }[] = [
  { medal: "gold", score: 30 },
  { medal: "silver", score: 20 },
  { medal: "bronze", score: 10 },
]

export function medalForScore(score: number): Medal {
  return MEDAL_THRESHOLDS.find((m) => score >= m.score)?.medal ?? null
}

const medalStyles: Record<Exclude<Medal, null>, string> = {
  bronze: "bg-[#b45309] border-[#fcd9a8] text-[#fff7ed]",
  silver: "bg-[#94a3b8] border-[#f1f5f9] text-white",
  gold: "bg-[#fbbf24] border-[#fff3c4] text-[#3b0764]",
}

export function MedalBadge({ medal, size = "md" }: { medal: Medal; size?: "sm" | "md" }) {
  const dimension = size === "md" ? "size-16 text-2xl" : "size-9 text-base"
  if (!medal) {
    return (
      <span
        className={`flex ${dimension} items-center justify-center rounded-full border-2 border-dashed border-white/30 text-white/30`}
        aria-hidden="true"
      >
        ?
      </span>
    )
  }
  return (
    <span
      className={`flex ${dimension} items-center justify-center rounded-full border-4 font-bold shadow-lg ${medalStyles[medal]}`}
      aria-hidden="true"
    >
      π
    </span>
  )
}

function medalLabel(t: Dictionary, medal: Medal) {
  if (medal === "gold") return t.medalGold
  if (medal === "silver") return t.medalSilver
  if (medal === "bronze") return t.medalBronze
  return t.medalNone
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#fbbf24] text-lg font-bold text-[#3b0764] shadow-lg transition active:scale-95"
    >
      {children}
    </button>
  )
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 font-semibold text-white transition active:scale-95"
    >
      {children}
    </button>
  )
}

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="flex size-11 items-center justify-center rounded-full bg-[#2e1065]/70 text-white backdrop-blur transition active:scale-90"
    >
      {children}
    </button>
  )
}

interface MenuProps {
  t: Dictionary
  username: string | null
  best: number
  lang: Lang
  onPlay: () => void
  onToggleLang: () => void
}

export function MenuScreen({ t, username, best, lang, onPlay, onToggleLang }: MenuProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#2e1065]/80 px-8 text-white backdrop-blur-[2px]">
      <div className="flex size-24 items-center justify-center rounded-full border-4 border-[#fbbf24] bg-[#5b21b6] text-5xl font-bold text-[#fbbf24] shadow-2xl">
        π
      </div>
      <div className="text-center">
        <h1 className="text-balance text-4xl font-bold tracking-tight">Flappy Pi</h1>
        <p className="mt-1 text-white/70">{t.subtitle}</p>
      </div>
      <p className="text-center text-pretty text-white/90">
        {t.hello}, <span className="font-semibold text-[#fbbf24]">{username ?? t.guest}</span>
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <PrimaryButton onClick={onPlay}>
          <Play className="size-5 fill-current" aria-hidden="true" />
          {t.play}
        </PrimaryButton>
        <SecondaryButton onClick={onToggleLang}>
          <Languages className="size-5" aria-hidden="true" />
          {lang === "vi" ? "Tiếng Việt · EN" : "English · VI"}
        </SecondaryButton>
      </div>
      <div className="flex items-center gap-3 text-sm text-white/70">
        <MedalBadge medal={medalForScore(best)} size="sm" />
        <span>
          {t.best}: <span className="font-semibold text-white">{best}</span>
        </span>
      </div>
      <p className="text-center text-sm text-white/60">{t.howTo}</p>
    </div>
  )
}

export function PauseScreen({
  t,
  onResume,
  onMenu,
}: {
  t: Dictionary
  onResume: () => void
  onMenu: () => void
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#2e1065]/80 px-8 text-white backdrop-blur-[2px]">
      <h2 className="text-3xl font-bold">{t.paused}</h2>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <PrimaryButton onClick={onResume}>
          <Play className="size-5 fill-current" aria-hidden="true" />
          {t.resume}
        </PrimaryButton>
        <SecondaryButton onClick={onMenu}>
          <Home className="size-5" aria-hidden="true" />
          {t.menu}
        </SecondaryButton>
      </div>
    </div>
  )
}

interface GameOverProps {
  t: Dictionary
  score: number
  best: number
  newRecord: boolean
  onReplay: () => void
  onMenu: () => void
}

export function GameOverScreen({ t, score, best, newRecord, onReplay, onMenu }: GameOverProps) {
  const medal = medalForScore(score)
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#2e1065]/85 px-8 text-white backdrop-blur-[2px]">
      <h2 className="text-3xl font-bold">{t.gameOver}</h2>
      {newRecord && (
        <p className="rounded-full bg-[#fbbf24] px-4 py-1 text-sm font-bold text-[#3b0764]" role="status">
          {t.newRecord}
        </p>
      )}
      <div className="flex w-full max-w-xs items-center justify-between rounded-3xl border border-white/20 bg-white/10 p-5">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">{t.score}</p>
            <p className="text-4xl font-bold leading-none">{score}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">{t.best}</p>
            <p className="text-xl font-semibold leading-none">{best}</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <MedalBadge medal={medal} />
          <p className="max-w-24 text-xs text-white/80">{medalLabel(t, medal)}</p>
        </div>
      </div>
      <p className="text-xs text-white/50">{t.medalHint}</p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <PrimaryButton onClick={onReplay}>
          <RotateCcw className="size-5" aria-hidden="true" />
          {t.replay}
        </PrimaryButton>
        <SecondaryButton onClick={onMenu}>
          <Home className="size-5" aria-hidden="true" />
          {t.menu}
        </SecondaryButton>
      </div>
    </div>
  )
}

interface HudProps {
  t: Dictionary
  score: number
  soundOn: boolean
  showPause: boolean
  onPause: () => void
  onToggleSound: () => void
  toast: string | null
}

export function Hud({ t, score, soundOn, showPause, onPause, onToggleSound, toast }: HudProps) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <div className="pointer-events-auto">
          {showPause ? (
            <IconButton label={t.pause} onClick={onPause}>
              <Pause className="size-5 fill-current" aria-hidden="true" />
            </IconButton>
          ) : (
            <span className="block size-11" />
          )}
        </div>
        <p
          className="text-5xl font-bold text-white [text-shadow:0_3px_0_rgba(46,16,101,0.6)]"
          aria-live="polite"
          aria-label={`${t.score}: ${score}`}
        >
          {score}
        </p>
        <div className="pointer-events-auto">
          <IconButton label={soundOn ? t.soundOff : t.soundOn} onClick={onToggleSound}>
            {soundOn ? (
              <Volume2 className="size-5" aria-hidden="true" />
            ) : (
              <VolumeX className="size-5" aria-hidden="true" />
            )}
          </IconButton>
        </div>
      </div>
      {toast && (
        <div
          className="pointer-events-none absolute inset-x-0 top-20 flex justify-center"
          role="status"
        >
          <span className="rounded-full bg-[#fbbf24] px-4 py-1.5 text-sm font-bold text-[#3b0764] shadow-lg">
            {toast}
          </span>
        </div>
      )}
    </>
  )
}
