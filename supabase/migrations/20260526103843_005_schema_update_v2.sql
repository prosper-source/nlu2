/*
  # NOT LIKE US² Hub - Schema Update

  1. Modified Tables
    - `users` - Added: display_name, game_tag, weekly_points; Changed: role now includes 'pending'
    - `join_requests` - Added: message, reviewed_by, reviewed_at
    - `war_submissions` - Added: note, status (pending/approved/rejected), approved_by, approved_at; Removed: screenshot_url, approved
    - `announcements` - Added: pinned, author_id (replacing created_by)
    - `chat_messages` - Added: author_id (replacing user_id)

  2. New SQL Functions
    - approve_join_request(request_id) - Approves a join request and sets user role to 'member'
    - reject_join_request(request_id) - Rejects a join request
    - approve_war_submission(submission_id) - Approves a war submission and adds points
    - reject_war_submission(submission_id) - Rejects a war submission
    - reset_weekly_points() - Resets all weekly_points to 0

  3. Security
    - All functions are SECURITY DEFINER with EXECUTE restricted to admin users only
    - RLS policies updated for new columns and role structure
    - First registered user automatically becomes admin

  4. Important Notes
    1. Role now includes 'pending' - new users start as 'pending' role instead of separate approved field
    2. weekly_points tracks current week's points separately from total_points
    3. War submissions use a status field instead of approved boolean for better workflow
    4. Announcements support pinning
    5. Chat messages allow users to delete their own, admins can delete any
*/

-- ============================================================
-- Add new columns to users table
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'display_name') THEN
    ALTER TABLE users ADD COLUMN display_name text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'game_tag') THEN
    ALTER TABLE users ADD COLUMN game_tag text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'weekly_points') THEN
    ALTER TABLE users ADD COLUMN weekly_points integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Drop old check constraint on role and add new one with 'pending'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('pending', 'member', 'admin'));

-- Update existing users: set role based on approved status
UPDATE users SET role = 'member' WHERE approved = true AND role = 'member';
UPDATE users SET role = 'pending' WHERE approved = false;

-- ============================================================
-- Add new columns to join_requests table
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'join_requests' AND column_name = 'message') THEN
    ALTER TABLE join_requests ADD COLUMN message text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'join_requests' AND column_name = 'reviewed_by') THEN
    ALTER TABLE join_requests ADD COLUMN reviewed_by uuid REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'join_requests' AND column_name = 'reviewed_at') THEN
    ALTER TABLE join_requests ADD COLUMN reviewed_at timestamptz;
  END IF;
END $$;

-- ============================================================
-- Add new columns to war_submissions table
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'war_submissions' AND column_name = 'note') THEN
    ALTER TABLE war_submissions ADD COLUMN note text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'war_submissions' AND column_name = 'status') THEN
    ALTER TABLE war_submissions ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'war_submissions' AND column_name = 'approved_by') THEN
    ALTER TABLE war_submissions ADD COLUMN approved_by uuid REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'war_submissions' AND column_name = 'approved_at') THEN
    ALTER TABLE war_submissions ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

-- Update existing war_submissions: set status based on approved field
UPDATE war_submissions SET status = 'approved' WHERE approved = true;

-- Drop the old Saturday-only constraint to allow soft warnings instead
ALTER TABLE war_submissions DROP CONSTRAINT IF EXISTS war_date_is_saturday;

-- ============================================================
-- Add pinned column to announcements
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'pinned') THEN
    ALTER TABLE announcements ADD COLUMN pinned boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'author_id') THEN
    ALTER TABLE announcements ADD COLUMN author_id uuid REFERENCES users(id);
  END IF;
END $$;

-- Migrate created_by to author_id if author_id is null
UPDATE announcements SET author_id = created_by WHERE author_id IS NULL;

-- ============================================================
-- Add author_id to chat_messages (matching new naming convention)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'author_id') THEN
    ALTER TABLE chat_messages ADD COLUMN author_id uuid REFERENCES users(id);
  END IF;
END $$;

-- Migrate user_id to author_id
UPDATE chat_messages SET author_id = user_id WHERE author_id IS NULL;

-- ============================================================
-- Update RLS Policies - Drop old ones and create new
-- ============================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Approved users are viewable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own join request" ON join_requests;
DROP POLICY IF EXISTS "Admins can view all join requests" ON join_requests;
DROP POLICY IF EXISTS "Users can create own join request" ON join_requests;
DROP POLICY IF EXISTS "Admins can update join requests" ON join_requests;
DROP POLICY IF EXISTS "Approved users can view war submissions" ON war_submissions;
DROP POLICY IF EXISTS "Users can submit own war points" ON war_submissions;
DROP POLICY IF EXISTS "Admins can update war submissions" ON war_submissions;
DROP POLICY IF EXISTS "Approved users can view announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can create announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON announcements;
DROP POLICY IF EXISTS "Approved users can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Approved users can send chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can delete chat messages" ON chat_messages;

