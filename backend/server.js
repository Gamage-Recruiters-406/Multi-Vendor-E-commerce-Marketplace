import express from 'express';
import dotenv from 'dotenv';
import 'colors';
import connectDB from './config/db.js'; // make sure you have this file
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Import your routes (create these files later)
import userRoutes from './routes/userRoutes.js';

const app = express();

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// Routes
app.use('/api/v1/user', userRoutes);

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