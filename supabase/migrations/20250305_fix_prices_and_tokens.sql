-- YACUNAJ — Verificación y fix de precios/tokens
-- Ejecutar en Supabase SQL Editor si usas tabla menu_items

-- 1. Verificar tokens en tabla `tables`
-- SELECT table_number, qr_token, active FROM tables ORDER BY table_number;

-- 2. Si usas menu_items: agregar price_type y actualizar precios
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_type text DEFAULT 'fixed';

-- Postres: pasteles/cheesecakes/pays = $65
UPDATE menu_items SET price = 65, price_type = 'fixed'
WHERE name IN (
  'Cheesecake Zarzamora', 'Cheesecake de Tortuga',
  'Pastel de Chocolate', 'Pay de Nuez'
);

-- Sodas Italianas: todas = $60
UPDATE menu_items SET price = 60, price_type = 'fixed'
WHERE name IN (
  'Soda Italiana Frambuesa', 'Soda Italiana Fresa',
  'Soda Italiana Menta', 'Soda Italiana Mora Azul',
  'Soda Italiana Zarzamora', 'Soda Italiana Maracuyá'
);

-- 3. Verificar resultados
-- SELECT name, price, price_type FROM menu_items
-- WHERE name LIKE '%Soda%' OR name LIKE '%Cheesecake%'
--    OR name LIKE '%Pastel%' OR name LIKE '%Pay%';
