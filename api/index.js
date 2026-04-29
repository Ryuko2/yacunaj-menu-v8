// api/index.js — Mega-router único (entrada en /api).
// Vite + Vercel: [...path] en /api no es catch-all real (solo Next); se usa
// vercel.json rewrite /api/:path* → /api para conservar URLs públicas.
// Handlers en api/_handlers/.

import createOrder from './_handlers/create-order.js'
import menuPublic from './_handlers/menu/public.js'
import ordersList from './_handlers/orders/list.js'
import ordersStatus from './_handlers/orders/status.js'
import adminMenu from './_handlers/admin-menu.js'
import adminUpload from './_handlers/admin-upload.js'
import requestHandler from './_handlers/request.js'
import validateTable from './_handlers/validate-table.js'

import inventoryList from './_handlers/inventory/list.js'
import inventoryItem from './_handlers/inventory/item.js'
import inventoryMovement from './_handlers/inventory/movement.js'
import inventoryMovements from './_handlers/inventory/movements.js'
import inventoryReorder from './_handlers/inventory/reorder.js'

import suppliersList from './_handlers/suppliers/list.js'
import suppliersItem from './_handlers/suppliers/item.js'

import reportsSales from './_handlers/reports/sales.js'
import reportsCosts from './_handlers/reports/costs.js'
import reportsItemsTop from './_handlers/reports/items_top.js'
import reportsMarginsItems from './_handlers/reports/margins_items.js'
import reportsMarginsLow from './_handlers/reports/margins_low.js'
import { dispatchMenuCms } from './_handlers/menu/cms.js'

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

function parseSegments(req) {
  const raw = req.query.path
  let segs = []
  if (Array.isArray(raw)) {
    for (const part of raw) {
      segs.push(...String(part).split('/').filter(Boolean))
    }
  } else if (raw != null && raw !== '') {
    segs = String(raw).split('/').filter(Boolean)
  }
  if (segs.length === 0 && req.url) {
    try {
      const u = new URL(req.url, 'http://localhost')
      const fromQuery = u.searchParams.get('path')
      if (fromQuery) {
        segs = fromQuery.split('/').filter(Boolean)
      } else {
        const rest = u.pathname.replace(/^\/api\/?/, '')
        segs = rest.split('/').filter(Boolean)
      }
    } catch {
      /* ignore */
    }
  }
  return segs
}

function notFound(res, route) {
  return res.status(404).json({ error: `Ruta /api/${route} no existe` })
}

export default async function handler(req, res) {
  const segs = parseSegments(req)
  const route = segs.join('/')

  try {
    if (segs.length === 1) {
      switch (segs[0]) {
        case 'create-order':
          return createOrder(req, res)
        case 'admin-menu':
          return adminMenu(req, res)
        case 'admin-upload':
          return adminUpload(req, res)
        case 'request':
          return requestHandler(req, res)
        case 'validate-table':
          return validateTable(req, res)
        case 'orders':
          return ordersList(req, res)
        case 'inventory':
          return inventoryList(req, res)
        case 'suppliers':
          return suppliersList(req, res)
      }
    }

    if (route === 'menu/public') return menuPublic(req, res)
    if (segs[0] === 'menu') return dispatchMenuCms(req, res, segs)

    if (route === 'reports/sales') return reportsSales(req, res)
    if (route === 'reports/costs') return reportsCosts(req, res)
    if (route === 'reports/items/top') return reportsItemsTop(req, res)
    if (route === 'reports/margins/items') return reportsMarginsItems(req, res)
    if (route === 'reports/margins/low') return reportsMarginsLow(req, res)

    if (route === 'inventory/movements') return inventoryMovements(req, res)
    if (route === 'inventory/reorder') return inventoryReorder(req, res)

    if (segs.length === 2 && segs[0] === 'inventory' && UUID_RE.test(segs[1])) {
      return inventoryItem(req, res, { params: { id: segs[1] } })
    }
    if (segs.length === 3 && segs[0] === 'inventory' && UUID_RE.test(segs[1]) && segs[2] === 'movement') {
      return inventoryMovement(req, res, { params: { id: segs[1] } })
    }

    if (segs.length === 2 && segs[0] === 'suppliers' && UUID_RE.test(segs[1])) {
      return suppliersItem(req, res, { params: { id: segs[1] } })
    }

    if (segs.length === 3 && segs[0] === 'orders' && UUID_RE.test(segs[1]) && segs[2] === 'status') {
      return ordersStatus(req, res, { params: { id: segs[1] } })
    }

    return notFound(res, route)
  } catch (err) {
    console.error('[api router] error:', err)
    return res.status(500).json({ error: 'Internal error', detail: err?.message })
  }
}
