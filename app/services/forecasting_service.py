"""
Advanced Demand Forecasting Service

Implements multiple forecasting algorithms with seasonal adjustments,
trend analysis, and machine learning ensemble approaches.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Tuple, Union
import warnings
warnings.filterwarnings('ignore', category=FutureWarning)

# Statistical and ML imports
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error
from scipy.stats import norm
import statsmodels.api as sm
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose

from app import db
from app.models.forecast import Forecast
from app.models.historical_sales import HistoricalSales
from app.models.product import Product
from app.models.sales_channel import SalesChannel


class ForecastingService:
    """
    Advanced forecasting service implementing multiple algorithms:
    - Moving averages with seasonal adjustments
    - Exponential smoothing (Holt-Winters)
    - ARIMA time series models
    - Linear regression with multiple variables
    - Machine learning ensemble approach
    """
    
    def __init__(self):
        self.algorithms = {
            'moving_average': self._moving_average_forecast,
            'exponential_smoothing': self._exponential_smoothing_forecast,
            'arima': self._arima_forecast,
            'linear_regression': self._linear_regression_forecast,
            'ml_ensemble': self._ml_ensemble_forecast
        }
        self.scaler = StandardScaler()
        
    def generate_forecast(self, 
                         product_id: str, 
                         sales_channel_id: str,
                         forecast_horizon: int = 30,
                         algorithm: str = 'auto',
                         seasonal_adjustment: bool = True,
                         external_factors: Optional[Dict] = None) -> Dict:
        """
        Generate demand forecast using specified algorithm or auto-selection.
        
        Args:
            product_id: Product identifier
            sales_channel_id: Sales channel identifier
            forecast_horizon: Days to forecast ahead
            algorithm: Forecasting algorithm to use ('auto', 'moving_average', 'exponential_smoothing', 'arima', 'linear_regression', 'ml_ensemble')
            seasonal_adjustment: Whether to apply seasonal adjustments
            external_factors: Additional factors like promotions, economic indicators
            
        Returns:
            Dict containing forecast results and metadata
        """
        # Get historical sales data
        historical_data = self._get_historical_data(product_id, sales_channel_id)
        
        if historical_data.empty:
            raise ValueError("Insufficient historical data for forecasting")
            
        # Auto-select algorithm if requested
        if algorithm == 'auto':
            algorithm = self._select_best_algorithm(historical_data)
            
        # Generate base forecast
        forecast_func = self.algorithms.get(algorithm)
        if not forecast_func:
            raise ValueError(f"Unknown algorithm: {algorithm}")
            
        forecast_result = forecast_func(
            historical_data, 
            forecast_horizon, 
            seasonal_adjustment,
            external_factors
        )
        
        # Add metadata
        forecast_result.update({
            'algorithm': algorithm,
            'data_points': len(historical_data),
            'forecast_date': date.today(),
            'forecast_horizon': forecast_horizon,
            'seasonal_adjustment': seasonal_adjustment,
            'external_factors': external_factors or {}
        })
        
        return forecast_result
    
    def _get_historical_data(self, product_id: str, sales_channel_id: str) -> pd.DataFrame:
        """Get historical sales data for the product and channel."""
        # Query historical sales from database
        sales_data = db.session.query(HistoricalSales).filter(
            HistoricalSales.product_id == product_id,
            HistoricalSales.sales_channel_id == sales_channel_id
        ).order_by(HistoricalSales.sale_date).all()
        
        if not sales_data:
            return pd.DataFrame()
            
        # Convert to DataFrame
        data = []
        for sale in sales_data:
            data.append({
                'date': sale.sale_date,
                'demand': sale.quantity_sold,
                'revenue': float(sale.revenue_amount) if sale.revenue_amount else 0,
                'unit_price': float(sale.unit_price) if sale.unit_price else 0,
                'day_of_week': sale.sale_date.weekday(),
                'month': sale.sale_date.month,
                'quarter': (sale.sale_date.month - 1) // 3 + 1
            })
            
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date').sort_index()
        
        return df
    
    def _select_best_algorithm(self, data: pd.DataFrame) -> str:
        """Auto-select the best algorithm based on data characteristics."""
        data_size = len(data)
        
        # Check for seasonality
        if data_size >= 52:  # At least a year of weekly data
            decomposition = seasonal_decompose(data['demand'], period=7, extrapolate_trend='freq')
            seasonal_strength = decomposition.seasonal.std() / data['demand'].mean()
            
            if seasonal_strength > 0.1:
                return 'exponential_smoothing'
                
        # Check for trend
        if data_size >= 30:
            x = np.arange(len(data))
            slope, _ = np.polyfit(x, data['demand'], 1)
            if abs(slope) > 0.01:
                if data_size >= 100:
                    return 'ml_ensemble'
                else:
                    return 'linear_regression'
                    
        # For small datasets or stable demand
        if data_size < 30:
            return 'moving_average'
        else:
            return 'arima'
    
    def _moving_average_forecast(self, data: pd.DataFrame, horizon: int, 
                                seasonal: bool = True, external_factors: Optional[Dict] = None) -> Dict:
        """Moving average forecast with seasonal adjustments."""
        demand_series = data['demand']
        
        # Calculate different moving averages
        ma_7 = demand_series.rolling(window=7, min_periods=3).mean()
        ma_14 = demand_series.rolling(window=14, min_periods=7).mean()
        ma_30 = demand_series.rolling(window=30, min_periods=15).mean()
        
        # Use weighted combination of moving averages
        weights = np.array([0.5, 0.3, 0.2])  # More weight to recent periods
        latest_values = [
            ma_7.iloc[-1] if not pd.isna(ma_7.iloc[-1]) else demand_series.mean(),
            ma_14.iloc[-1] if not pd.isna(ma_14.iloc[-1]) else demand_series.mean(),
            ma_30.iloc[-1] if not pd.isna(ma_30.iloc[-1]) else demand_series.mean()
        ]
        
        base_forecast = np.average(latest_values, weights=weights)
        
        # Apply seasonal adjustment
        seasonal_factor = 1.0
        if seasonal and len(data) >= 14:
            # Calculate day-of-week seasonality
            dow_factors = data.groupby('day_of_week')['demand'].mean() / data['demand'].mean()
            
            # Calculate monthly seasonality
            monthly_factors = data.groupby('month')['demand'].mean() / data['demand'].mean()
            
            # Generate forecast series
            forecasts = []
            confidence_lower = []
            confidence_upper = []
            
            for i in range(horizon):
                forecast_date = data.index[-1] + timedelta(days=i+1)
                
                # Apply day-of-week seasonality
                dow = forecast_date.weekday()
                dow_factor = dow_factors.get(dow, 1.0)
                
                # Apply monthly seasonality
                month_factor = monthly_factors.get(forecast_date.month, 1.0)
                
                # Combine factors
                combined_factor = (dow_factor + month_factor) / 2
                
                # Calculate forecast
                forecast_value = base_forecast * combined_factor
                
                # Calculate confidence intervals based on historical volatility
                std_dev = demand_series.std()
                confidence_lower.append(max(0, forecast_value - 1.96 * std_dev))
                confidence_upper.append(forecast_value + 1.96 * std_dev)
                
                forecasts.append(forecast_value)
        else:
            # Simple forecast without seasonality
            forecasts = [base_forecast] * horizon
            std_dev = demand_series.std()
            confidence_lower = [max(0, base_forecast - 1.96 * std_dev)] * horizon
            confidence_upper = [base_forecast + 1.96 * std_dev] * horizon
        
        # Calculate accuracy metrics on recent data
        actual_recent = demand_series.iloc[-min(30, len(demand_series)):]
        predicted_recent = [base_forecast] * len(actual_recent)
        
        mae = mean_absolute_error(actual_recent, predicted_recent)
        mape = mean_absolute_percentage_error(actual_recent, predicted_recent)
        
        return {
            'forecasts': forecasts,
            'confidence_lower': confidence_lower,
            'confidence_upper': confidence_upper,
            'model_accuracy': {
                'mae': mae,
                'mape': mape,
                'method': 'backtest_30_days'
            },
            'model_type': 'moving_average',
            'model_params': {
                'window_sizes': [7, 14, 30],
                'weights': weights.tolist(),
                'seasonal_adjustment': seasonal
            }
        }
    
    def _exponential_smoothing_forecast(self, data: pd.DataFrame, horizon: int,
                                       seasonal: bool = True, external_factors: Optional[Dict] = None) -> Dict:
        """Exponential smoothing (Holt-Winters) forecast."""
        demand_series = data['demand']
        
        if len(demand_series) < 14:
            # Fall back to simple exponential smoothing
            alpha = 0.3
            forecasts = []
            last_value = demand_series.iloc[-1]
            
            for i in range(horizon):
                forecasts.append(last_value)
                
            std_dev = demand_series.std()
            confidence_lower = [max(0, f - 1.96 * std_dev) for f in forecasts]
            confidence_upper = [f + 1.96 * std_dev for f in forecasts]
            
            return {
                'forecasts': forecasts,
                'confidence_lower': confidence_lower, 
                'confidence_upper': confidence_upper,
                'model_accuracy': {'mae': std_dev, 'mape': 0.2, 'method': 'simple_es'},
                'model_type': 'exponential_smoothing_simple',
                'model_params': {'alpha': alpha}
            }
        
        try:
            # Determine seasonality period
            if seasonal and len(demand_series) >= 14:
                seasonal_periods = 7  # Weekly seasonality
                if len(demand_series) >= 60:
                    seasonal_periods = 30  # Monthly seasonality for longer series
            else:
                seasonal_periods = None
                
            # Fit Holt-Winters model
            if seasonal_periods:
                model = ExponentialSmoothing(
                    demand_series,
                    trend='add',
                    seasonal='add',
                    seasonal_periods=seasonal_periods
                )
            else:
                model = ExponentialSmoothing(
                    demand_series,
                    trend='add'
                )
                
            fitted_model = model.fit(optimized=True)
            
            # Generate forecast
            forecast_result = fitted_model.forecast(steps=horizon)
            forecasts = forecast_result.tolist()
            
            # Calculate confidence intervals
            forecast_ci = fitted_model.get_prediction(
                start=len(demand_series),
                end=len(demand_series) + horizon - 1
            ).conf_int()
            
            confidence_lower = forecast_ci.iloc[:, 0].clip(lower=0).tolist()
            confidence_upper = forecast_ci.iloc[:, 1].tolist()
            
            # Calculate accuracy metrics
            fitted_values = fitted_model.fittedvalues
            mae = mean_absolute_error(demand_series[1:], fitted_values[1:])
            mape = mean_absolute_percentage_error(demand_series[1:], fitted_values[1:])
            
            return {
                'forecasts': forecasts,
                'confidence_lower': confidence_lower,
                'confidence_upper': confidence_upper,
                'model_accuracy': {
                    'mae': mae,
                    'mape': mape,
                    'aic': fitted_model.aic,
                    'method': 'fitted_residuals'
                },
                'model_type': 'exponential_smoothing',
                'model_params': {
                    'seasonal_periods': seasonal_periods,
                    'trend': 'add',
                    'seasonal': 'add' if seasonal_periods else None,
                    'alpha': fitted_model.params.get('smoothing_level'),
                    'beta': fitted_model.params.get('smoothing_trend'),
                    'gamma': fitted_model.params.get('smoothing_seasonal')
                }
            }
            
        except Exception as e:
            # Fall back to moving average if Holt-Winters fails
            return self._moving_average_forecast(data, horizon, seasonal, external_factors)
    
    def _arima_forecast(self, data: pd.DataFrame, horizon: int,
                       seasonal: bool = True, external_factors: Optional[Dict] = None) -> Dict:
        """ARIMA time series forecast."""
        demand_series = data['demand']
        
        if len(demand_series) < 30:
            # Fall back to exponential smoothing for small datasets
            return self._exponential_smoothing_forecast(data, horizon, seasonal, external_factors)
        
        try:
            # Auto-select ARIMA parameters using AIC
            best_aic = float('inf')
            best_order = (1, 1, 1)
            
            for p in range(0, 3):
                for d in range(0, 2):
                    for q in range(0, 3):
                        try:
                            temp_model = ARIMA(demand_series, order=(p, d, q))
                            temp_fit = temp_model.fit()
                            if temp_fit.aic < best_aic:
                                best_aic = temp_fit.aic
                                best_order = (p, d, q)
                        except:
                            continue
            
            # Fit best ARIMA model
            model = ARIMA(demand_series, order=best_order)
            fitted_model = model.fit()
            
            # Generate forecast
            forecast_result = fitted_model.forecast(steps=horizon)
            forecasts = forecast_result.tolist()
            
            # Calculate confidence intervals
            forecast_ci = fitted_model.get_forecast(steps=horizon).conf_int()
            confidence_lower = forecast_ci.iloc[:, 0].clip(lower=0).tolist()
            confidence_upper = forecast_ci.iloc[:, 1].tolist()
            
            # Calculate accuracy metrics
            fitted_values = fitted_model.fittedvalues
            mae = mean_absolute_error(demand_series[best_order[1]:], fitted_values[best_order[1]:])
            mape = mean_absolute_percentage_error(demand_series[best_order[1]:], fitted_values[best_order[1]:])
            
            return {
                'forecasts': forecasts,
                'confidence_lower': confidence_lower,
                'confidence_upper': confidence_upper,
                'model_accuracy': {
                    'mae': mae,
                    'mape': mape,
                    'aic': fitted_model.aic,
                    'bic': fitted_model.bic,
                    'method': 'fitted_residuals'
                },
                'model_type': 'arima',
                'model_params': {
                    'order': best_order,
                    'aic': fitted_model.aic
                }
            }
            
        except Exception as e:
            # Fall back to exponential smoothing if ARIMA fails
            return self._exponential_smoothing_forecast(data, horizon, seasonal, external_factors)
    
    def _linear_regression_forecast(self, data: pd.DataFrame, horizon: int,
                                   seasonal: bool = True, external_factors: Optional[Dict] = None) -> Dict:
        """Linear regression forecast with multiple variables."""
        
        # Prepare features
        features = self._prepare_regression_features(data, seasonal)
        target = data['demand'].values
        
        # Handle missing values
        features = features.fillna(method='ffill').fillna(method='bfill').fillna(0)
        
        if len(features) < 10:
            # Fall back to moving average for very small datasets
            return self._moving_average_forecast(data, horizon, seasonal, external_factors)
        
        # Split data for validation
        test_size = min(0.2, 14 / len(features))  # At least 14 days or 20% for testing
        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=test_size, shuffle=False
        )
        
        # Fit models
        models = {
            'linear': LinearRegression(),
            'ridge': Ridge(alpha=1.0)
        }
        
        best_model = None
        best_score = float('inf')
        best_name = 'linear'
        
        for name, model in models.items():
            try:
                model.fit(X_train, y_train)
                predictions = model.predict(X_test)
                mae = mean_absolute_error(y_test, predictions)
                
                if mae < best_score:
                    best_score = mae
                    best_model = model
                    best_name = name
            except:
                continue
        
        if best_model is None:
            # Fall back to moving average if regression fails
            return self._moving_average_forecast(data, horizon, seasonal, external_factors)
        
        # Generate forecast features for future dates
        future_features = self._generate_future_features(data, horizon, seasonal, external_factors)
        
        # Make predictions
        forecasts = best_model.predict(future_features).clip(min=0).tolist()
        
        # Calculate confidence intervals based on model residuals
        train_predictions = best_model.predict(X_train)
        residuals_std = np.std(y_train - train_predictions)
        
        confidence_lower = [max(0, f - 1.96 * residuals_std) for f in forecasts]
        confidence_upper = [f + 1.96 * residuals_std for f in forecasts]
        
        # Calculate accuracy metrics
        test_predictions = best_model.predict(X_test)
        mae = mean_absolute_error(y_test, test_predictions)
        mape = mean_absolute_percentage_error(y_test, test_predictions)
        
        return {
            'forecasts': forecasts,
            'confidence_lower': confidence_lower,
            'confidence_upper': confidence_upper,
            'model_accuracy': {
                'mae': mae,
                'mape': mape,
                'r2_score': best_model.score(X_test, y_test) if hasattr(best_model, 'score') else 0,
                'method': 'train_test_split'
            },
            'model_type': f'linear_regression_{best_name}',
            'model_params': {
                'features': list(features.columns),
                'n_features': len(features.columns),
                'model_type': best_name
            }
        }
    
    def _ml_ensemble_forecast(self, data: pd.DataFrame, horizon: int,
                             seasonal: bool = True, external_factors: Optional[Dict] = None) -> Dict:
        """Machine learning ensemble forecast."""
        
        # Prepare features
        features = self._prepare_regression_features(data, seasonal)
        target = data['demand'].values
        
        # Handle missing values
        features = features.fillna(method='ffill').fillna(method='bfill').fillna(0)
        
        if len(features) < 20:
            # Fall back to linear regression for small datasets
            return self._linear_regression_forecast(data, horizon, seasonal, external_factors)
        
        # Split data
        test_size = min(0.2, 21 / len(features))
        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=test_size, shuffle=False
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Initialize ensemble models
        models = {
            'rf': RandomForestRegressor(n_estimators=50, random_state=42, max_depth=10),
            'gb': GradientBoostingRegressor(n_estimators=50, random_state=42, max_depth=6),
            'linear': Ridge(alpha=1.0)
        }
        
        # Fit and evaluate models
        model_predictions = {}
        model_scores = {}
        
        for name, model in models.items():
            try:
                if name == 'linear':
                    model.fit(X_train_scaled, y_train)
                    pred = model.predict(X_test_scaled)
                else:
                    model.fit(X_train, y_train)
                    pred = model.predict(X_test)
                    
                model_predictions[name] = pred
                model_scores[name] = mean_absolute_error(y_test, pred)
            except:
                continue
        
        if not model_predictions:
            # Fall back to linear regression if ensemble fails
            return self._linear_regression_forecast(data, horizon, seasonal, external_factors)
        
        # Calculate ensemble weights (inverse of MAE)
        total_inverse_score = sum(1 / score for score in model_scores.values())
        model_weights = {name: (1 / score) / total_inverse_score for name, score in model_scores.items()}
        
        # Generate future features
        future_features = self._generate_future_features(data, horizon, seasonal, external_factors)
        future_features_scaled = self.scaler.transform(future_features)
        
        # Make ensemble predictions
        forecasts = np.zeros(horizon)
        
        for name, model in models.items():
            if name in model_predictions:
                weight = model_weights[name]
                if name == 'linear':
                    pred = model.predict(future_features_scaled)
                else:
                    pred = model.predict(future_features)
                forecasts += weight * pred
        
        forecasts = forecasts.clip(min=0).tolist()
        
        # Calculate ensemble performance
        ensemble_pred = np.zeros(len(y_test))
        for name, pred in model_predictions.items():
            ensemble_pred += model_weights[name] * pred
            
        mae = mean_absolute_error(y_test, ensemble_pred)
        mape = mean_absolute_percentage_error(y_test, ensemble_pred)
        
        # Calculate confidence intervals
        prediction_std = np.std([pred for pred in model_predictions.values()], axis=0).mean()
        confidence_lower = [max(0, f - 1.96 * prediction_std) for f in forecasts]
        confidence_upper = [f + 1.96 * prediction_std for f in forecasts]
        
        return {
            'forecasts': forecasts,
            'confidence_lower': confidence_lower,
            'confidence_upper': confidence_upper,
            'model_accuracy': {
                'mae': mae,
                'mape': mape,
                'method': 'ensemble_validation'
            },
            'model_type': 'ml_ensemble',
            'model_params': {
                'models': list(models.keys()),
                'weights': model_weights,
                'features': list(features.columns),
                'n_features': len(features.columns)
            }
        }
    
    def _prepare_regression_features(self, data: pd.DataFrame, seasonal: bool = True) -> pd.DataFrame:
        """Prepare features for regression-based forecasting."""
        features = pd.DataFrame(index=data.index)
        
        # Time-based features
        features['trend'] = np.arange(len(data))
        features['day_of_week'] = data['day_of_week']
        features['month'] = data['month']
        features['quarter'] = data['quarter']
        
        # Lagged features
        for lag in [1, 3, 7, 14]:
            if len(data) > lag:
                features[f'demand_lag_{lag}'] = data['demand'].shift(lag)
        
        # Rolling statistics
        for window in [3, 7, 14]:
            if len(data) > window:
                features[f'demand_mean_{window}'] = data['demand'].rolling(window=window).mean()
                features[f'demand_std_{window}'] = data['demand'].rolling(window=window).std()
        
        # Seasonal features if enabled
        if seasonal:
            # Day of week dummies
            dow_dummies = pd.get_dummies(data['day_of_week'], prefix='dow')
            features = pd.concat([features, dow_dummies], axis=1)
            
            # Month dummies
            month_dummies = pd.get_dummies(data['month'], prefix='month')
            features = pd.concat([features, month_dummies], axis=1)
        
        # Price-based features if available
        if 'unit_price' in data.columns:
            features['unit_price'] = data['unit_price']
            features['price_change'] = data['unit_price'].pct_change()
        
        return features
    
    def _generate_future_features(self, data: pd.DataFrame, horizon: int, 
                                 seasonal: bool = True, external_factors: Optional[Dict] = None) -> pd.DataFrame:
        """Generate features for future forecast periods."""
        future_dates = pd.date_range(
            start=data.index[-1] + timedelta(days=1),
            periods=horizon,
            freq='D'
        )
        
        future_features = pd.DataFrame(index=future_dates)
        
        # Time-based features
        future_features['trend'] = np.arange(len(data), len(data) + horizon)
        future_features['day_of_week'] = future_dates.dayofweek
        future_features['month'] = future_dates.month
        future_features['quarter'] = future_dates.quarter
        
        # Use last known values for lagged features
        last_values = data['demand'].iloc[-14:].values if len(data) >= 14 else data['demand'].values
        
        for lag in [1, 3, 7, 14]:
            if len(last_values) >= lag:
                future_features[f'demand_lag_{lag}'] = last_values[-lag]
            else:
                future_features[f'demand_lag_{lag}'] = data['demand'].mean()
        
        # Use recent rolling statistics
        for window in [3, 7, 14]:
            if len(data) > window:
                recent_mean = data['demand'].iloc[-window:].mean()
                recent_std = data['demand'].iloc[-window:].std()
                future_features[f'demand_mean_{window}'] = recent_mean
                future_features[f'demand_std_{window}'] = recent_std
        
        # Seasonal features
        if seasonal:
            # Day of week dummies
            for dow in range(7):
                future_features[f'dow_{dow}'] = (future_features['day_of_week'] == dow).astype(int)
                
            # Month dummies
            for month in range(1, 13):
                future_features[f'month_{month}'] = (future_features['month'] == month).astype(int)
        
        # Price features (use last known values or external factors)
        if 'unit_price' in data.columns:
            last_price = data['unit_price'].iloc[-1]
            future_features['unit_price'] = last_price
            future_features['price_change'] = 0  # Assume no price change
        
        # Fill any missing columns to match training features
        for col in ['demand_lag_1', 'demand_lag_3', 'demand_lag_7', 'demand_lag_14']:
            if col not in future_features.columns:
                future_features[col] = data['demand'].mean()
        
        return future_features