import { devLog } from '../lib/devLog.js';\n/**
 * Export Button Component for PROMPT 8 Dashboard Overlay
 * Provides CSV/PNG export per widget and PDF export for entire dashboard
 */

import React, { useState } from 'react'
import { 
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  PhotoIcon,
  TableCellsIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { useFeatureFlags } from '../../hooks/useFeatureFlags'
import { cn } from '../../lib/utils'

const EXPORT_FORMATS = {
  csv: {
    icon: TableCellsIcon,
    label: 'Export CSV',
    description: 'Download data as CSV spreadsheet',
    extension: 'csv',
    mimeType: 'text/csv'
  },
  png: {
    icon: PhotoIcon,
    label: 'Export PNG',
    description: 'Save widget as PNG image',
    extension: 'png',
    mimeType: 'image/png'
  },
  pdf: {
    icon: DocumentTextIcon,
    label: 'Export PDF',
    description: 'Generate PDF report',
    extension: 'pdf',
    mimeType: 'application/pdf'
  }
}

const ExportDropdown = ({ 
  formats = ['csv', 'png'], 
  onExport, 
  isExporting = false,
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
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
  
  const handleExport = async (format) => {
    setIsOpen(false)
    if (onExport) {
      await onExport(format)
    }
  }
  
  return (
    <div className={cn("relative inline-block", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className={cn(
          "inline-flex items-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          sizeClasses[size],
          (disabled || isExporting) && "opacity-50 cursor-not-allowed",
          className
        )}
        aria-label="Export options"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {isExporting ? (
          <div className={cn("animate-spin rounded-full border-2 border-blue-500 border-t-transparent", iconSizes[size])} />
        ) : (
          <ArrowDownTrayIcon className={cn("mr-1", iconSizes[size])} />
        )}
        <span>Export</span>
        <EllipsisVerticalIcon className={cn("ml-1", iconSizes[size])} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-20 mt-2 w-56 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1" role="menu" aria-orientation="vertical">
              {formats.map((format) => {
                const config = EXPORT_FORMATS[format]
                if (!config) return null
                
                const Icon = config.icon
                
                return (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    role="menuitem"
                  >
                    <Icon className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {config.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const ExportButton = ({ 
  widgetId,
  widgetTitle = 'Widget',
  data = null,
  formats = ['csv', 'png'],
  size = 'md',
  variant = 'dropdown',
  className = '',
  onExportStart = null,
  onExportComplete = null,
  onExportError = null
}) => {
  const { hasBoardExport } = useFeatureFlags()
  const [isExporting, setIsExporting] = useState(false)
  
  if (!hasBoardExport) {
    return null
  }
  
  const generateCSV = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data available for CSV export')
    }
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ].join('\n')
    
    return csvContent
  }
  
  const captureWidgetAsPNG = async (widgetId) => {
    const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`)
    if (!widgetElement) {
      throw new Error('Widget element not found for PNG export')
    }
    
    // Use html2canvas for actual implementation
    // For now, return a placeholder
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    
    // Create a simple placeholder
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#374151'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${widgetTitle} - PNG Export`, canvas.width / 2, canvas.height / 2)
    ctx.fillText('(Placeholder - implement html2canvas)', canvas.width / 2, canvas.height / 2 + 30)
    
    return canvas.toDataURL('image/png')
  }
  
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  const downloadDataURL = (dataURL, filename) => {
    const link = document.createElement('a')
    link.href = dataURL
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  const handleExport = async (format) => {
    setIsExporting(true)
    
    try {
      onExportStart?.(format, widgetId)
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
      const baseFilename = `${widgetTitle.replace(/\s+/g, '_').toLowerCase()}_${timestamp}`
      
      switch (format) {
        case 'csv': {
          if (!data) {
            throw new Error('No data provided for CSV export')
          }
          const csvContent = generateCSV(data)
          downloadFile(csvContent, `${baseFilename}.csv`, EXPORT_FORMATS.csv.mimeType)
          break
        }
        
        case 'png': {
          const dataURL = await captureWidgetAsPNG(widgetId)
          downloadDataURL(dataURL, `${baseFilename}.png`)
          break
        }
        
        case 'pdf': {
          // PDF generation for entire dashboard would be implemented here
          // For now, show a placeholder
          const pdfContent = `PDF Export Placeholder for ${widgetTitle}\nGenerated: ${new Date().toLocaleString()}`
          downloadFile(pdfContent, `${baseFilename}.pdf`, EXPORT_FORMATS.pdf.mimeType)
          break
        }
        
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
      
      onExportComplete?.(format, widgetId)
      
    } catch (error) {
      devLog.error('Export failed:', error)
      onExportError?.(error, format, widgetId)
      
      // Show user-friendly error
      alert(`Export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }
  
  if (variant === 'dropdown') {
    return (
      <ExportDropdown
        formats={formats}
        onExport={handleExport}
        isExporting={isExporting}
        size={size}
        className={className}
      />
    )
  }
  
  // Simple button variant (for single format)
  const format = formats[0] || 'csv'
  const config = EXPORT_FORMATS[format]
  const Icon = config.icon
  
  return (
    <button
      onClick={() => handleExport(format)}
      disabled={isExporting}
      className={cn(
        "inline-flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        isExporting && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={config.label}
    >
      {isExporting ? (
        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      ) : (
        <Icon className="w-4 h-4 mr-2" />
      )}
      {config.label}
    </button>
  )
}

export { ExportButton, ExportDropdown, EXPORT_FORMATS }
export default ExportButton