-- Yacunaj OPS — Fase 1: catálogo CMS, modificadores, auditoría de precios, perfiles, RLS base.
-- Idempotente: usa IF NOT EXISTS / ON CONFLICT donde aplica.
-- Identificadores en inglés; textos de seed en español para UI.

-- ---------------------------------------------------------------------------
-- 1. Categorías (CMS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  icono TEXT,
  color_hex TEXT,
  activa BOOLEAN NOT NULL DEFAULT true,
  parent_id UUID REFERENCES categories (id) ON DELETE SET NULL,
  horario_visible JSONB,
  has_sizes BOOLEAN NOT NULL DEFAULT false,
  sizes_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_sort ON categories (parent_id, sort_order);

-- ---------------------------------------------------------------------------
-- 2. menu_items — columnas OPS (compatibles con columnas existentes name, price, category, …)
-- ---------------------------------------------------------------------------
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories (id) ON DELETE SET NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description_short TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description_long TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS promotional_price NUMERIC(12, 2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(12, 2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS out_of_stock BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS calories INTEGER;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens TEXT[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS prep_time_min INTEGER;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available_from TIME;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available_until TIME;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available_days INTEGER[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS max_per_order INTEGER;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS images_extra TEXT[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ingredients TEXT[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS max_free_ingredients INTEGER;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS extra_ingredient_price NUMERIC(12, 2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS seasonal BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS can_be_hot BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_menu_items_category_sort ON menu_items (category_id, sort_order);

-- ---------------------------------------------------------------------------
-- 3. Grupos y opciones de modificadores
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  selection_type TEXT NOT NULL DEFAULT 'single' CHECK (selection_type IN ('single', 'multi')),
  required BOOLEAN NOT NULL DEFAULT false,
  min_selections INTEGER NOT NULL DEFAULT 0,
  max_selections INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modifier_group_id UUID NOT NULL REFERENCES modifier_groups (id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  price_extra NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost_extra NUMERIC(12, 2) NOT NULL DEFAULT 0,
  default_selected BOOLEAN NOT NULL DEFAULT false,
  out_of_stock BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  inventory_item_id UUID,
  consume_qty NUMERIC(14, 4),
  consume_unit TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modifiers_group_sort ON modifiers (modifier_group_id, sort_order);

CREATE TABLE IF NOT EXISTS menu_item_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items (id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES modifier_groups (id) ON DELETE CASCADE,
  required_override BOOLEAN,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (menu_item_id, modifier_group_id)
);

-- ---------------------------------------------------------------------------
-- 4. Auditoría de precios
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS price_changes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items (id) ON DELETE SET NULL,
  modifier_id UUID REFERENCES modifiers (id) ON DELETE SET NULL,
  old_price NUMERIC(12, 2) NOT NULL,
  new_price NUMERIC(12, 2) NOT NULL,
  reason TEXT,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT price_changes_one_target CHECK (
    (menu_item_id IS NOT NULL AND modifier_id IS NULL)
    OR (menu_item_id IS NULL AND modifier_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_price_changes_menu_item ON price_changes_log (menu_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_changes_modifier ON price_changes_log (modifier_id, created_at DESC);

CREATE OR REPLACE FUNCTION fn_audit_menu_item_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.price IS DISTINCT FROM OLD.price THEN
    INSERT INTO price_changes_log (menu_item_id, modifier_id, old_price, new_price, reason, user_id)
    VALUES (OLD.id, NULL, OLD.price, NEW.price, NULL, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_audit_menu_item_price ON menu_items;
CREATE TRIGGER tg_audit_menu_item_price
  AFTER UPDATE OF price ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_menu_item_price();

CREATE OR REPLACE FUNCTION fn_audit_modifier_price_extra()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.price_extra IS DISTINCT FROM OLD.price_extra THEN
    INSERT INTO price_changes_log (menu_item_id, modifier_id, old_price, new_price, reason, user_id)
    VALUES (NULL, OLD.id, OLD.price_extra, NEW.price_extra, NULL, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_audit_modifier_price_extra ON modifiers;
CREATE TRIGGER tg_audit_modifier_price_extra
  AFTER UPDATE OF price_extra ON modifiers
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_modifier_price_extra();

-- ---------------------------------------------------------------------------
-- 5. Precio final (base + modificadores; promocional si aplica en Fase 2+)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_final_item_price(p_menu_item_id UUID, p_modifier_ids UUID[])
RETURNS NUMERIC(12, 2)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT mi.price FROM menu_items mi WHERE mi.id = p_menu_item_id),
    0::numeric
  ) + COALESCE(
    (
      SELECT SUM(m.price_extra)::numeric(12, 2)
      FROM modifiers m
      WHERE m.id = ANY (p_modifier_ids)
        AND m.active = true
        AND m.out_of_stock = false
    ),
    0::numeric
  );
$$;

-- ---------------------------------------------------------------------------
-- 6. Perfiles staff (Supabase Auth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('owner', 'manager', 'barista', 'cashier')),
  full_name TEXT,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'cashier',
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  sales_total NUMERIC(12, 2) DEFAULT 0,
  tips_total NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shifts_profile ON shifts (profile_id, started_at DESC);

-- ---------------------------------------------------------------------------
-- 7. Esqueletos fases posteriores (tablas vacías, sin triggers de consumo aún)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  nombre TEXT NOT NULL,
  base_unit TEXT NOT NULL,
  category TEXT,
  stock_actual NUMERIC(14, 4) NOT NULL DEFAULT 0,
  stock_min NUMERIC(14, 4) NOT NULL DEFAULT 0,
  stock_max NUMERIC(14, 4),
  avg_unit_cost NUMERIC(12, 4) NOT NULL DEFAULT 0,
  perishable BOOLEAN NOT NULL DEFAULT false,
  shelf_life_days INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE modifiers
  DROP CONSTRAINT IF EXISTS modifiers_inventory_item_id_fkey;
ALTER TABLE modifiers
  ADD CONSTRAINT modifiers_inventory_item_id_fkey
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  leadtime_days INTEGER DEFAULT 3,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers (id) ON DELETE SET NULL,
  order_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  expected_receive_date DATE,
  actual_receive_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'received', 'cancelled')),
  total_amount NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders (id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items (id) ON DELETE RESTRICT,
  qty_ordered NUMERIC(14, 4) NOT NULL,
  unit_cost NUMERIC(12, 4) NOT NULL,
  qty_received NUMERIC(14, 4) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items (id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase_in', 'sale_out', 'waste', 'adjustment', 'transfer')),
  qty_signed NUMERIC(14, 4) NOT NULL,
  unit_cost NUMERIC(12, 4),
  reference_order_id UUID,
  reference_po_id UUID,
  waste_reason TEXT,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_mov_item_created ON inventory_movements (inventory_item_id, created_at DESC);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items (id) ON DELETE CASCADE,
  yield_portions INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items (id) ON DELETE RESTRICT,
  qty NUMERIC(14, 4) NOT NULL,
  unit TEXT NOT NULL,
  waste_pct NUMERIC(6, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('fixed', 'variable')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_category_id UUID NOT NULL REFERENCES expense_categories (id) ON DELETE RESTRICT,
  expense_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT,
  recurring BOOLEAN NOT NULL DEFAULT false,
  cadence TEXT CHECK (cadence IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'once')),
  receipt_url TEXT,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (expense_date);

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  fee_pct NUMERIC(6, 4) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sales_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES payment_methods (id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 8. Vista pública plana (depuración / BI); consumo QR vía RPC abajo
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
  mi.out_of_stock
FROM menu_items mi
JOIN categories c
  ON c.id = COALESCE(mi.category_id, (SELECT id FROM categories c2 WHERE c2.slug = mi.category LIMIT 1))
WHERE c.activa = true
  AND mi.active = true
  AND mi.out_of_stock = false;

CREATE OR REPLACE VIEW v_menu_admin AS
SELECT
  mi.*,
  c.slug AS category_slug_resolved,
  c.nombre AS category_nombre_resolved
FROM menu_items mi
LEFT JOIN categories c ON c.id = mi.category_id;

-- ---------------------------------------------------------------------------
-- 9. RPC: árbol menú QR / POS (SECURITY DEFINER; el cliente llama con anon key)
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
  js_dow INTEGER;
  result jsonb;
BEGIN
  local_ts := (p_at AT TIME ZONE tz);
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
-- 10. Seeds categorías (slug alineado al menú estático / CATEGORY_META)
-- ---------------------------------------------------------------------------
INSERT INTO categories (nombre, slug, sort_order, icono, activa, has_sizes, sizes_json, parent_id)
VALUES
  ('Comida', 'food', 10, '🍕', true, false, NULL, NULL),
  ('Snacks', 'snacks', 20, '🍟', true, false, NULL, NULL),
  ('Postres', 'postres', 30, '🍰', true, false, NULL, NULL),
  ('Cafés', 'cafes', 40, '☕', true, false, NULL, NULL),
  ('Capuccinos', 'cappuccinos', 50, '☕', true, false, NULL, NULL),
  ('Lattes', 'lattes', 60, '🥛', true, true, '[{"id":"chico","label":"Chico","price":58},{"id":"grande","label":"Grande","price":68}]'::jsonb, NULL),
  ('Smoothies', 'smoothies', 70, '🥤', true, false, NULL, NULL),
  ('Sodas Italianas', 'sodas', 80, '🍓', true, false, NULL, NULL),
  ('Tisanas', 'tisanas', 90, '🫖', true, false, NULL, NULL),
  ('Frappé', 'frappe', 100, '🥤', true, false, NULL, NULL),
  ('Otras Bebidas', 'otras-bebidas', 110, '🥤', true, false, NULL, NULL)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  sort_order = EXCLUDED.sort_order,
  has_sizes = EXCLUDED.has_sizes,
  sizes_json = EXCLUDED.sizes_json,
  activa = true;

UPDATE menu_items mi
SET category_id = c.id
FROM categories c
WHERE mi.category_id IS NULL
  AND mi.category = c.slug;

-- ---------------------------------------------------------------------------
-- 11. Seeds modificadores típicos (idempotente por slug de grupo / nombre+grupo)
-- ---------------------------------------------------------------------------
INSERT INTO modifier_groups (slug, nombre, descripcion, selection_type, required, min_selections, max_selections, sort_order, active)
VALUES
  ('size', 'Tamaño', 'Tamaño de bebida', 'single', true, 1, NULL, 10, true),
  ('milk', 'Tipo de leche', 'Leche o bebida vegetal', 'single', true, 1, NULL, 20, true),
  ('temp', 'Temperatura', 'Servicio', 'single', false, 0, NULL, 30, true),
  ('sweetener', 'Endulzante', 'Endulzantes', 'multi', false, 0, 1, 40, true),
  ('extras', 'Extras', 'Extras opcionales', 'multi', false, 0, 4, 50, true),
  ('gelato_flavor', 'Sabor de gelato', 'Sabor', 'single', true, 1, NULL, 60, true),
  ('gelato_scoops', 'Bolas', 'Cantidad de bolas', 'single', true, 1, NULL, 70, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modifiers (modifier_group_id, nombre, price_extra, default_selected, sort_order, active)
SELECT g.id, v.nombre, v.px, v.def_sel, v.ord, true
FROM modifier_groups g
JOIN (
  VALUES
    ('size', 'Chico 8oz', 0::numeric, true, 1),
    ('size', 'Mediano 12oz', 15::numeric, false, 2),
    ('size', 'Grande 16oz', 25::numeric, false, 3),
    ('milk', 'Entera', 0::numeric, true, 1),
    ('milk', 'Deslactosada', 8::numeric, false, 2),
    ('milk', 'Almendra', 18::numeric, false, 3),
    ('milk', 'Avena', 18::numeric, false, 4),
    ('milk', 'Coco', 18::numeric, false, 5),
    ('milk', 'Soya', 15::numeric, false, 6),
    ('temp', 'Caliente', 0::numeric, true, 1),
    ('temp', 'Frío', 0::numeric, false, 2),
    ('temp', 'Tibio', 0::numeric, false, 3),
    ('sweetener', 'Azúcar', 0::numeric, false, 1),
    ('sweetener', 'Sustituto', 0::numeric, false, 2),
    ('sweetener', 'Sin azúcar', 0::numeric, true, 3),
    ('sweetener', 'Miel', 5::numeric, false, 4),
    ('sweetener', 'Stevia', 0::numeric, false, 5),
    ('extras', 'Shot extra', 15::numeric, false, 1),
    ('extras', 'Crema batida', 10::numeric, false, 2),
    ('extras', 'Sirope vainilla', 8::numeric, false, 3),
    ('extras', 'Sirope caramelo', 8::numeric, false, 4),
    ('extras', 'Canela', 0::numeric, false, 5),
    ('extras', 'Cocoa', 0::numeric, false, 6),
    ('gelato_flavor', 'Pistache', 0::numeric, false, 1),
    ('gelato_flavor', 'Fresa', 0::numeric, false, 2),
    ('gelato_flavor', 'Vainilla', 0::numeric, true, 3),
    ('gelato_flavor', 'Chocolate', 0::numeric, false, 4),
    ('gelato_flavor', 'Limón', 0::numeric, false, 5),
    ('gelato_flavor', 'Mango', 0::numeric, false, 6),
    ('gelato_flavor', 'Coco', 0::numeric, false, 7),
    ('gelato_flavor', 'Avellana', 0::numeric, false, 8),
    ('gelato_scoops', '1 bola', 0::numeric, true, 1),
    ('gelato_scoops', '2 bolas', 25::numeric, false, 2),
    ('gelato_scoops', '3 bolas', 45::numeric, false, 3)
) AS v(group_slug, nombre, px, def_sel, ord)
  ON g.slug = v.group_slug
WHERE NOT EXISTS (
  SELECT 1 FROM modifiers m
  WHERE m.modifier_group_id = g.id AND m.nombre = v.nombre
);

-- ---------------------------------------------------------------------------
-- 12. Seeds expense_categories
-- ---------------------------------------------------------------------------
INSERT INTO expense_categories (nombre, cost_type, notes)
SELECT v.nombre, v.cost_type, v.notes
FROM (
  VALUES
    ('Renta', 'fixed'::text, NULL::text),
    ('Luz', 'fixed', NULL),
    ('Agua', 'fixed', NULL),
    ('Gas', 'fixed', NULL),
    ('Internet', 'fixed', NULL),
    ('Nómina', 'fixed', NULL),
    ('Mantenimiento', 'fixed', NULL),
    ('Insumos indirectos', 'variable', NULL),
    ('Marketing', 'variable', NULL),
    ('Comisiones bancarias', 'variable', NULL),
    ('Impuestos', 'variable', NULL)
) AS v(nombre, cost_type, notes)
WHERE NOT EXISTS (SELECT 1 FROM expense_categories ec WHERE ec.nombre = v.nombre);

-- ---------------------------------------------------------------------------
-- 13. Índice orders(created_at) para analíticas
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- ---------------------------------------------------------------------------
-- 14. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_changes_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_public_read ON categories;
CREATE POLICY categories_public_read ON categories FOR SELECT USING (activa = true);

DROP POLICY IF EXISTS categories_staff_all ON categories;
CREATE POLICY categories_staff_all ON categories FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager')
  )
);

DROP POLICY IF EXISTS "Public read active menu items" ON menu_items;
CREATE POLICY "Public read active menu items" ON menu_items FOR SELECT
USING (active = true AND COALESCE(out_of_stock, false) = false);

DROP POLICY IF EXISTS menu_items_staff_write ON menu_items;
CREATE POLICY menu_items_staff_write ON menu_items FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager')
  )
);

DROP POLICY IF EXISTS modifier_groups_staff ON modifier_groups;
CREATE POLICY modifier_groups_staff ON modifier_groups FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager', 'barista', 'cashier')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager')
  )
);

DROP POLICY IF EXISTS modifiers_staff ON modifiers;
CREATE POLICY modifiers_staff ON modifiers FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager', 'barista', 'cashier')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager')
  )
);

DROP POLICY IF EXISTS menu_item_modifier_groups_staff ON menu_item_modifier_groups;
CREATE POLICY menu_item_modifier_groups_staff ON menu_item_modifier_groups FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager')
  )
);

DROP POLICY IF EXISTS price_changes_owner_manager ON price_changes_log;
CREATE POLICY price_changes_owner_manager ON price_changes_log FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager')
  )
);

