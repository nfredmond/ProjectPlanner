# Authentication System Documentation

## Overview

This document outlines the authentication system used in the ProjectPlanner application. The system uses Supabase for authentication and user management, with Next.js server actions to handle cookie management properly.

## Key Components

### 1. Server Actions (`src/lib/auth-actions.ts`)

This file contains server actions for authentication-related operations:

- `signOut()`: Properly handles signing out users and clearing cookies
- `createUser()`: Creates new users with proper roles and profiles
- `resetAdminUser()`: Resets or creates an admin superuser

### 2. API Routes

- `/api/auth/register` (`src/app/api/auth/register/route.ts`): Handles user registration
- `/api/admin/reset` (`src/app/api/admin/reset/route.ts`): Handles admin user reset

### 3. Client Components

- `RegisterForm` (`src/components/auth/register-form.tsx`): Form for user registration
- `Header` (`src/components/layout/header.tsx`): Contains sign out functionality using server actions

## Common Tasks

### Creating New Users

User registration now works through the Registration form which uses a server action to properly create users. The server action handles:

1. Creating the user in Supabase Auth
2. Creating the user profile in the database
3. Handling new agency requests

### Resetting Admin User

To reset the admin superuser:

1. Visit the `/admin-reset` page
2. Enter the admin email (nfredmond@gmail.com)
3. Enter the password (Yuba530#)
4. Enter the secret key (ProjectPlanner_AdminReset_2024)
5. Click "Reset Admin User"

Alternatively, you can run the SQL script provided in the SQL editor in the Supabase dashboard.

### Signing Out

Sign out now uses a Next.js server action to properly handle cookies. This fixes the previous issue where cookies could only be modified in a Server Action or Route Handler.

## Troubleshooting

### Common Issues

1. **"Cookies can only be modified in a Server Action or Route Handler"**:
   - This error occurs when trying to modify cookies from client components or middleware
   - Solution: Use the server actions in `auth-actions.ts` for any authentication operations

2. **"Invalid Refresh Token: Refresh Token Not Found"**:
   - This can occur when the refresh token is missing or invalid
   - Solution: Sign out and sign in again, or reset the user if needed

3. **User creation fails**:
   - Check that the agency ID is valid
   - Ensure all required fields are provided
   - Check server logs for specific error messages

## Implementation Details

The authentication system now enforces that cookie operations only happen in server actions or API routes, which is required by Next.js. The previous implementation was trying to modify cookies in client components, which was causing errors.

Key changes:
- Created server actions for authentication operations
- Updated client components to use these server actions
- Created API routes for operations requiring more complex logic
- Added proper error handling and logging 