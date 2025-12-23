# Worker Debug Information for ChatGPT

## Package.json Start Scripts

### API (`render-api/package.json`)
```json
{
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  }
}
```

### Worker (`render-worker/package.json`)
```json
{
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  }
}
```

## Entry Files Confirmed

✅ **API entry file:** `server.js` (exists at `render-api/server.js`)
✅ **Worker entry file:** `index.js` (exists at `render-worker/index.js`)

## Current Dockerfile CMD Lines

### API Dockerfile (`render-api/Dockerfile`)
```dockerfile
CMD ["node", "server.js"]
```
✅ Matches package.json start script: `"start": "node server.js"`

### Worker Dockerfile (`render-worker/Dockerfile`)
```dockerfile
CMD ["node", "index.js"]
```
✅ Matches package.json start script: `"start": "node index.js"`

## Current Status

Both Dockerfiles already have CMD lines that match the package.json start scripts exactly. The entry files are confirmed to exist.

## Worker Crash Context

The worker is crashing, but it's not due to Dockerfile CMD issues. The worker has been updated with proper error handling:
- `claimJob()` is wrapped with `.then().catch()` to handle errors
- Worker continues polling instead of crashing on errors
- Uses `new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))` for delays

## Next Steps for ChatGPT

If the worker is still crashing, check:
1. Environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.)
2. Database connection issues
3. Playwright browser initialization
4. Error logs from Fly.io: `fly logs -a profitpulse-listing-worker`

