-- Sales aggregates for reporting (Prompt 9).
-- Idempotent: CREATE OR REPLACE VIEW.

CREATE OR REPLACE VIEW public.v_sales_daily AS
SELECT
  (created_at AT TIME ZONE 'America/Mexico_City')::date AS day,
  source,
  status,
  COUNT(*)::int AS orders_count,
  COALESCE(SUM(total), 0)::numeric(12, 2) AS revenue,
  COALESCE(AVG(total), 0)::numeric(12, 2) AS avg_ticket
FROM public.orders
GROUP BY 1, 2, 3;

CREATE OR REPLACE VIEW public.v_sales_items AS
SELECT
  (o.created_at AT TIME ZONE 'America/Mexico_City')::date AS day,
  (item->>'id') AS item_id,
  (item->>'name') AS item_name,
  SUM((item->>'quantity')::numeric)::int AS qty,
  SUM(((item->>'finalPrice')::numeric) * ((item->>'quantity')::numeric))::numeric(12, 2) AS revenue
FROM public.orders o,
  jsonb_array_elements(o.items) AS item
GROUP BY 1, 2, 3;

GRANT SELECT ON public.v_sales_daily, public.v_sales_items TO authenticated;
