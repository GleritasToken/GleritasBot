// Simple Express server for production deployment
const express = require('express');
const path = require('path');
const app = express();

// Set production environment
process.env.NODE_ENV = 'production';

// Serve static files
const distPath = path.join(__dirname, 'dist', 'public');
app.use(express.static(distPath));

// For API routes, use the compiled server
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// For all other routes, serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});