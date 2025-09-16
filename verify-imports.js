import fs from 'fs';
import path from 'path';

console.log('Verifying all imports in server.js...\n');

const serverContent = fs.readFileSync('server.js', 'utf8');
const lines = serverContent.split('\n');

let hasErrors = false;
const importRegex = /^import .* from ['"](.+)['"]/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const match = line.match(importRegex);

  if (match) {
    const importPath = match[1];

    // Only check local imports (starting with . or /)
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      // Resolve the path relative to the project root
      const resolvedPath = path.resolve(importPath);
      const exists = fs.existsSync(importPath) || fs.existsSync(resolvedPath);

      if (exists) {
        console.log(`✓ Line ${i + 1}: ${importPath} exists`);
      } else {
        console.log(`✗ Line ${i + 1}: ${importPath} MISSING`);
        hasErrors = true;
      }
    }
  }
}

if (hasErrors) {
  console.log('\n❌ Some imports are missing!');
  process.exit(1);
} else {
  console.log('\n✅ All imports verified successfully!');
  process.exit(0);
}