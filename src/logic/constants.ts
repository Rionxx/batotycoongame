/**
 * ゲームの全数値パラメータとマスタデータの集約先。
 * バランス調整(フェーズ5)はこのファイルの変更だけで完結させる。
 * 出典: docs/requirements.md
 */
import type {
  AchievementId,
  AchievementSpec,
  BuildingId,
  BuildingSpec,
  PigRarity,
  PigSpecies,
  PigSpeciesId,
} from '../types/game'

// ---- 資源 ----

/** 施設レベル0での基本自動生成レート(コイン/秒) */
export const BASE_COINS_PER_SECOND = 1

/** ゲームループのtick間隔(ms)。UIのタイマーはこれを使う */
export const TICK_INTERVAL_MS = 1000

// ---- コイン山(手動収集の置き換え・フェーズ10) ----

/** コイン山の回収額 = 現在レート × この秒数分 */
export const COIN_PICKUP_RATE_SECONDS = 8

/** 回収から再出現までの間隔(秒) */
export const COIN_PICKUP_RESPAWN_SECONDS = 20

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

// ---- プレステージ(転生) ----

/** メダル計算の除数: 獲得メダル = floor(√(周回コイン ÷ この値)) */
export const PRESTIGE_MEDAL_DIVISOR = 100_000

/** メダル1枚あたりの生成レートボーナス(+5%) */
export const MEDAL_RATE_BONUS = 0.05

// ---- 実績 ----

/** 実績カタログ(バッジのみ・報酬なし)。仕様は docs/requirements.md */
export const ACHIEVEMENTS: Record<AchievementId, AchievementSpec> = {
  firstCoins: {
    id: 'firstCoins',
    name: 'はじめてのおこづかい',
    description: '累計100コインを稼ぐ',
    condition: { type: 'totalCoinsEarned', amount: 100 },
  },
  rich1: {
    id: 'rich1',
    name: '小金持ち',
    description: '累計10,000コインを稼ぐ',
    condition: { type: 'totalCoinsEarned', amount: 10_000 },
  },
  rich2: {
    id: 'rich2',
    name: '豚舎の大富豪',
    description: '累計1,000,000コインを稼ぐ',
    condition: { type: 'totalCoinsEarned', amount: 1_000_000 },
  },
  firstUpgrade: {
    id: 'firstUpgrade',
    name: 'はじめての強化',
    description: 'いずれかの施設を強化する',
    condition: { type: 'totalBuildingLevels', level: 1 },
  },
  builder: {
    id: 'builder',
    name: '拡張工事中',
    description: '施設レベルの合計が50に到達する',
    condition: { type: 'totalBuildingLevels', level: 50 },
  },
  tycoon: {
    id: 'tycoon',
    name: 'タイクーンの風格',
    description: '施設レベルの合計が150に到達する',
    condition: { type: 'totalBuildingLevels', level: 150 },
  },
  maxFeeding: {
    id: 'maxFeeding',
    name: 'えさ場の極み',
    description: 'えさ場を最大レベルにする',
    condition: { type: 'buildingLevel', buildingId: 'feedingTrough', level: 100 },
  },
  maxSignboard: {
    id: 'maxSignboard',
    name: '広告王',
    description: '看板を最大レベルにする',
    condition: { type: 'buildingLevel', buildingId: 'signboard', level: 12 },
  },
  firstPig: {
    id: 'firstPig',
    name: 'はじめまして、ぶた',
    description: 'はじめて豚を捕獲する',
    condition: { type: 'pigCaptures', count: 1 },
  },
  pigHoarder: {
    id: 'pigHoarder',
    name: '捕獲マニア',
    description: '通算30回豚を捕獲する',
    condition: { type: 'pigCaptures', count: 30 },
  },
  pigFriends: {
    id: 'pigFriends',
    name: '豚と友達',
    description: '図鑑に6種登録する',
    condition: { type: 'pigSpecies', count: 6 },
  },
  pigMaster: {
    id: 'pigMaster',
    name: '図鑑コンプリート',
    description: '全12種の豚を集める',
    condition: { type: 'pigSpecies', count: 12 },
  },
  firstPrestige: {
    id: 'firstPrestige',
    name: 'はじめての転生',
    description: 'はじめて転生する',
    condition: { type: 'prestigeCount', count: 1 },
  },
  prestige5: {
    id: 'prestige5',
    name: '輪廻のぶた',
    description: '5回転生する',
    condition: { type: 'prestigeCount', count: 5 },
  },
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
