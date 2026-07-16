import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { MutableRefObject } from 'react'
import { Group, Vector3 } from 'three'
import { PLAYER_BOUND_X, PLAYER_BOUND_Z, PLAYER_SPEED } from './worldLayout'
import { useKeyboard } from './useKeyboard'

interface Player3DProps {
  /** プレイヤーの現在位置。毎フレーム更新され、親の近接判定から参照される */
  positionRef: MutableRefObject<Vector3>
}

/** 操作キャラクター(牧場主)。WASD/矢印キーで移動し、カメラが追従する */
export function Player3D({ positionRef }: Player3DProps) {
  const groupRef = useRef<Group>(null)
  const pressed = useKeyboard()
  const cameraTarget = useRef(new Vector3())

  useFrame(({ camera }, delta) => {
    const group = groupRef.current
    if (!group) return

    const keys = pressed.current
    let dx = 0
    let dz = 0
    if (keys.has('w') || keys.has('arrowup')) dz -= 1
    if (keys.has('s') || keys.has('arrowdown')) dz += 1
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1
    if (keys.has('d') || keys.has('arrowright')) dx += 1

    if (dx !== 0 || dz !== 0) {
      const length = Math.hypot(dx, dz)
      const step = (PLAYER_SPEED * delta) / length
      group.position.x = Math.max(
        -PLAYER_BOUND_X,
        Math.min(PLAYER_BOUND_X, group.position.x + dx * step),
      )
      group.position.z = Math.max(
        -PLAYER_BOUND_Z,
        Math.min(PLAYER_BOUND_Z, group.position.z + dz * step),
      )
      group.rotation.y = Math.atan2(dx, dz) // 進行方向を向く
    }

    positionRef.current.copy(group.position)

    // 三人称の追従カメラ(固定オフセット)
    cameraTarget.current.set(group.position.x, group.position.y + 5.5, group.position.z + 7)
    camera.position.lerp(cameraTarget.current, 0.08)
    camera.lookAt(group.position.x, group.position.y + 0.6, group.position.z)
  })

  return (
    <group ref={groupRef} position={[0, 0, 3.5]}>
      {/* 体(オーバーオール) */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.28, 0.34, 0.7, 16]} />
        <meshStandardMaterial color="#4a7fb5" />
      </mesh>
      {/* 頭 */}
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.26, 20, 20]} />
        <meshStandardMaterial color="#f5cba7" />
      </mesh>
      {/* 麦わら帽子 */}
      <mesh position={[0, 1.24, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.04, 20]} />
        <meshStandardMaterial color="#e3c76f" />
      </mesh>
      <mesh position={[0, 1.32, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.16, 20]} />
        <meshStandardMaterial color="#e3c76f" />
      </mesh>
      {/* 腕 ×2 */}
      <mesh position={[-0.38, 0.55, 0]} rotation={[0, 0, 0.35]}>
        <cylinderGeometry args={[0.07, 0.07, 0.5, 10]} />
        <meshStandardMaterial color="#f5cba7" />
      </mesh>
      <mesh position={[0.38, 0.55, 0]} rotation={[0, 0, -0.35]}>
        <cylinderGeometry args={[0.07, 0.07, 0.5, 10]} />
        <meshStandardMaterial color="#f5cba7" />
      </mesh>
    </group>
  )
}
