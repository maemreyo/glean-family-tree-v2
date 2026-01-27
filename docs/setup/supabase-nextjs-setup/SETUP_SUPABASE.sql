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
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Create index for better query performance
create index if not exists persons_user_id_idx on persons(user_id);
create index if not exists persons_created_at_idx on persons(created_at desc);

-- =====================================================
-- 2. CREATE UPDATED_AT TRIGGER
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

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

alter table persons enable row level security;

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies nếu có
drop policy if exists "Users can view own persons" on persons;
drop policy if exists "Users can insert own persons" on persons;
drop policy if exists "Users can update own persons" on persons;
drop policy if exists "Users can delete own persons" on persons;

-- Policy: Users can view their own persons
create policy "Users can view own persons"
  on persons
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own persons
create policy "Users can insert own persons"
  on persons
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own persons
create policy "Users can update own persons"
  on persons
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own persons
create policy "Users can delete own persons"
  on persons
  for delete
  using (auth.uid() = user_id);

-- =====================================================
-- 5. ENABLE REALTIME
-- =====================================================

-- Enable Realtime for persons table
alter publication supabase_realtime add table persons;

-- =====================================================
-- 6. CREATE SAMPLE DATA (OPTIONAL - for testing)
-- =====================================================

-- Uncomment để tạo sample data
-- Lưu ý: Replace 'your-user-id-here' với actual user ID
/*
insert into persons (name, date_of_birth, gender, user_id) values
  ('John Doe', '1990-01-15', 'male', 'your-user-id-here'),
  ('Jane Smith', '1985-05-20', 'female', 'your-user-id-here'),
  ('Alex Johnson', '1995-09-10', 'other', 'your-user-id-here');
*/

-- =====================================================
-- 7. VERIFY SETUP
-- =====================================================

-- Check table exists
select 
  table_name, 
  table_type 
from information_schema.tables 
where table_schema = 'public' 
and table_name = 'persons';

-- Check RLS is enabled
select 
  tablename, 
  rowsecurity 
from pg_tables 
where schemaname = 'public' 
and tablename = 'persons';

-- Check policies exist
select 
  policyname, 
  cmd, 
  roles 
from pg_policies 
where schemaname = 'public' 
and tablename = 'persons';

-- Check indexes
select 
  indexname, 
  indexdef 
from pg_indexes 
where schemaname = 'public' 
and tablename = 'persons';

-- =====================================================
-- SETUP COMPLETE! ✅
-- =====================================================

-- Next steps:
-- 1. Verify all checks passed
-- 2. Test inserting a row in Supabase Table Editor
-- 3. Configure Auth settings in Supabase Dashboard
-- 4. Add redirect URLs: http://localhost:3000/auth/callback
-- 5. Enable email provider hoặc OAuth providers
-- 6. Start coding! 🚀
