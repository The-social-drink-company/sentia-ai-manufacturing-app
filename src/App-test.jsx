import React, { useState } from 'react'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

// Simple test components
const ExecutiveDashboard = () => (
  <div className="p-8 bg-slate-800 text-white">
    <h1 className="text-3xl font-bold mb-4">Executive Dashboard</h1>
    <p>This is the Executive Dashboard - WORKING!</p>
  </div>
)

const WhatIfAnalysis = () => (
  <div className="p-8 bg-green-800 text-white">
    <h1 className="text-3xl font-bold mb-4">What-If Analysis</h1>
    <p>This is the What-If Analysis page - NAVIGATION WORKING!</p>
    <div className="mt-4">
      <input type="range" min="0" max="100" className="w-full" />
      <p>Interactive Slider Test</p>
    </div>
  </div>
)

const WorkingCapital = () => (
  <div className="p-8 bg-blue-800 text-white">
    <h1 className="text-3xl font-bold mb-4">Working Capital</h1>
    <p>This is the Working Capital page - NAVIGATION WORKING!</p>
    <div className="mt-4">
      <input type="range" min="0" max="100" className="w-full" />
      <p>Working Capital Slider Test</p>
    </div>
  </div>
)

const LandingPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
    <div className="text-center text-white">
      <h1 className="text-4xl font-bold mb-4">Sentia Manufacturing</h1>
      <p className="text-xl mb-8">Enterprise Dashboard</p>
      <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg">
        Sign In to Dashboard
      </button>
    </div>
  </div>
)

function App() {
  const [currentPage, setCurrentPage] = useState('executive-dashboard')

  console.log('App rendered, currentPage:', currentPage)

  const getActiveComponent = () => {
    console.log('getActiveComponent called with:', currentPage)
    
    switch (currentPage) {
      case 'executive-dashboard':
        console.log('Returning ExecutiveDashboard')
        return <ExecutiveDashboard />
      case 'what-if-analysis':
        console.log('Returning WhatIfAnalysis')
        return <WhatIfAnalysis />
      case 'working-capital':
        console.log('Returning WorkingCapital')
        return <WorkingCapital />
      default:
        console.log('Returning default ExecutiveDashboard')
        return <ExecutiveDashboard />
    }
  }

  const handleNavigation = (pageId) => {
    console.log('Navigation clicked:', pageId)
    setCurrentPage(pageId)
    console.log('State updated to:', pageId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <SignedOut>
        <LandingPage />
      </SignedOut>
      
      <SignedIn>
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-slate-800 p-4">
            <div className="text-white text-xl font-bold mb-8">Sentia Manufacturing</div>
            
            <div className="space-y-2">
              <button
                onClick={() => handleNavigation('executive-dashboard')}
                className={`w-full text-left p-3 rounded ${
                  currentPage === 'executive-dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                📊 Executive Dashboard
              </button>
              
              <button
                onClick={() => handleNavigation('working-capital')}
                className={`w-full text-left p-3 rounded ${
                  currentPage === 'working-capital' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                💰 Working Capital
              </button>
              
              <button
                onClick={() => handleNavigation('what-if-analysis')}
                className={`w-full text-left p-3 rounded ${
                  currentPage === 'what-if-analysis' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                📋 What-If Analysis
              </button>
            </div>
            
            <div className="mt-8 text-slate-400 text-sm">
              Current Page: {currentPage}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Top Bar */}
            <div className="bg-slate-800 p-4 flex justify-between items-center">
              <div className="text-white">
                Navigation Test - Current: {currentPage}
              </div>
              <UserButton />
            </div>
            
            {/* Page Content */}
            <div className="flex-1">
              {getActiveComponent()}
            </div>
          </div>
        </div>
      </SignedIn>
    </div>
  )
}

export default App
