export function audit(req, res, next) {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const actor = req.user?.id || 'anonymous'
    const entry = {
      actor,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration,
    }
    if (process.env.NODE_ENV !== 'test') {
      console.info('[admin:audit]', JSON.stringify(entry))
    }
  })

  next()
}
