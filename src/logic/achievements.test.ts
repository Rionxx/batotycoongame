import { describe, expect, it } from 'vitest'
import type { GameState } from '../types/game'
import { ACHIEVEMENT_IDS, PIG_SPECIES_IDS } from '../types/game'
import {
  caughtSpeciesCount,
  createInitialAchievements,
  evaluateAchievements,
  totalCaptures,
} from './achievements'
import type { AchievementProgress } from './achievements'

function emptyCollection(): GameState['pigCollection'] {
  return Object.fromEntries(
    PIG_SPECIES_IDS.map((id) => [id, { count: 0, firstCaughtAt: null }]),
  ) as GameState['pigCollection']
}

function progress(overrides: Partial<AchievementProgress> = {}): AchievementProgress {
  return {
    totalCoinsEarned: 0,
    buildingLevels: { feedingTrough: 0, pigPen: 0, market: 0, signboard: 0 },
    pigCollection: emptyCollection(),
    prestigeCount: 0,
    ...overrides,
  }
}

describe('totalCaptures / caughtSpeciesCount', () => {
  it('重複捕獲は回数に含み、種数には含まない', () => {
    const col = emptyCollection()
    col.pinky = { count: 3, firstCaughtAt: 0 }
    col.silver = { count: 1, firstCaughtAt: 0 }
    expect(totalCaptures(col)).toBe(4)
    expect(caughtSpeciesCount(col)).toBe(2)
  })
})

describe('evaluateAchievements', () => {
  it('初期状態では何も解除されない', () => {
    expect(evaluateAchievements(createInitialAchievements(), progress())).toEqual([])
  })

  it('累計コインのしきい値で段階的に解除される', () => {
    const unlocked = createInitialAchievements()
    expect(
      evaluateAchievements(unlocked, progress({ totalCoinsEarned: 100 })),
    ).toContain('firstCoins')
    expect(
      evaluateAchievements(unlocked, progress({ totalCoinsEarned: 100 })),
    ).not.toContain('rich1')
    expect(
      evaluateAchievements(unlocked, progress({ totalCoinsEarned: 1_000_000 })),
    ).toEqual(expect.arrayContaining(['firstCoins', 'rich1', 'rich2']))
  })

  it('施設レベルの合計・個別レベルの両方を判定する', () => {
    const unlocked = createInitialAchievements()
    const result = evaluateAchievements(
      unlocked,
      progress({
        buildingLevels: { feedingTrough: 100, pigPen: 40, market: 10, signboard: 0 },
      }),
    )
    expect(result).toEqual(
      expect.arrayContaining(['firstUpgrade', 'builder', 'tycoon', 'maxFeeding']),
    )
    expect(result).not.toContain('maxSignboard')
  })

  it('捕獲回数と図鑑種数を判定する', () => {
    const unlocked = createInitialAchievements()
    const col = emptyCollection()
    for (const id of PIG_SPECIES_IDS.slice(0, 6)) {
      col[id] = { count: 5, firstCaughtAt: 0 } // 6種 × 5回 = 30捕獲
    }
    const result = evaluateAchievements(unlocked, progress({ pigCollection: col }))
    expect(result).toEqual(
      expect.arrayContaining(['firstPig', 'pigHoarder', 'pigFriends']),
    )
    expect(result).not.toContain('pigMaster')
  })

  it('解除済みの実績は再度返さない(不可逆)', () => {
    const unlocked = createInitialAchievements()
    unlocked.firstCoins = 12345
    expect(
      evaluateAchievements(unlocked, progress({ totalCoinsEarned: 200 })),
    ).not.toContain('firstCoins')
  })

  it('転生回数の条件を判定する', () => {
    const unlocked = createInitialAchievements()
    expect(evaluateAchievements(unlocked, progress({ prestigeCount: 1 }))).toContain(
      'firstPrestige',
    )
    expect(evaluateAchievements(unlocked, progress({ prestigeCount: 1 }))).not.toContain(
      'prestige5',
    )
    expect(evaluateAchievements(unlocked, progress({ prestigeCount: 5 }))).toContain(
      'prestige5',
    )
  })

  it('全条件を満たすと全実績が解除される', () => {
    const col = emptyCollection()
    for (const id of PIG_SPECIES_IDS) {
      col[id] = { count: 3, firstCaughtAt: 0 }
    }
    const result = evaluateAchievements(
      createInitialAchievements(),
      progress({
        totalCoinsEarned: 1e9,
        buildingLevels: { feedingTrough: 100, pigPen: 100, market: 50, signboard: 12 },
        pigCollection: col,
        prestigeCount: 5,
      }),
    )
    expect(result.length).toBe(ACHIEVEMENT_IDS.length)
  })
})
