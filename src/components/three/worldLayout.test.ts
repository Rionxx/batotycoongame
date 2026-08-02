import { describe, expect, it } from 'vitest'
import { cameraDistanceScale, fieldWorldPosition } from './worldLayout'

describe('cameraDistanceScale', () => {
  it('横長画面(PC)では等倍', () => {
    expect(cameraDistanceScale(16 / 9)).toBe(1)
    expect(cameraDistanceScale(1.5)).toBe(1)
  })

  it('縦長画面(スマホ縦持ち)では引きの倍率が最大になる', () => {
    expect(cameraDistanceScale(9 / 16)).toBe(1.6) // 0.5625
    expect(cameraDistanceScale(0.6)).toBe(1.6)
  })

  it('中間のアスペクト比では連続的に補間される', () => {
    const scale = cameraDistanceScale(1.05) // 0.6と1.5の中間
    expect(scale).toBeGreaterThan(1)
    expect(scale).toBeLessThan(1.6)
    expect(scale).toBeCloseTo(1.3)
  })

  it('アスペクト比が狭いほど倍率が大きい(単調性)', () => {
    expect(cameraDistanceScale(0.7)).toBeGreaterThan(cameraDistanceScale(1.2))
  })

  it('異常値(0除算由来のNaN等)では最大倍率にフォールバックする', () => {
    expect(cameraDistanceScale(Number.NaN)).toBe(1.6)
    expect(cameraDistanceScale(0)).toBe(1.6)
  })
})

describe('fieldWorldPosition', () => {
  it('相対座標(0〜1)をワールド座標へ線形にマッピングする', () => {
    expect(fieldWorldPosition(0.5, 0.5)).toEqual([2, 0])
    expect(fieldWorldPosition(0, 0)).toEqual([-5, -5])
    expect(fieldWorldPosition(1, 1)).toEqual([9, 5])
  })
})
