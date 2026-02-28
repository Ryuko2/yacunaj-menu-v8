-- Yacunaj Café & Gelato - Database Schema
-- Run this in Supabase SQL Editor

-- Tables (physical tables in the café)
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL UNIQUE,
  qr_token TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
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

-- Seed sample tables with QR tokens
INSERT INTO tables (table_number, qr_token) VALUES
  (1, 'tok_t1_abc123'),
  (2, 'tok_t2_def456'),
  (3, 'tok_t3_ghi789'),
  (4, 'tok_t4_jkl012'),
  (5, 'tok_t5_mno345'),
  (6, 'tok_t6_pqr678'),
  (7, 'tok_t7_stu901'),
  (8, 'tok_t8_vwx234'),
  (9, 'tok_t9_yza567'),
  (10, 'tok_t10_bcd890')
ON CONFLICT (table_number) DO NOTHING;

-- Enable realtime for orders (or enable in Supabase Dashboard > Database > Replication)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- RLS: Allow anon to read tables (for QR validation from frontend)
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read tables" ON tables FOR SELECT TO anon USING (true);

-- RLS: Allow anon to read orders (for admin realtime)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read orders" ON orders FOR SELECT TO anon USING (true);
