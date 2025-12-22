# Quick Auth Setup - Get Your Data Back! 🚀

## The Problem

After migrating to Supabase, you need to sign in to access your inventory data. Your old Base44 Gmail sign-in won't work anymore.

## Quick Solution (5 minutes)

### Step 1: Enable Google Sign-In in Supabase

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (the one with URL `hlcwhpajorzbleabavcr.supabase.co`)
3. **Go to**: Authentication → Providers
4. **Find Google** and click **Enable**
5. **You'll need Google OAuth credentials** (see Step 2)

### Step 2: Get Google OAuth Credentials

**Option A: Quick Setup (Use Existing Google Project)**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: "ProfitPulse" (or any name)
5. **Authorized redirect URIs**: Add this EXACT URL:
   ```
   https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/callback
   ```
6. Click **Create**
7. **Copy the Client ID and Client Secret**

**Option B: If You Don't Have Google Cloud Account**
- Create one at: https://console.cloud.google.com/
- It's free and takes 2 minutes

### Step 3: Add Credentials to Supabase

1. **Back in Supabase** → Authentication → Providers → Google
2. **Paste**:
   - Client ID: `your-client-id.apps.googleusercontent.com`
   - Client Secret: `your-client-secret`
3. Click **Save**

### Step 4: Test Sign-In

1. **Start your dev server**: `npm run dev`
2. **Go to**: http://localhost:5173/login
3. **Click "Sign in with Google"**
4. **Sign in with your Gmail** (same one you used with Base44)
5. **You'll be redirected back** to the app

## Important: Your Data Migration

⚠️ **Your inventory data is still in Base44!** After signing in, you'll have a **new Supabase user ID**, which won't match your old Base44 user ID.

### To Get Your Data Back:

**Option 1: Manual Migration (Recommended)**
1. Export your data from Base44 (if possible)
2. After signing in to Supabase, note your new user ID
3. Import data with the new user ID

**Option 2: Quick Fix - Match by Email**
1. Sign in to Supabase (get your new user ID)
2. In Supabase SQL Editor, run:
   ```sql
   -- Find your Base44 user ID (you'll need to get this from Base44)
   -- Then update all your data:
   UPDATE inventory_items 
   SET user_id = 'your-new-supabase-user-id' 
   WHERE user_id = 'your-old-base44-user-id';
   
   UPDATE sales 
   SET user_id = 'your-new-supabase-user-id' 
   WHERE user_id = 'your-old-base44-user-id';
   ```

**Option 3: Temporary - Use Same User ID**
If you know your old Base44 user ID, you can temporarily use it:
1. Sign in to Supabase
2. Get your new Supabase user ID from the browser console:
   ```javascript
   // In browser console:
   const { data: { session } } = await supabase.auth.getSession();
   console.log('New user ID:', session.user.id);
   ```
3. Update your data's `user_id` to match (see Option 2 SQL)

## What I've Added

✅ **Login Page** (`src/pages/Login.jsx`) - Google sign-in button
✅ **Login Route** - Available at `/login`
✅ **Updated API Client** - Now uses Supabase auth user ID
✅ **Auth Guide** - Full setup instructions in `AUTH_SETUP_GUIDE.md`

## Next Steps

1. ✅ Set up Google OAuth in Supabase (Steps 1-3 above)
2. ✅ Sign in at `/login`
3. ⏭️ Migrate your data (see options above)
4. ⏭️ Test creating new inventory items
5. ⏭️ Verify everything works

## Troubleshooting

**"No user found"**
- Make sure Google OAuth is enabled in Supabase
- Check redirect URI matches exactly: `https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/callback`

**"Can't see my old data"**
- Your data is still in Base44 with your old user ID
- You need to migrate it (see options above)

**"Sign in button doesn't work"**
- Check browser console for errors
- Make sure Google OAuth is configured correctly in Supabase

## Need Help?

Check `AUTH_SETUP_GUIDE.md` for detailed instructions!