DROP POLICY IF EXISTS profiles_self_read ON profiles;
CREATE POLICY profiles_self_read ON profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner', 'manager')
));

DROP POLICY IF EXISTS profiles_self_update ON profiles;
CREATE POLICY profiles_self_update ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS shifts_staff ON shifts;
CREATE POLICY shifts_staff ON shifts FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager', 'barista', 'cashier')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager')
  )
);

DROP POLICY IF EXISTS inventory_items_mgr ON inventory_items;
DROP POLICY IF EXISTS inventory_read_ops ON inventory_items;
DROP POLICY IF EXISTS inventory_items_select_ops ON inventory_items;
DROP POLICY IF EXISTS inventory_items_write_mgr ON inventory_items;
DROP POLICY IF EXISTS inventory_items_update_mgr ON inventory_items;
DROP POLICY IF EXISTS inventory_items_delete_mgr ON inventory_items;

CREATE POLICY inventory_items_select_ops ON inventory_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager', 'barista', 'cashier')
  )
);

CREATE POLICY inventory_items_write_mgr ON inventory_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

CREATE POLICY inventory_items_update_mgr ON inventory_items FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

CREATE POLICY inventory_items_delete_mgr ON inventory_items FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

-- suppliers, purchase_orders, lines, movements, recipes, recipe_lines, expenses, expense_categories, payment_methods, sales_payments
DROP POLICY IF EXISTS suppliers_all_mgr ON suppliers;
CREATE POLICY suppliers_all_mgr ON suppliers FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

