import { Canvas, useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { Vector3 } from 'three'
import { BUILDINGS, PRESTIGE_MEDAL_DIVISOR } from '../../logic/constants'
import { calculateMedalsGain } from '../../logic/prestige'
import { useGameStore } from '../../store/gameStore'
import {
  useCanPrestige,
  useCanUpgrade,
  useMedalsGain,
  usePigSpawnChance,
  useUpgradeCost,
} from '../../store/selectors'
import type { BuildingId } from '../../types/game'
import { BUILDING_IDS } from '../../types/game'
import { formatCoins, formatPercent } from '../format'
import { PigCollection } from '../PigCollection'
import { Buildings3D } from './Buildings3D'
import { CoinPickup3D } from './CoinPickup3D'
import { Decorations3D } from './Decorations3D'
import { Pig3D } from './Pig3D'
import { PigPen3D } from './PigPen3D'
import { Player3D } from './Player3D'
import { PrestigeShrine3D } from './PrestigeShrine3D'
import {
  COIN_PICKUP_DISTANCE,
  INTERACTABLES,
  PIG_CAPTURE_DISTANCE,
  WORLD_HALF_DEPTH,
  WORLD_HALF_WIDTH,
  fieldWorldPosition,
} from './worldLayout'
import type { WorldInteractableId } from './worldLayout'

/** 転生の実行(確認ダイアログつき)。ワールド内のEキーとプロンプトから使う */
function confirmAndPrestige() {
  const { runCoinsEarned, doPrestige } = useGameStore.getState()
  const gain = calculateMedalsGain(runCoinsEarned)
  if (gain < 1) return
  const ok = window.confirm(
    `転生すると 🥇${gain}枚 の金の豚メダルを獲得します(以後ずっとレート+${gain * 5}%)。\n` +
      'コイン・施設レベルはリセットされます(豚図鑑と実績は残ります)。\n転生しますか?',
  )
  if (ok) doPrestige(Date.now())
}

/**
 * 近接判定(毎フレーム)。
 * - 最寄りのインタラクト対象(施設・祠・看板)を親へ通知(値が変わった時だけ)
 * - 豚・コイン山に接触したら自動で捕獲・回収する
 */
function ProximitySensor({
  playerPos,
  onNearChange,
}: {
  playerPos: MutableRefObject<Vector3>
  onNearChange: (id: WorldInteractableId | null) => void
}) {
  const lastNotified = useRef<WorldInteractableId | null>(null)

  useFrame(() => {
    const { x, z } = playerPos.current

    let nearest: WorldInteractableId | null = null
    let bestScore = Infinity
    for (const [id, spec] of Object.entries(INTERACTABLES) as Array<
      [WorldInteractableId, (typeof INTERACTABLES)[WorldInteractableId]]
    >) {
      const dist = Math.hypot(x - spec.position[0], z - spec.position[1])
      if (dist < spec.radius && dist < bestScore) {
        nearest = id
        bestScore = dist
      }
    }
    if (nearest !== lastNotified.current) {
      lastNotified.current = nearest
      onNearChange(nearest)
    }

    // 接触系(ストアの一時状態を非リアクティブに参照する)
    const { activePig, capturePig, coinPickup, collectCoinPickup } =
      useGameStore.getState()
    if (activePig) {
      const [px, pz] = fieldWorldPosition(activePig.x, activePig.y)
      if (Math.hypot(x - px, z - pz) < PIG_CAPTURE_DISTANCE) {
        capturePig()
      }
    }
    if (coinPickup) {
      const [cx, cz] = fieldWorldPosition(coinPickup.x, coinPickup.y)
      if (Math.hypot(x - cx, z - cz) < COIN_PICKUP_DISTANCE) {
        collectCoinPickup(Date.now())
      }
    }
  })

  return null
}

/** 牧場の地面と外周の柵 */
function Pasture() {
  const posts: [number, number][] = []
  for (let x = -WORLD_HALF_WIDTH; x <= WORLD_HALF_WIDTH; x += 2) {
    posts.push([x, -WORLD_HALF_DEPTH], [x, WORLD_HALF_DEPTH])
  }
  for (let z = -WORLD_HALF_DEPTH + 2; z <= WORLD_HALF_DEPTH - 2; z += 2) {
    posts.push([-WORLD_HALF_WIDTH, z], [WORLD_HALF_WIDTH, z])
  }

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WORLD_HALF_WIDTH * 2 + 2, WORLD_HALF_DEPTH * 2 + 2]} />
        <meshStandardMaterial color="#8fbf6a" />
      </mesh>
      {posts.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]}>
          <cylinderGeometry args={[0.07, 0.07, 0.7, 8]} />
          <meshStandardMaterial color="#9c7a4f" />
        </mesh>
      ))}
      <mesh position={[0, 0.55, -WORLD_HALF_DEPTH]}>
        <boxGeometry args={[WORLD_HALF_WIDTH * 2, 0.08, 0.08]} />
        <meshStandardMaterial color="#9c7a4f" />
      </mesh>
      <mesh position={[0, 0.55, WORLD_HALF_DEPTH]}>
        <boxGeometry args={[WORLD_HALF_WIDTH * 2, 0.08, 0.08]} />
        <meshStandardMaterial color="#9c7a4f" />
      </mesh>
      <mesh position={[-WORLD_HALF_WIDTH, 0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[WORLD_HALF_DEPTH * 2, 0.08, 0.08]} />
        <meshStandardMaterial color="#9c7a4f" />
      </mesh>
      <mesh position={[WORLD_HALF_WIDTH, 0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[WORLD_HALF_DEPTH * 2, 0.08, 0.08]} />
        <meshStandardMaterial color="#9c7a4f" />
      </mesh>
    </group>
  )
}

