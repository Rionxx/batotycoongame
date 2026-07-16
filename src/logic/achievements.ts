/**
 * 実績の達成判定ロジック(純粋関数)。
 * 条件の定義(何を達成とするか)は constants.ts の ACHIEVEMENTS に集約し、
 * ここは条件種別ごとの判定式だけを持つ。
 */
import type {
  AchievementCondition,
  AchievementId,
  GameState,
} from '../types/game'
import { ACHIEVEMENT_IDS, BUILDING_IDS, PIG_SPECIES_IDS } from '../types/game'
import { ACHIEVEMENTS } from './constants'

/** 実績判定に使う進行度のスナップショット */
export interface AchievementProgress {
  totalCoinsEarned: number
  buildingLevels: GameState['buildingLevels']
  pigCollection: GameState['pigCollection']
  /** 転生回数(フェーズ7で導入。それまでは0を渡す) */
  prestigeCount: number
}

/** GameStateから判定用スナップショットを作る */
export function toProgress(
  state: Pick<GameState, 'totalCoinsEarned' | 'buildingLevels' | 'pigCollection'>,
  prestigeCount = 0,
): AchievementProgress {
  return {
    totalCoinsEarned: state.totalCoinsEarned,
    buildingLevels: state.buildingLevels,
    pigCollection: state.pigCollection,
    prestigeCount,
  }
}

/** 通算捕獲回数(重複含む) */
export function totalCaptures(pigCollection: GameState['pigCollection']): number {
  return PIG_SPECIES_IDS.reduce((sum, id) => sum + pigCollection[id].count, 0)
}

/** 図鑑登録済みの種数 */
export function caughtSpeciesCount(pigCollection: GameState['pigCollection']): number {
  return PIG_SPECIES_IDS.filter((id) => pigCollection[id].count > 0).length
}

/** 単一条件の判定 */
export function isConditionMet(
  condition: AchievementCondition,
  progress: AchievementProgress,
): boolean {
  switch (condition.type) {
    case 'totalCoinsEarned':
      return progress.totalCoinsEarned >= condition.amount
    case 'totalBuildingLevels':
      return (
        BUILDING_IDS.reduce((sum, id) => sum + progress.buildingLevels[id], 0) >=
        condition.level
      )
    case 'buildingLevel':
      return progress.buildingLevels[condition.buildingId] >= condition.level
    case 'pigCaptures':
      return totalCaptures(progress.pigCollection) >= condition.count
    case 'pigSpecies':
      return caughtSpeciesCount(progress.pigCollection) >= condition.count
    case 'prestigeCount':
      return progress.prestigeCount >= condition.count
  }
}

/**
 * 新たに解除される実績のID一覧を返す(解除済みは含めない)。
 * 解除は不可逆のため、条件が満たされなくなっても取り消しは行わない。
 */
export function evaluateAchievements(
  unlocked: GameState['achievements'],
  progress: AchievementProgress,
): AchievementId[] {
  return ACHIEVEMENT_IDS.filter(
    (id) =>
      unlocked[id] === null && isConditionMet(ACHIEVEMENTS[id].condition, progress),
  )
}

/** 全実績が未解除の初期状態 */
export function createInitialAchievements(): GameState['achievements'] {
  return Object.fromEntries(ACHIEVEMENT_IDS.map((id) => [id, null])) as GameState['achievements']
}
