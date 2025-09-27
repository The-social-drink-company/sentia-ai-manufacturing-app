import { cn } from '@/lib/utils'

const SPINNER_SIZES = {
  sm: 'size-4 border-[2px]',
  md: 'size-6 border-[3px]',
  lg: 'size-8 border-[3px]',
  xl: 'size-10 border-[4px]',
}

const LABEL_SIZES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
}

const VARIANT_STYLES = {
  primary: 'border-primary/40 border-t-primary',
  muted: 'border-muted border-t-muted-foreground',
  inverted: 'border-white/30 border-t-white',
}

function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  label,
  showLabel = false,
  className,
  ...props
}) {
  const resolvedSize = SPINNER_SIZES[size] ? size : 'md'
  const resolvedVariant = VARIANT_STYLES[variant] ? variant : 'primary'
  const spinnerLabel = label ?? 'Loading'
  const containerTone = variant === 'inverted' ? 'text-white' : 'text-muted-foreground'

  return (
    <div
      role='status'
      aria-live='polite'
      className={cn('inline-flex items-center gap-3', containerTone, className)}
      {...props}
    >
      <span className='relative inline-flex'>
        <span
          aria-hidden='true'
          className={cn(
            'inline-flex animate-spin rounded-full border-solid border-current border-t-transparent',
            SPINNER_SIZES[resolvedSize],
            VARIANT_STYLES[resolvedVariant],
          )}
        />
        <span
          aria-hidden='true'
          className={cn(
            'absolute inset-0 rounded-full border border-border/20',
            SPINNER_SIZES[resolvedSize],
          )}
        />
      </span>
      {(showLabel || label) && (
        <span className={cn('font-medium', LABEL_SIZES[resolvedSize])}>{spinnerLabel}</span>
      )}
      <span className='sr-only'>{spinnerLabel}</span>
    </div>
  )
}

export { LoadingSpinner }
