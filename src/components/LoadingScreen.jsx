/**
 * LoadingScreen - Full-page loading screen with Sentia branding
 *
 * Used during authentication checks, page transitions, and async operations
 * where a full-page loading state is appropriate.
 *
 * @param {Object} props
 * @param {string} [props.message='Loading...'] - Message to display below spinner
 * @returns {JSX.Element}
 *
 * @example
 * <LoadingScreen message="Checking authentication..." />
 * <LoadingScreen message="Loading dashboard..." />
 * <LoadingScreen /> // Uses default "Loading..." message
 */
const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center">
        {/* Spinning loader with Sentia blue brand color */}
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

        {/* Loading message with uppercase tracking */}
        <p className="text-sm uppercase tracking-wider text-slate-300">{message}</p>
      </div>
    </div>
  )
}

export default LoadingScreen
