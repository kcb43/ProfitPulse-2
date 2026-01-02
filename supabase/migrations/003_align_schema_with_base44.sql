-- Align Supabase schema with Base44 export fields.
-- Safe to run multiple times (uses IF NOT EXISTS where possible).

-- INVENTORY: add return_deadline_dismissed if missing
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS return_deadline_dismissed BOOLEAN DEFAULT FALSE;

-- SALES: add missing columns expected by the app/Base44
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS quantity_sold INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS return_deadline DATE;

-- Backfill selling_price from legacy sale_price if present
UPDATE sales
SET selling_price = sale_price
WHERE selling_price IS NULL AND sale_price IS NOT NULL;

-- Indexes (some may already exist from initial migration)
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);


