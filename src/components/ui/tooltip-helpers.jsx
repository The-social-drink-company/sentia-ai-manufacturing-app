import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * Simple Tooltip Wrapper (BMAD-UX-008)
 *
 * Convenience component for quickly adding tooltips to any element
 *
 * Features:
 * - Keyboard accessible (shows on focus)
 * - Automatic delay (0ms for instant display)
 * - Arrow indicator pointing to trigger
 * - Smooth animations (fade + zoom)
 *
 * Usage:
 * <SimpleTooltip content="Refresh data">
 *   <button><RefreshIcon /></button>
 * </SimpleTooltip>
 */
export function SimpleTooltip({ content, children, side = 'top', ...props }) {
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Icon Button Tooltip Wrapper (BMAD-UX-008)
 *
 * Specialized wrapper for icon-only buttons with ARIA labels
 *
 * Features:
 * - Adds aria-label automatically
 * - Keyboard navigation support
 * - Touch-friendly (shows on long-press on mobile)
 * - WCAG 2.1 AA compliant
 *
 * Usage:
 * <IconTooltip label="Delete item">
 *   <button><TrashIcon /></button>
 * </IconTooltip>
 */
export function IconTooltip({ label, children, side = 'bottom', ...props }) {
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild aria-label={label}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Help Tooltip (BMAD-UX-008)
 *
 * For industry terms, abbreviations, and contextual help
 *
 * Features:
 * - Question mark icon built-in
 * - Wider content area for explanations (max-w-xs)
 * - Text balancing for multiline content
 * - Keyboard accessible
 *
 * Usage:
 * <HelpTooltip content="Days Sales Outstanding (DSO) measures...">
 *   DSO
 * </HelpTooltip>
 */
export function HelpTooltip({ content, children, side = 'top', className = '', ...props }) {
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1 cursor-help border-b border-dashed border-slate-400 ${className}`}
        >
          {children}
          <svg
            className="h-3.5 w-3.5 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-balance">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Abbreviation Tooltip (BMAD-UX-008)
 *
 * For expanding abbreviations and acronyms
 *
 * Features:
 * - Semantic <abbr> element (SEO + screen readers)
 * - Dotted underline (standard abbreviation styling)
 * - Keyboard accessible
 * - Supports title attribute fallback (no JS)
 *
 * Usage:
 * <AbbrTooltip abbr="OEE" full="Overall Equipment Effectiveness">
 *   OEE: 94.2%
 * </AbbrTooltip>
 */
export function AbbrTooltip({ abbr, full, children, side = 'top', ...props }) {
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild>
        <abbr
          title={full}
          className="cursor-help no-underline border-b border-dotted border-slate-400"
        >
          {children || abbr}
        </abbr>
      </TooltipTrigger>
      <TooltipContent side={side}>{full}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Badge with Tooltip (BMAD-UX-008)
 *
 * Status badges with explanatory tooltips
 *
 * Usage:
 * <BadgeTooltip status="success" tooltip="All integrations connected">
 *   Active
 * </BadgeTooltip>
 */
export function BadgeTooltip({ status = 'default', tooltip, children, side = 'top', ...props }) {
  const statusColors = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    default: 'bg-slate-100 text-slate-800 border-slate-200',
  }

  const badge = (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColors[status]}`}
    >
      {children}
    </span>
  )

  if (!tooltip) return badge

  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild>
        <span className="cursor-help">{badge}</span>
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
