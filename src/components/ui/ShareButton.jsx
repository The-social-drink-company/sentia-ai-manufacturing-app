import { devLog } from '../../lib/devLog.js';
/**
 * Share Button Component for PROMPT 8 Dashboard Overlay  
 * Provides signed deep link sharing with configurable TTL
 */

import React, { useState } from 'react'
import { 
  ShareIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'
import { useFeatureFlags } from '../../hooks/useFeatureFlags'
import { cn } from '../../lib/utils'

const SHARE_DURATIONS = {
  '1h': { value: 60, label: '1 Hour', description: 'Expires in 1 hour' },
  '4h': { value: 240, label: '4 Hours', description: 'Expires in 4 hours' },
  '1d': { value: 1440, label: '1 Day', description: 'Expires in 1 day' },
  '7d': { value: 10080, label: '7 Days', description: 'Expires in 7 days' },
  '30d': { value: 43200, label: '30 Days', description: 'Expires in 30 days' }
}

const SHARE_PERMISSIONS = {
  view: { 
    icon: EyeIcon, 
    label: 'View Only', 
    description: 'Recipients can view but not interact' 
  },
  interact: { 
    icon: UserGroupIcon, 
    label: 'View & Interact', 
    description: 'Recipients can view and interact with widgets' 
  },
  restricted: { 
    icon: LockClosedIcon, 
    label: 'Restricted View', 
    description: 'Limited data visibility for external users' 
  }
}

const ShareModal = ({ 
  isOpen, 
  onClose, 
  shareUrl, 
  onGenerateShare, 
  isGenerating = false 
}) => {
  const [duration, setDuration] = useState('1d')
  const [permission, setPermission] = useState('view')
  const [copied, setCopied] = useState(false)
  
  const handleCopyLink = async () => {
    if (!shareUrl) return
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const handleGenerateShare = () => {
    const settings = {
      duration: SHARE_DURATIONS[duration],
      permission: SHARE_PERMISSIONS[permission],
      expiresAt: new Date(Date.now() + SHARE_DURATIONS[duration].value * 60 * 1000).toISOString()
    }
    
    onGenerateShare?.(settings)
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
          aria-hidden="true"
        />
        
        {/* Modal panel */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Share Dashboard
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Share settings */}
          <div className="space-y-4 mb-6">
            {/* Duration selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                Link Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(SHARE_DURATIONS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label} - {config.description}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Permission selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Level
              </label>
              <div className="space-y-2">
                {Object.entries(SHARE_PERMISSIONS).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <label key={key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="permission"
                        value={key}
                        checked={permission === key}
                        onChange={(e) => setPermission(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {config.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {config.description}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Generate/Copy section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            {!shareUrl ? (
              <button
                onClick={handleGenerateShare}
                disabled={isGenerating}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Link...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2 inline" />
                    Generate Share Link
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                {/* Share URL display */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Shareable Link
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white break-all">
                    {shareUrl}
                  </div>
                </div>
                
                {/* Copy button */}
                <button
                  onClick={handleCopyLink}
                  className={cn(
                    "w-full px-4 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200",
                    copied
                      ? "text-green-800 bg-green-100 border-green-300 hover:bg-green-200 focus:ring-green-500 dark:text-green-200 dark:bg-green-900 dark:border-green-700"
                      : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700"
                  )}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4 mr-2 inline" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="w-4 h-4 mr-2 inline" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Expiry info */}
          {shareUrl && (
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="text-xs text-yellow-800 dark:text-yellow-200">
                <ClockIcon className="w-3 h-3 inline mr-1" />
                This link will expire {SHARE_DURATIONS[duration].description.toLowerCase()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ShareButton = ({ 
  dashboardId,
  widgetId = null,
  title = 'Dashboard',
  className = '',
  size = 'md',
  variant = 'button',
  onShare = null
}) => {
  const { hasBoardExport, shareLinkTTL } = useFeatureFlags()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  if (!hasBoardExport) {
    return null
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  }
  
  const handleGenerateShare = async (settings) => {
    setIsGenerating(true)
    
    try {
      // Mock share URL generation with signed token
      const token = btoa(JSON.stringify({
        dashboardId,
        widgetId,
        permission: settings.permission.label,
        expiresAt: settings.expiresAt,
        generatedAt: new Date().toISOString()
      }))
      
      const baseUrl = window.location.origin
      const shareType = widgetId ? 'widget' : 'dashboard'
      const id = widgetId || dashboardId
      
      const url = `${baseUrl}/share/${shareType}/${id}?token=${token}`
      
      setShareUrl(url)
      onShare?.(url, settings)
      
    } catch (error) {
      devLog.error('Failed to generate share link:', error)
      alert('Failed to generate share link. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleClick = () => {
    setShareUrl(null)
    setIsModalOpen(true)
  }
  
  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          className={cn(
            "inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            sizeClasses[size],
            className
          )}
          aria-label="Share dashboard"
        >
          <ShareIcon className={iconSizes[size]} />
        </button>
        
        <ShareModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          shareUrl={shareUrl}
          onGenerateShare={handleGenerateShare}
          isGenerating={isGenerating}
        />
      </>
    )
  }
  
  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          sizeClasses[size],
          className
        )}
        aria-label={`Share ${title}`}
      >
        <ShareIcon className={cn("mr-2", iconSizes[size])} />
        Share
      </button>
      
      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shareUrl={shareUrl}
        onGenerateShare={handleGenerateShare}
        isGenerating={isGenerating}
      />
    </>
  )
}

export { ShareButton, ShareModal, SHARE_DURATIONS, SHARE_PERMISSIONS }
export default ShareButton