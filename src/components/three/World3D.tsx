import { Canvas, useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { Vector3 } from 'three'
import { BUILDINGS } from '../../logic/constants'
import { useGameStore } from '../../store/gameStore'
import { usePigSpawnChance, useUpgradeCost, useCanUpgrade } from '../../store/selectors'
import type { BuildingId } from '../../types/game'
import { BUILDING_IDS } from '../../types/game'
import { formatCoins, formatPercent } from '../format'
import { Buildings3D } from './Buildings3D'
import { Pig3D } from './Pig3D'
import { Player3D } from './Player3D'
import {
  BUILDING_INTERACT_DISTANCE,
  BUILDING_POSITIONS,
  PIG_CAPTURE_DISTANCE,
  WORLD_HALF_DEPTH,
  WORLD_HALF_WIDTH,
  pigWorldPosition,
} from './worldLayout'

/**
 * 近接判定(毎フレーム)。
 * - 最寄りの施設が範囲内なら親へ通知する(値が変わった時だけReact stateを更新)
 * - 豚に接触したら自動で捕獲する
 */
function ProximitySensor({
  playerPos,
  onNearBuildingChange,
}: {
  playerPos: MutableRefObject<Vector3>
  onNearBuildingChange: (id: BuildingId | null) => void
}) {
  const lastNotified = useRef<BuildingId | null>(null)

  useFrame(() => {
    const { x, z } = playerPos.current

    let nearest: BuildingId | null = null
    let nearestDist = BUILDING_INTERACT_DISTANCE
    for (const id of BUILDING_IDS) {
      const [bx, bz] = BUILDING_POSITIONS[id]
      const dist = Math.hypot(x - bx, z - bz)
      if (dist < nearestDist) {
        nearest = id
        nearestDist = dist
      }
    }
    if (nearest !== lastNotified.current) {
      lastNotified.current = nearest
      onNearBuildingChange(nearest)
    }

    // 豚への接触捕獲(ストアの一時状態を非リアクティブに参照する)
    const { activePig, capturePig } = useGameStore.getState()
    if (activePig) {
      const [px, pz] = pigWorldPosition(activePig.x, activePig.y)
      if (Math.hypot(x - px, z - pz) < PIG_CAPTURE_DISTANCE) {
        capturePig()
      }
    }
  })

  return null
}

/** 牧場の地面と柵。地面クリックで手動タップ(+1コイン) */
function Pasture() {
  const tapCoin = useGameStore((s) => s.tapCoin)

  const posts: [number, number][] = []
  for (let x = -WORLD_HALF_WIDTH; x <= WORLD_HALF_WIDTH; x += 2) {
    posts.push([x, -WORLD_HALF_DEPTH], [x, WORLD_HALF_DEPTH])
  }
  for (let z = -WORLD_HALF_DEPTH + 2; z <= WORLD_HALF_DEPTH - 2; z += 2) {
    posts.push([-WORLD_HALF_WIDTH, z], [WORLD_HALF_WIDTH, z])
  }

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={() => tapCoin()}>
        <planeGeometry args={[WORLD_HALF_WIDTH * 2 + 2, WORLD_HALF_DEPTH * 2 + 2]} />
        <meshStandardMaterial color="#8fbf6a" />
      </mesh>
      {posts.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]}>
          <cylinderGeometry args={[0.07, 0.07, 0.7, 8]} />
          <meshStandardMaterial color="#9c7a4f" />
        </mesh>
      ))}
      {/* 横木(4辺) */}
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

/** 出現中の豚(ストア購読はこの小さなコンポーネントに閉じる) */
function ActivePigInWorld() {
  const activePig = useGameStore((s) => s.activePig)
  if (!activePig) return null
  return <Pig3D pig={activePig} />
}

/** 施設接近時の強化プロンプト(DOMオーバーレイ) */
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

/** キャラクター操作型の3Dワールド(Robloxタイクーン風) */
export function World3D() {
  const playerPos = useRef(new Vector3(0, 0, 3.5))
  const [nearBuilding, setNearBuilding] = useState<BuildingId | null>(null)
  const spawnChance = usePigSpawnChance()
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding)

  const handleNearChange = useCallback((id: BuildingId | null) => {
    setNearBuilding(id)
  }, [])

  // 施設の近くでEキーを押すと強化
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E') && nearBuilding) {
        upgradeBuilding(nearBuilding)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [nearBuilding, upgradeBuilding])

  return (
    <section className="world">
      <div className="world__viewport">
        <Canvas camera={{ position: [0, 5.5, 10.5], fov: 50 }}>
          <ambientLight intensity={0.85} />
          <directionalLight position={[6, 10, 4]} intensity={1.1} />
          <Pasture />
          <Buildings3D />
          <ActivePigInWorld />
          <Player3D positionRef={playerPos} />
          <ProximitySensor
            playerPos={playerPos}
            onNearBuildingChange={handleNearChange}
          />
        </Canvas>

        {/* HUDオーバーレイ */}
        <div className="world__hud world__hud--controls">
          🚶 WASD / 矢印キーで移動 ・ 🐷 触れて捕獲 ・ 🏗️ 施設に近づいて [E] で強化
        </div>
        <div className="world__hud world__hud--chance">
          豚の出現率 {formatPercent(spawnChance)} / 30秒
        </div>
        {nearBuilding && <UpgradePrompt id={nearBuilding} />}
      </div>
    </section>
  )
}
