import CredentialsProvider from "next-auth/providers/credentials"
import MicrosoftProvider from "next-auth/providers/microsoft"
import { verifyUserCredentials, initializeDefaultUsers } from "./user-service.js"

export const authOptions = {
  providers: [
    // Microsoft OAuth Provider
    MicrosoftProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID || "dummy_client_id",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "dummy_client_secret",
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
      authorization: {
        params: {
          scope: "openid profile email User.Read"
        }
      }
    }),
    
    // Username/Password Credentials Provider with Real Database Authentication
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@sentia.com" },
        password: { label: "Password", type: "password", placeholder: "Enter your password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          return null;
        }

        try {
          // Initialize default users if they don't exist
          await initializeDefaultUsers();
          
          // Verify credentials against database
          const user = await verifyUserCredentials(credentials.email, credentials.password);
          
          if (user) {
            console.log(`Successful login for: ${user.email}`);
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              permissions: user.permissions,
              needsPasswordReset: user.needsPasswordReset || false
            };
          } else {
            console.log(`Failed login attempt for: ${credentials.email}`);
            return null;
          }
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
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