import React from 'react';


export function AuthProvider({ children, session }) {
  return (
    <SessionProvider session={session} basePath="/api/auth">
      {children}
    </SessionProvider>
  );
}