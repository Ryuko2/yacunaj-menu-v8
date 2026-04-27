# ADR 04 — CMS de menú en Vercel vs Express

## Contexto

Los endpoints de escritura del CMS viven en Express (`backend/src/routes/menuCmsRoutes.js`) con autenticación Bearer y rol en `profiles`.

## Decisión (Fase 2)

- **No** se duplicó el CMS en `api/` de Vercel en esta iteración (evitar dos mantenimientos y límites de bundle).
- El frontend usa `VITE_API_URL` apuntando al backend (local: `http://localhost:3001`).

## Alternativas

- Añadir `api/menu/[[...slug]].js` que importe lógica compartida o proxee al backend desplegado.
- Desplegar solo Express (Railway/Render) y dejar Vercel solo para el SPA con `VITE_API_URL` público.
