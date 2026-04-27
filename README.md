# Yacunaj Café & Gelato — Menú digital y Yacunaj OPS (CMS)

QR ordering + panel operativo (CMS de menú, inventario en roadmap). Stack: **React + Vite + Tailwind** en la raíz del repo, **Express** en `backend/`, **Supabase** (Postgres + Auth + Storage), notificaciones **Telegram**.

## Requisitos

- Node 20+
- Cuenta [Supabase](https://supabase.com)
- (Opcional) Bot de Telegram

## Puesta en marcho rápida

```bash
npm install
cp .env.example .env
cp backend/.env.example backend/.env
```

Rellena `VITE_SUPABASE_*` y `SUPABASE_*` del proyecto. Para editar el menú desde `/app/menu/*` en local:

```env
# .env (raíz)
VITE_API_URL=http://localhost:3001
```

```bash
# Terminal 1 — API CMS + órdenes
npm run dev:backend

# Terminal 2 — SPA
npm run dev
```

Menú cliente: `http://localhost:5173/order?table=1&token=tok_t1_abc123`  
Login staff: `http://localhost:5173/login` → magic link → `/app` → **Menú CMS** en `/app/menu/items`.

## Aplicar migraciones (Supabase)

El proyecto utiliza **Supabase CLI** para gestionar la base de datos. Asegúrate de tener `SUPABASE_DB_PASSWORD` en tu `.env`.

```bash
# Ver cambios pendientes (recomendado)
npm run db:push:remote:dry

# Aplicar migraciones definitivamente al remoto
npm run db:push:remote
```

*Nota: Si experimentas errores 500 con "infinite recursion detected in policy", verifica que se haya aplicado la migración `fix_profiles_rls_recursion`.*

## Mostrador CRM (Venta en Caja)

El sistema incluye un panel para tomar pedidos directamente en el mostrador disponible en `/app/counter`.

### Configuración requerida
- **Mesa 0:** Se utiliza como mesa virtual para ventas rápidas. Asegúrate de haber aplicado la migración `crm_setup_and_source.sql`.
- **Token CRM:** La mesa 0 usa el token fijo `tok_crm_counter_yacunaj`.
- **Variables Telegram:** Configura `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en el `.env` del backend para recibir notificaciones con la etiqueta `[CRM]`.

### Seguridad
Los pedidos con origen `crm` o `staff` requieren que el usuario esté autenticado con un JWT de Supabase válido y tenga un perfil activo en la tabla `profiles`.

## Estructura del repo

```
src/                 # SPA Vite (React)
api/                 # Funciones serverless Vercel (p. ej. create-order, menu/public)
backend/             # Express (CMS menú, validación de mesa, etc.)
supabase/migrations/ # Evolución SQL idempotente
scripts/             # Utilidades (p. ej. setup-storage.mjs)
```

No hay carpeta `frontend/` separada: el front vive en `src/`.

## Scripts útiles

| Comando | Descripción |
|--------|-------------|
| `npm run dev` | Vite en :5173 |
| `npm run dev:backend` | Express en :3001 |
| `npm run build` | Build producción SPA |
| `npm run test:backend` | Tests del backend (`node:test`) |
| `npm run setup:storage` | Crea bucket `menu-images` (si no usas solo la migración) |

## Despliegue

- **Frontend:** Vercel (build `npm run build`, output `dist`). Define `VITE_API_URL` al backend público si el CMS llama fuera del mismo dominio.
- **Backend:** Railway / Render / Fly con variables de `backend/.env.example`.
- **CMS en Vercel:** las rutas mutadoras del menú están en Express; ver `docs/decisions/04-vercel-menu-cms-backend-only.md`.

## Imágenes de marca

Assets de referencia en `public/images/` (hojas, fondos, etc.).

---

Yacunaj — *Amor en Maya*
