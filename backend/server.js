const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

app.use('/api', require('./src/routes/legacyPinAdmin'))
const { supabase } = require('./src/services/supabase')
const { sendTelegramMessage } = require('./src/services/telegram')
const buildOrdersRouter = require('./src/routes/orders')
app.use('/api', buildOrdersRouter({ supabase, sendTelegramMessage }))
app.use('/api', require('./src/routes/tables'))
app.use('/api', require('./src/routes/menu'))
app.use('/api/reports', require('./src/routes/reports')({ supabase }))
app.use('/api', require('./src/routes/inventory')({ supabase }))

app.listen(process.env.PORT || 3001, () => {
  console.log(`🌴 Yacunaj API running on port ${process.env.PORT || 3001}`)
})
