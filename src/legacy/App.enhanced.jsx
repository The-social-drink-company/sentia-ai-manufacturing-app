import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Enhanced Executive Authentication
import ExecutiveClerkProvider, { 
  ExecutiveProtectedRoute, 
  ExecutiveSignIn, 
  ExecutiveSignUp,
  useExecutiveAuth,
  ExecutiveUserProfile,
  RoleManagement
} from './auth/ExecutiveClerkProvider';

// Enhanced Components with lazy loading for performance
const ExecutiveWorkingCapitalDashboard = lazy(() => import('./components/executive/ExecutiveWorkingCapitalDashboard'));
const BoardReadyReportGenerator = lazy(() => import('./components/reporting/BoardReadyReportGenerator'));
const DataManagementCenter = lazy(() => import('./components/data/DataManagementCenter'));

// Existing components (lazy loaded for performance)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const WorldClassDashboard = lazy(() => import('./pages/WorldClassDashboard'));
const SimpleDashboard = lazy(() => import('./pages/SimpleDashboard'));
const LandingPageSimple = lazy(() => import('./pages/LandingPageSimple'));

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { 
import { logDebug, logInfo, logWarn, logError } from './utils/logger';

  LayoutDashboard, 
  FileText, 
  Database, 
  Settings, 
  Users,
  TrendingUp,
  Building2,
  Brain,
  Zap,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Menu,
  X,
  Home,
  LogOut
} from 'lucide-react';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
});

// Loading Component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Application Error
              </CardTitle>
              <CardDescription>
                Something went wrong with the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription className="text-sm">
                  {this.state.error?.message || null}
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full mt-4"
              >
                Reload Application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Navigation Component
const Navigation = ({ sidebarOpen, setSidebarOpen }) => {
  const { userRole, hasPermission, user } = useExecutiveAuth();

  const navigationItems = [
    {
      name: 'Executive Dashboard',
      href: '/dashboard/executive',
      icon: LayoutDashboard,
      permissions: ['view_executive_dashboard', 'view_all_reports'],
      description: 'Working capital intelligence and strategic insights'
    },
    {
      name: 'Board Reports',
      href: '/reports',
      icon: FileText,
      permissions: ['view_board_reports', 'view_all_reports'],
      description: 'Generate board-ready presentations and reports'
    },
    {
      name: 'Data Management',
      href: '/data',
      icon: Database,
      permissions: ['manage_financial_data', 'view_financial_data'],
      description: 'Upload and manage financial data sources'
    },
    {
      name: 'World Class Dashboard',
      href: '/dashboard/world-class',
      icon: TrendingUp,
      permissions: ['view_all_reports', 'view_operational_metrics'],
      description: 'Comprehensive operational and financial metrics'
    },
    {
      name: 'Simple Dashboard',
      href: '/dashboard/simple',
      icon: BarChart3,
      permissions: ['view_reports', 'view_basic_dashboards'],
      description: 'Simplified view of key metrics'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      permissions: ['manage_users'],
      description: 'Manage user roles and permissions'
    },
    {
      name: 'System Settings',
      href: '/admin/settings',
      icon: Settings,
      permissions: ['manage_system'],
      description: 'System configuration and settings'
    }
  ];

  const visibleItems = navigationItems.filter(item => 
    item.permissions.some(permission => hasPermission(permission))
  );

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Executive Platform</h1>
                <p className="text-xs text-gray-600">Working Capital Intelligence</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${userRole?.color || null} text-white`}>
                {userRole?.icon && <userRole.icon className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {"User"} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600 truncate">{userRole?.name}</p>
              </div>
              <Badge variant={userRole?.badge || null} className="text-xs">
                L{userRole?.level || 0}
              </Badge>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {visibleItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <IconComponent className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-600 hover:text-red-600"
              onClick={() => {
                // This would trigger Clerk sign out
                window.location.href = '/sign-out';
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

// Main Layout Component
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userRole } = useExecutiveAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Working Capital Intelligence Platform
                </h2>
                <p className="text-sm text-gray-600">
                  {userRole?.description || null}
                </p>
              </div>
            </div>
            
            <ExecutiveUserProfile />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Suspense 0>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

// Dashboard Router Component
const DashboardRouter = () => {
  const { hasPermission, canAccessLevel } = useExecutiveAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load real data from APIs
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/dashboard/executive`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard data from API');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      logError('Error loading dashboard data:', error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  return (
    <Routes>
      {/* Executive Dashboard */}
      <Route 
        path="/dashboard/executive" 
        element={
          <ExecutiveProtectedRoute 
            requiredPermissions={['view_executive_dashboard', 'view_all_reports']}
            requiredLevel={70}
          >
            <ExecutiveWorkingCapitalDashboard 
              dashboardData={dashboardData}
              onDataUpdate={setDashboardData}
            />
          </ExecutiveProtectedRoute>
        } 
      />

      {/* Board Reports */}
      <Route 
        path="/reports" 
        element={
          <ExecutiveProtectedRoute 
            requiredPermissions={['view_board_reports', 'view_all_reports']}
            requiredLevel={75}
          >
            <BoardReadyReportGenerator 
              dashboardData={dashboardData}
              companyInfo={{ name: 'Sentia Manufacturing' }}
            />
          </ExecutiveProtectedRoute>
        } 
      />

      {/* Data Management */}
      <Route 
        path="/data" 
        element={
          <ExecutiveProtectedRoute 
            requiredPermissions={['manage_financial_data', 'view_financial_data']}
            requiredLevel={50}
          >
            <DataManagementCenter 
              onDataUpdate={(dataType, data) => {
                logDebug('Data updated:', dataType, data);
                loadDashboardData(); // Refresh dashboard data
              }}
              currentAnalysisType="comprehensive"
            />
          </ExecutiveProtectedRoute>
        } 
      />

      {/* World Class Dashboard */}
      <Route 
        path="/dashboard/world-class" 
        element={
          <ExecutiveProtectedRoute 
            requiredPermissions={['view_all_reports', 'view_operational_metrics']}
            requiredLevel={60}
          >
            <WorldClassDashboard />
          </ExecutiveProtectedRoute>
        } 
      />

      {/* Simple Dashboard */}
      <Route 
        path="/dashboard/simple" 
        element={
          <ExecutiveProtectedRoute 
            requiredPermissions={['view_reports', 'view_basic_dashboards']}
            requiredLevel={30}
          >
            <SimpleDashboard />
          </ExecutiveProtectedRoute>
        } 
      />

      {/* User Management */}
      <Route 
        path="/admin/users" 
        element={
          <ExecutiveProtectedRoute 
            requiredPermissions={['manage_users']}
            requiredLevel={100}
          >
            <RoleManagement />
          </ExecutiveProtectedRoute>
        } 
      />

      {/* Default redirect */}
      <Route 
        path="/" 
        element={
          canAccessLevel(70) ? 
            <Navigate to="/dashboard/executive" replace /> :
            <Navigate to="/dashboard/simple" replace />
        } 
      />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ExecutiveClerkProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/landing" element={<LandingPageSimple />} />
                <Route path="/sign-in" element={<ExecutiveSignIn />} />
                <Route path="/sign-up" element={<ExecutiveSignUp />} />
                
                {/* Protected dashboard routes */}
                <Route 
                  path="/*" 
                  element={
                    <ExecutiveProtectedRoute requiredLevel={30}>
                      <MainLayout>
                        <DashboardRouter />
                      </MainLayout>
                    </ExecutiveProtectedRoute>
                  } 
                />
              </Routes>
              
              {/* Global components */}
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    theme: {
                      primary: '#4aed88',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </ExecutiveClerkProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
