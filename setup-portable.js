const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n=============================================');
console.log('ProjectPlanner Portable App Setup');
console.log('=============================================\n');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create certificates directory if it doesn't exist
const certDir = path.join(__dirname, 'certificates');
if (!fs.existsSync(certDir)) {
  console.log('Creating certificates directory...');
  fs.mkdirSync(certDir, { recursive: true });
  
  // Generate self-signed certificates
  console.log('Generating self-signed certificates...');
  try {
    require('./setup-https');
  } catch (error) {
    console.error('Error generating certificates:', error.message);
  }
}

// Copy portable environment file if .env doesn't exist
const envFile = path.join(__dirname, '.env');
const envPortableExample = path.join(__dirname, '.env.portable.example');
if (!fs.existsSync(envFile) && fs.existsSync(envPortableExample)) {
  console.log('Creating default environment file for portable use...');
  fs.copyFileSync(envPortableExample, envFile);
}

// Initialize SQLite database
const dbPath = path.join(dataDir, 'local.db');
if (!fs.existsSync(dbPath)) {
  console.log('Initializing SQLite database...');
  // In a real implementation, this would initialize the SQLite schema
  // For demonstration purposes, we'll just create an empty file
  fs.writeFileSync(dbPath, '');
}

// Build the Next.js application if not already built
const nextDir = path.join(__dirname, '.next');
if (!fs.existsSync(nextDir)) {
  console.log('Building Next.js application...');
  try {
    execSync('npm run portable:build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error building the application:', error.message);
    process.exit(1);
  }
}

console.log('\n=============================================');
console.log('Setup complete! You can now start the application with:');
console.log('  * Windows Command Prompt: start-portable.bat');
console.log('  * PowerShell: ./start-portable.ps1');
console.log('=============================================\n'); 