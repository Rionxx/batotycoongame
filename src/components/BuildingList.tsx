import { BUILDINGS } from '../logic/constants'
import { useGameStore } from '../store/gameStore'
import { useCanUpgrade, useUpgradeCost } from '../store/selectors'
import type { BuildingId, BuildingSpec } from '../types/game'
import { BUILDING_IDS } from '../types/game'
import { formatCoins } from './format'

const BUILDING_ICON: Record<BuildingId, string> = {
  feedingTrough: '🌾',
  pigPen: '🏠',
  market: '🏪',
  signboard: '📢',
}

function effectDescription(spec: BuildingSpec): string {
  switch (spec.effectType) {
    case 'flatRate':
      return `コイン生成 +${spec.effectPerLevel}/秒`
    case 'rateMultiplier':
      return `全体レート +${Math.round(spec.effectPerLevel * 100)}%`
    case 'pigSpawnChance':
      return `豚の出現率 +${Math.round(spec.effectPerLevel * 100)}%`
  }
}

function BuildingRow({ id }: { id: BuildingId }) {
  const spec = BUILDINGS[id]
  const level = useGameStore((s) => s.buildingLevels[id])
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding)
  const cost = useUpgradeCost(id)
  const enabled = useCanUpgrade(id)
  const isMax = cost === null

  return (
    <li className="building-row">
      <span className="building-row__icon" aria-hidden>
        {BUILDING_ICON[id]}
      </span>
      <div className="building-row__info">
        <div className="building-row__name">
          {spec.name} <span className="building-row__level">Lv.{level}</span>
        </div>
        <div className="building-row__effect">{effectDescription(spec)}(1Lvごと)</div>
      </div>
      <button
        type="button"
        className="building-row__upgrade"
        disabled={!enabled}
        onClick={() => upgradeBuilding(id)}
      >
        {isMax ? 'MAX' : `🪙 ${formatCoins(cost)}`}
      </button>
    </li>
  )
}

/** 施設一覧とアップグレードボタン */
export function BuildingList() {
  return (
    <section className="building-list">
      <h2>施設</h2>
      <ul>
        {BUILDING_IDS.map((id) => (
          <BuildingRow key={id} id={id} />
        ))}
      </ul>
    </section>
  )
}
