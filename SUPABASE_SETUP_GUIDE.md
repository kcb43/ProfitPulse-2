# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Your project name (e.g., "BareRetail")
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier

## Step 2: Get API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

## Step 3: Set Environment Variables

### For Local Development (.env.local)

Create or update `.env.local` in your project root:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### For Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service_role key (for API routes)

## Step 4: Run Database Migrations

### Option A: Using Supabase Dashboard (Easiest)

1. Go to **SQL Editor** in Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste into SQL Editor
4. Click **Run** to execute

### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 5: Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Name: `images`
4. **Public bucket**: ✅ Yes (so images are publicly accessible)
5. Click **Create bucket**

## Step 6: Set Up Authentication (If Needed)

If you're using Supabase Auth:

1. Go to **Authentication** → **Providers**
2. Enable the providers you want (Email, Google, etc.)
3. Configure settings as needed

If you're using your own auth system:
- The API routes will extract `user_id` from your auth token
- Update the `getUserId()` function in API routes to match your auth system

## Step 7: Verify Setup

1. Check that tables were created:
   - Go to **Table Editor** in Supabase dashboard
   - You should see: `inventory_items`, `sales`, `image_editor_templates`, `crosslistings`

2. Check RLS policies:
   - Go to **Authentication** → **Policies**
   - Verify policies are created for each table

3. Test API routes locally:
   ```bash
   npm run dev
   ```
   - Try accessing `/api/inventory` (should return empty array or error if no auth)

## Step 8: Update Frontend Code

Once Supabase is set up, you can start migrating:

1. Update imports from `base44` to `newApiClient`
2. Test each feature
3. Migrate data from Base44 (see `MIGRATION_PLAN.md`)

## Troubleshooting

### "Supabase environment variables not configured"
- Make sure `.env.local` exists and has the correct variables
- Restart your dev server after adding environment variables

### "Row Level Security policy violation"
- Check that RLS policies are created correctly
- Verify `user_id` is being set correctly in API requests

### "Storage bucket not found"
- Make sure you created the `images` bucket
- Check bucket name matches in `api/upload.js`

### Database connection errors
- Verify your Supabase project URL is correct
- Check that your IP is allowed (if using IP restrictions)
- Verify service_role key is correct for API routes

## Next Steps

1. ✅ Complete Supabase setup
2. ⏭️ Migrate data from Base44 (see `MIGRATION_PLAN.md`)
3. ⏭️ Update frontend to use new API client
4. ⏭️ Test all functionality
5. ⏭️ Remove Base44 dependencies

