import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const KPIWidget = ({
  id,
  title,
  value,
  target,
  trend,
  icon: Icon,
  formatter = (val) => val,
  color = 'blue',
  onClick
}) => {
  const isPositive = trend > 0;
  const isAtTarget = value >= target;

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
    yellow: 'text-yellow-600',
    teal: 'text-teal-600',
    pink: 'text-pink-600',
    orange: 'text-orange-600'
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg',
        colorClasses[color],
        'hover:scale-105'
      )}
    >
      {/* Icon */}
      <div className="flex items-center justify-between mb-4">
        <Icon className={clsx('h-8 w-8', iconColorClasses[color])} />
        {/* Trend Indicator */}
        <div className={clsx(
          'flex items-center space-x-1 text-sm font-medium',
          isPositive ? 'text-green-600' : 'text-red-600'
        )}>
          {isPositive ? (
            <ArrowUpIcon className="h-4 w-4" />
          ) : (
            <ArrowDownIcon className="h-4 w-4" />
          )}
          <span>{Math.abs(trend)}%</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>

      {/* Value */}
      <div className="text-2xl font-bold text-gray-900">
        {formatter(value)}
      </div>

      {/* Target Comparison */}
      <div className="mt-2 flex items-center space-x-2">
        <span className="text-xs text-gray-500">Target:</span>
        <span className={clsx(
          'text-xs font-medium',
          isAtTarget ? 'text-green-600' : 'text-amber-600'
        )}>
          {formatter(target)}
        </span>
        {isAtTarget ? (
          <span className="text-xs text-green-600">✓ Met</span>
        ) : (
          <span className="text-xs text-amber-600">
            {((value / target) * 100).toFixed(0)}% of target
          </span>
        )}
      </div>

      {/* Performance Bar */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
        <div
          className={clsx(
            'h-2 rounded-full transition-all duration-500',
            isAtTarget ? 'bg-green-500' : 'bg-amber-500'
          )}
          style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default KPIWidget;