import { Edges } from '@react-three/drei'

function SlotBox({ position = [0, 0, 0], size = [0.5, 0.3, 0.28], color = "steelblue" }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
      <Edges color="black" />
    </mesh>
  )
}

export default SlotBox
