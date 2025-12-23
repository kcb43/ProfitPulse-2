# Fly.io Deployment Guide

## Important: Deploy from Correct Directory

You **must** run `fly deploy` from the folder that contains the Dockerfile + fly.toml.

## Deploy API

```bash
cd render-api
fly deploy -a profitorbit-api
```

## Deploy Worker

```bash
cd render-worker
fly deploy -a profitpulse-listing-worker
```

## Dockerfile Details

### API Dockerfile (`render-api/Dockerfile`)
- Base image: `node:20-slim`
- Port: `8080`
- Production dependencies only (`npm ci --omit=dev`)

### Worker Dockerfile (`render-worker/Dockerfile`)
- Base image: `mcr.microsoft.com/playwright:v1.49.0-jammy`
- Includes Chromium + all system dependencies
- No need to install browsers separately

## Troubleshooting

If you get build errors:
1. Make sure you're in the correct directory (`render-api` or `render-worker`)
2. Verify `fly.toml` exists in the same directory
3. Check that `package.json` exists
4. Ensure environment variables are set: `fly secrets set KEY=value`

