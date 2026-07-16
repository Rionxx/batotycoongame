/**
 * ゲーム全体の型定義。docs/requirements.md を唯一の仕様ソースとして反映する。
 * ここには「データの形」だけを置き、数値(初期コスト等)は src/logic/constants.ts に置く。
 */

/** 施設ID。要件定義の4施設に対応する */
export type BuildingId = 'feedingTrough' | 'pigPen' | 'market' | 'signboard'

export const BUILDING_IDS: readonly BuildingId[] = [
  'feedingTrough',
  'pigPen',
  'market',
  'signboard',
]

/** 豚のレア度(3段階) */
export type PigRarity = 'common' | 'rare' | 'epic'

/** 豚の種類ID。図鑑は全12種(コモン6・レア4・エピック2) */
export type PigSpeciesId =
  | 'pinky'
  | 'spotty'
  | 'muddy'
  | 'curly'
  | 'sleepy'
  | 'hungry'
  | 'silver'
  | 'shadow'
  | 'flower'
  | 'ninja'
  | 'golden'
  | 'king'

export const PIG_SPECIES_IDS: readonly PigSpeciesId[] = [
  'pinky',
  'spotty',
  'muddy',
  'curly',
  'sleepy',
  'hungry',
  'silver',
  'shadow',
  'flower',
  'ninja',
  'golden',
  'king',
]

/** 豚1種のマスタ情報(カタログは constants.ts で定義) */
export interface PigSpecies {
  id: PigSpeciesId
  name: string
  rarity: PigRarity
}

/** 施設1種のマスタ情報(カタログは constants.ts で定義) */
export interface BuildingSpec {
  id: BuildingId
  name: string
  /** 1レベルあたりの効果量(効果の意味は effectType で決まる) */
  effectPerLevel: number
  effectType: 'flatRate' | 'rateMultiplier' | 'pigSpawnChance'
  baseCost: number
  costGrowth: number
  maxLevel: number
}

/** 画面に出現中の豚(捕獲待ち)。永続化しない一時状態 */
export interface ActivePig {
  speciesId: PigSpeciesId
  /** 出現時刻(エポックms) */
  spawnedAt: number
  /** この時刻を過ぎたら消滅(エポックms) */
  expiresAt: number
  /** 画面内の表示位置(0〜1の相対座標。UI層がピクセルに変換する) */
  x: number
  y: number
}

/** 図鑑1種ぶんの収集状況 */
export interface PigCollectionEntry {
  /** 捕獲回数(0 = 未捕獲)。2回目以降はコイン変換される */
  count: number
  /** 初回捕獲時刻(エポックms)。未捕獲なら null */
  firstCaughtAt: number | null
}

/** オフライン収集の精算結果(復帰時モーダルの表示用) */
export interface OfflineReport {
  coinsEarned: number
  /** 実際に精算した秒数(上限2時間でクリップ後) */
  elapsedSeconds: number
  /** 上限クリップが発生したか */
  capped: boolean
}

/** 実績ID(全12種)。仕様は docs/requirements.md の実績テーブルを参照 */
export type AchievementId =
  | 'firstCoins'
  | 'rich1'
  | 'rich2'
  | 'firstUpgrade'
  | 'builder'
  | 'tycoon'
  | 'maxFeeding'
  | 'maxSignboard'
  | 'firstPig'
  | 'pigHoarder'
  | 'pigFriends'
  | 'pigMaster'
  | 'firstPrestige'
  | 'prestige5'

export const ACHIEVEMENT_IDS: readonly AchievementId[] = [
  'firstCoins',
  'rich1',
  'rich2',
  'firstUpgrade',
  'builder',
  'tycoon',
  'maxFeeding',
  'maxSignboard',
  'firstPig',
  'pigHoarder',
  'pigFriends',
  'pigMaster',
  'firstPrestige',
  'prestige5',
]

/** 転生(プレステージ)の永続状態 */
export interface PrestigeState {
  /** 金の豚メダルの総数(1枚 = レート+5%) */
  medals: number
  /** 転生回数 */
  count: number
}

/** 実績の達成条件(宣言的定義。判定は logic/achievements.ts) */
export type AchievementCondition =
  | { type: 'totalCoinsEarned'; amount: number }
  | { type: 'totalBuildingLevels'; level: number }
  | { type: 'buildingLevel'; buildingId: BuildingId; level: number }
  | { type: 'pigCaptures'; count: number }
  | { type: 'pigSpecies'; count: number }
  | { type: 'prestigeCount'; count: number }

/** 実績1件のマスタ情報(カタログは constants.ts で定義) */
export interface AchievementSpec {
  id: AchievementId
  name: string
  description: string
  condition: AchievementCondition
}

/** 永続化対象のコア状態 */
export interface GameState {
  coins: number
  /** 生涯の累計獲得コイン(実績・統計用。転生でもリセットしない) */
  totalCoinsEarned: number
  /** 今回の周回で稼いだ累計コイン(転生メダルの計算用。転生でリセット) */
  runCoinsEarned: number
  /** 施設ID → 現在レベル(0 = 未購入相当) */
  buildingLevels: Record<BuildingId, number>
  /** 図鑑: 全12種ぶんを常にフルで持つ(未捕獲は count: 0) */
  pigCollection: Record<PigSpeciesId, PigCollectionEntry>
  /** 最後にゲームが動いていた時刻(エポックms)。オフライン精算の起点 */
  lastActiveAt: number
  /** 最後に豚の出現判定を行った時刻(エポックms) */
  lastSpawnCheckAt: number
  /** 実績ID → 解除時刻(エポックms)。未解除は null */
  achievements: Record<AchievementId, number | null>
  /** 転生の状態 */
  prestige: PrestigeState
}

/** 永続化しない一時状態(UI都合の状態もここ) */
export interface TransientState {
  /** 出現中の豚。いなければ null(同時出現は1匹まで) */
  activePig: ActivePig | null
  /** 復帰時に表示するオフライン精算結果。表示済みなら null */
  offlineReport: OfflineReport | null
  /** 図鑑コンプリート達成モーダルの表示フラグ(1回だけ表示) */
  completionCelebrated: boolean
  /** 直近で解除された実績(トースト表示用)。表示後にクリアする */
  recentUnlocks: AchievementId[]
}

/** ストアのアクション群(実装はフェーズ3) */
export interface GameActions {
  /** ゲーム時間を進める。1秒tickの本体(資源加算・豚出現判定・豚消滅) */
  tick: (nowMs: number) => void
  /** 手動タップ(+1コイン) */
  tapCoin: () => void
  /** 施設を1レベル強化する(コイン不足・最大レベル時は何もしない) */
  upgradeBuilding: (id: BuildingId) => void
  /** 出現中の豚を捕獲する(新種なら図鑑登録、重複ならコイン変換) */
  capturePig: () => void
  /** 起動・復帰時にオフライン収集を精算する */
  applyOfflineProgress: (nowMs: number) => void
  /** オフライン精算モーダルを閉じる */
  dismissOfflineReport: () => void
  /** コンプリート達成モーダルを表示済みにする */
  markCompletionCelebrated: () => void
  /** 実績解除トーストをクリアする */
  clearRecentUnlocks: () => void
  /** 転生を実行する(条件未達なら何もしない) */
  doPrestige: (nowMs: number) => void
  /** セーブデータを全消去して初期状態に戻す */
  resetGame: () => void
}

export type GameStore = GameState & TransientState & GameActions
