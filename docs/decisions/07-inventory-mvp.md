# 07 — Inventario MVP

La deducción automática de inventario al vender (p. ej. vía `modifiers.consume_qty` ↔ `inventory_item_id`) **no está habilitada** en esta iteración. El MVP cubre solo entradas y salidas manuales (`stock_movements` / `inventory_movements`), ajustes y merma, más vistas de surtido (`v_inventory_status`). Cuando se conecte consumo por receta o por modificador, el dashboard seguirá siendo el punto de control para conciliar existencias.
