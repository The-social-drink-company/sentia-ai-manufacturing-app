import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Create the absolute simplest static server
const distPath = path.resolve(__dirname, 'dist');

console.log('=== NUCLEAR SERVER STARTING ===');
console.log('Port:', PORT);
console.log('Dist path:', distPath);
console.log('Dist exists:', fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  console.log('Dist contents:', fs.readdirSync(distPath));
}

<<<<<<< HEAD
=======
// Simplest possible static serving
>>>>>>> development
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

<<<<<<< HEAD
app.use(express.static(distPath));

=======
// Serve static files
app.use(express.static(distPath));

// Catch all for SPA
>>>>>>> development
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NUCLEAR SERVER RUNNING ON PORT ${PORT}`);
});