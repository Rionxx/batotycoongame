/**
 * 派生値のセレクタフック集。
 * 計算はすべて src/logic/ の純粋関数に委譲し、コンポーネント側に式を書かせない。
 */
import { useGameStore } from './gameStore'
import {
  calculateCoinsPerSecond,
  calculatePigBonus,
  calculatePigSpawnChance,
  calculateUpgradeCost,
  canUpgrade,
} from '../logic/upgrade'
import { isCollectionComplete } from '../logic/pigCollection'
import { calculateMedalsGain, canPrestige, medalMultiplier } from '../logic/prestige'
import type { BuildingId } from '../types/game'

/** 現在の生成レート(コイン/秒) */
export function useCoinsPerSecond(): number {
  return useGameStore((s) =>
    calculateCoinsPerSecond(s.buildingLevels, s.pigCollection, s.prestige.medals),
  )
}

/** 豚コレクションによる生成ボーナス(0.38 = +38%) */
export function usePigBonus(): number {
  return useGameStore((s) => calculatePigBonus(s.pigCollection))
}

/** 現在の豚出現確率 */
export function usePigSpawnChance(): number {
  return useGameStore((s) => calculatePigSpawnChance(s.buildingLevels))
}

/** 施設の次レベルへのコスト(最大レベルなら null) */
export function useUpgradeCost(id: BuildingId): number | null {
  return useGameStore((s) => calculateUpgradeCost(id, s.buildingLevels[id]))
}

/** 施設を今すぐ強化できるか */
export function useCanUpgrade(id: BuildingId): boolean {
  return useGameStore((s) => canUpgrade(id, s.buildingLevels[id], s.coins))
}

/** 図鑑コンプリート済みか */
export function useIsCollectionComplete(): boolean {
  return useGameStore((s) => isCollectionComplete(s.pigCollection))
}

/** 図鑑の捕獲済み種数 */
export function useCaughtSpeciesCount(): number {
  return useGameStore(
    (s) => Object.values(s.pigCollection).filter((e) => e.count > 0).length,
  )
}

/** いま転生した場合に獲得できるメダル数 */
export function useMedalsGain(): number {
  return useGameStore((s) => calculateMedalsGain(s.runCoinsEarned))
}

/** 転生ボタンを押せるか */
export function useCanPrestige(): boolean {
  return useGameStore((s) => canPrestige(s.runCoinsEarned))
}

/** メダルによる現在のレート倍率(1.15 = +15%) */
export function useMedalMultiplier(): number {
  return useGameStore((s) => medalMultiplier(s.prestige.medals))
}
