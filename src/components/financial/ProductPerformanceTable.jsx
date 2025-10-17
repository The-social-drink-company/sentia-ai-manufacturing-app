import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { cn } from '@/utils/cn'

const formatCurrency = value => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatNumber = value => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-GB').format(value)
}

const formatPercentage = value => {
  if (typeof value !== 'number') return '—'
  return `${value.toFixed(1)}%`
}

const TrendIndicator = ({ value, showIcon = true, className }) => {
  if (!value || value === 0) {
    return showIcon ? (
      <div className="flex items-center space-x-1">
        <MinusIcon className="w-4 h-4 text-gray-400" />
        <span className="text-gray-400">0%</span>
      </div>
    ) : (
      <span className="text-gray-400">0%</span>
    )
  }

  const isPositive = value > 0
  const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <div className={cn('flex items-center space-x-1', colorClass, className)}>
      {showIcon && <Icon className="w-4 h-4" />}
      <span>
        {isPositive ? '+' : ''}
        {value.toFixed(1)}%
      </span>
    </div>
  )
}

const ProductRow = ({ product, rank }) => {
  const getRankDisplay = rank => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank
  }

  const getProductColor = name => {
    const colors = {
      'GABA Red': 'bg-red-100 text-red-800 border-red-200',
      'GABA Black': 'bg-gray-100 text-gray-800 border-gray-200',
      'GABA Gold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    }
    return colors[name] || 'bg-blue-100 text-blue-800 border-blue-200'
  }

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="text-sm font-medium text-muted-foreground">{getRankDisplay(rank)}</div>
          <div
            className={cn(
              'px-2 py-1 rounded-full text-sm font-medium border',
              getProductColor(product.name)
            )}
          >
            {product.name}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="space-y-1">
          <div className="font-semibold text-foreground">{formatCurrency(product.revenue)}</div>
          <TrendIndicator value={product.revenueGrowth} showIcon={false} className="text-xs" />
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="space-y-1">
          <div className="font-medium text-foreground">{formatNumber(product.unitsSold)}</div>
          <TrendIndicator value={product.unitsSoldGrowth} showIcon={false} className="text-xs" />
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="space-y-1">
          <div className="font-medium text-foreground">{formatPercentage(product.marketShare)}</div>
          <TrendIndicator value={product.marketShareChange} showIcon={false} className="text-xs" />
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="font-medium text-foreground">{formatCurrency(product.avgOrderValue)}</div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="space-y-1">
          <div className="font-medium text-foreground">
            {formatPercentage(product.profitMargin)}
          </div>
          <div className="text-xs text-muted-foreground">{formatCurrency(product.totalProfit)}</div>
        </div>
      </td>
    </tr>
  )
}

const SortButton = ({ column, currentSort, onSort }) => {
  const isActive = currentSort.column === column

  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center space-x-1 hover:text-primary transition-colors"
    >
      <ArrowsUpDownIcon
        className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-muted-foreground')}
      />
    </button>
  )
}

const defaultProducts = [
  {
    name: 'GABA Red',
    revenue: 2450000,
    revenueGrowth: 12.5,
    unitsSold: 145000,
    unitsSoldGrowth: 8.2,
    marketShare: 34.5,
    marketShareChange: 2.1,
    avgOrderValue: 16.9,
    profitMargin: 28.5,
    totalProfit: 698250,
  },
  {
    name: 'GABA Black',
    revenue: 1890000,
    revenueGrowth: 6.8,
    unitsSold: 98000,
    unitsSoldGrowth: 4.1,
    marketShare: 26.8,
    marketShareChange: -0.5,
    avgOrderValue: 19.28,
    profitMargin: 31.2,
    totalProfit: 589680,
  },
  {
    name: 'GABA Gold',
    revenue: 1750000,
    revenueGrowth: 15.3,
    unitsSold: 87000,
    unitsSoldGrowth: 12.7,
    marketShare: 22.1,
    marketShareChange: 3.2,
    avgOrderValue: 20.11,
    profitMargin: 35.8,
    totalProfit: 626500,
  },
]

const ProductPerformanceTable = ({
  data = defaultProducts,
  loading = false,
  error = null,
  className,
}) => {
  const [sortConfig, setSortConfig] = useState({ column: 'revenue', direction: 'desc' })
  const [filterTerm, setFilterTerm] = useState('')

  const handleSort = column => {
    setSortConfig(prevSort => ({
      column,
      direction: prevSort.column === column && prevSort.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  const sortedAndFilteredData =
    data
      ?.filter(product => product.name.toLowerCase().includes(filterTerm.toLowerCase()))
      .sort((a, b) => {
        const aValue = a[sortConfig.column]
        const bValue = b[sortConfig.column]

        if (sortConfig.direction === 'asc') {
          return aValue > bValue ? 1 : -1
        }
        return aValue < bValue ? 1 : -1
      }) || []

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Error loading product data: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const totalRevenue = sortedAndFilteredData.reduce((sum, product) => sum + product.revenue, 0)
  const totalUnits = sortedAndFilteredData.reduce((sum, product) => sum + product.unitsSold, 0)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Product Performance</span>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <FunnelIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter products..."
                value={filterTerm}
                onChange={e => setFilterTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </CardTitle>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Revenue
            </div>
            <div className="text-lg font-semibold text-foreground">
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Units
            </div>
            <div className="text-lg font-semibold text-foreground">{formatNumber(totalUnits)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-foreground">Product</th>
                <th className="text-right py-3 px-4 font-medium text-foreground">
                  <div className="flex items-center justify-end space-x-1">
                    <span>Revenue</span>
                    <SortButton column="revenue" currentSort={sortConfig} onSort={handleSort} />
                  </div>
                </th>
                <th className="text-right py-3 px-4 font-medium text-foreground">
                  <div className="flex items-center justify-end space-x-1">
                    <span>Units Sold</span>
                    <SortButton column="unitsSold" currentSort={sortConfig} onSort={handleSort} />
                  </div>
                </th>
                <th className="text-right py-3 px-4 font-medium text-foreground">
                  <div className="flex items-center justify-end space-x-1">
                    <span>Market Share</span>
                    <SortButton column="marketShare" currentSort={sortConfig} onSort={handleSort} />
                  </div>
                </th>
                <th className="text-right py-3 px-4 font-medium text-foreground">
                  <div className="flex items-center justify-end space-x-1">
                    <span>Avg Order</span>
                    <SortButton
                      column="avgOrderValue"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                  </div>
                </th>
                <th className="text-right py-3 px-4 font-medium text-foreground">
                  <div className="flex items-center justify-end space-x-1">
                    <span>Profit</span>
                    <SortButton
                      column="profitMargin"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredData.map((product, index) => (
                <ProductRow key={product.name} product={product} rank={index + 1} />
              ))}
            </tbody>
          </table>
        </div>
        {sortedAndFilteredData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No products match your filter criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductPerformanceTable
