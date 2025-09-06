import { devLog } from '../../lib/devLog.js';
import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useAuthRole } from '../../hooks/useAuthRole.jsx'
import { logError } from '../../lib/logger'
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Calendar,
  MapPin,
  RefreshCw,
  Trash2
} from 'lucide-react'

export default function SecurityStatus() {
  const { getToken } = useAuth()
  const { user, role } = useAuthRole()
  const [loading, setLoading] = useState(true)
  const [securityStatus, setSecurityStatus] = useState(null)
  const [sessions, setSessions] = useState([])
  const [showRecentActivity, setShowRecentActivity] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch security status and session data
  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        const token = await getToken()
        
        // Fetch security status
        const statusResponse = await fetch('/api/auth/security/status', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          setSecurityStatus(statusData.security)
        }

        // Fetch sessions
        const sessionsResponse = await fetch('/api/auth/sessions', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json()
          setSessions(sessionsData.sessions)
        }
        
      } catch (error) {
<<<<<<< HEAD
        logError('Failed to fetch security data', error, { component: 'SecurityStatus' })
=======
        devLog.error('Failed to fetch security data:', error)
>>>>>>> 320fc348c3f5d778596ec72fe2dbced535701ad7
        setError('Failed to load security information')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchSecurityData()
    }
  }, [user, getToken])

  // Revoke session
  const handleRevokeSession = async (sessionId) => {
    setActionLoading(true)
    try {
      const token = await getToken()
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
      } else {
        throw new Error('Failed to revoke session')
      }
    } catch (error) {
<<<<<<< HEAD
      logError('Failed to revoke session', error, { component: 'SecurityStatus', sessionId })
=======
      devLog.error('Failed to revoke session:', error)
>>>>>>> 320fc348c3f5d778596ec72fe2dbced535701ad7
      setError('Failed to revoke session')
    } finally {
      setActionLoading(false)
    }
  }

  // Revoke all other sessions
  const handleRevokeAllOthers = async () => {
    setActionLoading(true)
    try {
      const token = await getToken()
      const response = await fetch('/api/auth/sessions?except_current=true', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        // Refresh sessions list
        const sessionsResponse = await fetch('/api/auth/sessions', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json()
          setSessions(sessionsData.sessions)
        }
      } else {
        throw new Error('Failed to revoke sessions')
      }
    } catch (error) {
<<<<<<< HEAD
      logError('Failed to revoke sessions', error, { component: 'SecurityStatus' })
=======
      devLog.error('Failed to revoke sessions:', error)
>>>>>>> 320fc348c3f5d778596ec72fe2dbced535701ad7
      setError('Failed to revoke sessions')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading security information...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Account Status Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Account Security</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Account Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Account Status</span>
              <div className="flex items-center">
                {securityStatus?.accountLocked ? (
                  <>
                    <XCircle className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600">Locked</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Active</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Role</span>
              <span className="text-sm text-gray-900 capitalize">{role}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Failed Login Attempts</span>
              <span className={`text-sm ${securityStatus?.failedLoginCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                {securityStatus?.failedLoginCount || 0}
              </span>
            </div>
          </div>

          {/* Password Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Password Last Changed</span>
              <span className="text-sm text-gray-900">
                {securityStatus?.passwordLastChanged 
                  ? new Date(securityStatus.passwordLastChanged).toLocaleDateString()
                  : 'Never'
                }
              </span>
            </div>
            
            {securityStatus?.lastFailedLogin && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Last Failed Login</span>
                <span className="text-sm text-gray-900">
                  {new Date(securityStatus.lastFailedLogin).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Monitor className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Active Sessions</h2>
          </div>
          
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAllOthers}
              disabled={actionLoading}
              className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              End All Other Sessions
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500">No active sessions found.</p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {session.device_name?.toLowerCase().includes('mobile') ? (
                      <Smartphone className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Monitor className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {session.device_name || 'Unknown Device'}
                      {session.is_current && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {session.ip_address}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Last used: {new Date(session.last_used_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                {!session.is_current && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={actionLoading}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    End Session
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Recent Security Activity</h2>
          </div>
          
          <button
            onClick={() => setShowRecentActivity(!showRecentActivity)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {showRecentActivity ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Details
              </>
            )}
          </button>
        </div>
        
        {showRecentActivity && securityStatus?.recentActivity && (
          <div className="space-y-2">
            {securityStatus.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity.</p>
            ) : (
              securityStatus.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {activity.action.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <div>IP: {activity.ip_address}</div>
                      <div>Agent: {activity.user_agent}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {!showRecentActivity && (
          <p className="text-sm text-gray-500">
            Click "Show Details" to view your recent security activity.
          </p>
        )}
      </div>
      
      {/* Security Recommendations */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-amber-800 mb-2">
              Security Recommendations
            </h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Regularly review and end unused sessions</li>
              <li>• Use unique, strong passwords</li>
              <li>• Be cautious when accessing your account from public networks</li>
              <li>• Report any suspicious account activity immediately</li>
              {securityStatus?.failedLoginCount > 0 && (
                <li className="font-medium">• Recent failed login attempts detected - review your account security</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}