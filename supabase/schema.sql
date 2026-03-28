-- Yacunaj Café & Gelato - Database Schema
-- Run this in Supabase SQL Editor

-- Tables (physical tables in the café)
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL UNIQUE,
  qr_token TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  table_number INTEGER NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed tables (tokens match api/create-order.js FALLBACK_TOKENS + Staff POS TOKENS)
INSERT INTO tables (table_number, qr_token, active, label) VALUES
  (1,  'tok_t1_abc123',   true, 'Mesa 1'),
  (2,  'tok_t2_bcd234',   true, 'Mesa 2'),
  (3,  'tok_t3_cde345',   true, 'Mesa 3'),
  (4,  'tok_t4_def456',   true, 'Mesa 4'),
  (5,  'tok_t5_efg567',   true, 'Mesa 5'),
  (6,  'tok_t6_fgh678',   true, 'Mesa 6'),
  (7,  'tok_t7_ghi789',   true, 'Mesa 7'),
  (8,  'tok_t8_hij890',   true, 'Mesa 8'),
  (9,  'tok_t9_ijk901',   true, 'Mesa 9'),
  (10, 'tok_t10_bcd890',  true, 'Mesa 10')
ON CONFLICT (table_number) DO UPDATE SET
  qr_token = EXCLUDED.qr_token,
  active   = EXCLUDED.active,
  label    = COALESCE(EXCLUDED.label, tables.label);

-- Enable realtime for orders (or enable in Supabase Dashboard > Database > Replication)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- RLS: Allow anon to read tables (for QR validation from frontend)
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read tables" ON tables FOR SELECT TO anon USING (true);

-- RLS: Allow anon to read orders (for admin realtime)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read orders" ON orders FOR SELECT TO anon USING (true);
