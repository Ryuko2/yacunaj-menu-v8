import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

/** Perfil del usuario autenticado (tabla `profiles`). */
export function useStaffProfile() {
  const { user, loading: authLoading } = useAuth()

  const q = useQuery({
    queryKey: ['staff-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, active, full_name')
        .eq('id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  return {
    profile: q.data ?? null,
    loading: authLoading || (!!user && q.isLoading),
    error: q.error,
    refetch: q.refetch,
  }
}
