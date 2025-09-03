import React from 'react'

export default function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1>Sentia Manufacturing Dashboard</h1>
        </div>
        <div className="header-right">
          <div className="auth-status">
            <span>Demo Mode (Auth Disabled)</span>
          </div>
        </div>
      </div>
    </header>
  )
}