/** 出現中の豚とコイン山(ストア購読をここに閉じる) */
function FieldItems() {
  const activePig = useGameStore((s) => s.activePig)
  const coinPickup = useGameStore((s) => s.coinPickup)
  return (
    <>
      {activePig && <Pig3D pig={activePig} />}
      {coinPickup && <CoinPickup3D pickup={coinPickup} />}
    </>
  )
}

/** 施設接近時の強化プロンプト */
function UpgradePrompt({ id }: { id: BuildingId }) {
  const spec = BUILDINGS[id]
  const level = useGameStore((s) => s.buildingLevels[id])
  const cost = useUpgradeCost(id)
  const affordable = useCanUpgrade(id)

  return (
    <div className={`world-prompt ${affordable ? 'world-prompt--ready' : ''}`}>
      <strong>
        {spec.name} Lv.{level}
      </strong>
      {cost === null ? (
        <span>最大レベルです</span>
      ) : (
        <span>
          強化 🪙 {formatCoins(cost)} —{' '}
          {affordable ? '[E] または クリックで強化!' : 'コインが足りません'}
        </span>
      )}
    </div>
  )
}

/** 転生の祠接近時のプロンプト */
function PrestigePrompt() {
  const prestige = useGameStore((s) => s.prestige)
  const runCoinsEarned = useGameStore((s) => s.runCoinsEarned)
  const gain = useMedalsGain()
  const ready = useCanPrestige()

  return (
    <div className={`world-prompt ${ready ? 'world-prompt--ready' : ''}`}>
      <strong>
        転生の祠 🥇 ×{prestige.medals}
        {prestige.medals > 0 && `(レート+${prestige.medals * 5}%)`}
      </strong>
      <span>この周回のコイン: 🪙 {formatCoins(runCoinsEarned)}</span>
      {ready ? (
        <span>[E] で転生して 🥇{gain}枚 獲得(+{gain * 5}% 永続)</span>
      ) : (
        <span>🪙 {formatCoins(PRESTIGE_MEDAL_DIVISOR)} 稼ぐと転生できます</span>
      )}
    </div>
  )
}

/** キャラクター操作型の3Dワールド(Robloxタイクーン風) */
export function World3D() {
  const playerPos = useRef(new Vector3(0, 0, 6))
  const [near, setNear] = useState<WorldInteractableId | null>(null)
  const spawnChance = usePigSpawnChance()
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding)

  const handleNearChange = useCallback((id: WorldInteractableId | null) => {
    setNear(id)
  }, [])

  // Eキー: 施設の近くなら強化、祠の近くなら転生
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return
      if (near === 'prestige') {
        confirmAndPrestige()
      } else if (near && near !== 'penSign') {
        upgradeBuilding(near)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [near, upgradeBuilding])

  const isBuilding = near !== null && (BUILDING_IDS as readonly string[]).includes(near)

  return (
    <section className="world">
      <div className="world__viewport">
        <Canvas camera={{ position: [0, 6.5, 13], fov: 50 }}>
          <ambientLight intensity={0.85} />
          <directionalLight position={[8, 12, 5]} intensity={1.1} />
          <Pasture />
          <Decorations3D />
          <Buildings3D />
          <PigPen3D />
          <PrestigeShrine3D />
          <FieldItems />
          <Player3D positionRef={playerPos} />
          <ProximitySensor playerPos={playerPos} onNearChange={handleNearChange} />
        </Canvas>

        {/* HUDオーバーレイ */}
        <div className="world__hud world__hud--controls">
          🚶 WASD / 矢印キー ・ 🐷 触れて捕獲 ・ 🪙 コイン山に触れて回収 ・ [E] 強化 / 転生
        </div>
        <div className="world__hud world__hud--chance">
          豚の出現率 {formatPercent(spawnChance)} / 30秒
        </div>

        {isBuilding && <UpgradePrompt id={near as BuildingId} />}
        {near === 'prestige' && <PrestigePrompt />}
        {near === 'penSign' && (
          <div className="world-overlay">
            <PigCollection />
          </div>
        )}
      </div>
    </section>
  )
}
