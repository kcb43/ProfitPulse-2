# Base44 to Supabase Migration Plan

## Overview
Complete migration from Base44 to Supabase for all backend operations.

## Entities to Migrate

### 1. InventoryItem
**Fields:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `item_name` (text, required)
- `purchase_price` (numeric, required)
- `purchase_date` (date)
- `source` (text)
- `status` (enum: 'available', 'listed', 'sold', default: 'available')
- `category` (text)
- `notes` (text)
- `image_url` (text) - for backwards compatibility
- `images` (text[]) - array of image URLs
- `quantity` (integer, default: 1)
- `quantity_sold` (integer, default: 0)
- `return_deadline` (date)
- `deleted_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 2. Sale
**Fields:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `inventory_id` (UUID, foreign key to inventory_items)
- `item_name` (text)
- `sale_price` (numeric)
- `sale_date` (date)
- `platform` (text) - ebay, facebook_marketplace, etsy, mercari, offer_up
- `shipping_cost` (numeric)
- `platform_fees` (numeric)
- `vat_fees` (numeric)
- `other_costs` (numeric)
- `profit` (numeric) - calculated field
- `notes` (text)
- `image_url` (text)
- `deleted_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 3. ImageEditorTemplate
**Fields:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `name` (text, required)
- `settings` (jsonb, required) - stores image adjustment settings
- `deleted_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 4. Crosslisting
**Fields:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `title` (text, required)
- `description` (text, required)
- `price` (text, required)
- `images` (text[]) - array of image URLs
- `category` (text)
- `condition` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Migration Steps

### Phase 1: Setup (Day 1)
1. ✅ Create Supabase project
2. ✅ Install Supabase client library
3. ✅ Create database schema (SQL migrations)
4. ✅ Set up Row Level Security (RLS) policies
5. ✅ Configure environment variables

### Phase 2: API Routes (Day 2)
1. ✅ Create `/api/inventory` routes (GET, POST, PUT, DELETE)
2. ✅ Create `/api/sales` routes (GET, POST, PUT, DELETE)
3. ✅ Create `/api/image-templates` routes (GET, POST, PUT, DELETE)
4. ✅ Update `/api/crosslistings` routes (already exists, needs Supabase)
5. ✅ Create `/api/upload` route for file uploads (replacing Base44 UploadFile)

### Phase 3: API Client (Day 2-3)
1. ✅ Create new API client (`src/api/supabaseClient.js`)
2. ✅ Create entity wrappers matching Base44 pattern
3. ✅ Implement file upload functionality

### Phase 4: Frontend Migration (Day 3)
1. ✅ Update all imports from `base44` to new API client
2. ✅ Replace all Base44 SDK calls with API calls
3. ✅ Update file upload calls
4. ✅ Test all CRUD operations

### Phase 5: Data Migration (Day 3)
1. ✅ Create export script from Base44
2. ✅ Create import script to Supabase
3. ✅ Run migration
4. ✅ Verify data integrity

## File Upload Strategy

**Current:** `base44.integrations.Core.UploadFile()`
**New:** Supabase Storage API

- Create `images` bucket in Supabase Storage
- Upload files to Supabase Storage
- Return public URLs
- Store URLs in database

## Authentication Strategy

**Current:** Base44 auth (if used)
**New:** Supabase Auth

- Migrate users if Base44 auth is used
- Or use existing auth system and just store `user_id` in tables

## Rollback Plan

1. Keep Base44 code commented out initially
2. Use feature flag to switch between Base44 and Supabase
3. Test thoroughly before removing Base44 code
4. Keep Base44 data as backup

