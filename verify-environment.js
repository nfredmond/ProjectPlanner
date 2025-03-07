#!/usr/bin/env node
/**
 * Environment Configuration Verification Script
 * 
 * This script checks for the required environment variables and provides
 * helpful feedback to resolve configuration issues.
 */

require('dotenv').config();

let chalk;
try {
  // Try to require chalk
  chalk = require('chalk');
  // Check if chalk object has methods (for newer ESM versions)
  if (typeof chalk.green !== 'function') {
    chalk = chalk.default || {
      green: (text) => `\x1b[32m${text}\x1b[0m`,
      red: (text) => `\x1b[31m${text}\x1b[0m`,
      yellow: (text) => `\x1b[33m${text}\x1b[0m`,
      blue: (text) => `\x1b[34m${text}\x1b[0m`,
      bold: (text) => `\x1b[1m${text}\x1b[0m`
    };
  }
} catch (e) {
  // Fallback to ANSI colors if chalk is not available
  chalk = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
  };
}

const fs = require('fs');
const path = require('path');

console.log(chalk.bold('\n======================================='));
console.log(chalk.bold('   Environment Configuration Checker   '));
console.log(chalk.bold('=======================================\n'));

// Define required environment variables
const requiredVars = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase Project URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase Anonymous Key' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase Service Role Key' }
];

// Check for .env file existence
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log(chalk.red('❌ ERROR: .env file is missing!'));
  console.log(`
Please create a .env file in the project root and add the necessary environment variables.
You can copy the example file with: ${chalk.blue('cp .env.example .env')}
`);
  process.exit(1);
}

console.log(chalk.green('✅ .env file exists\n'));

// Check required environment variables
let hasErrors = false;
let envFileContent = fs.readFileSync(envPath, 'utf8');

console.log(chalk.bold('Checking required environment variables:'));

requiredVars.forEach(({ name, description }) => {
  const value = process.env[name];
  
  // Check if variable exists and has a non-default value
  if (!value) {
    console.log(chalk.red(`❌ ${name} is missing`));
    hasErrors = true;
  } else if (
    value === 'your-supabase-url' || 
    value === 'your-supabase-anon-key' || 
    value === 'your-supabase-service-role-key' ||
    value === 'example.supabase.co' ||
    value.includes('placeholder') || 
    // Exclude our specific Supabase URL from the check
    (value.includes('supabase.co') && value !== 'https://bcwwhrfxvotfskqjqlrv.supabase.co')
  ) {
    console.log(chalk.yellow(`⚠️ ${name} appears to have a default/placeholder value`));
    hasErrors = true;
  } else {
    console.log(chalk.green(`✅ ${name} is set correctly`));
  }
});

if (hasErrors) {
  console.log(`
${chalk.red('Configuration errors were found!')}

Please update your ${chalk.bold('.env')} file with the correct values:

1. Go to your Supabase project dashboard
2. Navigate to Project Settings → API
3. Copy the URL and keys to your .env file

Example .env configuration:
${chalk.blue(`
NEXT_PUBLIC_SUPABASE_URL=https://bcwwhrfxvotfskqjqlrv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
`)}

Note: The default Supabase project URL is already configured, but you'll need to add your API keys.
`);
} else {
  console.log(`
${chalk.green('All required environment variables are configured correctly!')}

You can now run your application:
- Development: ${chalk.blue('npm run dev')}
- Production build: ${chalk.blue('npm run build')}
`);
}

// Basic connectivity test (optional, comment out if not needed)
console.log(chalk.bold('\nAttempting basic connectivity test...'));

try {
  const { createClient } = require('@supabase/supabase-js');
  
  // Use default URL if environment variable is missing or invalid
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Use default URL if missing or invalid
  if (!supabaseUrl || supabaseUrl.includes('your-') || supabaseUrl.includes('placeholder')) {
    console.log(chalk.yellow('⚠️ Using default Supabase URL: https://bcwwhrfxvotfskqjqlrv.supabase.co'));
    supabaseUrl = 'https://bcwwhrfxvotfskqjqlrv.supabase.co';
  }
  
  if (!supabaseKey || supabaseKey.includes('your-') || supabaseKey.includes('placeholder')) {
    console.log(chalk.yellow('⚠️ Cannot connect to Supabase: Missing or invalid API key'));
    console.log(chalk.yellow('Please update your NEXT_PUBLIC_SUPABASE_ANON_KEY in the .env file'));
    process.exit(hasErrors ? 1 : 0);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Quick ping test
  supabase.auth.getSession()
    .then(() => {
      console.log(chalk.green('✅ Successfully connected to Supabase!'));
      process.exit(hasErrors ? 1 : 0);
    })
    .catch(error => {
      console.log(chalk.red(`❌ Failed to connect to Supabase: ${error.message}`));
      process.exit(1);
    });
} catch (error) {
  console.log(chalk.red(`❌ Failed to initialize Supabase client: ${error.message}`));
  console.log(chalk.yellow('This could be due to missing dependencies. Try running: npm install @supabase/supabase-js'));
  process.exit(1);
} 