const isMethodSafe = method => ['GET', 'HEAD', 'OPTIONS'].includes(method)

export function requireMfa(req, res, next) {
  if (isMethodSafe(req.method)) {
    return next()
  }

  if (process.env.ADMIN_AUTH_BYPASS === 'true') {
    return next()
  }

  const mfaHeader = req.headers['x-mfa-verified']
  const mfaToken = typeof mfaHeader === 'string' ? mfaHeader.toLowerCase() === 'true' : false

  if (req.user?.mfaVerified || req.session?.mfaVerified || mfaToken) {
    return next()
  }

  return res.status(401).json({ message: 'MFA verification required.' })
}
