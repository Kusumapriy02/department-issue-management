/**
 * Seed Rooms into Database
 * Creates classroom rooms with block assignments
 * Run: node scripts/seedRooms.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('../models/Room');

const seedRooms = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/department_management';

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if rooms already exist
    const existingRooms = await Room.countDocuments();
    if (existingRooms > 0) {
      console.log(`✅ ${existingRooms} rooms already exist in database`);
      await mongoose.connection.close();
      return;
    }

    // Rooms in Main Block
    const mainBlockRooms = [
      { number: '101', block: 'Main Block', capacity: 60 },
      { number: '102', block: 'Main Block', capacity: 60 },
      { number: '103', block: 'Main Block', capacity: 60 },
      { number: '104', block: 'Main Block', capacity: 60 },
      { number: '105', block: 'Main Block', capacity: 60 },
      { number: '106', block: 'Main Block', capacity: 60 },
      { number: '107', block: 'Main Block', capacity: 60 },
      { number: '108', block: 'Main Block', capacity: 60 },
    ];

    // Rooms in Algorithm Block
    const algorithmBlockRooms = [
      { number: '201', block: 'Algorithm Block', capacity: 50 },
      { number: '202', block: 'Algorithm Block', capacity: 50 },
      { number: '203', block: 'Algorithm Block', capacity: 50 },
      { number: '204', block: 'Algorithm Block', capacity: 50 },
      { number: '205', block: 'Algorithm Block', capacity: 50 },
      { number: '206', block: 'Algorithm Block', capacity: 50 },
      { number: '207', block: 'Algorithm Block', capacity: 50 },
      { number: '208', block: 'Algorithm Block', capacity: 50 },
    ];

    const allRooms = [...mainBlockRooms, ...algorithmBlockRooms];

    // Create rooms
    const createdRooms = await Room.insertMany(allRooms);

    console.log(`✅ Successfully created ${createdRooms.length} rooms!`);
    console.log(`   - ${mainBlockRooms.length} rooms in Main Block (101-108)`);
    console.log(`   - ${algorithmBlockRooms.length} rooms in Algorithm Block (201-208)`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding rooms:', error.message);
    process.exit(1);
  }
};

seedRooms();
