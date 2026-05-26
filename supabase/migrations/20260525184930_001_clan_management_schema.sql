/*
  # NOT LIKE US² - Clan Management Schema

  1. New Tables
    - `users`
      - `id` (uuid, PK, references auth.users) - User's auth ID
      - `username` (text, unique) - Display username
      - `full_name` (text) - Full name
      - `avatar_url` (text) - Profile avatar URL from Supabase Storage
      - `bio` (text) - User bio/description
      - `role` (text, default 'member') - Role: 'member' or 'admin'
      - `total_points` (integer, default 0) - Accumulated war points
      - `approved` (boolean, default false) - Whether admin approved the user
      - `created_at` (timestamptz) - Registration timestamp

    - `join_requests`
      - `id` (uuid, PK) - Request ID
      - `user_id` (uuid, references users) - Who requested
      - `status` (text, default 'pending') - 'pending', 'approved', 'rejected'
      - `requested_at` (timestamptz) - When requested

    - `war_submissions`
      - `id` (uuid, PK) - Submission ID
      - `user_id` (uuid, references users) - Who submitted
      - `points` (integer) - Points scored
      - `war_date` (date) - Date of war (must be Saturday)
      - `screenshot_url` (text) - Proof screenshot URL from Storage
      - `approved` (boolean, default false) - Admin approval status
      - `created_at` (timestamptz) - Submission timestamp

    - `announcements`
      - `id` (uuid, PK) - Announcement ID
      - `title` (text) - Announcement title
      - `content` (text) - Announcement body
      - `created_by` (uuid, references users) - Who posted
      - `created_at` (timestamptz) - When posted

    - `chat_messages`
      - `id` (uuid, PK) - Message ID
      - `user_id` (uuid, references users) - Who sent
      - `message` (text) - Message content
      - `created_at` (timestamptz) - When sent

  2. Security
    - RLS enabled on ALL tables
    - Approved members can read most data
    - Only admins can approve/reject requests and submissions
    - Only admins can post announcements and delete chat messages
    - Users can only edit their own profile
    - Users can only submit war points for themselves
    - Chat messages viewable by all approved members

  3. Important Notes
    1. A trigger auto-creates a user profile and join_request when a new auth.user signs up
    2. A trigger updates total_points when a war_submission is approved
    3. war_date check constraint ensures only Saturdays are valid
    4. All policies require authentication and approved status where appropriate
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  total_points integer NOT NULL DEFAULT 0,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Join requests table
CREATE TABLE IF NOT EXISTS join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now()
);

-- War submissions table
CREATE TABLE IF NOT EXISTS war_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0 CHECK (points >= 0),
  war_date date NOT NULL,
  screenshot_url text DEFAULT '',
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT war_date_is_saturday CHECK (EXTRACT(isodow FROM war_date) = 6)
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS POLICIES
-- ============================================================

-- Anyone authenticated can view approved users
CREATE POLICY "Approved users are viewable by authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (approved = true OR id = auth.uid());

-- Users can update their own profile (non-role, non-approval fields)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()) AND approved = (SELECT approved FROM users WHERE id = auth.uid()));

-- Admins can update any user (for role/approval management)
CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Users can insert own profile (trigger creates this on signup)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================
-- JOIN REQUESTS POLICIES
-- ============================================================

-- Users can view their own join request
CREATE POLICY "Users can view own join request"
  ON join_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all join requests
CREATE POLICY "Admins can view all join requests"
  ON join_requests FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Users can create their own join request
CREATE POLICY "Users can create own join request"
  ON join_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can update join request status
CREATE POLICY "Admins can update join requests"
  ON join_requests FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- WAR SUBMISSIONS POLICIES
-- ============================================================

-- Approved users can view all war submissions
CREATE POLICY "Approved users can view war submissions"
  ON war_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

-- Users can insert their own war submissions
CREATE POLICY "Users can submit own war points"
  ON war_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

-- Admins can update war submission approvals
CREATE POLICY "Admins can update war submissions"
  ON war_submissions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- ANNOUNCEMENTS POLICIES
-- ============================================================

-- Approved users can view announcements
CREATE POLICY "Approved users can view announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

-- Only admins can create announcements
CREATE POLICY "Admins can create announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Only admins can update announcements
CREATE POLICY "Admins can update announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Only admins can delete announcements
CREATE POLICY "Admins can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- CHAT MESSAGES POLICIES
-- ============================================================

-- Approved users can view chat messages
CREATE POLICY "Approved users can view chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

-- Approved users can send chat messages
CREATE POLICY "Approved users can send chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

-- Only admins can delete chat messages
CREATE POLICY "Admins can delete chat messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- TRIGGER: Auto-create user profile and join request on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  INSERT INTO public.join_requests (user_id, status)
  VALUES (NEW.id, 'pending');
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: Update total_points when war_submission is approved
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_user_total_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.approved = true AND (OLD.approved = false OR OLD.approved IS NULL) THEN
    UPDATE public.users
    SET total_points = total_points + NEW.points
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_war_submission_approved ON war_submissions;
CREATE TRIGGER on_war_submission_approved
  AFTER UPDATE ON war_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_user_total_points();

-- ============================================================
-- INDEXES for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);
CREATE INDEX IF NOT EXISTS idx_war_submissions_user_id ON war_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_war_submissions_approved ON war_submissions(approved);
CREATE INDEX IF NOT EXISTS idx_war_submissions_war_date ON war_submissions(war_date);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Enable realtime for chat_messages and announcements
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
