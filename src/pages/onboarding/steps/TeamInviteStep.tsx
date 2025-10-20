/**
 * Team Invite Step
 *
 * Allows users to invite team members to their organization.
 * Supports multiple email addresses with role selection.
 * Optional step - can be skipped and completed later from settings.
 *
 * @module src/pages/onboarding/steps/TeamInviteStep
 */

import { useState } from 'react'
import { ArrowRight, Plus, X, Mail, UserPlus } from 'lucide-react'

interface TeamInviteStepProps {
  data?: TeamInvite[]
  onNext: (data: TeamInvite[]) => void
  onSkip?: () => void
  loading?: boolean
}

interface TeamInvite {
  email: string
  role: 'manager' | 'operator' | 'viewer'
}

const ROLES = [
  {
    value: 'manager' as const,
    label: 'Manager',
    description: 'Full access to all features and settings',
    color: 'blue',
  },
  {
    value: 'operator' as const,
    label: 'Operator',
    description: 'Can view and manage operations, limited settings',
    color: 'green',
  },
  {
    value: 'viewer' as const,
    label: 'Viewer',
    description: 'Read-only access to dashboards and reports',
    color: 'gray',
  },
]

export default function TeamInviteStep({
  data,
  onNext,
  onSkip,
  loading = false,
}: TeamInviteStepProps) {
  const [invites, setInvites] = useState<TeamInvite[]>(
    data && data.length > 0 ? data : [{ email: '', role: 'operator' }]
  )
  const [bulkEmails, setBulkEmails] = useState('')
  const [showBulkInput, setShowBulkInput] = useState(false)

  const addInvite = () => {
    setInvites([...invites, { email: '', role: 'operator' }])
  }

  const removeInvite = (index: number) => {
    if (invites.length > 1) {
      setInvites(invites.filter((_, i) => i !== index))
    }
  }

  const updateEmail = (index: number, email: string) => {
    const updated = [...invites]
    updated[index].email = email
    setInvites(updated)
  }

  const updateRole = (index: number, role: TeamInvite['role']) => {
    const updated = [...invites]
    updated[index].role = role
    setInvites(updated)
  }

  const handleBulkAdd = () => {
    // Parse comma or line-separated emails
    const emails = bulkEmails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0)

    const newInvites = emails.map((email) => ({
      email,
      role: 'operator' as const,
    }))

    setInvites([...invites, ...newInvites])
    setBulkEmails('')
    setShowBulkInput(false)
  }

  const handleContinue = () => {
    // Filter out empty emails
    const validInvites = invites.filter((invite) => invite.email.trim() !== '')
    onNext(validInvites)
  }

  const hasValidInvites = invites.some((invite) => {
    const email = invite.email.trim()
    return email.length > 0 && email.includes('@')
  })

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> You can invite team members now or skip this
          step and do it later from Settings.
        </p>
      </div>

      {/* Individual Invites */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Team Members
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkInput(!showBulkInput)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showBulkInput ? 'Cancel Bulk Add' : 'Bulk Add'}
            </button>
          </div>
        </div>

        {/* Bulk Input */}
        {showBulkInput && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste multiple emails (comma or line-separated)
            </label>
            <textarea
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              placeholder="user1@example.com, user2@example.com&#x0a;user3@example.com"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleBulkAdd}
              disabled={!bulkEmails.trim()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add All as Operators
            </button>
          </div>
        )}

        {/* Individual Invite Rows */}
        {invites.map((invite, index) => (
          <div
            key={index}
            className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex-shrink-0 mt-2">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 space-y-3">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={invite.email}
                  onChange={(e) => updateEmail(index, e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => updateRole(index, role.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        invite.role === role.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900">
                        {role.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {role.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Remove Button */}
            {invites.length > 1 && (
              <button
                onClick={() => removeInvite(index)}
                className="flex-shrink-0 mt-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}

        {/* Add Another Button */}
        <button
          onClick={addInvite}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Another Team Member
        </button>
      </div>

      {/* Preview */}
      {hasValidInvites && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <UserPlus className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-900">
                Ready to Send Invitations
              </p>
              <p className="text-sm text-green-700 mt-1">
                {invites.filter((i) => i.email.trim()).length} team member
                {invites.filter((i) => i.email.trim()).length !== 1 ? 's' : ''}{' '}
                will receive an email invitation to join your CapLiquify
                workspace.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleContinue}
          disabled={!hasValidInvites || loading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            'Sending Invitations...'
          ) : (
            <>
              Send{' '}
              {hasValidInvites
                ? `${invites.filter((i) => i.email.trim()).length} `
                : ''}
              Invitation
              {hasValidInvites &&
              invites.filter((i) => i.email.trim()).length !== 1
                ? 's'
                : ''}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {onSkip && (
          <button
            onClick={onSkip}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
