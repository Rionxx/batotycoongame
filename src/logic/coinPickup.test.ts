import { describe, expect, it } from 'vitest'
import {
  calculateCoinPickupValue,
  shouldRespawnCoinPickup,
  spawnCoinPickup,
} from './coinPickup'

describe('calculateCoinPickupValue', () => {
  it('現在レートの8秒分を整数で返す', () => {
    expect(calculateCoinPickupValue(1)).toBe(8)
    expect(calculateCoinPickupValue(100)).toBe(800)
    expect(calculateCoinPickupValue(2.6)).toBe(20) // floor(20.8)
  })
})

describe('shouldRespawnCoinPickup', () => {
  it('再出現時刻を過ぎたら true', () => {
    expect(shouldRespawnCoinPickup(1000, 1000)).toBe(true)
    expect(shouldRespawnCoinPickup(999, 1000)).toBe(false)
  })
})

describe('spawnCoinPickup', () => {
  it('乱数から0〜1の相対座標を生成する', () => {
    const pickup = spawnCoinPickup(() => 0.3)
    expect(pickup).toEqual({ x: 0.3, y: 0.3 })
  })
})
