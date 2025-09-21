import React, { createContext, useContext, useEffect, useState } from 'react';
import { ClerkProvider, useAuth as useClerkAuth, useUser, SignIn, SignUp, UserButton } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { 
  Shield, 
  Users, 
  Building2, 
  Crown, 
  Star, 
  AlertTriangle, 
  CheckCircle,
  Lock,
  UserCheck,
  Settings,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

// Executive role definitions
const EXECUTIVE_ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Full system access and user management',
    level: 100,
    permissions: ['*'], // All permissions
    icon: Crown,
    color: 'bg-purple-600',
    badge: 'destructive'
  },
  BOARD_MEMBER: {
    id: 'board_member',
    name: 'Board Member',
    description: 'Strategic oversight and board-level reporting',
    level: 90,
    permissions: [
      'view_all_reports',
      'view_strategic_insights',
      'view_board_reports',
      'view_financial_forecasts',
      'view_risk_assessments',
      'export_reports'
    ],
    icon: Building2,
    color: 'bg-blue-600',
    badge: 'default'
  },
  CEO: {
    id: 'ceo',
    name: 'Chief Executive Officer',
    description: 'Executive leadership and strategic decision making',
    level: 85,
    permissions: [
      'view_all_reports',
      'view_strategic_insights',
      'view_executive_dashboard',
      'view_financial_forecasts',
      'view_operational_metrics',
      'manage_scenarios',
      'export_reports',
      'approve_initiatives'
    ],
    icon: Star,
    color: 'bg-gold-600',
    badge: 'warning'
  },
  CFO: {
    id: 'cfo',
    name: 'Chief Financial Officer',
    description: 'Financial oversight and working capital management',
    level: 80,
    permissions: [
      'view_all_reports',
      'view_financial_data',
      'view_cash_flow_analysis',
      'view_working_capital_insights',
      'manage_financial_scenarios',
      'view_risk_assessments',
      'export_reports',
      'manage_budgets',
      'approve_financial_initiatives'
    ],
    icon: Users,
    color: 'bg-green-600',
    badge: 'success'
  },
  PRIVATE_EQUITY: {
    id: 'private_equity',
    name: 'Private Equity Partner',
    description: 'Investment oversight and portfolio management',
    level: 75,
    permissions: [
      'view_portfolio_reports',
      'view_strategic_insights',
      'view_financial_forecasts',
      'view_investment_metrics',
      'view_risk_assessments',
      'export_reports',
      'view_benchmarks'
    ],
    icon: Building2,
    color: 'bg-indigo-600',
    badge: 'secondary'
  },
  FINANCE_DIRECTOR: {
    id: 'finance_director',
    name: 'Finance Director',
    description: 'Financial operations and reporting',
    level: 70,
    permissions: [
      'view_financial_reports',
      'view_cash_flow_analysis',
      'view_working_capital_insights',
      'manage_financial_data',
      'export_reports',
      'view_operational_metrics'
    ],
    icon: Users,
    color: 'bg-teal-600',
    badge: 'outline'
  },
  OPERATIONS_MANAGER: {
    id: 'operations_manager',
    name: 'Operations Manager',
    description: 'Operational oversight and process management',
    level: 60,
    permissions: [
      'view_operational_reports',
      'view_operational_metrics',
      'manage_operational_data',
      'view_process_insights',
      'export_operational_reports'
    ],
    icon: Settings,
    color: 'bg-orange-600',
    badge: 'outline'
  },
  ANALYST: {
    id: 'analyst',
    name: 'Financial Analyst',
    description: 'Data analysis and reporting support',
    level: 50,
    permissions: [
      'view_reports',
      'view_financial_data',
      'create_analysis',
      'export_data',
      'view_dashboards'
    ],
    icon: Eye,
    color: 'bg-gray-600',
    badge: 'outline'
  },
  VIEWER: {
    id: 'viewer',
    name: 'Report Viewer',
    description: 'Read-only access to assigned reports',
    level: 30,
    permissions: [
      'view_assigned_reports',
      'view_basic_dashboards'
    ],
    icon: Eye,
    color: 'bg-gray-400',
    badge: 'outline'
  }
};

// Permission definitions
const PERMISSIONS = {
  // System permissions
  '*': 'All system permissions',
  'manage_users': 'Manage user accounts and roles',
  'manage_system': 'System configuration and settings',
  
  // Data access permissions
  'view_all_reports': 'Access to all reports and dashboards',
  'view_financial_data': 'Access to financial data and metrics',
  'view_operational_data': 'Access to operational data and metrics',
  'view_strategic_insights': 'Access to strategic insights and analysis',
  
  // Specific report permissions
  'view_board_reports': 'Access to board-level reports',
  'view_executive_dashboard': 'Access to executive dashboard',
  'view_cash_flow_analysis': 'Access to cash flow analysis',
  'view_working_capital_insights': 'Access to working capital insights',
  'view_financial_forecasts': 'Access to financial forecasting',
  'view_risk_assessments': 'Access to risk assessment reports',
  'view_investment_metrics': 'Access to investment and portfolio metrics',
  'view_benchmarks': 'Access to industry benchmarks',
  
  // Management permissions
  'manage_scenarios': 'Create and manage scenario planning',
  'manage_financial_scenarios': 'Create and manage financial scenarios',
  'manage_financial_data': 'Edit and update financial data',
  'manage_operational_data': 'Edit and update operational data',
  'manage_budgets': 'Create and manage budgets',
  
  // Approval permissions
  'approve_initiatives': 'Approve strategic initiatives',
  'approve_financial_initiatives': 'Approve financial initiatives',
  
  // Export permissions
  'export_reports': 'Export reports and presentations',
  'export_data': 'Export raw data and analysis',
  'export_operational_reports': 'Export operational reports'
};

// Create Executive Auth Context
const ExecutiveAuthContext = createContext({});

// Executive Auth Provider
export const ExecutiveAuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useClerkAuth();
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Load user role and permissions
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      loadUserRoleAndPermissions();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user]);

  const loadUserRoleAndPermissions = async () => {
    try {
      setLoading(true);
      setAuthError(null);

      // Get role from user metadata or API
      const roleId = user.publicMetadata?.role || user.privateMetadata?.role || 'viewer';
      const role = EXECUTIVE_ROLES[roleId.toUpperCase()] || EXECUTIVE_ROLES.VIEWER;
      
      setUserRole(role);
      
      // Set permissions based on role
      if (role.permissions.includes('*')) {
        setPermissions(Object.keys(PERMISSIONS));
      } else {
        setPermissions(role.permissions);
      }

      // Validate executive access
      if (role.level < 30) {
        setAuthError('Insufficient access level for executive platform');
      }

    } catch (error) {
      console.error('Error loading user role:', error);
      setAuthError('Failed to load user permissions');
      setUserRole(EXECUTIVE_ROLES.VIEWER);
      setPermissions(EXECUTIVE_ROLES.VIEWER.permissions);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!permissions.length) return false;
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissionList) => {
    if (!permissions.length) return false;
    if (permissions.includes('*')) return true;
    return permissionList.some(permission => permissions.includes(permission));
  };

  // Check if user has all specified permissions
  const hasAllPermissions = (permissionList) => {
    if (!permissions.length) return false;
    if (permissions.includes('*')) return true;
    return permissionList.every(permission => permissions.includes(permission));
  };

  // Get user access level
  const getAccessLevel = () => {
    return userRole?.level || 0;
  };

  // Check if user can access specific role level
  const canAccessLevel = (requiredLevel) => {
    return getAccessLevel() >= requiredLevel;
  };

  const contextValue = {
    // Clerk auth state
    isLoaded,
    isSignedIn,
    user,
    
    // Executive role state
    userRole,
    permissions,
    loading,
    authError,
    
    // Permission checking functions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getAccessLevel,
    canAccessLevel,
    
    // Utility functions
    loadUserRoleAndPermissions
  };

  return (
    <ExecutiveAuthContext.Provider value={contextValue}>
      {children}
    </ExecutiveAuthContext.Provider>
  );
};

// Hook to use executive auth
export const useExecutiveAuth = () => {
  const context = useContext(ExecutiveAuthContext);
  if (!context) {
    throw new Error('useExecutiveAuth must be used within ExecutiveAuthProvider');
  }
  return context;
};

// Protected Route Component
export const ExecutiveProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  requiredLevel = 30,
  fallback = null 
}) => {
  const { 
    isLoaded, 
    isSignedIn, 
    loading, 
    authError, 
    hasAnyPermission, 
    canAccessLevel 
  } = useExecutiveAuth();
  const location = useLocation();

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Access Error
            </CardTitle>
            <CardDescription>
              There was an issue with your account access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check permissions
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return fallback || <AccessDenied requiredPermissions={requiredPermissions} />;
  }

  // Check access level
  if (!canAccessLevel(requiredLevel)) {
    return fallback || <AccessDenied requiredLevel={requiredLevel} />;
  }

  return children;
};

