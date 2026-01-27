-- =====================================================
-- SUPABASE DATABASE SETUP SCRIPT
-- =====================================================
-- Run this script trong Supabase SQL Editor
-- để setup database cho boilerplate này

-- =====================================================
-- 1. CREATE PERSONS TABLE
-- =====================================================

create table if not exists persons (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  user_id uuid references auth.users(id) on delete cascade not null,
  family_id uuid not null default gen_random_uuid()
);

-- Create index for better query performance
create index if not exists persons_user_id_idx on persons(user_id);
create index if not exists persons_family_id_idx on persons(family_id);
create index if not exists persons_created_at_idx on persons(created_at desc);

-- =====================================================
-- 2. CREATE RELATIONSHIPS TABLE
-- =====================================================

create table if not exists relationships (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  from_person_id uuid references persons(id) on delete cascade not null,
  to_person_id uuid references persons(id) on delete cascade not null,
  type text not null check (type in ('parent', 'spouse', 'child')),
  user_id uuid references auth.users(id) on delete cascade not null,
  constraint relationships_unique unique (from_person_id, to_person_id, type)
);

create index if not exists relationships_user_id_idx on relationships(user_id);
create index if not exists relationships_from_person_id_idx on relationships(from_person_id);
create index if not exists relationships_to_person_id_idx on relationships(to_person_id);

-- =====================================================
-- 3. CREATE UPDATED_AT TRIGGER
-- =====================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_persons_updated_at
  before update on persons
  for each row
  execute function update_updated_at_column();

create trigger update_relationships_updated_at
  before update on relationships
  for each row
  execute function update_updated_at_column();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

alter table persons enable row level security;
alter table relationships enable row level security;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies nếu có
drop policy if exists "Users can view own persons" on persons;
drop policy if exists "Users can insert own persons" on persons;
drop policy if exists "Users can update own persons" on persons;
drop policy if exists "Users can delete own persons" on persons;

drop policy if exists "Users can view own relationships" on relationships;
drop policy if exists "Users can insert own relationships" on relationships;
drop policy if exists "Users can update own relationships" on relationships;
drop policy if exists "Users can delete own relationships" on relationships;

-- PERSONS Policies
create policy "Users can view own persons"
  on persons for select
  using (auth.uid() = user_id);

create policy "Users can insert own persons"
  on persons for insert
  with check (auth.uid() = user_id);

create policy "Users can update own persons"
  on persons for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own persons"
  on persons for delete
  using (auth.uid() = user_id);

-- RELATIONSHIPS Policies
create policy "Users can view own relationships"
  on relationships for select
  using (auth.uid() = user_id);

create policy "Users can insert own relationships"
  on relationships for insert
  with check (auth.uid() = user_id);

create policy "Users can update own relationships"
  on relationships for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own relationships"
  on relationships for delete
  using (auth.uid() = user_id);

-- =====================================================
-- 6. ENABLE REALTIME
-- =====================================================

-- Enable Realtime for persons and relationships tables
alter publication supabase_realtime add table persons;
alter publication supabase_realtime add table relationships;

-- =====================================================
-- 7. VERIFY SETUP
-- =====================================================

-- Check tables exist
select table_name, table_type 
from information_schema.tables 
where table_schema = 'public' 
and table_name in ('persons', 'relationships');

-- Check RLS is enabled
select tablename, rowsecurity 
from pg_tables 
where schemaname = 'public' 
and tablename in ('persons', 'relationships');

-- =====================================================
-- SETUP COMPLETE! ✅
-- =====================================================
