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

Menú cliente (sin QR): **`/menu`** o **`/`** — mismo catálogo; para confirmar pedido hace falta URL con `?table=&token=` (QR).
Login staff: `http://localhost:5173/login` → contraseña OPS → `/app` → **Menú CMS** en `/app/menu/items`.

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

Panel para tomar pedidos en mostrador disponible en `/app/counter` (requiere login staff).

### Variables de entorno requeridas

**`backend/.env` (Express):**

- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (chat principal de pedidos)
- Opcional: `TELEGRAM_ORDERS_CHAT_ID`, `TELEGRAM_ALERTS_CHAT_ID`

**`.env` (raíz, Vite + Vercel):**

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL=http://localhost:3001` solo en dev (en prod, rutas relativas a `/api`).

En **Vercel**, los handlers de `api/` también necesitan `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` más las variables `TELEGRAM_*`.

### Aplicar migración (mesa 0 + columna `source`)

```bash
npm run db:push:remote:dry   # vista previa
npm run db:push:remote       # aplica
```

Esto crea/actualiza:

- Mesa virtual `0` con token `tok_crm_counter_yacunaj` (etiqueta «Mostrador (CRM)»).
- Columna `orders.source` con `CHECK ('qr','crm','staff','admin')` y default `'qr'`.
- Índice parcial `orders_source_idx` para reportes por origen (ver migración `20260428180000`).

### Flujo de desarrollo

```bash
# Terminal 1 — Express (CMS + create-order local)
npm run dev:backend          # :3001

# Terminal 2 — SPA Vite
npm run dev                  # :5173
```

Login staff en `http://localhost:5173/login` y luego `/app/counter`.

### Seguridad de `POST /api/create-order`

| `body.source` | Auth |
|---------------|------|
| `qr` (default) | Solo `qr_token` válido contra `tables`. Público. |
| `crm` / `staff` | `Authorization: Bearer <jwt Supabase>` + perfil activo en `profiles`. |
| `admin` | Reservado (no expuesto desde el frontend de pedidos). |

Decisión detallada: [`docs/decisions/06-api-create-order-auth.md`](docs/decisions/06-api-create-order-auth.md).

### Yacunaj OPS — Login

Un solo campo de **contraseña** en `/login`. El correo del usuario staff no se muestra: debe coincidir con **`VITE_OPS_AUTH_EMAIL`** (Vercel + `.env`). No hay registro público ni flujo de reset en la app.

**Primera vez / cambiar clave (local, con service role en `.env`):**

```bash
# En .env: VITE_OPS_AUTH_EMAIL, OPS_STAFF_PASSWORD (≥8 caracteres), SUPABASE_SERVICE_KEY
npm run ops:ensure-staff
```

Esto crea el usuario en Auth si absent, fija la contraseña y deja `profiles.role = owner`. En producción, define también **`VITE_OPS_AUTH_EMAIL`** en el proyecto Vercel y vuelve a desplegar el front.

### Tests

```bash
npm run test:backend
```

Incluye `tests/createOrder.unit.test.cjs` (mocks de Supabase y Telegram, sin red).
Los de `tests/orders.test.cjs` solo corren con servidor local: `RUN_INTEGRATION=1 npm --prefix backend test`.

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
| `npm run test:cart` | Tests de fusión de carrito (`cartMerge`) |
| `npm run setup:storage` | Crea bucket `menu-images` (si no usas solo la migración) |

## Deploy → Vercel

El SPA se publica con `npm run build` (salida `dist`). En **Vercel → Settings → Environment Variables** (Production y Preview), define exactamente:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` — vacío en producción (mismo origen; rutas `/api/*` van a los handlers en `api/`)
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — **service_role** para `api/*` (órdenes, perfiles, reportes, inventario)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `TELEGRAM_ORDERS_CHAT_ID` (opcional)
- `APP_TIMEZONE=America/Mexico_City` (informativo; las vistas SQL usan la zona en el propio SQL)

Si una clave **service_role** se compartió por error, rota la clave en Supabase y actualiza el valor en Vercel.

El frontend en producción **no llama al Express** para los endpoints críticos ya cubiertos en `api/` (`/api/create-order`, `/api/orders`, `/api/reports/*`, `/api/inventory/*`, etc.). El backend Express sigue siendo útil para desarrollo local y para el CMS de menú con auditoría cuando apuntas `VITE_API_URL` a `http://localhost:3001`.

**Backend (Railway / Render / Fly):** variables según `backend/.env.example`. Para reportes e inventario vía Express en local, `SUPABASE_SERVICE_KEY` debe permitir leer las vistas agregadas sin depender del JWT del cliente.

## Despliegue (resumen)

- **Frontend:** Vercel (build `npm run build`, output `dist`). Usa la sección anterior para env vars.
- **Backend:** Railway / Render / Fly con variables de `backend/.env.example`.
- **CMS en Vercel:** las rutas mutadoras del menú pueden seguir apuntando a Express en dev; ver `docs/decisions/04-vercel-menu-cms-backend-only.md`.

## Imágenes de marca

Assets de referencia en `public/images/` (hojas, fondos, etc.).

---

Yacunaj — *Amor en Maya*
