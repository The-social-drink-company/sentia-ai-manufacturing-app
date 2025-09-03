import React, { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import axios from 'axios'
import '../styles/SentiaTheme.css'
import '../styles/SentiaDashboard.css'

function Dashboard() {
  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()
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

      // Get auth token if signed in
      const token = isSignedIn ? await getToken() : null
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
      <div className="sentia-loading">
        <div className="sentia-spinner"></div>
        <p>Loading manufacturing data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sentia-error">
        <div className="sentia-error-content">
          <h2>System Error</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="sentia-btn sentia-btn-primary">
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sentia-dashboard">
      <div className="sentia-container">
        {/* Dashboard Header */}
        <div className="sentia-dashboard-header">
          <div className="sentia-dashboard-title">
            <h1>Manufacturing Operations</h1>
            <p>Real-time production monitoring and resource management</p>
          </div>
          {isSignedIn && user && (
            <div className="sentia-user-info">
              <div className="sentia-user-avatar">
                {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0) || 'U'}
              </div>
              <div className="sentia-user-details">
                <span className="sentia-user-name">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.emailAddresses[0]?.emailAddress
                  }
                </span>
                <span className="sentia-user-role">
                  {user.publicMetadata?.role === 'admin' ? 'Administrator' : 'Operator'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* System Status Grid */}
        <div className="sentia-grid sentia-grid-3">
          <div className="sentia-card">
            <div className="sentia-card-header">
              <h3 className="sentia-card-title">System Status</h3>
            </div>
            <div className="sentia-card-content">
              <div className="sentia-status-grid">
                <div className="sentia-status-item">
                  <div className="sentia-status-label">API Connection</div>
                  <div className={`sentia-status ${apiStatus ? 'sentia-status-success' : 'sentia-status-error'}`}>
                    {apiStatus ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
                <div className="sentia-status-item">
                  <div className="sentia-status-label">Database</div>
                  <div className={`sentia-status ${dbStatus?.success ? 'sentia-status-success' : 'sentia-status-error'}`}>
                    {dbStatus?.success ? 'PostgreSQL Active' : 'Connection Failed'}
                  </div>
                </div>
                {dbStatus?.timestamp && (
                  <div className="sentia-status-timestamp">
                    Last updated: {new Date(dbStatus.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sentia-card">
            <div className="sentia-card-header">
              <h3 className="sentia-card-title">Active Jobs</h3>
              <div className="sentia-card-badge">{jobs.length}</div>
            </div>
            <div className="sentia-card-content">
              {jobs.length > 0 ? (
                <div className="sentia-jobs-list">
                  {jobs.slice(0, 5).map(job => (
                    <div key={job.id} className="sentia-job-item">
                      <div className="sentia-job-info">
                        <div className="sentia-job-name">{job.name}</div>
                        <div className="sentia-job-meta">ID: {job.id}</div>
                      </div>
                      <div className={`sentia-status sentia-status-${job.status === 'completed' ? 'success' : job.status === 'in_progress' ? 'warning' : 'pending'}`}>
                        {job.status}
                      </div>
                    </div>
                  ))}
                  {jobs.length > 5 && (
                    <div className="sentia-more-items">
                      +{jobs.length - 5} more jobs
                    </div>
                  )}
                </div>
              ) : (
                <div className="sentia-empty-state">
                  <p>No active manufacturing jobs</p>
                  <small>Jobs will appear here when production is scheduled</small>
                </div>
              )}
            </div>
          </div>

          <div className="sentia-card">
            <div className="sentia-card-header">
              <h3 className="sentia-card-title">Resources</h3>
              <div className="sentia-card-badge">{resources.length}</div>
            </div>
            <div className="sentia-card-content">
              {resources.length > 0 ? (
                <div className="sentia-resources-list">
                  {resources.slice(0, 5).map(resource => (
                    <div key={resource.id} className="sentia-resource-item">
                      <div className="sentia-resource-info">
                        <div className="sentia-resource-name">{resource.name}</div>
                        <div className="sentia-resource-meta">{resource.type}</div>
                      </div>
                      <div className="sentia-resource-status">
                        <div className="sentia-status-dot sentia-status-success"></div>
                        Active
                      </div>
                    </div>
                  ))}
                  {resources.length > 5 && (
                    <div className="sentia-more-items">
                      +{resources.length - 5} more resources
                    </div>
                  )}
                </div>
              ) : (
                <div className="sentia-empty-state">
                  <p>No resources configured</p>
                  <small>Manufacturing resources will be listed here</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="sentia-dashboard-actions">
          <button 
            onClick={fetchDashboardData} 
            className="sentia-btn sentia-btn-ghost"
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard