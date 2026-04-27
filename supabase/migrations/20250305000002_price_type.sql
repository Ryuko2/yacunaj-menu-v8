-- Add price_type for variable-price items (run in Supabase SQL Editor if using menu_items table)
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_type text DEFAULT 'fixed';
UPDATE menu_items SET price_type = 'variable' WHERE name IN (
  'Cheesecake Zarzamora', 'Cheesecake de Tortuga', 'Pastel de Chocolate',
  'Pay de Nuez', 'Soda Italiana Frambuesa', 'Soda Italiana Fresa',
  'Soda Italiana Menta', 'Soda Italiana Mora Azul',
  'Soda Italiana Zarzamora', 'Soda Italiana Maracuyá'
);
