/**
 * 3Dワールドの配置定義(UI層専用)。
 * ロジック層の相対座標(0〜1)とワールド座標の変換もここに集約する。
 */
import type { BuildingId } from '../../types/game'

/** 地面の半径(x方向・z方向) */
export const WORLD_HALF_WIDTH = 10
export const WORLD_HALF_DEPTH = 6

/** プレイヤーが移動できる範囲(柵の内側) */
export const PLAYER_BOUND_X = 9
export const PLAYER_BOUND_Z = 5.2

/** プレイヤーの移動速度(ユニット/秒) */
export const PLAYER_SPEED = 4.5

/** 施設のワールド座標(四隅に配置) */
export const BUILDING_POSITIONS: Record<BuildingId, [number, number]> = {
  feedingTrough: [-6.5, -3.4],
  pigPen: [6.5, -3.4],
  market: [-6.5, 3.4],
  signboard: [6.5, 3.4],
}

/** 施設の強化プロンプトが出る距離 */
export const BUILDING_INTERACT_DISTANCE = 2.0

/** 豚に接触したとみなす距離(自動捕獲) */
export const PIG_CAPTURE_DISTANCE = 1.0

/** 豚の相対座標(0〜1)を中央エリアのワールド座標へマッピングする */
export function pigWorldPosition(relX: number, relY: number): [number, number] {
  return [(relX - 0.5) * 8, (relY - 0.5) * 4.4]
}
