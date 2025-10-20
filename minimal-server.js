import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 5000

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
    return
  }

  // API endpoint
  if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        message: 'CapLiquify Manufacturing Platform API is running',
        version: '1.0.5',
        timestamp: new Date().toISOString(),
      })
    )
    return
  }

  // Serve static files if they exist
  let filePath = req.url === '/' ? '/index.html' : req.url
  const fullPath = path.join(__dirname, 'dist', filePath)

  // Check if file exists
  fs.access(fullPath, fs.constants.F_OK, err => {
    if (err) {
      // File doesn't exist, return a simple HTML page
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CapLiquify Manufacturing Platform</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container { 
              text-align: center; 
              max-width: 600px;
              padding: 40px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 20px;
              backdrop-filter: blur(10px);
            }
            h1 { 
              font-size: 3rem; 
              margin-bottom: 20px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            p { 
              font-size: 1.2rem; 
              margin-bottom: 30px;
              opacity: 0.9;
            }
            .status { 
              background: rgba(0, 255, 0, 0.2); 
              padding: 15px; 
              border-radius: 10px; 
              margin: 20px 0;
              border: 1px solid rgba(0, 255, 0, 0.3);
            }
            .endpoints {
              background: rgba(255, 255, 255, 0.1);
              padding: 20px;
              border-radius: 10px;
              margin-top: 20px;
            }
            .endpoint {
              margin: 10px 0;
              padding: 10px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 5px;
            }
            code {
              background: rgba(0, 0, 0, 0.3);
              padding: 2px 6px;
              border-radius: 3px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏭 CapLiquify Manufacturing Platform</h1>
            <p>Server is running successfully!</p>
            
            <div class="status">
              <strong>✅ Status:</strong> Online and operational
            </div>
            
            <div class="endpoints">
              <h3>Available Endpoints:</h3>
              <div class="endpoint">
                <strong>Health Check:</strong> <code>GET /health</code>
              </div>
              <div class="endpoint">
                <strong>API Status:</strong> <code>GET /api/status</code>
              </div>
            </div>
            
            <p><em>Note: This is a minimal server. For full functionality, please install dependencies and run the complete application.</em></p>
          </div>
        </body>
        </html>
      `)
    } else {
      // File exists, serve it
      const ext = path.extname(fullPath)
      const contentType =
        {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
        }[ext] || 'text/plain'

      fs.readFile(fullPath, (err, data) => {
        if (err) {
          res.writeHead(500)
          res.end('Server Error')
        } else {
          res.writeHead(200, { 'Content-Type': contentType })
          res.end(data)
        }
      })
    }
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CapLiquify Manufacturing Platform server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔧 API status: http://localhost:${PORT}/api/status`)
  console.log(`🌐 Main app: http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})

