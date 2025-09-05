const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 4501;

// Enable CORS
app.use(cors());

// Serve the enterprise dashboard
app.get('/', async (req, res) => {
    try {
        const html = await fs.readFile(path.join(__dirname, 'enterprise-dashboard.html'), 'utf8');
        res.send(html);
    } catch (error) {
        console.error('ERROR: Failed to read dashboard file:', error);
        res.status(500).send('Dashboard unavailable');
    }
});

// Proxy API calls to the monitoring agent on port 4500
app.get('/api/monitoring-data', async (req, res) => {
    try {
        const response = await fetch('http://localhost:4500/api/monitoring-data');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('ERROR: Failed to fetch monitoring data:', error);
        res.status(500).json({ error: 'Failed to fetch monitoring data' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log('=====================================');
    console.log('ENTERPRISE DASHBOARD SERVER STARTED');
    console.log(`Port: ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log('=====================================');
});