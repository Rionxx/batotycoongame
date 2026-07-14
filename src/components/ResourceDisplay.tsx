import { useGameStore } from '../store/gameStore'
import { useCoinsPerSecond, usePigBonus } from '../store/selectors'
import { formatCoins, formatPercent, formatRate } from './format'

/** 現在のコイン数・毎秒増加量・手動タップボタン */
export function ResourceDisplay() {
  const coins = useGameStore((s) => s.coins)
  const tapCoin = useGameStore((s) => s.tapCoin)
  const rate = useCoinsPerSecond()
  const pigBonus = usePigBonus()

  return (
    <header className="resource-display">
      <div className="resource-display__coins">
        <span className="resource-display__icon" aria-hidden>
          🪙
        </span>
        <span className="resource-display__amount">{formatCoins(coins)}</span>
      </div>
      <div className="resource-display__rate">
        +{formatRate(rate)} /秒
        {pigBonus > 0 && (
          <span className="resource-display__bonus">
            (豚ボーナス +{formatPercent(pigBonus)})
          </span>
        )}
      </div>
      <button type="button" className="resource-display__tap" onClick={tapCoin}>
        🪙 タップで +1
      </button>
    </header>
  )
}
