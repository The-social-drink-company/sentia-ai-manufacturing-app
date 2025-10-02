/**
 * Development Debug Panel
 * Shows debug information and tools in development mode only
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BugIcon, 
  DatabaseIcon, 
  ServerIcon, 
  WifiIcon, 
  RefreshCwIcon,
  TerminalIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [apiHealth, setApiHealth] = useState(null)
  const [systemInfo, setSystemInfo] = useState({})
  
  const queryClient = useQueryClient()
  
  // Simplified status for rollback version - no MCP dependencies
  const sseStatus = 'offline'
  const connectionDetails = { readyState: 'N/A', reconnectAttempts: 0 }

  // Only show in development mode
  const isDevelopmentMode = import.meta.env.VITE_DEVELOPMENT_MODE === 'true' || 
                           import.meta.env.NODE_ENV === 'development'

  if (!isDevelopmentMode) {
    return null
  }

  // Check API health
  const checkApiHealth = async () => {
    try {
      const response = await fetch('/api/status')
      if (response.ok) {
        const data = await response.json()
        setApiHealth(data)
      } else {
        setApiHealth({ error: `HTTP ${response.status}` })
      }
    } catch (error) {
      setApiHealth({ error: error.message })
    }
  }

  // Get system information
  const getSystemInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      webSocket: typeof WebSocket !== 'undefined',
      eventSource: typeof EventSource !== 'undefined',
    }
    setSystemInfo(info)
  }

  useEffect(() => {
    if (isOpen) {
      checkApiHealth()
      getSystemInfo()
    }
  }, [isOpen])

  // Clear all React Query cache
  const clearCache = () => {
    queryClient.clear()
    console.log('[DebugPanel] React Query cache cleared')
  }

  // Force refetch all queries
  const refetchAll = () => {
    queryClient.refetchQueries()
    console.log('[DebugPanel] All queries refetched')
  }

  // Clear localStorage
  const clearLocalStorage = () => {
    localStorage.clear()
    console.log('[DebugPanel] localStorage cleared')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="mb-2 bg-slate-900 border-slate-700 text-white hover:bg-slate-800"
      >
        <BugIcon className="w-4 h-4 mr-2" />
        Debug
        {isOpen ? (
          <ChevronDownIcon className="w-4 h-4 ml-2" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 ml-2" />
        )}
      </Button>

      {/* Debug Panel */}
      {isOpen && (
        <Card className="w-96 max-h-96 overflow-y-auto bg-slate-900 border-slate-700 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TerminalIcon className="w-5 h-5 mr-2" />
              Development Debug Panel
            </CardTitle>
            <CardDescription className="text-slate-400">
              Development mode debugging tools
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Environment Info */}
            <div>
              <h4 className="font-medium text-sm mb-2">Environment</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <Badge variant="outline" className="text-xs">
                    {import.meta.env.NODE_ENV}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Development Mode:</span>
                  <Badge 
                    variant={import.meta.env.VITE_DEVELOPMENT_MODE === 'true' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {import.meta.env.VITE_DEVELOPMENT_MODE || 'false'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>API Base URL:</span>
                  <span className="text-slate-400 truncate ml-2">
                    {import.meta.env.VITE_API_BASE_URL || '/api'}
                  </span>
                </div>
              </div>
            </div>

            {/* API Health */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <ServerIcon className="w-4 h-4 mr-1" />
                API Health
                <Button
                  onClick={checkApiHealth}
                  variant="ghost"
                  size="sm"
                  className="ml-auto p-1 h-6 w-6"
                >
                  <RefreshCwIcon className="w-3 h-3" />
                </Button>
              </h4>
              <div className="text-xs space-y-1">
                {apiHealth ? (
                  <>
                    {apiHealth.error ? (
                      <div className="text-red-400">Error: {apiHealth.error}</div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge variant="default" className="text-xs bg-green-600">
                            {apiHealth.status || 'operational'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Service:</span>
                          <span className="text-slate-400">{apiHealth.service}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Version:</span>
                          <span className="text-slate-400">{apiHealth.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Environment:</span>
                          <span className="text-slate-400">{apiHealth.environment}</span>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-slate-500">Click refresh to check</div>
                )}
              </div>
            </div>

            {/* Data Source Status */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <ServerIcon className="w-4 h-4 mr-1" />
                Data Source
              </h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <Badge variant="outline" className="text-xs bg-blue-600">
                    Static Data
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Source:</span>
                  <span className="text-slate-400">Local Components</span>
                </div>
                <div className="flex justify-between">
                  <span>API Integration:</span>
                  <span className="text-slate-400">Disabled (Rollback Mode)</span>
                </div>
              </div>
            </div>

            {/* SSE Connection */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <WifiIcon className="w-4 h-4 mr-1" />
                Real-time Connection
              </h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge 
                    variant={sseStatus === 'connected' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {sseStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Ready State:</span>
                  <span className="text-slate-400">{connectionDetails.readyState}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reconnect Attempts:</span>
                  <span className="text-slate-400">{connectionDetails.reconnectAttempts}</span>
                </div>
              </div>
            </div>

            {/* React Query Cache */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <DatabaseIcon className="w-4 h-4 mr-1" />
                React Query Cache
              </h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Cached Queries:</span>
                  <span className="text-slate-400">
                    {queryClient.getQueryCache().getAll().length}
                  </span>
                </div>
                <div className="space-x-2">
                  <Button onClick={refetchAll} variant="outline" size="sm" className="text-xs">
                    Refetch All
                  </Button>
                  <Button onClick={clearCache} variant="outline" size="sm" className="text-xs">
                    Clear Cache
                  </Button>
                </div>
              </div>
            </div>

            {/* Browser Info */}
            <div>
              <h4 className="font-medium text-sm mb-2">Browser</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Online:</span>
                  <Badge 
                    variant={systemInfo.onLine ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {systemInfo.onLine ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Viewport:</span>
                  <span className="text-slate-400">{systemInfo.viewport}</span>
                </div>
                <div className="flex justify-between">
                  <span>LocalStorage:</span>
                  <Badge 
                    variant={systemInfo.localStorage ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {systemInfo.localStorage ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>EventSource:</span>
                  <Badge 
                    variant={systemInfo.eventSource ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {systemInfo.eventSource ? 'Supported' : 'Not Supported'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div>
              <h4 className="font-medium text-sm mb-2">Actions</h4>
              <div className="space-y-2">
                <Button 
                  onClick={clearLocalStorage} 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                >
                  Clear LocalStorage
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DebugPanel