# Server-Side Listing Automation Implementation Plan

## Overview

This document outlines the implementation of server-side listing automation using:
- **Render Web Service**: API for platform connections and job management
- **Render Worker Service**: Playwright automation for creating listings
- **Chrome Extension**: Captures cookies for platform authentication
- **Supabase**: Database and storage

## Architecture

```
┌─────────────────┐
│  Chrome Ext     │───[Captures cookies]───┐
└─────────────────┘                         │
                                            ▼
┌─────────────────┐                    ┌──────────────┐
│  Vercel Frontend│───[Create Job]───►│ Render API   │
└─────────────────┘                    │  Service     │
                                       └──────────────┘
                                            │
                                            │ [Store Job]
                                            ▼
                                       ┌──────────────┐
                                       │  Supabase    │
                                       │  - platform_ │
                                       │    accounts  │
                                       │  - listing_  │
                                       │    jobs      │
                                       └──────────────┘
                                            ▲
                                            │ [Poll Jobs]
                                            │
┌─────────────────┐                    ┌──────────────┐
│  Render Worker  │◄───[Claim Job]────│              │
│  (Playwright)   │                    │              │
└─────────────────┘                    └──────────────┘
        │
        │ [Download images]
        ▼
┌──────────────┐
│ Supabase     │
│ Storage      │
│ (photos)     │
└──────────────┘
```

## Implementation Steps

### ✅ Step 1-3: Supabase Setup (COMPLETED)
- Tables created: `platform_accounts`, `listing_jobs`, `listing_job_events`
- Storage bucket created: `listing-photos`

### Step 4: Render API Service Structure

Create a new directory: `render-api/`

**Files needed:**
- `render-api/server.js` - Express server
- `render-api/routes/platform.js` - Platform connection endpoints
- `render-api/routes/listings.js` - Job management endpoints
- `render-api/utils/auth.js` - Supabase JWT verification
- `render-api/utils/encryption.js` - Cookie encryption/decryption
- `render-api/package.json` - Dependencies
- `render-api/.env.example` - Environment variables template

**Endpoints:**
- `POST /api/platform/connect` - Store platform cookies
- `POST /api/listings/create-job` - Create listing job
- `GET /api/listings/jobs/:id` - Get job status
- `GET /api/listings/jobs` - List user's jobs

### Step 5: Render Worker Service Structure

Create a new directory: `render-worker/`

**Files needed:**
- `render-worker/index.js` - Worker main loop
- `render-worker/processors/mercari.js` - Mercari listing logic
- `render-worker/processors/facebook.js` - Facebook listing logic
- `render-worker/utils/db.js` - Database connection
- `render-worker/utils/storage.js` - Supabase storage helpers
- `render-worker/package.json` - Dependencies
- `render-worker/.env.example` - Environment variables

**Worker Logic:**
- Poll Supabase every 2 seconds for `status='queued'` jobs
- Use row-level locking to prevent duplicate processing
- Process each platform sequentially
- Update progress in real-time
- Handle errors gracefully

### Step 6: Chrome Extension Updates

Update `extension/background.js` or create new file:
- Add function to export cookies for a domain
- Add function to send cookies to API
- Add UI button in popup for "Connect Platform"

### Step 7: Frontend Job Tracking

Create new components:
- `src/components/ListingJobTracker.jsx` - Job status display
- `src/components/PlatformConnector.jsx` - Platform connection UI
- `src/pages/Listings.jsx` - Listing management page

## Database Schema (Already Created)

### platform_accounts
- `id` (uuid, primary)
- `user_id` (uuid, not null)
- `platform` (text, not null)
- `status` (text, default 'disconnected')
- `last_verified_at` (timestamptz)
- `session_payload_encrypted` (text, nullable)
- `session_meta` (jsonb, default '{}')
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- **Unique constraint**: (user_id, platform)

### listing_jobs
- `id` (uuid, primary)
- `user_id` (uuid, not null)
- `inventory_item_id` (uuid, nullable)
- `platforms` (jsonb, default '[]')
- `payload` (jsonb, default '{}')
- `status` (text, default 'queued')
- `progress` (jsonb, default '{"percent":0,"message":"Queued"}')
- `result` (jsonb, default '{}')
- `error` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### listing_job_events
- `id` (uuid, primary)
- `job_id` (uuid, not null)
- `ts` (timestamptz, default now())
- `platform` (text, nullable)
- `level` (text, default 'info')
- `message` (text, not null)
- `data` (jsonb, default '{}')

## Environment Variables

### Render API Service
```env
SUPABASE_URL=https://hlcwhpajorzbleabavcr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENCRYPTION_KEY=your_32_char_encryption_key
PORT=3000
```

### Render Worker Service
```env
SUPABASE_URL=https://hlcwhpajorzbleabavcr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENCRYPTION_KEY=your_32_char_encryption_key
POLL_INTERVAL_MS=2000
```

## Security Considerations

1. **Cookie Encryption**: Use AES-256-GCM for encrypting cookies
2. **JWT Verification**: Verify Supabase JWT on every API request
3. **Row Locking**: Use PostgreSQL `FOR UPDATE SKIP LOCKED` to prevent duplicate job processing
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Error Handling**: Don't expose sensitive errors to frontend

## Next Steps

1. Create Render API service structure
2. Create Render Worker service structure
3. Update Chrome extension
4. Create frontend components
5. Test end-to-end flow
6. Deploy to Render


