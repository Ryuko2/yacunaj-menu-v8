const express = require('express')
const router = express.Router()
const { supabase } = require('../services/supabase')
const menuCmsRoutes = require('./menuCmsRoutes')
const { fetchMenuPublic } = require('../../../shared/handlers/menuPublic')

/** GET /api/menu/public — usa el handler compartido con Vercel /api/menu/public.js */
router.get('/menu/public', async (req, res) => {
  const result = await fetchMenuPublic(supabase, { at: new Date() })
  return res.status(result.status).json(result.body)
})

router.use(menuCmsRoutes)

module.exports = router
