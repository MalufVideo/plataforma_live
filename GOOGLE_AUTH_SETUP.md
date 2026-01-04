# Google Authentication Setup

This guide walks you through setting up Google OAuth authentication for the Live Video platform.

## Prerequisites

- A Supabase project
- A Google Cloud Console account

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in the required fields (App name, User support email, Developer contact)
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if in testing mode
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Live Video Platform`
   - Authorized JavaScript origins:
     ```
     http://localhost:5173
     https://livevideo.com.br
     https://YOUR_SUPABASE_PROJECT.supabase.co
     ```
   - Authorized redirect URIs:
     ```
     https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
     ```
7. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and click to expand
5. Toggle **Enable Google provider** ON
6. Enter your Google **Client ID** and **Client Secret**
7. Save the configuration

## Step 3: Apply Database Migration

Run the following SQL in your Supabase SQL Editor to update the profile creation trigger:

```sql
-- Run this in Supabase SQL Editor: Dashboard > SQL Editor > New query

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_name TEXT;
  user_avatar TEXT;
  user_username TEXT;
BEGIN
  -- Get name: prefer 'name', then 'full_name' (Google OAuth)
  user_name := COALESCE(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  -- Get avatar: check for avatar_url or picture (Google OAuth)
  user_avatar := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  -- Get username from metadata (only set during email/password signup)
  user_username := new.raw_user_meta_data->>'username';

  INSERT INTO public.profiles (id, email, name, username, avatar, role)
  VALUES (
    new.id,
    new.email,
    user_name,
    user_username,
    user_avatar,
    'ATTENDEE'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Or run the migration file located at:
```
apps/backend/migrations/001_google_oauth_trigger.sql
```

## Step 4: Configure Redirect URLs

The frontend is already configured to handle redirects. Make sure your production URL is correct in:

- `apps/frontend/services/supabaseService.ts` - The `signInWithGoogle()` function uses:
  - Development: `http://localhost:5173`
  - Production: `https://livevideo.com.br`

## How It Works

1. User clicks "Sign in with Google" button
2. User is redirected to Google's OAuth consent screen
3. After consent, Google redirects to Supabase callback URL
4. Supabase creates/updates the auth user
5. The database trigger automatically creates a profile with:
   - Name from Google account
   - Profile picture from Google account
   - Email from Google account
   - Default role: ATTENDEE
6. User is redirected back to the app and logged in

## Troubleshooting

### "Error: redirect_uri_mismatch"
- Verify that the redirect URI in Google Console matches exactly:
  `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### Profile not created after Google sign-in
- Run the migration SQL to update the trigger function
- Check Supabase logs for any errors in the trigger

### Avatar not showing
- The trigger now captures the Google profile picture
- For existing users, the avatar can be updated manually in the profile

## Security Notes

- OAuth Client Secret should never be exposed in frontend code
- The secret is safely stored in Supabase's backend
- All OAuth flows are handled server-side by Supabase