DROP POLICY IF EXISTS po_all_mgr ON purchase_orders;
CREATE POLICY po_all_mgr ON purchase_orders FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

DROP POLICY IF EXISTS pol_all_mgr ON purchase_order_lines;
CREATE POLICY pol_all_mgr ON purchase_order_lines FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

DROP POLICY IF EXISTS inv_mov_all_mgr ON inventory_movements;
CREATE POLICY inv_mov_all_mgr ON inventory_movements FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager','barista','cashier')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager','barista','cashier')));

DROP POLICY IF EXISTS recipes_all_mgr ON recipes;
CREATE POLICY recipes_all_mgr ON recipes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

DROP POLICY IF EXISTS recipe_lines_all_mgr ON recipe_lines;
CREATE POLICY recipe_lines_all_mgr ON recipe_lines FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

DROP POLICY IF EXISTS expense_cat_read ON expense_categories;
CREATE POLICY expense_cat_read ON expense_categories FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

DROP POLICY IF EXISTS expenses_all_mgr ON expenses;
CREATE POLICY expenses_all_mgr ON expenses FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

DROP POLICY IF EXISTS payment_methods_read ON payment_methods;
DROP POLICY IF EXISTS payment_methods_write ON payment_methods;
DROP POLICY IF EXISTS payment_methods_select_ops ON payment_methods;
DROP POLICY IF EXISTS payment_methods_write_mgr ON payment_methods;

CREATE POLICY payment_methods_select_ops ON payment_methods FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager','barista','cashier')));

CREATE POLICY payment_methods_insert_mgr ON payment_methods FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

CREATE POLICY payment_methods_update_mgr ON payment_methods FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

CREATE POLICY payment_methods_delete_mgr ON payment_methods FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

DROP POLICY IF EXISTS sales_payments_read ON sales_payments;
CREATE POLICY sales_payments_read ON sales_payments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager')));

DROP POLICY IF EXISTS sales_payments_write ON sales_payments;
CREATE POLICY sales_payments_write ON sales_payments FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.active AND p.role IN ('owner','manager','barista','cashier')));
