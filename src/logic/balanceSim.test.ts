/**
 * バランス検証用のペーシングシミュレーション。
 * 「毎秒、買える中で最も効率の良い施設を買う」貪欲プレイを模して、
 * 成長ペースが docs/balance-notes.md に記した目標レンジに収まることを回帰テストする。
 * 豚はランダム性が強いためここでは扱わない(期待値の検証のみ)。
 */
import { describe, expect, it } from 'vitest'
import type { GameState } from '../types/game'
import { BUILDING_IDS, PIG_SPECIES_IDS } from '../types/game'
import { BUILDINGS } from './constants'
import { calculateCoinsPerSecond, calculateUpgradeCost } from './upgrade'

interface SimState {
  coins: number
  levels: GameState['buildingLevels']
}

function emptyCollection(): GameState['pigCollection'] {
  return Object.fromEntries(
    PIG_SPECIES_IDS.map((id) => [id, { count: 0, firstCaughtAt: null }]),
  ) as GameState['pigCollection']
}

/** 「レート上昇量 ÷ コスト」が最大の施設を買う貪欲プレイを1秒刻みで回す */
function simulateGreedyPlay(totalSeconds: number): {
  rateAt: (second: number) => number
  finalLevels: GameState['buildingLevels']
} {
  const collection = emptyCollection()
  const state: SimState = {
    coins: 0,
    levels: { feedingTrough: 0, pigPen: 0, market: 0, signboard: 0 },
  }
  const rateHistory: number[] = []

  for (let t = 0; t < totalSeconds; t++) {
    const rate = calculateCoinsPerSecond(state.levels, collection)
    rateHistory.push(rate)
    state.coins += rate

    // 買える施設の中からレート効率が最良のものを繰り返し購入する
    for (;;) {
      let bestId: (typeof BUILDING_IDS)[number] | null = null
      let bestEfficiency = 0
      for (const id of BUILDING_IDS) {
        if (id === 'signboard') continue // レートに影響しないため貪欲対象外
        const cost = calculateUpgradeCost(id, state.levels[id])
        if (cost === null || cost > state.coins) continue
        const nextLevels = { ...state.levels, [id]: state.levels[id] + 1 }
        const gain = calculateCoinsPerSecond(nextLevels, collection) - rate
        const efficiency = gain / cost
        if (efficiency > bestEfficiency) {
          bestEfficiency = efficiency
          bestId = id
        }
      }
      if (bestId === null) break
      const cost = calculateUpgradeCost(bestId, state.levels[bestId])!
      state.coins -= cost
      state.levels = { ...state.levels, [bestId]: state.levels[bestId] + 1 }
    }
  }

  return {
    rateAt: (second: number) => rateHistory[Math.min(second, rateHistory.length - 1)],
    finalLevels: state.levels,
  }
}

describe('成長ペーシング(貪欲プレイのシミュレーション)', () => {
  const sim = simulateGreedyPlay(30 * 60) // 30分

  it('最初のアップグレードは開始から数秒〜数十秒で手が届く(えさ場=10コイン)', () => {
    expect(BUILDINGS.feedingTrough.baseCost).toBeLessThanOrEqual(15)
  })

  it('5分プレイでレートが初期値の10倍以上になる(序盤の成長実感)', () => {
    expect(sim.rateAt(5 * 60)).toBeGreaterThanOrEqual(10)
  })

  it('30分プレイでレート100/秒以上に到達する(中盤の伸び)', () => {
    expect(sim.rateAt(30 * 60 - 1)).toBeGreaterThanOrEqual(100)
  })

  it('30分プレイでもレートが暴騰しすぎない(上限3000/秒: 数値インフレ防止)', () => {
    expect(sim.rateAt(30 * 60 - 1)).toBeLessThanOrEqual(3000)
  })

  it('30分時点で複数の施設に投資が分散している(単一施設一択にならない)', () => {
    const invested = Object.entries(sim.finalLevels).filter(
      ([id, lv]) => id !== 'signboard' && lv > 0,
    )
    expect(invested.length).toBeGreaterThanOrEqual(2)
  })
})

describe('数値上限の安全性', () => {
  it('全施設が最大レベルでもコスト・レートが安全な整数範囲に収まる', () => {
    const maxLevels = Object.fromEntries(
      BUILDING_IDS.map((id) => [id, BUILDINGS[id].maxLevel]),
    ) as GameState['buildingLevels']
    const fullCollection = Object.fromEntries(
      PIG_SPECIES_IDS.map((id) => [id, { count: 1, firstCaughtAt: 0 }]),
    ) as GameState['pigCollection']

    const rate = calculateCoinsPerSecond(maxLevels, fullCollection)
    expect(Number.isFinite(rate)).toBe(true)
    expect(rate).toBeLessThan(Number.MAX_SAFE_INTEGER)

    for (const id of BUILDING_IDS) {
      const lastCost = calculateUpgradeCost(id, BUILDINGS[id].maxLevel - 1)
      expect(lastCost).not.toBeNull()
      expect(lastCost!).toBeLessThan(Number.MAX_SAFE_INTEGER)
    }
  })
})
