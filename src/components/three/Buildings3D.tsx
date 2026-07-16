import { useGameStore } from '../../store/gameStore'
import { useCanUpgrade } from '../../store/selectors'
import type { BuildingId } from '../../types/game'
import { BUILDING_IDS } from '../../types/game'
import { BUILDING_POSITIONS } from './worldLayout'

/** 施設ごとの見た目(プリミティブの組み合わせ) */
function BuildingModel({ id }: { id: BuildingId }) {
  switch (id) {
    case 'feedingTrough': // 飼い葉桶
      return (
        <group>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.7, 0.45, 0.8]} />
            <meshStandardMaterial color="#9c7a4f" />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[1.5, 0.14, 0.6]} />
            <meshStandardMaterial color="#e8c96a" />
          </mesh>
          <mesh position={[-0.7, 0.15, 0.3]}>
            <boxGeometry args={[0.12, 0.3, 0.12]} />
            <meshStandardMaterial color="#7a5c39" />
          </mesh>
          <mesh position={[0.7, 0.15, 0.3]}>
            <boxGeometry args={[0.12, 0.3, 0.12]} />
            <meshStandardMaterial color="#7a5c39" />
          </mesh>
          <mesh position={[-0.7, 0.15, -0.3]}>
            <boxGeometry args={[0.12, 0.3, 0.12]} />
            <meshStandardMaterial color="#7a5c39" />
          </mesh>
          <mesh position={[0.7, 0.15, -0.3]}>
            <boxGeometry args={[0.12, 0.3, 0.12]} />
            <meshStandardMaterial color="#7a5c39" />
          </mesh>
        </group>
      )
    case 'pigPen': // 屋根つきの豚小屋
      return (
        <group>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[1.9, 1.2, 1.6]} />
            <meshStandardMaterial color="#e8b88a" />
          </mesh>
          <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.55, 0.8, 4]} />
            <meshStandardMaterial color="#b5583e" />
          </mesh>
          {/* 入口 */}
          <mesh position={[0, 0.4, 0.81]}>
            <boxGeometry args={[0.6, 0.8, 0.05]} />
            <meshStandardMaterial color="#5c4028" />
          </mesh>
        </group>
      )
    case 'market': // 屋台(赤いひさし)
      return (
        <group>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[1.8, 0.9, 0.9]} />
            <meshStandardMaterial color="#d9c6a0" />
          </mesh>
          <mesh position={[-0.8, 1.2, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
            <meshStandardMaterial color="#7a5c39" />
          </mesh>
          <mesh position={[0.8, 1.2, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
            <meshStandardMaterial color="#7a5c39" />
          </mesh>
          <mesh position={[0, 1.85, 0.1]} rotation={[0.35, 0, 0]}>
            <boxGeometry args={[2.1, 0.08, 1.3]} />
            <meshStandardMaterial color="#d95555" />
          </mesh>
          {/* 商品(コイン袋) */}
          <mesh position={[-0.4, 1.05, 0.15]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color="#d9a514" />
          </mesh>
          <mesh position={[0.3, 1.05, -0.1]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color="#d9a514" />
          </mesh>
        </group>
      )
    case 'signboard': // 立て看板
      return (
        <group>
          <mesh position={[-0.5, 0.8, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 1.6, 8]} />
            <meshStandardMaterial color="#7a5c39" />
          </mesh>
          <mesh position={[0.5, 0.8, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 1.6, 8]} />
            <meshStandardMaterial color="#7a5c39" />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[1.5, 0.9, 0.1]} />
            <meshStandardMaterial color="#f7ecd8" />
          </mesh>
          {/* 看板の豚マーク */}
          <mesh position={[0, 1.15, 0.08]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color="#f2a0b5" />
          </mesh>
        </group>
      )
  }
}

function Building3D({ id }: { id: BuildingId }) {
  const level = useGameStore((s) => s.buildingLevels[id])
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding)
  const affordable = useCanUpgrade(id)
  const [x, z] = BUILDING_POSITIONS[id]

  // レベルに応じてわずかに成長する(視覚的なフィードバック)
  const scale = 1 + Math.min(level, 50) * 0.006

  return (
    <group position={[x, 0, z]}>
      <group
        scale={scale}
        onClick={(event) => {
          event.stopPropagation()
          upgradeBuilding(id)
        }}
      >
        <BuildingModel id={id} />
      </group>
      {/* 購入パッド(Robloxタイクーン風): 強化可能なら緑、不足なら灰色 */}
      <mesh
        position={[0, 0.03, 1.6]}
        onClick={(event) => {
          event.stopPropagation()
          upgradeBuilding(id)
        }}
      >
        <cylinderGeometry args={[0.75, 0.75, 0.06, 24]} />
        <meshStandardMaterial
          color={affordable ? '#5fbf6a' : '#9aa39b'}
          emissive={affordable ? '#5fbf6a' : '#000000'}
          emissiveIntensity={affordable ? 0.35 : 0}
        />
      </mesh>
    </group>
  )
}

/** ワールド四隅の施設一式 */
export function Buildings3D() {
  return (
    <group>
      {BUILDING_IDS.map((id) => (
        <Building3D key={id} id={id} />
      ))}
    </group>
  )
}
