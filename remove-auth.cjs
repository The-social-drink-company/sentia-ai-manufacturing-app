const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to remove
const authImportPatterns = [
  /import\s+.*?from\s+['"].*?(clerk|auth|Auth|Clerk).*?['"];?\s*\n/g,
  /import\s+\{\s*useAuth.*?\}\s+from.*?;?\s*\n/g,
  /import\s+\{\s*useUser.*?\}\s+from.*?;?\s*\n/g,
  /import\s+\{\s*useClerk.*?\}\s+from.*?;?\s*\n/g,
  /import\s+\{\s*SignIn.*?\}\s+from.*?;?\s*\n/g,
  /import\s+\{\s*SignUp.*?\}\s+from.*?;?\s*\n/g,
  /import\s+\{\s*ClerkProvider.*?\}\s+from.*?;?\s*\n/g,
  /import\s+\{\s*BulletproofClerkProvider.*?\}\s+from.*?;?\s*\n/g,
  /import\s+\{\s*BulletproofAuthProvider.*?\}\s+from.*?;?\s*\n/g,
  /import\s+\{\s*withClerk.*?\}\s+from.*?;?\s*\n/g,
];

// Patterns for auth usage
const authUsagePatterns = [
  /const\s+\{[^}]*?(user|isSignedIn|isLoaded|signOut|clerk)[^}]*?\}\s*=\s*useAuth\(\);?/g,
  /const\s+\{[^}]*?(user|isSignedIn|isLoaded)[^}]*?\}\s*=\s*useUser\(\);?/g,
  /const\s+\{[^}]*?clerk[^}]*?\}\s*=\s*useClerk\(\);?/g,
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Remove auth imports
    authImportPatterns.forEach(pattern => {
      content = content.replace(pattern, '');
    });

    // Replace auth usage with defaults
    authUsagePatterns.forEach(pattern => {
      content = content.replace(pattern,
        '// Authentication removed\n  const user = { name: "User" };\n  const isSignedIn = true;\n  const isLoaded = true;'
      );
    });

    // Replace specific auth checks
    content = content.replace(/if\s*\(\s*!isSignedIn\s*\)/g, 'if (false)');
    content = content.replace(/if\s*\(\s*isSignedIn\s*\)/g, 'if (true)');
    content = content.replace(/user\?\.firstName/g, '"User"');
    content = content.replace(/user\?\.emailAddress/g, '"user@example.com"');

    // Remove ClerkProvider wrappers
    content = content.replace(/<ClerkProvider[^>]*>([^]*?)<\/ClerkProvider>/g, '$1');
    content = content.replace(/<BulletproofClerkProvider[^>]*>([^]*?)<\/BulletproofClerkProvider>/g, '$1');
    content = content.replace(/<BulletproofAuthProvider[^>]*>([^]*?)<\/BulletproofAuthProvider>/g, '$1');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log('Processed:', filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error processing', filePath, ':', error.message);
    return false;
  }
}

// Find all JSX and JS files
const patterns = [
  'src/**/*.jsx',
  'src/**/*.js',
];

let totalProcessed = 0;

patterns.forEach(pattern => {
  const files = glob.sync(pattern, {
    cwd: __dirname,
    absolute: true
  });

  files.forEach(file => {
    if (processFile(file)) {
      totalProcessed++;
    }
  });
});

console.log(`\nTotal files processed: ${totalProcessed}`);
console.log('Authentication removal complete!');