/**
 * 3Dワールドの配置定義(UI層専用)。
 * ロジック層の相対座標(0〜1)とワールド座標の変換もここに集約する。
 */
import type { BuildingId } from '../../types/game'

/** 地面の半径(x方向・z方向)。フェーズ10で 10×6 → 14×9 に拡大 */
export const WORLD_HALF_WIDTH = 14
export const WORLD_HALF_DEPTH = 9

/** プレイヤーが移動できる範囲(柵の内側) */
export const PLAYER_BOUND_X = 13
export const PLAYER_BOUND_Z = 8.2

/** プレイヤーの移動速度(ユニット/秒) */
export const PLAYER_SPEED = 5

/** プレイヤーの初期位置 */
export const PLAYER_START: [number, number] = [0, 6]

/** 施設のワールド座標 */
export const BUILDING_POSITIONS: Record<BuildingId, [number, number]> = {
  feedingTrough: [-10.5, -5.5],
  pigPen: [10.5, -5.5],
  market: [10.5, 4.5],
  signboard: [-10.5, 0],
}

/** ワールド内のインタラクト対象(施設 + 転生の祠 + 飼育場の看板) */
export type WorldInteractableId = BuildingId | 'prestige' | 'penSign'

/** 転生の祠の位置(ワールド上部中央) */
export const PRESTIGE_SHRINE_POSITION: [number, number] = [0, -7.3]

/** 飼育場のエリア(柵で囲む矩形) */
export const PEN_MIN_X = -13
export const PEN_MAX_X = -6
export const PEN_MIN_Z = 3.5
export const PEN_MAX_Z = 8

/** 飼育場の看板(図鑑オーバーレイのトリガー)の位置 */
export const PEN_SIGN_POSITION: [number, number] = [-5.2, 5.5]

/** インタラクト対象ごとの位置と反応距離 */
export const INTERACTABLES: Record<
  WorldInteractableId,
  { position: [number, number]; radius: number }
> = {
  feedingTrough: { position: BUILDING_POSITIONS.feedingTrough, radius: 2.2 },
  pigPen: { position: BUILDING_POSITIONS.pigPen, radius: 2.2 },
  market: { position: BUILDING_POSITIONS.market, radius: 2.2 },
  signboard: { position: BUILDING_POSITIONS.signboard, radius: 2.2 },
  prestige: { position: PRESTIGE_SHRINE_POSITION, radius: 2.4 },
  penSign: { position: PEN_SIGN_POSITION, radius: 2.6 },
}

/** 豚に接触したとみなす距離(自動捕獲) */
export const PIG_CAPTURE_DISTANCE = 1.0

/** コイン山に接触したとみなす距離(自動回収) */
export const COIN_PICKUP_DISTANCE = 1.1

/**
 * 相対座標(0〜1)を中央の開けたエリアのワールド座標へマッピングする。
 * 飼育場(左手前)や施設と重ならない範囲に収める。豚とコイン山で共用
 */
export function fieldWorldPosition(relX: number, relY: number): [number, number] {
  return [relX * 14 - 5, relY * 10 - 5]
}

/** カメラ距離の倍率が最大になるアスペクト比(これ以下は一律で最大) */
const NARROW_ASPECT = 0.6
/** カメラ距離の倍率が等倍になるアスペクト比(これ以上は一律で1) */
const WIDE_ASPECT = 1.5
/** 縦長画面での最大倍率 */
const MAX_DISTANCE_SCALE = 1.6

/**
 * アスペクト比に応じた追従カメラの距離倍率。
 * 縦長(スマホ)は水平方向の視野が狭くなるため、カメラを引いて周囲を見せる。
 */
export function cameraDistanceScale(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect <= NARROW_ASPECT) return MAX_DISTANCE_SCALE
  if (aspect >= WIDE_ASPECT) return 1
  const ratio = (aspect - NARROW_ASPECT) / (WIDE_ASPECT - NARROW_ASPECT)
  return MAX_DISTANCE_SCALE - ratio * (MAX_DISTANCE_SCALE - 1)
}
