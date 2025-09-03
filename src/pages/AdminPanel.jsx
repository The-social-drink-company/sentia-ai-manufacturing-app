import React, { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import axios from 'axios'
import '../styles/AdminPanel.css'

function AdminPanel() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [users, setUsers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('user')
  const [inviteLoading, setInviteLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchInvitations()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = await getToken()
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(response.data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to fetch users')
    }
  }

  const fetchInvitations = async () => {
    try {
      const token = await getToken()
      const response = await axios.get('/api/admin/invitations', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setInvitations(response.data.invitations || [])
    } catch (err) {
      console.error('Error fetching invitations:', err)
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
      await axios.post('/api/admin/invite', {
        email: inviteEmail.trim(),
        role: inviteRole,
        invitedBy: user.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setInviteEmail('')
      setInviteRole('user')
      fetchInvitations()
      alert('Invitation sent successfully!')
    } catch (err) {
      console.error('Error sending invitation:', err)
      alert('Failed to send invitation: ' + (err.response?.data?.error || err.message))
    } finally {
      setInviteLoading(false)
    }
  }

  const approveUser = async (userId) => {
    try {
      const token = await getToken()
      await axios.post(`/api/admin/users/${userId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchUsers()
      alert('User approved successfully!')
    } catch (err) {
      console.error('Error approving user:', err)
      alert('Failed to approve user: ' + (err.response?.data?.error || err.message))
    }
  }

  const revokeUser = async (userId) => {
    try {
      const token = await getToken()
      await axios.post(`/api/admin/users/${userId}/revoke`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchUsers()
      alert('User access revoked successfully!')
    } catch (err) {
      console.error('Error revoking user:', err)
      alert('Failed to revoke user: ' + (err.response?.data?.error || err.message))
    }
  }

  const deleteInvitation = async (invitationId) => {
    try {
      const token = await getToken()
      await axios.delete(`/api/admin/invitations/${invitationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchInvitations()
      alert('Invitation deleted successfully!')
    } catch (err) {
      console.error('Error deleting invitation:', err)
      alert('Failed to delete invitation: ' + (err.response?.data?.error || err.message))
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner">Loading admin panel...</div>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>Manage users and access permissions for the Sentia Manufacturing Dashboard</p>
      </div>

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
    </div>
  )
}

export default AdminPanel