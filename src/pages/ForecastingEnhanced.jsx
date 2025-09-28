/**
 * Enhanced Forecasting Page
 * Enterprise-grade forecasting with dual AI models
 * Supports 365-day horizon with 88%+ accuracy targeting
 */

import React from 'react';
import EnhancedForecasting from '../components/forecasting/EnhancedForecasting';

const ForecastingEnhanced = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <EnhancedForecasting />
      </div>
    </div>
  );
};

export default ForecastingEnhanced;