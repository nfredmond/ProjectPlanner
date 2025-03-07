# Loading Issues Troubleshooting Guide

If you're experiencing issues with the application being stuck on the loading screen, follow these troubleshooting steps to resolve the problem.

## Common Causes and Solutions

### 1. Database Connection Issues

The most common cause of the application being stuck on loading is incorrect database configuration.

#### Supabase Configuration:
1. Make sure you have a proper `.env` file in the root of your project
2. Verify the following environment variables are correctly set:
   - `NEXT_PUBLIC_SUPABASE_URL=https://bcwwhrfxvotfskqjqlrv.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase`
   - `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase`
   - `DATABASE_PROVIDER=supabase`
3. If you're unsure, run the verification script:
   ```bash
   node verify-environment.js
   ```
   This will check your Supabase configuration and test the connection.

#### SQLite Configuration (Portable Mode):
1. Verify that `DATABASE_PROVIDER=sqlite` is set in your `.env` file
2. Ensure the `data` directory exists and is writable
3. Check if `data/local.db` exists and is not corrupted

### 2. Ollama Integration Issues

If you're using the local LLM integration with Ollama and experiencing issues:

#### Solution:
1. Verify Ollama is properly installed:
   ```bash
   ollama --version
   ```

2. Check if Ollama service is running:
   ```bash
   # On Windows, check in Task Manager for ollama.exe process
   # Or try to access the Ollama API
   curl http://localhost:11434/api/version
   ```

3. Verify the model is properly installed:
   ```bash
   ollama list
   ```

4. If the model is missing, pull it manually:
   ```bash
   ollama pull llama3
   # Or whatever model is configured in your LOCAL_LLM_MODEL
   ```

5. Check your `.env` configuration:
   ```
   LLM_PROVIDER=local
   LOCAL_LLM_MODEL=llama3
   ENABLE_LLM_FEATURES=true
   ```

6. Restart Ollama manually:
   ```bash
   # Stop any running Ollama process
   # Then start it again
   ollama serve
   ```

7. If you're using the portable app and Ollama wasn't installed automatically:
   - Download and install Ollama from [ollama.ai](https://ollama.ai)
   - Run the setup script again: `node setup-portable.js`

### 3. Environment Verification

Run the environment verification script to detect any configuration issues:
```bash
npm run verify-env
```

If any errors are detected, follow the instructions provided by the script.

### 4. API Rate Limits or Network Issues

#### Solution:
1. Check your internet connection
2. Verify that the Supabase project is online and not experiencing downtime
3. If you're making many requests, make sure you haven't hit any rate limits

### 5. Application Build Issues

If your application is not loading after a build:

#### Solution:
1. Clear the `.next` build cache:
   ```bash
   # On Windows Command Prompt
   rmdir /s /q .next
   
   # On PowerShell
   Remove-Item -Recurse -Force .next
   ```
2. Reinstall dependencies:
   ```bash
   npm install
   ```
3. Rebuild the application:
   ```bash
   npm run build
   npm start
   ```

### 6. Certificate Issues (HTTPS)

If you're having problems with HTTPS certificate errors:

#### Solution:
1. Regenerate the self-signed certificates:
   ```bash
   node setup-https.js
   ```
2. Restart the application with HTTPS:
   ```bash
   # Windows Command Prompt
   .\start-https.bat
   
   # PowerShell
   .\start-https.ps1
   ```
3. When accessing the site, accept the security warning by clicking "Advanced" and then "Proceed to localhost (unsafe)"

### 7. Browser-Related Issues

#### Solution:
1. Clear your browser cache
2. Try using a different browser
3. Disable any browser extensions that might interfere with the application

## Enhanced Debugging

If you need more information about what's failing:

1. Open your browser's developer tools (F12 or right-click → Inspect)
2. Go to the Console tab to check for error messages
3. Go to the Network tab to see if any requests are failing
4. For Ollama issues, check the Ollama logs:
   ```bash
   # If using the portable app, check the console output
   # Or manually run Ollama with verbose logging
   ollama serve -v
   ```

## Need More Help?

If you're still experiencing issues after trying these solutions:

1. Check for recent changes in the codebase that might have introduced the issue
2. Review the application logs for more detailed error information
3. Reach out to the development team with the following information:
   - Screenshots of any error messages
   - Steps to reproduce the issue
   - Browser and OS details
   - Results of the `npm run verify-env` command 