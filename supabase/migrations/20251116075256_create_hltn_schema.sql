/*
  # Hyper Local Trust Network (HLTN) Database Schema

  This migration creates the complete database structure for a residential society management application.

  ## 1. New Tables

  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique, not null)
  - `full_name` (text, not null)
  - `flat_number` (text, not null)
  - `phone` (text)
  - `role` (text, not null) - 'resident', 'admin', 'security'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `posts`
  - `id` (uuid, primary key)
  - `author_id` (uuid, references profiles)
  - `title` (text, not null)
  - `content` (text, not null)
  - `post_type` (text) - 'announcement', 'discussion', 'poll', 'alert'
  - `is_pinned` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `post_comments`
  - `id` (uuid, primary key)
  - `post_id` (uuid, references posts)
  - `author_id` (uuid, references profiles)
  - `content` (text, not null)
  - `created_at` (timestamptz)

  ### `visitors`
  - `id` (uuid, primary key)
  - `visitor_name` (text, not null)
  - `visitor_phone` (text, not null)
  - `flat_number` (text, not null)
  - `resident_id` (uuid, references profiles)
  - `purpose` (text)
  - `status` (text) - 'pending', 'approved', 'rejected', 'checked_out'
  - `check_in_time` (timestamptz)
  - `check_out_time` (timestamptz)
  - `added_by` (uuid, references profiles) - security guard
  - `created_at` (timestamptz)

  ### `payments`
  - `id` (uuid, primary key)
  - `resident_id` (uuid, references profiles)
  - `amount` (numeric, not null)
  - `description` (text, not null)
  - `due_date` (date, not null)
  - `status` (text) - 'pending', 'paid', 'verified'
  - `transaction_id` (text)
  - `paid_at` (timestamptz)
  - `verified_by` (uuid, references profiles)
  - `verified_at` (timestamptz)
  - `created_at` (timestamptz)

  ### `issues`
  - `id` (uuid, primary key)
  - `reported_by` (uuid, references profiles)
  - `category` (text) - 'maintenance', 'security', 'housekeeping'
  - `title` (text, not null)
  - `description` (text, not null)
  - `status` (text) - 'open', 'in_progress', 'resolved'
  - `priority` (text) - 'low', 'medium', 'high'
  - `assigned_to` (uuid, references profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `issue_comments`
  - `id` (uuid, primary key)
  - `issue_id` (uuid, references issues)
  - `author_id` (uuid, references profiles)
  - `content` (text, not null)
  - `created_at` (timestamptz)

  ## 2. Security

  - Enable RLS on all tables
  - Profiles: Users can read all profiles, update own profile, admins can update any
  - Posts: All can read, authenticated can create, admins can update/delete
  - Visitors: Security can create, residents can update their own, admins can view all
  - Payments: Residents see own, admins see all and can create
  - Issues: All authenticated can create, all can read, admins can update

  ## 3. Important Notes

  - All timestamps use timestamptz for proper timezone handling
  - UUIDs are used for all primary keys for better security
  - RLS policies ensure data isolation between residents
  - Admins have elevated privileges across all modules
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  flat_number text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'admin', 'security')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'discussion' CHECK (post_type IN ('announcement', 'discussion', 'poll', 'alert')),
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Create visitors table
CREATE TABLE IF NOT EXISTS visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL,
  visitor_phone text NOT NULL,
  flat_number text NOT NULL,
  resident_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  purpose text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'checked_out')),
  check_in_time timestamptz DEFAULT now(),
  check_out_time timestamptz,
  added_by uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  description text NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'verified')),
  transaction_id text,
  paid_at timestamptz,
  verified_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('maintenance', 'security', 'housekeeping')),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Create issue_comments table
CREATE TABLE IF NOT EXISTS issue_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for posts
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can update any post"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authors can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any post"
  ON posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for post_comments
CREATE POLICY "Anyone can view comments"
  ON post_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON post_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- RLS Policies for visitors
CREATE POLICY "Security can create visitors"
  ON visitors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('security', 'admin')
    )
  );

CREATE POLICY "Residents can view visitors for their flat"
  ON visitors FOR SELECT
  TO authenticated
  USING (
    resident_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'security')
    )
  );

CREATE POLICY "Residents can update visitors for their flat"
  ON visitors FOR UPDATE
  TO authenticated
  USING (
    resident_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'security')
    )
  );

-- RLS Policies for payments
CREATE POLICY "Residents can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    resident_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Residents can update own payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (resident_id = auth.uid())
  WITH CHECK (resident_id = auth.uid());

CREATE POLICY "Admins can update any payment"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for issues
CREATE POLICY "Anyone can view issues"
  ON issues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create issues"
  ON issues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Admins can update any issue"
  ON issues FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for issue_comments
CREATE POLICY "Anyone can view issue comments"
  ON issue_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create issue comments"
  ON issue_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_visitors_resident_id ON visitors(resident_id);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_payments_resident_id ON payments(resident_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_reported_by ON issues(reported_by);