import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  BuildingId,
  GameState,
  GameStore,
  PigCollectionEntry,
  PigSpeciesId,
} from '../types/game'
import { BUILDING_IDS, PIG_SPECIES_IDS } from '../types/game'
import {
  COINS_PER_TAP,
  OFFLINE_REPORT_MIN_SECONDS,
  PIG_SPAWN_CHECK_INTERVAL_SECONDS,
} from '../logic/constants'
import { calculateEarnedCoins, calculateOfflineProgress, clampCoins } from '../logic/tick'
import {
  calculateCoinsPerSecond,
  calculatePigSpawnChance,
  calculateUpgradeCost,
  canUpgrade,
} from '../logic/upgrade'
import {
  isCollectionComplete,
  isPigExpired,
  resolveCapture,
  shouldSpawnPig,
  spawnPig,
} from '../logic/pigCollection'
import type { Rng } from '../logic/pigCollection'

/** localStorageの保存キー。スキーマ変更時は persist の version を上げて migrate する */
export const SAVE_KEY = 'batotycoon:save'
export const SAVE_VERSION = 1

/** 豚の抽選に使う乱数源。テストからは差し替え可能にする */
let rng: Rng = Math.random
export function setRngForTesting(next: Rng): void {
  rng = next
}

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

function createMemoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
  }
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

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialGameState(Date.now()),

      // ---- 一時状態(永続化しない) ----
      activePig: null,
      offlineReport: null,
      completionCelebrated: false,

      // ---- アクション ----

      tick: (nowMs: number) => {
        const state = get()
        const elapsedSeconds = (nowMs - state.lastActiveAt) / 1000
        const rate = calculateCoinsPerSecond(state.buildingLevels, state.pigCollection)
        const earned = calculateEarnedCoins(rate, elapsedSeconds)

        // 消滅判定
        let activePig = state.activePig
        if (activePig && isPigExpired(activePig, nowMs)) {
          activePig = null
        }

        // 出現判定(30秒間隔・同時出現は1匹まで)
        let lastSpawnCheckAt = state.lastSpawnCheckAt
        if (nowMs - lastSpawnCheckAt >= PIG_SPAWN_CHECK_INTERVAL_SECONDS * 1000) {
          lastSpawnCheckAt = nowMs
          if (
            activePig === null &&
            shouldSpawnPig(calculatePigSpawnChance(state.buildingLevels), rng)
          ) {
            activePig = spawnPig(nowMs, rng)
          }
        }

        set({
          coins: clampCoins(state.coins + earned),
          totalCoinsEarned: clampCoins(state.totalCoinsEarned + earned),
          lastActiveAt: nowMs,
          lastSpawnCheckAt,
          activePig,
        })
      },

      tapCoin: () => {
        const state = get()
        set({
          coins: clampCoins(state.coins + COINS_PER_TAP),
          totalCoinsEarned: clampCoins(state.totalCoinsEarned + COINS_PER_TAP),
        })
      },

      upgradeBuilding: (id: BuildingId) => {
        const state = get()
        const level = state.buildingLevels[id]
        if (!canUpgrade(id, level, state.coins)) return
        const cost = calculateUpgradeCost(id, level)
        if (cost === null) return
        set({
          coins: state.coins - cost,
          buildingLevels: { ...state.buildingLevels, [id]: level + 1 },
        })
      },

      capturePig: () => {
        const state = get()
        const pig = state.activePig
        if (pig === null) return
        const rate = calculateCoinsPerSecond(state.buildingLevels, state.pigCollection)
        const result = resolveCapture(
          state.pigCollection,
          pig.speciesId,
          rate,
          Date.now(),
        )
        set({
          activePig: null,
          pigCollection: result.pigCollection,
          coins: clampCoins(state.coins + result.coinsAwarded),
          totalCoinsEarned: clampCoins(state.totalCoinsEarned + result.coinsAwarded),
        })
      },

      applyOfflineProgress: (nowMs: number) => {
        const state = get()
        const rate = calculateCoinsPerSecond(state.buildingLevels, state.pigCollection)
        const report = calculateOfflineProgress(state.lastActiveAt, nowMs, rate)
        set({
          coins: clampCoins(state.coins + report.coinsEarned),
          totalCoinsEarned: clampCoins(state.totalCoinsEarned + report.coinsEarned),
          lastActiveAt: nowMs,
          lastSpawnCheckAt: nowMs,
          offlineReport:
            report.elapsedSeconds >= OFFLINE_REPORT_MIN_SECONDS ? report : null,
        })
      },

      dismissOfflineReport: () => {
        set({ offlineReport: null })
      },

      markCompletionCelebrated: () => {
        set({ completionCelebrated: true })
      },

      resetGame: () => {
        set({
          ...createInitialGameState(Date.now()),
          activePig: null,
          offlineReport: null,
          completionCelebrated: false,
        })
      },
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      // テスト(Node環境)ではlocalStorageが無いため、インメモリにフォールバックする
      storage: createJSONStorage(() =>
        typeof localStorage !== 'undefined' ? localStorage : createMemoryStorage(),
      ),
      // 一時状態(activePig等)とアクションは保存しない。GameStateのみ永続化する
      partialize: (state): GameState => ({
        coins: state.coins,
        totalCoinsEarned: state.totalCoinsEarned,
        buildingLevels: state.buildingLevels,
        pigCollection: state.pigCollection,
        lastActiveAt: state.lastActiveAt,
        lastSpawnCheckAt: state.lastSpawnCheckAt,
      }),
      onRehydrateStorage: () => (state) => {
        // コンプ済みセーブの再ロードで達成モーダルが再表示されるのを防ぐ
        if (state && isCollectionComplete(state.pigCollection)) {
          state.completionCelebrated = true
        }
      },
    },
  ),
)
