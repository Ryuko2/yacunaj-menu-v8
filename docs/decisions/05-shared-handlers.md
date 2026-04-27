# ADR 05 — Handlers compartidos entre Vercel `/api` y Express `/backend`

**Fecha:** 2026-04-27
**Estado:** aceptada

## Contexto

El repo tiene dos runtimes que sirven HTTP:

- `/api/*.js` — funciones serverless de Vercel (ESM, `import`).
- `/backend/src/routes/*.js` — Express clasico (CJS, `require`).

Antes de este ADR, ambos lados duplicaban la misma logica para `GET /menu/public`
(llamada a la RPC `get_menu_public_catalog` y normalizacion del payload).
Mantener dos copias significaba que cualquier cambio (filtro nuevo,
manejo de error) habia que aplicarlo dos veces, con riesgo de divergencia.

## Decision

Extraer la logica HTTP-agnostica a `/shared/handlers/*.js`:

- Cada handler es una **funcion pura** que recibe el cliente Supabase ya
  inyectado y devuelve `{ ok, status, body }`.
- No toca `req`, no toca `res`. El runtime (Vercel o Express) traduce el
  resultado a la respuesta HTTP.
- `/shared/` tiene su propio `package.json` con `"type": "commonjs"` para
  que el require nativo de Express funcione sin tooling extra.
- Vercel (ESM) consume el shared via `createRequire(import.meta.url)`.

## Alcance inicial

- `shared/handlers/menuPublic.js` — usado por:
  - `api/menu/public.js` (Vercel)
  - `backend/src/routes/menu.js` (Express, `GET /menu/public`)

## Que NO va al shared

- `backend/src/routes/menuCmsRoutes.js` — el CMS de Phase 2 (categorias,
  modificadores, upload de imagenes con `sharp`, validaciones zod) vive
  solo en backend porque depende de middlewares Express y no se sirve
  desde Vercel (ver ADR 04).
- `api/admin-menu.js` — endpoint legacy con PIN hardcoded marcado como
  `@deprecated`. Se remueve cuando el frontend migre completamente al
  CMS nuevo de Phase 2.

## Como anadir un handler nuevo

1. Crear `shared/handlers/<nombre>.js` exportando una funcion pura.
2. Test (futuro): `shared/handlers/<nombre>.test.js` con mock de supabase.
3. Wrappers thin en `/api/...` y `/backend/src/routes/...`.

## Referencias

- ADR 01 — menu-api: Vercel vs Express (define que ambos coexisten).
- ADR 04 — vercel-menu-cms-backend-only (define que el CMS solo va en backend).
