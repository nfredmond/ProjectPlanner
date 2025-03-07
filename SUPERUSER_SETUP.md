# Superuser Admin Setup Guide

Since there's an issue with the database schema (the "profiles" table doesn't exist), we need to set up the superuser admin account manually through the Supabase dashboard.

## 1. First, ensure your database schema is applied

1. Go to your Supabase dashboard: https://app.supabase.com
2. Navigate to your project: "ProjectPlanner"
3. Go to the SQL Editor section
4. Copy and paste the contents of `supabase/migrations/00001_initial_schema.sql` 
5. Execute the SQL to create the initial schema
6. Repeat for any additional migration files in the `supabase/migrations` folder

## 2. Create a superuser admin account

### Method 1: Using the Supabase Dashboard

1. Go to your Supabase dashboard: https://app.supabase.com
2. Navigate to your project: "ProjectPlanner"
3. Go to the "Authentication" > "Users" section
4. Click "Add User"
5. Enter your email: `nfredmond@gmail.com`
6. Enter a strong password (e.g., `Password123!`)
7. Click "Create User"

### Method 2: Using the API directly

If you have Postman or a similar tool, you can use the Supabase API directly:

```http
POST https://bcwwhrfxvotfskqjqlrv.supabase.co/auth/v1/admin/users
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd3docmZ4dm90ZnNrcWpxbHJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTE0MzE1OCwiZXhwIjoyMDU2NzE5MTU4fQ.wpQNt1BPj2IX_JSrSKPqHiuQzikjYUIZe_3kEaRiT4s
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd3docmZ4dm90ZnNrcWpxbHJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTE0MzE1OCwiZXhwIjoyMDU2NzE5MTU4fQ.wpQNt1BPj2IX_JSrSKPqHiuQzikjYUIZe_3kEaRiT4s

{
  "email": "nfredmond@gmail.com",
  "password": "Password123!",
  "email_confirm": true,
  "user_metadata": {
    "first_name": "Nathaniel",
    "last_name": "Redmond",
    "is_superuser": true
  }
}
```

## 3. Set up the agency and create a profile record

After creating the user, you need to:

1. Create an agency record (or use an existing one):

```sql
INSERT INTO agencies (name, region)
VALUES ('Green DOT Transportation Solutions', 'National')
RETURNING id;
```

2. Create a profile record for the user (replace `[USER_ID]` and `[AGENCY_ID]` with actual values):

```sql
INSERT INTO profiles (id, agency_id, role, first_name, last_name, title)
VALUES (
  '[USER_ID]', -- Get this from the Auth > Users section
  '[AGENCY_ID]', -- Get this from the first query above
  'admin',
  'Nathaniel',
  'Redmond',
  'Administrator'
);
```

## 4. Login with your superuser account

After completing these steps, you should be able to login with:

Email: nfredmond@gmail.com  
Password: Password123!  

## Troubleshooting

If you encounter any issues:

1. Check that all the database schema migrations have been applied
2. Ensure the user exists in the Auth > Users section
3. Confirm that a corresponding entry exists in the `profiles` table
4. Make sure the profile entry has the `admin` role
5. Verify the agency exists and is correctly referenced in the profile 