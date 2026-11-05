export type Lang = "vi" | "en"

export const dictionary = {
  vi: {
    subtitle: "Bay cùng Pi",
    play: "Chơi",
    hello: "Xin chào",
    guest: "người chơi",
    best: "Kỷ lục",
    score: "Điểm",
    tapToStart: "Chạm để bay",
    paused: "Tạm dừng",
    resume: "Tiếp tục",
    pause: "Tạm dừng",
    gameOver: "Kết thúc",
    newRecord: "Kỷ lục mới!",
    replay: "Chơi lại",
    menu: "Menu",
    soundOn: "Bật âm thanh",
    soundOff: "Tắt âm thanh",
    language: "Đổi ngôn ngữ",
    medalBronze: "Huy chương đồng",
    medalSilver: "Huy chương bạc",
    medalGold: "Huy chương vàng",
    medalNone: "Chưa có huy chương",
    medalHint: "Đồng 10 · Bạc 20 · Vàng 30",
    newMedal: "Huy chương mới",
    howTo: "Chạm màn hình hoặc nhấn Space để bay",
  },
  en: {
    subtitle: "Fly with Pi",
    play: "Play",
    hello: "Hello",
    guest: "player",
    best: "Best",
    score: "Score",
    tapToStart: "Tap to fly",
    paused: "Paused",
    resume: "Resume",
    pause: "Pause",
    gameOver: "Game over",
    newRecord: "New record!",
    replay: "Play again",
    menu: "Menu",
    soundOn: "Sound on",
    soundOff: "Sound off",
    language: "Change language",
    medalBronze: "Bronze medal",
    medalSilver: "Silver medal",
    medalGold: "Gold medal",
    medalNone: "No medal yet",
    medalHint: "Bronze 10 · Silver 20 · Gold 30",
    newMedal: "New medal",
    howTo: "Tap the screen or press Space to fly",
  },
} as const

export type Dictionary = (typeof dictionary)[Lang]

export function detectLang(): Lang {
  if (typeof navigator === "undefined") return "vi"
  return navigator.language?.toLowerCase().startsWith("vi") ? "vi" : "en"
}
