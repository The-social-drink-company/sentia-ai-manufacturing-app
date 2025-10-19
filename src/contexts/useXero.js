import { useContext } from 'react'

import { XeroContext } from './xero-context-shared'

export const useXero = () => {
  const context = useContext(XeroContext)
  if (!context) {
    throw new Error('useXero must be used within a XeroProvider')
  }
  return context
}
