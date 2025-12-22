# Fix Google OAuth Redirect Issue

## Problem
When clicking "Sign in with Google", you're being redirected to Vercel instead of Google.

## Root Cause
The Vite proxy was intercepting ALL `/api/*` requests. This has been fixed, but we also need to verify your Supabase configuration.

## Step 1: Verify Supabase Environment Variables

Check your `.env.local` file has:
```env
VITE_SUPABASE_URL=https://hlcwhpajorzbleabavcr.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Make sure you're using the **anon key** (not the service role key) for `VITE_SUPABASE_ANON_KEY`.

## Step 2: Verify Google OAuth in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/hlcwhpajorzbleabavcr/auth/providers
2. Click on **Google** provider
3. Verify:
   - ✅ **Enabled** toggle is ON
   - ✅ **Client ID (for OAuth)** is filled in
   - ✅ **Client Secret (for OAuth)** is filled in
   - ✅ **Redirect URL** shows: `https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/callback`

## Step 3: Verify Google Cloud Console Configuration

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Click on it to edit
4. Under **Authorized redirect URIs**, make sure you have EXACTLY:
   ```
   https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/callback
   ```
   - No trailing slash
   - Exact match (case-sensitive)
   - Must be HTTPS

## Step 4: Check Browser Console

After clicking "Sign in with Google", check the browser console. You should see:
- `🔐 Starting Google OAuth sign-in...`
- `📍 Redirect URL: http://localhost:5174/`
- `🔗 Supabase URL: https://hlcwhpajorzbleabavcr.supabase.co`
- `🔗 OAuth URL: https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/authorize?...`

If the OAuth URL doesn't start with your Supabase URL, there's a configuration issue.

## Step 5: Restart Dev Server

After making changes, restart your dev server:
1. Stop the current server (Ctrl+C)
2. Run: `npm run dev`
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try signing in again

## Step 6: Test the OAuth Flow

1. Go to: http://localhost:5174/login
2. Open browser console (F12)
3. Click "Sign in with Google"
4. You should be redirected to: `https://accounts.google.com/...`
5. NOT to: `https://vercel.com/...` or `https://profitorbit.io/...`

## Common Issues

### Issue: Still redirecting to Vercel
**Solution:** Clear browser cache and cookies, then try again.

### Issue: "redirect_uri_mismatch" error
**Solution:** The redirect URI in Google Cloud Console doesn't match Supabase. Double-check Step 3.

### Issue: "OAuth URL" in console shows Vercel URL
**Solution:** Your Supabase URL environment variable is wrong. Check `.env.local`.

### Issue: "403 Forbidden" on `/api/jwt`
**Solution:** This should be fixed now with the proxy update. Restart your dev server.

## Still Not Working?

If you're still having issues, check:
1. Browser console for the OAuth URL (should start with `https://hlcwhpajorzbleabavcr.supabase.co`)
2. Network tab to see where requests are going
3. Supabase dashboard → Authentication → Logs to see if OAuth attempts are being received