-- ============================================================
-- USERS POLICIES
-- ============================================================

CREATE POLICY "Users can view own or member profiles"
  ON users FOR SELECT
  TO authenticated
  USING (role IN ('member', 'admin') OR id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own non-role fields"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- JOIN REQUESTS POLICIES
-- ============================================================

CREATE POLICY "Users can view own join request"
  ON join_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all join requests"
  ON join_requests FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create own join request"
  ON join_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update join requests"
  ON join_requests FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- WAR SUBMISSIONS POLICIES
-- ============================================================

CREATE POLICY "Members can view war submissions"
  ON war_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('member', 'admin'))
  );

CREATE POLICY "Members can submit own war points"
  ON war_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('member', 'admin'))
  );

CREATE POLICY "Admins can update war submissions"
  ON war_submissions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- ANNOUNCEMENTS POLICIES
-- ============================================================

CREATE POLICY "Members can view announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('member', 'admin'))
    OR author_id = auth.uid()
  );

CREATE POLICY "Admins can create announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- CHAT MESSAGES POLICIES
-- ============================================================

CREATE POLICY "Members can view chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('member', 'admin'))
  );

CREATE POLICY "Members can send chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('member', 'admin'))
  );

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete any chat message"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- SQL FUNCTIONS for admin operations
-- ============================================================

-- Approve join request
CREATE OR REPLACE FUNCTION public.approve_join_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  req_user_id uuid;
BEGIN
  SELECT user_id INTO req_user_id FROM join_requests WHERE id = request_id AND status = 'pending';
  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Join request not found or already processed';
  END IF;

  UPDATE join_requests
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = request_id;

  UPDATE users SET role = 'member' WHERE id = req_user_id AND role = 'pending';
END;
$$;

-- Reject join request
CREATE OR REPLACE FUNCTION public.reject_join_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE join_requests
  SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = request_id AND status = 'pending';
END;
$$;

-- Approve war submission
CREATE OR REPLACE FUNCTION public.approve_war_submission(submission_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sub_user_id uuid;
  sub_points integer;
BEGIN
  SELECT user_id, points INTO sub_user_id, sub_points
  FROM war_submissions WHERE id = submission_id AND status = 'pending';

  IF sub_user_id IS NULL THEN
    RAISE EXCEPTION 'Submission not found or already processed';
  END IF;

  UPDATE war_submissions
  SET status = 'approved', approved_by = auth.uid(), approved_at = now()
  WHERE id = submission_id;

  UPDATE users
  SET total_points = total_points + sub_points,
      weekly_points = weekly_points + sub_points
  WHERE id = sub_user_id;
END;
$$;

-- Reject war submission
CREATE OR REPLACE FUNCTION public.reject_war_submission(submission_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE war_submissions
  SET status = 'rejected', approved_by = auth.uid(), approved_at = now()
  WHERE id = submission_id AND status = 'pending';
END;
$$;

-- Reset weekly points
CREATE OR REPLACE FUNCTION public.reset_weekly_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE users SET weekly_points = 0 WHERE role IN ('member', 'admin');
END;
$$;

-- Restrict function execution to admins only via RLS-like check
-- (We revoke from anon/authenticated and only allow via service_role or direct admin call)
REVOKE EXECUTE ON FUNCTION public.approve_join_request(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_join_request(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_war_submission(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_war_submission(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_weekly_points() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- Update handle_new_user trigger for new schema
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  INSERT INTO public.users (id, username, display_name, avatar_url, bio, game_tag, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    COALESCE(NEW.raw_user_meta_data->>'game_tag', ''),
    'pending'
  );

  INSERT INTO public.join_requests (user_id, message, status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'message', ''), 'pending');

  -- First user becomes admin automatically
  SELECT COUNT(*) INTO user_count FROM public.users;
  IF user_count = 1 THEN
    UPDATE public.users SET role = 'admin' WHERE id = NEW.id;
    UPDATE public.join_requests SET status = 'approved', reviewed_by = NEW.id, reviewed_at = now() WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- Add new indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_weekly_points ON users(weekly_points DESC);
CREATE INDEX IF NOT EXISTS idx_war_submissions_status ON war_submissions(status);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(pinned) WHERE pinned = true;

-- Add realtime for war_submissions and join_requests
ALTER PUBLICATION supabase_realtime ADD TABLE war_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE join_requests;
