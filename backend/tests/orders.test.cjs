const test = require('node:test');
const assert = require('node:assert');
const axios = require('axios');

// Nota: Estos tests asumen que el servidor está corriendo en localhost:3001
const API_URL = 'http://localhost:3001/api';

test('Seguridad create-order: falla si source=crm y no hay token', async (t) => {
  try {
    await axios.post(`${API_URL}/create-order`, {
      table_number: 0,
      qr_token: 'tok_crm_counter_yacunaj',
      items: [{ id: 'test', name: 'Test', finalPrice: 10, quantity: 1 }],
      source: 'crm'
    });
    assert.fail('Debería haber fallado con 401');
  } catch (err) {
    assert.strictEqual(err.response.status, 401);
    assert.strictEqual(err.response.data.error, 'No autorizado');
  }
});

test('Seguridad create-order: permite pedidos QR sin token', async (t) => {
  // Nota: Este test podría fallar si la mesa 1 no está configurada con este token exacto en la DB real.
  // Pero valida que NO de un 401 de seguridad JWT.
  try {
    const res = await axios.post(`${API_URL}/create-order`, {
      table_number: 1,
      qr_token: 'tok_t1_abc123',
      items: [{ id: 'test', name: 'Test QR', finalPrice: 10, quantity: 1 }],
      source: 'qr'
    });
    assert.strictEqual(res.status, 200);
  } catch (err) {
    // Si falla por token de mesa inválido (403), está bien para este test de seguridad JWT
    if (err.response?.status !== 403) {
      console.error('Error inesperado:', err.response?.data || err.message);
      throw err;
    }
    assert.strictEqual(err.response.status, 403);
  }
});
