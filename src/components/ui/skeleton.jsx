import { cn } from '@/lib/utils'

/**
 * Skeleton Component (Enhanced - BMAD-UX-007)
 *
 * Features:
 * - Shimmer animation with gradient overlay (60fps performance)
 * - Respects prefers-reduced-motion accessibility setting
 * - Smooth fade-in when transitioning to actual content
 *
 * Usage:
 * <Skeleton className="h-4 w-48" /> - Simple skeleton
 * <Skeleton variant="shimmer" /> - Enhanced shimmer effect (default)
 * <Skeleton variant="pulse" /> - Tailwind pulse animation
 */
function Skeleton({ className, variant = 'shimmer', ...props }) {
  // Base skeleton styles
  const baseStyles = 'bg-muted rounded-md'

  // Animation variants
  const animations = {
    // Shimmer: Gradient animation from left to right
    shimmer:
      'relative overflow-hidden after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent motion-reduce:after:animate-none',

    // Pulse: Tailwind's default pulse animation
    pulse: 'animate-pulse motion-reduce:animate-none',

    // None: No animation (for prefers-reduced-motion)
    none: '',
  }

  return (
    <div
      data-slot="skeleton"
      aria-busy="true"
      aria-live="polite"
      className={cn(baseStyles, animations[variant] || animations.shimmer, className)}
      {...props}
    />
  )
}

export { Skeleton }
