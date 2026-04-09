import express from 'express';
import dotenv from 'dotenv';
import 'colors';
import connectDB from './config/db.js'; // make sure you have this file
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from 'cloudinary';

// Import your routes (create these files later)
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import storeRoutes from './routes/storeRoutes.js';

import orderRoutes from './routes/orderRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';

const app = express();

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Return "https" URLs by setting secure: true
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Log the configuration
// console.log("Cloudinary Configuration:", cloudinary.config());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// Routes
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/store', storeRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/announcements', announcementRoutes);


// Test route
app.get('/', (req, res) => {
  res.send({ message: 'Welcome to Recruitment Management System API' });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode`.bgCyan.white);
  console.log(`Server is running on port ${PORT}`.bgCyan.white);
});