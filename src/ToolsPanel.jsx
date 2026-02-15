import { useState } from 'react'
import { CHANNEL_4_SLOT_CONFIG } from './ChannelFiles/4SlotChannel'
import { CHANNEL_5_SLOT_CONFIG } from './ChannelFiles/5SlotChannel'
import { CHANNEL_3_SLOT_CONFIG } from './ChannelFiles/3SlotChannel'
import { CHANNEL_2_SLOT_CONFIG } from './ChannelFiles/2SlotChannel'
import { CHANNEL_1_SLOT_CONFIG } from './ChannelFiles/1SlotChannel'

// Channel configs by type
const CHANNEL_CONFIGS = {
  '1-slot': CHANNEL_1_SLOT_CONFIG,
  '2-slot': CHANNEL_2_SLOT_CONFIG,
  '3-slot': CHANNEL_3_SLOT_CONFIG,
  '4-slot': CHANNEL_4_SLOT_CONFIG,
  '5-slot': CHANNEL_5_SLOT_CONFIG,
}

function ToolsPanel({ onAddBox, onRemoveBox, boxes = [], selectedSlot, numChannels = 2, channelTypes = [], savedLayouts = [], onSaveLayout, onLoadLayout, onDeleteLayout }) {
  const [layoutName, setLayoutName] = useState('')
  // selectedSlot is now { row: 0|1|2|..., channel: 0|1|2|..., slot: 0-4 } or null
  // Generate channel labels dynamically (A, B, C, D, ...)
  const channelLabels = Array.from({ length: numChannels }, (_, i) => String.fromCharCode(65 + i))

  // Get channel type for a specific row and column (channelTypes[column][row])
  const getChannelType = (rowIndex, colIndex) => {
    return channelTypes[colIndex]?.[rowIndex] || '4-slot'
  }

  // Get the number of rows for a specific column
  const getColumnRows = (colIndex) => channelTypes[colIndex]?.length || 1

  // Get the config for a specific row and channel
  const getChannelConfig = (rowIndex, channelIndex) => {
    const type = getChannelType(rowIndex, channelIndex)
    return CHANNEL_CONFIGS[type]
  }

  // Get the config for the selected channel
  const selectedChannelConfig = selectedSlot !== null
    ? getChannelConfig(selectedSlot.row, selectedSlot.channel)
    : CHANNEL_4_SLOT_CONFIG
  const [boxLength, setBoxLength] = useState('5')   // cm
  const [boxHeight, setBoxHeight] = useState('3')   // cm
  const [boxWidth, setBoxWidth] = useState('2.8')   // cm

  // Validation
  const length = parseFloat(boxLength) || 0
  const height = parseFloat(boxHeight) || 0
  const width = parseFloat(boxWidth) || 0

  // Calculate remaining space in each slot (boxes store size in units, convert back to cm)
  const getSlotUsedSpace = (rowIndex, channelIndex, slotIndex) => {
    return boxes
      .filter(box => box.row === rowIndex && box.channel === channelIndex && box.slot === slotIndex)
      .reduce((sum, box) => sum + (box.size[0] * 10), 0) // convert units to cm
  }

  const getRemainingSpace = (rowIndex, channelIndex, slotIndex) => {
    const config = getChannelConfig(rowIndex, channelIndex)
    return config.length - getSlotUsedSpace(rowIndex, channelIndex, slotIndex)
  }

  const remainingInSelected = selectedSlot !== null
    ? getRemainingSpace(selectedSlot.row, selectedSlot.channel, selectedSlot.slot)
    : 0

  // Check if selected slot has boxes
  const boxesInSelectedSlot = selectedSlot !== null
    ? boxes.filter(box => box.row === selectedSlot.row && box.channel === selectedSlot.channel && box.slot === selectedSlot.slot).length
    : 0

  const errors = []
  if (selectedSlot === null) errors.push('Select a slot by clicking a number in the 3D view')
  if (length <= 0) errors.push('Length must be greater than 0')
  if (selectedSlot !== null && length > remainingInSelected) errors.push(`Length exceeds remaining space in slot (${remainingInSelected.toFixed(1)}cm left)`)
  if (height <= 0) errors.push('Height must be greater than 0')
  if (height > selectedChannelConfig.height) errors.push(`Height exceeds channel (max ${selectedChannelConfig.height}cm)`)
  if (width <= 0) errors.push('Width must be greater than 0')
  if (width > selectedChannelConfig.maxBoxWidth) errors.push(`Width exceeds slot (max ${selectedChannelConfig.maxBoxWidth}cm)`)

  const isValid = errors.length === 0

  // Check which slots the box would fit in (across all rows and channels)
  const fitsInSlots = []
  for (let c = 0; c < numChannels; c++) {
    const colRows = getColumnRows(c)
    for (let r = 0; r < colRows; r++) {
      const config = getChannelConfig(r, c)
      const numSlots = config.numSlots
      for (let s = 0; s < numSlots; s++) {
        const remaining = getRemainingSpace(r, c, s)
        const isEmpty = remaining === config.length
        if (length <= remaining) {
          fitsInSlots.push({
            name: `${r + 1}-${channelLabels[c]}-${s + 1}`,
            remaining,
            isEmpty,
            channelType: getChannelType(r, c)
          })
        }
      }
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box'
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    color: 'black',
    fontSize: '13px'
  }

  return (
    <div style={{
      width: '25%',
      height: '100%',
      background: '#f5f5f5',
      borderLeft: '1px solid #ddd',
      padding: '20px',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <h2 style={{ margin: '0 0 20px 0', color: 'black' }}>Tools & Information</h2>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Selected Slot:</label>
        <div style={{
          padding: '10px',
          background: selectedSlot !== null ? '#e8f5e9' : '#fff3e0',
          border: `1px solid ${selectedSlot !== null ? '#4CAF50' : '#ff9800'}`,
          borderRadius: '4px',
          fontWeight: 'bold',
          color: selectedSlot !== null ? '#2E7D32' : '#e65100'
        }}>
          {selectedSlot !== null
            ? `Row ${selectedSlot.row + 1} - Channel ${channelLabels[selectedSlot.channel]} (${getChannelType(selectedSlot.row, selectedSlot.channel)}) - Slot ${selectedSlot.slot + 1}`
            : 'Click a slot number in the 3D view'}
        </div>
      </div>

      <h3 style={{ margin: '20px 0 10px 0', color: 'black', fontSize: '14px' }}>Box Size (cm)</h3>

      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Length:</label>
        <input
          type="number"
          value={boxLength}
          onChange={(e) => setBoxLength(e.target.value)}
          style={inputStyle}
          step="0.1"
          min="0.1"
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Height:</label>
        <input
          type="number"
          value={boxHeight}
          onChange={(e) => setBoxHeight(e.target.value)}
          style={inputStyle}
          step="0.1"
          min="0.1"
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Width:</label>
        <input
          type="number"
          value={boxWidth}
          onChange={(e) => setBoxWidth(e.target.value)}
          style={inputStyle}
          step="0.1"
          min="0.1"
        />
      </div>

      {/* Slot availability info */}
      <div style={{
        marginBottom: '10px',
        padding: '8px',
        background: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#1565c0'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Fits in:</div>
        {fitsInSlots.length > 0 ? (
          fitsInSlots.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: s.isEmpty ? '#4CAF50' : '#ff9800'
              }} />
              <span>{s.name}</span>
              <span style={{ color: '#666' }}>
                ({s.remaining.toFixed(1)}cm left) - {s.isEmpty ? 'Empty' : 'Has products'}
              </span>
            </div>
          ))
        ) : (
          <div style={{ color: '#c62828' }}>No slots available</div>
        )}
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div style={{
          marginBottom: '10px',
          padding: '8px',
          background: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#c62828'
        }}>
          {errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onAddBox(selectedSlot, { length, height, width })}
          disabled={!isValid}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: isValid ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isValid ? 'pointer' : 'not-allowed',
            fontSize: '14px'
          }}
        >
          {selectedSlot !== null
            ? `Add Box`
            : 'Select a Slot'}
        </button>
        <button
          onClick={() => onRemoveBox(selectedSlot)}
          disabled={selectedSlot === null || boxesInSelectedSlot === 0}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: selectedSlot !== null && boxesInSelectedSlot > 0 ? '#f44336' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedSlot !== null && boxesInSelectedSlot > 0 ? 'pointer' : 'not-allowed',
            fontSize: '14px'
          }}
        >
          Remove Box
        </button>
      </div>

      {/* Layouts Section */}
      <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />

      <h3 style={{ margin: '0 0 10px 0', color: 'black', fontSize: '14px' }}>Save Layout</h3>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <input
          type="text"
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value)}
          placeholder="Layout name..."
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            boxSizing: 'border-box'
          }}
        />
        <button
          onClick={() => {
            if (layoutName.trim() && numChannels > 0) {
              onSaveLayout(layoutName.trim())
              setLayoutName('')
            }
          }}
          disabled={!layoutName.trim() || numChannels === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: layoutName.trim() && numChannels > 0 ? '#2196f3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: layoutName.trim() && numChannels > 0 ? 'pointer' : 'not-allowed',
            fontSize: '14px'
          }}
        >
          Save
        </button>
      </div>

      <h3 style={{ margin: '0 0 10px 0', color: 'black', fontSize: '14px' }}>Saved Layouts</h3>

      {savedLayouts.length === 0 ? (
        <div style={{
          padding: '12px',
          background: '#f9f9f9',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          color: '#666',
          fontSize: '13px',
          textAlign: 'center'
        }}>
          No saved layouts yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {savedLayouts.map((layout) => (
            <div
              key={layout.id}
              style={{
                padding: '10px',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#333' }}>{layout.name}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>
                {layout.numChannels} columns, {layout.boxes.length} products
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => onLoadLayout(layout.id)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Load
                </button>
                <button
                  onClick={() => onDeleteLayout(layout.id)}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ToolsPanel
