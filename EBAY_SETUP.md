# eBay API Setup Guide

## Current Configuration

You're currently using **eBay Sandbox** credentials. This is good for testing but has limited test data.

## Switching to Production

### Step 1: Create Production Keyset

1. Go to [eBay Developer Portal](https://developer.ebay.com/)
2. Navigate to **My Account** → **Keys & Tokens**
3. Click **Create a Production Keyset** (or **Create Keyset** → select **Production**)
4. Copy your **Production Client ID** and **Production Client Secret**
   - Production Client ID will NOT have "SBX" prefix
   - Example: `BertsonB-ProfitPu-PRD-xxxxx-xxxxx` (note: `PRD` not `SBX`)
   - Production Client Secret will be different from sandbox

### Step 2: OAuth Redirect URLs (Optional - Only for User Authentication)

**Important:** For the Browse API (which uses Client Credentials OAuth), you do NOT need to configure redirect URLs. Redirect URLs are only needed if you're implementing user authentication (like "Sign in with eBay").

However, if you plan to add user authentication later, you'll need:

1. In your eBay Developer Portal, go to **My Account** → **Keys & Tokens** → Your Production Keyset
2. Under **eBay Sign-in Settings** (or **OAuth Redirect URLs**), add:
   - `https://your-vercel-domain.vercel.app/auth/callback` (or your callback URL)
   - Or `https://your-custom-domain.com/auth/callback` if you have a custom domain

**For Browse API (current implementation):** You don't need any redirect URLs. Client Credentials flow doesn't use redirects.

### Step 3: Update Vercel Environment Variables

In your Vercel dashboard:

1. Go to your project settings → **Environment Variables**
2. Add/Update these variables for **Production**, **Preview**, and **Development**:

```
EBAY_ENV=production
EBAY_CLIENT_ID=YourProductionClientID
EBAY_CLIENT_SECRET=YourProductionClientSecret
```

**Important:** 
- Remove the `VITE_` prefix for serverless functions
- Vercel API routes use `process.env` directly (not `import.meta.env`)
- The `EBAY_ENV=production` tells the code to use `api.ebay.com` instead of `api.sandbox.ebay.com`

### Step 4: Redeploy

After updating environment variables:
1. Vercel will automatically redeploy
2. Or manually trigger a deployment from the Vercel dashboard

The API will now use production eBay instead of sandbox.

## Environment Variables Reference

### For Local Development (`.env.local`)
```
VITE_EBAY_CLIENT_ID=YourClientID
VITE_EBAY_CLIENT_SECRET=YourClientSecret
EBAY_ENV=sandbox  # or 'production' to test production locally
```

### For Vercel Production
```
EBAY_CLIENT_ID=YourProductionClientID
EBAY_CLIENT_SECRET=YourProductionClientSecret
EBAY_ENV=production
```

**Note:** 
- Client-side code uses `VITE_EBAY_*` variables (via `import.meta.env`)
- Server-side (API routes) use `EBAY_*` variables without `VITE_` prefix (via `process.env`)
- `EBAY_ENV` controls which eBay API (sandbox vs production) to use

## Sandbox vs Production

### Sandbox (Current)
- ✅ Good for development and testing
- ❌ Limited test data - most searches return 0 results
- ❌ Items don't exist on real eBay
- ✅ Safe for testing without affecting real listings

### Production (Recommended for Real Use)
- ✅ Real eBay listings - billions of items
- ✅ Actual search results
- ✅ Real item data and prices
- ⚠️ Uses your production API quota
- ⚠️ Make sure you're compliant with eBay API usage policies

## Troubleshooting

### Still getting "missing q parameter" errors?

1. Check Vercel Function Logs to see what parameters are being received
2. Make sure the search query is at least 2 characters long
3. The code now validates queries before making API calls

### No results in sandbox?

This is expected! Sandbox has very limited test data. Try:
- Search for generic terms like "test", "phone", "laptop"
- Production will have real results for any search term

### OAuth errors?

- For Browse API (Client Credentials): You don't need redirect URLs
- For User Authentication: You'll need to configure redirect URLs
- Make sure your Client ID and Secret are correct for the environment (sandbox vs production)

## API Quotas

Be aware of eBay API rate limits:
- Sandbox: Usually more lenient limits for testing
- Production: Follow eBay's API usage policies
- Check your quota usage in the eBay Developer Portal
