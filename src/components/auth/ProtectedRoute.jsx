import React from 'react'

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requiredRole = null,
  requiredPermission = null 
}) {
  // Simplified version - just render children for now
  return <>{children}</>
}