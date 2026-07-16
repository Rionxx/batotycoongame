import { beforeEach, describe, expect, it } from 'vitest'
import { OFFLINE_CAP_SECONDS } from '../logic/constants'
import { createInitialAchievements } from '../logic/achievements'
import {
  createInitialGameState,
  migrateSave,
  setRngForTesting,
  useGameStore,
} from './gameStore'

const T0 = 1_700_000_000_000

/** 指定した値を順番に返す固定乱数 */
function fixedRng(...values: number[]): () => number {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

beforeEach(() => {
  useGameStore.setState({
    ...createInitialGameState(T0),
    activePig: null,
    coinPickup: null,
    coinPickupRespawnAt: Number.MAX_SAFE_INTEGER, // テスト中の勝手な再出現を防ぐ
    offlineReport: null,
    completionCelebrated: false,
    recentUnlocks: [],
  })
  setRngForTesting(Math.random)
})

describe('tick', () => {
  it('経過秒数 × レートぶんコインが増える', () => {
    useGameStore.getState().tick(T0 + 5000)
    expect(useGameStore.getState().coins).toBe(5) // 基本レート1/秒 × 5秒
    expect(useGameStore.getState().lastActiveAt).toBe(T0 + 5000)
  })

  it('30秒経過するまで出現判定は行われない', () => {
    setRngForTesting(fixedRng(0)) // 判定されれば必ず出現する乱数
    useGameStore.getState().tick(T0 + 29_000)
    expect(useGameStore.getState().activePig).toBeNull()
  })

  it('30秒経過後の判定で乱数が確率未満なら豚が出現する', () => {
    setRngForTesting(fixedRng(0.1, 0.5, 0.5, 0.5, 0.5))
    useGameStore.getState().tick(T0 + 30_000)
    const pig = useGameStore.getState().activePig
    expect(pig).not.toBeNull()
    expect(pig!.expiresAt).toBe(T0 + 30_000 + 15_000)
  })

  it('乱数が確率以上なら出現しない(基本確率20%)', () => {
    setRngForTesting(fixedRng(0.25))
    useGameStore.getState().tick(T0 + 30_000)
    expect(useGameStore.getState().activePig).toBeNull()
  })

  it('15秒放置した豚は消滅する', () => {
    setRngForTesting(fixedRng(0.1, 0.5, 0.5, 0.5, 0.5))
    useGameStore.getState().tick(T0 + 30_000)
    expect(useGameStore.getState().activePig).not.toBeNull()
    useGameStore.getState().tick(T0 + 45_000)
    expect(useGameStore.getState().activePig).toBeNull()
  })
})

describe('コイン山', () => {
  it('再出現時刻を過ぎたtickでコイン山が出現する', () => {
    useGameStore.setState({ coinPickupRespawnAt: 0 })
    setRngForTesting(fixedRng(0.9, 0.3, 0.7)) // 出現判定は走らない時刻なので座標のみ消費
    useGameStore.getState().tick(T0 + 1000)
    const pickup = useGameStore.getState().coinPickup
    expect(pickup).not.toBeNull()
    expect(pickup!.x).toBeGreaterThanOrEqual(0)
    expect(pickup!.x).toBeLessThan(1)
  })

  it('回収でレート×8秒分を獲得し、20秒後まで再出現しない', () => {
    useGameStore.setState({ coinPickup: { x: 0.5, y: 0.5 } })
    useGameStore.getState().collectCoinPickup(T0 + 1000)
    const state = useGameStore.getState()
    expect(state.coins).toBe(8) // レート1/秒 × 8秒分
    expect(state.coinPickup).toBeNull()
    expect(state.coinPickupRespawnAt).toBe(T0 + 1000 + 20_000)
  })

  it('コイン山が無いときの回収は何もしない', () => {
    useGameStore.getState().collectCoinPickup(T0 + 1000)
    expect(useGameStore.getState().coins).toBe(0)
  })

  it('回収額にはメダル・施設のレートが反映される', () => {
    useGameStore.setState({
      coinPickup: { x: 0.5, y: 0.5 },
      buildingLevels: { feedingTrough: 9, pigPen: 0, market: 0, signboard: 0 }, // レート10/秒
      prestige: { medals: 2, count: 1 }, // ×1.1
    })
    useGameStore.getState().collectCoinPickup(T0 + 1000)
    expect(useGameStore.getState().coins).toBe(88) // floor(10 × 1.1 × 8)
  })
})

describe('upgradeBuilding', () => {
  it('コストを支払ってレベルが1上がる', () => {
    useGameStore.setState({ coins: 100 })
    useGameStore.getState().upgradeBuilding('feedingTrough')
    expect(useGameStore.getState().buildingLevels.feedingTrough).toBe(1)
    expect(useGameStore.getState().coins).toBe(90) // 初期コスト10
  })

  it('コイン不足なら何も起きない', () => {
    useGameStore.setState({ coins: 9 })
    useGameStore.getState().upgradeBuilding('feedingTrough')
    expect(useGameStore.getState().buildingLevels.feedingTrough).toBe(0)
    expect(useGameStore.getState().coins).toBe(9)
  })

  it('レベルが上がるとレートに反映される', () => {
    useGameStore.setState({ coins: 10 })
    useGameStore.getState().upgradeBuilding('feedingTrough') // +1/秒 → 合計2/秒
    useGameStore.getState().tick(T0 + 10_000)
    expect(useGameStore.getState().coins).toBe(20)
  })
})

describe('capturePig', () => {
  it('新種の捕獲で図鑑に登録され、豚は画面から消える', () => {
    useGameStore.setState({
      activePig: { speciesId: 'pinky', spawnedAt: T0, expiresAt: T0 + 15_000, x: 0.5, y: 0.5 },
    })
    useGameStore.getState().capturePig()
    const state = useGameStore.getState()
    expect(state.pigCollection.pinky.count).toBe(1)
    expect(state.activePig).toBeNull()
    expect(state.coins).toBe(0) // 新種はコイン変換なし
  })

  it('重複捕獲はコインに変換される(コモン=レート30秒分)', () => {
    useGameStore.setState({
      pigCollection: {
        ...useGameStore.getState().pigCollection,
        pinky: { count: 1, firstCaughtAt: T0 },
      },
      activePig: { speciesId: 'pinky', spawnedAt: T0, expiresAt: T0 + 15_000, x: 0.5, y: 0.5 },
    })
    useGameStore.getState().capturePig()
    expect(useGameStore.getState().coins).toBe(30) // レート1/秒 × 30秒分
    expect(useGameStore.getState().pigCollection.pinky.count).toBe(2)
  })

  it('出現中の豚がいなければ何も起きない', () => {
    useGameStore.getState().capturePig()
    expect(useGameStore.getState().coins).toBe(0)
  })
})

describe('applyOfflineProgress', () => {
  it('離席時間ぶんのコインが加算されレポートが生成される', () => {
    useGameStore.getState().applyOfflineProgress(T0 + 600_000) // 10分
    const state = useGameStore.getState()
    expect(state.coins).toBe(600)
    expect(state.offlineReport).not.toBeNull()
    expect(state.offlineReport!.capped).toBe(false)
  })

  it('2時間を超える離席は上限でクリップされる', () => {
    useGameStore.getState().applyOfflineProgress(T0 + 24 * 3600 * 1000) // 24時間
    const state = useGameStore.getState()
    expect(state.coins).toBe(OFFLINE_CAP_SECONDS) // レート1/秒 × 上限秒数
    expect(state.offlineReport!.capped).toBe(true)
  })

  it('10秒未満の離席ではレポートを出さない(コインは加算される)', () => {
    useGameStore.getState().applyOfflineProgress(T0 + 5000)
    expect(useGameStore.getState().coins).toBe(5)
    expect(useGameStore.getState().offlineReport).toBeNull()
  })

  it('dismissOfflineReport でレポートが消える', () => {
    useGameStore.getState().applyOfflineProgress(T0 + 600_000)
    useGameStore.getState().dismissOfflineReport()
    expect(useGameStore.getState().offlineReport).toBeNull()
  })
})

describe('実績', () => {
  it('tickで条件を満たした実績が解除されトースト対象になる', () => {
    useGameStore.setState({ totalCoinsEarned: 99 })
    useGameStore.getState().tick(T0 + 1000) // +1コインで累計100到達
    const state = useGameStore.getState()
    expect(state.achievements.firstCoins).toBe(T0 + 1000)
    expect(state.recentUnlocks).toContain('firstCoins')
  })

  it('解除済みの実績は再解除されない', () => {
    useGameStore.setState({
      totalCoinsEarned: 200,
      achievements: { ...useGameStore.getState().achievements, firstCoins: 12345 },
    })
    useGameStore.getState().tick(T0 + 1000)
    expect(useGameStore.getState().achievements.firstCoins).toBe(12345)
    expect(useGameStore.getState().recentUnlocks).not.toContain('firstCoins')
  })

  it('clearRecentUnlocks でトースト対象が空になる(解除記録は残る)', () => {
    useGameStore.setState({ totalCoinsEarned: 100 })
    useGameStore.getState().tick(T0 + 1000)
    useGameStore.getState().clearRecentUnlocks()
    expect(useGameStore.getState().recentUnlocks).toEqual([])
    expect(useGameStore.getState().achievements.firstCoins).not.toBeNull()
  })
})

describe('migrateSave', () => {
  it('v1セーブに実績フィールドが追加され、達成済み条件は通知なしで解除される', () => {
    const v1 = createInitialGameState(T0) as unknown as Record<string, unknown>
    delete v1.achievements // v1には実績フィールドがない
    Object.assign(v1, {
      totalCoinsEarned: 15_000,
      buildingLevels: { feedingTrough: 30, pigPen: 15, market: 5, signboard: 0 },
    })
    const migrated = migrateSave(v1, 1)
    expect(migrated.achievements.firstCoins).not.toBeNull()
    expect(migrated.achievements.rich1).not.toBeNull() // 累計15,000 ≥ 10,000
    expect(migrated.achievements.builder).not.toBeNull() // 合計50レベル
    expect(migrated.achievements.rich2).toBeNull() // 未達成
    expect(migrated.achievements.pigMaster).toBeNull()
  })

  it('現行バージョンのセーブはそのまま返す', () => {
    const v2 = createInitialGameState(T0)
    v2.achievements = createInitialAchievements()
    v2.achievements.firstCoins = 777
    const migrated = migrateSave(v2, 2)
    expect(migrated.achievements.firstCoins).toBe(777)
  })
})

describe('doPrestige', () => {
  it('周回コイン10万未満では何も起きない', () => {
    useGameStore.setState({ runCoinsEarned: 99_999, coins: 5000 })
    useGameStore.getState().doPrestige(T0 + 1000)
    expect(useGameStore.getState().coins).toBe(5000)
    expect(useGameStore.getState().prestige.count).toBe(0)
  })

  it('転生でメダルを獲得し、進行がリセットされ図鑑と実績は残る', () => {
    useGameStore.setState({
      coins: 5000,
      runCoinsEarned: 400_000, // → 2枚
      totalCoinsEarned: 1_000_000,
      buildingLevels: { feedingTrough: 30, pigPen: 10, market: 3, signboard: 2 },
      pigCollection: {
        ...useGameStore.getState().pigCollection,
        pinky: { count: 1, firstCaughtAt: 123 },
      },
      achievements: { ...useGameStore.getState().achievements, firstCoins: 456 },
    })
    useGameStore.getState().doPrestige(T0 + 1000)
    const state = useGameStore.getState()
    expect(state.prestige).toEqual({ medals: 2, count: 1 })
    expect(state.coins).toBe(0)
    expect(state.runCoinsEarned).toBe(0)
    expect(state.buildingLevels.feedingTrough).toBe(0)
    expect(state.pigCollection.pinky.count).toBe(1)
    expect(state.achievements.firstCoins).toBe(456)
    expect(state.totalCoinsEarned).toBe(1_000_000)
  })

  it('メダルがレートに効く(2枚で+10%)し、次のtickで転生実績が解除される', () => {
    useGameStore.setState({ runCoinsEarned: 400_000 })
    useGameStore.getState().doPrestige(T0 + 1000)
    useGameStore.getState().tick(T0 + 11_000) // 10秒 × 基本1/秒 × 1.1
    const state = useGameStore.getState()
    expect(state.coins).toBeCloseTo(11)
    expect(state.achievements.firstPrestige).not.toBeNull()
    expect(state.recentUnlocks).toContain('firstPrestige')
  })
})

describe('migrateSave (v2→v3)', () => {
  it('転生フィールドが追加され、周回コインは生涯累計で初期化される', () => {
    const v2 = createInitialGameState(T0) as unknown as Record<string, unknown>
    delete v2.prestige
    delete v2.runCoinsEarned
    const achievements = createInitialAchievements() as unknown as Record<
      string,
      number | null
    >
    delete achievements.firstPrestige // v2には転生実績が存在しない
    delete achievements.prestige5
    Object.assign(v2, { totalCoinsEarned: 50_000, achievements })

    const migrated = migrateSave(v2, 2)
    expect(migrated.prestige).toEqual({ medals: 0, count: 0 })
    expect(migrated.runCoinsEarned).toBe(50_000)
    expect(migrated.achievements.firstPrestige).toBeNull()
    expect(migrated.achievements.prestige5).toBeNull()
  })
})

describe('resetGame', () => {
  it('全状態が初期化される', () => {
    useGameStore.setState({ coins: 9999, buildingLevels: { feedingTrough: 5, pigPen: 3, market: 1, signboard: 2 } })
    useGameStore.getState().resetGame()
    const state = useGameStore.getState()
    expect(state.coins).toBe(0)
    expect(state.buildingLevels.feedingTrough).toBe(0)
    expect(state.pigCollection.pinky.count).toBe(0)
    expect(state.achievements.firstCoins).toBeNull()
  })

  it('転生状態(メダル)もリセットされる', () => {
    useGameStore.setState({ prestige: { medals: 10, count: 3 } })
    useGameStore.getState().resetGame()
    expect(useGameStore.getState().prestige).toEqual({ medals: 0, count: 0 })
  })
})
