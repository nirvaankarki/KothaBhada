 import express from "express";
 import roomsRoutes from './routes/roomsRoutes.js';
 import authRoutes from './routes/authRoutes.js';
 import { connectDB } from "./config/db.js";


 const app = express();
 app.use(express.json());
 connectDB(); // Connect to MongoDB

 app.use("/auth", authRoutes);
 app.use("/api/rooms", roomsRoutes);


 app.listen(5001, () => {
     console.log('Server is running on port 5001');
 }); 