-- Migration: Add body_measurements table
-- Run this in Supabase SQL Editor

-- =====================================================
-- BODY_MEASUREMENTS (Weight, circumferences, etc)
-- =====================================================
CREATE TABLE IF NOT EXISTS body_measurements (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Weight
  weight_kg numeric,
  
  -- Circumferences (in cm)
  chest_cm numeric,
  waist_cm numeric,
  hips_cm numeric,
  bicep_left_cm numeric,
  bicep_right_cm numeric,
  thigh_left_cm numeric,
  thigh_right_cm numeric,
  calf_left_cm numeric,
  calf_right_cm numeric,
  neck_cm numeric,
  
  -- Body composition (optional, if user has smart scale)
  body_fat_percent numeric,
  muscle_mass_kg numeric,
  
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD their own body measurements" ON body_measurements;
CREATE POLICY "Users can CRUD their own body measurements" ON body_measurements
  FOR ALL USING (auth.uid() = user_id);

-- Index for efficient date queries
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements(user_id, date DESC);

-- Prevent duplicate entries for same date
CREATE UNIQUE INDEX IF NOT EXISTS idx_body_measurements_unique_date ON body_measurements(user_id, date);
