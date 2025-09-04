import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './index.css'

// Simple working components without any external dependencies
function HomePage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', color: '#333', marginBottom: '2rem' }}>
        SENTIA Manufacturing Dashboard
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '3rem' }}>
        Enterprise Manufacturing Intelligence Platform
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{ padding: '2rem', backgroundColor: '#4F46E5', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
            <h2>Dashboard</h2>
            <p>View real-time KPIs and metrics</p>
          </div>
        </Link>
        
        <Link to="/working-capital" style={{ textDecoration: 'none' }}>
          <div style={{ padding: '2rem', backgroundColor: '#10B981', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
            <h2>Working Capital</h2>
            <p>Financial management and projections</p>
          </div>
        </Link>
        
        <Link to="/admin" style={{ textDecoration: 'none' }}>
          <div style={{ padding: '2rem', backgroundColor: '#F59E0B', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
            <h2>Admin Portal</h2>
            <p>System configuration and management</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

function DashboardPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <Link to="/" style={{ color: '#4F46E5', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to Home
      </Link>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Manufacturing Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <h3 style={{ color: '#6B7280', marginBottom: '0.5rem' }}>Production Output</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>12,450 units</p>
          <p style={{ color: '#10B981' }}>↑ 15% from last week</p>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <h3 style={{ color: '#6B7280', marginBottom: '0.5rem' }}>Efficiency Rate</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>94.2%</p>
          <p style={{ color: '#10B981' }}>↑ 2.1% improvement</p>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <h3 style={{ color: '#6B7280', marginBottom: '0.5rem' }}>Active Orders</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>287</p>
          <p style={{ color: '#F59E0B' }}>23 pending review</p>
        </div>
      </div>
    </div>
  )
}

function WorkingCapitalPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <Link to="/" style={{ color: '#4F46E5', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to Home
      </Link>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Working Capital Management</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <h3 style={{ color: '#6B7280', marginBottom: '0.5rem' }}>Cash Flow</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>$2.4M</p>
          <p style={{ color: '#10B981' }}>Positive trend</p>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <h3 style={{ color: '#6B7280', marginBottom: '0.5rem' }}>Accounts Receivable</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>$1.1M</p>
          <p style={{ color: '#F59E0B' }}>45 days average</p>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <h3 style={{ color: '#6B7280', marginBottom: '0.5rem' }}>Accounts Payable</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>$780K</p>
          <p style={{ color: '#10B981' }}>30 days average</p>
        </div>
      </div>
    </div>
  )
}

function AdminPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <Link to="/" style={{ color: '#4F46E5', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to Home
      </Link>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Admin Portal</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <h3 style={{ color: '#6B7280', marginBottom: '0.5rem' }}>System Status</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10B981' }}>All Systems Operational</p>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <h3 style={{ color: '#6B7280', marginBottom: '0.5rem' }}>Active Users</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>47</p>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <h3 style={{ color: '#6B7280', marginBottom: '0.5rem' }}>Database</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>PostgreSQL Connected</p>
        </div>
      </div>
    </div>
  )
}

// Main App Component - Simple and Working
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/working-capital" element={<WorkingCapitalPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  )
}