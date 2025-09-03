import React, { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import axios from 'axios'
import '../styles/Dashboard.css'

function Dashboard() {
  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  
  // Use Clerk auth if available
  let getToken = null
  let isSignedIn = false
  let user = null
  
  try {
    if (PUBLISHABLE_KEY) {
      const auth = useAuth()
      const userObj = useUser()
      getToken = auth.getToken
      isSignedIn = auth.isSignedIn
      user = userObj.user
    }
  } catch (error) {
    console.warn('Clerk not available:', error.message)
  }
  const [apiStatus, setApiStatus] = useState(null)
  const [dbStatus, setDbStatus] = useState(null)
  const [jobs, setJobs] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get auth token if signed in and Clerk is available
      const token = (isSignedIn && getToken) ? await getToken() : null
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      // Fetch API status
      const apiResponse = await axios.get('/api/test', { headers })
      setApiStatus(apiResponse.data)

      // Fetch database status
      const dbResponse = await axios.get('/api/db-test', { headers })
      setDbStatus(dbResponse.data)

      // Fetch jobs (fetch regardless of auth status for demo)
      try {
        const jobsResponse = await axios.get('/api/jobs', { headers })
        setJobs(jobsResponse.data.jobs || [])
      } catch (jobsError) {
        // Jobs table might not exist yet
        setJobs([])
      }

      // Fetch resources (fetch regardless of auth status for demo)
      try {
        const resourcesResponse = await axios.get('/api/resources', { headers })
        setResources(resourcesResponse.data.resources || [])
      } catch (resourcesError) {
        // Resources table might not exist yet
        setResources([])
      }

    } catch (err) {
      setError(`Failed to fetch dashboard data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Dashboard Error</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData}>Retry</button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Sentia Manufacturing Dashboard</h1>
        <p>Node.js/Express API with React Frontend</p>
        {PUBLISHABLE_KEY && isSignedIn && user && (
          <div className="user-welcome">
            <p>Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress}!</p>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>System Status</h3>
          <div className="status-item">
            <span className="status-label">API:</span>
            <span className={`status-value ${apiStatus ? 'success' : 'error'}`}>
              {apiStatus ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Database:</span>
            <span className={`status-value ${dbStatus?.success ? 'success' : 'error'}`}>
              {dbStatus?.success ? 'Connected to Neon PostgreSQL' : 'Disconnected'}
            </span>
          </div>
          {dbStatus?.timestamp && (
            <small>Last checked: {new Date(dbStatus.timestamp).toLocaleString()}</small>
          )}
        </div>

        <div className="dashboard-card">
          <h3>Jobs ({jobs.length})</h3>
          {jobs.length > 0 ? (
            <ul className="jobs-list">
              {jobs.slice(0, 5).map(job => (
                <li key={job.id} className="job-item">
                  <span className="job-name">{job.name}</span>
                  <span className="job-status">{job.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No jobs found. Database tables may need initialization.</p>
          )}
        </div>

        <div className="dashboard-card">
          <h3>Resources ({resources.length})</h3>
          {resources.length > 0 ? (
            <ul className="resources-list">
              {resources.slice(0, 5).map(resource => (
                <li key={resource.id} className="resource-item">
                  <span className="resource-name">{resource.name}</span>
                  <span className="resource-type">{resource.type}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No resources found. Database tables may need initialization.</p>
          )}
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={fetchDashboardData} className="refresh-btn">
          Refresh Dashboard
        </button>
      </div>
    </div>
  )
}

export default Dashboard