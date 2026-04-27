/**
 * Crea el bucket menu-images si usas la CLI de Supabase con service role.
 * En la mayoría de los casos basta con aplicar la migración 20260428120000 que inserta en storage.buckets.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const bucket = process.env.SUPABASE_STORAGE_BUCKET_MENU || 'menu-images'

if (!url || !key) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)
const { error } = await supabase.storage.createBucket(bucket, { public: true })
if (error && !String(error.message).includes('already exists')) {
  console.error(error)
  process.exit(1)
}
console.log('Bucket listo:', bucket)
