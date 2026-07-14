import { describe, expect, it } from 'vitest'
import type { GameState } from '../types/game'
import { PIG_SPECIES_IDS } from '../types/game'
import { PIG_CATALOG, PIG_LIFETIME_SECONDS } from './constants'
import {
  isCollectionComplete,
  isPigExpired,
  resolveCapture,
  rollRarity,
  rollSpecies,
  shouldSpawnPig,
  spawnPig,
} from './pigCollection'

function emptyCollection(): GameState['pigCollection'] {
  return Object.fromEntries(
    PIG_SPECIES_IDS.map((id) => [id, { count: 0, firstCaughtAt: null }]),
  ) as GameState['pigCollection']
}

/** 指定した値を順番に返す固定乱数 */
function fixedRng(...values: number[]): () => number {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

describe('shouldSpawnPig', () => {
  it('乱数が確率未満なら出現する', () => {
    expect(shouldSpawnPig(0.2, fixedRng(0.19))).toBe(true)
    expect(shouldSpawnPig(0.2, fixedRng(0.2))).toBe(false)
    expect(shouldSpawnPig(0.2, fixedRng(0.99))).toBe(false)
  })
})

describe('rollRarity', () => {
  it('累積確率の境界に従う(70/25/5%)', () => {
    expect(rollRarity(fixedRng(0.0))).toBe('common')
    expect(rollRarity(fixedRng(0.699))).toBe('common')
    expect(rollRarity(fixedRng(0.7))).toBe('rare')
    expect(rollRarity(fixedRng(0.949))).toBe('rare')
    expect(rollRarity(fixedRng(0.95))).toBe('epic')
    expect(rollRarity(fixedRng(0.999))).toBe('epic')
  })
})

describe('rollSpecies', () => {
  it('レア度に属する種だけが選ばれる', () => {
    for (const rarity of ['common', 'rare', 'epic'] as const) {
      for (const r of [0, 0.3, 0.5, 0.99]) {
        const id = rollSpecies(rarity, fixedRng(r))
        expect(PIG_CATALOG[id].rarity).toBe(rarity)
      }
    }
  })

  it('乱数の全域で候補が均等に選ばれる(コモン6種)', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 6; i++) {
      seen.add(rollSpecies('common', fixedRng(i / 6 + 0.001)))
    }
    expect(seen.size).toBe(6)
  })
})

describe('spawnPig', () => {
  it('消滅時刻は出現から15秒後、座標は0〜1の範囲', () => {
    const now = 1_700_000_000_000
    const pig = spawnPig(now, fixedRng(0.1, 0.5, 0.25, 0.75))
    expect(pig.spawnedAt).toBe(now)
    expect(pig.expiresAt).toBe(now + PIG_LIFETIME_SECONDS * 1000)
    expect(pig.x).toBeGreaterThanOrEqual(0)
    expect(pig.x).toBeLessThan(1)
    expect(pig.y).toBeGreaterThanOrEqual(0)
    expect(pig.y).toBeLessThan(1)
  })
})

describe('isPigExpired', () => {
  it('expiresAt 以降は消滅扱い', () => {
    const now = 1_700_000_000_000
    const pig = spawnPig(now, fixedRng(0.1, 0.5, 0.5, 0.5))
    expect(isPigExpired(pig, now)).toBe(false)
    expect(isPigExpired(pig, pig.expiresAt - 1)).toBe(false)
    expect(isPigExpired(pig, pig.expiresAt)).toBe(true)
  })
})

describe('resolveCapture', () => {
  const NOW = 1_700_000_000_000

  it('新種は図鑑に登録され、コイン変換は0', () => {
    const result = resolveCapture(emptyCollection(), 'pinky', 100, NOW)
    expect(result.isNew).toBe(true)
    expect(result.coinsAwarded).toBe(0)
    expect(result.pigCollection.pinky.count).toBe(1)
    expect(result.pigCollection.pinky.firstCaughtAt).toBe(NOW)
  })

  it('重複捕獲はレア度別の秒数分のコインに変換される', () => {
    const col = emptyCollection()
    col.pinky = { count: 1, firstCaughtAt: NOW - 1000 } // common: 30秒分
    col.silver = { count: 2, firstCaughtAt: NOW - 1000 } // rare: 120秒分
    col.golden = { count: 1, firstCaughtAt: NOW - 1000 } // epic: 600秒分

    expect(resolveCapture(col, 'pinky', 10, NOW).coinsAwarded).toBe(300)
    expect(resolveCapture(col, 'silver', 10, NOW).coinsAwarded).toBe(1200)
    expect(resolveCapture(col, 'golden', 10, NOW).coinsAwarded).toBe(6000)
  })

  it('重複捕獲でも firstCaughtAt は変わらない', () => {
    const col = emptyCollection()
    col.pinky = { count: 1, firstCaughtAt: 12345 }
    const result = resolveCapture(col, 'pinky', 10, NOW)
    expect(result.pigCollection.pinky.count).toBe(2)
    expect(result.pigCollection.pinky.firstCaughtAt).toBe(12345)
  })

  it('元の図鑑オブジェクトを破壊しない(純粋関数)', () => {
    const col = emptyCollection()
    resolveCapture(col, 'pinky', 10, NOW)
    expect(col.pinky.count).toBe(0)
  })
})

describe('isCollectionComplete', () => {
  it('全12種捕獲済みのときだけ true', () => {
    const col = emptyCollection()
    expect(isCollectionComplete(col)).toBe(false)
    for (const id of PIG_SPECIES_IDS) {
      col[id] = { count: 1, firstCaughtAt: 0 }
    }
    expect(isCollectionComplete(col)).toBe(true)
  })

  it('11種では false', () => {
    const col = emptyCollection()
    for (const id of PIG_SPECIES_IDS.slice(0, 11)) {
      col[id] = { count: 1, firstCaughtAt: 0 }
    }
    expect(isCollectionComplete(col)).toBe(false)
  })
})
