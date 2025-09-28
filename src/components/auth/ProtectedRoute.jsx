import AuthGuard from './AuthGuard'

const ProtectedRoute = ({ children }) => <AuthGuard>{children}</AuthGuard>

export default ProtectedRoute
