// Temporary basic auth setup - will add Azure AD provider later
export const authOptions = {
  providers: [
    // Using credentials provider as temporary fallback
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Temporary admin users for testing
        const adminUsers = [
          { email: "daniel.kenny@sentiaspirits.com", name: "Daniel Kenny", role: "admin" },
          { email: "paul.roberts@sentiaspirits.com", name: "Paul Roberts", role: "admin" },
          { email: "david.orren@gabalabs.com", name: "David Orren", role: "admin" },
          { email: "admin@sentia.com", name: "Admin User", role: "admin" }
        ];
        
        if (credentials?.email) {
          const user = adminUsers.find(u => u.email === credentials.email);
          if (user) {
            return { id: user.email, email: user.email, name: user.name, role: user.role };
          }
        }
        return null;
      }
    }
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }
      if (user) {
        token.user = user
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken
      session.provider = token.provider
      session.user = token.user || session.user
      
      // Get user lists from environment
      const masterAdmin = process.env.MASTER_ADMIN?.toLowerCase()
      const adminUsers = (process.env.ADMIN_USERS || '').split(',').map(email => email.trim().toLowerCase())
      const dataManagerUsers = (process.env.DATA_MANAGER_USERS || '').split(',').map(email => email.trim().toLowerCase())
      const standardUsers = (process.env.STANDARD_USERS || '').split(',').map(email => email.trim().toLowerCase())
      
      // Assign roles based on email
      const userEmail = session.user?.email?.toLowerCase()
      
      if (userEmail === masterAdmin) {
        session.user.role = 'master_admin'
        session.user.permissions = ['read', 'write', 'admin', 'delete', 'manage_users', 'system_config', 'master_access']
      } else if (adminUsers.includes(userEmail)) {
        session.user.role = 'admin'
        session.user.permissions = ['read', 'write', 'admin', 'delete', 'manage_users']
      } else if (dataManagerUsers.includes(userEmail)) {
        session.user.role = 'data_manager'  
        session.user.permissions = ['read', 'write', 'upload_data']
      } else if (standardUsers.includes(userEmail)) {
        session.user.role = 'user'
        session.user.permissions = ['read']
      } else {
        // Default for any other authenticated users
        session.user.role = 'guest'
        session.user.permissions = ['read']
      }
      
      return session
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to the dashboard after login
      return `${baseUrl}/dashboard`
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
}