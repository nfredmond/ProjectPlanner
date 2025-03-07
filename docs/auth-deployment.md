# Authentication System Deployment Guide

This guide details how to deploy the updated authentication system and reset the admin superuser.

## Overview of Changes

We've made several updates to the authentication system to fix issues with cookie handling and user creation:

1. Created server actions for authentication operations (`src/lib/auth-actions.ts`)
2. Created API routes for user registration and admin reset
3. Updated client components to use server actions for authentication
4. Added SQL migrations for admin user management
5. Added comprehensive documentation

## Deployment Steps

### 1. Deploy Code Changes

```bash
# Pull the latest changes
git pull

# Install dependencies (if any new ones were added)
npm install

# Build the application
npm run build

# Start the application
npm start
```

### 2. Apply Database Migrations

1. Log into your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/20240720_auth_fixes.sql`
4. Run the script in the SQL Editor

### 3. Verify Admin User Reset

The migration automatically attempts to reset the admin user with the specified credentials:
- Email: `nfredmond@gmail.com`
- Password: `Yuba530#`

To verify the admin user was reset correctly, try logging in with these credentials.

### 4. Update Environment Variables (if needed)

If you want to customize the secret key used for admin resets, add the following to your environment variables:

```
ADMIN_RESET_KEY=your_custom_secret_key
```

## Using the Admin Reset Page

An admin reset page is now available at `/admin-reset`. This page allows you to reset the admin superuser through a user-friendly interface:

1. Navigate to `/admin-reset` in your application
2. Enter the admin email (default: `nfredmond@gmail.com`)
3. Enter the password
4. Enter the secret key (default: `ProjectPlanner_AdminReset_2024`)
5. Click "Reset Admin User"

## SQL Functions for Admin Management

Two SQL functions have been added to the database for admin user management:

1. `public.reset_admin_user(admin_email TEXT, admin_password TEXT)`
   - Resets or creates an admin user with the specified email and password
   - Example: `SELECT public.reset_admin_user('admin@example.com', 'securepassword');`

2. `public.reset_admin_user_with_key(admin_email TEXT, admin_password TEXT, access_key TEXT)`
   - More secure version that requires a secret key
   - Example: `SELECT public.reset_admin_user_with_key('admin@example.com', 'securepassword', 'YourSecretKey');`

## Troubleshooting

If you encounter issues with the authentication system after deployment:

1. Check the server logs for specific error messages
2. Verify that all code changes were deployed correctly
3. Make sure the database migrations were applied successfully
4. Try resetting the admin user using the SQL function directly:
   ```sql
   SELECT public.reset_admin_user('nfredmond@gmail.com', 'Yuba530#');
   ```
5. Clear browser cookies and try again

For more detailed information about the authentication system, refer to [auth-system.md](./auth-system.md). 