/**
 * Hooks Barrel Export
 *
 * Centralized export file for all custom React hooks in the application.
 * This provides a clean import interface for components.
 *
 * @example
 * import { useAuth, useAuthRedirect, useRequireAuth } from '@/hooks'
 */

// Authentication Hooks
export { useAuth } from './useAuth'
export { useAuthRedirect } from './useAuthRedirect'
export { useRequireAuth } from './useRequireAuth'
export { useAuthRole } from './useAuthRole'

// SSE Hook
export { useSSE } from './useSSE'
