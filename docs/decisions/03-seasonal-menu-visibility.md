# ADR 03 — Visibilidad `seasonal` en menú público

## Contexto

Se consideró filtrar `menu_items.seasonal = true` del catálogo público hasta definir ventanas de temporada.

## Decisión

- **No** se oculta por `seasonal` en `v_menu_publico` ni en `get_menu_public_catalog`, porque varios postres del menú actual llevan `seasonal: true` en datos estáticos/DB y desaparecerían del QR sin reglas de fechas (`promo_starts_at` / `promo_ends_at` aún no enlazadas al filtro).

## Próximo paso

Cuando exista criterio de negocio (meses, fechas o flags), añadir filtro en la RPC y la vista y documentar migración.
