# ADR 01 — API de menú: Vercel serverless + Express opcional

## Contexto

El repo despliega el frontend en Vercel con funciones en `api/` (`create-order`, etc.). También existe un servidor Express en `backend/` usado en desarrollo o despliegues alternos.

## Decisión

- La ruta canónica documentada para el menú público es **`GET /api/menu/public`** (Vercel).
- Se añade la misma ruta en **Express** (`backend/src/routes/menu.js`) para quien ejecute el backend local sin Vercel.
- El hook del cliente intenta **fetch a `/api/menu/public`** y, si falla (p. ej. `npm run dev` sin proxy), usa **`supabase.rpc('get_menu_public_catalog')`** con la anon key, sin exponer la service role en el navegador.

## Consecuencias

- En local con solo Vite, el menú sigue funcionando vía RPC si la migración está aplicada.
- En producción en Vercel, conviene usar la función serverless para cache/headers en fases posteriores.
