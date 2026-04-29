# Auth en POST /api/create-order (Vercel y Express)

- **source omitido o `qr`:** el endpoint es público. La mesa se valida con `table_number` + `qr_token` contra `tables` (o lista fallback en desarrollo). Es el flujo del comensal con QR.

- **source `crm` o `staff`:** obligatorio `Authorization: Bearer <JWT Supabase>`; el servidor valida el token y exige fila en `profiles` con `active = true` (paridad entre `api/create-order.js` y `backend/src/routes/orders.js`).

- **`admin`:** valor reservado en `orders.source`; no se expone desde el front de pedidos público.

- **Riesgo asumido:** quien posea un `qr_token` válido (sync en DB) puede crear órdenes sin login. Mitigación: rotar tokens en `tables`, no publicar URLs con token en capturas, y usar `source=crm|staff` solo con JWT para pedidos de personal.
