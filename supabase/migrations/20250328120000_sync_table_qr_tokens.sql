-- Sync physical tables + QR tokens with api/create-order.js FALLBACK_TOKENS (idempotent).
-- Safe if `tables` already exists (UUID id from original schema).

ALTER TABLE tables ADD COLUMN IF NOT EXISTS label TEXT;

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
