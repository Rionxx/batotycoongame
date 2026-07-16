import { useEffect } from 'react'
import { ACHIEVEMENTS } from '../logic/constants'
import { useGameStore } from '../store/gameStore'
import { ACHIEVEMENT_IDS } from '../types/game'
import type { AchievementId } from '../types/game'

/** トーストの自動消去までの時間(ms)。UI演出のみの値なのでここに置く */
const TOAST_DURATION_MS = 4000

function AchievementRow({ id }: { id: AchievementId }) {
  const unlockedAt = useGameStore((s) => s.achievements[id])
  const spec = ACHIEVEMENTS[id]
  const unlocked = unlockedAt !== null

  return (
    <li
      className={`achievement-row ${unlocked ? 'achievement-row--unlocked' : ''}`}
      title={spec.description}
    >
      <span className="achievement-row__badge" aria-hidden>
        {unlocked ? '🏅' : '🔒'}
      </span>
      <div className="achievement-row__info">
        <span className="achievement-row__name">{spec.name}</span>
        <span className="achievement-row__desc">{spec.description}</span>
      </div>
    </li>
  )
}

/** 実績一覧パネル */
export function AchievementPanel() {
  const unlockedCount = useGameStore(
    (s) => ACHIEVEMENT_IDS.filter((id) => s.achievements[id] !== null).length,
  )

  return (
    <section className="achievement-panel">
      <h2>
        実績{' '}
        <span className="achievement-panel__progress">
          {unlockedCount} / {ACHIEVEMENT_IDS.length}
        </span>
      </h2>
      <ul className="achievement-panel__list">
        {ACHIEVEMENT_IDS.map((id) => (
          <AchievementRow key={id} id={id} />
        ))}
      </ul>
    </section>
  )
}

/** 実績解除トースト(数秒表示して自動で消える) */
export function AchievementToast() {
  const recentUnlocks = useGameStore((s) => s.recentUnlocks)
  const clearRecentUnlocks = useGameStore((s) => s.clearRecentUnlocks)

  useEffect(() => {
    if (recentUnlocks.length === 0) return
    const id = setTimeout(clearRecentUnlocks, TOAST_DURATION_MS)
    return () => clearTimeout(id)
  }, [recentUnlocks, clearRecentUnlocks])

  if (recentUnlocks.length === 0) return null

  return (
    <div className="achievement-toast" role="status">
      {recentUnlocks.map((id) => (
        <div key={id} className="achievement-toast__item">
          🏅 実績解除: <strong>{ACHIEVEMENTS[id].name}</strong>
        </div>
      ))}
    </div>
  )
}
