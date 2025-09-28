const baseStyles = 'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-0'
const variants = {
  primary: 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg hover:brightness-110 focus:ring-cyan-300/60',
  outline: 'border border-white/20 bg-transparent text-white hover:bg-white/10 focus:ring-white/30',
  ghost: 'bg-white/10 text-white hover:bg-white/20 focus:ring-white/20'
}

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const palette = variants[variant] ?? variants.primary
  return (
    <button type="button" className={`${baseStyles} ${palette} ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button
export { Button }
