const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const request = require('supertest')
const buildOrdersRouter = require('../src/routes/orders')

function makeDeps(opts = {}) {
  const { authUserId = 'u1', profileActive = true, tableRows = {} } = opts

  let capturedInsert = null
  let insertCalled = false
  let telegramOrder = null

  const sendTelegramMessage = async (order, _items) => {
    telegramOrder = order
  }

  const supabase = {
    auth: {
      getUser: async (token) => {
        if (token === 'valid') return { data: { user: { id: authUserId } }, error: null }
        if (!token) return { data: { user: null }, error: { message: 'missing' } }
        return { data: { user: null }, error: { message: 'bad token' } }
      },
    },
    from(table) {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                if (!profileActive) return { data: null, error: null }
                return {
                  data: { id: authUserId, role: 'cashier', active: true },
                  error: null,
                }
              },
            }),
          }),
        }
      }
      if (table === 'tables') {
        const tn = tableRows.table_number ?? 0
        const tok = tableRows.qr_token ?? 'tok_crm_counter_yacunaj'
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  single: async () => ({
                    data: { table_number: tn, qr_token: tok, active: true },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'orders') {
        return {
          insert: (payload) => {
            insertCalled = true
            capturedInsert = payload
            return {
              select: () => ({
                single: async () => ({
                  data: {
                    id: 'o1',
                    ...payload,
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }
          },
        }
      }
    },
  }

  return {
    supabase,
    sendTelegramMessage,
    getCapturedInsert: () => capturedInsert,
    getInsertCalled: () => insertCalled,
    getTelegramOrder: () => telegramOrder,
  }
}

describe('POST /api/create-order (unit, supertest)', () => {
  it('crm + Bearer válido: insert con source crm y Telegram recibe source', async () => {
    const m = makeDeps({
      tableRows: { table_number: 0, qr_token: 'tok_crm_counter_yacunaj' },
    })
    const app = express()
    app.use(express.json())
    app.use('/api', buildOrdersRouter({ supabase: m.supabase, sendTelegramMessage: m.sendTelegramMessage }))

    const res = await request(app)
      .post('/api/create-order')
      .set('Authorization', 'Bearer valid')
      .send({
        table_number: 0,
        qr_token: 'tok_crm_counter_yacunaj',
        items: [{ id: 'x', name: 'Late', finalPrice: 50, quantity: 2 }],
        source: 'crm',
      })

    assert.equal(res.status, 200)
    assert.equal(m.getCapturedInsert().source, 'crm')
    assert.equal(m.getCapturedInsert().table_number, 0)
    assert.equal(Number(m.getCapturedInsert().total), 100)
    assert.equal(m.getTelegramOrder().source, 'crm')
  })

  it('crm sin Authorization: 401, sin insert', async () => {
    const m = makeDeps()
    const app = express()
    app.use(express.json())
    app.use('/api', buildOrdersRouter({ supabase: m.supabase, sendTelegramMessage: m.sendTelegramMessage }))

    const res = await request(app).post('/api/create-order').send({
      table_number: 0,
      qr_token: 'tok_crm_counter_yacunaj',
      items: [{ id: 'x', name: 'Late', finalPrice: 50, quantity: 2 }],
      source: 'crm',
    })

    assert.equal(res.status, 401)
    assert.equal(m.getInsertCalled(), false)
  })

  it('sin source (default qr), sin auth: 200 e insert.source qr', async () => {
    const m = makeDeps({
      tableRows: { table_number: 1, qr_token: 'tok_t1_abc123' },
    })
    const app = express()
    app.use(express.json())
    app.use('/api', buildOrdersRouter({ supabase: m.supabase, sendTelegramMessage: m.sendTelegramMessage }))

    const res = await request(app).post('/api/create-order').send({
      table_number: 1,
      qr_token: 'tok_t1_abc123',
      items: [{ id: 'x', name: 'Late', finalPrice: 10, quantity: 1 }],
    })

    assert.equal(res.status, 200)
    assert.equal(m.getCapturedInsert().source, 'qr')
  })
})
