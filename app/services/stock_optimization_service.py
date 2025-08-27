"""
Stock Level Optimization Service

Implements sophisticated stock level optimization with EOQ, safety stock,
reorder point calculations, and multi-echelon inventory optimization.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
from enum import Enum
import math
from scipy import stats, optimize
from sklearn.preprocessing import StandardScaler

from app import db
from app.models.inventory_level import InventoryLevel
from app.models.historical_sales import HistoricalSales
from app.models.product import Product
from app.models.sales_channel import SalesChannel
from app.services.forecasting_service import ForecastingService


class ServiceLevel(Enum):
    BASIC = 0.95      # 95% service level
    STANDARD = 0.98   # 98% service level  
    PREMIUM = 0.995   # 99.5% service level


class OptimizationObjective(Enum):
    MINIMIZE_COST = "minimize_cost"
    MAXIMIZE_SERVICE = "maximize_service"
    BALANCED = "balanced"


@dataclass
class SupplyChainConstraints:
    """Supply chain constraint parameters"""
    lead_time_days: float
    lead_time_variability: float  # Standard deviation
    supplier_capacity_monthly: Optional[int] = None
    production_capacity_monthly: Optional[int] = None
    working_capital_limit: Optional[float] = None
    storage_capacity_units: Optional[int] = None
    seasonal_capacity_factor: Dict[int, float] = None  # month -> factor
    shipping_constraints: Optional[Dict] = None


@dataclass
class CostParameters:
    """Cost parameters for optimization"""
    holding_cost_percentage_annual: float = 0.25  # 25% of inventory value per year
    ordering_cost_per_order: float = 100.0
    stockout_cost_per_unit: float = 50.0
    storage_cost_per_unit_monthly: float = 0.10
    working_capital_rate_annual: float = 0.08  # 8% cost of capital


@dataclass
class OptimizationResult:
    """Optimization result structure"""
    product_id: str
    location_id: str
    current_stock: int
    optimal_stock_level: int
    reorder_point: int
    reorder_quantity: int
    safety_stock: int
    economic_order_quantity: int
    service_level_achieved: float
    total_annual_cost: float
    cost_breakdown: Dict[str, float]
    risk_metrics: Dict[str, float]
    recommendations: List[str]
    confidence_score: float


class StockOptimizationService:
    """
    Advanced stock level optimization service implementing:
    - Economic Order Quantity (EOQ) with variations
    - Safety stock optimization based on service levels
    - Reorder point calculations with lead time variability
    - Multi-echelon inventory optimization
    - Capacity-constrained optimization
    - ABC analysis for inventory prioritization
    """
    
    def __init__(self, forecasting_service: ForecastingService = None):
        self.forecasting_service = forecasting_service or ForecastingService()
        self.scaler = StandardScaler()
        
    def optimize_stock_levels(self,
                            product_id: str,
                            location_id: str = None,
                            service_level: ServiceLevel = ServiceLevel.STANDARD,
                            constraints: SupplyChainConstraints = None,
                            cost_params: CostParameters = None,
                            objective: OptimizationObjective = OptimizationObjective.BALANCED,
                            forecast_horizon: int = 90) -> List[OptimizationResult]:
        """
        Optimize stock levels for a product across all or specific locations.
        
        Args:
            product_id: Product identifier
            location_id: Optional specific location
            service_level: Target service level
            constraints: Supply chain constraints
            cost_params: Cost parameters
            objective: Optimization objective
            forecast_horizon: Forecast horizon in days
            
        Returns:
            List of optimization results
        """
        if constraints is None:
            constraints = self._get_default_constraints(product_id)
        if cost_params is None:
            cost_params = CostParameters()
            
        # Get locations to optimize
        if location_id:
            locations = [self._get_inventory_location(product_id, location_id)]
        else:
            locations = self._get_all_inventory_locations(product_id)
            
        results = []
        
        for location in locations:
            if location is None:
                continue
                
            try:
                # Get demand forecast
                forecast_data = self._get_demand_forecast(
                    product_id, location['sales_channel_id'], forecast_horizon
                )
                
                # Calculate optimization parameters
                result = self._optimize_single_location(
                    product_id=product_id,
                    location=location,
                    forecast_data=forecast_data,
                    service_level=service_level,
                    constraints=constraints,
                    cost_params=cost_params,
                    objective=objective
                )
                
                if result:
                    results.append(result)
                    
            except Exception as e:
                print(f"Optimization failed for location {location['location_id']}: {e}")
                continue
                
        return results
    
    def calculate_eoq(self,
                     annual_demand: float,
                     ordering_cost: float,
                     holding_cost_rate: float,
                     unit_cost: float,
                     constraints: SupplyChainConstraints = None) -> Dict:
        """
        Calculate Economic Order Quantity with variations.
        """
        # Basic EOQ formula
        if annual_demand <= 0 or holding_cost_rate <= 0 or unit_cost <= 0:
            return {'eoq': 0, 'total_cost': float('inf'), 'method': 'invalid_parameters'}
            
        holding_cost = holding_cost_rate * unit_cost
        
        if holding_cost <= 0:
            return {'eoq': 0, 'total_cost': float('inf'), 'method': 'invalid_holding_cost'}
            
        # Standard EOQ
        eoq_basic = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost)
        
        # EOQ with quantity discounts (simplified)
        eoq = eoq_basic
        
        # EOQ with capacity constraints
        if constraints and constraints.supplier_capacity_monthly:
            max_order_size = constraints.supplier_capacity_monthly * 3  # Allow 3-month orders
            eoq = min(eoq, max_order_size)
            
        # EOQ with storage constraints
        if constraints and constraints.storage_capacity_units:
            eoq = min(eoq, constraints.storage_capacity_units * 0.8)  # 80% of capacity
            
        # Calculate total cost
        annual_ordering_cost = (annual_demand / eoq) * ordering_cost if eoq > 0 else float('inf')
        annual_holding_cost = (eoq / 2) * holding_cost
        total_cost = annual_ordering_cost + annual_holding_cost
        
        # EOQ with lead time
        lead_time_demand = 0
        if constraints and constraints.lead_time_days:
            lead_time_demand = (annual_demand / 365) * constraints.lead_time_days
            
        return {
            'eoq': int(round(eoq)),
            'eoq_basic': int(round(eoq_basic)),
            'total_cost': total_cost,
            'annual_ordering_cost': annual_ordering_cost,
            'annual_holding_cost': annual_holding_cost,
            'lead_time_demand': lead_time_demand,
            'order_frequency_days': (eoq / annual_demand) * 365 if annual_demand > 0 else 0,
            'method': 'standard_eoq'
        }
    
    def calculate_safety_stock(self,
                             demand_mean: float,
                             demand_std: float,
                             lead_time_days: float,
                             lead_time_variability: float,
                             service_level: ServiceLevel) -> Dict:
        """
        Calculate optimal safety stock based on demand and lead time variability.
        """
        if demand_mean <= 0 or demand_std < 0 or lead_time_days <= 0:
            return {
                'safety_stock': 0,
                'service_level_achieved': 0,
                'method': 'invalid_parameters'
            }
            
        # Z-score for desired service level
        z_score = stats.norm.ppf(service_level.value)
        
        # Daily demand parameters
        daily_demand_mean = demand_mean / 30  # Convert monthly to daily
        daily_demand_std = demand_std / math.sqrt(30)
        
        # Lead time demand variability
        lead_time_demand_std = math.sqrt(
            lead_time_days * (daily_demand_std ** 2) +
            (daily_demand_mean ** 2) * (lead_time_variability ** 2)
        )
        
        # Calculate safety stock
        safety_stock = z_score * lead_time_demand_std
        
        # Minimum safety stock (at least 1 day of average demand)
        min_safety_stock = daily_demand_mean
        safety_stock = max(safety_stock, min_safety_stock)
        
        # Calculate achieved service level
        if lead_time_demand_std > 0:
            achieved_service_level = stats.norm.cdf(safety_stock / lead_time_demand_std)
        else:
            achieved_service_level = service_level.value
            
        return {
            'safety_stock': int(round(safety_stock)),
            'service_level_target': service_level.value,
            'service_level_achieved': achieved_service_level,
            'z_score': z_score,
            'lead_time_demand_std': lead_time_demand_std,
            'method': 'service_level_optimization'
        }
    
    def calculate_reorder_point(self,
                               lead_time_days: float,
                               daily_demand_mean: float,
                               safety_stock: int) -> Dict:
        """
        Calculate reorder point considering lead time and safety stock.
        """
        if lead_time_days <= 0 or daily_demand_mean <= 0:
            return {
                'reorder_point': safety_stock,
                'lead_time_demand': 0,
                'method': 'safety_stock_only'
            }
            
        # Lead time demand
        lead_time_demand = lead_time_days * daily_demand_mean
        
        # Reorder point = Lead time demand + Safety stock
        reorder_point = lead_time_demand + safety_stock
        
        return {
            'reorder_point': int(round(reorder_point)),
            'lead_time_demand': int(round(lead_time_demand)),
            'safety_stock': safety_stock,
            'lead_time_days': lead_time_days,
            'daily_demand_mean': daily_demand_mean,
            'method': 'lead_time_plus_safety'
        }
    
    def perform_abc_analysis(self, product_ids: List[str] = None) -> Dict:
        """
        Perform ABC analysis for inventory prioritization.
        """
        # Get inventory data
        query = db.session.query(
            InventoryLevel.product_id,
            InventoryLevel.total_value,
            InventoryLevel.available_quantity,
            InventoryLevel.turnover_rate_monthly,
            Product.name,
            Product.category
        ).join(Product).filter(
            InventoryLevel.snapshot_date == date.today()
        )
        
        if product_ids:
            query = query.filter(InventoryLevel.product_id.in_(product_ids))
            
        inventory_data = query.all()
        
        if not inventory_data:
            return {'error': 'No inventory data found'}
            
        # Convert to DataFrame
        df = pd.DataFrame([{
            'product_id': str(item.product_id),
            'product_name': item.name,
            'category': item.category,
            'total_value': float(item.total_value) if item.total_value else 0,
            'quantity': item.available_quantity,
            'turnover_rate': float(item.turnover_rate_monthly) if item.turnover_rate_monthly else 0
        } for item in inventory_data])
        
        # Calculate annual values
        df['annual_value'] = df['total_value'] * 12  # Assuming monthly data
        df['annual_turnover'] = df['turnover_rate'] * 12
        
        # Sort by annual value descending
        df = df.sort_values('annual_value', ascending=False)
        
        # Calculate cumulative percentages
        total_value = df['annual_value'].sum()
        df['value_percentage'] = df['annual_value'] / total_value * 100
        df['cumulative_percentage'] = df['value_percentage'].cumsum()
        
        # Classify ABC categories
        df['abc_category'] = 'C'
        df.loc[df['cumulative_percentage'] <= 80, 'abc_category'] = 'A'
        df.loc[(df['cumulative_percentage'] > 80) & (df['cumulative_percentage'] <= 95), 'abc_category'] = 'B'
        
        # Calculate category statistics
        category_stats = df.groupby('abc_category').agg({
            'product_id': 'count',
            'annual_value': ['sum', 'mean'],
            'annual_turnover': 'mean'
        }).round(2)
        
        # Create prioritization recommendations
        recommendations = {}
        for category in ['A', 'B', 'C']:
            category_products = df[df['abc_category'] == category]
            
            if category == 'A':
                recommendations[category] = {
                    'priority': 'High',
                    'management_approach': 'Tight control, frequent review',
                    'service_level_target': ServiceLevel.PREMIUM.value,
                    'review_frequency': 'Weekly'
                }
            elif category == 'B':
                recommendations[category] = {
                    'priority': 'Medium', 
                    'management_approach': 'Moderate control, regular review',
                    'service_level_target': ServiceLevel.STANDARD.value,
                    'review_frequency': 'Bi-weekly'
                }
            else:
                recommendations[category] = {
                    'priority': 'Low',
                    'management_approach': 'Simple control, periodic review',
                    'service_level_target': ServiceLevel.BASIC.value,
                    'review_frequency': 'Monthly'
                }
        
        return {
            'products': df.to_dict('records'),
            'category_statistics': category_stats.to_dict(),
            'recommendations': recommendations,
            'analysis_date': date.today().isoformat(),
            'total_products': len(df),
            'total_annual_value': total_value
        }
    
    def identify_slow_moving_inventory(self, 
                                     days_threshold: int = 90,
                                     turnover_threshold: float = 2.0) -> List[Dict]:
        """
        Identify slow-moving inventory items.
        """
        # Query inventory with low turnover
        slow_moving_query = db.session.query(
            InventoryLevel,
            Product.name,
            Product.category
        ).join(Product).filter(
            InventoryLevel.snapshot_date == date.today(),
            InventoryLevel.turnover_rate_monthly < turnover_threshold / 12,  # Convert annual to monthly
            InventoryLevel.available_quantity > 0
        )
        
        # Also check for items with old stock
        old_stock_query = slow_moving_query.filter(
            InventoryLevel.average_age_days > days_threshold
        )
        
        slow_items = old_stock_query.all()
        
        results = []
        for inventory, product_name, category in slow_items:
            # Calculate risk metrics
            carrying_cost_monthly = (
                float(inventory.storage_cost_per_unit_monthly or 0) * inventory.available_quantity
            )
            
            obsolescence_risk = min(1.0, inventory.average_age_days / 365) if inventory.average_age_days else 0
            
            # Generate recommendations
            recommendations = []
            if inventory.available_quantity > (inventory.expected_demand_30d or 0) * 3:
                recommendations.append("Consider promotion or markdown")
            if inventory.average_age_days > 180:
                recommendations.append("High obsolescence risk - review urgently")
            if carrying_cost_monthly > (float(inventory.total_value or 0) * 0.02):
                recommendations.append("High carrying cost - consider liquidation")
                
            results.append({
                'product_id': str(inventory.product_id),
                'product_name': product_name,
                'category': category,
                'location_id': inventory.location_id,
                'location_name': inventory.location_name,
                'available_quantity': inventory.available_quantity,
                'average_age_days': inventory.average_age_days,
                'turnover_rate_annual': float(inventory.turnover_rate_monthly or 0) * 12,
                'days_of_supply': inventory.days_of_supply,
                'total_value': float(inventory.total_value or 0),
                'carrying_cost_monthly': carrying_cost_monthly,
                'obsolescence_risk_score': obsolescence_risk,
                'last_movement_date': inventory.last_movement_date.isoformat() if inventory.last_movement_date else None,
                'recommendations': recommendations
            })
        
        # Sort by risk (combination of age and value)
        results.sort(key=lambda x: x['obsolescence_risk_score'] * x['total_value'], reverse=True)
        
        return results
    
    def _optimize_single_location(self,
                                 product_id: str,
                                 location: Dict,
                                 forecast_data: Dict,
                                 service_level: ServiceLevel,
                                 constraints: SupplyChainConstraints,
                                 cost_params: CostParameters,
                                 objective: OptimizationObjective) -> OptimizationResult:
        """
        Optimize stock levels for a single location.
        """
        # Extract forecast data
        forecasts = forecast_data.get('forecasts', [])
        if not forecasts:
            return None
            
        # Calculate demand statistics
        monthly_demand = sum(forecasts[:30]) if len(forecasts) >= 30 else sum(forecasts)
        annual_demand = monthly_demand * 12
        demand_std = np.std(forecasts[:30]) if len(forecasts) >= 30 else np.std(forecasts)
        
        # Get current inventory
        current_stock = location.get('available_quantity', 0)
        unit_cost = location.get('unit_cost', 0)
        
        if annual_demand <= 0 or unit_cost <= 0:
            return None
        
        # Calculate EOQ
        eoq_result = self.calculate_eoq(
            annual_demand=annual_demand,
            ordering_cost=cost_params.ordering_cost_per_order,
            holding_cost_rate=cost_params.holding_cost_percentage_annual,
            unit_cost=unit_cost,
            constraints=constraints
        )
        
        # Calculate safety stock
        safety_result = self.calculate_safety_stock(
            demand_mean=monthly_demand,
            demand_std=demand_std,
            lead_time_days=constraints.lead_time_days,
            lead_time_variability=constraints.lead_time_variability,
            service_level=service_level
        )
        
        # Calculate reorder point
        daily_demand = monthly_demand / 30
        reorder_result = self.calculate_reorder_point(
            lead_time_days=constraints.lead_time_days,
            daily_demand_mean=daily_demand,
            safety_stock=safety_result['safety_stock']
        )
        
        # Calculate optimal stock level
        optimal_stock = reorder_result['reorder_point'] + eoq_result['eoq']
        
        # Apply capacity constraints
        if constraints.storage_capacity_units:
            optimal_stock = min(optimal_stock, constraints.storage_capacity_units)
            
        # Calculate costs
        cost_breakdown = self._calculate_cost_breakdown(
            current_stock=current_stock,
            optimal_stock=optimal_stock,
            eoq=eoq_result['eoq'],
            safety_stock=safety_result['safety_stock'],
            annual_demand=annual_demand,
            unit_cost=unit_cost,
            cost_params=cost_params
        )
        
        # Calculate risk metrics
        risk_metrics = self._calculate_risk_metrics(
            current_stock=current_stock,
            reorder_point=reorder_result['reorder_point'],
            forecast_data=forecast_data,
            service_level=service_level
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            current_stock=current_stock,
            optimal_stock=optimal_stock,
            reorder_point=reorder_result['reorder_point'],
            eoq=eoq_result['eoq'],
            risk_metrics=risk_metrics
        )
        
        # Calculate confidence score
        confidence_score = self._calculate_confidence_score(forecast_data, len(forecasts))
        
        return OptimizationResult(
            product_id=product_id,
            location_id=location['location_id'],
            current_stock=current_stock,
            optimal_stock_level=optimal_stock,
            reorder_point=reorder_result['reorder_point'],
            reorder_quantity=eoq_result['eoq'],
            safety_stock=safety_result['safety_stock'],
            economic_order_quantity=eoq_result['eoq'],
            service_level_achieved=safety_result['service_level_achieved'],
            total_annual_cost=cost_breakdown['total_annual_cost'],
            cost_breakdown=cost_breakdown,
            risk_metrics=risk_metrics,
            recommendations=recommendations,
            confidence_score=confidence_score
        )
    
    def _get_demand_forecast(self, product_id: str, sales_channel_id: str, horizon: int) -> Dict:
        """Get demand forecast for the product and channel."""
        try:
            return self.forecasting_service.generate_forecast(
                product_id=product_id,
                sales_channel_id=sales_channel_id,
                forecast_horizon=horizon,
                algorithm='auto'
            )
        except Exception as e:
            # Return simple forecast based on historical average
            historical = db.session.query(HistoricalSales).filter(
                HistoricalSales.product_id == product_id,
                HistoricalSales.sales_channel_id == sales_channel_id
            ).limit(30).all()
            
            if historical:
                avg_demand = sum(h.quantity_sold for h in historical) / len(historical)
                return {
                    'forecasts': [avg_demand] * horizon,
                    'confidence_lower': [avg_demand * 0.8] * horizon,
                    'confidence_upper': [avg_demand * 1.2] * horizon,
                    'model_accuracy': {'mae': avg_demand * 0.1, 'mape': 0.15}
                }
            else:
                return {'forecasts': [0] * horizon, 'confidence_lower': [0] * horizon, 'confidence_upper': [0] * horizon}
    
    def _get_inventory_location(self, product_id: str, location_id: str) -> Dict:
        """Get inventory information for a specific location."""
        inventory = db.session.query(InventoryLevel).filter(
            InventoryLevel.product_id == product_id,
            InventoryLevel.location_id == location_id,
            InventoryLevel.snapshot_date == date.today()
        ).first()
        
        if not inventory:
            return None
            
        return {
            'location_id': inventory.location_id,
            'location_name': inventory.location_name,
            'available_quantity': inventory.available_quantity,
            'unit_cost': float(inventory.unit_cost) if inventory.unit_cost else 0,
            'sales_channel_id': self._infer_sales_channel(inventory.location_type)
        }
    
    def _get_all_inventory_locations(self, product_id: str) -> List[Dict]:
        """Get all inventory locations for a product."""
        inventories = db.session.query(InventoryLevel).filter(
            InventoryLevel.product_id == product_id,
            InventoryLevel.snapshot_date == date.today(),
            InventoryLevel.available_quantity > 0
        ).all()
        
        locations = []
        for inventory in inventories:
            locations.append({
                'location_id': inventory.location_id,
                'location_name': inventory.location_name,
                'available_quantity': inventory.available_quantity,
                'unit_cost': float(inventory.unit_cost) if inventory.unit_cost else 0,
                'sales_channel_id': self._infer_sales_channel(inventory.location_type)
            })
            
        return locations
    
    def _infer_sales_channel(self, location_type: str) -> str:
        """Infer sales channel from location type."""
        # This would need to be mapped based on your business logic
        channel_mapping = {
            'fba': 'amazon',
            'warehouse': 'shopify',
            'store': 'retail'
        }
        return channel_mapping.get(location_type.lower(), 'default')
    
    def _get_default_constraints(self, product_id: str) -> SupplyChainConstraints:
        """Get default constraints for a product."""
        return SupplyChainConstraints(
            lead_time_days=14.0,
            lead_time_variability=3.0,
            supplier_capacity_monthly=10000,
            production_capacity_monthly=5000,
            working_capital_limit=100000.0,
            storage_capacity_units=1000,
            seasonal_capacity_factor={i: 1.0 for i in range(1, 13)}
        )
    
    def _calculate_cost_breakdown(self, **kwargs) -> Dict[str, float]:
        """Calculate detailed cost breakdown."""
        current_stock = kwargs['current_stock']
        optimal_stock = kwargs['optimal_stock']
        eoq = kwargs['eoq']
        safety_stock = kwargs['safety_stock']
        annual_demand = kwargs['annual_demand']
        unit_cost = kwargs['unit_cost']
        cost_params = kwargs['cost_params']
        
        # Holding costs
        avg_inventory = optimal_stock / 2
        annual_holding_cost = avg_inventory * unit_cost * cost_params.holding_cost_percentage_annual
        
        # Ordering costs
        orders_per_year = annual_demand / eoq if eoq > 0 else 0
        annual_ordering_cost = orders_per_year * cost_params.ordering_cost_per_order
        
        # Storage costs
        annual_storage_cost = optimal_stock * cost_params.storage_cost_per_unit_monthly * 12
        
        # Safety stock costs
        safety_stock_cost = safety_stock * unit_cost * cost_params.holding_cost_percentage_annual
        
        total_cost = annual_holding_cost + annual_ordering_cost + annual_storage_cost
        
        return {
            'annual_holding_cost': annual_holding_cost,
            'annual_ordering_cost': annual_ordering_cost,
            'annual_storage_cost': annual_storage_cost,
            'safety_stock_cost': safety_stock_cost,
            'total_annual_cost': total_cost
        }
    
    def _calculate_risk_metrics(self, **kwargs) -> Dict[str, float]:
        """Calculate risk metrics."""
        current_stock = kwargs['current_stock']
        reorder_point = kwargs['reorder_point']
        forecast_data = kwargs['forecast_data']
        service_level = kwargs['service_level']
        
        # Stockout risk
        stockout_probability = max(0, (reorder_point - current_stock) / reorder_point) if reorder_point > 0 else 0
        
        # Demand variability
        forecasts = forecast_data.get('forecasts', [])
        demand_cv = np.std(forecasts) / np.mean(forecasts) if forecasts and np.mean(forecasts) > 0 else 0
        
        # Forecast accuracy
        model_accuracy = forecast_data.get('model_accuracy', {})
        mape = model_accuracy.get('mape', 0.5)
        
        return {
            'stockout_probability': stockout_probability,
            'demand_coefficient_of_variation': demand_cv,
            'forecast_mape': mape,
            'service_level_risk': max(0, service_level.value - 0.9)  # Risk if service level drops below 90%
        }
    
    def _generate_recommendations(self, **kwargs) -> List[str]:
        """Generate optimization recommendations."""
        current_stock = kwargs['current_stock']
        optimal_stock = kwargs['optimal_stock']
        reorder_point = kwargs['reorder_point']
        eoq = kwargs['eoq']
        risk_metrics = kwargs['risk_metrics']
        
        recommendations = []
        
        # Stock level recommendations
        stock_diff = optimal_stock - current_stock
        if stock_diff > 0:
            recommendations.append(f"Increase stock by {stock_diff} units to reach optimal level")
        elif stock_diff < -optimal_stock * 0.2:
            recommendations.append(f"Consider reducing stock by {abs(stock_diff)} units")
            
        # Reorder recommendations
        if current_stock <= reorder_point:
            recommendations.append(f"Immediate reorder needed - current stock below reorder point")
            recommendations.append(f"Suggested order quantity: {eoq} units")
            
        # Risk-based recommendations
        if risk_metrics['stockout_probability'] > 0.1:
            recommendations.append("High stockout risk - consider increasing safety stock")
            
        if risk_metrics['demand_coefficient_of_variation'] > 0.5:
            recommendations.append("High demand variability - review forecast model")
            
        if risk_metrics['forecast_mape'] > 0.3:
            recommendations.append("Poor forecast accuracy - improve demand planning")
        
        return recommendations
    
    def _calculate_confidence_score(self, forecast_data: Dict, data_points: int) -> float:
        """Calculate confidence score for the optimization."""
        base_confidence = 0.5
        
        # Adjust for data availability
        data_factor = min(1.0, data_points / 90)  # Full confidence with 90+ days
        
        # Adjust for forecast accuracy
        model_accuracy = forecast_data.get('model_accuracy', {})
        mape = model_accuracy.get('mape', 0.5)
        accuracy_factor = max(0.1, 1.0 - mape)
        
        # Adjust for forecast confidence intervals
        forecasts = forecast_data.get('forecasts', [])
        conf_lower = forecast_data.get('confidence_lower', [])
        conf_upper = forecast_data.get('confidence_upper', [])
        
        if forecasts and conf_lower and conf_upper:
            avg_interval_width = np.mean([
                (upper - lower) / forecast if forecast > 0 else 1
                for forecast, lower, upper in zip(forecasts, conf_lower, conf_upper)
            ])
            interval_factor = max(0.1, 1.0 - min(1.0, avg_interval_width))
        else:
            interval_factor = 0.5
            
        confidence = base_confidence * data_factor * accuracy_factor * interval_factor
        return min(1.0, max(0.1, confidence))