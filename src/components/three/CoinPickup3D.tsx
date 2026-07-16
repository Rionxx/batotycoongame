/** フィールドに出現するコイン山。キャラクター接触またはクリックで回収する */
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { useGameStore } from '../../store/gameStore'
import type { CoinPickupState } from '../../types/game'
import { fieldWorldPosition } from './worldLayout'

export function CoinPickup3D({ pickup }: { pickup: CoinPickupState }) {
  const collectCoinPickup = useGameStore((s) => s.collectCoinPickup)
  const coinRef = useRef<Group>(null)
  const [x, z] = fieldWorldPosition(pickup.x, pickup.y)

  useFrame(({ clock }) => {
    const coin = coinRef.current
    if (!coin) return
    const t = clock.getElapsedTime()
    coin.rotation.y = t * 2.2 // くるくる回って目立たせる
    coin.position.y = 0.75 + Math.sin(t * 2) * 0.08
  })

  return (
    <group
      position={[x, 0, z]}
      onClick={(event) => {
        event.stopPropagation()
        collectCoinPickup(Date.now())
      }}
    >
      {/* 積まれたコイン */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.12, 18]} />
        <meshStandardMaterial color="#d9a514" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0.14, 0.18, 0.08]}>
        <cylinderGeometry args={[0.3, 0.3, 0.12, 18]} />
        <meshStandardMaterial color="#e8b93a" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[-0.1, 0.3, -0.05]}>
        <cylinderGeometry args={[0.2, 0.2, 0.12, 18]} />
        <meshStandardMaterial color="#f2cf5b" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* 立って回転する1枚(遠くからの視認用) */}
      <group ref={coinRef} position={[0, 0.75, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.06, 20]} />
          <meshStandardMaterial
            color="#f5c518"
            emissive="#f5c518"
            emissiveIntensity={0.4}
            metalness={0.6}
            roughness={0.25}
          />
        </mesh>
      </group>
    </group>
  )
}
