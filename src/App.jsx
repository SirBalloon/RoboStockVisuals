import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import Channel4Slot, { CHANNEL_4_SLOT_CONFIG } from './ChannelFiles/4SlotChannel'
import Channel5Slot, { CHANNEL_5_SLOT_CONFIG } from './ChannelFiles/5SlotChannel'
import Channel3Slot, { CHANNEL_3_SLOT_CONFIG } from './ChannelFiles/3SlotChannel'
import Channel2Slot, { CHANNEL_2_SLOT_CONFIG } from './ChannelFiles/2SlotChannel'
import Channel1Slot, { CHANNEL_1_SLOT_CONFIG } from './ChannelFiles/1SlotChannel'
import SlotBox from './ChannelFiles/SlotBox'
import ToolsPanel from './ToolsPanel'

// Channel type configurations
const CHANNEL_TYPES = {
  '1-slot': {
    component: Channel1Slot,
    config: CHANNEL_1_SLOT_CONFIG,
    width: 1.48,  // 14.8cm in units (1*14.0cm slot + 2*0.4cm walls)
    numSlots: 1,
    // Slot Z position at center
    slotPositions: [0]
  },
  '2-slot': {
    component: Channel2Slot,
    config: CHANNEL_2_SLOT_CONFIG,
    width: 1.48,  // 14.8cm in units (2*6.8cm slots + 3*0.4cm walls)
    numSlots: 2,
    // Slot Z positions relative to channel center (1-2 from right to left)
    slotPositions: [0.36, -0.36]
  },
  '3-slot': {
    component: Channel3Slot,
    config: CHANNEL_3_SLOT_CONFIG,
    width: 1.55,  // 15.5cm in units (3*4.5cm slots + 4*0.5cm walls)
    numSlots: 3,
    // Slot Z positions relative to channel center (1-3 from right to left)
    slotPositions: [0.5, 0, -0.5]
  },
  '4-slot': {
    component: Channel4Slot,
    config: CHANNEL_4_SLOT_CONFIG,
    width: 1.51,  // 15.1cm in units
    numSlots: 4,
    // Slot Z positions relative to channel center (1-4 from right to left)
    slotPositions: [0.555, 0.185, -0.185, -0.555]
  },
  '5-slot': {
    component: Channel5Slot,
    config: CHANNEL_5_SLOT_CONFIG,
    width: 1.43,  // 14.3cm in units
    numSlots: 5,
    // Slot Z positions relative to channel center (1-5 from right to left)
    slotPositions: [0.56, 0.28, 0, -0.28, -0.56]
  }
}

const CHANNEL_START_X = 6  // Right edge of channel (12.05 / 2)
const CHANNEL_GAP = 0.2     // Gap between channels
const CHANNEL_HEIGHT = 0.7  // Height of channel in units (7cm)
const ROW_GAP = 0.1         // Gap between rows

const STORAGE_KEY = 'robostock-saved-layouts'

