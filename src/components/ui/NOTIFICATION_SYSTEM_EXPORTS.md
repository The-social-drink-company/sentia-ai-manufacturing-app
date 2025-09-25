# CRITICAL: NotificationSystem.jsx Required Exports

## ⚠️ DO NOT REMOVE THESE EXPORTS ⚠️

The following exports are **REQUIRED** in `NotificationSystem.jsx` and **MUST NOT** be removed:

### Required Exports:

1. **`useNotifications` hook**
   - Used by: `UIShowcase.jsx`
   - Purpose: Provides notification methods (showSuccess, showError, showWarning, showInfo, showMagic)
   - Dependencies: useCallback from React

2. **`NotificationProvider` component**  
   - Used by: `UIShowcase.jsx`
   - Purpose: Context provider for global notification system
   - Wraps children with NotificationSystem

### Export Code (MUST EXIST):

```javascript
// Custom hook for notifications
export const useNotifications = () => {
  const showSuccess = useCallback((title, message, duration) => {
    notify({ type: 'success', title, message, duration })
  }, [])

  const showError = useCallback((title, message, duration) => {
    notify({ type: 'error', title, message, duration })
  }, [])

  const showWarning = useCallback((title, message, duration) => {
    notify({ type: 'warning', title, message, duration })
  }, [])

  const showInfo = useCallback((title, message, duration) => {
    notify({ type: 'info', title, message, duration })
  }, [])

  const showMagic = useCallback((title, message, duration) => {
    notify({ type: 'magic', title, message, duration })
  }, [])

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showMagic
  }
}

// Context provider component
export const NotificationProvider = ({ children }) => {
  return (
    <div>
      {children}
      <NotificationSystem />
    </div>
  )
}
```

### Dependencies:
- `useCallback` must be imported from 'react'
- These exports depend on the internal `notify` function

### If Removed:
- **Build will FAIL** with: `"useNotifications" is not exported by "src/components/ui/NotificationSystem.jsx"`
- UIShowcase component will be unusable
- Production deployments will break

### Last Restored: September 8, 2025
### Reason: UIShowcase.jsx imports depend on these exports