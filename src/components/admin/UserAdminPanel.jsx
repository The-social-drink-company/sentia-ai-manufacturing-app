import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { hasPermission, PERMISSIONS, ROLES } from '../../utils/rolePermissions';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


const UserAdminPanel = () => {
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteLoading, setInviteLoading] = useState(false);

  const userRole = user?.publicMetadata?.role;

  const tabs = [
    { 
      id: 'users', 
      name: 'Users', 
      icon: UserGroupIcon,
      permission: PERMISSIONS.USERS_VIEW 
    },
    { 
      id: 'invitations', 
      name: 'Invitations', 
      icon: EnvelopeIcon,
      permission: PERMISSIONS.USERS_INVITE 
    },
    { 
      id: 'roles', 
      name: 'Roles & Permissions', 
      icon: ShieldCheckIcon,
      permission: PERMISSIONS.USERS_ROLES 
    }
  ];

  useEffect(() => {
    if (authLoaded && userLoaded && user) {
      fetchUsers();
      fetchInvitations();
    }
  }, [authLoaded, userLoaded, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/invitations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      logError('Failed to fetch invitations:', err);
    }
  };

  const sendInvitation = async (e) => {
    e.preventDefault();
    if (!hasPermission(userRole, PERMISSIONS.USERS_INVITE)) {
      setError('You do not have permission to send invitations');
      return;
    }

    try {
      setInviteLoading(true);
      const token = await getToken();
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      if (response.ok) {
        setInviteEmail('');
        setInviteRole('user');
        fetchInvitations();
        setError(null);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to send invitation');
      }
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    if (!hasPermission(userRole, PERMISSIONS.USERS_ROLES)) {
      setError('You do not have permission to modify user roles');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        fetchUsers();
        setError(null);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update user role');
      }
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  const approveUser = async (userId) => {
    if (!hasPermission(userRole, PERMISSIONS.USERS_APPROVE)) {
      setError('You do not have permission to approve users');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchUsers();
        setError(null);
      }
    } catch (err) {
      setError('Failed to approve user');
    }
  };

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Send Invitation Section */}
      {hasPermission(userRole, PERMISSIONS.USERS_INVITE) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Send User Invitation</h3>
          <form onSubmit={sendInvitation} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@company.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="operator">Operator</option>
                <option value="manager">Manager</option>
                {(userRole === ROLES.SUPER_ADMIN) && (
                  <>
                    <option value="user_admin">User Admin</option>
                    <option value="system_admin">System Admin</option>
                  </>
                )}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Users ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{u.emailAddresses?.[0]?.emailAddress}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {hasPermission(userRole, PERMISSIONS.USERS_ROLES) ? (
                      <select
                        value={u.publicMetadata?.role || 'user'}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="user">User</option>
                        <option value="operator">Operator</option>
                        <option value="manager">Manager</option>
                        {(userRole === ROLES.SUPER_ADMIN) && (
                          <>
                            <option value="user_admin">User Admin</option>
                            <option value="system_admin">System Admin</option>
                          </>
                        )}
                      </select>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {u.publicMetadata?.role || 'user'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.publicMetadata?.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {u.publicMetadata?.approved ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {!u.publicMetadata?.approved && hasPermission(userRole, PERMISSIONS.USERS_APPROVE) && (
                        <button
                          onClick={() => approveUser(u.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Approve User"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderInvitationsTab = () => (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Pending Invitations ({invitations.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invitations.map((invitation) => (
              <tr key={invitation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {invitation.email}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {invitation.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(invitation.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRolesTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Definitions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(ROLES).map(([key, role]) => (
            <div key={role} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{role.replace('_', ' ').toUpperCase()}</h4>
              <p className="text-sm text-gray-600 mb-3">
                {role === 'super_admin' && 'Full system access and control'}
                {role === 'system_admin' && 'System configuration and API management'}
                {role === 'user_admin' && 'User management and permissions'}
                {role === 'manager' && 'Business operations and reporting'}
                {role === 'operator' && 'Manufacturing operations access'}
                {role === 'viewer' && 'Read-only dashboard access'}
                {role === 'user' && 'Basic dashboard access'}
              </p>
              <div className="text-xs text-gray-500">
                Users with this role: {users.filter(u => u.publicMetadata?.role === role).length}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return renderUsersTab();
      case 'invitations':
        return renderInvitationsTab();
      case 'roles':
        return renderRolesTab();
      default:
        return renderUsersTab();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Administration</h2>
        <p className="text-gray-600">Manage users, invitations, and role permissions</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {tabs.filter(tab => hasPermission(userRole, tab.permission)).map((tab) => {
            const Icon = tab.icon;
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
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default UserAdminPanel;