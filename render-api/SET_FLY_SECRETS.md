# Fly.io Secrets Setup for render-api

## Run this command in PowerShell:

```powershell
cd F:\bareretail\render-api

fly secrets set `
SUPABASE_URL="https://hlcwhpajorzbleabavcr.supabase.co" `
SUPABASE_SERVICE_ROLE_KEY="sb_secret_jfF_FPZMZNXkJcAp8da0SA_UcqFHU4-" `
ENCRYPTION_KEY="88394e34ce9acf08fa7fd55d38438994bf5f882bba93d06b9cffed9cdce37e9c" `
ALLOWED_ORIGINS="https://profitorbit.io,https://profit-pulse-2.vercel.app" `
NODE_ENV="production"
```

## Values Used:

- **SUPABASE_URL**: `https://hlcwhpajorzbleabavcr.supabase.co`
- **SUPABASE_SERVICE_ROLE_KEY**: `sb_secret_jfF_FPZMZNXkJcAp8da0SA_UcqFHU4-`
- **ENCRYPTION_KEY**: `88394e34ce9acf08fa7fd55d38438994bf5f882bba93d06b9cffed9cdce37e9c` (from your message)
- **ALLOWED_ORIGINS**: `https://profitorbit.io,https://profit-pulse-2.vercel.app` (comma-separated)
- **NODE_ENV**: `production`

## Note:

The code uses `SUPABASE_SERVICE_ROLE_KEY` (not `SUPABASE_ANON_KEY`) and `ALLOWED_ORIGINS` (not `CORS_ORIGIN`) as shown in the server.js file.


