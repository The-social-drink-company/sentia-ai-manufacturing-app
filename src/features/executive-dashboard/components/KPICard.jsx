import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import { cn } from '../../../utils/cn'

export function KPICard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  format = 'number',
  loading = false
}) {
  const formatValue = (val) => {
    if (!val && val !== 0) return '--'

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val)
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'number':
        return new Intl.NumberFormat('en-US').format(val)
      default:
        return val
    }
  }

  const getChangeIcon = () => {
    if (!change) return null

    const isPositive = change > 0
    const ChangeIcon = isPositive ? ArrowUpIcon : ArrowDownIcon

    return (
      <div className={cn(
        'flex items-center text-sm font-medium',
        changeType === 'positive' && isPositive && 'text-green-600',
        changeType === 'positive' && !isPositive && 'text-red-600',
        changeType === 'negative' && isPositive && 'text-red-600',
        changeType === 'negative' && !isPositive && 'text-green-600',
        changeType === 'neutral' && 'text-gray-600'
      )}>
        <ChangeIcon className="h-4 w-4 mr-1" />
        {Math.abs(change).toFixed(1)}%
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {getChangeIcon()}
      </CardContent>
    </Card>
  )
}