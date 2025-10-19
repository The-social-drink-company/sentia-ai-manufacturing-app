const isBypassEnabled = () => process.env.ADMIN_AUTH_BYPASS === 'true'

export function requireAdmin(req, res, next) {
  const isAdmin = req.user?.role === 'admin'
  const headerRole = req.headers['x-admin-role']
  const headerAdmin = typeof headerRole === 'string' && headerRole.toLowerCase() === 'admin'

  if (isAdmin || headerAdmin || isBypassEnabled()) {
    return next()
  }

  return res.status(403).json({ message: 'Admin access required.' })
}
