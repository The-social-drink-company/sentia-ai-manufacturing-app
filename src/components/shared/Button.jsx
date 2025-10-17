const Button = ({ children, disabled, variant = 'primary', className = '', ...props }) => {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50'
  const palette =
    variant === 'outline'
      ? 'border border-border bg-transparent text-foreground hover:bg-muted'
      : 'bg-primary text-primary-foreground hover:bg-primary/90'

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${base} ${palette} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
