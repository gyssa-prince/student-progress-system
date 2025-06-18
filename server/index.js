import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cron from 'node-cron';
import 'dotenv/config'; // For loading .env file
import { syncAllStudents, checkInactivityAndNotify } from './utils/cfSync.js';
import studentRoutes from './routes/students.js'; // Assuming this path is correct

const app = express();

// CORS Configuration
app.use(cors({
  origin: '*', // Allow all origins for development. In production, specify your frontend's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // For parsing JSON request bodies

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err)); // Use console.error

// Basic root route
app.get('/', (req, res) => res.send('API Running'));

// Student CRUD routes
app.use('/api/students', studentRoutes);

// --- MANUAL CODEFORCES SYNC ROUTE ---
app.post('/api/sync-all-codeforces-data', async (req, res) => {
  try {
    console.log('[Backend Sync Route] Manual sync initiated for all students...');
    await syncAllStudents();
    res.status(200).json({ message: 'Codeforces data sync process started successfully.' });
  } catch (error) {
    console.error('[Backend Sync Route ERROR] Failed to initiate full Codeforces sync:', error);
    res.status(500).json({ message: 'Failed to initiate Codeforces data sync.', error: error.message });
  }
});
// --- END MANUAL SYNC ROUTE ---

// Schedule daily sync and inactivity notifications
// Runs every day at 2:00 AM UTC (adjust timezone if needed)
cron.schedule('0 2 * * *', async () => {
  console.log('[Cron Job] Running daily Codeforces sync and inactivity check...');
  try {
    await syncAllStudents();
    await checkInactivityAndNotify();
    console.log('[Cron Job] Daily sync and notification completed.');
  } catch (error) {
    console.error('[Cron Job ERROR] Failed to complete daily sync or notification:', error);
  }
}, {
  timezone: "Etc/UTC" // Ensure consistent timezone for cron
});

// Define the PORT (matching frontend expectation of 5050)
const PORT = process.env.PORT || 5050;

// Start the server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  // Initial sync on server start (for development/initial data population)
  console.log('[Server Startup] Initiating initial sync on server start...');
});
