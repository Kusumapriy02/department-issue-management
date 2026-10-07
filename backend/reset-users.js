require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const resetDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Delete demo users first
    const result = await User.deleteMany({
      email: { $in: ['admin@college.edu', 'faculty@college.edu', 'student@college.edu'] }
    });

    console.log(`Deleted ${result.deletedCount} old users`);

    // Create new users with proper hashing
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@college.edu',
      passwordHash: 'password123',
      teacherId: 'ADMIN001',
      role: 'admin',
      isActive: true,
    });

    const facultyUser = new User({
      name: 'Faculty User',
      email: 'faculty@college.edu',
      passwordHash: 'password123',
      teacherId: 'FACULTY001',
      role: 'faculty',
      isActive: true,
    });

    const studentUser = new User({
      name: 'Student User',
      email: 'student@college.edu',
      passwordHash: 'password123',
      registrationNumber: 'CS001',
      courseType: 'BTech',
      role: 'student',
      isActive: true,
    });

    await adminUser.save();
    await facultyUser.save();
    await studentUser.save();

    console.log('✅ Demo users created successfully with hashed passwords!');
    console.log('   - admin@college.edu (admin)');
    console.log('   - faculty@college.edu (faculty)');
    console.log('   - student@college.edu (student)');
    console.log('\n🔐 All passwords: password123');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetDatabase();
