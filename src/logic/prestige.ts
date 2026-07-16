/**
 * プレステージ(転生)の純粋関数群。
 * 仕様: docs/requirements.md「プレステージ」の節を参照。
 */
import type { BuildingId, GameState } from '../types/game'
import { BUILDING_IDS } from '../types/game'
import { MEDAL_RATE_BONUS, PRESTIGE_MEDAL_DIVISOR } from './constants'

/** 今回の周回コインで獲得できるメダル数 = floor(√(周回コイン ÷ 100,000)) */
export function calculateMedalsGain(runCoinsEarned: number): number {
  if (runCoinsEarned <= 0) return 0
  return Math.floor(Math.sqrt(runCoinsEarned / PRESTIGE_MEDAL_DIVISOR))
}

/** 転生可能か(獲得メダル1枚以上) */
export function canPrestige(runCoinsEarned: number): boolean {
  return calculateMedalsGain(runCoinsEarned) >= 1
}

/** メダル総数によるレート倍率 = 1 + 0.05 × メダル数 */
export function medalMultiplier(medals: number): number {
  return 1 + MEDAL_RATE_BONUS * medals
}

/**
 * 転生後のGameStateを生成する(引数は変更しない)。
 * リセット: コイン・周回コイン・施設レベル・時刻基準
 * 引き継ぎ: 図鑑・実績・生涯累計コイン・メダル(加算)・転生回数(+1)
 */
export function applyPrestige(state: GameState, nowMs: number): GameState {
  const gain = calculateMedalsGain(state.runCoinsEarned)
  return {
    ...state,
    coins: 0,
    runCoinsEarned: 0,
    buildingLevels: Object.fromEntries(BUILDING_IDS.map((id) => [id, 0])) as Record<
      BuildingId,
      number
    >,
    lastActiveAt: nowMs,
    lastSpawnCheckAt: nowMs,
    prestige: {
      medals: state.prestige.medals + gain,
      count: state.prestige.count + 1,
    },
  }
}
