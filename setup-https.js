// Script to check and create SSL certificates for local development
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const certificatesDir = path.join(__dirname, 'certificates');
const keyPath = path.join(certificatesDir, 'cert.key');
const certPath = path.join(certificatesDir, 'cert.crt');
const caKeyPath = path.join(certificatesDir, 'ca.key');
const caCertPath = path.join(certificatesDir, 'ca.crt');

function ensureCertificatesExist() {
  console.log('Checking for SSL certificates...');
  
  // Create certificates directory if it doesn't exist
  if (!fs.existsSync(certificatesDir)) {
    console.log('Creating certificates directory...');
    fs.mkdirSync(certificatesDir, { recursive: true });
  }

  // Check if certificates already exist
  const certsExist = fs.existsSync(keyPath) && 
                     fs.existsSync(certPath) &&
                     fs.existsSync(caKeyPath) && 
                     fs.existsSync(caCertPath);

  if (certsExist) {
    console.log('SSL certificates already exist.');
    return;
  }

  console.log('Generating SSL certificates...');
  try {
    // Change to certificates directory
    process.chdir(certificatesDir);
    
    // Generate CA certificate
    console.log('Creating Certificate Authority...');
    execSync('npx mkcert create-ca', { stdio: 'inherit' });
    
    // Generate server certificate
    console.log('Creating server certificate...');
    execSync('npx mkcert create-cert --domains localhost,127.0.0.1', { stdio: 'inherit' });
    
    console.log('SSL certificates successfully generated.');
    
    // Change back to project root
    process.chdir(__dirname);
  } catch (error) {
    console.error('Error generating certificates:', error.message);
    process.exit(1);
  }
}

// Run the function
ensureCertificatesExist(); 