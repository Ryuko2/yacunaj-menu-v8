# Changelog — Yacunaj OPS

## Fase 1 (2026-04-27)

- **Base de datos:** migración `20260427100000_yacunaj_ops_phase1_catalog_auth.sql` con tablas `categories`, extensiones de `menu_items`, `modifier_groups` / `modifiers` / `menu_item_modifier_groups`, `price_changes_log` y triggers de auditoría, función `fn_final_item_price`, RPC `get_menu_public_catalog` (SECURITY DEFINER) alineada al menú QR, vistas `v_menu_publico` y `v_menu_admin`, perfiles staff (`profiles`, `shifts`), esqueletos de inventario/compras/gastos/pagos, seeds de categorías y modificadores típicos, RLS inicial.
- **API Vercel:** `GET /api/menu/public` en `api/menu/public.js`.
- **Backend Express:** ruta `GET /api/menu/public`.
- **Frontend:** `useMenuItems` consume primero la API pública, luego el RPC de Supabase, luego el flujo anterior (`menu_items` / estático). Rutas `/login`, `/app` con layout, `useAuth`, `RequireAuth`.

**Despliegue:** aplicar la migración en el proyecto Supabase antes de usar el catálogo RPC en producción.

## Fase 2 (2026-04-28)

- **SQL:** migración `20260428120000_phase2_menu_cms_audit_storage.sql` — triggers `EXECUTE FUNCTION`, auditoría con GUC + RPC atómicos `menu_item_set_price` y `modifier_set_price_extra`, tabla `order_items`, columnas `promo_*` y `updated_at`, bucket `menu-images` + políticas Storage, vista `v_menu_publico` y RPC público con filtros de día/hora (sin ocultar `seasonal` hasta reglas; ver `docs/decisions/03-seasonal-menu-visibility.md`).
- **Fase 1 (barrido):** en el archivo base, triggers usan `EXECUTE FUNCTION` (Postgres 11+ / Supabase 15).
- **Backend:** `backend/src/routes/menuCmsRoutes.js` — CMS completo (categorías, ítems, precio con motivo, clone, reorder, modificadores, links, imagen WebP con sharp), `middleware/auth.js` (Bearer + `profiles`), `schemas/menu.js` (zod).
- **Frontend:** React Query + Sonner; rutas `/app/menu/*` (categorías con DnD, productos, editor con pestañas, modificadores, vista previa vía RPC).
- **Tests:** `backend/tests/menu.test.cjs` (`node:test`).
- **Docs:** ADR 02–04; script opcional `scripts/setup-storage.mjs`.

### Pasos manuales (dueño)

1. Aplicar migraciones: `supabase db push` o SQL Editor (Fase 1 actualizada + Fase 2).
2. Bucket `menu-images`: creado por migración; si choca con políticas previas, revisar Storage en el dashboard.
3. Rol owner: la columna en `profiles` es **`role`**:

```sql
update profiles set role = 'owner' where id = (select id from auth.users where email = 'tu@correo.com');
```

4. Auth → Redirect URLs: `http://localhost:5173/app` y producción `…/app`.
5. CMS local: `npm run dev:backend` y en `.env` del frontend `VITE_API_URL=http://localhost:3001`.

### Checklist de prueba manual

- [ ] `/order?table=1&token=…` — menú QR (regresión).
- [ ] Login → `/app/menu/items` con backend y JWT.
- [ ] Cambio de precio con motivo ≥ 5 → historial en pestaña Precio.
- [ ] Agotado → ítem fuera del RPC público.
- [ ] `DELETE …/items/:id?hard=1` con filas en `order_items` → 409.
