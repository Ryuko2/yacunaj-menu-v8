-- Mesa virtual "mostrador CRM" para pedidos tomados desde OPS (sin QR de cliente).
INSERT INTO public.tables (table_number, qr_token, active, label)
VALUES (0, 'tok_crm_counter_yacunaj', true, 'Mostrador (CRM)')
ON CONFLICT (table_number) DO UPDATE SET
  qr_token = EXCLUDED.qr_token,
  active   = EXCLUDED.active,
  label    = COALESCE(EXCLUDED.label, tables.label);

-- Añade columna source a la tabla orders para distinguir el origen del pedido
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text DEFAULT 'qr' CHECK (source IN ('qr', 'crm', 'staff', 'admin'));

-- Comentario para documentación
COMMENT ON COLUMN public.orders.source IS 'Origen del pedido: qr (cliente), crm (mostrador), staff (mesero)';
