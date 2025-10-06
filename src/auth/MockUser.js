/**
 * Mock User Data for Development Environment
 * Provides fake user context when Clerk authentication is bypassed
 */

export const mockUser = {
  id: 'dev_user_12345',
  emailAddress: 'developer@sentiaspirits.com',
  firstName: 'Dev',
  lastName: 'User',
  fullName: 'Dev User',
  username: 'devuser',
  imageUrl: '/avatar-placeholder.png',
  hasImage: false,
  primaryEmailAddressId: 'email_dev_12345',
  primaryPhoneNumberId: null,
  primaryWeb3WalletId: null,
  lastSignInAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  banned: false,
  locked: false,
  twoFactorEnabled: false,
  totpEnabled: false,
  backupCodeEnabled: false,
  publicMetadata: {
    role: 'admin',
    department: 'development',
    permissions: [
      'dashboard:read',
      'dashboard:write',
      'working-capital:read',
      'working-capital:write',
      'forecasting:read',
      'forecasting:write',
      'production:read',
      'production:write',
      'analytics:read',
      'analytics:write',
      'inventory:read',
      'inventory:write',
      'quality:read',
      'quality:write',
      'admin:read',
      'admin:write',
      'data-import:read',
      'data-import:write'
    ]
  },
  privateMetadata: {},
  unsafeMetadata: {}
}

export const mockSession = {
  id: 'sess_dev_12345',
  status: 'active',
  lastActiveAt: new Date(),
  expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  abandonAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  user: mockUser
}

export const mockOrganization = {
  id: 'org_dev_12345',
  name: 'Sentia Spirits Development',
  slug: 'sentia-dev',
  imageUrl: null,
  hasImage: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  publicMetadata: {
    industry: 'manufacturing',
    size: 'enterprise'
  },
  privateMetadata: {},
  maxAllowedMemberships: 100
}

export const mockAuthState = {
  isSignedIn: true,
  isLoaded: true,
  userId: mockUser.id,
  sessionId: mockSession.id,
  orgId: mockOrganization.id,
  orgRole: 'admin',
  orgSlug: mockOrganization.slug,
  actor: null,
  user: mockUser,
  session: mockSession,
  organization: mockOrganization
}