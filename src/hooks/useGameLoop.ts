import { useEffect } from 'react'
import { TICK_INTERVAL_MS } from '../logic/constants'
import { useGameStore } from '../store/gameStore'

/**
 * ゲームループ。マウント時にオフライン精算を行い、以後1秒ごとにtickを回す。
 * tickは「前回時刻との差分」で計算するため、タイマーが間引かれても取りこぼさない。
 */
export function useGameLoop(): void {
  const tick = useGameStore((s) => s.tick)
  const applyOfflineProgress = useGameStore((s) => s.applyOfflineProgress)

  useEffect(() => {
    applyOfflineProgress(Date.now())
    const id = setInterval(() => tick(Date.now()), TICK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [tick, applyOfflineProgress])
}
