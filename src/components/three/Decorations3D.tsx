/** ワールドの装飾オブジェクト(木・池・岩・花・干し草ロール)。機能は持たない */

function Tree({ position }: { position: [number, number] }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.14, 0.2, 1.2, 8]} />
        <meshStandardMaterial color="#8a6a45" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.75, 14, 14]} />
        <meshStandardMaterial color="#5f9e4e" />
      </mesh>
      <mesh position={[0.35, 1.95, 0.15]}>
        <sphereGeometry args={[0.45, 12, 12]} />
        <meshStandardMaterial color="#6fae5c" />
      </mesh>
    </group>
  )
}

function Rock({ position, scale = 1 }: { position: [number, number]; scale?: number }) {
  return (
    <mesh position={[position[0], 0.22 * scale, position[1]]} scale={scale}>
      <icosahedronGeometry args={[0.32, 0]} />
      <meshStandardMaterial color="#a3a8a0" flatShading />
    </mesh>
  )
}

function FlowerPatch({ position }: { position: [number, number] }) {
  const petals: Array<{ dx: number; dz: number; color: string }> = [
    { dx: 0, dz: 0, color: '#e8788a' },
    { dx: 0.35, dz: 0.2, color: '#f2d06b' },
    { dx: -0.3, dz: 0.25, color: '#ffffff' },
    { dx: 0.1, dz: -0.3, color: '#c98add' },
  ]
  return (
    <group position={[position[0], 0, position[1]]}>
      {petals.map((p, i) => (
        <group key={i} position={[p.dx, 0, p.dz]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.24, 6]} />
            <meshStandardMaterial color="#4f8a3d" />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={p.color} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function HayBale({ position, rotation = 0 }: { position: [number, number]; rotation?: number }) {
  return (
    <mesh
      position={[position[0], 0.4, position[1]]}
      rotation={[0, rotation, Math.PI / 2]}
    >
      <cylinderGeometry args={[0.4, 0.4, 0.7, 14]} />
      <meshStandardMaterial color="#dfc06a" />
    </mesh>
  )
}

function Pond({ position }: { position: [number, number] }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[2.1, 28]} />
        <meshStandardMaterial color="#7db8d9" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[2.35, 28]} />
        <meshStandardMaterial color="#c9b98a" />
      </mesh>
      {/* 石の縁取り */}
      <Rock position={[1.9, 1.2]} scale={0.7} />
      <Rock position={[-1.7, -1.4]} scale={0.6} />
    </group>
  )
}

export function Decorations3D() {
  return (
    <group>
      {/* 木(外周と空きスペース) */}
      <Tree position={[-6.5, -7.8]} />
      <Tree position={[6.5, -7.8]} />
      <Tree position={[12.8, -1.5]} />
      <Tree position={[-2.5, -7.9]} />
      <Tree position={[3, 7.8]} />
      <Tree position={[12.5, 7.8]} />

      {/* 池(右手前) */}
      <Pond position={[7, 7]} />

      {/* 岩 */}
      <Rock position={[-3.5, -3]} />
      <Rock position={[4.5, 1.5]} scale={1.4} />
      <Rock position={[-1, 2.5]} scale={0.8} />
      <Rock position={[9, -1]} />

      {/* 花畑 */}
      <FlowerPatch position={[-6, 1.5]} />
      <FlowerPatch position={[2, -5.5]} />
      <FlowerPatch position={[6, 3]} />
      <FlowerPatch position={[-3, 6.5]} />

      {/* 干し草ロール(えさ場の近く) */}
      <HayBale position={[-8, -6.8]} />
      <HayBale position={[-8.8, -4.2]} rotation={0.7} />
      <HayBale position={[12.8, -6.8]} rotation={1.2} />
    </group>
  )
}
