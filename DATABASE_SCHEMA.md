DATABASE SCHEMA DOCUMENTATION

## User Schema
```
{
  _id: ObjectId (auto-generated)
  name: String (required, min: 2)
  email: String (required, unique, validated)
  rollNumber: String (unique, sparse - optional for non-students)
  passwordHash: String (required, min: 6, hashed with bcrypt)
  role: String (enum: ['admin', 'faculty', 'student'], required)
  classroomId: ObjectId (ref: 'Classroom', optional)
  isActive: Boolean (default: true)
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-updated)
}
```

## Classroom Schema
```
{
  _id: ObjectId (auto-generated)
  department: String (required)
  year: Number (required, enum: [1, 2, 3, 4])
  section: String (required)
  programDuration: Number (default: 4)
  cr: ObjectId (ref: 'User', optional - Class Representative)
  lr: ObjectId (ref: 'User', optional - Lab Representative)
  facultyList: Array of ObjectId (ref: 'User')
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-updated)
}
```

## Utility Schema
```
{
  _id: ObjectId (auto-generated)
  utilityName: String (required)
  category: String (required, enum: ['furniture', 'equipment', 'facilities'])
  location: String (required)
  quantity: Number (required, min: 0)
  description: String (optional)
  classroomId: ObjectId (ref: 'Classroom', optional)
  status: String (enum: ['working', 'damaged', 'maintenance'], default: 'working')
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-updated)
}
```

## Lab Schema
```
{
  _id: ObjectId (auto-generated)
  labName: String (required)
  roomNumber: String (required, unique)
  numberOfSystems: Number (required, min: 1)
  accessories: Array of Objects
    {
      name: String (required)
      quantity: Number (default: 1)
    }
  incharge: ObjectId (ref: 'User', optional)
  department: String (required)
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-updated)
}
```

## Issue Schema
```
{
  _id: ObjectId (auto-generated)
  title: String (required, min: 5)
  description: String (required, min: 10)
  classroomId: ObjectId (ref: 'Classroom', required)
  reportedBy: ObjectId (ref: 'User', required)
  status: String (enum: ['Open', 'In Progress', 'Resolved'], default: 'Open')
  priority: String (enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium')
  category: String (required, enum: ['infrastructure', 'equipment', 'utilities', 'other'])
  assignedTo: ObjectId (ref: 'User', optional)
  resolvedAt: Date (optional)
  comments: Array of Objects
    {
      user: ObjectId (ref: 'User')
      text: String
      createdAt: Date (default: Date.now)
    }
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-updated)
}
```

## Project Schema
```
{
  _id: ObjectId (auto-generated)
  projectTitle: String (required)
  subject: String (required)
  description: String (optional)
  facultyId: ObjectId (ref: 'User', required)
  classroomId: ObjectId (ref: 'Classroom', required)
  teamMembers: Array of Objects
    {
      rollNumber: String (required)
      userId: ObjectId (ref: 'User', optional)
    }
  deadline: Date (required)
  maxTeamSize: Number (default: 5)
  status: String (enum: ['not_started', 'in_progress', 'submitted', 'evaluated'], default: 'not_started')
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-updated)
}
```

## Timetable Schema
```
{
  _id: ObjectId (auto-generated)
  classroomId: ObjectId (ref: 'Classroom', required, unique)
  imageURL: String (required)
  fileName: String (required)
  fileSize: Number (required)
  uploadedBy: ObjectId (ref: 'User', required)
  uploadedAt: Date (default: Date.now)
  updatedAt: Date (auto-updated)
}
```

## Indexes

Key indexes for performance:
- User: unique on email and rollNumber (sparse)
- Classroom: indexed by department, year, section
- Utility: indexed by classroomId and category
- Lab: unique on roomNumber
- Issue: indexed by classroomId, reportedBy, status, priority
- Project: indexed by classroomId and facultyId
- Timetable: unique on classroomId

## Relationships

- User → Classroom (one-to-many)
- Classroom → User (many - facultyList)
- Issue → Classroom, User (many-to-one)
- Project → User, Classroom (many-to-one)
- Timetable → Classroom (one-to-one)
- Utility → Classroom (many-to-one, optional)
- Lab → User (optional incharge)

## Data Integrity Notes

1. When deleting a User who is a CR/LR, set to null in Classroom
2. When deleting a Classroom, cascade delete related Issues, Projects, Utilities, Timetables
3. Roll number is required for Students, optional for Faculty/Admin
4. Email must be unique across all users
5. Passwords are always hashed before storage
6. Comments in Issues are embedded (not separate collection)
7. File uploads are stored physically and referenced by path in Timetable

## Validation Rules

### User
- Name: 2-255 characters
- Email: valid email format, unique
- Password: min 6 characters (hashed to ~60 characters)
- Roll Number: required for students, optional for others
- Role: only admin, faculty, or student

### Classroom
- Department: required, non-empty
- Year: only 1, 2, 3, or 4
- Section: required, non-empty
- Program Duration: should be positive integer

### Utility
- Quantity: >= 0
- Category: only specified categories
- Status: only specified statuses

### Lab
- Number of Systems: >= 1
- Room Number: unique, non-empty

### Issue
- Title: 5-255 characters
- Description: 10-5000 characters
- Priority: Low, Medium, High, Critical

### Project
- Team size <= maxTeamSize
- Deadline in future
- Faculty must be assigned to classroom
