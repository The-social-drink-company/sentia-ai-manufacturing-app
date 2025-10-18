
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getRoles,
  getRolePermissions,
  getRoleAssignmentHistory,
  updateRolePermissions,
} from '@/services/api/adminApi'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Lock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const MFA_PROMPT_MESSAGE = 'Enter the MFA code to authorize this change.'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  review: 'bg-amber-100 text-amber-700',
  deprecated: 'bg-gray-100 text-gray-600',
}

const normalizeRoles = data => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.roles)) return data.roles
  if (Array.isArray(data.data)) return data.data
  return []
}

const normalizeAssignments = data => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.history)) return data.history
  if (Array.isArray(data.data)) return data.data
  return []
}

const normalizePermissions = payload => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.permissions)) return payload.permissions
  if (payload.permissions && typeof payload.permissions === 'object') {
    return Object.entries(payload.permissions).map(([id, details]) => ({ id, ...details }))
  }
  if (typeof payload === 'object') {
    return Object.entries(payload).map(([id, details]) => ({ id, ...details }))
  }
  return []
}

const groupPermissions = permissions => {
  const groups = {}
  permissions.forEach(perm => {
    const category = perm.category || 'general'
    if (!groups[category]) groups[category] = []
    groups[category].push(perm)
  })
  return groups
}

const PermissionToggle = ({ permission, onToggle }) => {
  const Icon = permission.granted ? CheckCircle2 : AlertTriangle
  const tone = permission.granted ? 'text-green-600' : 'text-gray-400'

  return (
    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:border-blue-200">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        checked={Boolean(permission.granted)}
        onChange={event => onToggle(permission.id, event.target.checked)}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <Icon className={`h-4 w-4 ${tone}`} />
          <span>{permission.label || permission.id}</span>
          {permission.sensitivity === 'high' && (
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
              MFA
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">{permission.description || 'No description provided.'}</p>
      </div>
    </label>
  )
}

// eslint-disable-next-line no-unused-vars
const RoleSummaryCard = ({ icon, label, value, helper, tone = 'default' }) => {
  const palette =
    tone === 'success'
      ? 'text-green-600'
      : tone === 'warning'
      ? 'text-amber-600'
      : tone === 'danger'
      ? 'text-red-600'
      : 'text-gray-900'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon ? <icon className="h-5 w-5" /> : null}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className={`text-xl font-semibold ${palette}`}>{value}</p>
          {helper && <p className="text-xs text-gray-500">{helper}</p>}
        </div>
      </div>
    </div>
  )
}

