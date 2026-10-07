/**
 * Backend Room Configuration
 * Mirrors the frontend roomsConfig.js
 * Defines predefined rooms for each block
 */

const ROOMS_BY_BLOCK = {
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
 * @param {string} blockName - Block name
 * @returns {string[]} Array of room names
 */
const getRoomsForBlock = (blockName) => {
  return ROOMS_BY_BLOCK[blockName] || [];
};

/**
 * Get all blocks
 * @returns {string[]} Array of block names
 */
const getAllBlocks = () => {
  return Object.keys(ROOMS_BY_BLOCK);
};

/**
 * Check if a room exists in a block
 * @param {string} blockName - Block name
 * @param {string} roomName - Room name
 * @returns {boolean}
 */
const isValidRoom = (blockName, roomName) => {
  const rooms = getRoomsForBlock(blockName);
  return rooms.includes(roomName);
};

module.exports = {
  ROOMS_BY_BLOCK,
  getRoomsForBlock,
  getAllBlocks,
  isValidRoom,
};
