/**
 * Crea o actualiza el único usuario OPS (email + contraseña) y deja el rol owner.
 * Requiere service role. Uso:
 *   OPS_STAFF_PASSWORD='tu-clave' node scripts/fix-auth.mjs
 * o define OPS_STAFF_PASSWORD en .env (raíz). No commitees valores reales.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function loadEnv() {
  const p = path.join(root, '.env')
  if (!existsSync(p)) return {}
  const env = {}
  readFileSync(p, 'utf8').split(/\r?\n/).forEach(line => {
    const t = line.trim()
    if (!t || t.startsWith('#')) return
    const i = t.indexOf('=')
    if (i <= 0) return
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    env[k] = v
  })
  return env
}

const fileEnv = loadEnv()
const env = { ...fileEnv, ...process.env }

const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_KEY
const email = env.VITE_OPS_AUTH_EMAIL?.trim()
const password =
  env.OPS_STAFF_PASSWORD?.trim() ||
  process.env.OPS_STAFF_PASSWORD?.trim()

if (!url || !serviceKey) {
  console.error('Falta SUPABASE_URL (o VITE_SUPABASE_URL) y SUPABASE_SERVICE_KEY en .env')
  process.exit(1)
}
if (!email) {
  console.error('Falta VITE_OPS_AUTH_EMAIL en .env (mismo email que usará el login OPS).')
  process.exit(1)
}
if (!password || password.length < 8) {
  console.error('Falta OPS_STAFF_PASSWORD en .env (mín. 8 caracteres).')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function main() {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('Error al listar usuarios:', listError.message)
    process.exit(1)
  }

  let user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  if (!user) {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Yacunaj OPS' },
    })
    if (createErr) {
      console.error('Error al crear usuario:', createErr.message)
      process.exit(1)
    }
    user = created.user
    console.log('Usuario creado en Auth.')
  } else {
    const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    })
    if (updErr) {
      console.error('Error al actualizar contraseña:', updErr.message)
      process.exit(1)
    }
    console.log('Contraseña actualizada.')
  }

  const { error: profErr } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        role: 'owner',
        full_name: 'Yacunaj OPS',
        active: true,
      },
      { onConflict: 'id' }
    )

  if (profErr) {
    console.error('Error al asegurar perfil owner:', profErr.message)
    process.exit(1)
  }

  console.log('\nListo. Entra en /login con la contraseña definida en OPS_STAFF_PASSWORD.')
  console.log('Email interno (no se muestra en la app):', email)
}

main()
