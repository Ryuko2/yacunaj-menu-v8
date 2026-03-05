const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

app.use('/api', require('./src/routes/orders'))
app.use('/api', require('./src/routes/tables'))

app.listen(process.env.PORT || 3001, () => {
  console.log(`🌴 Yacunaj API running on port ${process.env.PORT || 3001}`)
})
