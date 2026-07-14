import { describe, expect, it } from 'vitest'
import { OFFLINE_CAP_SECONDS } from './constants'
import { calculateEarnedCoins, calculateOfflineProgress, clampCoins } from './tick'

describe('clampCoins', () => {
  it('通常の値はそのまま返す', () => {
    expect(clampCoins(123.45)).toBe(123.45)
    expect(clampCoins(0)).toBe(0)
  })

  it('MAX_SAFE_INTEGER を超える値はクリップする', () => {
    expect(clampCoins(Number.MAX_SAFE_INTEGER + 1000)).toBe(Number.MAX_SAFE_INTEGER)
    expect(clampCoins(Infinity)).toBe(Number.MAX_SAFE_INTEGER)
  })
})

describe('calculateEarnedCoins', () => {
  it('レート × 経過秒数を返す', () => {
    expect(calculateEarnedCoins(10, 5)).toBe(50)
    expect(calculateEarnedCoins(1.5, 2)).toBe(3)
  })

  it('経過時間0以下(時計の巻き戻し等)は0を返す', () => {
    expect(calculateEarnedCoins(10, 0)).toBe(0)
    expect(calculateEarnedCoins(10, -100)).toBe(0)
  })

  it('極端に長い放置でも MAX_SAFE_INTEGER を超えない', () => {
    expect(calculateEarnedCoins(Number.MAX_SAFE_INTEGER, 1e9)).toBe(Number.MAX_SAFE_INTEGER)
  })
})

describe('calculateOfflineProgress', () => {
  const T0 = 1_700_000_000_000

  it('上限未満の離席は全額精算され capped=false', () => {
    const report = calculateOfflineProgress(T0, T0 + 600 * 1000, 2)
    expect(report.coinsEarned).toBe(1200)
    expect(report.elapsedSeconds).toBe(600)
    expect(report.capped).toBe(false)
  })

  it('2時間を超えた離席は2時間分にクリップされ capped=true', () => {
    const tenHoursMs = 10 * 60 * 60 * 1000
    const report = calculateOfflineProgress(T0, T0 + tenHoursMs, 3)
    expect(report.elapsedSeconds).toBe(OFFLINE_CAP_SECONDS)
    expect(report.coinsEarned).toBe(3 * OFFLINE_CAP_SECONDS)
    expect(report.capped).toBe(true)
  })

  it('ちょうど上限ぴったりでは capped=false', () => {
    const report = calculateOfflineProgress(T0, T0 + OFFLINE_CAP_SECONDS * 1000, 1)
    expect(report.elapsedSeconds).toBe(OFFLINE_CAP_SECONDS)
    expect(report.capped).toBe(false)
  })

  it('未来の lastActiveAt(時計の巻き戻し)では0コイン', () => {
    const report = calculateOfflineProgress(T0 + 10_000, T0, 5)
    expect(report.coinsEarned).toBe(0)
    expect(report.elapsedSeconds).toBe(0)
    expect(report.capped).toBe(false)
  })
})
