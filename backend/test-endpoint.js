const mongoose = require("mongoose");
require("dotenv").config();

const Classroom = require("./models/Classroom");
const Student = require("./models/Student");

async function testEndpoint() {
  try {
    console.log("Connecting to MongoDB...");
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/college-management";
    console.log("Using URI:", mongoUri);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("Connected to MongoDB");
    
    // Get first classroom
    const classroom = await Classroom.findOne();
    if (!classroom) {
      console.log("No classrooms found in database");
      process.exit(1);
    }
    
    console.log("\nClassroom found:");
    console.log("ID:", classroom._id);
    console.log("Name:", classroom.name);
    
    // Get students for this classroom
    console.log("\nFetching students for classroom...");
    const students = await Student.find({ classroomId: classroom._id });
    
    console.log("Found " + students.length + " students");
    students.forEach((s, i) => {
      console.log("  " + (i+1) + ". " + s.name + " (" + s._id + ")");
    });
    
    console.log("\nTest completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

testEndpoint();
