# QUICK START GUIDE

## Prerequisites
- Node.js installed
- MongoDB Atlas account (or local MongoDB)
- Code editor (VS Code recommended)

## Step 1: Set Up MongoDB

### Option A: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new project
4. Create a cluster
5. Create database user with username and password
6. Get connection string

### Option B: MongoDB Local
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod
```

## Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file with your configuration
cp .env.example .env

# Edit .env file with your MongoDB URI and JWT secret
# MONGODB_URI=your_connection_string
# JWT_SECRET=your_secret_key
# PORT=5000

# Start backend server
npm run dev
```

Backend will be available at: `http://localhost:5000`

## Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local (optional - defaults to localhost:5000)
cp .env.example .env.local

# Start frontend development server
npm start
```

Frontend will open at: `http://localhost:3000`

## Step 4: Test Login

Access `http://localhost:3000` and use demo credentials:

### Admin
- Email: admin@college.edu
- Password: password123

### Faculty
- Email: faculty@college.edu
- Password: password123

### Student
- Email: student@college.edu
- Password: password123

## API Testing

Use Postman or similar tool to test API endpoints:

### Login Example
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@college.edu",
  "password": "password123"
}
```

## Project Structure Recap

### Backend Folders
- `config/` - Database configuration
- `models/` - MongoDB schemas
- `controllers/` - Business logic
- `routes/` - API endpoints
- `middleware/` - Authentication, file upload, error handling
- `utils/` - Helper functions
- `uploads/` - File storage

### Frontend Folders
- `pages/` - Page components
- `components/` - Reusable UI components
- `services/` - API client
- `context/` - State management
- `hooks/` - Custom hooks
- `utils/` - Helper functions
- `styles/` - CSS and TailwindCSS

## Common Commands

### Backend
```bash
npm run dev    # Start development server with auto-reload
npm start      # Start production server
```

### Frontend
```bash
npm start      # Start development server
npm run build  # Create production build
npm run test   # Run tests
```

## Next Steps

1. Add users to database (Admin creates accounts)
2. Create classrooms and assign representatives
3. Add utilities and labs
4. Upload timetables
5. Create projects for classes
6. Test issue reporting

## Troubleshooting

### Mongoose Connection Error
- Check MongoDB URI in .env
- Ensure MongoDB service is running
- Verify database name in connection string

### CORS Error
- Backend CORS is enabled for any origin in development
- For production, update CORS settings in server.js

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Node Modules Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Support

For issues or questions, refer to the main README.md file.
