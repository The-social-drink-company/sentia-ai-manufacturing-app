import React from 'react';
import { useClerk, useUser, useAuth } from '@clerk/clerk-react';

const ClerkTest = () => {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useClerk();
  const { user, isLoaded: userLoaded, isSignedIn: userSignedIn } = useUser();
  const { isLoaded: authLoaded, userId, sessionId, getToken } = useAuth();

  // Check environment variable
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const hasValidKey = clerkKey && clerkKey.startsWith('pk_test_');

  return (
    <div style={{
      padding: '20px',
      background: '#1e293b',
      borderRadius: '12px',
      color: '#e2e8f0',
      margin: '20px',
      fontFamily: 'system-ui'
    }}>
      <h2 style={{ color: '#38bdf8', marginBottom: '20px' }}>🔐 Clerk Status Check</h2>

      <div style={{ marginBottom: '15px', padding: '10px', background: '#0f172a', borderRadius: '8px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '16px', marginBottom: '10px' }}>Environment</h3>
        <div style={{ fontSize: '14px' }}>
          <div>Clerk Key Present: {hasValidKey ? '✅ Yes' : '❌ No'}</div>
          <div>Key Prefix: {clerkKey ? clerkKey.substring(0, 20) + '...' : 'Not Set'}</div>
        </div>
      </div>

      <div style={{ marginBottom: '15px', padding: '10px', background: '#0f172a', borderRadius: '8px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '16px', marginBottom: '10px' }}>Clerk Hook Status</h3>
        <div style={{ fontSize: '14px' }}>
          <div>Clerk Loaded: {clerkLoaded ? '✅ Yes' : '⏳ Loading'}</div>
          <div>User Loaded: {userLoaded ? '✅ Yes' : '⏳ Loading'}</div>
          <div>Auth Loaded: {authLoaded ? '✅ Yes' : '⏳ Loading'}</div>
        </div>
      </div>

      <div style={{ marginBottom: '15px', padding: '10px', background: '#0f172a', borderRadius: '8px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '16px', marginBottom: '10px' }}>Authentication State</h3>
        <div style={{ fontSize: '14px' }}>
          <div>Signed In (Clerk): {clerkSignedIn ? '✅ Yes' : '❌ No'}</div>
          <div>Signed In (User): {userSignedIn ? '✅ Yes' : '❌ No'}</div>
          <div>User ID: {userId || 'Not signed in'}</div>
          <div>Session ID: {sessionId || 'No session'}</div>
        </div>
      </div>

      {user && (
        <div style={{ marginBottom: '15px', padding: '10px', background: '#0f172a', borderRadius: '8px' }}>
          <h3 style={{ color: '#f1f5f9', fontSize: '16px', marginBottom: '10px' }}>User Details</h3>
          <div style={{ fontSize: '14px' }}>
            <div>Email: {user.emailAddresses?.[0]?.emailAddress}</div>
            <div>Name: {user.firstName} {user.lastName}</div>
            <div>Role: {user.publicMetadata?.role || 'Not set'}</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#64748b' }}>
        {!hasValidKey && (
          <div style={{ color: '#ef4444', fontWeight: 'bold' }}>
            ⚠️ Clerk publishable key is not configured or invalid!
          </div>
        )}
        {hasValidKey && !clerkLoaded && (
          <div style={{ color: '#f59e0b' }}>
            ⏳ Clerk is initializing...
          </div>
        )}
        {hasValidKey && clerkLoaded && !userSignedIn && (
          <div style={{ color: '#38bdf8' }}>
            ℹ️ Clerk is loaded but user is not signed in
          </div>
        )}
        {hasValidKey && clerkLoaded && userSignedIn && (
          <div style={{ color: '#10b981', fontWeight: 'bold' }}>
            ✅ Clerk authentication is working properly!
          </div>
        )}
      </div>
    </div>
  );
};

export default ClerkTest;