// Date Range Picker with preset ranges and market timezone support

import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  RotateCcw,
  Check
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { cn } from '@/lib/utils';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PresetRange {
  id: string;
  label: string;
  description?: string;
  getValue: (timezone?: string) => DateRange;
  isRelative?: boolean;
}

export interface MarketTimezone {
  id: string;
  name: string;
  code: string;
  offset: string;
  city: string;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  presets?: PresetRange[];
  marketTimezones?: MarketTimezone[];
  selectedTimezone?: MarketTimezone;
  onTimezoneChange?: (timezone: MarketTimezone) => void;
  showTimezone?: boolean;
  showPresets?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  format?: 'short' | 'medium' | 'long';
  className?: string;
  'data-testid'?: string;
}

// Default preset ranges
const defaultPresets: PresetRange[] = [
  {
    id: 'today',
    label: 'Today',
    isRelative: true,
    getValue: (timezone) => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      return { start, end };
    }
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    isRelative: true,
    getValue: (timezone) => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
      return { start, end };
    }
  },
  {
    id: 'last7days',
    label: 'Last 7 Days',
    isRelative: true,
    getValue: (timezone) => {
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  },
  {
    id: 'last30days',
    label: 'Last 30 Days',
    isRelative: true,
    getValue: (timezone) => {
      const now = new Date();
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  },
  {
    id: 'thisMonth',
    label: 'This Month',
    isRelative: true,
    getValue: (timezone) => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start, end };
    }
  },
  {
    id: 'lastMonth',
    label: 'Last Month',
    isRelative: true,
    getValue: (timezone) => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start, end };
    }
  },
  {
    id: 'thisQuarter',
    label: 'This Quarter',
    isRelative: true,
    getValue: (timezone) => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      const end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
      return { start, end };
    }
  },
  {
    id: 'thisYear',
    label: 'This Year',
    isRelative: true,
    getValue: (timezone) => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { start, end };
    }
  }
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  presets = defaultPresets,
  marketTimezones = [],
  selectedTimezone,
  onTimezoneChange,
  showTimezone = false,
  showPresets = true,
  minDate,
  maxDate,
  disabled = false,
  size = 'md',
  format = 'medium',
  className,
  'data-testid': testId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState<Date | null>(value?.start || null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(value?.end || null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (selectedStart && selectedEnd) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, selectedStart, selectedEnd]);

  // Format date based on format preference
  const formatDate = (date: Date) => {
    switch (format) {
      case 'short':
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      case 'long':
        return date.toLocaleDateString(undefined, { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      default:
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
    }
  };

  // Get display text for selected range
  const getDisplayText = () => {
    if (!value) return 'Select date range';
    
    if (activePreset) {
      const preset = presets.find(p => p.id === activePreset);
      if (preset) return preset.label;
    }
    
    return `${formatDate(value.start)} - ${formatDate(value.end)}`;
  };

  // Handle preset selection
  const handlePresetSelect = (preset: PresetRange) => {
    const range = preset.getValue(selectedTimezone?.code);
    setSelectedStart(range.start);
    setSelectedEnd(range.end);
    setActivePreset(preset.id);
    onChange(range);
    setIsOpen(false);
  };

  // Handle date click in calendar
  const handleDateClick = (date: Date) => {
    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(date);
      setSelectedEnd(null);
      setActivePreset(null);
    } else if (selectedStart && !selectedEnd) {
      if (date < selectedStart) {
        setSelectedStart(date);
        setSelectedEnd(selectedStart);
      } else {
        setSelectedEnd(date);
      }
      
      const newRange = { 
        start: date < selectedStart ? date : selectedStart, 
        end: date < selectedStart ? selectedStart : date 
      };
      onChange(newRange);
      setIsOpen(false);
    }
  };

  // Generate calendar days
  const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      
      if (days.length > 42) break; // Prevent infinite loop
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays(currentMonth);

  // Check if date is in range
  const isInRange = (date: Date) => {
    if (!selectedStart || !selectedEnd) return false;
    return date >= selectedStart && date <= selectedEnd;
  };

  // Check if date is start or end of range
  const isRangeStart = (date: Date) => {
    return selectedStart && date.getTime() === selectedStart.getTime();
  };

  const isRangeEnd = (date: Date) => {
    return selectedEnd && date.getTime() === selectedEnd.getTime();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-2 text-xs';
      case 'lg':
        return 'h-12 px-4 text-base';
      default:
        return 'h-10 px-3 text-sm';
    }
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Main Trigger Button */}
      <Button
        variant="outline"
        className={cn(
          'justify-between w-full',
          getSizeClasses(),
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        data-testid={testId}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Calendar className="h-4 w-4 flex-shrink-0 text-gray-500" />
          <span className="truncate">{getDisplayText()}</span>
        </div>
        <ChevronDown className={cn(
          'h-4 w-4 flex-shrink-0 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-max mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="flex">
            {/* Presets Sidebar */}
            {showPresets && presets.length > 0 && (
              <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                  Quick Select
                </div>
                <div className="space-y-1">
                  {presets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant={activePreset === preset.id ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-start text-xs h-8"
                      onClick={() => handlePresetSelect(preset)}
                      data-testid={`${testId}-preset-${preset.id}`}
                    >
                      <div className="text-left">
                        <div>{preset.label}</div>
                        {preset.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {preset.description}
                          </div>
                        )}
                      </div>
                      {activePreset === preset.id && (
                        <Check className="h-3 w-3 ml-auto" />
                      )}
                    </Button>
                  ))}
                </div>

                {/* Timezone Selector */}
                {showTimezone && marketTimezones.length > 0 && (
                  <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                      Timezone
                    </div>
                    <div className="space-y-1">
                      {marketTimezones.map((tz) => (
                        <Button
                          key={tz.id}
                          variant={selectedTimezone?.id === tz.id ? 'secondary' : 'ghost'}
                          size="sm"
                          className="w-full justify-start text-xs h-8"
                          onClick={() => onTimezoneChange?.(tz)}
                          data-testid={`${testId}-timezone-${tz.id}`}
                        >
                          <div className="flex items-center space-x-2">
                            <Globe className="h-3 w-3" />
                            <div className="text-left">
                              <div>{tz.name}</div>
                              <div className="text-xs text-gray-500">
                                {tz.city} ({tz.offset})
                              </div>
                            </div>
                          </div>
                          {selectedTimezone?.id === tz.id && (
                            <Check className="h-3 w-3 ml-auto" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Calendar */}
            <div className="p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const prev = new Date(currentMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentMonth(prev);
                  }}
                  className="h-8 w-8"
                  data-testid={`${testId}-prev-month`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="font-medium">
                  {currentMonth.toLocaleDateString(undefined, { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const next = new Date(currentMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentMonth(next);
                  }}
                  className="h-8 w-8"
                  data-testid={`${testId}-next-month`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div 
                    key={day}
                    className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSelected = isRangeStart(date) || isRangeEnd(date);
                  const inRange = isInRange(date);
                  const isDisabled = 
                    (minDate && date < minDate) || 
                    (maxDate && date > maxDate);

                  return (
                    <button
                      key={index}
                      type="button"
                      className={cn(
                        'h-8 w-8 text-xs rounded flex items-center justify-center transition-colors',
                        !isCurrentMonth && 'text-gray-300 dark:text-gray-600',
                        isCurrentMonth && 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                        isToday && 'font-bold border border-blue-500',
                        isSelected && 'bg-blue-600 text-white hover:bg-blue-700',
                        inRange && !isSelected && 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100',
                        isDisabled && 'opacity-50 cursor-not-allowed'
                      )}
                      onClick={() => !isDisabled && handleDateClick(date)}
                      disabled={isDisabled}
                      data-testid={`${testId}-date-${date.getDate()}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedStart(null);
                    setSelectedEnd(null);
                    setActivePreset(null);
                  }}
                  className="text-xs"
                  data-testid={`${testId}-clear`}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear
                </Button>

                {selectedTimezone && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{selectedTimezone.code}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { DateRangePicker, defaultPresets };
export type { DateRangePickerProps, DateRange, PresetRange, MarketTimezone };