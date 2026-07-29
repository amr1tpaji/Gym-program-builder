const dns = require('dns');
// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const programRoutes = require('./routes/programRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/programs', programRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Program Builder API is running' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    // Start server anyway for development without DB
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (without MongoDB)`);
    });
  });
