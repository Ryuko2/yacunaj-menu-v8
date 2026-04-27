/**
 * Aplica migraciones en el Postgres remoto de Supabase usando la CLI.
 *
 * Opción A — URI completa en .env:
 *   DATABASE_URL=postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres
 *   (Dashboard → Connect → copiar "Direct connection" o Session pooler)
 *
 * Opción B — solo contraseña de BD (no uses la service_role ni el anon):
 *   SUPABASE_DB_PASSWORD=tu_password_de_postgres
 *   (y SUPABASE_URL o VITE_SUPABASE_URL ya con https://REF.supabase.co)
 *
 * Uso: node scripts/db-push-remote.mjs
 * Dry-run: node scripts/db-push-remote.mjs --dry-run
 */
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadDotEnv () {
  const p = path.join(root, '.env')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i <= 0) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (process.env[k] === undefined) process.env[k] = v
  }
}

function projectRefFromSupabaseUrl (url) {
  if (!url) return null
  const m = String(url).match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i)
  return m ? m[1] : null
}

function buildUrlFromDbPassword () {
  const pw = process.env.SUPABASE_DB_PASSWORD
  if (!pw) return null
  const ref =
    process.env.SUPABASE_PROJECT_REF ||
    projectRefFromSupabaseUrl(process.env.SUPABASE_URL) ||
    projectRefFromSupabaseUrl(process.env.VITE_SUPABASE_URL)
  if (!ref) return null
  const enc = encodeURIComponent(pw)
  return `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`
}

loadDotEnv()

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.DIRECT_URL ||
  buildUrlFromDbPassword()

const dry = process.argv.includes('--dry-run')

if (!dbUrl) {
  console.error(
    'Falta conexión a Postgres para migraciones.\n' +
      'Añade en .env una de estas opciones:\n' +
      '  • DATABASE_URL=… (URI del botón Connect en Supabase)\n' +
      '  • SUPABASE_DB_PASSWORD=… (contraseña de la base de datos, no la API key)\n' +
      'Luego: npm run db:push:remote',
  )
  process.exit(1)
}

const args = ['supabase', 'db', 'push', '--db-url', dbUrl]
if (dry) args.push('--dry-run')
args.push('--yes')

execFileSync('npx', args, { stdio: 'inherit', cwd: root, shell: true })
