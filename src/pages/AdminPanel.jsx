import { devLog } from '../lib/devLog.js';
import React, { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import axios from 'axios'
import ApiKeyManagement from '../components/admin/ApiKeyManagement'
import {
  UserGroupIcon,
  CogIcon,
  KeyIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import '../styles/AdminPanel.css'

function AdminPanel() {
  const { getToken, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const [users, setUsers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('user')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('users')

  const tabs = [
    { id: 'users', name: 'User Management', icon: UserGroupIcon },
    { id: 'api-keys', name: 'API Integrations', icon: KeyIcon },
    { id: 'settings', name: 'System Settings', icon: CogIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ]

  useEffect(() => {
    if (authLoaded && userLoaded && user) {
      fetchUsers()
      fetchInvitations()
    }
  }, [authLoaded, userLoaded, user])

  const fetchUsers = async () => {
    try {
      const token = await getToken()
      if (!token) {
        setError('Authentication token not available')
        return
      }
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await axios.get(`${apiUrl}/admin/users`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setUsers(response.data.users || [])
      setError(null)
    } catch (err) {
      devLog.error('Error fetching users:', err)
      setError(err.response?.data?.message || 'Failed to fetch users')
    }
  }

  const fetchInvitations = async () => {
    try {
      const token = await getToken()
      if (!token) {
        devLog.warn('No token available for fetching invitations')
        return
      }
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await axios.get(`${apiUrl}/admin/invitations`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setInvitations(response.data.invitations || [])
    } catch (err) {
      devLog.error('Error fetching invitations:', err)
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to fetch invitations')
      }
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    try {
      setInviteLoading(true)
      const token = await getToken()
      if (!token) {
        alert('Authentication token not available')
        return
      }
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      await axios.post(`${apiUrl}/admin/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole,
        invitedBy: user.id
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      setInviteEmail('')
      setInviteRole('user')
      fetchInvitations()
      alert('Invitation sent successfully!')
    } catch (err) {
      devLog.error('Error sending invitation:', err)
      alert('Failed to send invitation: ' + (err.response?.data?.error || err.message))
    } finally {
      setInviteLoading(false)
    }
  }

  const approveUser = async (userId) => {
    try {
      const token = await getToken()
      if (!token) {
        alert('Authentication token not available')
        return
      }
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      await axios.post(`${apiUrl}/admin/users/${userId}/approve`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      fetchUsers()
      alert('User approved successfully!')
    } catch (err) {
      devLog.error('Error approving user:', err)
      alert('Failed to approve user: ' + (err.response?.data?.error || err.message))
    }
  }

  const revokeUser = async (userId) => {
    try {
      const token = await getToken()
      if (!token) {
        alert('Authentication token not available')
        return
      }
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      await axios.post(`${apiUrl}/admin/users/${userId}/revoke`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      fetchUsers()
      alert('User access revoked successfully!')
    } catch (err) {
      devLog.error('Error revoking user:', err)
      alert('Failed to revoke user: ' + (err.response?.data?.error || err.message))
    }
  }

  const deleteInvitation = async (invitationId) => {
    try {
      const token = await getToken()
      if (!token) {
        alert('Authentication token not available')
        return
      }
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      await axios.delete(`${apiUrl}/admin/invitations/${invitationId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      fetchInvitations()
      alert('Invitation deleted successfully!')
    } catch (err) {
      devLog.error('Error deleting invitation:', err)
      alert('Failed to delete invitation: ' + (err.response?.data?.error || err.message))
    }
  }

  // Show loading while authentication is loading
  if (!authLoaded || !userLoaded) {
    return (
      <div className="admin-loading">
        <div className="spinner">Loading authentication...</div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="admin-error">
        <h2>Authentication Required</h2>
        <p>Please sign in to access the admin panel.</p>
      </div>
    )
  }

  // Check if user has admin privileges
  if (user?.publicMetadata?.role !== 'admin' && user?.publicMetadata?.role !== 'super_admin') {
    return (
      <div className="admin-error">
        <h2>Access Denied</h2>
        <p>You do not have administrator privileges to access this panel.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner">Loading admin panel...</div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'api-keys':
        return <ApiKeyManagement />
      case 'users':
      default:
        return renderUserManagement()
    }
  }

  const renderUserManagement = () => (
    <>
      {error && (
        <div className="admin-error">
          <p>{error}</p>
        </div>
      )}

      {/* Send Invitation Section */}
      <div className="admin-section">
        <h2>Send Invitation</h2>
        <form onSubmit={sendInvitation} className="invite-form">
          <div className="form-group">
            <label htmlFor="inviteEmail">Email Address:</label>
            <input
              type="email"
              id="inviteEmail"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@company.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="inviteRole">Role:</label>
            <select
              id="inviteRole"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={inviteLoading}
          >
            {inviteLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>

      {/* Pending Invitations */}
      <div className="admin-section">
        <h2>Pending Invitations ({invitations.length})</h2>
        {invitations.length > 0 ? (
          <div className="invitations-table">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Invited By</th>
                  <th>Date Sent</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map(invitation => (
                  <tr key={invitation.id}>
                    <td>{invitation.email}</td>
                    <td>
                      <span className={`role-badge ${invitation.role}`}>
                        {invitation.role}
                      </span>
                    </td>
                    <td>{invitation.invited_by_email}</td>
                    <td>{new Date(invitation.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${invitation.status}`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => deleteInvitation(invitation.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No pending invitations</p>
        )}
      </div>

      {/* User Management */}
      <div className="admin-section">
        <h2>User Management ({users.length})</h2>
        {users.length > 0 ? (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Sign In</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(userItem => (
                  <tr key={userItem.id}>
                    <td>
                      {userItem.first_name && userItem.last_name 
                        ? `${userItem.first_name} ${userItem.last_name}`
                        : userItem.username || 'N/A'
                      }
                    </td>
                    <td>{userItem.email_addresses?.[0]?.email_address || 'N/A'}</td>
                    <td>
                      <span className={`role-badge ${userItem.public_metadata?.role || 'user'}`}>
                        {userItem.public_metadata?.role || 'user'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${userItem.public_metadata?.approved ? 'approved' : 'pending'}`}>
                        {userItem.public_metadata?.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {userItem.last_sign_in_at 
                        ? new Date(userItem.last_sign_in_at).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td>
                      <div className="action-buttons">
                        {!userItem.public_metadata?.approved && userItem.public_metadata?.role !== 'admin' && (
                          <button
                            onClick={() => approveUser(userItem.id)}
                            className="btn btn-success btn-sm"
                          >
                            Approve
                          </button>
                        )}
                        {userItem.public_metadata?.approved && userItem.public_metadata?.role !== 'admin' && (
                          <button
                            onClick={() => revokeUser(userItem.id)}
                            className="btn btn-warning btn-sm"
                          >
                            Revoke
                          </button>
                        )}
                        {userItem.public_metadata?.role === 'admin' && (
                          <span className="admin-indicator">Admin User</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No users found</p>
        )}
      </div>
    </>
  )

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Enterprise Admin Portal</h1>
        <p>Comprehensive system administration and integration management</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default AdminPanel