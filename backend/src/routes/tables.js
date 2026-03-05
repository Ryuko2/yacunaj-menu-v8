const express = require('express')
const router = express.Router()
const { supabase } = require('../services/supabase')

// GET /api/validate-table?table=1&token=tok_t1_abc123 (debug route)
router.get('/validate-table', async (req, res) => {
  const { table, token } = req.query
  if (!table || !token) {
    return res.json({ data: null, error: { message: 'Missing table or token' } })
  }
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('table_number', parseInt(table))
    .eq('qr_token', token)
    .eq('active', true)
    .single()
  res.json({ data, error })
})

module.exports = router
