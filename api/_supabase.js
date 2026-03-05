import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in Vercel dashboard'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
