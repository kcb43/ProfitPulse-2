# Fix: Google OAuth Redirecting to Vercel Instead of Google

## The Problem

When clicking "Sign in with Google", you're being redirected to a Vercel sign-in page instead of Google OAuth. This means **Google OAuth is not configured in Supabase yet**.

## ✅ Solution: Configure Google OAuth in Supabase

### Step 1: Enable Google Provider in Supabase

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (hlcwhpajorzbleabavcr)
3. **Go to**: Authentication → Providers
4. **Find "Google"** in the list
5. **Click "Enable"**

### Step 2: Get Google OAuth Credentials

You need to create Google OAuth credentials:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a project** (or select existing):
   - Click "Select a project" → "New Project"
   - Name: "ProfitPulse" (or any name)
   - Click "Create"
3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable" (if not already enabled)
4. **Create OAuth Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure OAuth consent screen first:
     - User Type: External
     - App name: "ProfitPulse"
     - Support email: your email
     - Click "Save and Continue" through the steps
   - Application type: **Web application**
   - Name: "ProfitPulse Web"
   - **Authorized redirect URIs**: Add this EXACT URL:
     ```
     https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/callback
     ```
   - Click "Create"
5. **Copy Credentials**:
   - **Client ID**: `xxxxx.apps.googleusercontent.com`
   - **Client Secret**: `xxxxx` (click "Show" to reveal)

### Step 3: Add Credentials to Supabase

1. **Back in Supabase** → Authentication → Providers → Google
2. **Paste**:
   - **Client ID (for OAuth)**: Your Google Client ID
   - **Client Secret (for OAuth)**: Your Google Client Secret
3. **Click "Save"**

### Step 4: Test Sign-In

1. **Go to**: http://localhost:5174/login
2. **Click "Sign in with Google"**
3. **You should now be redirected to Google** (not Vercel!)
4. **Sign in with** bellevuecasey54@gmail.com
5. **You'll be redirected back** to your app

## Troubleshooting

### Still Redirecting to Vercel?

**Check 1: Is Google Enabled?**
- Go to Supabase → Authentication → Providers
- Make sure Google shows "Enabled" (green toggle)

**Check 2: Are Credentials Saved?**
- Go to Supabase → Authentication → Providers → Google
- Make sure Client ID and Secret are filled in
- Click "Save" again

**Check 3: Redirect URI Match?**
- In Google Cloud Console, check your redirect URI is EXACTLY:
  ```
  https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/callback
  ```
- No trailing slash, exact match required

**Check 4: OAuth Consent Screen**
- Make sure you completed the OAuth consent screen setup
- Go to "APIs & Services" → "OAuth consent screen"
- Complete all required fields

### Error: "redirect_uri_mismatch"

This means the redirect URI in Google Cloud Console doesn't match Supabase's callback URL.

**Fix:**
1. Go to Google Cloud Console → Credentials → Your OAuth Client
2. Under "Authorized redirect URIs", make sure you have:
   ```
   https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/callback
   ```
3. Click "Save"
4. Try signing in again

### Error: "access_denied"

- Make sure you're signing in with the correct Google account
- Check that OAuth consent screen is configured
- Make sure the app is not in "Testing" mode (or add your email to test users)

## Quick Checklist

- [ ] Google provider enabled in Supabase
- [ ] Google OAuth credentials created in Google Cloud Console
- [ ] Redirect URI added: `https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/callback`
- [ ] Client ID and Secret added to Supabase
- [ ] OAuth consent screen configured
- [ ] Tested sign-in - redirects to Google (not Vercel)

Once Google OAuth is configured, the sign-in should work! 🎉


