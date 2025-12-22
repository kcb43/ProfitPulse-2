# Fix 500 Errors - The Real Issue

## 🔍 The Problem

Your API routes are being **proxied to production** (`https://profitorbit.io`) during local development. This means:

- ✅ Your `.env.local` file works for frontend code
- ❌ But API routes run on Vercel and need environment variables set there!

## ✅ Quick Fix: Set Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your project (probably "ProfitPulse-2" or similar)
3. Go to **Settings** → **Environment Variables**

### Step 2: Add These 3 Variables

Click **Add** for each one:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://hlcwhpajorzbleabavcr.supabase.co` | ✅ Production, ✅ Preview, ✅ Development |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_AmJEyN9K_q2OJAUCGiO3eA_NZYf6rXm` | ✅ Production, ✅ Preview, ✅ Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_jfF_FPZMZNXkJcAp8da0SA_UcqFHU4-` | ✅ Production, ✅ Preview, ✅ Development |

**Important:** Check all three environments (Production, Preview, Development) for each variable!

### Step 3: Redeploy

After adding variables:

1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait 1-2 minutes for deployment

### Step 4: Test Again

After redeploy:

1. Refresh your browser
2. Try accessing `/api/inventory` again
3. The 500 errors should be gone!

## Alternative: Run API Routes Locally

If you want to test locally without Vercel:

1. **Set environment variable** to use local API:
   ```powershell
   $env:VITE_LOCAL_API="true"
   npm run dev
   ```

2. **But** you'd need to run the API routes locally (requires more setup)

**Easier solution:** Just set the variables in Vercel! ✅

## After Fixing 500 Errors

Once the API routes work:

1. ✅ Get your Supabase user ID (from `/login` page)
2. ✅ Load your JSON files (`inventoryData` and `salesData`)
3. ✅ Run the import script (see `STEP_BY_STEP_IMPORT.md`)

Let me know once you've set the variables in Vercel and redeployed!


