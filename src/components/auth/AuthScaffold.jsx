import React from 'react'
import { Link } from 'react-router-dom'

const AuthScaffold = ({
  heading = 'Welcome to CapLiquify',
  subheading = 'Sign in to your account',
  cardClassName = '',
  maxWidth = 'max-w-md',
  footer,
  children,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className={`${maxWidth} w-full p-8 bg-white rounded-lg shadow-xl ${cardClassName}`}>
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
          </Link>
          {heading && <h2 className="text-2xl font-bold text-gray-900 mb-2">{heading}</h2>}
          {subheading && <p className="text-gray-600">{subheading}</p>}
        </div>

        <div className="mt-6">{children}</div>

        {footer && <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>}
      </div>
    </div>
  )
}

export default AuthScaffold
