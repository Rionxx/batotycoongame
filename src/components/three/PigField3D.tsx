import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { PIG_CATALOG } from '../../logic/constants'
import { useGameStore } from '../../store/gameStore'
import { usePigSpawnChance } from '../../store/selectors'
import type { ActivePig, PigRarity } from '../../types/game'
import { formatPercent } from '../format'

/**
 * 牧場ビューの3D実装(React Three Fiber)。
 * 出現・捕獲の判定と座標(0〜1の相対値)はロジック/ストア層の既存実装を
 * そのまま使い、このファイルは「描画方法」だけを差し替える。
 */

/** ストアの相対座標(0〜1)を3D空間の座標にマッピングする */
const FIELD_HALF_WIDTH = 3
const FIELD_HALF_DEPTH = 1.8

const RARITY_BODY_COLOR: Record<PigRarity, string> = {
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

function Pig3D({ pig }: { pig: ActivePig }) {
  const capturePig = useGameStore((s) => s.capturePig)
  const rarity = PIG_CATALOG[pig.speciesId].rarity
  const groupRef = useRef<Group>(null)

  const x = (pig.x - 0.5) * 2 * FIELD_HALF_WIDTH
  const z = (pig.y - 0.5) * 2 * FIELD_HALF_DEPTH

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

/** 牧場の地面と柵 */
function Pasture() {
  const posts: [number, number][] = []
  for (let x = -FIELD_HALF_WIDTH; x <= FIELD_HALF_WIDTH; x += 1.5) {
    posts.push([x, -FIELD_HALF_DEPTH], [x, FIELD_HALF_DEPTH])
  }
  for (let z = -FIELD_HALF_DEPTH; z <= FIELD_HALF_DEPTH; z += 1.2) {
    posts.push([-FIELD_HALF_WIDTH, z], [FIELD_HALF_WIDTH, z])
  }

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[FIELD_HALF_WIDTH * 2 + 1.2, FIELD_HALF_DEPTH * 2 + 1.2]} />
        <meshStandardMaterial color="#8fbf6a" />
      </mesh>
      {posts.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.25, z]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
          <meshStandardMaterial color="#9c7a4f" />
        </mesh>
      ))}
    </group>
  )
}

/** 牧場フィールド(3D)。出現中の豚をクリックで捕獲する */
export function PigField3D() {
  const activePig = useGameStore((s) => s.activePig)
  const spawnChance = usePigSpawnChance()

  return (
    <section className="pig-field">
      <h2>
        牧場{' '}
        <span className="pig-field__chance">出現率 {formatPercent(spawnChance)} / 30秒</span>
      </h2>
      <div className="pig-field__area pig-field__area--3d">
        <Canvas camera={{ position: [0, 3.2, 5.2], fov: 45 }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[4, 6, 3]} intensity={1.1} />
          <Pasture />
          {activePig && <Pig3D pig={activePig} />}
        </Canvas>
        {!activePig && (
          <p className="pig-field__empty pig-field__empty--3d">
            豚が現れるのを待っています…
          </p>
        )}
      </div>
    </section>
  )
}
