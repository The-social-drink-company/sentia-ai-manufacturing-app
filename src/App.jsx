import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
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
const Dashboard = () => {
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
        <div className="status-indicator">
          <span className="status-dot active"></span>
          <span>System Online</span>
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

// Landing Page Component
const LandingPage = () => {
  const navigate = useNavigate()

  const handleDashboardAccess = () => {
    navigate('/dashboard')
  }

  const handleReportsAccess = () => {
    navigate('/reports')
  }

  const handleSettingsAccess = () => {
    navigate('/settings')
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1>Sentia Manufacturing</h1>
        <p>Enterprise Manufacturing Dashboard</p>
      </header>

      <div className="landing-content">
        <div className="feature-grid">
          <div className="feature-card" onClick={handleDashboardAccess}>
            <h3>Live Dashboard</h3>
            <p>Real-time monitoring of production metrics</p>
            <button className="btn btn-primary">Access Dashboard</button>
          </div>

          <div className="feature-card" onClick={handleReportsAccess}>
            <h3>Analytics & Reports</h3>
            <p>Comprehensive production analytics</p>
            <button className="btn btn-secondary">View Reports</button>
          </div>

          <div className="feature-card" onClick={handleSettingsAccess}>
            <h3>System Settings</h3>
            <p>Configure production parameters</p>
            <button className="btn btn-info">Open Settings</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Reports Component
const Reports = () => {
  return (
    <div className="reports">
      <header className="page-header">
        <h1>Production Reports</h1>
        <Link to="/" className="btn btn-secondary">Back to Home</Link>
      </header>
      <div className="reports-content">
        <p>Production analytics and reporting features coming soon...</p>
      </div>
    </div>
  )
}

// Settings Component
const Settings = () => {
  return (
    <div className="settings">
      <header className="page-header">
        <h1>System Settings</h1>
        <Link to="/" className="btn btn-secondary">Back to Home</Link>
      </header>
      <div className="settings-content">
        <p>System configuration options coming soon...</p>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  const [isLoading, setIsLoading] = useState(true)

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  if (isLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
