/**
 * ColumnMapper Component
 *
 * Interactive column mapping interface with auto-suggestions
 * Allows manual mapping and transformation configuration
 */

import { useState, useEffect } from 'react'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'

export default function ColumnMapper({
  sourceColumns = [],
  targetSchema = { fields: [] },
  initialMapping = {},
  onMappingChange,
  showTransformations = false,
}) {
  const [mapping, setMapping] = useState(initialMapping)
  const [expandedRows, setExpandedRows] = useState({})

  useEffect(() => {
    setMapping(initialMapping)
  }, [initialMapping])

  const handleMappingChange = (sourceColumn, targetColumn) => {
    const newMapping = {
      ...mapping,
      [sourceColumn]: {
        ...mapping[sourceColumn],
        targetColumn,
      },
    }
    setMapping(newMapping)
    onMappingChange(newMapping)
  }

  // TODO: Implement transformation UI when showTransformations is enabled
  // eslint-disable-next-line no-unused-vars
  const handleTransformationChange = (sourceColumn, transformations) => {
    const newMapping = {
      ...mapping,
      [sourceColumn]: {
        ...mapping[sourceColumn],
        transformations,
      },
    }
    setMapping(newMapping)
    onMappingChange(newMapping)
  }

  const toggleRowExpanded = sourceColumn => {
    setExpandedRows(prev => ({
      ...prev,
      [sourceColumn]: !prev[sourceColumn],
    }))
  }

  const calculateMappingConfidence = () => {
    const mappedCount = Object.values(mapping).filter(m => m && m.targetColumn).length
    const totalRequired = targetSchema.fields.filter(f => f.required).length
    return Math.round((mappedCount / totalRequired) * 100)
  }

  const getMappingStatus = sourceColumn => {
    const mapped = mapping[sourceColumn]
    if (!mapped || !mapped.targetColumn) return 'unmapped'

    const targetField = targetSchema.fields.find(f => f.name === mapped.targetColumn)
    if (targetField?.required) return 'required'
    return 'optional'
  }

  const confidence = calculateMappingConfidence()

  return (
    <div className="space-y-4">
      {/* Confidence Indicator */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Mapping Confidence</h3>
          <span
            className={`text-lg font-bold ${
              confidence >= 80
                ? 'text-green-600'
                : confidence >= 50
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}
          >
            {confidence}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              confidence >= 80 ? 'bg-green-500' : confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {confidence >= 80
            ? 'All required fields are mapped. Ready to proceed!'
            : 'Map all required fields to continue.'}
        </p>
      </div>

      {/* Column Mapping Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source Column
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  {/* Arrow */}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Field
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Status
                </th>
                {showTransformations && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    {/* Expand */}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sourceColumns.map((sourceColumn, index) => {
                const status = getMappingStatus(sourceColumn)
                const isExpanded = expandedRows[sourceColumn]
                const currentMapping = mapping[sourceColumn] || {}

                return (
                  <tr key={sourceColumn} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{sourceColumn}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ArrowRightIcon className="h-4 w-4 text-gray-400 mx-auto" />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={currentMapping.targetColumn || ''}
                        onChange={e => handleMappingChange(sourceColumn, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      >
                        <option value="">-- Select target field --</option>
                        {targetSchema.fields.map(field => (
                          <option key={field.name} value={field.name}>
                            {field.name}
                            {field.required ? ' *' : ''}
                          </option>
                        ))}
                      </select>
                      {currentMapping.targetColumn && (
                        <p className="mt-1 text-xs text-gray-500">
                          {targetSchema.fields.find(f => f.name === currentMapping.targetColumn)
                            ?.type || 'string'}
                          {targetSchema.fields.find(f => f.name === currentMapping.targetColumn)
                            ?.required && <span className="ml-1 text-red-500">Required</span>}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {status === 'unmapped' && (
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mx-auto" />
                      )}
                      {status === 'required' && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                      )}
                      {status === 'optional' && (
                        <CheckCircleIcon className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    {showTransformations && (
                      <td className="px-6 py-4 text-center">
                        {currentMapping.targetColumn && (
                          <button
                            onClick={() => toggleRowExpanded(sourceColumn)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            <ChevronDownIcon
                              className={`h-4 w-4 text-gray-500 transition-transform ${
                                isExpanded ? 'transform rotate-180' : ''
                              }`}
                            />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span>Required field mapped</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4 text-gray-400" />
            <span>Optional field mapped</span>
          </div>
          <div className="flex items-center gap-1">
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
            <span>Not mapped</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">*</span>
            <span>Required field</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{sourceColumns.length}</div>
          <div className="text-xs text-gray-500 mt-1">Source Columns</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {Object.values(mapping).filter(m => m && m.targetColumn).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Mapped</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {sourceColumns.length - Object.values(mapping).filter(m => m && m.targetColumn).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Unmapped</div>
        </div>
      </div>
    </div>
  )
}
