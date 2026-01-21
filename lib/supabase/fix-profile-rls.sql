-- Fix for "Database error saving new user"
-- Run this in your Supabase SQL Editor to fix the signup issue

-- Add INSERT policy for profiles table
-- This allows the handle_new_user trigger to create profiles
CREATE POLICY "Enable insert for service role and triggers"
    ON profiles FOR INSERT
    WITH CHECK (true);

-- Alternative: If the policy already exists, you can drop and recreate it:
-- DROP POLICY IF EXISTS "Enable insert for service role and triggers" ON profiles;
-- CREATE POLICY "Enable insert for service role and triggers"
--     ON profiles FOR INSERT
--     WITH CHECK (true);
