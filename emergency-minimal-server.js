/**
 * ULTRA-MINIMAL EMERGENCY SERVER
 *
 * This server bypasses ALL complex dependencies and serves a working
 * authentication interface immediately for client demonstration.
 *
 * NO CLERK, NO COMPLEX DEPENDENCIES - JUST WORKING AUTH
 */

const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('dist'))

// In-memory user store for demo
const users = new Map()
const sessions = new Map()

// Generate simple session token
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Simple HTML templates
const loginHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sentia Manufacturing - Sign In</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full space-y-8">
        <div class="text-center">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Sentia Manufacturing</h1>
            <p class="text-gray-600">Manufacturing Intelligence Platform</p>
        </div>
        
        <div class="bg-white p-8 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold text-center mb-6">Sign In</h2>
            
            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="email" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Enter your email">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" id="password" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Enter your password">
                </div>
                
                <button type="submit" 
                        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                    Sign In
                </button>
            </form>
            
            <div class="mt-4 text-center">
                <p class="text-sm text-gray-600">
                    Demo credentials: admin@sentia.com / admin123
                </p>
            </div>
            
            <div class="mt-6 text-center">
                <a href="/signup" class="text-blue-600 hover:text-blue-800">
                    Don't have an account? Sign up
                </a>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    localStorage.setItem('authToken', result.token);
                    window.location.href = '/dashboard';
                } else {
                    alert(result.message || 'Login failed');
                }
            } catch (error) {
                alert('Login error: ' + error.message);
            }
        });
    </script>
</body>
</html>
`

const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CapLiquify Manufacturing Platform</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <h1 class="text-xl font-semibold text-gray-900">CapLiquify Manufacturing Platform</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-600" id="userEmail">Welcome, User</span>
                    <button onclick="logout()" class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Total Production</h3>
                <p class="text-2xl font-bold text-gray-900">12,847</p>
                <p class="text-sm text-green-600">+5.2% from last month</p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Working Capital</h3>
                <p class="text-2xl font-bold text-gray-900">£2.4M</p>
                <p class="text-sm text-blue-600">Optimized efficiency</p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Quality Score</h3>
                <p class="text-2xl font-bold text-gray-900">98.7%</p>
                <p class="text-sm text-green-600">Above target</p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Efficiency</h3>
                <p class="text-2xl font-bold text-gray-900">94.2%</p>
                <p class="text-sm text-yellow-600">Monitoring</p>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold mb-4">Production Trends</h3>
                <canvas id="productionChart" width="400" height="200"></canvas>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold mb-4">Working Capital Analysis</h3>
                <canvas id="capitalChart" width="400" height="200"></canvas>
            </div>
        </div>

        <!-- Navigation -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                <h3 class="text-lg font-semibold mb-2">Working Capital Management</h3>
                <p class="text-gray-600">Optimize cash flow and inventory management</p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                <h3 class="text-lg font-semibold mb-2">Production Analytics</h3>
                <p class="text-gray-600">Real-time production monitoring and insights</p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                <h3 class="text-lg font-semibold mb-2">Quality Intelligence</h3>
                <p class="text-gray-600">Advanced quality control and compliance</p>
            </div>
        </div>
    </main>

    <script>
        // Check authentication
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/login';
        }

        // Initialize charts
        const productionCtx = document.getElementById('productionChart').getContext('2d');
        new Chart(productionCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Production Units',
                    data: [12000, 13500, 12800, 14200, 13900, 15100],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        const capitalCtx = document.getElementById('capitalChart').getContext('2d');
        new Chart(capitalCtx, {
            type: 'doughnut',
            data: {
                labels: ['Inventory', 'Receivables', 'Cash', 'Payables'],
                datasets: [{
                    data: [45, 25, 20, 10],
                    backgroundColor: [
                        'rgb(239, 68, 68)',
                        'rgb(59, 130, 246)',
                        'rgb(34, 197, 94)',
                        'rgb(251, 191, 36)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        function logout() {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
    </script>
</body>
</html>
`

// Routes
app.get('/', (req, res) => {
  res.redirect('/login')
})

app.get('/login', (req, res) => {
  res.send(loginHTML)
})

app.get('/signup', (req, res) => {
  res.send(loginHTML.replace('Sign In', 'Sign Up').replace('/api/auth/login', '/api/auth/signup'))
})

app.get('/dashboard', (req, res) => {
  res.send(dashboardHTML)
})

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'sentia-manufacturing-emergency',
    environment: process.env.NODE_ENV || 'emergency',
    render: true,
    version: '1.0.0-emergency',
  })
})

// Auth API
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body

  // Demo authentication
  if (email === 'admin@sentia.com' && password === 'admin123') {
    const token = generateToken()
    sessions.set(token, { email, loginTime: Date.now() })

    res.json({
      success: true,
      token,
      user: { email, name: 'Admin User' },
    })
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials. Use admin@sentia.com / admin123',
    })
  }
})

app.post('/api/auth/signup', (req, res) => {
  const { email, password } = req.body

  if (users.has(email)) {
    return res.status(400).json({
      success: false,
      message: 'User already exists',
    })
  }

  users.set(email, { password, createdAt: Date.now() })
  const token = generateToken()
  sessions.set(token, { email, loginTime: Date.now() })

  res.json({
    success: true,
    token,
    user: { email, name: 'New User' },
  })
})

// Catch all route
app.get('*', (req, res) => {
  res.redirect('/dashboard')
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EMERGENCY SERVER RUNNING ON PORT ${PORT}`)
  console.log(`🔗 Access at: http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔐 Demo login: admin@sentia.com / admin123`)
  console.log(`⚡ Emergency mode - bypassing all complex dependencies`)
})

module.exports = app

