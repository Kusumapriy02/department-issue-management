# Department Issue and Resource Management System

A comprehensive full-stack web application for managing classroom information, department utilities, lab infrastructure, student issue reporting, and academic project assignments.

## 📋 Features

### Admin Capabilities
- Create and manage classrooms
- Assign Class Representatives (CR) and Lab Representatives (LR)
- Upload and manage timetable images
- Manage utilities (benches, projectors, water facilities)
- Manage labs and infrastructure
- View all issues and update their status
- Track and resolve department problems

### Faculty Capabilities
- View assigned classroom information
- Assign projects to classes
- Add project team members using roll numbers
- View and track issues related to their classes
- Manage project deadlines and updates

### Student Capabilities
- View classroom information and timetable
- View assigned projects
- Report classroom issues
- Track issue resolution status
- View project deadlines and requirements

## 🛠️ Technology Stack

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **TailwindCSS** - Styling
- **Context API** - State management

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling

## 📁 Project Structure

```
backend/
├── config/              # Configuration files (database)
├── controllers/         # Business logic
├── middleware/          # Authentication, error handling, file upload
├── models/             # MongoDB schemas
├── routes/             # API endpoints
├── services/           # Reusable services
├── utils/              # Helper utilities
├── uploads/            # File storage
└── server.js           # Entry point

frontend/
├── public/             # Static files
├── src/
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   │   ├── admin/
│   │   ├── faculty/
│   │   └── student/
│   ├── services/       # API client
│   ├── context/        # Context providers
│   ├── hooks/          # Custom hooks
│   ├── styles/         # Global styles
│   ├── utils/          # Utility functions
│   └── App.js          # Main component
└── package.json
```

## ⚡ Quick Start Guide

If you're familiar with Node.js and have everything set up, run these commands:

```bash
# Backend
cd backend
npm install
node reset-users.js
npm run dev

# Frontend (in a new terminal)
cd frontend
npm install
npm start
```

Then log in at `http://localhost:3000` with:
- Email: `admin@college.edu`
- Password: `password123`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud instance like MongoDB Atlas)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env`**
   ```
   MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/department_management
   JWT_SECRET=your_super_secret_jwt_key_change_this
   PORT=5000
   NODE_ENV=development
   ```

5. **Seed the database with test users**
   ```bash
   node reset-users.js
   ```
   This creates demo users for testing all three roles.

6. **Start the server**
   ```bash
   npm run dev
   ```

   Server will run on `http://localhost:5000`

### Test Credentials

After seeding the database, use these credentials to log in:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@college.edu` | `password123` |
| Faculty | `faculty@college.edu` | `password123` |
| Student | `student@college.edu` | `password123` |

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env.local` file (optional)**
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

   App will open at `http://localhost:3000`

### Running Both Servers Simultaneously

To run frontend and backend together:

1. **In Terminal 1 (Backend):**
   ```bash
   cd backend
   npm run dev
   ```

2. **In Terminal 2 (Frontend):**
   ```bash
   cd frontend
   npm start
   ```

The frontend will automatically open at `http://localhost:3000` and communicate with the backend at `http://localhost:5000`.

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Classrooms
- `POST /api/classrooms` - Create classroom (Admin)
- `GET /api/classrooms` - Get all classrooms (Admin)
- `GET /api/classrooms/:id` - Get specific classroom
- `PUT /api/classrooms/:id` - Update classroom (Admin)
- `DELETE /api/classrooms/:id` - Delete classroom (Admin)

### Utilities
- `POST /api/utilities` - Create utility (Admin)
- `GET /api/utilities` - Get all utilities (Admin)
- `GET /api/utilities/:id` - Get specific utility
- `PUT /api/utilities/:id` - Update utility (Admin)
- `DELETE /api/utilities/:id` - Delete utility (Admin)

### Labs
- `POST /api/labs` - Create lab (Admin)
- `GET /api/labs` - Get all labs (Admin)
- `GET /api/labs/:id` - Get specific lab
- `PUT /api/labs/:id` - Update lab (Admin)
- `DELETE /api/labs/:id` - Delete lab (Admin)

### Issues
- `POST /api/issues` - Report issue (Student)
- `GET /api/issues` - Get all issues (Admin)
- `GET /api/issues/my` - Get user's issues
- `GET /api/issues/:id` - Get issue details
- `PUT /api/issues/:id/status` - Update issue status (Admin)
- `POST /api/issues/:id/comments` - Add comment

### Projects
- `POST /api/projects` - Create project (Faculty)
- `GET /api/projects/my` - Get faculty's projects
- `GET /api/projects/class/:classroomId` - Get classroom projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project (Faculty)
- `POST /api/projects/:id/team-members` - Add team member (Faculty)
- `DELETE /api/projects/:id` - Delete project (Faculty)

### Timetable
- `POST /api/timetable/upload` - Upload timetable (Admin)
- `GET /api/timetable` - Get all timetables (Admin)
- `GET /api/timetable/:classroomId` - Get classroom timetable
- `DELETE /api/timetable/:id` - Delete timetable (Admin)

## 🔐 Authentication

The system uses JWT-based authentication:
1. User logs in with email and password
2. Server returns JWT token
3. Token is stored in localStorage
4. Token is sent with every API request in Authorization header
5. Token expires after 7 days (configurable)

## 🎯 User Roles & Permissions

### Admin
- Full access to all features
- Can create/manage users, classrooms, infrastructure
- Can resolve issues
- Can upload timetables

### Faculty
- View assigned classrooms
- Create and manage projects
- View issues related to their classes
- Track project submissions

### Student
- View classroom information
- View assigned projects
- Report issues
- Track issue status

## 📦 Database Models

### User
- name, email, rollNumber (for students)
- passwordHash, role, classroomId
- isActive, timestamps

### Classroom
- department, year, section
- CR, LR, facultyList
- timestamps

### Utility
- utilityName, category, location, quantity
- classroomId, status
- timestamps

### Lab
- labName, roomNumber, numberOfSystems
- accessories, incharge, department
- timestamps

### Issue
- title, description, category, priority
- classroomId, reportedBy, assignedTo
- status (Open, In Progress, Resolved)
- comments, timestamps

### Project
- projectTitle, subject, description
- facultyId, classroomId
- teamMembers (roll numbers), deadline
- status, maxTeamSize, timestamps

### Timetable
- classroomId, imageURL, fileName
- fileSize, uploadedBy, uploadedAt

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start    # Starts development server with hot reload
```

### Building for Production

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run build
```

## 📝 File Upload

- Uploads are stored in `backend/uploads/timetables/`
- Only image files allowed (jpg, png, gif, webp)
- Max file size: 5MB
- Files are accessible via `/uploads/timetables/[filename]`

## 🐛 Error Handling

The application includes comprehensive error handling:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

All errors return consistent JSON responses with error messages.

## ❓ Troubleshooting

### Login Failed Error
**Problem:** "Login failed" message when trying to log in

**Solution:** 
Make sure you've run the database seeding script:
```bash
cd backend
node reset-users.js
```

### MongoDB Connection Error
**Problem:** "MongoDB connection failed" when starting server

**Causes & Solutions:**
- Check your `MONGODB_URI` in `.env` is correct
- Verify MongoDB Atlas IP whitelist includes your IP (add 0.0.0.0/0 for development)
- Ensure MongoDB service is running (for local MongoDB)

### Frontend Can't Reach Backend
**Problem:** CORS error or API calls failing

**Solution:**
- Ensure backend is running on `http://localhost:5000`
- Check that `REACT_APP_API_URL` in frontend `.env.local` is `http://localhost:5000/api`
- Verify CORS configuration in `backend/server.js` includes localhost:3000

### Port Already in Use
**Problem:** "Port 5000 is already in use" or "Port 3000 is already in use"

**Solution:**
Kill the process using the port:
```powershell
# For Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

Or change the PORT in `.env` and `REACT_APP_API_URL`

### Missing Dependencies
**Problem:** "Module not found" errors

**Solution:**
```bash
# Reinstall node_modules
rm -r node_modules
npm install
```

## 🔄 State Management

The frontend uses React Context API for:
- Authentication state
- User information
- Token management
- Role-based access

## 🚀 Deployment

### Backend Deployment Options
- Heroku
- AWS EC2/Elastic Beanstalk
- DigitalOcean
- Render

### Frontend Deployment Options
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 📧 Contact & Support

For issues or questions:
- Check the **Troubleshooting** section above
- Review the **API Documentation** for endpoint details
- Contact the development team for feature requests
- Submit issues via your project management system

## 📄 License

This project is proprietary and for internal use only.

---

**Last Updated:** April 10, 2026
**Version:** 1.0.0
