import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Sentia Manufacturing Dashboard</h1>
        <p>Enterprise Manufacturing Intelligence Platform</p>
        <div className="dashboard-grid">
          <div className="card">
            <h3>Production Overview</h3>
            <p>Real-time production metrics and KPIs</p>
          </div>
          <div className="card">
            <h3>Inventory Management</h3>
            <p>Stock levels and supply chain optimization</p>
          </div>
          <div className="card">
            <h3>Quality Control</h3>
            <p>Quality metrics and compliance tracking</p>
          </div>
          <div className="card">
            <h3>Financial Analytics</h3>
            <p>Working capital and financial performance</p>
          </div>
        </div>
      </header>
    </div>
  )
}

export default App
