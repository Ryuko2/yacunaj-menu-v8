import { supabase } from './_supabase.js'

/**
 * Valida Authorization Bearer (JWT Supabase) y perfil staff activo.
 * Criterio alineado con backend/src/middleware/auth.js (requireSupabaseUser + requireStaffProfile).
 *
 * @param {object} req Request con headers.authorization
 * @returns {Promise<{ user: import('@supabase/supabase-js').User, profile: { id: string, role: string, active: boolean } }>}
 * @throws {{ status: number, error: string, detail?: string }}
 */
export async function getStaffUserFromRequest(req) {
  const raw = req.headers.authorization
  const authHeader = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    throw { status: 401, error: 'No autorizado', detail: 'Se requiere Bearer token' }
  }

  const { data: userData, error: authError } = await supabase.auth.getUser(token)
  const user = userData?.user
  if (authError || !user) {
    throw {
      status: 401,
      error: 'Sesión inválida',
      detail: authError?.message || 'Token inválido',
    }
  }

  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('id, role, active')
    .eq('id', user.id)
    .maybeSingle()

  if (profError) {
    throw { status: 500, error: 'Error de perfil', detail: profError.message }
  }
  if (!profile) {
    throw { status: 403, error: 'Acceso denegado', detail: 'Perfil inexistente' }
  }
  if (!profile.active) {
    throw { status: 403, error: 'Acceso denegado', detail: 'Perfil inactivo' }
  }

  return { user, profile }
}
