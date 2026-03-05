const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://gxgcedivktkubhnmedsp.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4Z2NlZGl2a3RrdWJobm1lZHNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMwOTY0OCwiZXhwIjoyMDg3ODg1NjQ4fQ.VXBad4D3KZUXjpHLq876OwVjYludPr1gK4q0Jt5q6Zs'
)

module.exports = { supabase }
