-- MisRutinas Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- CATEGORIES
-- =====================================================
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table categories enable row level security;

drop policy if exists "Users can CRUD their own categories" on categories;
create policy "Users can CRUD their own categories" on categories
  for all using (auth.uid() = user_id);

-- =====================================================
-- EXERCISES
-- =====================================================
create table if not exists exercises (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table exercises enable row level security;

drop policy if exists "Users can CRUD their own exercises" on exercises;
create policy "Users can CRUD their own exercises" on exercises
  for all using (auth.uid() = user_id);

-- =====================================================
-- ROUTINES
-- =====================================================
create table if not exists routines (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table routines enable row level security;

drop policy if exists "Users can CRUD their own routines" on routines;
create policy "Users can CRUD their own routines" on routines
  for all using (auth.uid() = user_id);

-- =====================================================
-- ROUTINE_EXERCISES (Join table)
-- =====================================================
create table if not exists routine_exercises (
  id uuid default uuid_generate_v4() primary key,
  routine_id uuid references routines(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  "order" integer not null default 0
);

alter table routine_exercises enable row level security;

drop policy if exists "Users can CRUD their own routine exercises" on routine_exercises;
create policy "Users can CRUD their own routine exercises" on routine_exercises
  for all using (
    routine_id in (select id from routines where user_id = auth.uid())
  );

-- =====================================================
-- SESSIONS
-- =====================================================
create table if not exists sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  routine_id uuid references routines(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

alter table sessions enable row level security;

drop policy if exists "Users can CRUD their own sessions" on sessions;
create policy "Users can CRUD their own sessions" on sessions
  for all using (auth.uid() = user_id);

-- =====================================================
-- SET_LOGS
-- =====================================================
create table if not exists set_logs (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references sessions(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete set null,
  reps integer not null,
  weight_kg numeric not null default 0,
  set_number integer not null,
  notes text,
  is_warmup boolean default false,
  set_type text default 'normal' check (set_type in ('normal', 'warmup', 'dropset', 'restpause')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table set_logs enable row level security;

drop policy if exists "Users can CRUD their own set logs" on set_logs;
create policy "Users can CRUD their own set logs" on set_logs
  for all using (
    session_id in (select id from sessions where user_id = auth.uid())
  );

-- =====================================================
-- GOALS (User objectives)
-- =====================================================
create table if not exists goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  exercise_id uuid references exercises(id) on delete cascade not null,
  target_weight numeric not null,
  achieved boolean default false,
  achieved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table goals enable row level security;

drop policy if exists "Users can CRUD their own goals" on goals;
create policy "Users can CRUD their own goals" on goals
  for all using (auth.uid() = user_id);

-- =====================================================
-- PROFILES (Public user info)
-- =====================================================
create table if not exists profiles (
  id uuid references auth.users primary key,
  username text unique,
  display_name text,
  bio text,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

-- Users can read public profiles
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles
  for select using (is_public = true or auth.uid() = id);

-- Users can update their own profile
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- =====================================================
-- FRIENDSHIPS
-- =====================================================
create table if not exists friendships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  friend_id uuid references auth.users not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, friend_id)
);

alter table friendships enable row level security;

drop policy if exists "Users can see their friendships" on friendships;
create policy "Users can see their friendships" on friendships
  for select using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Users can create friendships" on friendships;
create policy "Users can create friendships" on friendships
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update friendships" on friendships;
create policy "Users can update friendships" on friendships
  for update using (auth.uid() = friend_id);

drop policy if exists "Users can delete friendships" on friendships;
create policy "Users can delete friendships" on friendships
  for delete using (auth.uid() = user_id or auth.uid() = friend_id);

-- =====================================================
-- INDEXES for performance
-- =====================================================
create index if not exists idx_categories_user_id on categories(user_id);
create index if not exists idx_exercises_user_id on exercises(user_id);
create index if not exists idx_exercises_category_id on exercises(category_id);
create index if not exists idx_routines_user_id on routines(user_id);
create index if not exists idx_routine_exercises_routine_id on routine_exercises(routine_id);
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_routine_id on sessions(routine_id);
create index if not exists idx_set_logs_session_id on set_logs(session_id);
create index if not exists idx_set_logs_exercise_id on set_logs(exercise_id);
create index if not exists idx_goals_user_id on goals(user_id);
create index if not exists idx_goals_exercise_id on goals(exercise_id);
create index if not exists idx_profiles_username on profiles(username);
create index if not exists idx_friendships_user_id on friendships(user_id);
create index if not exists idx_friendships_friend_id on friendships(friend_id);
