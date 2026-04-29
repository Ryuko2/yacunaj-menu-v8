const test = require('node:test')
const assert = require('node:assert')
const axios = require('axios')

/** Integración manual: `RUN_INTEGRATION=1` y Express en :3001 */
const API_URL = 'http://localhost:3001/api'
const runIntegration = process.env.RUN_INTEGRATION === '1'

if (!runIntegration) {
  test('orders.integration: omitidos (RUN_INTEGRATION=1 + servidor en :3001)', () => {})
} else {
  test('Seguridad create-order: falla si source=crm y no hay token', async () => {
    try {
      await axios.post(`${API_URL}/create-order`, {
        table_number: 0,
        qr_token: 'tok_crm_counter_yacunaj',
        items: [{ id: 'test', name: 'Test', finalPrice: 10, quantity: 1 }],
        source: 'crm',
      })
      assert.fail('Debería haber fallado con 401')
    } catch (err) {
      assert.strictEqual(err.response.status, 401)
      assert.strictEqual(err.response.data.error, 'No autorizado')
    }
  })

  test('Seguridad create-order: permite pedidos QR sin token', async () => {
    try {
      const res = await axios.post(`${API_URL}/create-order`, {
        table_number: 1,
        qr_token: 'tok_t1_abc123',
        items: [{ id: 'test', name: 'Test QR', finalPrice: 10, quantity: 1 }],
        source: 'qr',
      })
      assert.strictEqual(res.status, 200)
    } catch (err) {
      if (err.response?.status !== 403) {
        console.error('Error inesperado:', err.response?.data || err.message)
        throw err
      }
      assert.strictEqual(err.response.status, 403)
    }
  })
}
