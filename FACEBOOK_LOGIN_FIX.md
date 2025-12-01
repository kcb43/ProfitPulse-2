# Fix: Facebook Login "Invalid Scopes: email" Error

## ✅ Problem Fixed

The error occurred because the Settings page was using `FB.login()` with the invalid scope `'public_profile,email'`. Facebook no longer accepts the `email` scope in newer API versions.

## 🔧 Solution Applied

Changed the Settings page to use the **OAuth redirect method** instead, which:
- Uses proper Marketplace scopes configured in `/api/facebook/auth.js`
- Avoids the invalid `email` scope issue
- Provides all necessary permissions for Marketplace integration

### Scopes Now Used (from `/api/facebook/auth.js`):
- `pages_manage_metadata` - Manage page metadata
- `pages_manage_posts` - Create and manage posts (needed for listings)
- `business_management` - Manage business assets
- `pages_read_engagement` - Read page engagement

## 📝 Changes Made

**File: `src/pages/Settings.jsx`**
- Removed direct `FB.login()` call with invalid scopes
- Changed to OAuth redirect method: `window.location.href = '/api/facebook/auth'`
- This redirects to the proper OAuth endpoint with correct Marketplace scopes

## ✅ How It Works Now

1. User clicks "Login with Facebook" on Settings page
2. Redirects to `/api/facebook/auth`
3. User authorizes on Facebook with proper Marketplace scopes
4. Facebook redirects back to `/api/facebook/callback`
5. Callback exchanges code for access token
6. Redirects back to app with token
7. Settings page handles the token and shows connection status

## 🎯 Testing

After this fix, the Facebook login should work without the "Invalid Scopes" error!

---

**Note:** The callback redirects to `/CrosslistComposer` by default, but the Settings page also handles the callback parameters, so the connection will work from either page.

