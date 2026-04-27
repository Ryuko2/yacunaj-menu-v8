-- YACUNAJ — menu_items table
-- Run in Supabase SQL Editor. Storage bucket: create manually (Dashboard → Storage → menu-images, Public)

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'variable')),
  category TEXT NOT NULL,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active menu items" ON menu_items;
CREATE POLICY "Public read active menu items" ON menu_items FOR SELECT USING (active = true);
