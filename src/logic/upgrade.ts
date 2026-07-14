/**
 * 施設アップグレードのコスト・効果と生成レートを計算する純粋関数群。
 */
import type { BuildingId, GameState } from '../types/game'
import { PIG_SPECIES_IDS } from '../types/game'
import {
  BASE_COINS_PER_SECOND,
  BUILDINGS,
  PIG_CATALOG,
  PIG_RATE_BONUS,
  PIG_SPAWN_BASE_CHANCE,
  PIG_SPAWN_MAX_CHANCE,
} from './constants'

/**
 * レベル level → level+1 のアップグレードコスト(コイン)。
 * cost = floor(baseCost × growth^level)
 * 最大レベル到達済みの場合は null を返す。
 */
export function calculateUpgradeCost(id: BuildingId, level: number): number | null {
  const spec = BUILDINGS[id]
  if (level >= spec.maxLevel) return null
  return Math.floor(spec.baseCost * Math.pow(spec.costGrowth, level))
}

/** アップグレード可能か(コイン残高と最大レベルの両方を判定) */
export function canUpgrade(id: BuildingId, level: number, coins: number): boolean {
  const cost = calculateUpgradeCost(id, level)
  return cost !== null && coins >= cost
}

/** 図鑑登録済みの豚による生成ボーナス合計(例: 0.38 = +38%) */
export function calculatePigBonus(pigCollection: GameState['pigCollection']): number {
  let bonus = 0
  for (const speciesId of PIG_SPECIES_IDS) {
    if (pigCollection[speciesId].count > 0) {
      bonus += PIG_RATE_BONUS[PIG_CATALOG[speciesId].rarity]
    }
  }
  return bonus
}

/**
 * 現在の生成レート(コイン/秒)。
 * rate = (基本 + えさ場加算 + 豚小屋加算) × 市場倍率 × (1 + 豚ボーナス)
 */
export function calculateCoinsPerSecond(
  buildingLevels: GameState['buildingLevels'],
  pigCollection: GameState['pigCollection'],
): number {
  let flat = BASE_COINS_PER_SECOND
  let multiplier = 1
  for (const spec of Object.values(BUILDINGS)) {
    const level = buildingLevels[spec.id]
    if (spec.effectType === 'flatRate') {
      flat += spec.effectPerLevel * level
    } else if (spec.effectType === 'rateMultiplier') {
      multiplier *= 1 + spec.effectPerLevel * level
    }
  }
  return flat * multiplier * (1 + calculatePigBonus(pigCollection))
}

/** 現在の豚出現確率(基本 + 看板加算、上限クリップ) */
export function calculatePigSpawnChance(
  buildingLevels: GameState['buildingLevels'],
): number {
  const chance =
    PIG_SPAWN_BASE_CHANCE + BUILDINGS.signboard.effectPerLevel * buildingLevels.signboard
  return Math.min(chance, PIG_SPAWN_MAX_CHANCE)
}
