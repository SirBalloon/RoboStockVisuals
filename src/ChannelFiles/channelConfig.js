// Shared channel configuration (all values in cm)
// Scale: 1 unit = 10 cm when used in Three.js

export const CHANNEL_CONFIG = {
  length: 120.5,        // 120.5 cm
  height: 7,            // 70mm = 7cm
  wallThickness: 0.3,   // 0.3 cm
  slotWidth: 3.4,       // 3.4 cm per slot
  numSlots: 4,
  maxBoxWidth: 2.8      // max box width with clearance
}

// Calculated values
export const TOTAL_WIDTH = (CHANNEL_CONFIG.numSlots * CHANNEL_CONFIG.slotWidth) +
  ((CHANNEL_CONFIG.numSlots + 1) * CHANNEL_CONFIG.wallThickness)

// Convert cm to Three.js units (1 unit = 10 cm)
export const toUnits = (cm) => cm / 10
export const toCm = (units) => units * 10
