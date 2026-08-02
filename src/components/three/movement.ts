/**
 * 移動入力の合成(純粋関数)。
 * キーボード(WASD/矢印)とバーチャルスティックの両方を受け取り、
 * 長さ1以下に正規化した移動ベクトルを返す。
 */

/** 移動ベクトル。x = 右方向、z = 奥(-)/手前(+) */
export interface MoveVector {
  x: number
  z: number
}

export const ZERO_MOVE: MoveVector = { x: 0, z: 0 }

/** 押下中のキーから移動ベクトルを作る(斜め移動は正規化する) */
export function keysToVector(keys: ReadonlySet<string>): MoveVector {
  let x = 0
  let z = 0
  if (keys.has('w') || keys.has('arrowup')) z -= 1
  if (keys.has('s') || keys.has('arrowdown')) z += 1
  if (keys.has('a') || keys.has('arrowleft')) x -= 1
  if (keys.has('d') || keys.has('arrowright')) x += 1
  return normalize({ x, z })
}

/** 長さが1を超える場合だけ長さ1に丸める(スティックの微入力は速度に反映させる) */
export function normalize(vector: MoveVector): MoveVector {
  const length = Math.hypot(vector.x, vector.z)
  if (length <= 1 || length === 0) return vector
  return { x: vector.x / length, z: vector.z / length }
}

/**
 * キーボードとスティックの入力を合成する。
 * 両方同時に入力された場合は加算し、長さ1にクランプする。
 */
export function resolveMoveVector(
  keys: ReadonlySet<string>,
  stick: MoveVector,
): MoveVector {
  const fromKeys = keysToVector(keys)
  return normalize({ x: fromKeys.x + stick.x, z: fromKeys.z + stick.z })
}

/**
 * スティックのドラッグ量(中心からのピクセル差分)を移動ベクトルへ変換する。
 * radius を超えたドラッグは端で頭打ちになる。
 */
export function stickVectorFromDrag(
  dx: number,
  dy: number,
  radius: number,
): MoveVector {
  if (radius <= 0) return ZERO_MOVE
  return normalize({ x: dx / radius, z: dy / radius })
}
