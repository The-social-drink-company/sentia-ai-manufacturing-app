import AzureAD from "next-auth/providers/azure-ad"

export const authOptions = {
  providers: [
    AzureAD({
      clientId: process.env.VITE_MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
      authorization: {
        params: {
          scope: "openid profile email User.Read Files.Read Files.Read.All"
        }
      }
    })
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