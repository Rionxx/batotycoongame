import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  BuildingId,
  GameState,
  GameStore,
  PigCollectionEntry,
  PigSpeciesId,
} from '../types/game'
import { ACHIEVEMENT_IDS, BUILDING_IDS, PIG_SPECIES_IDS } from '../types/game'
import { applyPrestige, canPrestige } from '../logic/prestige'
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
import {
  createInitialAchievements,
  evaluateAchievements,
  toProgress,
} from '../logic/achievements'

/** localStorageの保存キー。スキーマ変更時は persist の version を上げて migrate する */
export const SAVE_KEY = 'batotycoon:save'
export const SAVE_VERSION = 3

/**
 * 旧バージョンのセーブデータを現行スキーマへ変換する。
 * v1→v2: 実績フィールドを追加し、その時点で条件を満たす実績は通知なしで解除済みにする。
 * v2→v3: 転生フィールドを追加。周回コインは生涯累計と同値で初期化し、
 *         v2以前に存在しない実績ID(転生系)を未解除で補完する。
 */
export function migrateSave(persisted: unknown, fromVersion: number): GameState {
  const state = persisted as GameState
  if (fromVersion < 2) {
    const achievements = createInitialAchievements()
    const now = Date.now()
    for (const id of evaluateAchievements(achievements, toProgress(state))) {
      achievements[id] = now
    }
    state.achievements = achievements
  }
  if (fromVersion < 3) {
    state.prestige = { medals: 0, count: 0 }
    state.runCoinsEarned = state.totalCoinsEarned ?? 0
    for (const id of ACHIEVEMENT_IDS) {
      if (state.achievements[id] === undefined) {
        state.achievements[id] = null
      }
    }
  }
  return state
}

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
    runCoinsEarned: 0,
    prestige: { medals: 0, count: 0 },
    buildingLevels: createInitialBuildingLevels(),
    pigCollection: createInitialCollection(),
    lastActiveAt: nowMs,
    lastSpawnCheckAt: nowMs,
    achievements: createInitialAchievements(),
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
      recentUnlocks: [],

      // ---- アクション ----

      tick: (nowMs: number) => {
        const state = get()
        const elapsedSeconds = (nowMs - state.lastActiveAt) / 1000
        const rate = calculateCoinsPerSecond(
          state.buildingLevels,
          state.pigCollection,
          state.prestige.medals,
        )
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

        // 実績判定(1秒tickに集約。解除表示は最大1秒遅延する仕様)
        const nextTotalEarned = clampCoins(state.totalCoinsEarned + earned)
        const newlyUnlocked = evaluateAchievements(
          state.achievements,
          toProgress(
            {
              totalCoinsEarned: nextTotalEarned,
              buildingLevels: state.buildingLevels,
              pigCollection: state.pigCollection,
            },
            state.prestige.count,
          ),
        )
        const achievements = newlyUnlocked.length
          ? { ...state.achievements }
          : state.achievements
        for (const id of newlyUnlocked) {
          achievements[id] = nowMs
        }

        set({
          coins: clampCoins(state.coins + earned),
          totalCoinsEarned: nextTotalEarned,
          runCoinsEarned: clampCoins(state.runCoinsEarned + earned),
          lastActiveAt: nowMs,
          lastSpawnCheckAt,
          activePig,
          achievements,
          recentUnlocks: newlyUnlocked.length
            ? [...state.recentUnlocks, ...newlyUnlocked]
            : state.recentUnlocks,
        })
      },

      tapCoin: () => {
        const state = get()
        set({
          coins: clampCoins(state.coins + COINS_PER_TAP),
          totalCoinsEarned: clampCoins(state.totalCoinsEarned + COINS_PER_TAP),
          runCoinsEarned: clampCoins(state.runCoinsEarned + COINS_PER_TAP),
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
        const rate = calculateCoinsPerSecond(
          state.buildingLevels,
          state.pigCollection,
          state.prestige.medals,
        )
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
          runCoinsEarned: clampCoins(state.runCoinsEarned + result.coinsAwarded),
        })
      },

      applyOfflineProgress: (nowMs: number) => {
        const state = get()
        const rate = calculateCoinsPerSecond(
          state.buildingLevels,
          state.pigCollection,
          state.prestige.medals,
        )
        const report = calculateOfflineProgress(state.lastActiveAt, nowMs, rate)
        set({
          coins: clampCoins(state.coins + report.coinsEarned),
          totalCoinsEarned: clampCoins(state.totalCoinsEarned + report.coinsEarned),
          runCoinsEarned: clampCoins(state.runCoinsEarned + report.coinsEarned),
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

      clearRecentUnlocks: () => {
        set({ recentUnlocks: [] })
      },

      doPrestige: (nowMs: number) => {
        const state = get()
        if (!canPrestige(state.runCoinsEarned)) return
        set({
          ...applyPrestige(state, nowMs),
          activePig: null,
          offlineReport: null,
        })
      },

      resetGame: () => {
        set({
          ...createInitialGameState(Date.now()),
          activePig: null,
          offlineReport: null,
          completionCelebrated: false,
          recentUnlocks: [],
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
        runCoinsEarned: state.runCoinsEarned,
        prestige: state.prestige,
        buildingLevels: state.buildingLevels,
        pigCollection: state.pigCollection,
        lastActiveAt: state.lastActiveAt,
        lastSpawnCheckAt: state.lastSpawnCheckAt,
        achievements: state.achievements,
      }),
      migrate: migrateSave,
      onRehydrateStorage: () => (state) => {
        // コンプ済みセーブの再ロードで達成モーダルが再表示されるのを防ぐ
        if (state && isCollectionComplete(state.pigCollection)) {
          state.completionCelebrated = true
        }
      },
    },
  ),
)
