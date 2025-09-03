import React from 'react'
import { useAuth, RedirectToSignIn } from '@clerk/clerk-react'

export default function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="loading-spinner">
        Loading...
      </div>
    )
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />
  }

  return children
}