import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://gxgcedivktkubhnmedsp.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4Z2NlZGl2a3RrdWJobm1lZHNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMwOTY0OCwiZXhwIjoyMDg3ODg1NjQ4fQ.VXBad4D3KZUXjpHLq876OwVjYludPr1gK4q0Jt5q6Zs'

export const supabase = createClient(supabaseUrl, supabaseKey)
