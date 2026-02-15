import { Edges, Html } from '@react-three/drei'
import { toUnits } from './channelConfig'

// 3-slot channel configuration (50mm slot pitch, 45mm slots)
export const CHANNEL_3_SLOT_CONFIG = {
  length: 120.5,        // 120.5 cm (same as other channels)
  height: 7,            // 70mm = 7cm
  wallThickness: 0.5,   // 5mm walls
  slotWidth: 4.5,       // 45mm per slot
  numSlots: 3,
  maxBoxWidth: 4.2      // max box width with clearance
}

function Channel3Slot({ position = [0, 0, 0], onSlotClick, selectedSlot }) {
  // Convert config values to Three.js units
  const length = toUnits(CHANNEL_3_SLOT_CONFIG.length)
  const height = toUnits(CHANNEL_3_SLOT_CONFIG.height)
  const wallThickness = toUnits(CHANNEL_3_SLOT_CONFIG.wallThickness)
  const slotWidth = toUnits(CHANNEL_3_SLOT_CONFIG.slotWidth)
  const numSlots = CHANNEL_3_SLOT_CONFIG.numSlots

  const numWalls = numSlots + 1
  const totalWidth = (numSlots * slotWidth) + (numWalls * wallThickness)

  // Wall positions along Z axis (width direction)
  // Pattern: wall | slot | wall | slot | wall | slot | wall
  const wallPositions = []
  for (let i = 0; i < numWalls; i++) {
    const z = -totalWidth / 2 + wallThickness / 2 + i * (slotWidth + wallThickness)
    wallPositions.push(z)
  }

  // Slot center positions (between walls)
  const slotPositions = []
  for (let i = 0; i < numSlots; i++) {
    const z = -totalWidth / 2 + wallThickness + slotWidth / 2 + i * (slotWidth + wallThickness)
    slotPositions.push(z)
  }

  return (
    <group position={position}>
      {/* Bottom floor */}
      <mesh position={[0, -height / 2 + wallThickness / 2, 0]}>
        <boxGeometry args={[length, wallThickness, totalWidth]} />
        <meshStandardMaterial color="orange" />
        <Edges color="black" />
      </mesh>

      {/* Divider walls running full length (4 walls creating 3 slots) */}
      {wallPositions.map((z, i) => (
        <mesh key={i} position={[0, 0, z]}>
          <boxGeometry args={[length, height, wallThickness]} />
          <meshStandardMaterial color="orange" />
          <Edges color="black" />
        </mesh>
      ))}

      {/* Slot labels (1-3 from right to left) - clickable, under the floor at right end */}
      {slotPositions.map((z, i) => {
        const slotIndex = numSlots - 1 - i  // Map label to slot index (label 1 -> index 0, etc.)
        const isSelected = selectedSlot === slotIndex
        return (
          <Html key={`label-${i}`} position={[length / 2 - 0.1, -height / 2 - 0.15, z]} center zIndexRange={[1000, 0]}>
            <div
              onClick={() => onSlotClick && onSlotClick(isSelected ? null : slotIndex)}
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
              {numSlots - i}
            </div>
          </Html>
        )
      })}

    </group>
  )
}

export default Channel3Slot
