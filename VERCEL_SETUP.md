# Vercel Environment Variables Setup for eBay Production

## Step 1: Get Your Client Secret

1. Go to [eBay Developer Portal](https://developer.ebay.com/)
2. Navigate to **My Account** → **Keys & Tokens**
3. Click on your **Production** keyset
4. Find **Client Secret** (also called "Cert ID")
5. Click "Show" or "Reveal" to view it
6. Copy the Client Secret value

## Step 2: Add Environment Variables in Vercel

1. Go to your Vercel Dashboard
2. Select your project: **ProfitPulse-2** (or whatever your project is named)
3. Go to **Settings** → **Environment Variables**
4. Add these variables for **Production**, **Preview**, and **Development**:

### Required Variables:

```
EBAY_CLIENT_ID=BertsonB-ProfitPu-PRD-06e427756-fd86c26b
EBAY_CLIENT_SECRET=YourClientSecretFromEBayPortal
EBAY_ENV=production
```

**Important Notes:**
- ❌ **DO NOT** use `VITE_EBAY_*` prefix for these - that's only for client-side code
- ✅ Use `EBAY_*` without `VITE_` prefix - this is for server-side API routes
- The `EBAY_ENV=production` tells the code to use production eBay API (`api.ebay.com`) instead of sandbox

### Variable Breakdown:

| Variable | Value | Where to Find It |
|----------|-------|------------------|
| `EBAY_CLIENT_ID` | `BertsonB-ProfitPu-PRD-06e427756-fd86c26b` | eBay Developer Portal → Production Keyset → App ID/Client ID |
| `EBAY_CLIENT_SECRET` | (hidden, click "Show") | eBay Developer Portal → Production Keyset → Client Secret (Cert ID) |
| `EBAY_ENV` | `production` | Set this to use production API instead of sandbox |

## Step 3: Redeploy

After adding the environment variables:

1. Vercel will automatically redeploy your project
2. Or manually trigger a deployment from the Vercel dashboard
3. Wait for deployment to complete (usually 1-2 minutes)

## Step 4: Verify It's Working

1. Go to your live Vercel site
2. Open the "Search eBay for Items" dialog
3. Search for something like "iPhone 15" or "laptop"
4. You should now see **real eBay listings** (not empty results like sandbox)

## Troubleshooting

### Still seeing sandbox results or errors?

1. **Check Vercel Environment Variables:**
   - Make sure `EBAY_ENV=production` is set
   - Verify `EBAY_CLIENT_ID` starts with `PRD-` not `SBX-`
   - Ensure `EBAY_CLIENT_SECRET` matches your production keyset

2. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Your Project → Functions → `/api/ebay/search`
   - Look at the logs to see which environment is being used
   - You should see: `"environment": "production"` in the logs

3. **Redeploy After Changing Variables:**
   - Environment variables are baked in at build time
   - After changing variables, you MUST redeploy

### Common Mistakes:

❌ **Don't use:** `VITE_EBAY_CLIENT_ID` in Vercel (that's for client-side only)
✅ **Use:** `EBAY_CLIENT_ID` in Vercel (for server-side API routes)

❌ **Don't forget:** `EBAY_ENV=production` - without this, it will still use sandbox
✅ **Remember:** All three variables are required

## Local Development

For local development, create a `.env.local` file in your project root:

```env
VITE_EBAY_CLIENT_ID=BertsonB-ProfitPu-PRD-06e427756-fd86c26b
VITE_EBAY_CLIENT_SECRET=YourClientSecret
EBAY_ENV=production
```

**Note:** For local dev, you can use either `VITE_EBAY_*` or `EBAY_*` because the API routes have fallbacks.

## What Changed?

- **Before (Sandbox):** Using `api.sandbox.ebay.com` with limited test data
- **After (Production):** Using `api.ebay.com` with real eBay listings

Your search should now return actual eBay items! 🎉

