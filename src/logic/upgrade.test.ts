import { describe, expect, it } from 'vitest'
import type { GameState } from '../types/game'
import { PIG_SPECIES_IDS } from '../types/game'
import { BUILDINGS } from './constants'
import {
  calculateCoinsPerSecond,
  calculatePigBonus,
  calculatePigSpawnChance,
  calculateUpgradeCost,
  canUpgrade,
} from './upgrade'

function emptyCollection(): GameState['pigCollection'] {
  return Object.fromEntries(
    PIG_SPECIES_IDS.map((id) => [id, { count: 0, firstCaughtAt: null }]),
  ) as GameState['pigCollection']
}

function levels(
  overrides: Partial<GameState['buildingLevels']> = {},
): GameState['buildingLevels'] {
  return { feedingTrough: 0, pigPen: 0, market: 0, signboard: 0, ...overrides }
}

describe('calculateUpgradeCost', () => {
  it('レベル0では初期コストそのもの', () => {
    expect(calculateUpgradeCost('feedingTrough', 0)).toBe(10)
    expect(calculateUpgradeCost('pigPen', 0)).toBe(100)
    expect(calculateUpgradeCost('market', 0)).toBe(500)
    expect(calculateUpgradeCost('signboard', 0)).toBe(250)
  })

  it('指数曲線 floor(base × growth^level) に従う', () => {
    expect(calculateUpgradeCost('feedingTrough', 1)).toBe(Math.floor(10 * 1.15))
    expect(calculateUpgradeCost('feedingTrough', 10)).toBe(
      Math.floor(10 * Math.pow(1.15, 10)),
    )
    expect(calculateUpgradeCost('market', 5)).toBe(Math.floor(500 * Math.pow(1.25, 5)))
  })

  it('コストは単調増加する', () => {
    for (let lv = 0; lv < 99; lv++) {
      const a = calculateUpgradeCost('feedingTrough', lv)
      const b = calculateUpgradeCost('feedingTrough', lv + 1)
      expect(a).not.toBeNull()
      expect(b).not.toBeNull()
      expect(b!).toBeGreaterThanOrEqual(a!)
    }
  })

  it('最大レベルに達したら null', () => {
    expect(calculateUpgradeCost('feedingTrough', BUILDINGS.feedingTrough.maxLevel)).toBeNull()
    expect(calculateUpgradeCost('signboard', BUILDINGS.signboard.maxLevel)).toBeNull()
  })

  it('最大レベル付近でも安全な整数の範囲に収まる', () => {
    const cost = calculateUpgradeCost('pigPen', BUILDINGS.pigPen.maxLevel - 1)
    expect(cost).not.toBeNull()
    expect(cost!).toBeLessThan(Number.MAX_SAFE_INTEGER)
    expect(Number.isInteger(cost)).toBe(true)
  })
})

describe('canUpgrade', () => {
  it('コインが足りていれば true、足りなければ false', () => {
    expect(canUpgrade('feedingTrough', 0, 10)).toBe(true)
    expect(canUpgrade('feedingTrough', 0, 9)).toBe(false)
  })

  it('最大レベルでは所持金に関わらず false', () => {
    expect(canUpgrade('signboard', BUILDINGS.signboard.maxLevel, Infinity)).toBe(false)
  })
})

describe('calculatePigBonus', () => {
  it('未捕獲なら 0', () => {
    expect(calculatePigBonus(emptyCollection())).toBe(0)
  })

  it('レア度ごとのボーナスが加算される(コモン+1% レア+3% エピック+10%)', () => {
    const col = emptyCollection()
    col.pinky = { count: 1, firstCaughtAt: 0 } // common
    col.silver = { count: 1, firstCaughtAt: 0 } // rare
    col.golden = { count: 1, firstCaughtAt: 0 } // epic
    expect(calculatePigBonus(col)).toBeCloseTo(0.01 + 0.03 + 0.1)
  })

  it('重複捕獲(count>1)でもボーナスは1匹ぶんのみ', () => {
    const col = emptyCollection()
    col.pinky = { count: 5, firstCaughtAt: 0 }
    expect(calculatePigBonus(col)).toBeCloseTo(0.01)
  })

  it('全12種コンプリートで +38%', () => {
    const col = emptyCollection()
    for (const id of PIG_SPECIES_IDS) {
      col[id] = { count: 1, firstCaughtAt: 0 }
    }
    expect(calculatePigBonus(col)).toBeCloseTo(0.38)
  })
})

describe('calculateCoinsPerSecond', () => {
  it('初期状態では基本レート 1/秒', () => {
    expect(calculateCoinsPerSecond(levels(), emptyCollection())).toBe(1)
  })

  it('えさ場 +1/秒、豚小屋 +5/秒 が加算される', () => {
    expect(calculateCoinsPerSecond(levels({ feedingTrough: 3 }), emptyCollection())).toBe(4)
    expect(calculateCoinsPerSecond(levels({ pigPen: 2 }), emptyCollection())).toBe(11)
    expect(
      calculateCoinsPerSecond(levels({ feedingTrough: 3, pigPen: 2 }), emptyCollection()),
    ).toBe(14)
  })

  it('市場は全体に ×(1 + 0.1×Lv) の倍率をかける', () => {
    expect(
      calculateCoinsPerSecond(levels({ feedingTrough: 9, market: 2 }), emptyCollection()),
    ).toBeCloseTo(10 * 1.2)
  })

  it('豚ボーナスは末尾の乗算として効く', () => {
    const col = emptyCollection()
    col.golden = { count: 1, firstCaughtAt: 0 } // +10%
    expect(calculateCoinsPerSecond(levels({ feedingTrough: 9 }), col)).toBeCloseTo(10 * 1.1)
  })

  it('看板レベルは生成レートに影響しない', () => {
    expect(calculateCoinsPerSecond(levels({ signboard: 12 }), emptyCollection())).toBe(1)
  })
})

describe('calculatePigSpawnChance', () => {
  it('基本確率は20%', () => {
    expect(calculatePigSpawnChance(levels())).toBeCloseTo(0.2)
  })

  it('看板1レベルにつき +5%', () => {
    expect(calculatePigSpawnChance(levels({ signboard: 4 }))).toBeCloseTo(0.4)
  })

  it('上限80%でクリップされる', () => {
    expect(calculatePigSpawnChance(levels({ signboard: 12 }))).toBeCloseTo(0.8)
    expect(calculatePigSpawnChance(levels({ signboard: 100 }))).toBeCloseTo(0.8)
  })
})
