/*
  # Fix Security Issues

  1. Storage Policies
    - Remove broad SELECT policies "Anyone can view avatars" and "Anyone can view screenshots"
      from storage.objects. Public buckets don't need SELECT policies for URL access —
      public URLs work without them. These policies unnecessarily allow clients to LIST
      all files in the bucket, exposing more data than intended.

  2. Function Security
    - Revoke EXECUTE from `anon` and `authenticated` roles on `handle_new_user()` and
      `update_user_total_points()`. These are SECURITY DEFINER functions meant to be
      called only by database triggers, not via REST RPC. Leaving them callable allows
      any client to invoke them directly and escalate privileges.

  3. Security Changes
    - Drop 2 storage SELECT policies
    - Revoke 4 EXECUTE grants (2 functions x 2 roles)
    - Grant EXECUTE only to the trigger executor (postgres/supabase_admin)
*/

-- ============================================================
-- Fix 1: Remove broad SELECT policies on public storage buckets
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view screenshots" ON storage.objects;

-- ============================================================
-- Fix 2: Revoke EXECUTE on SECURITY DEFINER functions from anon and authenticated
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_total_points() FROM anon, authenticated;

-- Grant EXECUTE only to the role that runs triggers (supabase_admin / postgres)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_admin;
GRANT EXECUTE ON FUNCTION public.update_user_total_points() TO supabase_admin;
