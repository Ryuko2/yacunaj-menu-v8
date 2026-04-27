const { z } = require('zod')

const uuid = z.string().uuid()

const categoryCreate = z.object({
  nombre: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  descripcion: z.string().max(2000).optional().nullable(),
  sort_order: z.number().int().optional(),
  icono: z.string().max(50).optional().nullable(),
  color_hex: z.string().max(16).optional().nullable(),
  activa: z.boolean().optional(),
  parent_id: uuid.optional().nullable(),
  has_sizes: z.boolean().optional(),
  sizes_json: z.any().optional().nullable(),
})

const categoryPatch = categoryCreate.partial()

const categoryReorder = z.array(
  z.object({
    id: uuid,
    sort_order: z.number().int(),
    parent_id: uuid.nullable().optional(),
  })
).min(1)

const menuItemCreate = z.object({
  name: z.string().min(1).max(300),
  slug: z.string().min(1).max(160).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  description_short: z.string().max(500).optional().nullable(),
  description_long: z.string().max(8000).optional().nullable(),
  price: z.number().nonnegative().nullable().optional(),
  price_type: z.enum(['fixed', 'variable']).optional(),
  category_id: uuid.optional().nullable(),
  category: z.string().max(120).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  images_extra: z.array(z.string()).optional().nullable(),
  active: z.boolean().optional(),
  out_of_stock: z.boolean().optional(),
  featured: z.boolean().optional(),
  seasonal: z.boolean().optional(),
  can_be_hot: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  sku: z.string().max(120).optional().nullable(),
  barcode: z.string().max(120).optional().nullable(),
  calories: z.number().int().nonnegative().optional().nullable(),
  allergens: z.array(z.string()).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  prep_time_min: z.number().int().nonnegative().optional().nullable(),
  available_from: z.string().optional().nullable(),
  available_until: z.string().optional().nullable(),
  available_days: z.array(z.number().int().min(0).max(6)).optional().nullable(),
  max_per_order: z.number().int().positive().optional().nullable(),
  ingredients: z.array(z.string()).optional().nullable(),
  max_free_ingredients: z.number().int().nonnegative().optional().nullable(),
  extra_ingredient_price: z.number().nonnegative().optional().nullable(),
  promotional_price: z.number().nonnegative().optional().nullable(),
  promo_starts_at: z.string().optional().nullable(),
  promo_ends_at: z.string().optional().nullable(),
  estimated_cost: z.number().nonnegative().optional().nullable(),
  modifier_group_ids: z.array(uuid).optional(),
})

const menuItemPatch = menuItemCreate.partial()

const priceBody = z.object({
  price: z.number().nonnegative(),
  reason: z.string().min(5).max(2000),
})

const toggleAvail = z.object({
  out_of_stock: z.boolean(),
})

const itemReorder = z.array(z.object({ id: uuid, sort_order: z.number().int() })).min(1)

const modifierGroupCreate = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9_-]+$/),
  nombre: z.string().min(1).max(200),
  descripcion: z.string().max(2000).optional().nullable(),
  selection_type: z.enum(['single', 'multi']),
  required: z.boolean().optional(),
  min_selections: z.number().int().nonnegative().optional(),
  max_selections: z.number().int().positive().optional().nullable(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
})

const modifierGroupPatch = modifierGroupCreate.partial()

const modifierCreate = z.object({
  modifier_group_id: uuid,
  nombre: z.string().min(1).max(200),
  price_extra: z.number().nonnegative().optional(),
  cost_extra: z.number().nonnegative().optional(),
  default_selected: z.boolean().optional(),
  out_of_stock: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
  inventory_item_id: uuid.optional().nullable(),
  consume_qty: z.number().nonnegative().optional().nullable(),
  consume_unit: z.string().max(32).optional().nullable(),
})

const modifierPatch = modifierCreate.partial().extend({ modifier_group_id: uuid.optional() })

const attachGroupBody = z.object({
  modifier_group_id: uuid,
  required_override: z.boolean().optional().nullable(),
  sort_order: z.number().int().optional(),
})

const modifierGroupReorder = z.array(
  z.object({ modifier_group_id: uuid, sort_order: z.number().int() })
).min(1)

const deleteImageBody = z.object({ url: z.string().url() })

module.exports = {
  categoryCreate,
  categoryPatch,
  categoryReorder,
  menuItemCreate,
  menuItemPatch,
  priceBody,
  toggleAvail,
  itemReorder,
  modifierGroupCreate,
  modifierGroupPatch,
  modifierCreate,
  modifierPatch,
  attachGroupBody,
  modifierGroupReorder,
  deleteImageBody,
}
