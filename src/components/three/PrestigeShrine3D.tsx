/** 転生の祠: 金の豚像。近づくと転生プロンプトが表示される(判定はWorld3D側) */
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { useCanPrestige } from '../../store/selectors'
import { PRESTIGE_SHRINE_POSITION } from './worldLayout'

export function PrestigeShrine3D() {
  const [x, z] = PRESTIGE_SHRINE_POSITION
  const ready = useCanPrestige()
  const pigRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const pig = pigRef.current
    if (!pig) return
    const t = clock.getElapsedTime()
    pig.rotation.y = t * 0.6 // 台座の上でゆっくり回る
    pig.position.y = 1.05 + Math.sin(t * 1.5) * 0.05
  })

  const gold = ready ? '#f5c518' : '#b8a458'

  return (
    <group position={[x, 0, z]}>
      {/* 台座 */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.0, 1.2, 0.6, 8]} />
        <meshStandardMaterial color="#cfcabc" flatShading />
      </mesh>
      {/* 両脇の柱 */}
      <mesh position={[-1.5, 0.9, 0]}>
        <boxGeometry args={[0.25, 1.8, 0.25]} />
        <meshStandardMaterial color="#cfcabc" />
      </mesh>
      <mesh position={[1.5, 0.9, 0]}>
        <boxGeometry args={[0.25, 1.8, 0.25]} />
        <meshStandardMaterial color="#cfcabc" />
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <boxGeometry args={[3.6, 0.22, 0.35]} />
        <meshStandardMaterial color="#b5583e" />
      </mesh>
      {/* 金の豚像(転生可能なら明るく光る) */}
      <group ref={pigRef} position={[0, 1.05, 0]}>
        <mesh scale={[1, 0.8, 1.25]}>
          <sphereGeometry args={[0.38, 20, 20]} />
          <meshStandardMaterial
            color={gold}
            emissive={gold}
            emissiveIntensity={ready ? 0.55 : 0.1}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.1, 0.46]}>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshStandardMaterial
            color={gold}
            emissive={gold}
            emissiveIntensity={ready ? 0.55 : 0.1}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  )
}
