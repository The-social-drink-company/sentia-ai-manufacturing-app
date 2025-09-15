const express = require('express');
const path = require('path');
const app = express();

// Railway provides PORT
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('dist'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Catch all - serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server - bind to 0.0.0.0 for Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});