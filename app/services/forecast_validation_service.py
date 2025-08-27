"""
Forecast Validation and Accuracy Tracking Service

Implements comprehensive forecast validation including:
- Backtesting against historical data
- Accuracy metrics (MAPE, RMSE, MAE)
- Model performance comparison
- Forecast vs actual tracking
- Continuous model improvement
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error
import warnings
warnings.filterwarnings('ignore')

from app import db
from app.models.forecast import Forecast
from app.models.historical_sales import HistoricalSales
from app.services.forecasting_service import ForecastingService
from app.services.seasonal_service import SeasonalService


@dataclass
class ValidationResult:
    """Container for validation results."""
    model_type: str
    mae: float
    mse: float
    rmse: float
    mape: float
    mape_category: str
    accuracy_score: float
    prediction_intervals_coverage: float
    bias: float
    trend_accuracy: float
    seasonal_accuracy: float
    validation_period_days: int
    total_predictions: int


class ForecastValidationService:
    """
    Comprehensive forecast validation and accuracy tracking service.
    """
    
    def __init__(self):
        self.forecasting_service = ForecastingService()
        self.seasonal_service = SeasonalService()
        
        # MAPE interpretation thresholds
        self.mape_categories = {
            'excellent': 0.1,      # < 10%
            'good': 0.2,           # 10-20%
            'reasonable': 0.5,     # 20-50%
            'poor': 1.0,           # 50-100%
            'very_poor': float('inf')  # > 100%
        }
    
    def backtest_model(self, product_id: str, sales_channel_id: str, 
                      model_type: str = 'auto', validation_days: int = 60,
                      forecast_horizon: int = 7) -> ValidationResult:
        """
        Perform backtesting of forecasting model against historical data.
        
        Args:
            product_id: Product identifier
            sales_channel_id: Sales channel identifier
            model_type: Model to validate ('auto', 'moving_average', etc.)
            validation_days: Days of historical data to use for validation
            forecast_horizon: Number of days to forecast in each test
            
        Returns:
            ValidationResult with comprehensive accuracy metrics
        """
        # Get historical data
        historical_data = self._get_backtest_data(product_id, sales_channel_id, validation_days)
        
        if len(historical_data) < validation_days:
            raise ValueError(f"Insufficient data for backtesting. Need {validation_days} days, have {len(historical_data)}")
        
        # Perform rolling forecast validation
        validation_results = self._rolling_backtest(
            historical_data, model_type, forecast_horizon, validation_days
        )
        
        # Calculate comprehensive metrics
        return self._calculate_validation_metrics(validation_results, model_type, validation_days)
    
    def compare_models(self, product_id: str, sales_channel_id: str,
                      models: List[str] = None, validation_days: int = 60) -> Dict:
        """
        Compare performance of multiple forecasting models.
        
        Args:
            product_id: Product identifier
            sales_channel_id: Sales channel identifier
            models: List of models to compare (defaults to all available)
            validation_days: Days for validation period
            
        Returns:
            Dict with model comparison results and recommendations
        """
        if models is None:
            models = ['moving_average', 'exponential_smoothing', 'arima', 'linear_regression', 'ml_ensemble']
        
        comparison_results = {}
        
        for model in models:
            try:
                result = self.backtest_model(
                    product_id, sales_channel_id, model, validation_days
                )
                comparison_results[model] = result
            except Exception as e:
                comparison_results[model] = {
                    'error': str(e),
                    'status': 'failed'
                }
        
        # Rank models by performance
        successful_models = {
            name: result for name, result in comparison_results.items()
            if isinstance(result, ValidationResult)
        }
        
        if successful_models:
            # Rank by composite score (lower is better)
            model_scores = {}
            for name, result in successful_models.items():
                # Weighted composite score
                composite_score = (
                    0.4 * result.mape +           # 40% MAPE
                    0.3 * (result.rmse / 100) +   # 30% RMSE (normalized)
                    0.2 * abs(result.bias) +      # 20% Bias
                    0.1 * (1 - result.accuracy_score)  # 10% Accuracy Score
                )
                model_scores[name] = composite_score
            
            # Sort by score (ascending)
            ranked_models = sorted(model_scores.items(), key=lambda x: x[1])
            
            best_model = ranked_models[0][0]
            worst_model = ranked_models[-1][0]
        else:
            ranked_models = []
            best_model = None
            worst_model = None
        
        return {
            'individual_results': comparison_results,
            'ranking': ranked_models,
            'best_model': best_model,
            'worst_model': worst_model,
            'recommendation': self._generate_model_recommendation(successful_models, ranked_models)
        }
    
    def validate_forecast_accuracy(self, forecast_id: str) -> Dict:
        """
        Validate accuracy of an existing forecast against actual results.
        
        Args:
            forecast_id: ID of forecast to validate
            
        Returns:
            Dict with accuracy assessment and updated forecast record
        """
        # Get forecast record
        forecast = Forecast.query.get(forecast_id)
        if not forecast:
            raise ValueError(f"Forecast {forecast_id} not found")
        
        # Get actual sales data for the forecast period
        end_date = forecast.forecast_date + timedelta(days=forecast.forecast_horizon_days)
        actual_data = self._get_actual_data(
            forecast.product_id,
            forecast.sales_channel_id, 
            forecast.forecast_date,
            end_date
        )
        
        if actual_data.empty:
            return {
                'status': 'no_actual_data',
                'message': 'No actual sales data available for validation'
            }
        
        # Calculate accuracy metrics
        predicted = [forecast.predicted_demand] * len(actual_data)
        actual = actual_data['demand'].tolist()
        
        validation_metrics = self._calculate_accuracy_metrics(actual, predicted)
        
        # Update forecast record with actual values
        total_actual_demand = sum(actual)
        total_actual_revenue = actual_data['revenue'].sum() if 'revenue' in actual_data else None
        
        forecast.update_actual_values(total_actual_demand, float(total_actual_revenue) if total_actual_revenue else None)
        
        return {
            'status': 'validated',
            'forecast_id': forecast_id,
            'validation_metrics': validation_metrics,
            'actual_demand': total_actual_demand,
            'predicted_demand': forecast.predicted_demand,
            'accuracy_category': self._categorize_mape(validation_metrics['mape']),
            'updated_at': datetime.utcnow().isoformat()
        }
    
    def track_model_performance(self, product_id: str, sales_channel_id: str,
                               tracking_period_days: int = 30) -> Dict:
        """
        Track ongoing model performance over specified period.
        
        Args:
            product_id: Product identifier
            sales_channel_id: Sales channel identifier  
            tracking_period_days: Days to track performance
            
        Returns:
            Dict with performance trends and insights
        """
        # Get all forecasts in tracking period
        end_date = date.today()
        start_date = end_date - timedelta(days=tracking_period_days)
        
        forecasts = Forecast.query.filter(
            Forecast.product_id == product_id,
            Forecast.sales_channel_id == sales_channel_id,
            Forecast.forecast_date >= start_date,
            Forecast.forecast_date <= end_date,
            Forecast.actual_demand.isnot(None)  # Only forecasts with actual data
        ).order_by(Forecast.forecast_date).all()
        
        if not forecasts:
            return {
                'status': 'no_validated_forecasts',
                'tracking_period': tracking_period_days,
                'recommendations': ['Generate more forecasts to enable performance tracking']
            }
        
        # Analyze performance trends
        performance_data = []
        for forecast in forecasts:
            if forecast.forecast_accuracy is not None:
                performance_data.append({
                    'date': forecast.forecast_date,
                    'model_type': forecast.model_type,
                    'accuracy': float(forecast.forecast_accuracy),
                    'error': float(forecast.forecast_error) if forecast.forecast_error else 0,
                    'predicted': forecast.predicted_demand,
                    'actual': forecast.actual_demand
                })
        
        if not performance_data:
            return {
                'status': 'no_accuracy_data',
                'message': 'No forecasts with calculated accuracy found'
            }
        
        # Calculate performance trends
        df = pd.DataFrame(performance_data)
        
        trends = {
            'average_accuracy': df['accuracy'].mean(),
            'accuracy_trend': self._calculate_trend(df['accuracy'].tolist()),
            'model_performance': df.groupby('model_type')['accuracy'].agg(['mean', 'std', 'count']).to_dict(),
            'error_distribution': {
                'mean_error': df['error'].mean(),
                'std_error': df['error'].std(),
                'bias': df['error'].mean()  # Positive = over-forecasting, Negative = under-forecasting
            },
            'total_forecasts': len(forecasts),
            'best_performing_model': df.groupby('model_type')['accuracy'].mean().idxmax() if len(df) > 0 else None
        }
        
        # Generate insights and recommendations
        insights = self._generate_performance_insights(trends, df)
        
        return {
            'status': 'success',
            'tracking_period': tracking_period_days,
            'performance_trends': trends,
            'insights': insights,
            'forecast_count': len(forecasts),
            'period_start': start_date.isoformat(),
            'period_end': end_date.isoformat()
        }
    
    def _get_backtest_data(self, product_id: str, sales_channel_id: str, days: int) -> pd.DataFrame:
        """Get historical data for backtesting."""
        end_date = date.today() - timedelta(days=1)  # Yesterday
        start_date = end_date - timedelta(days=days + 60)  # Extra buffer for model training
        
        sales_data = db.session.query(HistoricalSales).filter(
            HistoricalSales.product_id == product_id,
            HistoricalSales.sales_channel_id == sales_channel_id,
            HistoricalSales.sale_date >= start_date,
            HistoricalSales.sale_date <= end_date
        ).order_by(HistoricalSales.sale_date).all()
        
        data = []
        for sale in sales_data:
            data.append({
                'date': sale.sale_date,
                'demand': sale.quantity_sold,
                'revenue': float(sale.revenue_amount) if sale.revenue_amount else 0
            })
        
        df = pd.DataFrame(data)
        if not df.empty:
            df['date'] = pd.to_datetime(df['date'])
            df = df.set_index('date').sort_index()
        
        return df
    
    def _rolling_backtest(self, data: pd.DataFrame, model_type: str, 
                         forecast_horizon: int, validation_days: int) -> List[Dict]:
        """Perform rolling window backtesting."""
        results = []
        
        # Use last 60% of data for validation, first 40% for training
        total_days = len(data)
        training_days = int(total_days * 0.4)
        validation_start = training_days
        
        # Step through validation period
        step_size = max(1, forecast_horizon // 2)  # Overlap forecasts
        
        for i in range(validation_start, total_days - forecast_horizon, step_size):
            # Training data: from start up to current point
            train_data = data.iloc[:i]
            
            # Actual data: next forecast_horizon days
            actual_data = data.iloc[i:i + forecast_horizon]
            
            if len(train_data) < 30:  # Need minimum training data
                continue
            
            try:
                # Generate forecast using training data
                forecast_result = self._generate_backtest_forecast(
                    train_data, model_type, forecast_horizon
                )
                
                # Compare with actual
                actual_demand = actual_data['demand'].tolist()
                predicted_demand = forecast_result['forecasts'][:len(actual_demand)]
                confidence_lower = forecast_result['confidence_lower'][:len(actual_demand)]
                confidence_upper = forecast_result['confidence_upper'][:len(actual_demand)]
                
                results.append({
                    'forecast_date': data.index[i],
                    'actual': actual_demand,
                    'predicted': predicted_demand,
                    'confidence_lower': confidence_lower,
                    'confidence_upper': confidence_upper,
                    'horizon': len(actual_demand)
                })
                
            except Exception as e:
                # Skip failed forecasts
                continue
        
        return results
    
    def _generate_backtest_forecast(self, train_data: pd.DataFrame, model_type: str, 
                                   horizon: int) -> Dict:
        """Generate forecast for backtesting using historical training data."""
        # Convert to format expected by forecasting service
        
        if model_type == 'auto':
            # Use simplified auto-selection for backtesting
            if len(train_data) < 60:
                model_type = 'moving_average'
            else:
                model_type = 'exponential_smoothing'
        
        # Apply the specific algorithm
        if model_type == 'moving_average':
            return self.forecasting_service._moving_average_forecast(train_data, horizon, True, None)
        elif model_type == 'exponential_smoothing':
            return self.forecasting_service._exponential_smoothing_forecast(train_data, horizon, True, None)
        elif model_type == 'arima':
            return self.forecasting_service._arima_forecast(train_data, horizon, True, None)
        elif model_type == 'linear_regression':
            return self.forecasting_service._linear_regression_forecast(train_data, horizon, True, None)
        elif model_type == 'ml_ensemble':
            return self.forecasting_service._ml_ensemble_forecast(train_data, horizon, True, None)
        else:
            # Fall back to moving average
            return self.forecasting_service._moving_average_forecast(train_data, horizon, True, None)
    
    def _calculate_validation_metrics(self, validation_results: List[Dict], 
                                    model_type: str, validation_days: int) -> ValidationResult:
        """Calculate comprehensive validation metrics from backtest results."""
        if not validation_results:
            raise ValueError("No validation results to calculate metrics from")
        
        # Flatten all predictions and actuals
        all_actual = []
        all_predicted = []
        all_lower = []
        all_upper = []
        
        for result in validation_results:
            all_actual.extend(result['actual'])
            all_predicted.extend(result['predicted'])
            all_lower.extend(result['confidence_lower'])
            all_upper.extend(result['confidence_upper'])
        
        # Calculate basic metrics
        mae = mean_absolute_error(all_actual, all_predicted)
        mse = mean_squared_error(all_actual, all_predicted)
        rmse = np.sqrt(mse)
        mape = mean_absolute_percentage_error(all_actual, all_predicted)
        
        # Calculate additional metrics
        bias = np.mean(np.array(all_predicted) - np.array(all_actual))
        accuracy_score = 1 - mape  # Simple accuracy score
        
        # Prediction interval coverage
        in_interval = sum(1 for i in range(len(all_actual)) 
                         if all_lower[i] <= all_actual[i] <= all_upper[i])
        interval_coverage = in_interval / len(all_actual) if all_actual else 0
        
        # Trend accuracy (simplified)
        trend_accuracy = self._calculate_trend_accuracy(all_actual, all_predicted)
        
        # Seasonal accuracy (placeholder)
        seasonal_accuracy = 0.8  # Would implement more sophisticated seasonal accuracy
        
        return ValidationResult(
            model_type=model_type,
            mae=mae,
            mse=mse,
            rmse=rmse,
            mape=mape,
            mape_category=self._categorize_mape(mape),
            accuracy_score=max(0, accuracy_score),
            prediction_intervals_coverage=interval_coverage,
            bias=bias,
            trend_accuracy=trend_accuracy,
            seasonal_accuracy=seasonal_accuracy,
            validation_period_days=validation_days,
            total_predictions=len(all_actual)
        )
    
    def _calculate_accuracy_metrics(self, actual: List[float], predicted: List[float]) -> Dict:
        """Calculate accuracy metrics for a single forecast validation."""
        if len(actual) != len(predicted):
            # Align lengths
            min_len = min(len(actual), len(predicted))
            actual = actual[:min_len]
            predicted = predicted[:min_len]
        
        mae = mean_absolute_error(actual, predicted)
        mse = mean_squared_error(actual, predicted) 
        rmse = np.sqrt(mse)
        mape = mean_absolute_percentage_error(actual, predicted)
        bias = np.mean(np.array(predicted) - np.array(actual))
        
        return {
            'mae': mae,
            'mse': mse,
            'rmse': rmse,
            'mape': mape,
            'bias': bias,
            'accuracy_score': max(0, 1 - mape)
        }
    
    def _categorize_mape(self, mape: float) -> str:
        """Categorize MAPE value into performance category."""
        for category, threshold in self.mape_categories.items():
            if mape <= threshold:
                return category
        return 'very_poor'
    
    def _calculate_trend_accuracy(self, actual: List[float], predicted: List[float]) -> float:
        """Calculate how well the forecast captures the trend direction."""
        if len(actual) < 2 or len(predicted) < 2:
            return 0.5  # Neutral if too few points
        
        # Calculate period-over-period changes
        actual_changes = [actual[i] - actual[i-1] for i in range(1, len(actual))]
        predicted_changes = [predicted[i] - predicted[i-1] for i in range(1, len(predicted))]
        
        # Count correct directional predictions
        correct_directions = 0
        total_comparisons = 0
        
        for a_change, p_change in zip(actual_changes, predicted_changes):
            total_comparisons += 1
            # Same direction (both positive, both negative, or both zero)
            if (a_change >= 0 and p_change >= 0) or (a_change < 0 and p_change < 0):
                correct_directions += 1
        
        return correct_directions / total_comparisons if total_comparisons > 0 else 0.5
    
    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction from list of values."""
        if len(values) < 2:
            return 'stable'
        
        # Simple linear trend
        x = np.arange(len(values))
        slope = np.polyfit(x, values, 1)[0]
        
        if slope > 0.01:
            return 'improving'
        elif slope < -0.01:
            return 'declining'
        else:
            return 'stable'
    
    def _get_actual_data(self, product_id: str, sales_channel_id: str,
                        start_date: date, end_date: date) -> pd.DataFrame:
        """Get actual sales data for forecast validation."""
        sales_data = db.session.query(HistoricalSales).filter(
            HistoricalSales.product_id == product_id,
            HistoricalSales.sales_channel_id == sales_channel_id,
            HistoricalSales.sale_date >= start_date,
            HistoricalSales.sale_date < end_date
        ).order_by(HistoricalSales.sale_date).all()
        
        data = []
        for sale in sales_data:
            data.append({
                'date': sale.sale_date,
                'demand': sale.quantity_sold,
                'revenue': float(sale.revenue_amount) if sale.revenue_amount else 0
            })
        
        df = pd.DataFrame(data)
        if not df.empty:
            df['date'] = pd.to_datetime(df['date'])
            df = df.set_index('date').sort_index()
        
        return df
    
    def _generate_model_recommendation(self, successful_models: Dict, 
                                     ranked_models: List[Tuple]) -> Dict:
        """Generate model recommendation based on comparison results."""
        if not ranked_models:
            return {
                'recommendation': 'insufficient_data',
                'message': 'No models could be validated successfully'
            }
        
        best_model_name = ranked_models[0][0]
        best_model = successful_models[best_model_name]
        
        recommendation = {
            'primary_model': best_model_name,
            'confidence': 'high' if best_model.mape < 0.2 else 'medium' if best_model.mape < 0.5 else 'low',
            'reasons': []
        }
        
        # Add specific reasons
        if best_model.mape < 0.15:
            recommendation['reasons'].append(f'Excellent accuracy (MAPE: {best_model.mape:.1%})')
            
        if best_model.prediction_intervals_coverage > 0.8:
            recommendation['reasons'].append('Good confidence interval coverage')
            
        if abs(best_model.bias) < 5:
            recommendation['reasons'].append('Low prediction bias')
        
        # Add fallback recommendation
        if len(ranked_models) > 1:
            second_best = ranked_models[1][0]
            recommendation['fallback_model'] = second_best
            recommendation['ensemble_recommendation'] = f'Consider ensemble of {best_model_name} and {second_best}'
        
        return recommendation
    
    def _generate_performance_insights(self, trends: Dict, performance_df: pd.DataFrame) -> List[str]:
        """Generate actionable insights from performance trends."""
        insights = []
        
        # Accuracy insights
        avg_accuracy = trends['average_accuracy']
        if avg_accuracy > 0.8:
            insights.append('Model performance is excellent (>80% accuracy)')
        elif avg_accuracy > 0.6:
            insights.append('Model performance is good (60-80% accuracy)')  
        else:
            insights.append('Model performance needs improvement (<60% accuracy)')
        
        # Bias insights
        bias = trends['error_distribution']['bias']
        if abs(bias) > 10:
            direction = 'over-forecasting' if bias > 0 else 'under-forecasting'
            insights.append(f'Model shows consistent {direction} bias (avg error: {bias:.1f})')
        
        # Trend insights
        if trends['accuracy_trend'] == 'improving':
            insights.append('Model accuracy is improving over time')
        elif trends['accuracy_trend'] == 'declining':
            insights.append('Model accuracy is declining - consider retraining')
        
        # Model-specific insights
        if trends['best_performing_model']:
            insights.append(f'Best performing model: {trends["best_performing_model"]}')
        
        return insights