/**
 * 飼育場: 図鑑に登録済みの豚(種類ごとに1匹)が歩き回る柵付きエリア。
 * 徘徊はUI層の演出(sin/cosの揺らぎ)で、ロジック層の状態は参照のみ。
 */
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { PIG_CATALOG } from '../../logic/constants'
import { useGameStore } from '../../store/gameStore'
import { PIG_SPECIES_IDS } from '../../types/game'
import type { PigSpeciesId } from '../../types/game'
import { RARITY_BODY_COLOR } from './Pig3D'
import {
  PEN_MAX_X,
  PEN_MAX_Z,
  PEN_MIN_X,
  PEN_MIN_Z,
  PEN_SIGN_POSITION,
} from './worldLayout'

/** 種類ごとの定位置(飼育場内のグリッド)と揺らぎの位相 */
function penHome(index: number): { x: number; z: number; phase: number } {
  const col = index % 4
  const row = Math.floor(index / 4)
  return {
    x: PEN_MIN_X + 1.1 + col * 1.7,
    z: PEN_MIN_Z + 0.9 + row * 1.5,
    phase: index * 1.7,
  }
}

function PenPig({ speciesId, index }: { speciesId: PigSpeciesId; index: number }) {
  const groupRef = useRef<Group>(null)
  const color = RARITY_BODY_COLOR[PIG_CATALOG[speciesId].rarity]
  const home = penHome(index)

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const t = clock.getElapsedTime()
    // 定位置のまわりをのんびり歩き回る
    const dx = Math.sin(t * 0.5 + home.phase) * 0.55
    const dz = Math.cos(t * 0.35 + home.phase) * 0.45
    group.position.set(home.x + dx, 0.28, home.z + dz)
    group.rotation.y = Math.atan2(
      Math.cos(t * 0.5 + home.phase),
      -Math.sin(t * 0.35 + home.phase),
    )
  })

  return (
    <group ref={groupRef} scale={0.7}>
      <mesh scale={[1, 0.8, 1.25]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.12, 0.5]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.14, 0.36, 0.42]} rotation={[-0.4, 0, 0.3]}>
        <coneGeometry args={[0.08, 0.18, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.14, 0.36, 0.42]} rotation={[-0.4, 0, -0.3]}>
        <coneGeometry args={[0.08, 0.18, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

/** 飼育場の柵(木の杭と横木)。看板側の東辺に出入口の隙間を空ける */
function PenFence() {
  const posts: [number, number][] = []
  for (let x = PEN_MIN_X; x <= PEN_MAX_X; x += 1.4) {
    posts.push([x, PEN_MIN_Z], [x, PEN_MAX_Z])
  }
  for (let z = PEN_MIN_Z; z <= PEN_MAX_Z; z += 1.5) {
    posts.push([PEN_MIN_X, z])
    if (z < PEN_MIN_Z + 1 || z > PEN_MAX_Z - 1) {
      posts.push([PEN_MAX_X, z]) // 東辺は中央を出入口として空ける
    }
  }
  const midX = (PEN_MIN_X + PEN_MAX_X) / 2
  const midZ = (PEN_MIN_Z + PEN_MAX_Z) / 2
  const width = PEN_MAX_X - PEN_MIN_X
  const depth = PEN_MAX_Z - PEN_MIN_Z

  return (
    <group>
      {posts.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.3, z]}>
          <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
          <meshStandardMaterial color="#9c7a4f" />
        </mesh>
      ))}
      <mesh position={[midX, 0.48, PEN_MIN_Z]}>
        <boxGeometry args={[width, 0.07, 0.07]} />
        <meshStandardMaterial color="#9c7a4f" />
      </mesh>
      <mesh position={[midX, 0.48, PEN_MAX_Z]}>
        <boxGeometry args={[width, 0.07, 0.07]} />
        <meshStandardMaterial color="#9c7a4f" />
      </mesh>
      <mesh position={[PEN_MIN_X, 0.48, midZ]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[depth, 0.07, 0.07]} />
        <meshStandardMaterial color="#9c7a4f" />
      </mesh>
      {/* 飼育場の地面(少し色を変える) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[midX, 0.015, midZ]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#c9b57e" />
      </mesh>
    </group>
  )
}

/** 図鑑オーバーレイのトリガーになる看板 */
function PenSign() {
  const [x, z] = PEN_SIGN_POSITION
  return (
    <group position={[x, 0, z]} rotation={[0, -Math.PI / 6, 0]}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.1, 8]} />
        <meshStandardMaterial color="#7a5c39" />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[1.1, 0.6, 0.08]} />
        <meshStandardMaterial color="#f7ecd8" />
      </mesh>
      <mesh position={[0, 1.0, 0.06]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#f2a0b5" />
      </mesh>
    </group>
  )
}

/** 飼育場一式(柵・看板・捕獲済みの豚) */
export function PigPen3D() {
  const pigCollection = useGameStore((s) => s.pigCollection)
  const caught = PIG_SPECIES_IDS.filter((id) => pigCollection[id].count > 0)

  return (
    <group>
      <PenFence />
      <PenSign />
      {caught.map((id, index) => (
        <PenPig key={id} speciesId={id} index={index} />
      ))}
    </group>
  )
}
