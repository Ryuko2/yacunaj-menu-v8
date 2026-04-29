# Release checklist

Pasos recomendados antes de `git push` a producción.

1. `git status` — working tree limpio o cambios solo intentional.
2. Dependencias: `npm install` en la raíz y `npm install` en `backend/`.
3. Calidad local: `npm run lint && npm run build && npm run test:backend && npm run test:cart`.
4. Base de datos: `npm run db:push:remote:dry` — revisar el diff; luego `npm run db:push:remote`.
5. Commit: `git add . && git commit -m "feat(admin): dashboards ventas/inventario/costos"`.
6. Push: `git push origin main` (o la rama de despliegue que use Vercel).
7. Post-deploy: abrir `/app/reports/sales`, `/app/reports/inventory` y `/app/reports/costs` con sesión staff; en inventario registrar un movimiento de prueba; confirmar Telegram en un pedido CRM si aplica.
