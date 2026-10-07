require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');

const app = express();

// ==================== MIDDLEWARE ====================

// CORS configuration — restrict to frontend origin
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://nm39b11r-3000.incl.devtunnels.ms'
  ],
  credentials: true
}));

// Body parser middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// ==================== DATABASE CONNECTION ====================

// Connect to MongoDB
connectDB();

// ==================== API ROUTES ====================

// Import route handlers
const classroomRoutes = require('./routes/classroom');
const utilityRoutes = require('./routes/utility');
const assetRoutes = require('./routes/asset');
const labRoutes = require('./routes/lab');
const issueRoutes = require('./routes/issue');
const projectRoutes = require('./routes/project');
const timetableRoutes = require('./routes/timetable');
const statsRoutes = require('./routes/stats');
const notificationRoutes = require('./routes/notification');

/**
 * Authentication Routes
 * POST /api/auth/login - User login (public route)
 */
app.use('/api/auth', authRoutes);

/**
 * Classroom Management Routes
 * POST /api/classrooms - Create classroom (Admin)
 * GET /api/classrooms - Get all classrooms (Admin)
 * GET /api/classrooms/:id - Get classroom (Authenticated)
 * PUT /api/classrooms/:id - Update classroom (Admin)
 * DELETE /api/classrooms/:id - Delete classroom (Admin)
 */
app.use('/api/classrooms', classroomRoutes);

/**
 * Utility Management Routes
 * POST /api/utilities - Create utility (Admin)
 * GET /api/utilities - Get all utilities (Admin)
 * GET /api/utilities/:id - Get utility (Authenticated)
 * PUT /api/utilities/:id - Update utility (Admin)
 * DELETE /api/utilities/:id - Delete utility (Admin)
 */
app.use('/api/utilities', utilityRoutes);

/**
 * Facility Asset Routes
 * POST /api/assets - Create asset (Admin)
 * GET /api/assets - Get all assets (Admin, HOD)
 * GET /api/assets/:id - Get asset (Authenticated)
 * PUT /api/assets/:id - Update asset (Admin)
 * DELETE /api/assets/:id - Delete asset (Admin)
 */
app.use('/api/assets', assetRoutes);

/**
 * Lab Management Routes
 * POST /api/labs - Create lab (Admin)
 * GET /api/labs - Get all labs (Admin)
 * GET /api/labs/:id - Get lab (Authenticated)
 * PUT /api/labs/:id - Update lab (Admin)
 * DELETE /api/labs/:id - Delete lab (Admin)
 */
app.use('/api/labs', labRoutes);

/**
 * Issue Reporting Routes
 * POST /api/issues - Create issue (Students)
 * GET /api/issues - Get all issues (Admin)
 * GET /api/issues/my - Get user's issues (Authenticated)
 * GET /api/issues/:id - Get issue details (Authenticated)
 * PUT /api/issues/:id/status - Update issue status (Admin)
 * POST /api/issues/:id/comments - Add comment (Authenticated)
 */
app.use('/api/issues', issueRoutes);

/**
 * Project Assignment Routes
 * POST /api/projects - Create project (Faculty)
 * GET /api/projects/my - Get faculty's projects (Faculty)
 * GET /api/projects/class/:classroomId - Get classroom projects (Faculty/Student)
 * GET /api/projects/:id - Get project details (Authenticated)
 * PUT /api/projects/:id - Update project (Faculty creator)
 * POST /api/projects/:id/team-members - Add team member (Faculty creator)
 * DELETE /api/projects/:id - Delete project (Faculty creator)
 */
app.use('/api/projects', projectRoutes);

/**
 * Timetable Management Routes
 * POST /api/timetable/upload - Upload timetable (Admin)
 * GET /api/timetable - Get all timetables (Admin)
 * GET /api/timetable/:classroomId - Get classroom timetable (Authenticated)
 * DELETE /api/timetable/:id - Delete timetable (Admin)
 */
app.use('/api/timetable', timetableRoutes);
app.use('/api/stats', statsRoutes);

/**
 * Notification Routes
 * GET /api/notifications - Get user's notifications (Authenticated)
 * PUT /api/notifications/:id/read - Mark as read (Authenticated)
 * PUT /api/notifications/read-all - Mark all as read (Authenticated)
 * DELETE /api/notifications/:id - Delete notification (Authenticated)
 */
app.use('/api/notifications', notificationRoutes);

// ==================== ERROR HANDLING ====================

/**
 * 404 Not Found handler
 * Handles requests to undefined routes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

/**
 * Global error handler middleware
 * Must be registered last to catch all errors
 */
app.use(errorHandler);

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log(`

Server Running Successfully
Port: ${PORT}
Environment: ${NODE_ENV}

  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection Error:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception Error:', err.message);
  process.exit(1);
});

module.exports = app;
