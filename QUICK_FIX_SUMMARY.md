# Quick Fix Summary

## The Issue

You're getting 500 errors because API routes run on Vercel (production), not locally. They need environment variables set in Vercel dashboard.

## ✅ Fix (2 minutes)

1. **Go to Vercel**: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. **Add 3 variables**:
   - `VITE_SUPABASE_URL` = `https://hlcwhpajorzbleabavcr.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_AmJEyN9K_q2OJAUCGiO3eA_NZYf6rXm`
   - `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_jfF_FPZMZNXkJcAp8da0SA_UcqFHU4-`
3. **Check all environments** (Production, Preview, Development) for each
4. **Redeploy** (Deployments → ... → Redeploy)
5. **Wait 1-2 minutes**

## Then Import Your Data

After 500 errors are fixed:

1. **Sign in** at `/login`
2. **Get user ID** (see `STEP_BY_STEP_IMPORT.md`)
3. **Load JSON files** into console
4. **Run import script**

Your data will be back! 🎉


