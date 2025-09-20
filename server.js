const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Hello from the minimal server!');
});

app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Minimal server listening on port ${port}`);
});
