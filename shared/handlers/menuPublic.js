/**
 * Handler puro para el menú público.
 *
 * Diseño: recibe el cliente Supabase ya inyectado (no lo crea) y devuelve un
 * objeto `{ ok, status, body }` que cualquier runtime (Express, Vercel,
 * Lambda, etc.) puede traducir a una respuesta HTTP. Esto evita duplicar la
 * misma llamada a `get_menu_public_catalog` en /api/menu/public.js (Vercel)
 * y en /backend/src/routes/menu.js (Express).
 *
 * @param {object} supabase  Cliente @supabase/supabase-js ya creado por el caller.
 * @param {object} [opts]
 * @param {Date|string} [opts.at]  Momento de evaluación (defaults a now()).
 * @returns {Promise<{ok: boolean, status: number, body: any}>}
 */
async function fetchMenuPublic (supabase, opts = {}) {
  if (!supabase) {
    return {
      ok: false,
      status: 503,
      body: {
        error: 'Servidor sin configurar',
        detail: 'Falta cliente supabase (revisa SUPABASE_URL y SUPABASE_SERVICE_KEY)'
      }
    }
  }

  const at = opts.at instanceof Date
    ? opts.at.toISOString()
    : (typeof opts.at === 'string' ? opts.at : new Date().toISOString())

  try {
    const { data, error } = await supabase.rpc('get_menu_public_catalog', { p_at: at })
    if (error) {
      console.error('[menuPublic] RPC error:', error)
      return {
        ok: false,
        status: 500,
        body: { error: error.message, detail: error.details }
      }
    }
    const payload = typeof data === 'string' ? JSON.parse(data) : data
    return {
      ok: true,
      status: 200,
      body: payload ?? { categories: [] }
    }
  } catch (err) {
    console.error('[menuPublic] excepcion:', err)
    return {
      ok: false,
      status: 500,
      body: { error: err.message }
    }
  }
}

module.exports = { fetchMenuPublic }
