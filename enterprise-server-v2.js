const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

class EnterpriseServerV2 {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 10000;
    this.environment = process.env.NODE_ENV || 'development';
    
    // Initialize server components
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    
    console.log(`🏗️  Enterprise Server V2 initialized for ${this.environment} environment`);
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.clerk.com", "https://clerk.sentia.com"]
        }
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.getAllowedOrigins(),
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  getAllowedOrigins() {
    const origins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://sentia-manufacturing-production.onrender.com',
      'https://sentia-manufacturing-development.onrender.com',
      'https://sentia-manufacturing-testing.onrender.com'
    ];
    return origins;
  }

  initializeRoutes() {
    // Health check endpoint - critical for Render
    this.app.get('/health', (req, res) => {
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: this.environment,
        version: '2.0.0',
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
        },
        node_version: process.version,
        port: this.port
      };
      
      res.status(200).json(healthData);
    });

    // API routes
    this.app.use('/api', this.createApiRoutes());

    // Serve the embedded application
    this.app.get('/', (req, res) => {
      res.send(this.getEmbeddedApplication());
    });

    // Serve static assets if dist directory exists
    const distPath = path.join(__dirname, 'dist');
    this.app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: this.environment === 'production' ? '1d' : '0'
    }));

    // SPA fallback - serve embedded app for all non-API routes
    this.app.get('*', (req, res) => {
      res.send(this.getEmbeddedApplication());
    });
  }

  createApiRoutes() {
    const router = express.Router();

    // Dashboard data endpoint
    router.get('/dashboard/data', (req, res) => {
      const dashboardData = {
        production: {
          total: 12847,
          trend: '+5.2%',
          data: [12000, 13500, 12800, 14200, 13900, 15100]
        },
        workingCapital: {
          total: '£2.4M',
          efficiency: '94.2%',
          breakdown: {
            inventory: 45,
            receivables: 25,
            cash: 20,
            payables: 10
          }
        },
        quality: {
          score: 98.7,
          status: 'Above target'
        },
        efficiency: {
          overall: 94.2,
          status: 'Monitoring'
        }
      };

      res.json(dashboardData);
    });

    // Authentication endpoint
    router.post('/auth/login', (req, res) => {
      const { email, password } = req.body;
      
      // Demo authentication
      const validCredentials = [
        { email: 'admin@sentia.com', password: 'admin123', name: 'Administrator', role: 'admin' },
        { email: 'demo@sentia.com', password: 'demo123', name: 'Demo User', role: 'user' },
        { email: 'user@sentia.com', password: 'user123', name: 'Standard User', role: 'user' }
      ];

      const user = validCredentials.find(u => u.email === email && u.password === password);
      
      if (user) {
        res.json({
          success: true,
          user: {
            email: user.email,
            name: user.name,
            role: user.role
          },
          token: 'demo-jwt-token-' + Date.now()
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    });

    return router;
  }

  getEmbeddedApplication() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sentia Manufacturing Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .card-shadow {
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="bg-gray-50">
    <div id="app">
        <!-- Loading Screen -->
        <div id="loading" class="fixed inset-0 gradient-bg flex items-center justify-center z-50">
            <div class="text-center text-white">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                <h2 class="text-2xl font-bold mb-2">Sentia Manufacturing</h2>
                <p class="text-lg opacity-90">Loading Enterprise Dashboard...</p>
            </div>
        </div>

        <!-- Login Screen -->
        <div id="login" class="hidden min-h-screen gradient-bg flex items-center justify-center">
            <div class="bg-white p-8 rounded-lg card-shadow w-full max-w-md animate-fade-in">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">Sentia Manufacturing</h1>
                    <p class="text-gray-600">Enterprise Dashboard</p>
                </div>
                
                <form id="loginForm" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" id="email" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="admin@sentia.com">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input type="password" id="password" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="admin123">
                    </div>
                    
                    <button type="submit" 
                            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200">
                        Sign In
                    </button>
                </form>
                
                <div class="mt-6 text-sm text-gray-600 text-center">
                    <p class="mb-2">Demo Credentials:</p>
                    <p><strong>Admin:</strong> admin@sentia.com / admin123</p>
                    <p><strong>Demo:</strong> demo@sentia.com / demo123</p>
                </div>
            </div>
        </div>

        <!-- Dashboard -->
        <div id="dashboard" class="hidden min-h-screen bg-gray-50">
            <!-- Header -->
            <header class="bg-white shadow-sm border-b">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center py-4">
                        <div class="flex items-center">
                            <h1 class="text-2xl font-bold text-gray-900">Sentia Manufacturing</h1>
                            <span class="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Live</span>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span id="userInfo" class="text-sm text-gray-600"></span>
                            <button onclick="logout()" class="text-sm text-blue-600 hover:text-blue-800">Logout</button>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <!-- KPI Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white p-6 rounded-lg card-shadow animate-fade-in">
                        <div class="flex items-center">
                            <div class="flex-1">
                                <p class="text-sm font-medium text-gray-600">Production Total</p>
                                <p id="productionTotal" class="text-2xl font-bold text-gray-900">12,847</p>
                                <p class="text-sm text-green-600">+5.2% from last month</p>
                            </div>
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-lg card-shadow animate-fade-in">
                        <div class="flex items-center">
                            <div class="flex-1">
                                <p class="text-sm font-medium text-gray-600">Working Capital</p>
                                <p id="workingCapital" class="text-2xl font-bold text-gray-900">£2.4M</p>
                                <p class="text-sm text-green-600">94.2% efficiency</p>
                            </div>
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-lg card-shadow animate-fade-in">
                        <div class="flex items-center">
                            <div class="flex-1">
                                <p class="text-sm font-medium text-gray-600">Quality Score</p>
                                <p id="qualityScore" class="text-2xl font-bold text-gray-900">98.7%</p>
                                <p class="text-sm text-green-600">Above target</p>
                            </div>
                            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-lg card-shadow animate-fade-in">
                        <div class="flex items-center">
                            <div class="flex-1">
                                <p class="text-sm font-medium text-gray-600">Efficiency</p>
                                <p id="efficiency" class="text-2xl font-bold text-gray-900">94.2%</p>
                                <p class="text-sm text-blue-600">Monitoring</p>
                            </div>
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-white p-6 rounded-lg card-shadow animate-fade-in">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Production Trends</h3>
                        <canvas id="productionChart" width="400" height="200"></canvas>
                    </div>

                    <div class="bg-white p-6 rounded-lg card-shadow animate-fade-in">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Working Capital Breakdown</h3>
                        <canvas id="workingCapitalChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script>
        let currentUser = null;
        let dashboardData = null;

        // Initialize application
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('login').classList.remove('hidden');
            }, 2000);
        });

        // Login form handler
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    currentUser = result.user;
                    showDashboard();
                } else {
                    alert('Invalid credentials. Please try: admin@sentia.com / admin123');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });

        async function showDashboard() {
            document.getElementById('login').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            
            // Update user info
            document.getElementById('userInfo').textContent = currentUser.name;
            
            // Load dashboard data
            await loadDashboardData();
            
            // Initialize charts
            initializeCharts();
        }

        async function loadDashboardData() {
            try {
                const response = await fetch('/api/dashboard/data');
                dashboardData = await response.json();
                
                // Update KPI values
                document.getElementById('productionTotal').textContent = dashboardData.production.total.toLocaleString();
                document.getElementById('workingCapital').textContent = dashboardData.workingCapital.total;
                document.getElementById('qualityScore').textContent = dashboardData.quality.score + '%';
                document.getElementById('efficiency').textContent = dashboardData.efficiency.overall + '%';
                
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            }
        }

        function initializeCharts() {
            // Production Trends Chart
            const productionCtx = document.getElementById('productionChart').getContext('2d');
            new Chart(productionCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Production Units',
                        data: dashboardData.production.data,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            // Working Capital Chart
            const workingCapitalCtx = document.getElementById('workingCapitalChart').getContext('2d');
            new Chart(workingCapitalCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Inventory', 'Receivables', 'Cash', 'Payables'],
                    datasets: [{
                        data: [
                            dashboardData.workingCapital.breakdown.inventory,
                            dashboardData.workingCapital.breakdown.receivables,
                            dashboardData.workingCapital.breakdown.cash,
                            dashboardData.workingCapital.breakdown.payables
                        ],
                        backgroundColor: [
                            'rgb(59, 130, 246)',
                            'rgb(16, 185, 129)',
                            'rgb(245, 158, 11)',
                            'rgb(239, 68, 68)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        function logout() {
            currentUser = null;
            dashboardData = null;
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('login').classList.remove('hidden');
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
        }
    </script>
</body>
</html>`;
  }

  initializeErrorHandling() {
    // 404 handler for API routes
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('Server Error:', err);
      
      const errorResponse = {
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        path: req.path
      };

      if (this.environment === 'development') {
        errorResponse.message = err.message;
        errorResponse.stack = err.stack;
      }

      res.status(500).json(errorResponse);
    });
  }

  async start() {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.port, '0.0.0.0', (err) => {
        if (err) {
          console.error('❌ Failed to start server:', err);
          reject(err);
        } else {
          console.log(`🚀 SENTIA MANUFACTURING ENTERPRISE SERVER V2 STARTED`);
          console.log(`====================================================`);
          console.log(`🌐 Server running on port ${this.port}`);
          console.log(`🔒 Environment: ${this.environment}`);
          console.log(`📊 Health endpoint: /health`);
          console.log(`📱 Dashboard API: /api/dashboard/data`);
          console.log(`🔐 Authentication: /api/auth/login`);
          console.log(`====================================================`);
          console.log(`✅ Enterprise-grade reliability enabled`);
          console.log(`✅ Security middleware active`);
          console.log(`✅ Embedded application ready`);
          console.log(`✅ Error handling initialized`);
          console.log(`====================================================`);
          console.log(`🎯 READY FOR CLIENT DEMONSTRATION`);
          
          resolve(server);
        }
      });

      // Graceful shutdown handling
      const gracefulShutdown = (signal) => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);
        server.close(() => {
          console.log('HTTP server closed.');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    });
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new EnterpriseServerV2();
  server.start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = EnterpriseServerV2;
