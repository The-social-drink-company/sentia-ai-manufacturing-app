/**
 * Mock Clerk Authentication for Production Deployment
 * Bypasses Clerk while maintaining application functionality
 */

// Mock user data
const mockUser = {
  id: 'admin-user',
  firstName: 'Admin',
  lastName: 'User',
  fullName: 'Admin User',
  username: 'admin',
  emailAddresses: [{ emailAddress: 'admin@sentia.com' }],
  profileImageUrl: null,
  publicMetadata: {
    role: 'admin',
    permissions: ['all']
  },
  unsafeMetadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock organization
const mockOrganization = {
  id: 'org-1',
  name: 'Sentia Manufacturing',
  slug: 'sentia',
  publicMetadata: {},
  createdAt: new Date().toISOString()
};

// Mock session
const mockSession = {
  id: 'session-1',
  user: mockUser,
  status: 'active',
  lastActiveAt: new Date().toISOString(),
  expireAt: new Date(Date.now() + 86400000).toISOString()
};

// Export mock hooks
export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: true,
  userId: mockUser.id,
  sessionId: mockSession.id,
  actor: null,
  orgId: mockOrganization.id,
  orgRole: 'admin',
  orgSlug: mockOrganization.slug,
  has: () => true,
  getToken: async () => 'mock-token',
  signOut: () => console.log('Mock sign out')
});

export const useUser = () => ({
  isLoaded: true,
  isSignedIn: true,
  user: mockUser
});

export const useOrganization = () => ({
  isLoaded: true,
  organization: mockOrganization,
  membership: {
    role: 'admin',
    permissions: ['all']
  }
});

export const useSession = () => ({
  isLoaded: true,
  isSignedIn: true,
  session: mockSession
});

export const useClerk = () => ({
  user: mockUser,
  session: mockSession,
  organization: mockOrganization,
  client: {
    signOut: () => console.log('Mock sign out'),
    signIn: {
      create: async () => mockSession
    },
    signUp: {
      create: async () => mockSession
    }
  },
  setActive: () => {},
  loaded: true,
  navigate: () => {},
  redirectToSignIn: () => {},
  redirectToSignUp: () => {},
  redirectToUserProfile: () => {},
  redirectToOrganizationProfile: () => {},
  redirectToHome: () => {},
  openSignIn: () => {},
  openSignUp: () => {},
  openUserProfile: () => {},
  openOrganizationProfile: () => {},
  mountSignIn: () => {},
  mountSignUp: () => {},
  mountUserProfile: () => {},
  mountOrganizationProfile: () => {},
  unmountSignIn: () => {},
  unmountSignUp: () => {},
  unmountUserProfile: () => {},
  unmountOrganizationProfile: () => {}
});

// Mock components
export const SignIn = () => null;
export const SignUp = () => null;
export const SignOutButton = () => null;
export const SignInButton = () => null;
export const SignUpButton = () => null;
export const UserButton = () => null;
export const UserProfile = () => null;
export const OrganizationProfile = () => null;
export const OrganizationSwitcher = () => null;
export const OrganizationList = () => null;
export const CreateOrganization = () => null;

// Mock ClerkProvider
export const ClerkProvider = ({ children }) => children;

// Mock protected routes
export const RedirectToSignIn = () => null;
export const RedirectToSignUp = () => null;
export const RedirectToUserProfile = () => null;
export const RedirectToOrganizationProfile = () => null;
export const RedirectToCreateOrganization = () => null;
export const AuthenticateWithRedirectCallback = () => null;
export const SignedIn = ({ children }) => children;
export const SignedOut = () => null;
export const ClerkLoaded = ({ children }) => children;
export const ClerkLoading = () => null;
export const Protect = ({ children }) => children;
export const WithClerk = (Component) => Component;
export const WithUser = (Component) => Component;
export const WithSession = (Component) => Component;
export const MultisessionAppSupport = ({ children }) => children;

// Export everything as default for @clerk/clerk-react imports
export default {
  useAuth,
  useUser,
  useOrganization,
  useSession,
  useClerk,
  SignIn,
  SignUp,
  SignOutButton,
  SignInButton,
  SignUpButton,
  UserButton,
  UserProfile,
  OrganizationProfile,
  OrganizationSwitcher,
  OrganizationList,
  CreateOrganization,
  ClerkProvider,
  RedirectToSignIn,
  RedirectToSignUp,
  RedirectToUserProfile,
  RedirectToOrganizationProfile,
  RedirectToCreateOrganization,
  AuthenticateWithRedirectCallback,
  SignedIn,
  SignedOut,
  ClerkLoaded,
  ClerkLoading,
  Protect,
  WithClerk,
  WithUser,
  WithSession,
  MultisessionAppSupport
};