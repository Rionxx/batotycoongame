/**
 * 豚の出現抽選・捕獲判定の純粋関数群。
 * 乱数は `rng: () => number`(0以上1未満)を引数で注入し、テストで固定できるようにする。
 */
import type {
  ActivePig,
  GameState,
  PigRarity,
  PigSpeciesId,
} from '../types/game'
import { PIG_SPECIES_IDS } from '../types/game'
import {
  PIG_CATALOG,
  PIG_DUPLICATE_COIN_SECONDS,
  PIG_LIFETIME_SECONDS,
  PIG_RARITY_WEIGHTS,
} from './constants'

export type Rng = () => number

/** 出現判定。chance は calculatePigSpawnChance の結果を渡す */
export function shouldSpawnPig(chance: number, rng: Rng): boolean {
  return rng() < chance
}

/** レア度を重み(70/25/5%)で抽選する */
export function rollRarity(rng: Rng): PigRarity {
  const r = rng()
  let cumulative = 0
  for (const rarity of ['common', 'rare', 'epic'] as const) {
    cumulative += PIG_RARITY_WEIGHTS[rarity]
    if (r < cumulative) return rarity
  }
  // 浮動小数の端数で r が合計をわずかに超えた場合のフォールバック
  return 'epic'
}

/** レア度内の種を均等抽選する */
export function rollSpecies(rarity: PigRarity, rng: Rng): PigSpeciesId {
  const candidates = PIG_SPECIES_IDS.filter((id) => PIG_CATALOG[id].rarity === rarity)
  const index = Math.min(Math.floor(rng() * candidates.length), candidates.length - 1)
  return candidates[index]
}

/** 出現する豚を1匹生成する(レア度抽選 → 種抽選 → 位置決め) */
export function spawnPig(nowMs: number, rng: Rng): ActivePig {
  const rarity = rollRarity(rng)
  const speciesId = rollSpecies(rarity, rng)
  return {
    speciesId,
    spawnedAt: nowMs,
    expiresAt: nowMs + PIG_LIFETIME_SECONDS * 1000,
    x: rng(),
    y: rng(),
  }
}

/** 出現中の豚が消滅時刻を過ぎたか */
export function isPigExpired(pig: ActivePig, nowMs: number): boolean {
  return nowMs >= pig.expiresAt
}

export interface CaptureResult {
  /** 更新後の図鑑 */
  pigCollection: GameState['pigCollection']
  /** 新種(図鑑初登録)だったか */
  isNew: boolean
  /** 重複捕獲によるコイン変換額(新種なら0) */
  coinsAwarded: number
}

/**
 * 捕獲の解決。新種なら図鑑に登録、重複なら現在レートの規定秒数分のコインに変換する。
 * 引数の pigCollection は変更せず、新しいオブジェクトを返す。
 */
export function resolveCapture(
  pigCollection: GameState['pigCollection'],
  speciesId: PigSpeciesId,
  ratePerSecond: number,
  nowMs: number,
): CaptureResult {
  const entry = pigCollection[speciesId]
  const isNew = entry.count === 0
  const updated: GameState['pigCollection'] = {
    ...pigCollection,
    [speciesId]: {
      count: entry.count + 1,
      firstCaughtAt: entry.firstCaughtAt ?? nowMs,
    },
  }
  const coinsAwarded = isNew
    ? 0
    : Math.floor(
        ratePerSecond * PIG_DUPLICATE_COIN_SECONDS[PIG_CATALOG[speciesId].rarity],
      )
  return { pigCollection: updated, isNew, coinsAwarded }
}

/** 図鑑コンプリート(全12種捕獲済み)か */
export function isCollectionComplete(pigCollection: GameState['pigCollection']): boolean {
  return PIG_SPECIES_IDS.every((id) => pigCollection[id].count > 0)
}
