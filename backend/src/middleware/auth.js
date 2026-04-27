const { supabase } = require('../services/supabase')

/**
 * Valida Authorization: Bearer <jwt> con Supabase y adjunta req.user (auth user).
 */
async function requireSupabaseUser(req, res, next) {
  try {
    const h = req.headers.authorization || ''
    const token = h.startsWith('Bearer ') ? h.slice(7) : null
    if (!token) {
      return res.status(401).json({ error: 'No autorizado', detail: 'Falta Bearer token' })
    }
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Token inválido', detail: error?.message })
    }
    req.accessToken = token
    req.user = data.user
    return next()
  } catch (e) {
    return res.status(401).json({ error: 'No autorizado', detail: e.message })
  }
}

/** Cualquier staff con fila profiles activa */
async function requireStaffProfile(req, res, next) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, role, active, full_name')
      .eq('id', req.user.id)
      .maybeSingle()
    if (error) throw error
    if (!profile || !profile.active) {
      return res.status(403).json({ error: 'Perfil inactivo o inexistente' })
    }
    req.profile = profile
    return next()
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.profile) return res.status(500).json({ error: 'Perfil no cargado' })
    if (!roles.includes(req.profile.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes', roles: roles.join(', ') })
    }
    return next()
  }
}

module.exports = { requireSupabaseUser, requireStaffProfile, requireRole }
