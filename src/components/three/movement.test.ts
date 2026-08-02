import { describe, expect, it } from 'vitest'
import {
  keysToVector,
  normalize,
  resolveMoveVector,
  stickVectorFromDrag,
} from './movement'

describe('keysToVector', () => {
  it('単一方向のキーは長さ1のベクトルになる', () => {
    expect(keysToVector(new Set(['w']))).toEqual({ x: 0, z: -1 })
    expect(keysToVector(new Set(['s']))).toEqual({ x: 0, z: 1 })
    expect(keysToVector(new Set(['a']))).toEqual({ x: -1, z: 0 })
    expect(keysToVector(new Set(['d']))).toEqual({ x: 1, z: 0 })
  })

  it('矢印キーもWASDと同じ扱い', () => {
    expect(keysToVector(new Set(['arrowup']))).toEqual({ x: 0, z: -1 })
    expect(keysToVector(new Set(['arrowright']))).toEqual({ x: 1, z: 0 })
  })

  it('斜め移動は正規化され、直進より速くならない', () => {
    const diagonal = keysToVector(new Set(['w', 'd']))
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(1)
  })

  it('相反するキーの同時押しは打ち消し合う', () => {
    expect(keysToVector(new Set(['w', 's']))).toEqual({ x: 0, z: 0 })
    expect(keysToVector(new Set(['a', 'd']))).toEqual({ x: 0, z: 0 })
  })

  it('未入力ならゼロベクトル', () => {
    expect(keysToVector(new Set())).toEqual({ x: 0, z: 0 })
  })
})

describe('normalize', () => {
  it('長さ1以下のベクトルはそのまま(微入力を速度に反映する)', () => {
    expect(normalize({ x: 0.3, z: 0 })).toEqual({ x: 0.3, z: 0 })
    expect(normalize({ x: 0, z: 0 })).toEqual({ x: 0, z: 0 })
  })

  it('長さ1を超えるベクトルは長さ1に丸める', () => {
    const result = normalize({ x: 3, z: 4 })
    expect(Math.hypot(result.x, result.z)).toBeCloseTo(1)
    expect(result.x).toBeCloseTo(0.6)
  })
})

describe('resolveMoveVector', () => {
  it('キーボードのみの入力を返す', () => {
    expect(resolveMoveVector(new Set(['d']), { x: 0, z: 0 })).toEqual({ x: 1, z: 0 })
  })

  it('スティックのみの入力を返す(微入力はそのまま)', () => {
    expect(resolveMoveVector(new Set(), { x: 0.4, z: -0.2 })).toEqual({
      x: 0.4,
      z: -0.2,
    })
  })

  it('同時入力でも長さ1を超えない', () => {
    const result = resolveMoveVector(new Set(['d']), { x: 1, z: 0 })
    expect(Math.hypot(result.x, result.z)).toBeCloseTo(1)
  })

  it('キーボードとスティックが逆方向なら打ち消し合う', () => {
    expect(resolveMoveVector(new Set(['a']), { x: 1, z: 0 })).toEqual({ x: 0, z: 0 })
  })
})

describe('stickVectorFromDrag', () => {
  it('半径いっぱいのドラッグで長さ1', () => {
    const result = stickVectorFromDrag(0, 60, 60)
    expect(result).toEqual({ x: 0, z: 1 })
  })

  it('半分のドラッグは半分の速度になる', () => {
    expect(stickVectorFromDrag(30, 0, 60)).toEqual({ x: 0.5, z: 0 })
  })

  it('半径を超えるドラッグは端で頭打ちになる', () => {
    const result = stickVectorFromDrag(200, 200, 60)
    expect(Math.hypot(result.x, result.z)).toBeCloseTo(1)
  })

  it('半径0では移動しない(ゼロ除算の防御)', () => {
    expect(stickVectorFromDrag(10, 10, 0)).toEqual({ x: 0, z: 0 })
  })
})
