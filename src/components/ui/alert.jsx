import React from 'react'

const Alert = ({ variant = 'default', className = '', children, ...props }) => {
  const baseStyles = 'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground'
  
  const variants = {
    default: 'bg-white text-gray-950 border-gray-200',
    destructive: 'border-red-500/50 text-red-950 bg-red-50 [&>svg]:text-red-600'
  }
  
  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

const AlertDescription = ({ className = '', ...props }) => (
  <div
    className={`text-sm [&_p]:leading-relaxed ${className}`}
    {...props}
  />
)

export { Alert, AlertDescription }