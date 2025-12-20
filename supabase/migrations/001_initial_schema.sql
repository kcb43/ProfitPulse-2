-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE item_status AS ENUM ('available', 'listed', 'sold');
CREATE TYPE platform_type AS ENUM ('ebay', 'facebook_marketplace', 'etsy', 'mercari', 'offer_up');

-- Inventory Items Table
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  purchase_price NUMERIC(10, 2) NOT NULL,
  purchase_date DATE,
  source TEXT,
  status item_status DEFAULT 'available',
  category TEXT,
  notes TEXT,
  image_url TEXT, -- For backwards compatibility
  images TEXT[] DEFAULT '{}', -- Array of image URLs
  quantity INTEGER DEFAULT 1,
  quantity_sold INTEGER DEFAULT 0,
  return_deadline DATE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name TEXT,
  sale_price NUMERIC(10, 2),
  sale_date DATE,
  platform TEXT, -- Using TEXT instead of enum for flexibility
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  platform_fees NUMERIC(10, 2) DEFAULT 0,
  vat_fees NUMERIC(10, 2) DEFAULT 0,
  other_costs NUMERIC(10, 2) DEFAULT 0,
  profit NUMERIC(10, 2), -- Calculated field
  notes TEXT,
  image_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Image Editor Templates Table
CREATE TABLE image_editor_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  settings JSONB NOT NULL, -- Stores image adjustment settings
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crosslistings Table (if not already exists)
CREATE TABLE IF NOT EXISTS crosslistings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  category TEXT,
  condition TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX idx_inventory_items_deleted_at ON inventory_items(deleted_at);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_inventory_id ON sales(inventory_id);
CREATE INDEX idx_sales_deleted_at ON sales(deleted_at);
CREATE INDEX idx_image_templates_user_id ON image_editor_templates(user_id);
CREATE INDEX idx_image_templates_deleted_at ON image_editor_templates(deleted_at);
CREATE INDEX idx_crosslistings_user_id ON crosslistings(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_image_templates_updated_at BEFORE UPDATE ON image_editor_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crosslistings_updated_at BEFORE UPDATE ON crosslistings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_editor_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crosslistings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
-- Inventory Items
CREATE POLICY "Users can view their own inventory items"
  ON inventory_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory items"
  ON inventory_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items"
  ON inventory_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items"
  ON inventory_items FOR DELETE
  USING (auth.uid() = user_id);

-- Sales
CREATE POLICY "Users can view their own sales"
  ON sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales"
  ON sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
  ON sales FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales"
  ON sales FOR DELETE
  USING (auth.uid() = user_id);

-- Image Editor Templates
CREATE POLICY "Users can view their own templates"
  ON image_editor_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON image_editor_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON image_editor_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON image_editor_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Crosslistings
CREATE POLICY "Users can view their own crosslistings"
  ON crosslistings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crosslistings"
  ON crosslistings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crosslistings"
  ON crosslistings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own crosslistings"
  ON crosslistings FOR DELETE
  USING (auth.uid() = user_id);

