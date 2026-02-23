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
import roomsRoutes from './routes/roomsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js'; // FIX: Added missing import
import { connectDB } from "./config/db.js";

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
connectDB(); 

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/contact", contactRoutes); // Full path will be /api/contact/...

app.listen(5001, () => {
    console.log('Server is running on port 5001');
});