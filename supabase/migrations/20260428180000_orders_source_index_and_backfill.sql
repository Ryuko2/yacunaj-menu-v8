-- Defensivo si migraciones previas no llegaron a un entorno.
INSERT INTO public.tables (table_number, qr_token, active, label)
VALUES (0, 'tok_crm_counter_yacunaj', true, 'Mostrador (CRM)')
ON CONFLICT (table_number) DO UPDATE SET
  qr_token = EXCLUDED.qr_token,
  active   = EXCLUDED.active,
  label    = COALESCE(EXCLUDED.label, tables.label);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text DEFAULT 'qr'
  CHECK (source IS NULL OR source IN ('qr', 'crm', 'staff', 'admin'));

UPDATE public.orders SET source = 'qr' WHERE source IS NULL;

COMMENT ON COLUMN public.orders.source IS
  'Origen: qr (cliente QR), crm (mostrador OPS), staff (POS pin), admin (reservado).';

CREATE INDEX IF NOT EXISTS orders_source_idx ON public.orders (source) WHERE source IS DISTINCT FROM 'qr';