export default function RoleManagement() {
  const queryClient = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [permissionDraft, setPermissionDraft] = useState({})
  const [dirty, setDirty] = useState(false)

  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: getRoles,
    staleTime: 5 * 60 * 1000,
  })

  const roles = useMemo(() => normalizeRoles(rolesQuery.data), [rolesQuery.data])


  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      const first = roles[0]
      const defaultId = first.id || first.handle || first.value
      if (defaultId) {
        setSelectedRoleId(defaultId)
      }
    }
  }, [roles, selectedRoleId])

  const permissionsQuery = useQuery({
    queryKey: ['admin', 'role-permissions', selectedRoleId],
    queryFn: () => getRolePermissions(selectedRoleId),
    enabled: Boolean(selectedRoleId),
    onSuccess: data => {
      const normalized = normalizePermissions(data)
      const draft = {}
      normalized.forEach(permission => {
        draft[permission.id] = Boolean(permission.granted)
      })
      setPermissionDraft(draft)
      setDirty(false)
    },
  })

  const assignmentsQuery = useQuery({
    queryKey: ['admin', 'role-assignments', selectedRoleId],
    queryFn: () => getRoleAssignmentHistory({ roleId: selectedRoleId, limit: 5 }),
    enabled: Boolean(selectedRoleId),
  })

  const permissions = useMemo(() => normalizePermissions(permissionsQuery.data), [permissionsQuery.data])
  const groupedPermissions = useMemo(() => groupPermissions(permissions), [permissions])
  const assignmentItems = useMemo(() => normalizeAssignments(assignmentsQuery.data), [assignmentsQuery.data])

  const updateMutation = useMutation({
    mutationFn: async updatedPermissions => {
      const mfaCode = window.prompt(MFA_PROMPT_MESSAGE)
      if (!mfaCode) throw new Error('MFA code is required')
      return updateRolePermissions(selectedRoleId, { permissions: updatedPermissions }, mfaCode)
    },
    onSuccess: () => {
      toast.success('Role permissions updated')
      setDirty(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'role-permissions', selectedRoleId] })
    },
    onError: error => {
      toast.error(error.message || 'Failed to update role permissions')
    },
  })

  const handleToggle = (permissionId, granted) => {
    setPermissionDraft(prev => ({ ...prev, [permissionId]: granted }))
    setDirty(true)
  }

  const handleSave = () => {
    const payload = Object.entries(permissionDraft).map(([id, granted]) => ({ id, granted }))
    updateMutation.mutate(payload)
  }

  const selectedRole = roles.find(role => (role.id || role.handle || role.value) === selectedRoleId)
  // eslint-disable-next-line no-unused-vars
  const roleStatus = selectedRole?.status || 'active' // TODO: Display role status badge in UI
  const roleLabel = selectedRole?.name || selectedRole?.label || selectedRoleId
  const roleDescription = selectedRole?.description || 'No description provided.'

  const totalPermissions = permissions.length
  const grantedPermissions = permissions.filter(perm => permissionDraft[perm.id]).length

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Role Management</h1>
          <p className="text-sm text-gray-500">
            Review and adjust access levels. Sensitive updates require MFA and are logged for audit.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          Least privilege enforced for production workloads.
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <RoleSummaryCard
          icon={Users}
          label="Roles"
          value={roles.length}
          helper="Configured across the organization"
        />
        <RoleSummaryCard
          icon={Shield}
          label="Permissions"
          value={grantedPermissions}
          helper={`Granted of ${totalPermissions}`}
          tone="success"
        />
        <RoleSummaryCard
          icon={Lock}
          label="Pending Changes"
          value={dirty ? 'Unsaved edits' : 'No edits'}
          helper={dirty ? 'Save changes to persist updates' : 'Access matrix is in sync'}
          tone={dirty ? 'warning' : 'default'}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <aside className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
            Roles
          </div>
          <ul className="divide-y divide-gray-100">
            {rolesQuery.isLoading && (
              <li className="px-4 py-3 text-sm text-gray-500">Loading roles...</li>
            )}
            {!rolesQuery.isLoading && roles.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-500">No roles defined.</li>
            )}
            {roles.map(role => {
              const id = role.id || role.handle || role.value
              const active = id === selectedRoleId
              const badgeTone = STATUS_COLORS[role.status] || STATUS_COLORS.active
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRoleId(id)}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{role.name || role.label || id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeTone}`}>
                      {role.status || 'active'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{roleLabel}</h2>
                <p className="text-sm text-gray-500">{roleDescription}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => permissionsQuery.refetch()}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
                <button
                  type="button"
                  disabled={!dirty || updateMutation.isLoading}
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isLoading ? 'Saving...' : 'Save with MFA'}
                </button>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              {permissionsQuery.isLoading && (
                <p className="text-sm text-gray-500">Loading permissions...</p>
              )}
              {!permissionsQuery.isLoading && permissions.length === 0 && (
                <p className="text-sm text-gray-500">No permissions available for this role.</p>
              )}

              {Object.entries(groupedPermissions).map(([category, list]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      {category.replace(/[-_]/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400">{list.length} permissions</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {list.map(permission => (
                      <PermissionToggle
                        key={permission.id}
                        permission={{ ...permission, granted: permissionDraft[permission.id] }}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-700">Recent assignment activity</h3>
              <p className="text-xs text-gray-500">Last five role changes across the organization.</p>
            </div>
            <ul className="divide-y divide-gray-100">
              {assignmentsQuery.isLoading && (
                <li className="px-6 py-4 text-sm text-gray-500">Loading assignment history...</li>
              )}
              {!assignmentsQuery.isLoading && assignmentItems.length === 0 && (
                <li className="px-6 py-4 text-sm text-gray-500">No recent assignments recorded.</li>
              )}
              {assignmentItems.map(item => (
                <li key={item.id || item.timestamp} className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.userName || item.user || 'Unknown user'}</p>
                      <p className="text-xs text-gray-500">{item.action || item.event || 'Updated role'}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown time'}</p>
                      {item.actor && <p>By {item.actor}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
