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

### Method 3: Running with HTTPS (Recommended)

For secure local development with HTTPS:

1. Use the provided HTTPS scripts:
   ```
   .\start-https.bat
   ```
   Or with PowerShell:
   ```
   .\start-https.ps1
   ```

2. When accessing the site, your browser may show a security warning about the self-signed certificate.
   This is normal - click "Advanced" and then "Proceed to localhost (unsafe)" to continue.

## Accessing the Application

Once started, the Next.js server will be available at:
- https://localhost:3000

If port 3000 is already in use, Next.js will automatically try the next available port (3001, 3002, etc.)

## LLM Integration

The application supports integration with language models (LLMs) in several ways:

### Cloud LLM Integration
To use cloud-based LLMs:
1. Choose your preferred provider in the `.env` file:
   ```
   LLM_PROVIDER=openai # or anthropic
   ```
2. Add the appropriate API key:
   ```
   OPENAI_API_KEY=your-key-here
   OPENAI_MODEL=o3-mini # recommended model
   ```
   Or for Anthropic:
   ```
   ANTHROPIC_API_KEY=your-key-here
   ANTHROPIC_MODEL=claude-3.7-sonnet # recommended model
   ```

### Local LLM with Ollama
For development without cloud dependencies, you can use Ollama:

1. Set up Ollama integration:
   ```
   LLM_PROVIDER=local
   LOCAL_LLM_MODEL=llama3 # or another available model
   ```

2. For the first run, the application will attempt to install Ollama automatically
   - If you encounter issues, download and install Ollama manually from [ollama.ai](https://ollama.ai)

3. The setup script will download the necessary model on first run
   - This may take some time depending on your internet connection

## Database Options

### Supabase (Default)
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Add your Supabase credentials to `.env`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   ```
3. Run the migration scripts found in the `supabase/migrations` directory

### Local SQLite (Development)
For simple local development without Supabase:
1. Set the database provider in `.env`:
   ```
   DATABASE_PROVIDER=sqlite
   ```
2. The application will automatically create and use a SQLite database in the `data` directory

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

### Ollama Integration Issues

If you're having problems with Ollama:
1. Check that Ollama is properly installed
2. Verify the model has been downloaded: `ollama list`
3. Try manually pulling the model: `ollama pull llama3`
4. See `LOADING_TROUBLESHOOTING.md` for more detailed steps

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

For more information on Python tests, see [README_PYTHON_TESTS.md](./README_PYTHON_TESTS.md).

## Building for Production
```
npm run build
```

## Environment Verification

Before running the development server or building the application, the environment variables are verified using:
```
npm run verify-env
```

This happens automatically as part of the `predev` and `prebuild` scripts, but you can run it manually to check your configuration 