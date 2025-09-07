import React from 'react';
import { SessionProvider } from 'next-auth/react';

export function AuthProvider({ children, session }) {
  return (
    <SessionProvider session={session} basePath="/api/auth">
      {children}
    </SessionProvider>
  );
}