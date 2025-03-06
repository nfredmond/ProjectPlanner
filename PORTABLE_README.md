# Project Planner - Portable Edition

This is the portable edition of the Project Planner application, designed to run without installation or external dependencies.

## Quick Start

### First-time Setup

1. Extract the ZIP file to any location on your computer
2. Run one of the following startup scripts:
   - For Windows Command Prompt: Double-click `start-portable.bat`
   - For PowerShell: Right-click `start-portable.ps1` and select "Run with PowerShell"
3. The first run will:
   - Set up the local database
   - Configure self-signed certificates for HTTPS
   - Build the application
   - Start the server automatically
4. Access the application at https://localhost:3000 in your browser
   - You may see a security warning about the self-signed certificate
   - Click "Advanced" and then "Proceed to localhost (unsafe)" to continue

### Subsequent Runs

1. Simply run the startup script:
   - For Windows Command Prompt: `start-portable.bat`
   - For PowerShell: `start-portable.ps1`
2. Access the application at https://localhost:3000

## Default Admin Credentials

On first run, a default admin account is created:
- Email: admin@localhost
- Password: admin123

**Important:** Change the default password immediately after first login for security.

## Features and Limitations

The portable edition includes most core features but with some limitations:

### Available Features
- Project creation and management
- Scoring and prioritization
- Basic reporting
- User management

### Limitations
- No external LLM/AI features (OpenAI, Anthropic)
- Limited mapping capabilities (no online maps)
- No cloud storage for file attachments (files stored locally)
- No email notifications

## Data Storage

All data is stored locally in the `data` folder within the application directory:
- `data/local.db`: SQLite database file containing all application data
- `data/uploads`: Local storage for uploaded files and attachments

## Backup and Recovery

To backup your data:
1. Close the application
2. Copy the entire `data` folder to a safe location

To restore from backup:
1. Close the application
2. Replace the `data` folder with your backup

## Troubleshooting

### Application Won't Start
- Make sure you have administrative privileges
- Check that port 3000 is not in use by another application
- Try running the setup script directly: `node setup-portable.js`

### Certificate Errors
- The application uses self-signed certificates for HTTPS
- Certificate warnings in the browser are normal and can be bypassed
- If certificates are corrupted, delete the `certificates` folder and restart

### Database Errors
- If the database becomes corrupted, you can reset it by:
  1. Close the application
  2. Delete `data/local.db`
  3. Restart the application (a new database will be created)
  
  **Warning:** This will erase all your data!

## For Developers

If you want to modify the portable edition:

1. Clone the repository
2. Switch to the `portable-app` branch
3. Make your changes
4. Use `npm run portable:build` to build the application
5. Test with `npm run start:portable`

## Support

For issues or questions, please refer to the main documentation or contact support.

---

*Project Planner Portable Edition - For use without installation* 