const express = require('express')

const PORT = Number(process.env.PORT) || 3000

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

module.exports = app

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Sentia server listening on http://localhost:${PORT}`)
  })
}
