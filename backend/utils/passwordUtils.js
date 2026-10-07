const bcrypt = require('bcryptjs');

/**
 * Hashes a plain text password using bcrypt
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password: ' + error.message);
  }
};

/**
 * Compares a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} passwordHash - Hashed password from database
 * @returns {Promise<boolean>} - true if passwords match, false otherwise
 */
const comparePassword = async (password, passwordHash) => {
  try {
    return await bcrypt.compare(password, passwordHash);
  } catch (error) {
    throw new Error('Error comparing passwords: ' + error.message);
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