// Access Denied Component
const AccessDenied = ({ requiredPermissions = [], requiredLevel = null }) => {
  const { userRole } = useExecutiveAuth();

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <Lock className="h-5 w-5 mr-2" />
            Access Denied
          </CardTitle>
          <CardDescription>
            You don't have permission to access this resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">Current Role</span>
            </div>
            <div className="flex items-center space-x-2">
              {userRole?.icon && <userRole.icon className="h-4 w-4 text-gray-600" />}
              <span className="text-sm text-gray-700">{userRole?.name || 'Unknown'}</span>
              <Badge variant={userRole?.badge || 'outline'} className="text-xs">
                Level {userRole?.level || 0}
              </Badge>
            </div>
          </div>

          {requiredPermissions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Required Permissions:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {requiredPermissions.map((permission) => (
                  <li key={permission} className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>{PERMISSIONS[permission] || permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {requiredLevel && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Required Access Level: {requiredLevel}
              </p>
              <p className="text-xs text-gray-600">
                Your current level: {userRole?.level || 0}
              </p>
            </div>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Contact your system administrator to request access to this resource.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

// Executive User Profile Component
export const ExecutiveUserProfile = () => {
  const { user, userRole, permissions, getAccessLevel } = useExecutiveAuth();

  if (!user || !userRole) return null;

  const IconComponent = userRole.icon;

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <div className={`p-2 rounded-full ${userRole.color} text-white`}>
          <IconComponent className="h-4 w-4" />
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-600">{userRole.name}</p>
        </div>
      </div>
      
      <Badge variant={userRole.badge} className="hidden lg:inline-flex">
        Level {getAccessLevel()}
      </Badge>
      
      <UserButton 
        appearance={{
          elements: {
            avatarBox: "h-8 w-8"
          }
        }}
      />
    </div>
  );
};

// Role Management Component (for Super Admins)
export const RoleManagement = () => {
  const { hasPermission } = useExecutiveAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasPermission('manage_users')) {
      loadUsers();
    }
  }, [hasPermission]);

  const loadUsers = async () => {
    try {
      // This would integrate with Clerk's user management API
      // For now, showing mock data
      setUsers([
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@company.com',
          role: 'CEO',
          lastActive: '2024-01-15',
          status: 'active'
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@company.com',
          role: 'CFO',
          lastActive: '2024-01-14',
          status: 'active'
        }
      ]);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('manage_users')) {
    return <AccessDenied requiredPermissions={['manage_users']} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          User Role Management
        </CardTitle>
        <CardDescription>
          Manage user roles and permissions for the executive platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => {
              const role = EXECUTIVE_ROLES[user.role.toUpperCase()] || EXECUTIVE_ROLES.VIEWER;
              const IconComponent = role.icon;
              
              return (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${role.color} text-white`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge variant={role.badge}>
                      {role.name}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Executive Sign In Component
export const ExecutiveSignIn = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Platform</h1>
          <p className="text-gray-600 mt-2">
            Working Capital Intelligence for Business Leaders
          </p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <SignIn 
              appearance={{
                elements: {
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                  card: "shadow-none border-0"
                }
              }}
              redirectUrl="/dashboard"
            />
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Secure access for executives, board members, and financial leaders
          </p>
        </div>
      </div>
    </div>
  );
};

// Executive Sign Up Component
export const ExecutiveSignUp = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Join Executive Platform</h1>
          <p className="text-gray-600 mt-2">
            Request access to the working capital intelligence platform
          </p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <SignUp 
              appearance={{
                elements: {
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                  card: "shadow-none border-0"
                }
              }}
              redirectUrl="/dashboard"
            />
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <Alert>
            <UserCheck className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Account approval required. Contact your administrator for access.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

// Main Executive Clerk Provider
const ExecutiveClerkProvider = ({ children }) => {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
                      process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ||
                      'pk_test_ZXhwZXJ0LWNvdWdhci0yNi5jbGVyay5hY2NvdW50cy5kZXYk';

  if (!clerkPubKey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            Clerk publishable key is not configured. Please check your environment variables.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      appearance={{
        baseTheme: 'light',
        variables: {
          colorPrimary: '#2563eb',
          colorBackground: '#ffffff',
          colorInputBackground: '#f8fafc',
          colorInputText: '#1e293b',
          borderRadius: '0.5rem'
        },
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
          card: 'shadow-lg border border-gray-200',
          headerTitle: 'text-gray-900',
          headerSubtitle: 'text-gray-600'
        }
      }}
    >
      <ExecutiveAuthProvider>
        {children}
      </ExecutiveAuthProvider>
    </ClerkProvider>
  );
};

export default ExecutiveClerkProvider;

// Export role definitions for use in other components
export { EXECUTIVE_ROLES, PERMISSIONS };
