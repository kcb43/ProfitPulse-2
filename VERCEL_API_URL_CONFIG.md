# Vercel API URL Configuration

## ✅ Correct API URL

**Use:** `https://profitorbit-api.fly.dev`

## Why This Is Correct

1. **Fly App Name**: `render-api/fly.toml` shows `app = "profitorbit-api"`
2. **Frontend Default**: `src/api/listingApiClient.js` defaults to `'https://profitorbit-api.fly.dev'`
3. **Fly URL Format**: Fly.io URLs are `https://{app-name}.fly.dev`

## Current vs Correct

- ❌ **Current (Wrong)**: `https://profitpulse-listing-api.fly.dev`
- ✅ **Correct**: `https://profitorbit-api.fly.dev`

## Vercel Environment Variable

Set in Vercel Dashboard → Your Project → Settings → Environment Variables:

**Variable Name:** `VITE_LISTING_API_URL`  
**Value:** `https://profitorbit-api.fly.dev`  
**Environments:** Production, Preview, Development

## App Names Reference

- **API App**: `profitorbit-api` → `https://profitorbit-api.fly.dev`
- **Worker App**: `profitpulse-listing-worker` → Internal (not publicly accessible)

## Verification

After setting the environment variable in Vercel:
1. Redeploy your Vercel app
2. Check browser console - should see API calls going to `https://profitorbit-api.fly.dev`
3. Test API connection from your frontend

