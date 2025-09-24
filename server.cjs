// BACKUP SERVER FILE - COMMONJS
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('Server.cjs starting on port:', PORT);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.send('<h1>Sentia Running on Railway</h1>'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on port ${PORT}`);
});