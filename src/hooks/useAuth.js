// Environment-aware authentication hook that redirects to the appropriate implementation
import useEnvironmentAuth from '@/hooks/useEnvironmentAuth'
import useEnvironmentUser from '@/hooks/useEnvironmentUser'

export function useAuth() {
  // Simply redirect to the environment-aware hook
  const auth = useEnvironmentAuth()
  const { user } = useEnvironmentUser()

  return {
    ...auth,
    user,
    mode: import.meta.env.VITE_DEVELOPMENT_MODE === 'true' ? 'development' : 'clerk',
  }
}
