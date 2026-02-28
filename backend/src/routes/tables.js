const express = require('express')
const router = express.Router()
const { supabase } = require('../services/supabase')

// GET /api/validate-table?table=1&token=tok_t1_abc123
router.get('/validate-table', async (req, res) => {
  try {
    const { table, token } = req.query
    if (!table || !token) {
      return res.status(400).json({ valid: false, error: 'Missing table or token' })
    }

    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('table_number', table)
      .eq('qr_token', token)
      .eq('active', true)
      .single()

    if (error || !data) {
      return res.json({ valid: false })
    }

    res.json({ valid: true, table_number: data.table_number })
  } catch (err) {
    console.error(err)
    res.status(500).json({ valid: false, error: 'Validation failed' })
  }
})

module.exports = router
