"""
Enhanced Forecasting Service Layer

Integrates all forecasting components:
- Core forecasting algorithms
- Seasonal pattern recognition
- Model validation and selection
- Forecast adjustment and optimization
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Tuple
import json
import uuid

from app import db
from app.models.forecast import Forecast
from app.models.historical_sales import HistoricalSales
from app.models.product import Product
from app.models.sales_channel import SalesChannel
from app.models.market import Market
from app.services.forecasting_service import ForecastingService
from app.services.seasonal_service import SeasonalService
from app.services.forecast_validation_service import ForecastValidationService


class EnhancedForecastingService:
    """
    Main forecasting service that orchestrates all forecasting components
    and provides a unified interface for forecast generation and management.
    """
    
    def __init__(self):
        self.forecasting_service = ForecastingService()
        self.seasonal_service = SeasonalService()
        self.validation_service = ForecastValidationService()
        
        # Default parameters
        self.default_horizon = 30
        self.confidence_level = 0.95
        
    def generate_comprehensive_forecast(self, product_id: str, sales_channel_id: str,
                                      forecast_horizon: int = None,
                                      algorithm: str = 'auto',
                                      apply_seasonal: bool = True,
                                      external_factors: Optional[Dict] = None,
                                      save_to_db: bool = True,
                                      created_by: str = None) -> Dict:
        """
        Generate comprehensive forecast with all enhancements.
        
        Args:
            product_id: Product identifier
            sales_channel_id: Sales channel identifier
            forecast_horizon: Days to forecast (default: 30)
            algorithm: Forecasting algorithm ('auto', 'moving_average', etc.)
            apply_seasonal: Whether to apply seasonal adjustments
            external_factors: External factors like promotions, economic indicators
            save_to_db: Whether to save forecast to database
            created_by: User ID creating the forecast
            
        Returns:
            Dict containing comprehensive forecast results
        """
        if forecast_horizon is None:
            forecast_horizon = self.default_horizon
        
        try:
            # Step 1: Get market information for regional adjustments
            market_info = self._get_market_info(product_id, sales_channel_id)
            market_code = market_info.get('market_code', 'UK')
            
            # Step 2: Auto-select algorithm if requested
            if algorithm == 'auto':
                algorithm = self._auto_select_algorithm(product_id, sales_channel_id)
            
            # Step 3: Generate base forecast
            base_forecast = self.forecasting_service.generate_forecast(
                product_id=product_id,
                sales_channel_id=sales_channel_id,
                forecast_horizon=forecast_horizon,
                algorithm=algorithm,
                seasonal_adjustment=False,  # We'll apply our own seasonal adjustments
                external_factors=external_factors
            )
            
            # Step 4: Detect seasonal patterns
            seasonal_patterns = {}
            if apply_seasonal:
                seasonal_patterns = self.seasonal_service.detect_seasonal_patterns(
                    product_id=product_id,
                    sales_channel_id=sales_channel_id,
                    market_code=market_code
                )
                
                # Apply seasonal adjustments to forecast
                seasonal_adjustment = self.seasonal_service.apply_seasonal_adjustment(
                    base_forecast=base_forecast['forecasts'],
                    start_date=date.today() + timedelta(days=1),
                    seasonal_patterns=seasonal_patterns.get('seasonal_patterns', {})
                )
                
                # Update forecast with seasonal adjustments
                base_forecast['forecasts'] = seasonal_adjustment['adjusted_forecast']
                base_forecast['seasonal_factors'] = seasonal_adjustment['factor_breakdown']
            
            # Step 5: Apply external factor adjustments
            if external_factors:
                base_forecast = self._apply_external_factors(base_forecast, external_factors)
            
            # Step 6: Calculate enhanced confidence intervals
            enhanced_forecast = self._enhance_confidence_intervals(base_forecast, seasonal_patterns)
            
            # Step 7: Generate forecast insights and recommendations
            insights = self._generate_forecast_insights(
                enhanced_forecast, seasonal_patterns, market_code, external_factors
            )
            
            # Step 8: Save to database if requested
            forecast_record = None
            if save_to_db:
                forecast_record = self._save_forecast_to_db(
                    product_id=product_id,
                    sales_channel_id=sales_channel_id,
                    forecast_data=enhanced_forecast,
                    seasonal_patterns=seasonal_patterns,
                    external_factors=external_factors,
                    created_by=created_by
                )
            
            # Compile comprehensive result
            comprehensive_result = {
                'forecast_id': str(forecast_record.id) if forecast_record else None,
                'product_id': product_id,
                'sales_channel_id': sales_channel_id,
                'market_code': market_code,
                'forecast_horizon': forecast_horizon,
                'algorithm': algorithm,
                'generated_at': datetime.utcnow().isoformat(),
                
                # Core forecast data
                'forecasts': enhanced_forecast['forecasts'],
                'confidence_lower': enhanced_forecast['confidence_lower'],
                'confidence_upper': enhanced_forecast['confidence_upper'],
                
                # Model information
                'model_type': enhanced_forecast['model_type'],
                'model_accuracy': enhanced_forecast.get('model_accuracy', {}),
                'model_params': enhanced_forecast.get('model_params', {}),
                
                # Seasonal information
                'seasonal_adjustment_applied': apply_seasonal,
                'seasonal_patterns': seasonal_patterns,
                
                # External factors
                'external_factors': external_factors or {},
                
                # Insights and recommendations
                'insights': insights,
                
                # Summary statistics
                'summary': {
                    'total_forecasted_demand': sum(enhanced_forecast['forecasts']),
                    'average_daily_demand': np.mean(enhanced_forecast['forecasts']),
                    'peak_demand_day': np.argmax(enhanced_forecast['forecasts']) + 1,
                    'peak_demand_value': max(enhanced_forecast['forecasts']),
                    'confidence_range_avg': np.mean([
                        u - l for u, l in zip(
                            enhanced_forecast['confidence_upper'],
                            enhanced_forecast['confidence_lower']
                        )
                    ])
                }
            }
            
            return comprehensive_result
            
        except Exception as e:
            return {
                'error': str(e),
                'status': 'failed',
                'product_id': product_id,
                'sales_channel_id': sales_channel_id,
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def get_forecast_recommendations(self, product_id: str, sales_channel_id: str) -> Dict:
        """
        Get personalized forecast recommendations based on historical performance.
        
        Args:
            product_id: Product identifier
            sales_channel_id: Sales channel identifier
            
        Returns:
            Dict with recommendations for optimal forecasting approach
        """
        try:
            # Analyze historical forecast performance
            performance = self.validation_service.track_model_performance(
                product_id, sales_channel_id, tracking_period_days=60
            )
            
            # Compare model performance
            model_comparison = self.validation_service.compare_models(
                product_id, sales_channel_id, validation_days=90
            )
            
            # Get seasonal pattern analysis
            seasonal_analysis = self.seasonal_service.detect_seasonal_patterns(
                product_id, sales_channel_id
            )
            
            # Generate recommendations
            recommendations = {
                'recommended_algorithm': model_comparison.get('best_model', 'exponential_smoothing'),
                'forecast_horizon': self._recommend_forecast_horizon(seasonal_analysis),
                'update_frequency': self._recommend_update_frequency(performance, seasonal_analysis),
                'seasonal_adjustment': seasonal_analysis.get('confidence_score', 0) > 0.6,
                'confidence_level': self._recommend_confidence_level(performance),
                
                'insights': {
                    'model_performance': performance.get('insights', []),
                    'seasonal_strength': seasonal_analysis.get('detection_summary', {}),
                    'data_quality': self._assess_data_quality(product_id, sales_channel_id)
                },
                
                'next_steps': self._generate_next_steps(performance, model_comparison, seasonal_analysis)
            }
            
            return recommendations
            
        except Exception as e:
            return {
                'error': str(e),
                'status': 'failed',
                'basic_recommendations': {
                    'recommended_algorithm': 'exponential_smoothing',
                    'forecast_horizon': 30,
                    'update_frequency': 'weekly',
                    'seasonal_adjustment': True
                }
            }
    
    def optimize_forecast_parameters(self, product_id: str, sales_channel_id: str) -> Dict:
        """
        Optimize forecast parameters through systematic testing.
        
        Args:
            product_id: Product identifier
            sales_channel_id: Sales channel identifier
            
        Returns:
            Dict with optimized parameters and performance metrics
        """
        # Test different parameter combinations
        algorithms = ['moving_average', 'exponential_smoothing', 'arima', 'linear_regression']
        horizons = [7, 14, 30, 60]
        seasonal_options = [True, False]
        
        best_params = None
        best_score = float('inf')
        results = []
        
        for algorithm in algorithms:
            for horizon in horizons:
                for seasonal in seasonal_options:
                    try:
                        # Validate this parameter combination
                        validation = self.validation_service.backtest_model(
                            product_id=product_id,
                            sales_channel_id=sales_channel_id,
                            model_type=algorithm,
                            validation_days=min(90, horizon * 3),
                            forecast_horizon=min(7, horizon // 4)
                        )
                        
                        # Score based on MAPE + bias penalty
                        score = validation.mape + abs(validation.bias) * 0.1
                        
                        result = {
                            'algorithm': algorithm,
                            'horizon': horizon,
                            'seasonal': seasonal,
                            'score': score,
                            'mape': validation.mape,
                            'bias': validation.bias,
                            'accuracy': validation.accuracy_score
                        }
                        
                        results.append(result)
                        
                        if score < best_score:
                            best_score = score
                            best_params = {
                                'algorithm': algorithm,
                                'horizon': horizon,
                                'seasonal_adjustment': seasonal,
                                'expected_mape': validation.mape,
                                'expected_accuracy': validation.accuracy_score
                            }
                            
                    except Exception:
                        continue  # Skip failed parameter combinations
        
        return {
            'optimized_parameters': best_params or {
                'algorithm': 'exponential_smoothing',
                'horizon': 30,
                'seasonal_adjustment': True
            },
            'all_results': sorted(results, key=lambda x: x['score']),
            'optimization_summary': {
                'total_combinations_tested': len(results),
                'best_score': best_score,
                'improvement_vs_default': self._calculate_improvement(results)
            }
        }
    
    def _auto_select_algorithm(self, product_id: str, sales_channel_id: str) -> str:
        """Auto-select best algorithm based on data characteristics and past performance."""
        try:
            # Check if we have performance history
            performance = self.validation_service.track_model_performance(
                product_id, sales_channel_id, tracking_period_days=30
            )
            
            if (performance.get('status') == 'success' and 
                performance.get('performance_trends', {}).get('best_performing_model')):
                return performance['performance_trends']['best_performing_model']
            
            # Fall back to model comparison
            comparison = self.validation_service.compare_models(
                product_id, sales_channel_id, validation_days=60
            )
            
            if comparison.get('best_model'):
                return comparison['best_model']
                
        except Exception:
            pass
        
        # Final fallback - use data characteristics
        try:
            historical_data = self.forecasting_service._get_historical_data(product_id, sales_channel_id)
            return self.forecasting_service._select_best_algorithm(historical_data)
        except Exception:
            return 'exponential_smoothing'  # Safe default
    
    def _get_market_info(self, product_id: str, sales_channel_id: str) -> Dict:
        """Get market information for regional adjustments."""
        try:
            # Query market information through sales channel
            sales_channel = SalesChannel.query.get(sales_channel_id)
            if sales_channel and hasattr(sales_channel, 'market_id'):
                market = Market.query.get(sales_channel.market_id)
                if market:
                    return {
                        'market_code': market.market_code,
                        'currency': getattr(market, 'currency', 'GBP'),
                        'timezone': getattr(market, 'timezone', 'UTC')
                    }
        except Exception:
            pass
        
        # Default to UK market
        return {
            'market_code': 'UK',
            'currency': 'GBP',
            'timezone': 'UTC'
        }
    
    def _apply_external_factors(self, forecast_data: Dict, external_factors: Dict) -> Dict:
        """Apply external factor adjustments to forecast."""
        adjusted_forecasts = []
        
        for i, base_value in enumerate(forecast_data['forecasts']):
            adjustment_factor = 1.0
            
            # Apply promotional factors
            if 'promotion_factor' in external_factors:
                promotion_factor = external_factors['promotion_factor']
                if isinstance(promotion_factor, (int, float)):
                    adjustment_factor *= promotion_factor
            
            # Apply economic factors
            if 'economic_indicator' in external_factors:
                economic_factor = external_factors['economic_indicator']
                if isinstance(economic_factor, (int, float)):
                    adjustment_factor *= (1.0 + economic_factor)
            
            # Apply market trend factors
            if 'market_trend' in external_factors:
                trend_factor = external_factors['market_trend']
                if isinstance(trend_factor, (int, float)):
                    adjustment_factor *= (1.0 + trend_factor)
            
            adjusted_value = base_value * adjustment_factor
            adjusted_forecasts.append(max(0, adjusted_value))  # Ensure non-negative
        
        # Update forecast data
        forecast_data['forecasts'] = adjusted_forecasts
        forecast_data['external_factors_applied'] = external_factors
        
        return forecast_data
    
    def _enhance_confidence_intervals(self, forecast_data: Dict, seasonal_patterns: Dict) -> Dict:
        """Enhance confidence intervals with seasonal and uncertainty adjustments."""
        enhanced_lower = []
        enhanced_upper = []
        
        seasonal_strength = seasonal_patterns.get('seasonal_patterns', {}).get('overall_strength', 0)
        uncertainty_multiplier = 1.0 + (seasonal_strength * 0.5)  # Higher uncertainty for seasonal data
        
        for i, (forecast, lower, upper) in enumerate(zip(
            forecast_data['forecasts'],
            forecast_data['confidence_lower'],
            forecast_data['confidence_upper']
        )):
            # Adjust confidence intervals for increased uncertainty over time
            time_decay = 1.0 + (i * 0.02)  # Increase uncertainty by 2% per day
            adjusted_multiplier = uncertainty_multiplier * time_decay
            
            interval_width = (upper - lower) * adjusted_multiplier
            center = forecast
            
            enhanced_lower.append(max(0, center - interval_width / 2))
            enhanced_upper.append(center + interval_width / 2)
        
        forecast_data['confidence_lower'] = enhanced_lower
        forecast_data['confidence_upper'] = enhanced_upper
        
        return forecast_data
    
    def _generate_forecast_insights(self, forecast_data: Dict, seasonal_patterns: Dict,
                                  market_code: str, external_factors: Optional[Dict]) -> List[str]:
        """Generate actionable insights from forecast results."""
        insights = []
        
        forecasts = forecast_data['forecasts']
        
        # Demand trend insights
        if len(forecasts) >= 7:
            recent_avg = np.mean(forecasts[:7])
            later_avg = np.mean(forecasts[7:14]) if len(forecasts) >= 14 else recent_avg
            
            if later_avg > recent_avg * 1.1:
                insights.append('Demand expected to increase significantly in coming weeks')
            elif later_avg < recent_avg * 0.9:
                insights.append('Demand expected to decrease in coming weeks')
            else:
                insights.append('Demand expected to remain stable')
        
        # Seasonal insights
        seasonal_strength = seasonal_patterns.get('seasonal_patterns', {}).get('overall_strength', 0)
        if seasonal_strength > 0.3:
            insights.append('Strong seasonal patterns detected - consider seasonal inventory planning')
        
        # Peak demand insights
        if forecasts:
            peak_day = np.argmax(forecasts)
            peak_value = max(forecasts)
            avg_value = np.mean(forecasts)
            
            if peak_value > avg_value * 1.5:
                insights.append(f'Peak demand expected on day {peak_day + 1} ({peak_value:.0f} units)')
        
        # External factor insights
        if external_factors:
            if external_factors.get('promotion_factor', 1.0) > 1.2:
                insights.append('Promotional activities expected to boost demand significantly')
            elif external_factors.get('promotion_factor', 1.0) < 0.8:
                insights.append('Market conditions may suppress demand')
        
        # Model confidence insights
        model_accuracy = forecast_data.get('model_accuracy', {})
        mape = model_accuracy.get('mape', 1.0)
        
        if mape < 0.15:
            insights.append('High confidence forecast - model has excellent historical accuracy')
        elif mape > 0.5:
            insights.append('Medium confidence forecast - consider additional validation')
        
        return insights
    
    def _save_forecast_to_db(self, product_id: str, sales_channel_id: str,
                           forecast_data: Dict, seasonal_patterns: Dict,
                           external_factors: Optional[Dict], created_by: str) -> Forecast:
        """Save forecast to database."""
        # Calculate summary statistics
        forecasts = forecast_data['forecasts']
        confidence_lower = forecast_data['confidence_lower']
        confidence_upper = forecast_data['confidence_upper']
        
        total_demand = sum(forecasts)
        avg_confidence = np.mean([
            (upper + lower) / 2 for upper, lower in zip(confidence_upper, confidence_lower)
        ]) / np.mean(forecasts) if forecasts else 1.0
        
        # Extract seasonal factors
        seasonal_factor = seasonal_patterns.get('seasonal_patterns', {}).get('overall_strength', 0)
        
        # Create forecast record
        forecast = Forecast(
            id=uuid.uuid4(),
            product_id=product_id,
            sales_channel_id=sales_channel_id,
            forecast_date=date.today(),
            forecast_period='daily',
            forecast_horizon_days=len(forecasts),
            predicted_demand=int(total_demand),
            demand_lower_bound=int(sum(confidence_lower)),
            demand_upper_bound=int(sum(confidence_upper)),
            confidence_score=min(1.0, avg_confidence),
            seasonal_factor=seasonal_factor,
            external_factors=external_factors or {},
            model_type=forecast_data['model_type'],
            model_version='enhanced_v1.0',
            model_accuracy_score=forecast_data.get('model_accuracy', {}).get('mape', 0.5),
            status='active',
            created_by=created_by,
            notes=json.dumps({
                'daily_forecasts': forecasts,
                'daily_confidence_lower': confidence_lower,
                'daily_confidence_upper': confidence_upper,
                'seasonal_patterns_summary': seasonal_patterns.get('detection_summary', {}),
                'model_params': forecast_data.get('model_params', {})
            })
        )
        
        db.session.add(forecast)
        db.session.commit()
        
        return forecast
    
    def _recommend_forecast_horizon(self, seasonal_analysis: Dict) -> int:
        """Recommend optimal forecast horizon based on seasonal patterns."""
        seasonal_strength = seasonal_analysis.get('seasonal_patterns', {}).get('overall_strength', 0)
        
        if seasonal_strength > 0.4:
            return 60  # Longer horizon for seasonal products
        elif seasonal_strength > 0.2:
            return 30  # Standard horizon
        else:
            return 14  # Shorter horizon for unpredictable products
    
    def _recommend_update_frequency(self, performance: Dict, seasonal_analysis: Dict) -> str:
        """Recommend forecast update frequency."""
        if performance.get('status') == 'success':
            accuracy_trend = performance.get('performance_trends', {}).get('accuracy_trend', 'stable')
            if accuracy_trend == 'declining':
                return 'daily'
        
        seasonal_strength = seasonal_analysis.get('seasonal_patterns', {}).get('overall_strength', 0)
        if seasonal_strength > 0.3:
            return 'weekly'
        else:
            return 'bi-weekly'
    
    def _recommend_confidence_level(self, performance: Dict) -> float:
        """Recommend confidence level based on model performance."""
        if performance.get('status') == 'success':
            avg_accuracy = performance.get('performance_trends', {}).get('average_accuracy', 0.7)
            if avg_accuracy > 0.8:
                return 0.90  # High confidence
            elif avg_accuracy > 0.6:
                return 0.95  # Standard confidence
            else:
                return 0.99  # Conservative confidence
        
        return 0.95  # Default
    
    def _assess_data_quality(self, product_id: str, sales_channel_id: str) -> Dict:
        """Assess quality of historical data for forecasting."""
        try:
            historical_data = self.forecasting_service._get_historical_data(product_id, sales_channel_id)
            
            if historical_data.empty:
                return {'quality': 'poor', 'issues': ['no_data']}
            
            issues = []
            quality_score = 1.0
            
            # Check data completeness
            if len(historical_data) < 30:
                issues.append('insufficient_data')
                quality_score *= 0.7
            
            # Check for missing values
            missing_pct = historical_data['demand'].isnull().mean()
            if missing_pct > 0.05:
                issues.append('missing_values')
                quality_score *= (1 - missing_pct)
            
            # Check for outliers
            demand_std = historical_data['demand'].std()
            demand_mean = historical_data['demand'].mean()
            outliers = abs(historical_data['demand'] - demand_mean) > 3 * demand_std
            outlier_pct = outliers.mean()
            
            if outlier_pct > 0.1:
                issues.append('many_outliers')
                quality_score *= 0.9
            
            # Overall quality assessment
            if quality_score > 0.8:
                quality = 'excellent'
            elif quality_score > 0.6:
                quality = 'good'
            elif quality_score > 0.4:
                quality = 'fair'
            else:
                quality = 'poor'
            
            return {
                'quality': quality,
                'score': quality_score,
                'issues': issues,
                'data_points': len(historical_data),
                'date_range': f"{historical_data.index.min().date()} to {historical_data.index.max().date()}"
            }
            
        except Exception as e:
            return {
                'quality': 'unknown',
                'error': str(e)
            }
    
    def _generate_next_steps(self, performance: Dict, model_comparison: Dict, 
                           seasonal_analysis: Dict) -> List[str]:
        """Generate recommended next steps for forecast improvement."""
        next_steps = []
        
        # Performance-based recommendations
        if performance.get('status') == 'success':
            avg_accuracy = performance.get('performance_trends', {}).get('average_accuracy', 0.7)
            if avg_accuracy < 0.6:
                next_steps.append('Consider collecting more historical data or external variables')
                next_steps.append('Review forecast parameters and try ensemble methods')
        
        # Model comparison recommendations
        if model_comparison.get('best_model'):
            best_model = model_comparison['best_model']
            next_steps.append(f'Switch to {best_model} algorithm for better performance')
        
        # Seasonal recommendations  
        seasonal_strength = seasonal_analysis.get('seasonal_patterns', {}).get('overall_strength', 0)
        if seasonal_strength > 0.3:
            next_steps.append('Implement seasonal inventory planning based on detected patterns')
        
        # Default recommendations
        if not next_steps:
            next_steps = [
                'Continue monitoring forecast accuracy',
                'Validate forecasts against actual sales regularly',
                'Consider adding external factors like promotions or economic indicators'
            ]
        
        return next_steps
    
    def _calculate_improvement(self, results: List[Dict]) -> float:
        """Calculate improvement percentage vs default parameters."""
        if not results:
            return 0.0
        
        # Assume default is exponential smoothing with 30-day horizon
        default_results = [r for r in results 
                          if r['algorithm'] == 'exponential_smoothing' and r['horizon'] == 30]
        
        if not default_results:
            return 0.0
        
        best_score = min(r['score'] for r in results)
        default_score = default_results[0]['score']
        
        if default_score > 0:
            improvement = ((default_score - best_score) / default_score) * 100
            return max(0, improvement)
        
        return 0.0