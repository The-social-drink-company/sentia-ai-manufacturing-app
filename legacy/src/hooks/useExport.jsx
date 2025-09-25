/**
 * Export Hook for PROMPT 8 Dashboard Overlay
 * Provides centralized export functionality for widgets and dashboard
 */

import { useState, useCallback } from 'react'
import { useFeatureFlags } from './useFeatureFlags'

// Export utilities that would be implemented with proper libraries
const exportUtils = {
  // Convert data to CSV format
  generateCSV: (data, options = {}) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data available for CSV export')
    }
    
    const { 
      headers = null, 
      separator = ',',
      includeHeaders = true,
      dateFormat = 'ISO'
    } = options
    
    const dataHeaders = headers || Object.keys(data[0])
    const rows = []
    
    if (includeHeaders) {
      rows.push(dataHeaders.join(separator))
    }
    
    data.forEach(row => {
      const values = dataHeaders.map(header => {
        let value = row[header]
        
        // Handle dates
        if (value instanceof Date) {
          value = dateFormat === 'ISO' ? value.toISOString() : value.toLocaleDateString()
        }
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          value = ''
        }
        
        // Escape strings with separators
        if (typeof value === 'string' && value.includes(separator)) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        
        return value
      })
      
      rows.push(values.join(separator))
    })
    
    return rows.join('\n')
  },
  
  // Capture widget as image (would use html2canvas in production)
  captureWidget: async (widgetId, options = {}) => {
    const { 
      format = 'png',
      quality = 0.9,
      scale = 1,
      backgroundColor = '#ffffff'
    } = options
    
    const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`)
    if (!widgetElement) {
      throw new Error(`Widget element not found: ${widgetId}`)
    }
    
    // Mock implementation - would use html2canvas or similar
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = 800 * scale
      canvas.height = 600 * scale
      const ctx = canvas.getContext('2d')
      
      // Fill background
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Add placeholder content
      ctx.fillStyle = '#374151'
      ctx.font = `${16 * scale}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText(`Widget: ${widgetId}`, canvas.width / 2, canvas.height / 2)
      ctx.fillText('Image Export Placeholder', canvas.width / 2, canvas.height / 2 + 30 * scale)
      
      // Convert to data URL
      const dataURL = canvas.toDataURL(`image/${format}`, quality)
      resolve(dataURL)
    })
  },
  
  // Generate PDF report (would use jsPDF or similar)
  generatePDF: async (dashboardData, options = {}) => {
    const {
      title = 'Dashboard Report',
      includeCharts = true,
      includeData = true,
      orientation = 'portrait'
    } = options
    
    // Mock PDF generation
    const pdfContent = [
      `${title}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Orientation: ${orientation}`,
      '',
      'Dashboard Summary:',
      `- Widgets: ${dashboardData.widgets?.length || 0}`,
      `- Data Points: ${dashboardData.totalDataPoints || 0}`,
      `- Charts Included: ${includeCharts ? 'Yes' : 'No'}`,
      `- Raw Data Included: ${includeData ? 'Yes' : 'No'}`,
      '',
      'Note: This is a placeholder implementation.',
      'In production, use jsPDF or similar library for proper PDF generation.'
    ].join('\n')
    
    return pdfContent
  }
}

