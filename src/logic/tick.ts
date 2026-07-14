/**
 * 経過時間から資源加算量を計算する純粋関数群。
 * タイマーの発火回数に依存せず、「前回時刻と現在時刻の差分」だけで計算する
 * (タブ非アクティブ時のrequestAnimationFrame間引き対策)。
 */
import type { OfflineReport } from '../types/game'
import { OFFLINE_CAP_SECONDS } from './constants'

/** コイン残高の上限クリップ。長時間放置でも安全な整数の範囲に収める */
export function clampCoins(value: number): number {
  if (!Number.isFinite(value)) return Number.MAX_SAFE_INTEGER
  return Math.min(value, Number.MAX_SAFE_INTEGER)
}

/**
 * 経過秒数ぶんの獲得コイン。
 * 負の経過時間(端末の時計巻き戻し等)は 0 として扱う。
 */
export function calculateEarnedCoins(ratePerSecond: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 0
  return clampCoins(ratePerSecond * elapsedSeconds)
}

/**
 * オフライン収集の精算。経過時間を上限(2時間)でクリップして獲得コインを計算する。
 * 復帰時モーダルの表示に使う OfflineReport を返す。
 */
export function calculateOfflineProgress(
  lastActiveAtMs: number,
  nowMs: number,
  ratePerSecond: number,
): OfflineReport {
  const rawElapsedSeconds = Math.max(0, (nowMs - lastActiveAtMs) / 1000)
  const capped = rawElapsedSeconds > OFFLINE_CAP_SECONDS
  const elapsedSeconds = capped ? OFFLINE_CAP_SECONDS : rawElapsedSeconds
  return {
    coinsEarned: calculateEarnedCoins(ratePerSecond, elapsedSeconds),
    elapsedSeconds,
    capped,
  }
}
