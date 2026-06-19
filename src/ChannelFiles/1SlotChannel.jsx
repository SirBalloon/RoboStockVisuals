import { Edges, Html } from '@react-three/drei'
import { toUnits } from './channelConfig'

// 1-slot channel configuration (full width slot)
export const CHANNEL_1_SLOT_CONFIG = {
  length: 120.5,        // 120.5 cm (same as other channels)
  height: 7,            // 70mm = 7cm
  wallThickness: 0.4,   // 4mm walls
  slotWidth: 14.0,      // 140mm - full width slot
  numSlots: 1,
  maxBoxWidth: 13.5     // max box width with clearance
}

function Channel1Slot({ position = [0, 0, 0], onSlotClick, selectedSlot, heightCm }) {
  // Convert config values to Three.js units
  const length = toUnits(CHANNEL_1_SLOT_CONFIG.length)
  const height = toUnits(heightCm ?? CHANNEL_1_SLOT_CONFIG.height)
  const wallThickness = toUnits(CHANNEL_1_SLOT_CONFIG.wallThickness)
  const slotWidth = toUnits(CHANNEL_1_SLOT_CONFIG.slotWidth)
  const numSlots = CHANNEL_1_SLOT_CONFIG.numSlots

  const numWalls = numSlots + 1  // 2 walls for 1 slot
  const totalWidth = (numSlots * slotWidth) + (numWalls * wallThickness)

  // Wall positions along Z axis (width direction)
  // Pattern: wall | slot | wall
  const wallPositions = []
  for (let i = 0; i < numWalls; i++) {
    const z = -totalWidth / 2 + wallThickness / 2 + i * (slotWidth + wallThickness)
    wallPositions.push(z)
  }

  // Slot center position (between walls) - just one slot at center
  const slotPositions = [0]

  const isSelected = selectedSlot === 0

  return (
    <group position={position}>
      {/* Bottom floor */}
      <mesh position={[0, -height / 2 + wallThickness / 2, 0]}>
        <boxGeometry args={[length, wallThickness, totalWidth]} />
        <meshStandardMaterial color="orange" />
        <Edges color="black" />
      </mesh>

      {/* Divider walls running full length (2 walls creating 1 slot) */}
      {wallPositions.map((z, i) => (
        <mesh key={i} position={[0, 0, z]}>
          <boxGeometry args={[length, height, wallThickness]} />
          <meshStandardMaterial color="orange" />
          <Edges color="black" />
        </mesh>
      ))}

      {/* Slot label - clickable, under the floor at right end */}
      <Html position={[length / 2 - 0.1, -height / 2 - 0.15, 0]} center zIndexRange={[1000, 0]}>
        <div
          onClick={() => onSlotClick && onSlotClick(isSelected ? null : 0)}
          style={{
            background: isSelected ? '#4CAF50' : 'white',
            color: isSelected ? 'white' : 'black',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            border: isSelected ? '2px solid #2E7D32' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          1
        </div>
      </Html>

    </group>
  )
}

export default Channel1Slot
