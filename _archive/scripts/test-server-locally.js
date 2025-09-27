// Quick test to verify server-ultra-light.js works
import('./server-ultra-light.js').then(module => {
  console.log('✅ Server module loaded successfully');
}).catch(err => {
  console.error('❌ Server failed to load:', err);
  process.exit(1);
});