-- Migration: Add notes, is_warmup, and set_type to set_logs
-- Run this in Supabase SQL Editor to add new columns

-- Add notes column for set annotations
ALTER TABLE set_logs 
ADD COLUMN IF NOT EXISTS notes text;

-- Add is_warmup flag (warmup sets don't count towards volume)
ALTER TABLE set_logs 
ADD COLUMN IF NOT EXISTS is_warmup boolean DEFAULT false;

-- Add set_type for advanced techniques (dropset, restpause, etc)
-- 'normal' = regular set (default)
-- 'warmup' = warmup set (deprecated, use is_warmup instead)
-- 'dropset' = drop set (reduce weight, continue reps)
-- 'restpause' = rest-pause set (short rest, continue same weight)
ALTER TABLE set_logs 
ADD COLUMN IF NOT EXISTS set_type text DEFAULT 'normal' 
CHECK (set_type IN ('normal', 'warmup', 'dropset', 'restpause'));

-- Update existing warmup flags
UPDATE set_logs SET set_type = 'warmup' WHERE is_warmup = true;
