/**
 * ゲームの全数値パラメータとマスタデータの集約先。
 * バランス調整(フェーズ5)はこのファイルの変更だけで完結させる。
 * 出典: docs/requirements.md
 */
import type { BuildingId, BuildingSpec, PigRarity, PigSpecies, PigSpeciesId } from '../types/game'

// ---- 資源 ----

/** 施設レベル0での基本自動生成レート(コイン/秒) */
export const BASE_COINS_PER_SECOND = 1

/** 手動タップ1回あたりの獲得コイン */
export const COINS_PER_TAP = 1

/** オフライン収集の精算上限(秒)= 2時間 */
export const OFFLINE_CAP_SECONDS = 2 * 60 * 60

/** これ未満の離席では復帰モーダルを出さない(瞬間リロード対策・秒) */
export const OFFLINE_REPORT_MIN_SECONDS = 10

// ---- 施設 ----

export const BUILDINGS: Record<BuildingId, BuildingSpec> = {
  feedingTrough: {
    id: 'feedingTrough',
    name: 'えさ場',
    effectType: 'flatRate',
    effectPerLevel: 1,
    baseCost: 10,
    costGrowth: 1.15,
    maxLevel: 100,
  },
  pigPen: {
    id: 'pigPen',
    name: '豚小屋',
    effectType: 'flatRate',
    effectPerLevel: 5,
    baseCost: 100,
    costGrowth: 1.15,
    maxLevel: 100,
  },
  market: {
    id: 'market',
    name: '市場',
    effectType: 'rateMultiplier',
    effectPerLevel: 0.1,
    baseCost: 500,
    costGrowth: 1.25,
    maxLevel: 50,
  },
  signboard: {
    id: 'signboard',
    name: '看板',
    effectType: 'pigSpawnChance',
    effectPerLevel: 0.05,
    baseCost: 250,
    costGrowth: 1.2,
    maxLevel: 12,
  },
}

// ---- 豚 ----

/** 出現判定の間隔(秒) */
export const PIG_SPAWN_CHECK_INTERVAL_SECONDS = 30

/** 出現の基本確率 */
export const PIG_SPAWN_BASE_CHANCE = 0.2

/** 出現確率の上限(看板で強化しても超えない) */
export const PIG_SPAWN_MAX_CHANCE = 0.8

/** 出現した豚が消滅するまでの猶予(秒) */
export const PIG_LIFETIME_SECONDS = 15

/** レア度の抽選確率(合計1になること) */
export const PIG_RARITY_WEIGHTS: Record<PigRarity, number> = {
  common: 0.7,
  rare: 0.25,
  epic: 0.05,
}

/** 図鑑登録1匹あたりの生成ボーナス(レア度別) */
export const PIG_RATE_BONUS: Record<PigRarity, number> = {
  common: 0.01,
  rare: 0.03,
  epic: 0.1,
}

/** 重複捕獲時のコイン変換額(現在の生成レートの何秒分か) */
export const PIG_DUPLICATE_COIN_SECONDS: Record<PigRarity, number> = {
  common: 30,
  rare: 120,
  epic: 600,
}

/** 豚カタログ(全12種: コモン6・レア4・エピック2) */
export const PIG_CATALOG: Record<PigSpeciesId, PigSpecies> = {
  pinky: { id: 'pinky', name: 'ピンキー', rarity: 'common' },
  spotty: { id: 'spotty', name: 'ぶちまる', rarity: 'common' },
  muddy: { id: 'muddy', name: 'どろんこ', rarity: 'common' },
  curly: { id: 'curly', name: 'くるりん', rarity: 'common' },
  sleepy: { id: 'sleepy', name: 'ねぼすけ', rarity: 'common' },
  hungry: { id: 'hungry', name: 'はらぺこ', rarity: 'common' },
  silver: { id: 'silver', name: 'シルバー', rarity: 'rare' },
  shadow: { id: 'shadow', name: 'かげまる', rarity: 'rare' },
  flower: { id: 'flower', name: 'はなこ', rarity: 'rare' },
  ninja: { id: 'ninja', name: 'にんじゃ', rarity: 'rare' },
  golden: { id: 'golden', name: 'ゴールデン', rarity: 'epic' },
  king: { id: 'king', name: 'キング', rarity: 'epic' },
}
