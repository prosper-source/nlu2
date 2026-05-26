/*
  # Fix policy name for user insert

  1. Changes
    - Drop old policy "Service role can insert users" 
    - Create new policy "Users can insert own profile" with same logic
    - More accurate naming for the policy

  2. Security
    - No security changes, same logic as before
*/

DROP POLICY IF EXISTS "Service role can insert users" ON users;

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
