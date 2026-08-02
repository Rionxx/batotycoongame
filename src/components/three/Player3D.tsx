import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { MutableRefObject } from 'react'
import { Group, Vector3 } from 'three'
import {
  PLAYER_BOUND_X,
  PLAYER_BOUND_Z,
  PLAYER_SPEED,
  PLAYER_START,
  cameraDistanceScale,
} from './worldLayout'
import { useKeyboard } from './useKeyboard'
import { resolveMoveVector } from './movement'
import type { MoveVector } from './movement'

interface Player3DProps {
  /** プレイヤーの現在位置。毎フレーム更新され、親の近接判定から参照される */
  positionRef: MutableRefObject<Vector3>
  /** バーチャルスティックの入力。タッチUIが書き込み、ここで読み取る */
  stickRef: MutableRefObject<MoveVector>
}

/**
 * 操作キャラクター(牧場主)。
 * キーボード(WASD/矢印)とバーチャルスティックの両方で移動でき、カメラが追従する。
 */
export function Player3D({ positionRef, stickRef }: Player3DProps) {
  const groupRef = useRef<Group>(null)
  const pressed = useKeyboard()
  const cameraTarget = useRef(new Vector3())

  useFrame(({ camera, size }, delta) => {
    const group = groupRef.current
    if (!group) return

    const move = resolveMoveVector(pressed.current, stickRef.current)

    if (move.x !== 0 || move.z !== 0) {
      const step = PLAYER_SPEED * delta
      group.position.x = Math.max(
        -PLAYER_BOUND_X,
        Math.min(PLAYER_BOUND_X, group.position.x + move.x * step),
      )
      group.position.z = Math.max(
        -PLAYER_BOUND_Z,
        Math.min(PLAYER_BOUND_Z, group.position.z + move.z * step),
      )
      group.rotation.y = Math.atan2(move.x, move.z) // 進行方向を向く
    }

    positionRef.current.copy(group.position)

    // 三人称の追従カメラ。縦長画面(スマホ)ほど引いて視野を確保する
    const distanceScale = cameraDistanceScale(size.width / size.height)
    cameraTarget.current.set(
      group.position.x,
      group.position.y + 5.5 * distanceScale,
      group.position.z + 7 * distanceScale,
    )
    camera.position.lerp(cameraTarget.current, 0.08)
    camera.lookAt(group.position.x, group.position.y + 0.6, group.position.z)
  })

  return (
    <group ref={groupRef} position={[PLAYER_START[0], 0, PLAYER_START[1]]}>
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
