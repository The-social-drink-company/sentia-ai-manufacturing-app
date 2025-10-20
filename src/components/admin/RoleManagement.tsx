/**
 * Role Management Component
 *
 * Admin interface for managing user roles and permissions.
 * Displays user list with role selector and permission matrix.
 *
 * Features:
 * - User list with current roles
 * - Role selector dropdown with permission preview
 * - Permission matrix display
 * - Confirmation dialogs for role changes
 * - Real-time updates via optimistic UI
 *
 * @module src/components/admin/RoleManagement
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Users,
  Shield,
  ChevronDown,
  Check,
  X,
  AlertTriangle,
  Info,
  Trash2,
} from 'lucide-react'
import { useAuthRole } from '@/hooks/useAuthRole'

interface User {
  id: string
  email: string
  fullName: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  lastLoginAt: string | null
  createdAt: string
  roleInfo: RoleInfo
}

interface RoleInfo {
  label: string
  description: string
  permissions: string[]
  capabilities: string[]
  restrictions?: string[]
}

interface PermissionMatrix {
  [role: string]: RoleInfo
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export default function RoleManagement() {
  const { hasPermission } = useAuthRole()
  const [users, setUsers] = useState<User[]>([])
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>({})
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')

  // Check if user has admin/owner permissions
  const canManageUsers =
    hasPermission('users.update') || hasPermission('users.remove')

  useEffect(() => {
    fetchUsers()
    fetchPermissionMatrix()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        setUsers(data.data.users)
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissionMatrix = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/roles/permissions`, {
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        setPermissionMatrix(data.data.roles)
      }
    } catch (error) {
      console.error('Failed to fetch permission matrix:', error)
    }
  }

  const handleRoleChange = (user: User) => {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setShowRoleModal(true)
  }

  const confirmRoleChange = async () => {
    if (!selectedUser || !selectedRole || selectedRole === selectedUser.role) {
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${selectedUser.id}/role`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: selectedRole }),
        }
      )

      const data = await response.json()

      if (data.success) {
        toast.success(`Role updated to ${selectedRole}`)
        fetchUsers() // Refresh list
        setShowRoleModal(false)
      } else {
        toast.error(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      toast.error('Failed to update role')
    }
  }

  const handleRemoveUser = async (user: User) => {
    if (
      !confirm(
        `Are you sure you want to remove ${user.fullName || user.email} from the organization?`
      )
    ) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('User removed successfully')
        fetchUsers() // Refresh list
      } else {
        toast.error(data.error || 'Failed to remove user')
      }
    } catch (error) {
      console.error('Failed to remove user:', error)
      toast.error('Failed to remove user')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'member':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!canManageUsers) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-900">
              Insufficient Permissions
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              You need admin or owner role to manage users.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage team members and their roles
          </p>
        </div>
        <button
          onClick={() => setShowPermissionMatrix(!showPermissionMatrix)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Shield className="w-4 h-4" />
          {showPermissionMatrix ? 'Hide' : 'Show'} Permission Matrix
        </button>
      </div>

      {/* Permission Matrix */}
      {showPermissionMatrix && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Permission Matrix
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(permissionMatrix).map(([role, info]) => (
              <div
                key={role}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(role)}`}
                  >
                    {info.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 uppercase">
                    Capabilities:
                  </p>
                  <ul className="space-y-1">
                    {info.capabilities.slice(0, 4).map((capability, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-600 flex items-start gap-1"
                      >
                        <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{capability}</span>
                      </li>
                    ))}
                  </ul>
                  {info.restrictions && info.restrictions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-700 uppercase">
                        Restrictions:
                      </p>
                      <ul className="space-y-1 mt-1">
                        {info.restrictions.slice(0, 2).map((restriction, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-gray-600 flex items-start gap-1"
                          >
                            <X className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                            <span>{restriction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            Team Members ({users.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {users.map(user => (
            <div
              key={user.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {user.fullName
                      ? user.fullName.charAt(0).toUpperCase()
                      : user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.fullName || user.email}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.lastLoginAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last login:{' '}
                        {new Date(user.lastLoginAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role Badge/Selector */}
                  {user.role === 'owner' ? (
                    <span
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.roleInfo.label}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(user)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getRoleBadgeColor(user.role)} hover:shadow-md transition-all flex items-center gap-2`}
                    >
                      {user.roleInfo.label}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}

                  {/* Remove Button */}
                  {user.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveUser(user)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Role for {selectedUser.fullName || selectedUser.email}
            </h3>

            <div className="space-y-3 mb-6">
              {['admin', 'member', 'viewer'].map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedRole === role
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRoleBadgeColor(role)}`}
                    >
                      {permissionMatrix[role]?.label}
                    </span>
                    {selectedRole === role && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {permissionMatrix[role]?.description}
                  </p>
                  <div className="text-xs text-gray-500">
                    {permissionMatrix[role]?.capabilities
                      .slice(0, 3)
                      .map((cap, idx) => (
                        <div key={idx} className="flex items-start gap-1 mt-1">
                          <Check className="w-3 h-3 text-green-600 mt-0.5" />
                          <span>{cap}</span>
                        </div>
                      ))}
                  </div>
                </button>
              ))}
            </div>

            {selectedRole !== selectedUser.role && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">
                    Role Change Impact
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    This will immediately update the user's permissions. They may
                    lose access to certain features or gain new capabilities.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={confirmRoleChange}
                disabled={selectedRole === selectedUser.role}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Change
              </button>
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
