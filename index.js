import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Sentia Manufacturing Dashboard - Server is working!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

