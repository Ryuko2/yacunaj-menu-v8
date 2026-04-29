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

const env = loadEnv()
const supabase = createClient(
  env.SUPABASE_URL || env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY
)

async function resetUserPassword() {
  const email = 'kevsvivs@gmail.com' // Corregido según tu prompt
  const newPassword = 'Yacunaj2026!'

  console.log(`Buscando usuario: ${email}...`)
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('Error al listar usuarios:', listError.message)
    return
  }
  
  const user = users.find(u => u.email === email)
  
  if (!user) {
    console.error(`Usuario ${email} no encontrado. Usuarios disponibles:`, users.map(u => u.email))
    return
  }

  console.log(`Usuario encontrado. Actualizando contraseña...`)

  const { error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword, email_confirm: true } // También confirmamos el email por si acaso
  )

  if (error) {
    console.error('Error al actualizar:', error.message)
  } else {
    console.log('\n✅ ¡PASO 1 COMPLETADO!')
    console.log('---------------------------')
    console.log(`Email: ${email}`)
    console.log(`Nueva Password: ${newPassword}`)
    console.log('---------------------------')
    console.log('Ya puedes entrar en: https://yacunaj-menu.vercel.app/login')
  }
}

resetUserPassword()
