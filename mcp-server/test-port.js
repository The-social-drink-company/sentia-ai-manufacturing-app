console.log('PORT environment variable:', process.env.PORT);
console.log('Default port would be:', process.env.PORT || 6000);
console.log('All environment variables containing PORT:');
Object.keys(process.env).forEach(key => {
  if (key.includes('PORT')) {
    console.log(`${key}: ${process.env[key]}`);
  }
});