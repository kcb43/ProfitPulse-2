# Fix 500 Errors in API Routes

## The Problem

You're getting 500 errors because the API routes can't connect to Supabase. This is likely because:

1. **Environment variables aren't set** for server-side routes
2. **Supabase credentials missing** in `.env.local`

## Quick Fix

### Step 1: Verify `.env.local` Exists

Make sure you created `.env.local` in `F:\bareretail\.env.local` with:

```env
VITE_SUPABASE_URL=https://hlcwhpajorzbleabavcr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_AmJEyN9K_q2OJAUCGiO3eA_NZYf6rXm
SUPABASE_SERVICE_ROLE_KEY=sb_secret_jfF_FPZMZNXkJcAp8da0SA_UcqFHU4-
```

### Step 2: Restart Dev Server

**Important:** After creating/updating `.env.local`, you MUST restart your dev server:

1. **Stop** the current server (Ctrl+C in the terminal)
2. **Start** it again: `npm run dev`

### Step 3: Check Server Logs

When you make an API request, check the terminal where `npm run dev` is running. You should see:
- ✅ No "Supabase environment variables not configured" errors
- ✅ API requests logging successfully

### Step 4: Test API Routes

In browser console, test:

```javascript
// Test inventory API
fetch('/api/inventory', {
  headers: { 'x-user-id': 'test-user-123' }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

If you still get 500 errors, check the **server terminal** for the actual error message.

## Common Issues

### Issue: "Supabase environment variables not configured"
**Solution:** 
- Check `.env.local` exists
- Check file has correct content (no extra spaces, correct values)
- Restart dev server

### Issue: "relation does not exist"
**Solution:**
- Tables don't exist in Supabase yet
- Run the migration SQL (see `SUPABASE_SETUP_GUIDE.md`)

### Issue: "permission denied"
**Solution:**
- RLS policies might be blocking
- Check Supabase dashboard → Authentication → Policies

## Next Steps

Once 500 errors are fixed:
1. ✅ Get your Supabase user ID
2. ✅ Import your data
3. ✅ See your inventory and sales!


