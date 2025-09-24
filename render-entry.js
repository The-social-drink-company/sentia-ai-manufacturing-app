#!/usr/bin/env node

/**
 * RENDER ENTRY POINT
 * Ensures the correct server is started for Render deployment
 */

console.log('='.repeat(70));
console.log('SENTIA MANUFACTURING DASHBOARD - RENDER DEPLOYMENT');
console.log('='.repeat(70));
console.log('Environment:', process.env.NODE_ENV || 'production');
console.log('Service:', process.env.RENDER_SERVICE_NAME || 'unknown');
console.log('Port:', process.env.PORT || 5000);
console.log('='.repeat(70));

// Import and start the server
try {
  console.log('Starting Sentia Manufacturing Dashboard server...');
  import('./server-fixed.js').catch(error => {
    console.error('Failed to import server-fixed.js:', error);
    console.log('Falling back to server.js...');
    import('./server.js').catch(fallbackError => {
      console.error('Failed to import server.js:', fallbackError);
      console.log('Starting minimal server...');
      import('./minimal-server.js');
    });
  });
} catch (error) {
  console.error('Critical error starting server:', error);
  process.exit(1);
}