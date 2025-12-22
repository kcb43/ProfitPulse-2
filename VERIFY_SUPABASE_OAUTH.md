# Verify Supabase Google OAuth Configuration

## The Problem

You're being redirected to Vercel's authentication page instead of Google's OAuth page. This means Supabase's Google OAuth is not properly configured.

## Quick Diagnostic

1. **Open your browser console** (F12)
2. **Go to**: http://localhost:5174/login
3. **Click "Sign in with Google"**
4. **Check the console logs** - you should see:
   - `🔗 OAuth URL: https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/authorize?...`
   - If you see `vercel.com` in the URL, that's the problem!

## Step-by-Step Fix

### Step 1: Verify Supabase Google Provider is Enabled

1. Go to: https://supabase.com/dashboard/project/hlcwhpajorzbleabavcr/auth/providers
2. Find **Google** in the list
3. **Click on it** to open settings
4. Verify:
   - ✅ **Enabled** toggle is **ON** (green)
   - ✅ **Client ID (for OAuth)** has a value (not empty)
   - ✅ **Client Secret (for OAuth)** has a value (not empty)

### Step 2: If Google Provider is NOT Enabled

1. **Click "Enable"** on the Google provider
2. You'll need to add Google OAuth credentials (see Step 3)

### Step 3: Get Google OAuth Credentials (If Needed)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select or create a project**
3. **Go to**: APIs & Services → Credentials
4. **Click**: "Create Credentials" → "OAuth client ID"
5. **If prompted**, set up OAuth consent screen:
   - User Type: **External**
   - App name: "ProfitPulse"
   - Your email
   - Click through the steps
6. **Create OAuth Client ID**:
   - Application type: **Web application**
   - Name: "ProfitPulse"
   - **Authorized redirect URIs**: Add EXACTLY:
     ```
     https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/callback
     ```
   - Click "Create"
7. **Copy**:
   - **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
   - **Client Secret** (click "Show" to reveal)

### Step 4: Add Credentials to Supabase

1. **Back in Supabase** → Authentication → Providers → Google
2. **Paste**:
   - **Client ID (for OAuth)**: Your Google Client ID
   - **Client Secret (for OAuth)**: Your Google Client Secret
3. **Click "Save"**

### Step 5: Verify Redirect URL

In Supabase, the **Redirect URL** should show:
```
https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/callback
```

This is **automatic** - you don't need to set it manually. If it shows something else, there's a problem.

### Step 6: Test Again

1. **Restart your dev server** (Ctrl+C, then `npm run dev`)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Go to**: http://localhost:5174/login
4. **Open console** (F12)
5. **Click "Sign in with Google"**
6. **Check console** - you should see:
   - `🔗 OAuth URL: https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/authorize?...`
   - **NOT** `vercel.com` or `profitorbit.io`
7. **You should be redirected to**: `https://accounts.google.com/...`

## Common Issues

### Issue: "OAuth URL contains vercel.com"
**Cause**: Supabase Google provider is not enabled or not configured
**Fix**: Follow Steps 1-4 above

### Issue: "redirect_uri_mismatch" error from Google
**Cause**: Redirect URI in Google Cloud Console doesn't match Supabase
**Fix**: 
- Go to Google Cloud Console → Credentials → Your OAuth Client
- Under "Authorized redirect URIs", make sure you have EXACTLY:
  ```
  https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/callback
  ```
- No trailing slash, exact match

### Issue: Still redirecting to Vercel after fixing Supabase
**Possible causes**:
1. Browser cache - clear it (Ctrl+Shift+Delete)
2. Dev server needs restart - stop and restart `npm run dev`
3. Wrong Supabase project - make sure you're configuring the right project (hlcwhpajorzbleabavcr)

## Still Not Working?

If you've verified all the above and it's still redirecting to Vercel:

1. **Check browser console** for the exact OAuth URL
2. **Copy the OAuth URL** and paste it here - I can help debug
3. **Check Supabase Dashboard** → Authentication → Logs to see if OAuth attempts are being received


