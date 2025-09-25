import React from 'react';


export function SignInButton() {
  const { data: session, status } = ();

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <img 
            src={session.user?.image || '/avatar-placeholder.png'} 
            alt="User avatar"
            className="w-8 h-8 rounded-full"
          />
          <div className="text-sm">
            <p className="font-medium text-gray-900">{session.user?.name}</p>
            <p className="text-gray-500">{session.user?.email}</p>
            {session.user?.role && (
              <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {session.user.role}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => ('azure-ad', { callbackUrl: '/dashboard' })}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7l-10-5z"/>
      </svg>
      <span>Sign in with Microsoft</span>
    </button>
  );
}