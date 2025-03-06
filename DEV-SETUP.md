# Development Environment Setup

This document explains how to set up and run the development environment for the Project Planner application.

## Starting the Development Server

We've created convenient scripts to start the Next.js development server. Choose one of the following methods:

### Method 1: Using the Batch Script (Windows Command Prompt)

1. Navigate to the project directory in File Explorer
2. Double-click on `start-dev.bat`
   
   Or from Command Prompt:
   ```
   .\start-dev.bat
   ```

### Method 2: Using the PowerShell Script

1. Right-click on `start-dev.ps1` and select "Run with PowerShell"
   
   Or from PowerShell:
   ```
   .\start-dev.ps1
   ```
   
   If you encounter execution policy restrictions, use:
   ```
   powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
   ```

## Accessing the Application

Once started, the Next.js server will be available at:
- http://localhost:3000

If port 3000 is already in use, Next.js will automatically try the next available port (3001, 3002, etc.)

## Common Issues and Solutions

### Package.json Not Found Error

If you see an error like this:
```
npm error code ENOENT
npm error syscall open
npm error path C:\path\to\package.json
```

Make sure you're running the npm commands from the project root directory where package.json is located. Our start scripts handle this automatically.

### TypeScript Version Warning

You may see a warning about TypeScript version compatibility:
```
WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree.
```

This warning can be safely ignored as long as the application builds and runs correctly.

## Running Tests

### JavaScript/TypeScript Tests
```
npm run test
```

### Python Tests
Make sure to activate the virtual environment first:
```
.\.venv\Scripts\activate
cd tests
python -m pytest -v
```

## Building for Production
```
npm run build
``` 