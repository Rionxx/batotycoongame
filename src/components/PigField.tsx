import { PIG_CATALOG } from '../logic/constants'
import { useGameStore } from '../store/gameStore'
import { usePigSpawnChance } from '../store/selectors'
import { formatPercent } from './format'
import { PIG_EMOJI } from './pigEmoji'

/** 牧場フィールド。出現中の豚をタップで捕獲する */
export function PigField() {
  const activePig = useGameStore((s) => s.activePig)
  const capturePig = useGameStore((s) => s.capturePig)
  const spawnChance = usePigSpawnChance()

  return (
    <section className="pig-field">
      <h2>
        牧場{' '}
        <span className="pig-field__chance">出現率 {formatPercent(spawnChance)} / 30秒</span>
      </h2>
      <div className="pig-field__area">
        {activePig ? (
          <button
            type="button"
            className={`pig-field__pig pig-field__pig--${PIG_CATALOG[activePig.speciesId].rarity}`}
            style={{
              left: `${10 + activePig.x * 80}%`,
              top: `${15 + activePig.y * 70}%`,
            }}
            onClick={capturePig}
            aria-label={`${PIG_CATALOG[activePig.speciesId].name}を捕獲`}
          >
            {PIG_EMOJI[activePig.speciesId]}
          </button>
        ) : (
          <p className="pig-field__empty">豚が現れるのを待っています…</p>
        )}
      </div>
    </section>
  )
}
