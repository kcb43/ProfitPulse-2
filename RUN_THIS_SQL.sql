-- Copy and paste THIS ENTIRE FILE into Supabase SQL Editor
-- Do NOT paste the file path, paste the SQL code below

-- Step 1: Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create index on username
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Step 3: Create updated_at trigger
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Step 6: Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    INSERT INTO public.user_profiles (id, username, first_name, last_name)
    VALUES (
      NEW.id,
      split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 8),
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

