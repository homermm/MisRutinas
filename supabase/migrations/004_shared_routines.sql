-- Migration: Add shared_routines table for routine sharing
-- Run this in Supabase SQL Editor

-- =====================================================
-- SHARED_ROUTINES (Public/importable routines)
-- =====================================================
CREATE TABLE IF NOT EXISTS shared_routines (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  
  -- Sharing metadata
  title text NOT NULL,
  description text,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags text[], -- e.g., ['push', 'chest', 'strength']
  
  -- Stats
  import_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE shared_routines ENABLE ROW LEVEL SECURITY;

-- Everyone can view public shared routines
DROP POLICY IF EXISTS "Public routines are viewable" ON shared_routines;
CREATE POLICY "Public routines are viewable" ON shared_routines
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Users can manage their own shared routines
DROP POLICY IF EXISTS "Users can manage own shared routines" ON shared_routines;
CREATE POLICY "Users can manage own shared routines" ON shared_routines
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- ROUTINE_IMPORTS (Track who imported what)
-- =====================================================
CREATE TABLE IF NOT EXISTS routine_imports (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  shared_routine_id uuid REFERENCES shared_routines(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  new_routine_id uuid REFERENCES routines(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(shared_routine_id, user_id)
);

ALTER TABLE routine_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their imports" ON routine_imports;
CREATE POLICY "Users can see their imports" ON routine_imports
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can import routines" ON routine_imports;
CREATE POLICY "Users can import routines" ON routine_imports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- ROUTINE_LIKES
-- =====================================================
CREATE TABLE IF NOT EXISTS routine_likes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  shared_routine_id uuid REFERENCES shared_routines(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(shared_routine_id, user_id)
);

ALTER TABLE routine_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see likes" ON routine_likes;
CREATE POLICY "Users can see likes" ON routine_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like/unlike" ON routine_likes;
CREATE POLICY "Users can like/unlike" ON routine_likes
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shared_routines_user ON shared_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_routines_public ON shared_routines(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_routine_imports_user ON routine_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_likes_routine ON routine_likes(shared_routine_id);
