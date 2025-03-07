/**
 * Ollama Setup Script
 * 
 * This script handles the download, installation, and configuration of Ollama
 * for running local LLMs in the portable app.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const https = require('https');
const { createWriteStream } = require('fs');
const { isAdmin } = require('node-windows'); // If this fails, use the function below instead

// Manual isAdmin check for Windows
function checkAdminRights() {
  try {
    // Try to write to a protected location (this will fail if not admin)
    execSync('net session >nul 2>&1');
    return true;
  } catch (e) {
    return false;
  }
}

console.log('\n=============================================');
console.log('Ollama Setup for ProjectPlanner Portable App');
console.log('=============================================\n');

// Paths
const ollamaDir = path.join(__dirname, 'ollama');
const ollamaModelsDir = path.join(ollamaDir, 'models');
const ollamaExe = path.join(ollamaDir, 'ollama.exe');
const downloadPath = path.join(ollamaDir, 'ollama_installer.exe');

// Create ollama directory if it doesn't exist
console.log('Creating Ollama directory...');
if (!fs.existsSync(ollamaDir)) {
  try {
    fs.mkdirSync(ollamaDir, { recursive: true });
  } catch (err) {
    console.error(`Error creating Ollama directory: ${err.message}`);
    console.log('Will attempt to continue...');
  }
}

if (!fs.existsSync(ollamaModelsDir)) {
  try {
    fs.mkdirSync(ollamaModelsDir, { recursive: true });
  } catch (err) {
    console.error(`Error creating Ollama models directory: ${err.message}`);
  }
}

// Function to download a file
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from ${url}...`);
    const file = createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        console.log(`Following redirect to ${response.headers.location}...`);
        return downloadFile(response.headers.location, destination)
          .then(resolve)
          .catch(reject);
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(destination, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Check if Ollama is already installed
async function setupOllama() {
  try {
    // Check for admin rights
    const hasAdminRights = isAdmin || checkAdminRights();
    
    if (!hasAdminRights) {
      console.log('\n⚠️ WARNING: This script is not running with administrator privileges.');
      console.log('Installing Ollama may fail without admin rights.');
      console.log('It is recommended to restart the script with "Run as administrator".');
      console.log('\nAttempting to continue anyway...\n');
    }
    
    if (!fs.existsSync(ollamaExe)) {
      console.log('Ollama not found. Downloading Ollama...');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(ollamaDir)) {
        fs.mkdirSync(ollamaDir, { recursive: true });
      }
      
      try {
        // Download Ollama installer
        await downloadFile('https://ollama.com/download/ollama-windows-amd64.exe', downloadPath);
        
        console.log('Installing Ollama (this may take a few minutes)...');
        // Try to run the installer silently with the /S flag
        try {
          execSync(`"${downloadPath}" /S /D=${ollamaDir}`, { stdio: 'inherit' });
          console.log('Ollama installation completed.');
        } catch (installError) {
          console.error(`Error during silent installation: ${installError.message}`);
          console.log('\nTrying alternative installation method...');
          
          // If silent install fails, try to run the installer directly
          console.log('Please complete the Ollama installation wizard that will appear.');
          console.log('After installation completes, come back to this window.');
          
          try {
            execSync(`"${downloadPath}"`, { stdio: 'inherit' });
            console.log('Manual installation completed. Continuing setup...');
          } catch (manualInstallError) {
            throw new Error(`Both installation methods failed. Error: ${manualInstallError.message}`);
          }
        }
        
        // Clean up the installer
        if (fs.existsSync(downloadPath)) {
          try {
            fs.unlinkSync(downloadPath);
          } catch (unlinkError) {
            console.log(`Warning: Could not delete installer file: ${unlinkError.message}`);
          }
        }
      } catch (downloadError) {
        console.error(`Error downloading/installing Ollama: ${downloadError.message}`);
        console.log('\nPlease install Ollama manually:');
        console.log('1. Download from https://ollama.com/download');
        console.log('2. Install Ollama');
        console.log('3. Run: ollama pull llama3');
        return;
      }
    } else {
      console.log('Ollama already installed.');
    }
    
    // Check if Ollama is actually installed
    if (!fs.existsSync(ollamaExe)) {
      console.error('Ollama executable not found after installation attempt.');
      console.log('You may need to install Ollama manually and copy it to:');
      console.log(ollamaExe);
      return;
    }
    
    // Download the model
    console.log('Downloading and setting up LLM model (this may take several minutes)...');
    
    // Read the model name from .env or .env.portable.example
    let modelName = 'llama3';
    
    if (fs.existsSync(path.join(__dirname, '.env'))) {
      const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
      const modelMatch = envContent.match(/LOCAL_LLM_MODEL=(\w+)/);
      if (modelMatch && modelMatch[1]) {
        modelName = modelMatch[1];
      }
    } else if (fs.existsSync(path.join(__dirname, '.env.portable.example'))) {
      const envContent = fs.readFileSync(path.join(__dirname, '.env.portable.example'), 'utf8');
      const modelMatch = envContent.match(/LOCAL_LLM_MODEL=(\w+)/);
      if (modelMatch && modelMatch[1]) {
        modelName = modelMatch[1];
      }
    }
    
    console.log(`Starting Ollama and pulling ${modelName} model...`);
    
    // Start Ollama server in background
    let ollamaProcess;
    try {
      ollamaProcess = spawn(ollamaExe, ['serve'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      
      ollamaProcess.unref(); // Detach from parent process
      
      // Let the server start up
      console.log('Waiting for Ollama server to start...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (startError) {
      console.error(`Error starting Ollama server: ${startError.message}`);
      console.log('You may need to start Ollama manually before using LLM features.');
      return;
    }
    
    // Pull the model
    try {
      console.log(`Pulling ${modelName} model...`);
      execSync(`"${ollamaExe}" pull ${modelName}`, { stdio: 'inherit' });
      console.log(`Model ${modelName} installed successfully!`);
    } catch (error) {
      console.error(`Error pulling model: ${error.message}`);
      console.log('Attempting to use a smaller model instead...');
      try {
        execSync(`"${ollamaExe}" pull phi3:mini`, { stdio: 'inherit' });
        console.log('Model phi3:mini installed successfully!');
        
        // Update the .env file with the new model name
        if (fs.existsSync(path.join(__dirname, '.env'))) {
          let envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
          envContent = envContent.replace(/LOCAL_LLM_MODEL=(\w+)/, 'LOCAL_LLM_MODEL=phi3:mini');
          fs.writeFileSync(path.join(__dirname, '.env'), envContent);
        }
      } catch (fallbackError) {
        console.error(`Error pulling fallback model: ${fallbackError.message}`);
        console.log('Please try to pull a model manually after setup:');
        console.log('  1. Open Command Prompt');
        console.log(`  2. Run: "${ollamaExe}" pull phi3:mini`);
      }
    }
    
    console.log('\nOllama setup completed successfully!');
    console.log('Ollama will run in the background and serve local LLM requests.');
    console.log('\n=============================================');
    console.log('To use LLM features, make sure to:');
    console.log('1. Have Ollama running (it should start automatically with the portable app)');
    console.log('2. Set ENABLE_LLM_FEATURES=true in your .env file');
    console.log('3. Set LLM_PROVIDER=local in your .env file');
    console.log('=============================================\n');
    
  } catch (error) {
    console.error('Error setting up Ollama:', error.message);
    console.log('\nManual installation instructions:');
    console.log('1. Download Ollama from https://ollama.com/download');
    console.log('2. Install Ollama');
    console.log('3. Run: ollama pull llama3');
    console.log('4. Make sure Ollama is running when using the app');
  }
}

// Run the setup
setupOllama().catch(error => {
  console.error('Setup failed:', error);
}); 