import { devLog } from '../../lib/devLog.js';\nimport React, { useState, useEffect, useMemo } from 'react'
import { CheckCircle, XCircle, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react'

export default function PasswordPolicyChecker({ 
  password, 
  userInfo = {}, 
  onValidationChange,
  showPassword = false,
  className = ""
}) {
  const [policy, setPolicy] = useState(null)
  const [validation, setValidation] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch password policy on mount
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await fetch('/api/auth/password-policy')
        if (response.ok) {
          const data = await response.json()
          setPolicy(data.policy)
        }
      } catch (error) {
        devLog.error('Failed to fetch password policy:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPolicy()
  }, [])

  // Validate password whenever it changes
  const passwordValidation = useMemo(() => {
    if (!password || !policy) return null

    const result = {
      isValid: true,
      score: 0,
      issues: [],
      recommendations: [],
      checks: []
    }

    // Length check
    const lengthCheck = {
      name: 'Length',
      description: `At least ${policy.minLength} characters`,
      passed: password.length >= policy.minLength,
      critical: true
    }
    result.checks.push(lengthCheck)
    if (!lengthCheck.passed) {
      result.isValid = false
      result.issues.push(`Password must be at least ${policy.minLength} characters long`)
    } else {
      result.score += Math.min(password.length / 4, 6)
    }

    // Character type checks
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)

    const uppercaseCheck = {
      name: 'Uppercase Letters',
      description: 'At least one uppercase letter (A-Z)',
      passed: hasUppercase,
      critical: policy.requireUppercase
    }
    result.checks.push(uppercaseCheck)
    if (policy.requireUppercase && !hasUppercase) {
      result.isValid = false
      result.issues.push('Password must contain at least one uppercase letter')
    } else if (hasUppercase) {
      result.score += 1
    }

    const lowercaseCheck = {
      name: 'Lowercase Letters', 
      description: 'At least one lowercase letter (a-z)',
      passed: hasLowercase,
      critical: policy.requireLowercase
    }
    result.checks.push(lowercaseCheck)
    if (policy.requireLowercase && !hasLowercase) {
      result.isValid = false
      result.issues.push('Password must contain at least one lowercase letter')
    } else if (hasLowercase) {
      result.score += 1
    }

    const numbersCheck = {
      name: 'Numbers',
      description: 'At least one number (0-9)', 
      passed: hasNumbers,
      critical: policy.requireNumbers
    }
    result.checks.push(numbersCheck)
    if (policy.requireNumbers && !hasNumbers) {
      result.isValid = false
      result.issues.push('Password must contain at least one number')
    } else if (hasNumbers) {
      result.score += 1
    }

    const specialCharsCheck = {
      name: 'Special Characters',
      description: 'At least one special character (!@#$%^&*)',
      passed: hasSpecialChars,
      critical: policy.requireSpecialChars
    }
    result.checks.push(specialCharsCheck)
    if (policy.requireSpecialChars && !hasSpecialChars) {
      result.isValid = false
      result.issues.push('Password must contain at least one special character')
    } else if (hasSpecialChars) {
      result.score += 2
    }

    // Complexity scoring
    const uniqueChars = new Set(password).size
    result.score += Math.min(uniqueChars / 4, 3)

    // Pattern detection
    if (/(.)\1{2,}/.test(password)) {
      result.score -= 2
      result.recommendations.push('Avoid repeating characters')
    }

    if (/(012|123|234|345|456|567|678|789|890|abc|bcd|cde)/.test(password.toLowerCase())) {
      result.score -= 2
      result.recommendations.push('Avoid sequential characters')
    }

    // Context-aware validation
    if (userInfo.email) {
      const emailLocal = userInfo.email.split('@')[0].toLowerCase()
      if (password.toLowerCase().includes(emailLocal) && emailLocal.length > 3) {
        result.score -= 3
        result.recommendations.push('Avoid using parts of your email address')
      }
    }

    if (userInfo.name) {
      const nameParts = userInfo.name.toLowerCase().split(' ')
      for (const part of nameParts) {
        if (part.length > 2 && password.toLowerCase().includes(part)) {
          result.score -= 2
          result.recommendations.push('Avoid using parts of your name')
          break
        }
      }
    }

    // Final score validation
    result.score = Math.max(0, Math.min(20, result.score))
    
    const complexityCheck = {
      name: 'Complexity Score',
      description: `Score of ${policy.minComplexityScore} or higher`,
      passed: result.score >= policy.minComplexityScore,
      critical: true,
      score: result.score,
      maxScore: 20
    }
    result.checks.push(complexityCheck)
    
    if (result.score < policy.minComplexityScore) {
      result.isValid = false
      result.issues.push(`Password complexity score (${result.score}) is below required minimum (${policy.minComplexityScore})`)
    }

    return result
  }, [password, policy, userInfo])

  // Update parent component when validation changes
  useEffect(() => {
    if (passwordValidation && onValidationChange) {
      onValidationChange(passwordValidation)
    }
  }, [passwordValidation, onValidationChange])

  // Set validation state
  useEffect(() => {
    setValidation(passwordValidation)
  }, [passwordValidation])

  if (loading) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!validation) {
    return null
  }

  const getStrengthColor = (score) => {
    if (score < 6) return 'bg-red-500'
    if (score < 10) return 'bg-amber-500'  
    if (score < 15) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getStrengthText = (score) => {
    if (score < 6) return 'Weak'
    if (score < 10) return 'Fair'
    if (score < 15) return 'Good' 
    return 'Strong'
  }

  return (
    <div className={`p-4 bg-white border rounded-lg ${className}`}>
      <div className="flex items-center mb-3">
        <Shield className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-sm font-semibold text-gray-900">Password Requirements</h3>
      </div>

      {/* Password Strength Meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Strength</span>
          <span className={`text-xs font-medium ${
            validation.score < 6 ? 'text-red-600' :
            validation.score < 10 ? 'text-amber-600' :
            validation.score < 15 ? 'text-blue-600' : 'text-green-600'
          }`}>
            {getStrengthText(validation.score)} ({validation.score}/20)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(validation.score)}`}
            style={{ width: `${Math.min((validation.score / 20) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Requirement Checks */}
      <div className="space-y-2">
        {validation.checks.map((check, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              {check.passed ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <XCircle className={`h-4 w-4 mr-2 ${check.critical ? 'text-red-500' : 'text-gray-400'}`} />
              )}
              <span className={`text-sm ${check.passed ? 'text-green-700' : check.critical ? 'text-red-700' : 'text-gray-600'}`}>
                {check.name}
              </span>
            </div>
            
            {check.name === 'Complexity Score' && (
              <span className="text-xs text-gray-500">
                {check.score}/{check.maxScore}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Issues */}
      {validation.issues.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <XCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-medium text-red-800 mb-1">Issues to fix:</h4>
              <ul className="text-xs text-red-700 space-y-1">
                {validation.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {validation.recommendations.length > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-medium text-amber-800 mb-1">Recommendations:</h4>
              <ul className="text-xs text-amber-700 space-y-1">
                {validation.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Policy Information */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Password history: Last {policy?.preventReuse || 5} passwords cannot be reused</div>
          <div>• Password expires after {policy?.maxAge || 90} days</div>
          <div>• Maximum length: {policy?.maxLength || 128} characters</div>
        </div>
      </div>
    </div>
  )
}