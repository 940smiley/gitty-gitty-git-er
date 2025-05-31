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

// Create a temporary CommonJS version of the chatbot
console.log('Creating CommonJS version of chatbot...');
const chatbotContent = fs.readFileSync(path.join(__dirname, 'chatbot.js'), 'utf8');
const commonJSContent = chatbotContent
  .replace(/import\s+(\w+)\s+from\s+['"](.+)['"]/g, 'const $1 = require("$2")')
  .replace(/import\s+\{\s*(.+)\s*\}\s+from\s+['"](.+)['"]/g, 'const { $1 } = require("$2")')
  .replace(/export\s+default\s+(\w+)/g, 'module.exports = $1');

fs.writeFileSync(path.join(__dirname, 'chatbot.cjs'), commonJSContent);

// Create a package.json specifically for the executable
const exePackageJson = {
  "name": "gitty-gitty-git-er",
  "version": "1.0.0",
  "bin": "chatbot.cjs",
  "pkg": {
    "targets": [
      "node16-linux-x64",
      "node16-macos-x64",
      "node16-win-x64"
    ],
    "outputPath": "dist",
    "assets": [
      "node_modules/**/*"
    ]
  },
  "dependencies": {
    "@octokit/rest": "^19.0.7",
    "axios": "^1.4.0",
    "dotenv": "^16.0.3",
    "winston": "^3.8.2"
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
  execSync('pkg -c pkg-config.json chatbot.cjs', { cwd: __dirname });
  console.log('Build completed successfully!');
  
  // Create a batch file to run the executable
  const batchContent = `@echo off
echo Starting Gitty-Gitty-Git-Er...
cd %~dp0
dist\\gitty-gitty-git-er-win.exe
echo.
echo If you see this message, the application crashed.
echo Press any key to exit...
pause > nul`;
  
  fs.writeFileSync(path.join(__dirname, 'run.bat'), batchContent);
  
  // Clean up
  fs.unlinkSync(path.join(__dirname, 'pkg-config.json'));
  fs.unlinkSync(path.join(__dirname, 'chatbot.cjs'));
  
  console.log('Executables are available in the dist directory:');
  const files = fs.readdirSync(distDir);
  files.forEach(file => {
    console.log(`- dist/${file}`);
  });
  console.log('\nUse run.bat to start the Windows executable');
} catch (error) {
  console.error('Build failed:', error.message);
  // Clean up on error
  if (fs.existsSync(path.join(__dirname, 'pkg-config.json'))) {
    fs.unlinkSync(path.join(__dirname, 'pkg-config.json'));
  }
  if (fs.existsSync(path.join(__dirname, 'chatbot.cjs'))) {
    fs.unlinkSync(path.join(__dirname, 'chatbot.cjs'));
  }
  process.exit(1);
}