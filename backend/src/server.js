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
import dotenv from 'dotenv';
import roomsRoutes from './routes/roomsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js'; // FIX: Added missing import
import userDashboardRoutes from './routes/userDashboardRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
let dbConnected = false;

// Initialize database connection
(async () => {
  try {
    await connectDB();
    dbConnected = true;
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
  }
})();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase payload size limit for image uploads (50MB max)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/contact", contactRoutes); // Full path will be /api/contact/...
app.use("/api/user", userDashboardRoutes);
app.use("/api/reviews", reviewRoutes);

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