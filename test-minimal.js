// Test minimal server startup
console.log('Testing minimal server startup...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('PORT environment:', process.env.PORT || 'not set');

// Import and test minimal server
import('./minimal-server.js').then(() => {
  console.log('Server imported successfully');
  setTimeout(() => {
    console.log('Test complete - server should be running');
  }, 1000);
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});