function App() {
  const [boxes, setBoxes] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)  // { row: 0|1|2|..., channel: 0|1|2|..., slot: 0-3|0-4 } or null
  const [numChannels, setNumChannels] = useState(0)  // Start with no channels
  // Track type of each channel per column: channelTypes[column][row]
  // Each column can have different number of rows
  const [channelTypes, setChannelTypes] = useState([])
  const [pendingChannelType, setPendingChannelType] = useState(null)  // { type: 'column' } or { type: 'row', column: number }

  // Saved layouts - initialize from localStorage
  const [savedLayouts, setSavedLayouts] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse saved layouts:', e)
        return []
      }
    }
    return []
  })

  // Save layouts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLayouts))
  }, [savedLayouts])

  // Save current layout
  const handleSaveLayout = (name) => {
    const layout = {
      id: Date.now(),
      name,
      numChannels,
      channelTypes,
      boxes,
      savedAt: new Date().toISOString()
    }
    setSavedLayouts(prev => [...prev, layout])
  }

  // Load a saved layout
  const handleLoadLayout = (layoutId) => {
    const layout = savedLayouts.find(l => l.id === layoutId)
    if (layout) {
      setNumChannels(layout.numChannels)
      setChannelTypes(layout.channelTypes)
      setBoxes(layout.boxes)
      setSelectedSlot(null)
    }
  }

  // Delete a saved layout
  const handleDeleteLayout = (layoutId) => {
    setSavedLayouts(prev => prev.filter(l => l.id !== layoutId))
  }

  // Get the max number of rows across all columns
  const getMaxRows = () => Math.max(...channelTypes.map(col => col.length), 1)

  // Get number of rows for a specific column
  const getColumnRows = (colIndex) => channelTypes[colIndex]?.length || 1

  // Get channel type for a specific row and column (channelTypes[column][row])
  const getChannelType = (rowIndex, colIndex) => {
    return channelTypes[colIndex]?.[rowIndex] || '4-slot'
  }

  // Get channel width based on type (use row 0 for width calculations since columns align)
  const getChannelWidth = (channelIndex) => {
    const type = getChannelType(0, channelIndex)
    return CHANNEL_TYPES[type].width
  }

  // Calculate channel Z offsets dynamically based on number of channels and their types
  // From camera view: negative Z = RIGHT, positive Z = LEFT
  // Channel A starts on the right, each new channel added to the left
  const getChannelZOffset = (channelIndex) => {
    let totalWidth = 0
    for (let i = 0; i < numChannels; i++) {
      totalWidth += getChannelWidth(i)
      if (i < numChannels - 1) totalWidth += CHANNEL_GAP
    }

    let offset = -totalWidth / 2
    for (let i = 0; i < channelIndex; i++) {
      offset += getChannelWidth(i) + CHANNEL_GAP
    }
    offset += getChannelWidth(channelIndex) / 2
    return offset
  }

  // Calculate row Y position (row 0 at bottom, stacking upward)
  const getRowYPosition = (rowIndex) => {
    return 0.35 + rowIndex * (CHANNEL_HEIGHT + ROW_GAP)
  }

  const channelZOffsets = Array.from({ length: numChannels }, (_, i) => getChannelZOffset(i))

  // Show channel type selection popup for adding a column
  const handleAddChannelClick = () => {
    setPendingChannelType({ type: 'column' })
  }

  // Actually add the channel (column) with selected type
  const handleConfirmAddChannel = (type) => {
    setNumChannels(prev => prev + 1)
    // Add a new column with one row of the selected type
    setChannelTypes(prev => [...prev, [type]])
    setPendingChannelType(null)
  }

  // Actually add a row to a specific column with selected type
  const handleConfirmAddRow = (type) => {
    if (!pendingChannelType || pendingChannelType.type !== 'row') return
    const colIndex = pendingChannelType.column
    setChannelTypes(prev => prev.map((col, i) =>
      i === colIndex ? [...col, type] : col
    ))
    setPendingChannelType(null)
  }

  const handleCancelSelection = () => {
    setPendingChannelType(null)
  }

  const handleRemoveChannel = () => {
    if (numChannels <= 1) return  // Keep at least 1 channel
    const lastChannelIndex = numChannels - 1
    // Remove boxes from the last channel (across all rows)
    setBoxes(prev => prev.filter(box => box.channel !== lastChannelIndex))
    // Clear selection if it was in the removed channel
    if (selectedSlot?.channel === lastChannelIndex) {
      setSelectedSlot(null)
    }
    setNumChannels(prev => prev - 1)
    // Remove last column
    setChannelTypes(prev => prev.slice(0, -1))
  }

  // Show row type selection popup for a specific column
  const handleAddRowClick = (colIndex) => {
    setPendingChannelType({ type: 'row', column: colIndex })
  }

  // Remove the top row from a specific column
  const handleRemoveRow = (colIndex) => {
    const columnRows = getColumnRows(colIndex)
    if (columnRows <= 1) return  // Keep at least 1 row per column
    const lastRowIndex = columnRows - 1
    // Remove boxes from this column's last row
    setBoxes(prev => prev.filter(box => !(box.channel === colIndex && box.row === lastRowIndex)))
    // Clear selection if it was in the removed row
    if (selectedSlot?.channel === colIndex && selectedSlot?.row === lastRowIndex) {
      setSelectedSlot(null)
    }
    // Remove last row from this column
    setChannelTypes(prev => prev.map((col, i) =>
      i === colIndex ? col.slice(0, -1) : col
    ))
  }

  // Get the slot positions for a specific row and channel
  const getSlotPositions = (rowIndex, channelIndex) => {
    const type = getChannelType(rowIndex, channelIndex)
    return CHANNEL_TYPES[type].slotPositions
  }

  const handleAddBox = (selection, boxSize) => {
    if (!selection) return

    const { row, channel, slot } = selection

    // Convert cm to units (1 unit = 10 cm)
    const sizeInUnits = [boxSize.length / 10, boxSize.height / 10, boxSize.width / 10]

    // Count existing boxes in this slot/channel/row to calculate X position
    const boxesInSlot = boxes.filter(box => box.row === row && box.channel === channel && box.slot === slot)
    const totalLength = boxesInSlot.reduce((sum, box) => sum + box.size[0], 0)
    const xPosition = CHANNEL_START_X - totalLength - (sizeInUnits[0] / 2)

    const newBox = {
      id: Date.now(),
      row,
      channel,
      slot,
      xPosition,  // Only store X position (fixed once placed)
      size: sizeInUnits
    }

    setBoxes([...boxes, newBox])
  }

  const handleRemoveBox = (selection) => {
    if (!selection) return

    const { row, channel, slot } = selection

    // Find boxes in this slot and remove the last one added
    const boxesInSlot = boxes.filter(box => box.row === row && box.channel === channel && box.slot === slot)
    if (boxesInSlot.length === 0) return

    // Get the last box added to this slot (highest id)
    const lastBox = boxesInSlot.reduce((prev, curr) => (curr.id > prev.id ? curr : prev))
    setBoxes(boxes.filter(box => box.id !== lastBox.id))
  }

  // Calculate box position dynamically based on current channel offsets and row
  const getBoxPosition = (box) => {
    const rowYBase = getRowYPosition(box.row) - 0.35  // Offset from channel center to floor
    const yPosition = rowYBase + box.size[1] / 2  // Floor level + half height
    const slotPositions = getSlotPositions(box.row, box.channel)
    const zPosition = slotPositions[box.slot] + channelZOffsets[box.channel]
    return [box.xPosition, yPosition, zPosition]
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden' }}>
      {/* Left 75% - 3D Canvas */}
      <div style={{ width: '75%', height: '100%' }}>
        <Canvas camera={{ position: [10, 1, 0] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          {/* Dynamic Channels - render for each column and its rows */}
          {channelZOffsets.map((zOffset, colIndex) =>
            Array.from({ length: getColumnRows(colIndex) }, (_, rowIndex) => {
              const type = getChannelType(rowIndex, colIndex)
              const ChannelComponent = CHANNEL_TYPES[type].component
              return (
                <ChannelComponent
                  key={`channel-${rowIndex}-${colIndex}`}
                  position={[0, getRowYPosition(rowIndex), zOffset]}
                  onSlotClick={(slot) => setSelectedSlot(slot !== null ? { row: rowIndex, channel: colIndex, slot } : null)}
                  selectedSlot={selectedSlot?.row === rowIndex && selectedSlot?.channel === colIndex ? selectedSlot.slot : null}
                />
              )
            })
          )}

          {/* Grid Labels - Column labels (A, B, C...) on the edge */}
          {channelZOffsets.map((zOffset, i) => (
            <Html key={`col-${i}`} position={[6, -0.5, zOffset]} center zIndexRange={[1000, 0]}>
              <div style={{
                background: '#2196f3',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {String.fromCharCode(65 + i)}
              </div>
            </Html>
          ))}

          {/* Add/Remove Row buttons - above each column's stack */}
          {channelZOffsets.map((zOffset, colIndex) => {
            const columnRows = getColumnRows(colIndex)
            return (
              <Html key={`row-btn-${colIndex}`} position={[6, getRowYPosition(columnRows) + 0.2, zOffset]} center zIndexRange={[1000, 0]}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    onClick={() => handleAddRowClick(colIndex)}
                    style={{
                      background: '#ff9800',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      border: '2px solid #e65100',
                      textAlign: 'center'
                    }}
                  >
                    +
                  </div>
                  <div
                    onClick={() => handleRemoveRow(colIndex)}
                    style={{
                      background: columnRows <= 1 ? '#ccc' : '#f44336',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: columnRows <= 1 ? 'not-allowed' : 'pointer',
                      border: columnRows <= 1 ? '2px solid #999' : '2px solid #c62828',
                      textAlign: 'center'
                    }}
                  >
                    −
                  </div>
                </div>
              </Html>
            )
          })}

          {/* Add/Remove Channel buttons - at the end of the row (left side) */}
          <Html position={[6, getRowYPosition(0), getChannelZOffset(numChannels)]} center zIndexRange={[1000, 0]}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                onClick={handleAddChannelClick}
                style={{
                  background: '#4CAF50',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: '2px solid #2E7D32',
                  textAlign: 'center'
                }}
              >
                +
              </div>
              <div
                onClick={handleRemoveChannel}
                style={{
                  background: numChannels <= 1 ? '#ccc' : '#f44336',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: numChannels <= 1 ? 'not-allowed' : 'pointer',
                  border: numChannels <= 1 ? '2px solid #999' : '2px solid #c62828',
                  textAlign: 'center'
                }}
              >
                −
              </div>
            </div>
          </Html>

          {/* Row labels (1, 2, 3...) on the right edge - show for max rows */}
          {Array.from({ length: getMaxRows() }, (_, rowIndex) => (
            <Html key={`row-label-${rowIndex}`} position={[6, getRowYPosition(rowIndex), numChannels > 0 ? getChannelZOffset(0) - getChannelWidth(0) / 2 - 0.3 : -0.5]} center zIndexRange={[1000, 0]}>
              <div style={{
                background: '#ff9800',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {rowIndex + 1}
              </div>
            </Html>
          ))}

          {/* Dynamic boxes */}
          {boxes.map((box) => (
            <SlotBox key={box.id} position={getBoxPosition(box)} size={box.size} />
          ))}

          <OrbitControls
            enablePan={true}
            panSpeed={1.5}
            screenSpacePanning={true}
          />
          <gridHelper args={[10, 10]} />
        </Canvas>
      </div>

      <ToolsPanel
        onAddBox={handleAddBox}
        onRemoveBox={handleRemoveBox}
        boxes={boxes}
        selectedSlot={selectedSlot}
        numChannels={numChannels}
        channelTypes={channelTypes}
        savedLayouts={savedLayouts}
        onSaveLayout={handleSaveLayout}
        onLoadLayout={handleLoadLayout}
        onDeleteLayout={handleDeleteLayout}
      />

      {/* Channel Type Selection Modal */}
      {pendingChannelType && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            minWidth: '300px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'black' }}>
              {pendingChannelType?.type === 'column'
                ? 'Add New Column'
                : `Add Row to Column ${String.fromCharCode(65 + (pendingChannelType?.column || 0))}`}
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
              Choose the channel type:
            </p>
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={() => pendingChannelType?.type === 'column' ? handleConfirmAddChannel('1-slot') : handleConfirmAddRow('1-slot')}
                style={{
                  padding: '12px 20px',
                  background: '#795548',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                1-Slot Channel (140mm full width)
              </button>
               <button
                onClick={() => pendingChannelType?.type === 'column' ? handleConfirmAddChannel('2-slot') : handleConfirmAddRow('2-slot')}
                style={{
                  padding: '12px 20px',
                  background: '#ff5722',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                2-Slot Channel (68mm slots)
              </button>
              <button
                onClick={() => pendingChannelType?.type === 'column' ? handleConfirmAddChannel('3-slot') : handleConfirmAddRow('3-slot')}
                style={{
                  padding: '12px 20px',
                  background: '#009688',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                3-Slot Channel (45mm slots)
              </button>
              <button
                onClick={() => pendingChannelType?.type === 'column' ? handleConfirmAddChannel('4-slot') : handleConfirmAddRow('4-slot')}
                style={{
                  padding: '12px 20px',
                  background: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                4-Slot Channel (34mm slots)
              </button>
              <button
                onClick={() => pendingChannelType?.type === 'column' ? handleConfirmAddChannel('5-slot') : handleConfirmAddRow('5-slot')}
                style={{
                  padding: '12px 20px',
                  background: '#9c27b0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                5-Slot Channel (25mm slots)
              </button>
              <button
                onClick={handleCancelSelection}
                style={{
                  padding: '10px 20px',
                  background: '#f5f5f5',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App