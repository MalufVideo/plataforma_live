-- Migration: Update handle_new_user function for Google OAuth support
-- Date: 2026-01-04
-- Description: Updates the profile creation trigger to properly handle Google OAuth
--              metadata fields like full_name, avatar_url, and picture

-- Drop and recreate the function to handle both email/password AND OAuth signups
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

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
