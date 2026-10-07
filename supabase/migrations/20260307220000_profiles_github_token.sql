-- ============================================================================
-- 20260307220000_profiles_github_token.sql
-- Store GitHub OAuth provider token and profile metadata in Supabase
-- ============================================================================

-- Add columns to public.profiles if they don't already exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS github_token TEXT,
  ADD COLUMN IF NOT EXISTS github_username TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index for fast lookups by GitHub username
CREATE INDEX IF NOT EXISTS idx_profiles_github_username ON public.profiles (github_username);

-- Ensure RLS allows the user to update their own profile and token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Profiles are updatable by owner'
  ) THEN
    CREATE POLICY "Profiles are updatable by owner"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
