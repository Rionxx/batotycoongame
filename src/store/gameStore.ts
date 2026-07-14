import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  BuildingId,
  GameState,
  GameStore,
  PigCollectionEntry,
  PigSpeciesId,
} from '../types/game'
import { BUILDING_IDS, PIG_SPECIES_IDS } from '../types/game'

/** localStorageの保存キー。スキーマ変更時は persist の version を上げて migrate する */
export const SAVE_KEY = 'batotycoon:save'
export const SAVE_VERSION = 1

function createInitialCollection(): Record<PigSpeciesId, PigCollectionEntry> {
  return Object.fromEntries(
    PIG_SPECIES_IDS.map((id) => [id, { count: 0, firstCaughtAt: null }]),
  ) as Record<PigSpeciesId, PigCollectionEntry>
}

function createInitialBuildingLevels(): Record<BuildingId, number> {
  return Object.fromEntries(BUILDING_IDS.map((id) => [id, 0])) as Record<
    BuildingId,
    number
  >
}

export function createInitialGameState(nowMs: number): GameState {
  return {
    coins: 0,
    totalCoinsEarned: 0,
    buildingLevels: createInitialBuildingLevels(),
    pigCollection: createInitialCollection(),
    lastActiveAt: nowMs,
    lastSpawnCheckAt: nowMs,
  }
}

const NOT_IMPLEMENTED = 'フェーズ3(コアロジック実装)で実装する'

export const useGameStore = create<GameStore>()(
  persist(
    (_set, _get) => ({
      ...createInitialGameState(Date.now()),

      // ---- 一時状態(永続化しない) ----
      activePig: null,
      offlineReport: null,
      completionCelebrated: false,

      // ---- アクション(フェーズ3で実装) ----
      tick: (_nowMs: number) => {
        throw new Error(NOT_IMPLEMENTED)
      },
      tapCoin: () => {
        throw new Error(NOT_IMPLEMENTED)
      },
      upgradeBuilding: (_id: BuildingId) => {
        throw new Error(NOT_IMPLEMENTED)
      },
      capturePig: () => {
        throw new Error(NOT_IMPLEMENTED)
      },
      applyOfflineProgress: (_nowMs: number) => {
        throw new Error(NOT_IMPLEMENTED)
      },
      dismissOfflineReport: () => {
        throw new Error(NOT_IMPLEMENTED)
      },
      markCompletionCelebrated: () => {
        throw new Error(NOT_IMPLEMENTED)
      },
      resetGame: () => {
        throw new Error(NOT_IMPLEMENTED)
      },
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      // 一時状態(activePig等)とアクションは保存しない。GameStateのみ永続化する
      partialize: (state): GameState => ({
        coins: state.coins,
        totalCoinsEarned: state.totalCoinsEarned,
        buildingLevels: state.buildingLevels,
        pigCollection: state.pigCollection,
        lastActiveAt: state.lastActiveAt,
        lastSpawnCheckAt: state.lastSpawnCheckAt,
      }),
    },
  ),
)
