# eBay OAuth 2.0 Setup Guide - Step by Step

## ⚠️ Important: Use "Auth(new security)" NOT "Auth'n'Auth"

eBay has two authentication systems in the Developer Console:
1. **Auth'n'Auth** (Legacy) - ❌ DO NOT USE THIS
2. **Auth(new security)** (OAuth 2.0) - ✅ USE THIS ONE

**This application uses OAuth 2.0**, so you MUST configure the redirect URI in the **"Auth(new security)"** section.

---

## Step-by-Step Setup Instructions

### Step 1: Find Your Production Domain

Your Vercel production domain is: **`profit-pulse-2.vercel.app`**

Your callback URL will be:
- **Production**: `https://profit-pulse-2.vercel.app/api/ebay/callback`
- **Preview/Staging** (optional): `https://profit-pulse-2-git-main-caseys-projects-8aa6ffea.vercel.app/api/ebay/callback`

---

### Step 2: Configure Redirect URI in eBay Developer Console

1. **Go to eBay Developer Console**
   - Visit: https://developer.ebay.com/my/keys
   - Sign in if needed

2. **Select Your Application**
   - Find and click on your eBay application

3. **Navigate to "Auth(new security)" Section**
   - Look for the section labeled **"Auth(new security)"** (NOT "Auth'n'Auth")
   - This is where OAuth 2.0 redirect URIs are configured

4. **Add Your Production Redirect URI**
   - Find the field for **"Accepted and Declined Auth URL"** or **"OAuth Redirect URIs"**
   - Add this exact URL (copy and paste to avoid typos):
     ```
     https://profit-pulse-2.vercel.app/api/ebay/callback
     ```
   - ⚠️ **Important**: It must match EXACTLY including:
     - Protocol: `https://` (not `http://`)
     - Domain: `profit-pulse-2.vercel.app` (no trailing slash)
     - Path: `/api/ebay/callback` (exactly as shown)

5. **Optionally Add Preview URL** (for testing preview deployments)
   - If you want to test with preview deployments, also add:
     ```
     https://profit-pulse-2-git-main-caseys-projects-8aa6ffea.vercel.app/api/ebay/callback
     ```
   - Note: eBay allows multiple redirect URIs, so you can add both

6. **Save Changes**
   - Click "Save" or "Update" to save your changes
   - Wait a few moments for eBay to process the update

---

### Step 3: Set BASE_URL in Vercel (Recommended)

Setting this environment variable ensures consistent redirect URI detection:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your **ProfitPulse-2** project

2. **Navigate to Environment Variables**
   - Go to: **Settings** → **Environment Variables**

3. **Add BASE_URL Variable**
   - Click **"Add New"**
   - **Name**: `BASE_URL`
   - **Value**: `https://profit-pulse-2.vercel.app` (no trailing slash, no path)
   - **Environment**: Check all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**

4. **Redeploy Your Application** (Important!)
   - Go to **Deployments** tab
   - Find the latest deployment
   - Click the **"..."** menu (three dots)
   - Select **"Redeploy"**
   - Or: Wait for the next automatic deployment (changes deploy automatically)

---

### Step 4: Verify Environment Variables in Vercel

Make sure these are set in Vercel (Settings → Environment Variables):

✅ **Required:**
- `EBAY_CLIENT_ID` - Your Production App ID (e.g., `YourName-ProfitPu-PRD-...`)
- `EBAY_CLIENT_SECRET` - Your Production Client Secret
- `EBAY_DEV_ID` - Your Developer ID (if using Trading API)

✅ **Optional but Recommended:**
- `BASE_URL` - `https://profit-pulse-2.vercel.app` (we just added this)
- `EBAY_ENV` - Set to `production` (or leave empty, code will auto-detect)

---

### Step 5: Test the OAuth Flow

1. **Wait for Vercel Deployment**
   - After redeploying, wait 1-2 minutes for the deployment to complete
   - Check the Deployments tab to see when it's "Ready"

2. **Debug Check** (Optional but helpful)
   - Visit: `https://profit-pulse-2.vercel.app/api/ebay/auth?debug=true`
   - This will show you the exact `redirectUri` being sent to eBay
   - Verify it matches: `https://profit-pulse-2.vercel.app/api/ebay/callback`

3. **Test Connection**
   - Go to your app: `https://profit-pulse-2.vercel.app/CrosslistComposer`
   - Click the **"Connect eBay Account"** button
   - You should be redirected to eBay's authorization page
   - After authorizing, you'll be redirected back and connected!

---

## Troubleshooting

### ❌ Error: "Authorization code not provided"
**Cause**: The callback endpoint is being accessed directly or the redirect URI doesn't match.

**Fix**:
1. Verify the redirect URI in eBay Console matches exactly (Step 2)
2. Check that `BASE_URL` is set correctly (Step 3)
3. Verify the debug endpoint shows the correct redirect URI (Step 5.2)

### ❌ Error: "Input request parameters are invalid"
**Cause**: The redirect URI sent to eBay doesn't match what's configured in eBay Developer Console.

**Fix**:
1. Double-check the redirect URI in eBay Console (Step 2)
2. Make sure you're using **"Auth(new security)"** section, NOT "Auth'n'Auth"
3. Copy the exact URL from Step 2 - even a small typo will cause this error
4. Ensure `BASE_URL` environment variable is set correctly

### ❌ Redirect URI Mismatch
**Symptoms**: Error mentions redirect URI or invalid_request.

**Fix**:
- The redirect URI must match EXACTLY, including:
  - Protocol (`https://` not `http://`)
  - Domain (no www, no extra paths)
  - Path (`/api/ebay/callback` exactly)
  - No trailing slashes

### 🔍 How to Verify Your Setup

1. **Check Debug Endpoint**:
   ```
   https://profit-pulse-2.vercel.app/api/ebay/auth?debug=true
   ```
   Look at the `redirectUri` field - it should match what's in eBay Console.

2. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Your Project → Logs
   - Try connecting your eBay account
   - Look for log entries showing the `redirectUri` being used

3. **Check eBay Console**:
   - Make sure the redirect URI is in **"Auth(new security)"** section
   - Verify it matches exactly (no extra spaces, correct spelling)

---

## Quick Reference

| Setting | Value |
|---------|-------|
| **Production Domain** | `profit-pulse-2.vercel.app` |
| **Redirect URI** | `https://profit-pulse-2.vercel.app/api/ebay/callback` |
| **eBay Section** | "Auth(new security)" |
| **BASE_URL** | `https://profit-pulse-2.vercel.app` |

---

## Notes

- The callback URL must be accessible via HTTPS in production
- eBay allows multiple redirect URIs, so you can add both production and preview URLs
- The redirect URI is validated by eBay, so it must match exactly (case-sensitive for the domain)
- After making changes in eBay Console, wait 1-2 minutes before testing
- After setting environment variables in Vercel, you may need to redeploy
