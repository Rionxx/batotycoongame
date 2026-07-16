import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { PIG_CATALOG } from '../../logic/constants'
import { useGameStore } from '../../store/gameStore'
import type { ActivePig, PigRarity } from '../../types/game'
import { fieldWorldPosition } from './worldLayout'

export const RARITY_BODY_COLOR: Record<PigRarity, string> = {
  common: '#f2a0b5',
  rare: '#9ec4ef',
  epic: '#d5a3ea',
}

/** レア度が高いほど強く光る(エピックは一目でわかるように) */
const RARITY_EMISSIVE_INTENSITY: Record<PigRarity, number> = {
  common: 0,
  rare: 0.25,
  epic: 0.6,
}

/** ワールドに出現中の豚。クリックまたはキャラクターの接触で捕獲される */
export function Pig3D({ pig }: { pig: ActivePig }) {
  const capturePig = useGameStore((s) => s.capturePig)
  const rarity = PIG_CATALOG[pig.speciesId].rarity
  const groupRef = useRef<Group>(null)

  const [x, z] = fieldWorldPosition(pig.x, pig.y)

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const t = clock.getElapsedTime()
    group.position.y = 0.45 + Math.abs(Math.sin(t * 5)) * 0.12 // ぴょこぴょこ跳ねる
    group.rotation.y = Math.sin(t * 2) * 0.5
  })

  const color = RARITY_BODY_COLOR[rarity]
  const emissiveIntensity = RARITY_EMISSIVE_INTENSITY[rarity]

  return (
    <group
      ref={groupRef}
      position={[x, 0.45, z]}
      onClick={(event) => {
        event.stopPropagation()
        capturePig()
      }}
    >
      {/* 胴体 */}
      <mesh scale={[1, 0.8, 1.25]}>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* 頭 */}
      <mesh position={[0, 0.12, 0.5]}>
        <sphereGeometry args={[0.26, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* 鼻 */}
      <mesh position={[0, 0.08, 0.76]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
        <meshStandardMaterial color="#d97b93" />
      </mesh>
      {/* 耳 ×2 */}
      <mesh position={[-0.14, 0.36, 0.42]} rotation={[-0.4, 0, 0.3]}>
        <coneGeometry args={[0.08, 0.18, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.14, 0.36, 0.42]} rotation={[-0.4, 0, -0.3]}>
        <coneGeometry args={[0.08, 0.18, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
