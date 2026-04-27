-- Fase 2 — auditoría de precios con contexto, order_items, storage bucket, vista pública con horario.
-- Idempotente. Compatible con proyectos que ya aplicaron la Fase 1 con EXECUTE PROCEDURE.

-- ---------------------------------------------------------------------------
-- 1) Triggers: EXECUTE FUNCTION (Postgres 11+ / Supabase 15)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tg_audit_menu_item_price ON menu_items;
DROP TRIGGER IF EXISTS tg_audit_modifier_price_extra ON modifiers;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER tg_audit_menu_item_price
  AFTER UPDATE OF price ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_menu_item_price();

CREATE TRIGGER tg_audit_modifier_price_extra
  AFTER UPDATE OF price_extra ON modifiers
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_modifier_price_extra();

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- ---------------------------------------------------------------------------
-- 2) Auditoría: user_id y motivo desde GUC (set_config en transacción)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_audit_menu_item_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_reason TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.price IS DISTINCT FROM OLD.price THEN
    BEGIN
      v_uid := NULLIF(current_setting('app.user_id', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_uid := auth.uid();
    END;
    BEGIN
      v_reason := NULLIF(trim(current_setting('app.price_change_reason', true)), '');
    EXCEPTION WHEN OTHERS THEN
      v_reason := NULL;
    END;
    INSERT INTO price_changes_log (menu_item_id, modifier_id, old_price, new_price, reason, user_id)
    VALUES (OLD.id, NULL, OLD.price, NEW.price, v_reason, v_uid);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_audit_modifier_price_extra()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_reason TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.price_extra IS DISTINCT FROM OLD.price_extra THEN
    BEGIN
      v_uid := NULLIF(current_setting('app.user_id', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_uid := auth.uid();
    END;
    BEGIN
      v_reason := NULLIF(trim(current_setting('app.price_change_reason', true)), '');
    EXCEPTION WHEN OTHERS THEN
      v_reason := NULL;
    END;
    INSERT INTO price_changes_log (menu_item_id, modifier_id, old_price, new_price, reason, user_id)
    VALUES (NULL, OLD.id, OLD.price_extra, NEW.price_extra, v_reason, v_uid);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_app_audit_context(p_user_id UUID, p_price_change_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.user_id', COALESCE(p_user_id::text, ''), true);
  PERFORM set_config('app.price_change_reason', COALESCE(p_price_change_reason, ''), true);
END;
$$;

GRANT EXECUTE ON FUNCTION set_app_audit_context(UUID, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- 3) order_items — líneas normalizadas (borrado duro de producto)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items (id) ON DELETE SET NULL,
  snapshot_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  line_total NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON order_items (menu_item_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS order_items_staff_select ON order_items;
CREATE POLICY order_items_staff_select ON order_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager', 'barista', 'cashier')
  )
);

-- ---------------------------------------------------------------------------
-- 4) Promociones en menu_items
-- ---------------------------------------------------------------------------
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS promo_starts_at DATE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS promo_ends_at DATE;

-- ---------------------------------------------------------------------------
-- 5) Bucket Storage menu-images (público lectura)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS storage_menu_images_public_read ON storage.objects;
CREATE POLICY storage_menu_images_public_read ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS storage_menu_images_service_write ON storage.objects;
CREATE POLICY storage_menu_images_service_write ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'menu-images')
WITH CHECK (bucket_id = 'menu-images');

-- ---------------------------------------------------------------------------
-- 6) Vista pública: horarios locales (México); seasonal=true oculto hasta reglas de temporada
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_menu_publico AS
SELECT
  c.slug AS category_slug,
  c.nombre AS category_name,
  mi.id AS item_id,
  mi.name AS item_name,
  mi.price AS item_price,
  mi.price_type AS item_price_type,
  mi.image_url,
  mi.active,
  mi.out_of_stock,
  mi.seasonal
FROM menu_items mi
JOIN categories c
  ON c.id = COALESCE(mi.category_id, (SELECT id FROM categories c2 WHERE c2.slug = mi.category LIMIT 1))
  AND c.activa = true
WHERE mi.active = true
  AND COALESCE(mi.out_of_stock, false) = false
  AND (
    mi.available_days IS NULL
    OR cardinality(mi.available_days) = 0
    OR EXTRACT(DOW FROM (now() AT TIME ZONE 'America/Mexico_City'))::integer = ANY (mi.available_days)
  )
  AND (
    mi.available_from IS NULL
    OR (now() AT TIME ZONE 'America/Mexico_City')::time >= mi.available_from
  )
  AND (
    mi.available_until IS NULL
    OR (now() AT TIME ZONE 'America/Mexico_City')::time <= mi.available_until
  );
-- seasonal: sin ventanas promo_* no se oculta (evita romper postres estacionales del menú actual).

