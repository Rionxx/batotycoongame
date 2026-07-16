import { describe, expect, it } from 'vitest'
import type { GameState } from '../types/game'
import { PIG_SPECIES_IDS } from '../types/game'
import { createInitialAchievements } from './achievements'
import { applyPrestige, calculateMedalsGain, canPrestige, medalMultiplier } from './prestige'
import { calculateCoinsPerSecond } from './upgrade'

const T0 = 1_700_000_000_000

function sampleState(): GameState {
  const pigCollection = Object.fromEntries(
    PIG_SPECIES_IDS.map((id) => [id, { count: 0, firstCaughtAt: null }]),
  ) as GameState['pigCollection']
  pigCollection.pinky = { count: 2, firstCaughtAt: 111 }
  const achievements = createInitialAchievements()
  achievements.firstCoins = 222
  return {
    coins: 5000,
    totalCoinsEarned: 1_500_000,
    runCoinsEarned: 900_000,
    buildingLevels: { feedingTrough: 40, pigPen: 20, market: 8, signboard: 5 },
    pigCollection,
    lastActiveAt: T0 - 1000,
    lastSpawnCheckAt: T0 - 1000,
    achievements,
    prestige: { medals: 2, count: 1 },
  }
}

describe('calculateMedalsGain', () => {
  it('floor(√(周回コイン ÷ 100,000)) に従う', () => {
    expect(calculateMedalsGain(0)).toBe(0)
    expect(calculateMedalsGain(99_999)).toBe(0)
    expect(calculateMedalsGain(100_000)).toBe(1)
    expect(calculateMedalsGain(400_000)).toBe(2)
    expect(calculateMedalsGain(900_000)).toBe(3)
    expect(calculateMedalsGain(1_000_000)).toBe(3) // √10 = 3.16 → 3
    expect(calculateMedalsGain(10_000_000)).toBe(10)
  })

  it('負の値では0(時計巻き戻し等の防御)', () => {
    expect(calculateMedalsGain(-100)).toBe(0)
  })
})

describe('canPrestige', () => {
  it('メダル1枚以上の獲得見込みがあるときだけ true', () => {
    expect(canPrestige(99_999)).toBe(false)
    expect(canPrestige(100_000)).toBe(true)
  })
})

describe('medalMultiplier', () => {
  it('1枚につき+5%', () => {
    expect(medalMultiplier(0)).toBe(1)
    expect(medalMultiplier(3)).toBeCloseTo(1.15)
    expect(medalMultiplier(20)).toBeCloseTo(2)
  })

  it('レート計算式の末尾に乗算で効く', () => {
    const levels = { feedingTrough: 9, pigPen: 0, market: 0, signboard: 0 }
    const col = sampleState().pigCollection
    const base = calculateCoinsPerSecond(levels, col, 0)
    expect(calculateCoinsPerSecond(levels, col, 4)).toBeCloseTo(base * 1.2)
  })
})

describe('applyPrestige', () => {
  it('リセット対象と引き継ぎ対象が仕様どおり', () => {
    const before = sampleState()
    const after = applyPrestige(before, T0)

    // リセットされるもの
    expect(after.coins).toBe(0)
    expect(after.runCoinsEarned).toBe(0)
    expect(after.buildingLevels).toEqual({
      feedingTrough: 0,
      pigPen: 0,
      market: 0,
      signboard: 0,
    })
    expect(after.lastActiveAt).toBe(T0)
    expect(after.lastSpawnCheckAt).toBe(T0)

    // 引き継がれるもの
    expect(after.pigCollection.pinky.count).toBe(2)
    expect(after.achievements.firstCoins).toBe(222)
    expect(after.totalCoinsEarned).toBe(1_500_000)

    // メダル加算(周回90万 → +3枚)と転生回数
    expect(after.prestige.medals).toBe(5)
    expect(after.prestige.count).toBe(2)
  })

  it('元のstateを破壊しない(純粋関数)', () => {
    const before = sampleState()
    applyPrestige(before, T0)
    expect(before.coins).toBe(5000)
    expect(before.prestige.medals).toBe(2)
    expect(before.buildingLevels.feedingTrough).toBe(40)
  })
})
