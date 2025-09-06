import { devLog } from '../../lib/devLog.js';
/**
 * Enhanced Data Import Dashboard - Prompt 4 Implementation
 * 
 * Features:
 * - Financial impact visualization and tagging
 * - Multi-entity import management
 * - Real-time validation feedback
 * - Enhanced error handling and recovery
 * - Business impact analysis
 * - Multi-currency support
 */

import React, { useState, useEffect, useMemo } from 'react'
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Globe,
  Building2
} from 'lucide-react'
import { useAuthRole } from '../../hooks/useAuthRole.jsx'

export default function EnhancedDataImportDashboard() {
  const { user, hasPermission, canAccess } = useAuthRole()
  
  // State management
  const [activeImport, setActiveImport] = useState(null)
  const [importHistory, setImportHistory] = useState([])
  const [selectedEntity, setSelectedEntity] = useState('default')
  const [availableEntities, setAvailableEntities] = useState([])
  const [financialSummary, setFinancialSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  // Import process states
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationResults, setValidationResults] = useState(null)
  const [businessImpactAnalysis, setBusinessImpactAnalysis] = useState(null)
  const [stagingData, setStagingData] = useState(null)

  useEffect(() => {
    loadImportHistory()
    loadAvailableEntities()
  }, [selectedEntity])

  const loadImportHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/import/jobs?entity=${selectedEntity}`, {
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setImportHistory(data.jobs || [])
        calculateFinancialSummary(data.jobs)
      }
    } catch (error) {
      devLog.error('Failed to load import history:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableEntities = async () => {
    try {
      const response = await fetch('/api/entities/available', {
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableEntities(data.entities || [])
      }
    } catch (error) {
      devLog.error('Failed to load entities:', error)
    }
  }

  const calculateFinancialSummary = (jobs) => {
    const summary = {
      totalValue: 0,
      positiveImpact: 0,
      negativeImpact: 0,
      currency: 'GBP',
      recentImports: jobs.slice(0, 5),
      impactByDataType: {}
    }

    jobs.forEach(job => {
      if (job.business_impact && job.business_impact.estimatedValue) {
        const value = parseFloat(job.business_impact.estimatedValue)
        summary.totalValue += value
        
        if (value > 0) {
          summary.positiveImpact += value
        } else if (value < 0) {
          summary.negativeImpact += Math.abs(value)
        }

        // Group by data type
        if (!summary.impactByDataType[job.data_type]) {
          summary.impactByDataType[job.data_type] = { total: 0, count: 0 }
        }
        summary.impactByDataType[job.data_type].total += value
        summary.impactByDataType[job.data_type].count += 1
      }
    })

    setFinancialSummary(summary)
  }

  const handleFileUpload = async (files) => {
    if (files.length === 0) return

    const file = files[0]
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entity_id', selectedEntity)
    formData.append('data_type', 'products') // Default, should be selectable

    try {
      setLoading(true)
      setUploadProgress(0)

      // Upload with progress tracking
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          setUploadProgress(progress)
        }
      })

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        })
        xhr.addEventListener('error', () => reject(new Error('Network error')))
      })

      xhr.open('POST', '/api/import/upload-enhanced')
      xhr.send(formData)

      const result = await uploadPromise
      setActiveImport(result.importJob)
      
      // Start enhanced validation
      await startEnhancedValidation(result.importJob.id)
      
    } catch (error) {
      devLog.error('Upload failed:', error)
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const startEnhancedValidation = async (importJobId) => {
    try {
      const response = await fetch(`/api/import/validate-enhanced/${importJobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityContext: { entity_id: selectedEntity },
          businessRules: [], // Load from configuration
          outlierDetection: true,
          financialImpactAnalysis: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        setValidationResults(data.validation)
        setBusinessImpactAnalysis(data.businessImpact)
        setStagingData(data.staging)
      }
    } catch (error) {
      devLog.error('Validation failed:', error)
    }
  }

  const handleCommitImport = async () => {
    if (!activeImport) return

    try {
      setLoading(true)
      const response = await fetch(`/api/import/commit/${activeImport.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requireAllValid: false,
          entityContext: { entity_id: selectedEntity }
        })
      })

      if (response.ok) {
        const result = await response.json()
        setActiveImport(null)
        setValidationResults(null)
        setBusinessImpactAnalysis(null)
        setStagingData(null)
        await loadImportHistory()
      }
    } catch (error) {
      devLog.error('Commit failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount, currency = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'completed_with_errors': return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      case 'processing': case 'validating': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      default: return <FileSpreadsheet className="w-5 h-5 text-gray-500" />
    }
  }

  const getImpactTrend = (value) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <DollarSign className="w-4 h-4 text-gray-500" />
  }

  // Permission check
  if (!canAccess('data_import')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">You don't have permission to access data import functionality.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Entity Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Enhanced Data Import</h1>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-gray-500" />
              <select 
                value={selectedEntity} 
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="default">Default Entity</option>
                {availableEntities.map(entity => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name} ({entity.region})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Globe className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">Multi-Entity Import System</span>
          </div>
        </div>

        {/* Financial Impact Summary */}
        {financialSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Total Value Impact</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(financialSummary.totalValue, financialSummary.currency)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Positive Impact</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(financialSummary.positiveImpact, financialSummary.currency)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Negative Impact</p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatCurrency(financialSummary.negativeImpact, financialSummary.currency)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recent Imports</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {importHistory.length}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File Upload Area */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New Data</h2>
        
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
          onDrop={(e) => {
            e.preventDefault()
            handleFileUpload(Array.from(e.dataTransfer.files))
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">Drop your files here or click to browse</p>
          <p className="text-sm text-gray-500 mb-4">
            Supports CSV, Excel, and JSON files up to 10MB
          </p>
          <input
            type="file"
            accept=".csv,.xlsx,.json"
            onChange={(e) => handleFileUpload(Array.from(e.target.files))}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
          >
            Choose Files
          </label>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">{uploadProgress.toFixed(0)}% uploaded</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Import Processing */}
      {activeImport && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Processing: {activeImport.filename}
            </h2>
            <div className="flex items-center space-x-2">
              {getStatusIcon(activeImport.status)}
              <span className="capitalize text-sm text-gray-600">{activeImport.status}</span>
            </div>
          </div>

          {/* Validation Results */}
          {validationResults && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Validation Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-600">Valid Rows</p>
                  <p className="text-xl font-bold text-green-900">{validationResults.validRows}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-600">Error Rows</p>
                  <p className="text-xl font-bold text-red-900">{validationResults.errorRows}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm text-amber-600">Warning Rows</p>
                  <p className="text-xl font-bold text-amber-900">{validationResults.warningRows}</p>
                </div>
              </div>
              
              {validationResults.outliers && validationResults.outliers.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
                    <h4 className="text-sm font-medium text-amber-800">Statistical Outliers Detected</h4>
                  </div>
                  <p className="text-sm text-amber-700">
                    {validationResults.outliers.length} data points identified as potential outliers. 
                    Review these values before committing.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Business Impact Analysis */}
          {businessImpactAnalysis && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Business Impact Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Estimated Financial Impact</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(businessImpactAnalysis.totalImpact, businessImpactAnalysis.currency)}
                      </p>
                    </div>
                    {getImpactTrend(businessImpactAnalysis.totalImpact)}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Impact Distribution</p>
                      <div className="mt-2">
                        {Object.entries(businessImpactAnalysis.impactByType || {}).map(([type, impact]) => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="capitalize">{type}:</span>
                            <span className="font-medium">{formatCurrency(impact)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <PieChart className="w-8 h-8 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => {
                setActiveImport(null)
                setValidationResults(null)
                setBusinessImpactAnalysis(null)
              }}
            >
              Cancel
            </button>
            
            <button
              className="px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Data</span>
            </button>
            
            <button
              onClick={handleCommitImport}
              disabled={loading || (validationResults && validationResults.errorRows > 0)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Committing...' : 'Commit Import'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Import History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Import History</h2>
            <button
              onClick={loadImportHistory}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rows
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {importHistory.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileSpreadsheet className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{job.filename}</div>
                        <div className="text-sm text-gray-500">{job.file_size} bytes</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize text-sm text-gray-900">{job.data_type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      <span className="capitalize text-sm text-gray-900">{job.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>Total: {job.total_rows}</div>
                      {job.error_rows > 0 && (
                        <div className="text-red-600">Errors: {job.error_rows}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {job.business_impact && job.business_impact.estimatedValue ? (
                      <div className="flex items-center space-x-2">
                        {getImpactTrend(job.business_impact.estimatedValue)}
                        <span className="text-sm font-medium">
                          {formatCurrency(job.business_impact.estimatedValue, job.business_impact.currency)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No impact data</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {importHistory.length === 0 && (
          <div className="text-center py-12">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No imports found for this entity.</p>
            <p className="text-sm text-gray-500">Upload your first data file to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}