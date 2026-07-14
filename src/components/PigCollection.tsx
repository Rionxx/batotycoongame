import { PIG_CATALOG, PIG_RATE_BONUS } from '../logic/constants'
import { useGameStore } from '../store/gameStore'
import { useCaughtSpeciesCount } from '../store/selectors'
import { PIG_SPECIES_IDS } from '../types/game'
import type { PigSpeciesId } from '../types/game'
import { formatPercent } from './format'
import { PIG_EMOJI, RARITY_LABEL } from './pigEmoji'

function PigCard({ id }: { id: PigSpeciesId }) {
  const entry = useGameStore((s) => s.pigCollection[id])
  const species = PIG_CATALOG[id]
  const caught = entry.count > 0

  return (
    <li
      className={`pig-card pig-card--${species.rarity} ${caught ? '' : 'pig-card--unknown'}`}
      title={caught ? species.name : '未発見'}
    >
      <span className="pig-card__emoji" aria-hidden>
        {caught ? PIG_EMOJI[id] : '❓'}
      </span>
      <span className="pig-card__name">{caught ? species.name : '???'}</span>
      <span className="pig-card__rarity">{RARITY_LABEL[species.rarity]}</span>
      {caught && (
        <span className="pig-card__meta">
          +{formatPercent(PIG_RATE_BONUS[species.rarity])}
          {entry.count > 1 && ` ×${entry.count}`}
        </span>
      )}
    </li>
  )
}

/** 収集済みの豚の図鑑表示 */
export function PigCollection() {
  const caughtCount = useCaughtSpeciesCount()

  return (
    <section className="pig-collection">
      <h2>
        豚図鑑{' '}
        <span className="pig-collection__progress">
          {caughtCount} / {PIG_SPECIES_IDS.length}
        </span>
      </h2>
      <ul className="pig-collection__grid">
        {PIG_SPECIES_IDS.map((id) => (
          <PigCard key={id} id={id} />
        ))}
      </ul>
    </section>
  )
}
