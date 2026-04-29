const express = require('express')
const { z } = require('zod')
const { requireSupabaseUser, requireStaffProfile } = require('../middleware/auth')
const inv = require('../inventory/inventoryService.cjs')

/** @param {{ supabase: import('@supabase/supabase-js').SupabaseClient }} deps */
module.exports = function buildInventoryRouter({ supabase }) {
  const router = express.Router()
  const auth = [requireSupabaseUser, requireStaffProfile]

  router.get('/inventory/reorder', ...auth, async (_req, res) => {
    try {
      const body = await inv.listReorder(supabase)
      return res.json(body)
    } catch (e) {
      console.error('[inventory/reorder]', e)
      return res.status(500).json({ error: e.message })
    }
  })

  router.get('/inventory/movements', ...auth, async (req, res) => {
    try {
      const body = await inv.listMovements(supabase, req.query || {})
      return res.json(body)
    } catch (e) {
      console.error('[inventory/movements]', e)
      return res.status(500).json({ error: e.message })
    }
  })

  router.get('/inventory', ...auth, async (req, res) => {
    try {
      const body = await inv.listInventory(supabase, req.query || {})
      return res.json(body)
    } catch (e) {
      console.error('[inventory]', e)
      return res.status(500).json({ error: e.message })
    }
  })

  router.post('/inventory', ...auth, async (req, res) => {
    try {
      const data = await inv.createInventoryItem(supabase, req.body || {})
      return res.status(201).json(data)
    } catch (e) {
      const st = e.status || (e.message === 'Nombre requerido'
        ? 400
        : 500)
      console.error('[inventory POST]', e)
      return res.status(st).json({ error: e.message })
    }
  })

  router.put('/inventory/:id', ...auth, async (req, res) => {
    try {
      const id = z.string().uuid().parse(req.params.id)
      const data = await inv.updateInventoryItem(supabase, id, req.body || {})
      return res.json(data)
    } catch (e) {
      console.error('[inventory PUT]', e)
      return res.status(500).json({ error: e.message })
    }
  })

  router.post('/inventory/:id/movement', ...auth, async (req, res) => {
    try {
      const id = z.string().uuid().parse(req.params.id)
      const movement = await inv.createMovement(supabase, id, req.body || {}, req.user?.id)
      return res.status(201).json(movement)
    } catch (e) {
      console.error('[inventory movement]', e)
      return res.status(400).json({ error: e.message })
    }
  })

  router.get('/suppliers', ...auth, async (_req, res) => {
    try {
      const body = await inv.listSuppliers(supabase)
      return res.json(body)
    } catch (e) {
      console.error('[suppliers]', e)
      return res.status(500).json({ error: e.message })
    }
  })

  router.post('/suppliers', ...auth, async (req, res) => {
    try {
      const data = await inv.createSupplier(supabase, req.body || {})
      return res.status(201).json(data)
    } catch (e) {
      const st = e.status || 500
      console.error('[suppliers POST]', e)
      return res.status(st).json({ error: e.message })
    }
  })

  router.put('/suppliers/:id', ...auth, async (req, res) => {
    try {
      const id = z.string().uuid().parse(req.params.id)
      const data = await inv.updateSupplier(supabase, id, req.body || {})
      return res.json(data)
    } catch (e) {
      console.error('[suppliers PUT]', e)
      return res.status(500).json({ error: e.message })
    }
  })

  return router
}
