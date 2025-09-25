import React, { useState } from 'react';
import { 
  LightBulbIcon,
  ArrowRightIcon,
  XMarkIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useNavigation } from './NavigationProvider';
import { useTheme } from '../theming';

export const ContextualSuggestions = ({ 
  className = '',
  maxSuggestions = 4,
  showDismiss = true,
  ...props 
}) => {
  const { suggestions, navigateToPath, currentPath } = useNavigation();
  const { resolvedTheme } = useTheme();
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Filter out dismissed suggestions
  const activeSuggestions = suggestions
    .filter(suggestion => !dismissedSuggestions.has(suggestion.path))
    .slice(0, maxSuggestions);
  
  const handleSuggestionClick = (suggestion) => {
    navigateToPath(suggestion.path);
    
    // Track suggestion click
    window.dispatchEvent(new CustomEvent('sentia-suggestion-clicked', {
      detail: { suggestion, currentPath }
    }));
  };
  
  const handleDismiss = (suggestion, event) => {
    event.stopPropagation();
    setDismissedSuggestions(prev => new Set([...prev, suggestion.path]));
    
    // Track suggestion dismissal
    window.dispatchEvent(new CustomEvent('sentia-suggestion-dismissed', {
      detail: { suggestion, currentPath }
    }));
  };
  
  const getReasonIcon = (reason) => {
    switch (reason) {
      case 'financial-overview':
      case 'detailed-analysis':
      case 'cost-optimization':
        return ChartBarIcon;
      case 'operational-efficiency':
      case 'supply-chain':
      case 'equipment-health':
        return CogIcon;
      case 'ai-insights':
      case 'advanced-insights':
      case 'scenario-planning':
        return LightBulbIcon;
      case 'frequently-visited':
        return ClockIcon;
      default:
        return ArrowRightIcon;
    }
  };
  
  const getReasonLabel = (reason) => {
    const labels = {
      'financial-overview': 'Financial insights',
      'operational-efficiency': 'Operational optimization',
      'ai-insights': 'AI-powered analysis',
      'detailed-analysis': 'Detailed reporting',
      'scenario-planning': 'What-if scenarios',
      'supply-chain': 'Supply chain optimization',
      'production-quality': 'Quality assurance',
      'equipment-health': 'Maintenance planning',
      'advanced-insights': 'Advanced analytics',
      'demand-alignment': 'Demand planning',
      'capacity-planning': 'Capacity optimization',
      'frequently-visited': 'Recently visited'
    };
    return labels[reason] || 'Recommended';
  };
  
  if (activeSuggestions.length === 0) {
    return null;
  }
  
  const cardClasses = `
    rounded-lg border shadow-sm p-4 transition-all duration-200
    ${resolvedTheme === 'dark'
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-200'
    }
  `;
  
  const textPrimaryClasses = resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClasses = resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const textMutedClasses = resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  
  return (
    <div className={`${cardClasses} ${className}`} {...props}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <LightBulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
          <h3 className={`font-semibold ${textPrimaryClasses}`}>
            Smart Suggestions
          </h3>
        </div>
        
        {activeSuggestions.length > 2 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-xs px-2 py-1 rounded transition-colors ${textMutedClasses} hover:${textSecondaryClasses}`}
          >
            {isExpanded ? 'Show Less' : `+${activeSuggestions.length - 2} more`}
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {(isExpanded ? activeSuggestions : activeSuggestions.slice(0, 2)).map((suggestion, index) => {
          const IconComponent = getReasonIcon(suggestion.reason);
          
          return (
            <div
              key={suggestion.path}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                group flex items-center justify-between p-3 rounded-md cursor-pointer
                border transition-all duration-200
                ${resolvedTheme === 'dark'
                  ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3
                  ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-gray-100'}
                `}>
                  <IconComponent className={`w-4 h-4 ${textMutedClasses}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${textPrimaryClasses} truncate`}>
                    {suggestion.label}
                  </h4>
                  <p className={`text-xs ${textMutedClasses} truncate`}>
                    {getReasonLabel(suggestion.reason)}
                    {suggestion.visitCount && ` â€¢ ${suggestion.visitCount} visits`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-3">
                <ArrowRightIcon className={`
                  w-4 h-4 transition-transform duration-200 
                  ${textMutedClasses} group-hover:translate-x-1
                `} />
                
                {showDismiss && (
                  <button
                    onClick={(e) => handleDismiss(suggestion, e)}
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center
                      opacity-0 group-hover:opacity-100 transition-opacity
                      ${resolvedTheme === 'dark'
                        ? 'hover:bg-slate-600 text-gray-400 hover:text-gray-300'
                        : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                      }
                    `}
                    title="Dismiss suggestion"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer with personalization hint */}
      <div className={`mt-3 pt-3 border-t ${resolvedTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
        <p className={`text-xs ${textMutedClasses}`}>
          Suggestions adapt based on your role, current context, and usage patterns.
        </p>
      </div>
    </div>
  );
};

export default ContextualSuggestions;
