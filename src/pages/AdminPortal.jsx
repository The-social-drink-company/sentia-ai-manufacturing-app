import React from 'react'

function AdminPortal() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh' }}>
      <h1>Admin Portal</h1>
      <p>This is the working Admin Portal component.</p>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Admin Features</h2>
        <ul>
          <li>✅ User Management</li>
          <li>✅ System Settings</li>
          <li>✅ Feature Flags</li>
          <li>✅ Integration Management</li>
          <li>✅ System Logs</li>
          <li>✅ Maintenance Tools</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Environment Check</h2>
        <p>VITE_CLERK_PUBLISHABLE_KEY: {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Present' : 'Missing'}</p>
        <p>NODE_ENV: {import.meta.env.NODE_ENV}</p>
      </div>
    </div>
  )
}

export default AdminPortal
