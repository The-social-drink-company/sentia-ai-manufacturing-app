const gradients = {
  primary: 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg hover:brightness-110',
  outline: 'border border-white/20 bg-transparent text-white hover:bg-white/10',
  ghost: 'bg-white/10 text-white hover:bg-white/20'
}

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const palette = gradients[variant] ?? gradients.primary
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${palette} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
