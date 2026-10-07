/**
 * Centralized Room Configuration
 * Defines predefined rooms for each block across the system
 * 
 * Used by:
 * - ReportIssue (student issue reporting)
 * - FacilityAssets (asset management)
 * - Classrooms (classroom management)
 */

// FIXED: Use exact block names as they appear in UI and forms
export const BLOCKS = {
  ALGORITHM: 'Algorithm Block',
  MAIN: 'Main Block',
};

// Predefined room mappings per block - keys must exactly match BLOCKS values
export const ROOM_CONFIG = {
  'Algorithm Block': [
    'A01', 'A02', 'A03',
    'A11', 'A12', 'A13', 'A14',
    'A31', 'A32', 'A33', 'A34', 'A35',
    'A41', 'A42', 'A43', 'A44', 'A45',
  ],
  'Main Block': [
    'GFCL1', 'GFCL2',
    'FFCL1', 'FFCL2', 'FFCL3', 'FFCL4',
    'NFCL1', 'NFCL2', 'NFCL3', 'NFCL4',
  ],
};

/**
 * Get rooms for a specific block
 * @param {string} blockName - Block name (Algorithm or Department)
 * @returns {string[]} Array of room numbers
 */
export const getRoomsForBlock = (blockName) => {
  return ROOM_CONFIG[blockName] || [];
};

/**
 * Get all blocks as array for dropdowns
 * @returns {string[]} Array of block names
 */
export const getBlocksList = () => {
  return Object.values(BLOCKS);
};

/**
 * Validate if a room exists in a specific block
 * @param {string} blockName - Block name
 * @param {string} roomNumber - Room number to validate
 * @returns {boolean} True if room exists in block
 */
export const isValidRoomForBlock = (blockName, roomNumber) => {
  const rooms = getRoomsForBlock(blockName);
  return rooms.includes(roomNumber);
};

// ──── API Block Name Bridge ────
// Asset/Issue models use 'Algorithm'/'Department' as block values.
// ROOM_CONFIG uses display names. This map bridges the two.
// NOTE: Technical debt — ideally ROOM_CONFIG should use API names as keys.
const API_BLOCK_MAP = {
  'Algorithm': 'Algorithm Block',
  'Department': 'Main Block',
};

/**
 * Get rooms for a block using the API block name.
 * Translates API name → display name → room list.
 * @param {string} apiBlock - API block value ('Algorithm' or 'Department')
 * @returns {string[]} Array of room numbers
 */
export const getRoomsForApiBlock = (apiBlock) => {
  const displayBlock = API_BLOCK_MAP[apiBlock];
  return ROOM_CONFIG[displayBlock] || [];
};

export default { BLOCKS, ROOM_CONFIG, getRoomsForBlock, getBlocksList, isValidRoomForBlock, getRoomsForApiBlock };
