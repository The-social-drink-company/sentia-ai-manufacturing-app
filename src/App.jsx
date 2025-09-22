import React, { useState, useEffect } from 'react'
import './Dashboard.css'

// Loading Component with 10 stages
const LoadingScreen = ({ onComplete }) => {
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState(0)
  
  const stages = [
    'Initializing System...',
    'Loading Manufacturing Data...',
    'Connecting to Production Lines...',
    'Authenticating User...',
    'Loading Dashboard Components...',
    'Syncing Real-time Data...',
    'Configuring Analytics...',
    'Loading Charts and Graphs...',
    'Finalizing Interface...',
    'Ready!'
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 1
      })
    }, 50)

    return () => clearInterval(timer)
  }, [onComplete])

  useEffect(() => {
    setStage(Math.floor(progress / 10))
  }, [progress])

  return (
    <div className="loading-screen">
      <div className="loading-container">
        <h1>Sentia Manufacturing Dashboard</h1>
        <div className="loading-bar">
          <div className="loading-progress" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="loading-stage">{stages[stage] || stages[9]}</p>
        <p className="loading-percent">{progress}%</p>
      </div>
    </div>
  )
}

// Dashboard Component
const Dashboard = ({ onBack }) => {
  const [liveData, setLiveData] = useState({
    production: 0,
    efficiency: 0,
    quality: 0,
    temperature: 0,
    pressure: 0,
    speed: 0
  })

  useEffect(() => {
    // Simulate live data updates
    const interval = setInterval(() => {
      setLiveData({
        production: Math.floor(Math.random() * 1000) + 500,
        efficiency: Math.floor(Math.random() * 30) + 70,
        quality: Math.floor(Math.random() * 10) + 90,
        temperature: Math.floor(Math.random() * 20) + 180,
        pressure: Math.floor(Math.random() * 50) + 100,
        speed: Math.floor(Math.random() * 500) + 1000
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Sentia Manufacturing Dashboard</h1>
        <div className="header-controls">
          <div className="status-indicator">
            <span className="status-dot active"></span>
            <span>System Online</span>
          </div>
          <button className="btn btn-secondary" onClick={onBack}>Back to Home</button>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="metric-card">
          <h3>Production Output</h3>
          <div className="metric-value">{liveData.production}</div>
          <div className="metric-unit">units/hour</div>
        </div>

        <div className="metric-card">
          <h3>Efficiency</h3>
          <div className="metric-value">{liveData.efficiency}%</div>
          <div className="metric-unit">overall</div>
        </div>

        <div className="metric-card">
          <h3>Quality Score</h3>
          <div className="metric-value">{liveData.quality}%</div>
          <div className="metric-unit">defect rate</div>
        </div>

        <div className="metric-card">
          <h3>Temperature</h3>
          <div className="metric-value">{liveData.temperature}°C</div>
          <div className="metric-unit">average</div>
        </div>

        <div className="metric-card">
          <h3>Pressure</h3>
          <div className="metric-value">{liveData.pressure}</div>
          <div className="metric-unit">PSI</div>
        </div>

        <div className="metric-card">
          <h3>Line Speed</h3>
          <div className="metric-value">{liveData.speed}</div>
          <div className="metric-unit">RPM</div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-primary">Start Production</button>
        <button className="btn btn-secondary">Stop Production</button>
        <button className="btn btn-warning">Emergency Stop</button>
        <button className="btn btn-info">Generate Report</button>
      </div>
    </div>
  )
}

// Reports Component
const Reports = ({ onBack }) => {
  return (
    <div className="reports">
      <header className="page-header">
        <h1>Production Reports</h1>
        <button className="btn btn-secondary" onClick={onBack}>Back to Home</button>
      </header>
      <div className="reports-content">
        <div className="report-grid">
          <div className="report-card">
            <h3>Daily Production Report</h3>
            <p>Today's production metrics and performance analysis</p>
            <button className="btn btn-primary">View Report</button>
          </div>
          <div className="report-card">
            <h3>Quality Analysis</h3>
            <p>Quality control metrics and defect tracking</p>
            <button className="btn btn-primary">View Report</button>
          </div>
          <div className="report-card">
            <h3>Efficiency Trends</h3>
            <p>Historical efficiency data and trend analysis</p>
            <button className="btn btn-primary">View Report</button>
          </div>
          <div className="report-card">
            <h3>Maintenance Schedule</h3>
            <p>Equipment maintenance logs and schedules</p>
            <button className="btn btn-primary">View Report</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Component
const Settings = ({ onBack }) => {
  const [settings, setSettings] = useState({
    autoRefresh: true,
    alertsEnabled: true,
    theme: 'light',
    refreshInterval: 5
  })

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="settings">
      <header className="page-header">
        <h1>System Settings</h1>
        <button className="btn btn-secondary" onClick={onBack}>Back to Home</button>
      </header>
      <div className="settings-content">
        <div className="settings-grid">
          <div className="setting-group">
            <h3>Display Settings</h3>
            <div className="setting-item">
              <label>
                <input 
                  type="checkbox" 
                  checked={settings.autoRefresh}
                  onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                />
                Auto-refresh data
              </label>
            </div>
            <div className="setting-item">
              <label>
                Refresh interval (seconds):
                <input 
                  type="number" 
                  value={settings.refreshInterval}
                  onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                  min="1"
                  max="60"
                />
              </label>
            </div>
          </div>
          
          <div className="setting-group">
            <h3>Notifications</h3>
            <div className="setting-item">
              <label>
                <input 
                  type="checkbox" 
                  checked={settings.alertsEnabled}
                  onChange={(e) => handleSettingChange('alertsEnabled', e.target.checked)}
                />
                Enable alerts
              </label>
            </div>
          </div>
          
          <div className="setting-group">
            <h3>Appearance</h3>
            <div className="setting-item">
              <label>
                Theme:
                <select 
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Landing Page Component
const LandingPage = ({ onNavigate }) => {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1>Sentia Manufacturing</h1>
        <p>Enterprise Manufacturing Dashboard</p>
      </header>

      <div className="landing-content">
        <div className="feature-grid">
          <div className="feature-card" onClick={() => onNavigate('dashboard')}>
            <div className="feature-icon">📊</div>
            <h3>Live Dashboard</h3>
            <p>Real-time monitoring of production metrics and system status</p>
            <button className="btn btn-primary">Access Dashboard</button>
          </div>

          <div className="feature-card" onClick={() => onNavigate('reports')}>
            <div className="feature-icon">📈</div>
            <h3>Analytics & Reports</h3>
            <p>Comprehensive production analytics and performance reports</p>
            <button className="btn btn-secondary">View Reports</button>
          </div>

          <div className="feature-card" onClick={() => onNavigate('settings')}>
            <div className="feature-icon">⚙️</div>
            <h3>System Settings</h3>
            <p>Configure production parameters and system preferences</p>
            <button className="btn btn-info">Open Settings</button>
          </div>

          <div className="feature-card" onClick={() => onNavigate('quality')}>
            <div className="feature-icon">✅</div>
            <h3>Quality Control</h3>
            <p>Monitor quality metrics and defect tracking systems</p>
            <button className="btn btn-success">Quality Control</button>
          </div>

          <div className="feature-card" onClick={() => onNavigate('maintenance')}>
            <div className="feature-icon">🔧</div>
            <h3>Maintenance</h3>
            <p>Equipment maintenance schedules and service logs</p>
            <button className="btn btn-warning">Maintenance</button>
          </div>

          <div className="feature-card" onClick={() => onNavigate('alerts')}>
            <div className="feature-icon">🚨</div>
            <h3>Alerts & Notifications</h3>
            <p>System alerts and notification management center</p>
            <button className="btn btn-danger">View Alerts</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('home')

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  const handleNavigate = (page) => {
    setCurrentPage(page)
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
  }

  if (isLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onBack={handleBackToHome} />
      case 'reports':
        return <Reports onBack={handleBackToHome} />
      case 'settings':
        return <Settings onBack={handleBackToHome} />
      case 'quality':
      case 'maintenance':
      case 'alerts':
        return (
          <div className="coming-soon">
            <header className="page-header">
              <h1>{currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}</h1>
              <button className="btn btn-secondary" onClick={handleBackToHome}>Back to Home</button>
            </header>
            <div className="coming-soon-content">
              <h2>Coming Soon</h2>
              <p>This feature is currently under development and will be available in the next release.</p>
            </div>
          </div>
        )
      default:
        return <LandingPage onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  )
}

export default App