// Download utilities
const downloadUtils = {
  downloadFile: (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
  
  downloadDataURL: (dataURL, filename) => {
    const link = document.createElement('a')
    link.href = dataURL
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const useExport = () => {
  const { hasBoardExport } = useFeatureFlags()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportError, setExportError] = useState(null)
  
  const generateFilename = useCallback((widgetTitle, format, timestamp = null) => {
    const ts = timestamp || new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
    const cleanTitle = widgetTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    return `${cleanTitle}_${ts}.${format}`
  }, [])
  
  const exportWidget = useCallback(async (widgetId, format, options = {}) => {
    if (!hasBoardExport) {
      throw new Error('Export functionality is disabled')
    }
    
    setIsExporting(true)
    setExportError(null)
    setExportProgress(0)
    
    try {
      const {
        data = null,
        title = 'Widget',
        csvOptions = {},
        imageOptions = {},
        filename = null
      } = options
      
      setExportProgress(25)
      
      let content, mimeType, extension
      const finalFilename = filename || generateFilename(title, format)
      
      switch (format) {
        case 'csv':
          if (!data) {
            throw new Error('No data provided for CSV export')
          }
          content = exportUtils.generateCSV(data, csvOptions)
          mimeType = 'text/csv'
          extension = 'csv'
          break
          
        case 'png':
        case 'jpg':
        case 'jpeg':
          content = await exportUtils.captureWidget(widgetId, {
            format: format === 'jpg' ? 'jpeg' : format,
            ...imageOptions
          })
          mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`
          extension = format
          break
          
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
      
      setExportProgress(75)
      
      // Download the file
      if (content.startsWith('data:')) {
        downloadUtils.downloadDataURL(content, finalFilename)
      } else {
        downloadUtils.downloadFile(content, finalFilename, mimeType)
      }
      
      setExportProgress(100)
      
      return {
        success: true,
        filename: finalFilename,
        format,
        size: content.length
      }
      
    } catch (error) {
      setExportError(error)
      throw error
    } finally {
      setIsExporting(false)
      setTimeout(() => {
        setExportProgress(0)
        setExportError(null)
      }, 2000)
    }
  }, [hasBoardExport, generateFilename])
  
  const exportDashboard = useCallback(async (format = 'pdf', options = {}) => {
    if (!hasBoardExport) {
      throw new Error('Export functionality is disabled')
    }
    
    setIsExporting(true)
    setExportError(null)
    setExportProgress(0)
    
    try {
      const {
        title = 'Dashboard Report',
        widgets = [],
        pdfOptions = {},
        filename = null
      } = options
      
      setExportProgress(20)
      
      // Collect data from all widgets
      const dashboardData = {
        title,
        exportDate: new Date().toISOString(),
        widgets: widgets.map(widget => ({
          id: widget.id,
          title: widget.title,
          type: widget.type,
          data: widget.data
        })),
        totalDataPoints: widgets.reduce((sum, widget) => sum + (widget.data?.length || 0), 0)
      }
      
      setExportProgress(60)
      
      let content, mimeType, extension
      const finalFilename = filename || generateFilename(title, format)
      
      switch (format) {
        case 'pdf':
          content = await exportUtils.generatePDF(dashboardData, pdfOptions)
          mimeType = 'application/pdf'
          extension = 'pdf'
          break
          
        case 'csv':
          // Export aggregated data as CSV
          const allData = []
          widgets.forEach(widget => {
            if (widget.data && Array.isArray(widget.data)) {
              widget.data.forEach(row => {
                allData.push({
                  widget: widget.title,
                  ...row
                })
              })
            }
          })
          content = exportUtils.generateCSV(allData)
          mimeType = 'text/csv'
          extension = 'csv'
          break
          
        default:
          throw new Error(`Unsupported dashboard export format: ${format}`)
      }
      
      setExportProgress(90)
      
      downloadUtils.downloadFile(content, finalFilename, mimeType)
      
      setExportProgress(100)
      
      return {
        success: true,
        filename: finalFilename,
        format,
        widgetsExported: widgets.length,
        size: content.length
      }
      
    } catch (error) {
      setExportError(error)
      throw error
    } finally {
      setIsExporting(false)
      setTimeout(() => {
        setExportProgress(0)
        setExportError(null)
      }, 2000)
    }
  }, [hasBoardExport, generateFilename])
  
  const resetExportState = useCallback(() => {
    setIsExporting(false)
    setExportProgress(0)
    setExportError(null)
  }, [])
  
  return {
    // State
    isExporting,
    exportProgress,
    exportError,
    isExportEnabled: hasBoardExport,
    
    // Actions
    exportWidget,
    exportDashboard,
    resetExportState,
    
    // Utilities
    generateFilename,
    
    // Export utilities (for advanced usage)
    utils: {
      generateCSV: exportUtils.generateCSV,
      captureWidget: exportUtils.captureWidget,
      generatePDF: exportUtils.generatePDF
    }
  }
}

export default useExport
