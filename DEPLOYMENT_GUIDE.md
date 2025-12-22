# Deployment Guide: Listing Automation System

## Overview

This guide covers deploying the listing automation system to Render:
- **Render Web Service**: API for platform connections and job management
- **Render Worker Service**: Playwright automation worker

## Prerequisites

1. ✅ Supabase project created
2. ✅ Tables created (`platform_accounts`, `listing_jobs`, `listing_job_events`)
3. ✅ Storage bucket created (`listing-photos`)
4. ✅ Render account created (https://render.com)

## Step 1: Generate Encryption Key

Generate a 32-character encryption key (must be the same for both services):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save this key - you'll need it for both API and Worker services.

## Step 2: Deploy Render API Service

### 2.1 Create Web Service

1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `listing-automation-api`
   - **Root Directory**: `render-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or `Starter` for production)

### 2.2 Set Environment Variables

In Render dashboard → Environment:

```env
SUPABASE_URL=https://hlcwhpajorzbleabavcr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENCRYPTION_KEY=your_32_char_encryption_key
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://profitorbit.io,https://profit-pulse-2.vercel.app
```

### 2.3 Deploy

Click **"Create Web Service"** and wait for deployment.

**Note the URL**: `https://listing-automation-api.onrender.com` (or your custom domain)

## Step 3: Deploy Render Worker Service

### 3.1 Create Background Worker

1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Background Worker"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `listing-automation-worker`
   - **Root Directory**: `render-worker`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx playwright install chromium`
   - **Start Command**: `npm start`
   - **Instance Type**: `Starter` (minimum - Playwright needs RAM)

### 3.2 Set Environment Variables

```env
SUPABASE_URL=https://hlcwhpajorzbleabavcr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENCRYPTION_KEY=your_32_char_encryption_key
POLL_INTERVAL_MS=2000
MAX_CONCURRENT_JOBS=1
PLAYWRIGHT_HEADLESS=true
```

### 3.3 Deploy

Click **"Create Background Worker"** and wait for deployment.

## Step 4: Create Supabase Database Function

Run the SQL migration in Supabase:

1. Go to: Supabase Dashboard → SQL Editor
2. Paste contents of `render-worker/supabase-migration.sql`
3. Click **"Run"**

This creates the `claim_listing_job()` function for row-level locking.

## Step 5: Update Frontend Configuration

Update your Vercel frontend to use the Render API:

**File: `.env.local`** (or Vercel environment variables):

```env
VITE_LISTING_API_URL=https://listing-automation-api.onrender.com
```

**File: `src/config/api.js`** (create if doesn't exist):

```javascript
export const LISTING_API_URL = import.meta.env.VITE_LISTING_API_URL || 'https://listing-automation-api.onrender.com';
```

## Step 6: Update Chrome Extension

Update the extension to use the Render API:

**File: `extension/background.js`**:

Add at the top:
```javascript
const LISTING_API_URL = 'https://listing-automation-api.onrender.com';
```

Add message handler for platform connection:
```javascript
// Handle platform connection request
if (message.type === 'CONNECT_PLATFORM') {
  (async () => {
    try {
      const { platform, authToken } = message;
      const result = await connectPlatform(platform, LISTING_API_URL, authToken);
      sendResponse({ success: true, result });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();
  return true;
}
```

## Step 7: Test the System

### 7.1 Test API Health

```bash
curl https://listing-automation-api.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "listing-automation-api"
}
```

### 7.2 Test Platform Connection

1. Log in to Mercari or Facebook in your browser
2. Open Chrome extension popup
3. Click "Connect" for the platform
4. Check Supabase `platform_accounts` table - should see new row with `status='connected'`

### 7.3 Test Job Creation

Create a test job via API:

```bash
curl -X POST https://listing-automation-api.onrender.com/api/listings/create-job \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
  -d '{
    "platforms": ["mercari"],
    "payload": {
      "title": "Test Item",
      "description": "Test description",
      "price": 10.00,
      "images": []
    }
  }'
```

### 7.4 Monitor Worker

Check Render Worker logs to see if it's processing jobs:
- Go to: Render Dashboard → Your Worker → Logs
- Should see: `📦 Processing job...` messages

## Troubleshooting

### API Returns 401 Unauthorized
- Check that `Authorization: Bearer <token>` header is included
- Verify token is valid Supabase JWT

### Worker Not Processing Jobs
- Check Worker logs in Render dashboard
- Verify `claim_listing_job()` function exists in Supabase
- Check that jobs have `status='queued'`

### Playwright Errors
- Ensure `npx playwright install chromium` ran during build
- Check Worker has enough RAM (Starter plan minimum)
- Verify `PLAYWRIGHT_HEADLESS=true` is set

### Cookies Not Working
- Verify cookies were captured correctly
- Check encryption key matches between API and Worker
- Ensure platform account has `status='connected'`

## Cost Estimates

### Render Free Tier
- **API Service**: Free (with limitations)
- **Worker Service**: Not available on Free tier

### Render Starter Tier ($7/month each)
- **API Service**: $7/month
- **Worker Service**: $7/month
- **Total**: ~$14/month

### Render Standard Tier ($25/month each)
- Better performance, more RAM
- **Total**: ~$50/month

## Next Steps

1. ✅ Deploy API service
2. ✅ Deploy Worker service
3. ✅ Test platform connections
4. ✅ Test job creation and processing
5. ⏳ Update frontend to use new API
6. ⏳ Update Chrome extension
7. ⏳ Monitor and optimize


