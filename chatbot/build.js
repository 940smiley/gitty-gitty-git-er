/**
 * Build script for Gitty-Gitty-Git-Er executable
 * Creates a standalone executable using pkg
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting build process...');
console.log(`Current directory: ${__dirname}`);

// Ensure pkg is installed
try {
  console.log('Checking for pkg...');
  execSync('npm list -g pkg || npm install -g pkg');
  console.log('pkg is installed');
} catch (error) {
  console.error('Failed to check or install pkg:', error.message);
  process.exit(1);
}

// Create a package.json specifically for the executable
const exePackageJson = {
  name: "gitty-gitty-git-er",
  version: "1.0.0",
  bin: "chatbot.js",
  type: "module",
  pkg: {
    targets: [
      "node16-linux-x64",
      "node16-macos-x64",
      "node16-win-x64"
    ],
    outputPath: "dist"
  }
};

// Write the temporary package.json for pkg
fs.writeFileSync(path.join(__dirname, 'pkg-config.json'), JSON.stringify(exePackageJson, null, 2));

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Build the executable
try {
  console.log('Building executable...');
  execSync('pkg -c pkg-config.json chatbot.js', { cwd: __dirname });
  console.log('Build completed successfully!');
  
  // Clean up
  fs.unlinkSync(path.join(__dirname, 'pkg-config.json'));
  
  console.log('Executables are available in the dist directory:');
  const files = fs.readdirSync(distDir);
  files.forEach(file => {
    console.log(`- dist/${file}`);
  });
} catch (error) {
  console.error('Build failed:', error.message);
  // Clean up on error
  if (fs.existsSync(path.join(__dirname, 'pkg-config.json'))) {
    fs.unlinkSync(path.join(__dirname, 'pkg-config.json'));
  }
  process.exit(1);
}