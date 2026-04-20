//  import express from "express";
//  import cors from "cors";
//  import roomsRoutes from './routes/roomsRoutes.js';
//  import authRoutes from './routes/authRoutes.js';
//  import { connectDB } from "./config/db.js";


//  const app = express();

//  // Enable CORS for frontend
//  app.use(cors({
//    origin: 'http://localhost:5173',
//    credentials: true,
//    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//    allowedHeaders: ['Content-Type', 'Authorization']
//  }));

//  app.use(express.json());
//  connectDB(); // Connect to MongoDB

//  app.use("/api/auth", authRoutes);
//  app.use("/api/rooms", roomsRoutes);
//  app.use("/api/contact", contactRoutes); // Add contact routes


//  app.listen(5001, () => {
//      console.log('Server is running on port 5001');
//  }); 

import express from "express";
import cors from "cors";
import path from 'path';
import dotenv from 'dotenv';
import roomsRoutes from './routes/roomsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js'; // FIX: Added missing import
import userDashboardRoutes from './routes/userDashboardRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { connectDB } from "./config/db.js";
import { ensureDefaultAdminAccount } from './utils/bootstrapAdmin.js';
import { broadcastRealtimeEvent, registerRealtimeClient } from './utils/realtimeEvents.js';

dotenv.config();

const app = express();
let dbConnected = false;
const MUTATING_HTTP_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ALLOWED_CORS_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

// Initialize database connection
(async () => {
  try {
    const connection = await connectDB();
    dbConnected = Boolean(connection);

    if (dbConnected) {
      await ensureDefaultAdminAccount();
    }
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
  }
})();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_CORS_ORIGINS.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase payload size limit for image uploads (50MB max)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/api/realtime/stream', registerRealtimeClient);

app.use((req, res, next) => {
  if (!MUTATING_HTTP_METHODS.has(req.method)) {
    next();
    return;
  }

  const originalSend = res.send.bind(res);
  let eventEmitted = false;

  res.send = (body) => {
    const response = originalSend(body);

    if (!eventEmitted) {
      eventEmitted = true;
      const statusCode = Number(res.statusCode || 0);

      if (statusCode >= 200 && statusCode < 300) {
        broadcastRealtimeEvent('platform-update', {
          method: req.method,
          path: req.originalUrl || req.url,
        });
      }
    }

    return response;
  };

  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/contact", contactRoutes); // Full path will be /api/contact/...
app.use("/api/user", userDashboardRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    dbConnected,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(5001, () => {
    console.log('✓ Server is running on port 5001');
    console.log('✓ Backend URL: http://localhost:5001');
    console.log(`✓ Database connection status: ${dbConnected ? 'Connected' : 'Disconnected'}`);
});