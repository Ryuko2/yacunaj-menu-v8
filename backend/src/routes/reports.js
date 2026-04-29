const express = require('express')
const { requireSupabaseUser, requireStaffProfile } = require('../middleware/auth')
const {
  getSalesReport,
  getTopItemsReport,
  getCostsReport,
  getMarginsItemsReport,
  getMarginsLowReport,
} = require('../reports/reportService.cjs')

/** @param {{ supabase: import('@supabase/supabase-js').SupabaseClient }} deps */
module.exports = function buildReportsRouter({ supabase }) {
  const router = express.Router()
  const auth = [requireSupabaseUser, requireStaffProfile]

  router.get('/sales', ...auth, async (req, res) => {
    try {
      const body = await getSalesReport(supabase, req.query || {})
      return res.json(body)
    } catch (e) {
      console.error('[reports/sales]', e)
      return res.status(500).json({ error: e.message })
    }
  })

  router.get('/items/top', ...auth, async (req, res) => {
    try {
      const body = await getTopItemsReport(supabase, req.query || {})
      return res.json(body)
    } catch (e) {
      console.error('[reports/items/top]', e)
      return res.status(500).json({ error: e.message })
    }
  })

  router.get('/costs', ...auth, async (req, res) => {
    try {
      const body = await getCostsReport(supabase, req.query || {})
      return res.json(body)
    } catch (e) {
      console.error('[reports/costs]', e)
      return res.status(500).json({ error: e.message })
    }
  })

  router.get('/margins/items', ...auth, async (req, res) => {
    try {
      const body = await getMarginsItemsReport(supabase, req.query || {})
      return res.json(body)
    } catch (e) {
      console.error('[reports/margins/items]', e)
      return res.status(500).json({ error: e.message })
    }
  })

  router.get('/margins/low', ...auth, async (req, res) => {
    try {
      const body = await getMarginsLowReport(supabase, req.query || {})
      return res.json(body)
    } catch (e) {
      console.error('[reports/margins/low]', e)
      return res.status(500).json({ error: e.message })
    }
  })

  return router
}
