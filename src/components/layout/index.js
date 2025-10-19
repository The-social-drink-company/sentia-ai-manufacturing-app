/**
 * Layout Component Library
 * Barrel export for easy imports
 *
 * Usage:
 *   import { DashboardHeader, DashboardSidebar, Layout } from '@/components/layout';
 *
 * BMAD-UI-002: Component Library Structure
 */

// Core Layout Components
export { default as AppLayout } from './AppLayout';
export { default as Layout } from './Layout';

// Dashboard Layout
export { default as DashboardHeader } from './DashboardHeader';
export { default as DashboardSidebar } from './DashboardSidebar';
export { default as Header } from './Header';

// Mobile Components
export { default as MobileMenuButton } from './MobileMenuButton';

// Notifications
export { default as NotificationDropdown } from './NotificationDropdown';

// Navigation
export { default as Sidebar } from './Sidebar';

// System Status
export { default as SSEStatusIndicator } from './SSEStatusIndicator';
export { default as SystemStatusBadge } from './SystemStatusBadge';

// Route Protection
export { default as ProtectedRoute } from './ProtectedRoute';
