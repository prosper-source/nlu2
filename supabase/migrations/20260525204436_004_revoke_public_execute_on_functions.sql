/*
  # Fix PUBLIC EXECUTE grant on SECURITY DEFINER functions

  1. Changes
    - Revoke EXECUTE from PUBLIC role on handle_new_user() and update_user_total_points()
    - The PUBLIC grant is a default PostgreSQL behavior that gives execute to all roles.
      Since these are SECURITY DEFINER functions, this is dangerous — any role including
      anon can invoke them and run code as the function owner.

  2. Security
    - Only supabase_admin, postgres, and service_role should be able to execute these
    - They are triggered internally by DB events, not called via REST RPC
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_total_points() FROM PUBLIC;
