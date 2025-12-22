# Supabase Migration Instructions

## Step 1: Run the SQL Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. **Copy the ENTIRE contents** of `supabase/migrations/002_add_user_profiles.sql` (not the file path, but the SQL code inside)
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

## Step 2: Verify the Migration

After running the SQL, verify:

1. Go to **Table Editor** → You should see `user_profiles` table
2. Go to **Database** → **Functions** → You should see `handle_new_user` function
3. Check that the table has:
   - `id` (UUID, primary key)
   - `username` (TEXT, unique)
   - `first_name` (TEXT)
   - `last_name` (TEXT)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

## Step 3: Set Up the Trigger (Important!)

The trigger needs to be created manually because Supabase has restrictions on triggers on `auth.users`:

### Option A: Using Supabase Dashboard
1. Go to **Database** → **Functions** → `handle_new_user`
2. Click on the function
3. Go to **Triggers** tab
4. Create a new trigger:
   - **Name**: `on_auth_user_created`
   - **Table**: `auth.users`
   - **Events**: `INSERT`
   - **Timing**: `AFTER`
   - **Function**: `handle_new_user()`

### Option B: Using SQL (if you have access)
Run this in SQL Editor:
```sql
-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Alternative: Handle Profile Creation in App Code

If you can't create the trigger, the app will handle profile creation automatically when users sign up. The SignUp component will create the profile after successful signup.

## Troubleshooting

If you get errors:
- **"syntax error"**: Make sure you copied the SQL content, not the file path
- **"permission denied"**: You may need to use the service role key or have proper permissions
- **"relation already exists"**: The table already exists, which is fine - the migration uses `IF NOT EXISTS`