-- ---------------------------------------------------------------------------
-- 7) RPC catálogo público — mismos filtros
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_menu_public_catalog(p_at timestamptz DEFAULT now())
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tz TEXT := 'America/Mexico_City';
  local_ts TIMESTAMP;
  local_time TIME;
  js_dow INTEGER;
  result jsonb;
BEGIN
  local_ts := (p_at AT TIME ZONE tz);
  local_time := local_ts::time;
  js_dow := (EXTRACT(DOW FROM local_ts))::INTEGER;

  WITH cat_base AS (
    SELECT c.*
    FROM categories c
    WHERE c.parent_id IS NULL
      AND c.activa = true
  ),
  items_per_cat AS (
    SELECT
      c.id AS cat_id,
      c.slug,
      c.nombre,
      c.sort_order,
      c.has_sizes,
      c.sizes_json,
      COALESCE(
        (
          SELECT jsonb_agg(item_row.item_obj ORDER BY item_row.sort_order, item_row.name)
          FROM (
            SELECT
              jsonb_build_object(
                'id', mi.id::text,
                'name', mi.name,
                'description', COALESCE(mi.description_short, mi.description),
                'price', mi.price,
                'price_type', COALESCE(mi.price_type, 'fixed'),
                'category', c.slug,
                'image_url', mi.image_url,
                'basePrice', mi.price,
                'ingredients', CASE WHEN mi.ingredients IS NULL THEN NULL ELSE to_jsonb(mi.ingredients) END,
                'maxFreeIngredients', mi.max_free_ingredients,
                'extraPrice', mi.extra_ingredient_price,
                'seasonal', mi.seasonal,
                'canBeHot', mi.can_be_hot
              ) AS item_obj,
              mi.sort_order,
              mi.name
            FROM menu_items mi
            WHERE mi.active = true
              AND COALESCE(mi.out_of_stock, false) = false
              AND (
                mi.category_id = c.id
                OR (mi.category_id IS NULL AND mi.category = c.slug)
              )
              AND (
                mi.available_days IS NULL
                OR cardinality(mi.available_days) = 0
                OR js_dow = ANY (mi.available_days)
              )
              AND (mi.available_from IS NULL OR local_time >= mi.available_from)
              AND (mi.available_until IS NULL OR local_time <= mi.available_until)
          ) AS item_row
        ),
        '[]'::jsonb
      ) AS items_json,
      EXISTS (
        SELECT 1
        FROM menu_items mi2
        WHERE mi2.active = true
          AND COALESCE(mi2.out_of_stock, false) = false
          AND (mi2.category_id = c.id OR (mi2.category_id IS NULL AND mi2.category = c.slug))
          AND mi2.ingredients IS NOT NULL
          AND cardinality(mi2.ingredients) > 0
      ) AS has_ingredients_flag
    FROM cat_base c
  )
  SELECT jsonb_build_object(
    'categories',
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ipc.slug,
          'name', ipc.nombre,
          'hasSizes', COALESCE(ipc.has_sizes, false),
          'sizes', ipc.sizes_json,
          'hasIngredients', ipc.has_ingredients_flag,
          'items', ipc.items_json
        )
        ORDER BY ipc.sort_order, ipc.nombre
      ),
      '[]'::jsonb
    )
  )
  INTO result
  FROM items_per_cat ipc;

  RETURN COALESCE(result, '{"categories":[]}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION get_menu_public_catalog(timestamptz) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8) RPC atómico: precio + auditoría (GUC en misma transacción)
-- ---------------------------------------------------------------------------
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION menu_item_set_price(p_id UUID, p_price NUMERIC(12, 2), p_user_id UUID, p_reason TEXT)
RETURNS SETOF menu_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.user_id', COALESCE(p_user_id::text, ''), true);
  PERFORM set_config('app.price_change_reason', COALESCE(p_reason, ''), true);
  UPDATE menu_items
  SET price = p_price, updated_at = now()
  WHERE id = p_id;
  RETURN QUERY SELECT * FROM menu_items WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION menu_item_set_price(UUID, NUMERIC, UUID, TEXT) TO service_role;

ALTER TABLE modifiers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION modifier_set_price_extra(p_id UUID, p_price_extra NUMERIC(12, 2), p_user_id UUID, p_reason TEXT)
RETURNS SETOF modifiers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.user_id', COALESCE(p_user_id::text, ''), true);
  PERFORM set_config('app.price_change_reason', COALESCE(p_reason, ''), true);
  UPDATE modifiers
  SET price_extra = p_price_extra, updated_at = now()
  WHERE id = p_id;
  RETURN QUERY SELECT * FROM modifiers WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION modifier_set_price_extra(UUID, NUMERIC, UUID, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION fn_final_item_price(UUID, UUID[]) TO anon, authenticated, service_role;
