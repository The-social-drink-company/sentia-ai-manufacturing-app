"""
Seasonal Pattern Recognition Service

Implements advanced seasonal pattern detection and adjustment algorithms:
- Automatic detection of seasonal cycles
- Holiday and event impact modeling  
- Regional seasonality differences (UK vs EU vs USA)
- Product-specific seasonal patterns
- Year-over-year growth trend analysis
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Tuple
import holidays
from scipy import stats
from statsmodels.tsa.seasonal import seasonal_decompose
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from app import db
from app.models.historical_sales import HistoricalSales
from app.models.product import Product
from app.models.market import Market


class SeasonalService:
    """
    Advanced seasonal pattern recognition and adjustment service.
    Handles multiple types of seasonality and external factors.
    """
    
    def __init__(self):
        self.regional_holidays = {
            'UK': holidays.UnitedKingdom(),
            'EU': holidays.Germany(),  # Using Germany as EU baseline
            'USA': holidays.UnitedStates()
        }
        
        # Seasonal pattern templates for supplement industry
        self.industry_patterns = {
            'new_year_detox': {
                'peak_months': [1, 2],
                'factor': 1.4,
                'description': 'New Year health resolutions'
            },
            'summer_prep': {
                'peak_months': [3, 4, 5],
                'factor': 1.2,
                'description': 'Summer body preparation'
            },
            'holiday_slump': {
                'peak_months': [11, 12],
                'factor': 0.8,
                'description': 'Holiday eating indulgence'
            },
            'back_to_school': {
                'peak_months': [9, 10],
                'factor': 1.1,
                'description': 'Back to routine health focus'
            }
        }
    
    def detect_seasonal_patterns(self, product_id: str, sales_channel_id: str, 
                                market_code: str = 'UK') -> Dict:
        """
        Detect and analyze seasonal patterns for a specific product/channel/market.
        
        Args:
            product_id: Product identifier
            sales_channel_id: Sales channel identifier  
            market_code: Market code (UK, EU, USA)
            
        Returns:
            Dict containing detected seasonal patterns and factors
        """
        # Get historical data
        historical_data = self._get_seasonal_data(product_id, sales_channel_id, market_code)
        
        if historical_data.empty or len(historical_data) < 60:
            return self._default_seasonal_pattern(market_code)
        
        # Detect various seasonal components
        patterns = {}
        
        # 1. Weekly seasonality (day-of-week effects)
        patterns['weekly'] = self._detect_weekly_seasonality(historical_data)
        
        # 2. Monthly seasonality
        patterns['monthly'] = self._detect_monthly_seasonality(historical_data)
        
        # 3. Holiday effects
        patterns['holidays'] = self._detect_holiday_effects(historical_data, market_code)
        
        # 4. Year-over-year trends
        patterns['yearly_trend'] = self._detect_yearly_trends(historical_data)
        
        # 5. Special events and promotions
        patterns['special_events'] = self._detect_special_events(historical_data)
        
        # 6. Product-specific patterns
        patterns['product_specific'] = self._detect_product_patterns(
            product_id, historical_data
        )
        
        # 7. Market-specific patterns
        patterns['market_specific'] = self._detect_market_patterns(
            market_code, historical_data
        )
        
        # Combine and validate patterns
        combined_patterns = self._combine_seasonal_patterns(patterns)
        
        return {
            'seasonal_patterns': combined_patterns,
            'detection_summary': self._summarize_patterns(patterns),
            'data_period': {
                'start_date': historical_data.index.min().isoformat(),
                'end_date': historical_data.index.max().isoformat(),
                'total_days': len(historical_data)
            },
            'confidence_score': self._calculate_pattern_confidence(historical_data, patterns)
        }
    
    def apply_seasonal_adjustment(self, base_forecast: List[float], 
                                 start_date: date, seasonal_patterns: Dict) -> Dict:
        """
        Apply seasonal adjustments to base forecast values.
        
        Args:
            base_forecast: Base forecast values
            start_date: Start date for forecast period
            seasonal_patterns: Detected seasonal patterns
            
        Returns:
            Dict with adjusted forecasts and factor breakdowns
        """
        adjusted_forecast = []
        factor_breakdown = []
        
        for i, base_value in enumerate(base_forecast):
            forecast_date = start_date + timedelta(days=i)
            
            # Calculate combined seasonal factor
            factors = self._calculate_date_factors(forecast_date, seasonal_patterns)
            combined_factor = self._combine_factors(factors)
            
            # Apply adjustment
            adjusted_value = base_value * combined_factor
            
            adjusted_forecast.append(adjusted_value)
            factor_breakdown.append({
                'date': forecast_date.isoformat(),
                'base_value': base_value,
                'adjusted_value': adjusted_value,
                'combined_factor': combined_factor,
                'factor_components': factors
            })
        
        return {
            'adjusted_forecast': adjusted_forecast,
            'factor_breakdown': factor_breakdown,
            'average_adjustment': np.mean([f['combined_factor'] for f in factor_breakdown])
        }
    
    def _get_seasonal_data(self, product_id: str, sales_channel_id: str, 
                          market_code: str) -> pd.DataFrame:
        """Get historical sales data with seasonal enrichment."""
        # Get base sales data (same as forecasting service)
        sales_data = db.session.query(HistoricalSales).filter(
            HistoricalSales.product_id == product_id,
            HistoricalSales.sales_channel_id == sales_channel_id
        ).order_by(HistoricalSales.sale_date).all()
        
        if not sales_data:
            return pd.DataFrame()
        
        # Convert to DataFrame with seasonal enrichment
        data = []
        for sale in sales_data:
            sale_date = sale.sale_date
            data.append({
                'date': sale_date,
                'demand': sale.quantity_sold,
                'revenue': float(sale.revenue_amount) if sale.revenue_amount else 0,
                'day_of_week': sale_date.weekday(),
                'week_of_year': sale_date.isocalendar()[1],
                'month': sale_date.month,
                'quarter': (sale_date.month - 1) // 3 + 1,
                'year': sale_date.year,
                'is_weekend': sale_date.weekday() >= 5,
                'is_holiday': self._is_holiday(sale_date, market_code),
                'days_from_holiday': self._days_from_nearest_holiday(sale_date, market_code),
                'season': self._get_meteorological_season(sale_date)
            })
        
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date').sort_index()
        
        return df
    
    def _detect_weekly_seasonality(self, data: pd.DataFrame) -> Dict:
        """Detect day-of-week seasonal patterns."""
        if len(data) < 14:
            return {'factors': {}, 'strength': 0, 'pattern': 'insufficient_data'}
        
        # Calculate mean demand by day of week
        dow_means = data.groupby('day_of_week')['demand'].agg(['mean', 'std', 'count'])
        overall_mean = data['demand'].mean()
        
        # Calculate seasonal factors (relative to overall mean)
        factors = {}
        for dow in range(7):
            if dow in dow_means.index and dow_means.loc[dow, 'count'] >= 2:
                factors[dow] = dow_means.loc[dow, 'mean'] / overall_mean
            else:
                factors[dow] = 1.0
        
        # Calculate pattern strength
        factor_values = list(factors.values())
        strength = np.std(factor_values) / np.mean(factor_values) if np.mean(factor_values) > 0 else 0
        
        # Identify pattern type
        weekday_avg = np.mean([factors[i] for i in range(5)])  # Mon-Fri
        weekend_avg = np.mean([factors[i] for i in range(5, 7)])  # Sat-Sun
        
        if weekend_avg > weekday_avg * 1.1:
            pattern_type = 'weekend_peak'
        elif weekday_avg > weekend_avg * 1.1:
            pattern_type = 'weekday_peak'
        else:
            pattern_type = 'balanced'
        
        return {
            'factors': factors,
            'strength': strength,
            'pattern': pattern_type,
            'weekday_avg': weekday_avg,
            'weekend_avg': weekend_avg,
            'confidence': min(1.0, len(data) / 60)  # Higher confidence with more data
        }
    
    def _detect_monthly_seasonality(self, data: pd.DataFrame) -> Dict:
        """Detect monthly seasonal patterns."""
        if len(data) < 60:  # Need at least 2 months
            return {'factors': {}, 'strength': 0, 'pattern': 'insufficient_data'}
        
        # Calculate mean demand by month
        monthly_means = data.groupby('month')['demand'].agg(['mean', 'std', 'count'])
        overall_mean = data['demand'].mean()
        
        # Calculate seasonal factors
        factors = {}
        for month in range(1, 13):
            if month in monthly_means.index and monthly_means.loc[month, 'count'] >= 5:
                factors[month] = monthly_means.loc[month, 'mean'] / overall_mean
            else:
                factors[month] = 1.0
        
        # Calculate pattern strength
        factor_values = list(factors.values())
        strength = np.std(factor_values) / np.mean(factor_values) if np.mean(factor_values) > 0 else 0
        
        # Identify peak and trough months
        peak_month = max(factors.keys(), key=lambda k: factors[k])
        trough_month = min(factors.keys(), key=lambda k: factors[k])
        
        # Match against industry patterns
        matched_pattern = self._match_industry_pattern(factors)
        
        return {
            'factors': factors,
            'strength': strength,
            'peak_month': peak_month,
            'trough_month': trough_month,
            'peak_factor': factors[peak_month],
            'trough_factor': factors[trough_month],
            'industry_pattern': matched_pattern,
            'confidence': min(1.0, len(data) / 365)  # Higher confidence with more data
        }
    
    def _detect_holiday_effects(self, data: pd.DataFrame, market_code: str) -> Dict:
        """Detect holiday impact patterns."""
        if market_code not in self.regional_holidays:
            return {'effects': {}, 'strength': 0}
        
        holiday_calendar = self.regional_holidays[market_code]
        effects = {}
        
        # Analyze demand around holidays
        for holiday_date, holiday_name in holiday_calendar.items():
            if holiday_date.year < data.index.min().year or holiday_date.year > data.index.max().year:
                continue
            
            # Get demand in window around holiday
            holiday_data = self._get_holiday_window_data(data, holiday_date)
            
            if len(holiday_data) >= 7:  # Need at least a week of data
                # Calculate pre/post holiday effects
                pre_holiday = holiday_data.iloc[:3]['demand'].mean() if len(holiday_data) >= 6 else 0
                post_holiday = holiday_data.iloc[-3:]['demand'].mean() if len(holiday_data) >= 6 else 0
                overall_mean = data['demand'].mean()
                
                effects[holiday_name] = {
                    'pre_holiday_factor': pre_holiday / overall_mean if overall_mean > 0 else 1.0,
                    'post_holiday_factor': post_holiday / overall_mean if overall_mean > 0 else 1.0,
                    'holiday_date': holiday_date.isoformat()
                }
        
        # Calculate overall holiday impact strength
        if effects:
            all_factors = []
            for effect in effects.values():
                all_factors.extend([effect['pre_holiday_factor'], effect['post_holiday_factor']])
            strength = np.std(all_factors) if len(all_factors) > 1 else 0
        else:
            strength = 0
        
        return {
            'effects': effects,
            'strength': strength,
            'market': market_code
        }
    
    def _detect_yearly_trends(self, data: pd.DataFrame) -> Dict:
        """Detect year-over-year growth trends."""
        if data.index.max().year - data.index.min().year < 1:
            return {'trend': 0, 'pattern': 'insufficient_data'}
        
        # Group by year and calculate annual metrics
        annual_data = data.groupby(data.index.year)['demand'].agg(['sum', 'mean', 'count'])
        
        if len(annual_data) < 2:
            return {'trend': 0, 'pattern': 'insufficient_data'}
        
        # Calculate year-over-year growth
        years = annual_data.index.tolist()
        annual_totals = annual_data['sum'].tolist()
        
        # Linear trend
        slope, intercept, r_value, p_value, std_err = stats.linregress(years, annual_totals)
        
        # Year-over-year percentage growth
        yoy_growth_rates = []
        for i in range(1, len(annual_totals)):
            if annual_totals[i-1] > 0:
                growth_rate = (annual_totals[i] - annual_totals[i-1]) / annual_totals[i-1]
                yoy_growth_rates.append(growth_rate)
        
        avg_growth_rate = np.mean(yoy_growth_rates) if yoy_growth_rates else 0
        
        # Classify trend pattern
        if avg_growth_rate > 0.1:
            pattern = 'strong_growth'
        elif avg_growth_rate > 0.05:
            pattern = 'moderate_growth'
        elif avg_growth_rate > -0.05:
            pattern = 'stable'
        elif avg_growth_rate > -0.1:
            pattern = 'moderate_decline'
        else:
            pattern = 'strong_decline'
        
        return {
            'trend': avg_growth_rate,
            'annual_growth_rates': yoy_growth_rates,
            'pattern': pattern,
            'r_squared': r_value**2,
            'p_value': p_value,
            'years_analyzed': len(annual_data)
        }
    
    def _detect_special_events(self, data: pd.DataFrame) -> Dict:
        """Detect unusual spikes or dips that might indicate special events."""
        if len(data) < 30:
            return {'events': [], 'strength': 0}
        
        # Calculate rolling statistics
        data['rolling_mean'] = data['demand'].rolling(window=7, center=True).mean()
        data['rolling_std'] = data['demand'].rolling(window=7, center=True).std()
        
        # Identify outliers (demand > 2 standard deviations from rolling mean)
        outlier_threshold = 2
        outliers = data[
            (data['demand'] > data['rolling_mean'] + outlier_threshold * data['rolling_std']) |
            (data['demand'] < data['rolling_mean'] - outlier_threshold * data['rolling_std'])
        ]
        
        events = []
        for idx, row in outliers.iterrows():
            if pd.notna(row['rolling_mean']) and pd.notna(row['rolling_std']) and row['rolling_std'] > 0:
                z_score = (row['demand'] - row['rolling_mean']) / row['rolling_std']
                event_type = 'spike' if z_score > 0 else 'dip'
                
                events.append({
                    'date': idx.isoformat(),
                    'type': event_type,
                    'magnitude': abs(z_score),
                    'demand': row['demand'],
                    'expected_demand': row['rolling_mean']
                })
        
        # Calculate event frequency as strength indicator
        strength = len(events) / len(data) * 100  # Events per 100 days
        
        return {
            'events': events,
            'strength': strength,
            'total_events': len(events)
        }
    
    def _detect_product_patterns(self, product_id: str, data: pd.DataFrame) -> Dict:
        """Detect product-specific seasonal patterns."""
        # This would integrate with product information
        # For now, implement basic supplement industry patterns
        
        # Assume we can get product type/category from product_id
        # This is a placeholder - in real implementation, query product table
        product_category = 'supplement'  # Would come from product data
        
        if product_category == 'supplement':
            return {
                'category': 'supplement',
                'expected_patterns': self.industry_patterns,
                'recommendations': [
                    'Consider New Year health resolution boost in Jan-Feb',
                    'Expect summer preparation increase in Mar-May', 
                    'Plan for holiday season reduction in Nov-Dec'
                ]
            }
        
        return {'category': 'unknown', 'expected_patterns': {}}
    
    def _detect_market_patterns(self, market_code: str, data: pd.DataFrame) -> Dict:
        """Detect market-specific seasonal patterns."""
        market_patterns = {
            'UK': {
                'climate_seasons': ['wet_winter', 'mild_summer'],
                'cultural_events': ['new_year', 'summer_holidays', 'christmas'],
                'shopping_patterns': 'steady_throughout_year'
            },
            'EU': {
                'climate_seasons': ['cold_winter', 'warm_summer'],
                'cultural_events': ['new_year', 'summer_holidays', 'christmas'],
                'shopping_patterns': 'summer_vacation_dip'
            },
            'USA': {
                'climate_seasons': ['variable_by_region'],
                'cultural_events': ['new_year', 'spring_break', 'summer', 'thanksgiving', 'christmas'],
                'shopping_patterns': 'strong_holiday_seasonality'
            }
        }
        
        return market_patterns.get(market_code, {
            'climate_seasons': ['unknown'],
            'cultural_events': ['new_year', 'christmas'],
            'shopping_patterns': 'unknown'
        })
    
    def _combine_seasonal_patterns(self, patterns: Dict) -> Dict:
        """Combine different seasonal patterns into unified factors."""
        combined = {
            'weekly_factors': patterns.get('weekly', {}).get('factors', {}),
            'monthly_factors': patterns.get('monthly', {}).get('factors', {}),
            'holiday_effects': patterns.get('holidays', {}).get('effects', {}),
            'yearly_trend': patterns.get('yearly_trend', {}).get('trend', 0),
            'special_events': patterns.get('special_events', {}).get('events', []),
            'overall_strength': self._calculate_overall_strength(patterns)
        }
        
        return combined
    
    def _calculate_overall_strength(self, patterns: Dict) -> float:
        """Calculate overall seasonal pattern strength."""
        strengths = []
        
        for pattern_type, pattern_data in patterns.items():
            if isinstance(pattern_data, dict) and 'strength' in pattern_data:
                strengths.append(pattern_data['strength'])
        
        return np.mean(strengths) if strengths else 0
    
    def _default_seasonal_pattern(self, market_code: str) -> Dict:
        """Return default seasonal patterns for insufficient data cases."""
        return {
            'seasonal_patterns': {
                'weekly_factors': {i: 1.0 for i in range(7)},
                'monthly_factors': {i: 1.0 for i in range(1, 13)},
                'holiday_effects': {},
                'yearly_trend': 0.05,  # Assume modest growth
                'overall_strength': 0.1
            },
            'detection_summary': {
                'status': 'insufficient_data',
                'recommendation': 'using_default_patterns'
            },
            'confidence_score': 0.1
        }
    
    def _calculate_pattern_confidence(self, data: pd.DataFrame, patterns: Dict) -> float:
        """Calculate confidence score for detected patterns."""
        factors = []
        
        # Data quantity factor
        data_factor = min(1.0, len(data) / 365)  # Full year gives max score
        factors.append(data_factor)
        
        # Pattern consistency factor
        consistency_scores = []
        for pattern_name, pattern_data in patterns.items():
            if isinstance(pattern_data, dict) and 'confidence' in pattern_data:
                consistency_scores.append(pattern_data['confidence'])
        
        if consistency_scores:
            factors.append(np.mean(consistency_scores))
        
        return np.mean(factors) if factors else 0.1
    
    def _is_holiday(self, check_date: date, market_code: str) -> bool:
        """Check if date is a holiday in the specified market."""
        if market_code in self.regional_holidays:
            return check_date in self.regional_holidays[market_code]
        return False
    
    def _days_from_nearest_holiday(self, check_date: date, market_code: str) -> int:
        """Calculate days from nearest holiday."""
        if market_code not in self.regional_holidays:
            return 365  # Far from any holiday
        
        holiday_calendar = self.regional_holidays[market_code]
        min_distance = 365
        
        # Check holidays in current year and adjacent years
        for year in [check_date.year - 1, check_date.year, check_date.year + 1]:
            year_holidays = [d for d in holiday_calendar if d.year == year]
            for holiday_date in year_holidays:
                distance = abs((check_date - holiday_date).days)
                min_distance = min(min_distance, distance)
        
        return min_distance
    
    def _get_meteorological_season(self, check_date: date) -> str:
        """Get meteorological season for date."""
        month = check_date.month
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        else:
            return 'autumn'
    
    def _get_holiday_window_data(self, data: pd.DataFrame, holiday_date: date, window_days: int = 7) -> pd.DataFrame:
        """Get data in window around holiday date."""
        start_date = pd.Timestamp(holiday_date - timedelta(days=window_days))
        end_date = pd.Timestamp(holiday_date + timedelta(days=window_days))
        
        return data[(data.index >= start_date) & (data.index <= end_date)]
    
    def _match_industry_pattern(self, monthly_factors: Dict) -> Optional[str]:
        """Match detected monthly pattern to known industry patterns."""
        for pattern_name, pattern_info in self.industry_patterns.items():
            peak_months = pattern_info['peak_months']
            
            # Check if detected peaks align with industry pattern
            peak_factor_avg = np.mean([monthly_factors.get(month, 1.0) for month in peak_months])
            non_peak_months = [m for m in range(1, 13) if m not in peak_months]
            non_peak_factor_avg = np.mean([monthly_factors.get(month, 1.0) for month in non_peak_months])
            
            # If peak months are significantly higher, match the pattern
            if peak_factor_avg > non_peak_factor_avg * 1.15:
                return pattern_name
        
        return None
    
    def _calculate_date_factors(self, forecast_date: date, seasonal_patterns: Dict) -> Dict:
        """Calculate all seasonal factors for a specific date."""
        factors = {}
        
        # Weekly factor
        dow = forecast_date.weekday()
        factors['weekly'] = seasonal_patterns.get('weekly_factors', {}).get(dow, 1.0)
        
        # Monthly factor
        month = forecast_date.month
        factors['monthly'] = seasonal_patterns.get('monthly_factors', {}).get(month, 1.0)
        
        # Holiday factor (simplified - would need more sophisticated logic)
        factors['holiday'] = 1.0  # Placeholder
        
        # Yearly trend factor
        yearly_trend = seasonal_patterns.get('yearly_trend', 0)
        factors['yearly_trend'] = 1.0 + yearly_trend
        
        return factors
    
    def _combine_factors(self, factors: Dict) -> float:
        """Combine multiple seasonal factors into single adjustment factor."""
        # Use weighted geometric mean to combine factors
        weights = {
            'weekly': 0.3,
            'monthly': 0.4, 
            'holiday': 0.2,
            'yearly_trend': 0.1
        }
        
        combined = 1.0
        for factor_type, weight in weights.items():
            factor_value = factors.get(factor_type, 1.0)
            combined *= factor_value ** weight
        
        # Bound the result to reasonable range
        return max(0.1, min(3.0, combined))
    
    def _summarize_patterns(self, patterns: Dict) -> Dict:
        """Create summary of detected patterns for reporting."""
        summary = {
            'detected_patterns': list(patterns.keys()),
            'strongest_pattern': None,
            'weakest_pattern': None,
            'recommendations': []
        }
        
        # Find strongest and weakest patterns
        strengths = {}
        for name, data in patterns.items():
            if isinstance(data, dict) and 'strength' in data:
                strengths[name] = data['strength']
        
        if strengths:
            summary['strongest_pattern'] = max(strengths.keys(), key=lambda k: strengths[k])
            summary['weakest_pattern'] = min(strengths.keys(), key=lambda k: strengths[k])
        
        # Generate recommendations
        if 'monthly' in patterns and patterns['monthly'].get('strength', 0) > 0.2:
            summary['recommendations'].append('Strong monthly seasonality detected - adjust inventory accordingly')
        
        if 'weekly' in patterns and patterns['weekly'].get('strength', 0) > 0.15:
            summary['recommendations'].append('Weekly patterns detected - consider day-specific promotions')
        
        return summary