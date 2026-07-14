import { beforeEach, describe, expect, it } from 'vitest'
import { OFFLINE_CAP_SECONDS } from '../logic/constants'
import {
  createInitialGameState,
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
    offlineReport: null,
    completionCelebrated: false,
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

describe('tapCoin', () => {
  it('タップで+1コイン', () => {
    useGameStore.getState().tapCoin()
    useGameStore.getState().tapCoin()
    expect(useGameStore.getState().coins).toBe(2)
    expect(useGameStore.getState().totalCoinsEarned).toBe(2)
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

describe('resetGame', () => {
  it('全状態が初期化される', () => {
    useGameStore.setState({ coins: 9999, buildingLevels: { feedingTrough: 5, pigPen: 3, market: 1, signboard: 2 } })
    useGameStore.getState().resetGame()
    const state = useGameStore.getState()
    expect(state.coins).toBe(0)
    expect(state.buildingLevels.feedingTrough).toBe(0)
    expect(state.pigCollection.pinky.count).toBe(0)
  })
})
