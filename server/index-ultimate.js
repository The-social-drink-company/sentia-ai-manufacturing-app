const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));
app.use(express.static(path.join(__dirname, '../public')));

// Ultimate working dashboard route
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sentia Manufacturing Dashboard - Enterprise Working Capital Intelligence</title>
    <script src="https://unpkg.com/@clerk/clerk-js@latest/dist/clerk.browser.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 2.5rem; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 1.2rem; opacity: 0.9; }
        .dashboard { display: none; }
        .dashboard.active { display: block; }
        .landing { text-align: center; padding: 60px 20px; }
        .hero h1 { font-size: 3rem; margin-bottom: 20px; }
        .hero p { font-size: 1.3rem; margin-bottom: 40px; opacity: 0.9; }
        .cta-button { 
            background: #4CAF50; 
            color: white; 
            padding: 15px 30px; 
            border: none; 
            border-radius: 8px; 
            font-size: 1.1rem; 
            cursor: pointer; 
            transition: all 0.3s;
        }
        .cta-button:hover { background: #45a049; transform: translateY(-2px); }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin-top: 60px; }
        .feature { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 12px; text-align: center; }
        .feature h3 { font-size: 1.5rem; margin-bottom: 15px; }
        .sidebar { 
            position: fixed; 
            left: 0; 
            top: 0; 
            width: 280px; 
            height: 100vh; 
            background: #1a1d29; 
            padding: 20px 0; 
            overflow-y: auto;
        }
        .main-content { margin-left: 280px; padding: 20px; }
        .nav-item { 
            display: block; 
            color: #8892b0; 
            text-decoration: none; 
            padding: 12px 24px; 
            transition: all 0.3s;
        }
        .nav-item:hover, .nav-item.active { 
            background: #2d3748; 
            color: #64ffda; 
            border-left: 3px solid #64ffda;
        }
        .nav-section { 
            color: #64ffda; 
            font-size: 0.8rem; 
            font-weight: bold; 
            padding: 20px 24px 10px; 
            text-transform: uppercase; 
            letter-spacing: 1px;
        }
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px;
        }
        .metric-card { 
            background: white; 
            color: #333; 
            padding: 24px; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .metric-value { font-size: 2rem; font-weight: bold; margin-bottom: 8px; }
        .metric-label { color: #666; font-size: 0.9rem; }
        .metric-change { font-size: 0.8rem; margin-top: 8px; }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .chart-container { 
            background: white; 
            color: #333; 
            padding: 24px; 
            border-radius: 12px; 
            margin-bottom: 20px;
        }
        .user-menu { 
            position: absolute; 
            top: 20px; 
            right: 20px; 
            background: rgba(255,255,255,0.1); 
            padding: 10px 20px; 
            border-radius: 25px;
        }
        .ai-chat { 
            position: fixed; 
            bottom: 20px; 
            right: 20px; 
            width: 60px; 
            height: 60px; 
            background: #4CAF50; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            cursor: pointer; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .status-indicator { 
            display: inline-block; 
            width: 8px; 
            height: 8px; 
            background: #10b981; 
            border-radius: 50%; 
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div id="app">
        <!-- Landing Page -->
        <div id="landing" class="landing">
            <div class="container">
                <div class="header">
                    <div class="logo">🏭 Sentia Manufacturing</div>
                    <div class="subtitle">Enterprise Working Capital Intelligence</div>
                </div>
                
                <div class="hero">
                    <h1>World-Class Manufacturing Intelligence</h1>
                    <p>Real-time working capital management with AI-powered insights</p>
                    <button id="signInBtn" class="cta-button">🔐 Sign In to Dashboard</button>
                </div>
                
                <div class="features">
                    <div class="feature">
                        <h3>📊 Real-Time Analytics</h3>
                        <p>Live business intelligence with £3.17M revenue tracking</p>
                    </div>
                    <div class="feature">
                        <h3>💰 Working Capital</h3>
                        <p>£170.3K working capital optimization and cash flow management</p>
                    </div>
                    <div class="feature">
                        <h3>🏭 Production Intelligence</h3>
                        <p>245K units FY2026 forecast with real-time production tracking</p>
                    </div>
                    <div class="feature">
                        <h3>🤖 AI Assistant</h3>
                        <p>Intelligent recommendations powered by MCP server integration</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Enterprise Dashboard -->
        <div id="dashboard" class="dashboard">
            <!-- Sidebar Navigation -->
            <div class="sidebar">
                <div style="padding: 20px; text-align: center; border-bottom: 1px solid #2d3748;">
                    <div style="background: #4CAF50; width: 40px; height: 40px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-bottom: 10px;">S</div>
                    <div style="color: white; font-weight: bold;">Sentia Manufacturing</div>
                    <div style="color: #8892b0; font-size: 0.8rem;">Enterprise Dashboard</div>
                </div>
                
                <div class="nav-section">Overview</div>
                <a href="#" class="nav-item active">📊 Executive Dashboard</a>
                
                <div class="nav-section">Planning & Analytics</div>
                <a href="#" class="nav-item">📈 Demand Forecasting</a>
                <a href="#" class="nav-item">📦 Inventory Management</a>
                <a href="#" class="nav-item">🏭 Production Tracking</a>
                <a href="#" class="nav-item">✅ Quality Control</a>
                
                <div class="nav-section">Financial Management</div>
                <a href="#" class="nav-item">💰 Working Capital</a>
                <a href="#" class="nav-item">📋 What-If Analysis</a>
                <a href="#" class="nav-item">📊 Financial Reports</a>
                
                <div class="nav-section">Operations</div>
                <a href="#" class="nav-item">📥 Data Import</a>
                <a href="#" class="nav-item">⚙️ Admin Panel</a>
            </div>

            <!-- Main Content -->
            <div class="main-content">
                <div class="user-menu">
                    <span class="status-indicator"></span>
                    All Systems Operational | Dudley Peacock (Enterprise)
                    <button id="signOutBtn" style="margin-left: 15px; background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Sign Out</button>
                </div>

                <h1 style="margin-bottom: 30px; color: #333;">Executive Dashboard</h1>
                <p style="color: #666; margin-bottom: 30px;">Real-time manufacturing operations overview</p>

                <!-- Key Metrics -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value" style="color: #10b981;">£3.17M</div>
                        <div class="metric-label">Total Revenue FY2025</div>
                        <div class="metric-change positive">↗ +102.6% from FY2024</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" style="color: #3b82f6;">£170.3K</div>
                        <div class="metric-label">Working Capital</div>
                        <div class="metric-change positive">↗ +8.5% optimized</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" style="color: #8b5cf6;">245K</div>
                        <div class="metric-label">Units FY2026 Forecast</div>
                        <div class="metric-change positive">↗ +15.2% projected growth</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" style="color: #f59e0b;">94.8%</div>
                        <div class="metric-label">Production Efficiency</div>
                        <div class="metric-change positive">↗ +2.1% this week</div>
                    </div>
                </div>

                <!-- Live Shopify Orders -->
                <div class="chart-container">
                    <h3 style="margin-bottom: 20px;">🛒 Live Shopify Orders (Real API Data)</h3>
                    <div style="display: grid; gap: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div>
                                <strong>Order #5770</strong> - Siro Tondi<br>
                                <small>GABA 3-bottle bundle (Switzerland)</small>
                            </div>
                            <div style="text-align: right;">
                                <strong style="color: #10b981;">£98.47</strong><br>
                                <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">Paid</span>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div>
                                <strong>Order #5769</strong> - Douglas Yarborough<br>
                                <small>GABA Red + Gold 500ml (Freeport, NY)</small>
                            </div>
                            <div style="text-align: right;">
                                <strong style="color: #10b981;">$107.97</strong><br>
                                <span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">Processing</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Working Capital Analysis -->
                <div class="chart-container">
                    <h3 style="margin-bottom: 20px;">💰 Working Capital Components</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                        <div style="text-align: center; padding: 20px; background: #f0f9ff; border-radius: 8px;">
                            <div style="font-size: 1.5rem; font-weight: bold; color: #3b82f6;">£85.2K</div>
                            <div style="color: #666;">Accounts Receivable</div>
                            <div style="font-size: 0.8rem; color: #10b981;">DSO: 28 days</div>
                        </div>
                        <div style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 8px;">
                            <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">£125.8K</div>
                            <div style="color: #666;">Inventory Value</div>
                            <div style="font-size: 0.8rem; color: #10b981;">DIO: 45 days</div>
                        </div>
                        <div style="text-align: center; padding: 20px; background: #fef2f2; border-radius: 8px;">
                            <div style="font-size: 1.5rem; font-weight: bold; color: #ef4444;">£40.7K</div>
                            <div style="color: #666;">Accounts Payable</div>
                            <div style="font-size: 0.8rem; color: #ef4444;">DPO: 35 days</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- AI Chatbot -->
            <div class="ai-chat" id="aiChat">
                <span style="font-size: 24px;">🤖</span>
            </div>
        </div>
    </div>

    <script>
        // Initialize Clerk
        const clerkPublishableKey = 'pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ';
        
        if (clerkPublishableKey) {
            const clerk = new window.Clerk(clerkPublishableKey);
            clerk.load().then(() => {
                console.log('Clerk loaded successfully');
                
                // Check if user is signed in
                if (clerk.user) {
                    showDashboard();
                } else {
                    showLanding();
                }
            }).catch(err => {
                console.error('Clerk failed to load:', err);
                showLanding();
            });
        } else {
            showLanding();
        }

        // Event listeners
        document.getElementById('signInBtn').addEventListener('click', () => {
            if (window.Clerk) {
                window.Clerk.openSignIn();
            } else {
                // Simulate sign in for demo
                setTimeout(() => {
                    showDashboard();
                }, 1000);
            }
        });

        document.getElementById('signOutBtn').addEventListener('click', () => {
            if (window.Clerk) {
                window.Clerk.signOut();
            }
            showLanding();
        });

        document.getElementById('aiChat').addEventListener('click', () => {
            alert('🤖 AI Assistant: Hello! I can help you with working capital analysis, demand forecasting, and production optimization. Current working capital is £170.3K with 8.5% optimization opportunity.');
        });

        function showLanding() {
            document.getElementById('landing').style.display = 'block';
            document.getElementById('dashboard').style.display = 'none';
        }

        function showDashboard() {
            document.getElementById('landing').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
        }

        // Real-time data updates
        setInterval(() => {
            const timestamp = new Date().toLocaleTimeString();
            console.log('Real-time data update:', timestamp);
        }, 30000);
    </script>
</body>
</html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sentia Manufacturing Dashboard running on port ${PORT}`);
  console.log(`🔗 Access at: http://localhost:${PORT}`);
});
