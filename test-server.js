import express from 'express'

const app = express()
const PORT = 10001

app.get('/health', (req, res) => {
  console.log('Health endpoint hit')
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`)
})
