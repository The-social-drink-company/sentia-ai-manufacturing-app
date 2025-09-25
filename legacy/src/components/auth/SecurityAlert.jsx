import React from 'react'
import { AlertTriangle, X, Shield, Clock, Key, LogOut } from 'lucide-react'

export default function SecurityAlert() {
  const { 
    showSecurityAlert, 
    securityMessage, 
    securityStatus, 
    passwordStatus,
    clearSecurityAlert,
    logout
  } = useAuthContext()

  if (!showSecurityAlert || !securityMessage) {
    return null
  }

  const getAlertType = () => {
    if (securityStatus?.accountLocked) {
      return 'critical'
    } else if (passwordStatus?.isExpired) {
      return 'critical'
    } else if (passwordStatus?.needsChange || securityStatus?.failedLoginCount > 2) {
      return 'warning'
    }
    return 'info'
  }

  const getAlertIcon = () => {
    const alertType = getAlertType()
    switch (alertType) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <Shield className="h-5 w-5 text-amber-500" />
      default:
        return <Clock className="h-5 w-5 text-blue-500" />
    }
  }

  const getAlertStyles = () => {
    const alertType = getAlertType()
    switch (alertType) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const handleAction = () => {
    if (securityStatus?.accountLocked) {
      // Account locked - logout to refresh session
      logout()
    } else if (passwordStatus?.isExpired) {
      // Redirect to password change
      window.location.href = '/auth/change-password'
    } else if (passwordStatus?.needsChange) {
      // Redirect to password change with warning
      window.location.href = '/auth/change-password?warning=expiring'
    } else {
      // Default action - go to security settings
      window.location.href = '/security'
    }
  }

  const getActionText = () => {
    if (securityStatus?.accountLocked) {
      return 'Sign Out'
    } else if (passwordStatus?.isExpired || passwordStatus?.needsChange) {
      return 'Change Password'
    } else {
      return 'View Security'
    }
  }

  const getActionIcon = () => {
    if (securityStatus?.accountLocked) {
      return <LogOut className="h-4 w-4" />
    } else if (passwordStatus?.isExpired || passwordStatus?.needsChange) {
      return <Key className="h-4 w-4" />
    } else {
      return <Shield className="h-4 w-4" />
    }
  }

  return (
    <div className={`fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 rounded-lg border p-4 shadow-lg ${getAlertStyles()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getAlertIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium mb-2">
            Security Alert
          </div>
          
          <div className="text-sm mb-3">
            {securityMessage}
          </div>
          
          {/* Additional context for specific alert types */}
          {securityStatus?.accountLocked && (
            <div className="text-xs mb-3 p-2 bg-white bg-opacity-50 rounded">
              Your account has been locked due to security concerns. Please sign out and contact support if you believe this is an error.
            </div>
          )}
          
          {passwordStatus?.isExpired && (
            <div className="text-xs mb-3 p-2 bg-white bg-opacity-50 rounded">
              For your security, you must change your password before continuing to use the application.
            </div>
          )}
          
          {passwordStatus?.needsChange && !passwordStatus?.isExpired && (
            <div className="text-xs mb-3 p-2 bg-white bg-opacity-50 rounded">
              Your password expires in {passwordStatus.daysUntilExpiry} days. Change it now to avoid disruption.
            </div>
          )}
          
          {securityStatus?.failedLoginCount > 2 && (
            <div className="text-xs mb-3 p-2 bg-white bg-opacity-50 rounded">
              Recent failed login attempts: {securityStatus.failedLoginCount}. 
              {securityStatus.lastFailedLogin && (
                <> Last attempt: {new Date(securityStatus.lastFailedLogin).toLocaleString()}</>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <button
              onClick={handleAction}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
            >
              {getActionIcon()}
              <span className="ml-1.5">{getActionText()}</span>
            </button>
            
            {!securityStatus?.accountLocked && !passwordStatus?.isExpired && (
              <button
                onClick={clearSecurityAlert}
                className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Variant for embedding in other components
export function InlineSecurityAlert({ className = "" }) {
  const { 
    securityStatus, 
    passwordStatus 
  } = useAuthContext()

  // Don't show if no security issues
  if (!securityStatus && !passwordStatus) return null
  
  const hasIssues = securityStatus?.failedLoginCount > 0 || 
                   passwordStatus?.needsChange || 
                   passwordStatus?.isExpired ||
                   securityStatus?.accountLocked

  if (!hasIssues) return null

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 mb-1">
            Security Notice
          </h3>
          
          <div className="text-sm text-amber-700 space-y-1">
            {securityStatus?.failedLoginCount > 0 && (
              <div>â€¢ {securityStatus.failedLoginCount} failed login attempt(s) detected</div>
            )}
            
            {passwordStatus?.isExpired && (
              <div>â€¢ Your password has expired and must be changed</div>
            )}
            
            {passwordStatus?.needsChange && !passwordStatus?.isExpired && (
              <div>â€¢ Your password expires in {passwordStatus.daysUntilExpiry} days</div>
            )}
            
            {securityStatus?.accountLocked && (
              <div>â€¢ Your account is temporarily locked for security</div>
            )}
          </div>
          
          <div className="mt-3">
            <button
              onClick={() => window.location.href = '/security'}
              className="text-sm font-medium text-amber-800 hover:text-amber-900 underline"
            >
              Review Security Settings â†’
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
