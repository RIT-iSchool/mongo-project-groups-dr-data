
// Starts the server, connects to MongoDB, and registers all routes

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db/connection');

const app = express();
const PORT = 5000;

// Middleware
// for frontend 
app.use(cors());
app.use(express.json());

// Import route files
const searchRoutes  = require('./routes/search');
const studiesRoutes = require('./routes/studies');
const imagesRoutes  = require('./routes/images');

// Register routes with their base paths
app.use('/api/search',  searchRoutes);   // keyword search + geo search
app.use('/api/studies', studiesRoutes);  // single study detail
app.use('/api/images',  imagesRoutes);   // serve GridFS images

// confirm server is running
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Clinical Trials is running' });
});

// Connect to MongoDB first, then start the HTTP server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });