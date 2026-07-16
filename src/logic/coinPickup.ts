/**
 * コイン山(フィールドで拾う手動収集)の純粋関数群。
 * 仕様: docs/requirements.md「コイン山」の節を参照。
 */
import type { Rng } from './pigCollection'
import { COIN_PICKUP_RATE_SECONDS } from './constants'

/** コイン山の出現位置(0〜1の相対座標。UI層がワールド座標へ変換する) */
export interface CoinPickup {
  x: number
  y: number
}

/** 回収額 = floor(現在レート × 8秒分) */
export function calculateCoinPickupValue(ratePerSecond: number): number {
  return Math.floor(ratePerSecond * COIN_PICKUP_RATE_SECONDS)
}

/** 再出現してよいか(前回回収からの経過で判定) */
export function shouldRespawnCoinPickup(nowMs: number, respawnAtMs: number): boolean {
  return nowMs >= respawnAtMs
}

/** ランダムな位置にコイン山を生成する */
export function spawnCoinPickup(rng: Rng): CoinPickup {
  return { x: rng(), y: rng() }
}
