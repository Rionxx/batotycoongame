import { PRESTIGE_MEDAL_DIVISOR } from '../logic/constants'
import { useGameStore } from '../store/gameStore'
import { useCanPrestige, useMedalMultiplier, useMedalsGain } from '../store/selectors'
import { formatCoins, formatPercent } from './format'

/** 転生パネル。獲得予定メダルの表示と転生の実行(確認ダイアログつき) */
export function PrestigePanel() {
  const prestige = useGameStore((s) => s.prestige)
  const runCoinsEarned = useGameStore((s) => s.runCoinsEarned)
  const doPrestige = useGameStore((s) => s.doPrestige)
  const medalsGain = useMedalsGain()
  const enabled = useCanPrestige()
  const multiplier = useMedalMultiplier()

  const handlePrestige = () => {
    const ok = window.confirm(
      `転生すると 🥇${medalsGain}枚 の金の豚メダルを獲得します(以後ずっとレート+${medalsGain * 5}%)。\n` +
        'コイン・施設レベルはリセットされます(豚図鑑と実績は残ります)。\n転生しますか?',
    )
    if (ok) doPrestige(Date.now())
  }

  return (
    <section className="prestige-panel">
      <h2>
        転生{' '}
        {prestige.medals > 0 && (
          <span className="prestige-panel__medals">
            🥇 ×{prestige.medals}(レート ×{multiplier.toFixed(2)})
          </span>
        )}
      </h2>
      <p className="prestige-panel__info">
        この周回で稼いだコイン: 🪙 {formatCoins(runCoinsEarned)}
        <br />
        いま転生すると <strong>🥇 {medalsGain}枚</strong> 獲得
        (メダル1枚 = 生成レート +{formatPercent(0.05)} 永続)
      </p>
      <button
        type="button"
        className="prestige-panel__button"
        disabled={!enabled}
        onClick={handlePrestige}
      >
        {enabled
          ? `🥇 ${medalsGain}枚もらって転生する`
          : `🪙 ${formatCoins(PRESTIGE_MEDAL_DIVISOR)} 稼ぐと転生できます`}
      </button>
    </section>
  )
}
