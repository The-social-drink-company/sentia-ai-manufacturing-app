import React from 'react'

const Badge = ({ variant = 'default', className = '', children, ...props }) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    default: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    destructive: 'bg-red-100 text-red-800 hover:bg-red-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
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

export { Badge }