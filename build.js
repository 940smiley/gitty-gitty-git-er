/**
 * Build script for Gitty-Gitty-Git-Er executable
 * Creates a standalone executable using pkg
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
fs.writeFileSync('pkg-config.json', JSON.stringify(exePackageJson, null, 2));

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Build the executable
try {
  console.log('Building executable...');
  execSync('pkg -c pkg-config.json chatbot.js');
  console.log('Build completed successfully!');
  
  // Clean up
  fs.unlinkSync('pkg-config.json');
  
  console.log('Executables are available in the dist directory:');
  const files = fs.readdirSync('dist');
  files.forEach(file => {
    console.log(`- dist/${file}`);
  });
} catch (error) {
  console.error('Build failed:', error.message);
  // Clean up on error
  if (fs.existsSync('pkg-config.json')) {
    fs.unlinkSync('pkg-config.json');
  }
  process.exit(1);
}