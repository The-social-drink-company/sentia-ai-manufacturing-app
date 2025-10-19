import { useMemo, useState } from 'react'
import { MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableSkeleton } from '@/components/ui/skeletons'

const DataTableWidget = ({
  title = 'Key Items',
  columns = [],
  data = [],
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  loading = false,
  className = '',
}) => {
  const activeColumns = columns
  const activeData = data

  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm.trim()) {
      return activeData
    }

    const needle = searchTerm.toLowerCase()
    return activeData.filter(row =>
      Object.values(row).some(value => String(value).toLowerCase().includes(needle))
    )
  }, [activeData, searchable, searchTerm])

  const sortedData = useMemo(() => {
    if (!sortable || !sortColumn) {
      return filteredData
    }

    const columnKey = sortColumn
    const direction = sortDirection

    return [...filteredData].sort((a, b) => {
      const aVal = a[columnKey]
      const bVal = b[columnKey]

      if (aVal === bVal) return 0
      if (aVal == null) return direction === 'asc' ? -1 : 1
      if (bVal == null) return direction === 'asc' ? 1 : -1

      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortable, sortColumn, sortDirection])

  const totalPages = pagination ? Math.max(1, Math.ceil(sortedData.length / pageSize)) : 1
  const currentPageSafe = Math.min(currentPage, totalPages)
  const startIndex = (currentPageSafe - 1) * pageSize
  const paginatedData = pagination
    ? sortedData.slice(startIndex, startIndex + pageSize)
    : sortedData

  const handleSort = columnKey => {
    if (!sortable) return

    if (sortColumn === columnKey) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  if (loading) {
    return (
      <Card className={cn('bg-white dark:bg-gray-800 shadow-sm', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TableSkeleton rows={Math.min(pageSize, 6)} columns={activeColumns.length || 4} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('bg-white dark:bg-gray-800 shadow-sm', className)}>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </CardTitle>
        {searchable && (
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={event => {
                setSearchTerm(event.target.value)
                setCurrentPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 shadow-inner outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {activeColumns.map(column => (
                  <th
                    key={column.key}
                    onClick={() => handleSort(column.key)}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400',
                      sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {sortable &&
                        sortColumn === column.key &&
                        (sortDirection === 'asc' ? (
                          <ChevronUpIcon className="h-3 w-3" />
                        ) : (
                          <ChevronDownIcon className="h-3 w-3" />
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {activeColumns.map(column => (
                    <td
                      key={column.key}
                      className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300"
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {paginatedData.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={activeColumns.length || 1}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {activeColumns.length === 0 ? 'No columns configured' : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 px-6 py-4 text-sm text-gray-700 dark:text-gray-300 sm:flex-row">
            <span>
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedData.length)} of{' '}
              {sortedData.length} results
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPageSafe === 1}
                className="rounded-md border border-gray-300 px-3 py-1 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPageSafe === totalPages}
                className="rounded-md border border-gray-300 px-3 py-1 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DataTableWidget
