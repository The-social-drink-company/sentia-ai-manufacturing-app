import React from 'react'
import { RedirectToSignIn } from '@clerk/clerk-react'
import { useAuthRole } from '../../hooks/useAuthRole.jsx'

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requiredRole = null,
  requiredPermission = null 
}) {
  const { 
    isLoading, 
    isAuthenticated, 
    user, 
    role,
    hasRole,
    hasPermission 
  } = useAuthRole()

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <RedirectToSignIn />
  }

  // Check if user account is approved
  const isApproved = user?.publicMetadata?.approved === true
  const isAdmin = role === 'admin'
  const isMasterAdmin = user?.publicMetadata?.masterAdmin === true
  
  // Master admin users have unlimited access to everything
  if (isMasterAdmin) {
    return children
  }

  // Regular admin users are always approved
  if (isAdmin) {
    return children
  }

  // Check admin requirement (for backward compatibility)
  if (requireAdmin && !isAdmin && !isMasterAdmin) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <h2>Access Denied</h2>
          <p>Administrator privileges required to access this page.</p>
        </div>
      </div>
    )
  }

  // Check specific role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <h2>Access Denied</h2>
          <p>Required role: {requiredRole}</p>
          <p>Your role: {role}</p>
        </div>
      </div>
    )
  }

  // Check specific permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <h2>Access Denied</h2>
          <p>You don't have the required permission to access this page.</p>
          <p>Required permission: {requiredPermission}</p>
        </div>
      </div>
    )
  }

  // Check approval status for regular users (master admin bypasses this check)
  if (!isApproved && !isAdmin && !isMasterAdmin) {
    return (
      <div className="pending-approval">
        <div className="pending-approval-content">
          <h2>Account Pending Approval</h2>
          <p>Your account is currently under review by an administrator.</p>
          <p>You will receive access once your account has been approved.</p>
          <div className="pending-details">
            <strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress}
          </div>
        </div>
      </div>
    )
  }

  return children
}