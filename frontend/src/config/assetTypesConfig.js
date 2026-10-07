/**
 * Single Source of Truth for Asset Types
 * Used across the entire system for consistency
 * 
 * List restricted to classroom and educational assets only.
 * DO NOT add outdated types like CCTV, Router, UPS, Computer, AC, etc.
 */

export const ASSET_TYPES = [
  'Bench',
  'Fan',
  'Light',
  'LED Board',
  'Whiteboard',
  'Smart Board',
  'Projector',
  'Other',
];

/**
 * Get all asset types as an array
 * @returns {string[]} Array of asset type strings
 */
export const getAssetTypes = () => ASSET_TYPES;

/**
 * Check if a given asset type is valid
 * @param {string} type - The asset type to validate
 * @returns {boolean} True if type is in the valid list
 */
export const isValidAssetType = (type) => {
  return ASSET_TYPES.includes(type);
};

/**
 * Get asset types for dropdowns (with placeholder)
 * @returns {Array} Array with placeholder option first
 */
export const getAssetTypesForDropdown = () => {
  return [
    { value: '', label: 'Select Type' },
    ...ASSET_TYPES.map(type => ({ value: type, label: type }))
  ];
};

export default {
  ASSET_TYPES,
  getAssetTypes,
  isValidAssetType,
  getAssetTypesForDropdown,
};
