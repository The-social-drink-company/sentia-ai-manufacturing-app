"""
Working Capital Modeling Service

Provides comprehensive working capital calculations, cash flow projections,
and scenario modeling for business planning.
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple, Any
from decimal import Decimal
import statistics
import math

from sqlalchemy import func, and_, or_
from app import db
from app.models.working_capital import WorkingCapital
from app.models.product import Product
from app.models.market import Market
from app.models.sales_channel import SalesChannel
from app.models.forecast import Forecast
from app.models.historical_sales import HistoricalSales
from app.models.inventory_level import InventoryLevel


class WorkingCapitalService:
    """Service for working capital modeling and cash flow analysis"""
    
    # Standard industry benchmarks for reference
    INDUSTRY_BENCHMARKS = {
        'manufacturing': {
            'days_sales_outstanding': 45,
            'days_inventory_outstanding': 60,
            'days_payable_outstanding': 30,
            'working_capital_turnover': 6.0,
            'current_ratio': 2.0
        },
        'retail': {
            'days_sales_outstanding': 30,
            'days_inventory_outstanding': 90,
            'days_payable_outstanding': 45,
            'working_capital_turnover': 8.0,
            'current_ratio': 1.5
        }
    }
    
    def __init__(self):
        self.db = db
    
    def calculate_inventory_investment(self, product_id: str, market_code: str, 
                                    forecast_period_months: int = 12) -> Dict[str, Any]:
        """
        Calculate inventory investment requirements by product and region
        
        Args:
            product_id: Product UUID
            market_code: Market code
            forecast_period_months: Projection period
            
        Returns:
            Dictionary with inventory investment details
        """
        try:
            # Get current inventory levels
            inventory = InventoryLevel.query.filter_by(
                product_id=product_id,
                market_code=market_code
            ).order_by(InventoryLevel.date.desc()).first()
            
            current_stock = float(inventory.quantity) if inventory else 0.0
            unit_cost = float(inventory.unit_cost) if inventory and inventory.unit_cost else 0.0
            
            # Get demand forecast
            forecasts = Forecast.query.filter(
                Forecast.product_id == product_id,
                Forecast.market_code == market_code,
                Forecast.forecast_date >= date.today(),
                Forecast.forecast_date <= date.today() + timedelta(days=forecast_period_months * 30)
            ).all()
            
            if not forecasts:
                return {
                    'error': 'No demand forecast available',
                    'current_stock': current_stock,
                    'current_value': current_stock * unit_cost
                }
            
            # Calculate optimal inventory levels
            total_demand = sum(float(f.predicted_demand) for f in forecasts)
            monthly_demand = total_demand / forecast_period_months
            
            # Apply EOQ and safety stock calculations
            demand_variance = statistics.stdev([float(f.predicted_demand) for f in forecasts]) if len(forecasts) > 1 else 0
            safety_stock = math.sqrt(monthly_demand) + (demand_variance * 1.65)  # 95% service level
            
            # Calculate reorder point and optimal stock levels
            lead_time_demand = monthly_demand * 0.5  # Assume 15-day lead time
            optimal_stock = safety_stock + lead_time_demand
            
            # Investment calculations
            additional_investment = max(0, optimal_stock - current_stock) * unit_cost
            total_investment = optimal_stock * unit_cost
            
            # Calculate carrying costs (assume 20% annual rate)
            carrying_cost_rate = 0.20
            annual_carrying_cost = total_investment * carrying_cost_rate
            monthly_carrying_cost = annual_carrying_cost / 12
            
            return {
                'product_id': product_id,
                'market_code': market_code,
                'current_stock': current_stock,
                'optimal_stock': optimal_stock,
                'additional_stock_needed': max(0, optimal_stock - current_stock),
                'unit_cost': unit_cost,
                'current_investment': current_stock * unit_cost,
                'optimal_investment': total_investment,
                'additional_investment_needed': additional_investment,
                'safety_stock': safety_stock,
                'reorder_point': safety_stock + lead_time_demand,
                'monthly_carrying_cost': monthly_carrying_cost,
                'annual_carrying_cost': annual_carrying_cost,
                'turnover_rate': monthly_demand * 12 / optimal_stock if optimal_stock > 0 else 0
            }
            
        except Exception as e:
            return {
                'error': f'Error calculating inventory investment: {str(e)}',
                'product_id': product_id,
                'market_code': market_code
            }
    
    def calculate_accounts_receivable(self, sales_channel_id: str, market_code: str,
                                   payment_terms_days: int = 30) -> Dict[str, Any]:
        """
        Calculate accounts receivable by sales channel
        
        Args:
            sales_channel_id: Sales channel UUID
            market_code: Market code
            payment_terms_days: Payment terms in days
            
        Returns:
            AR calculation details
        """
        try:
            # Get recent sales data
            recent_sales = HistoricalSales.query.filter(
                HistoricalSales.sales_channel_id == sales_channel_id,
                HistoricalSales.market_code == market_code,
                HistoricalSales.date >= date.today() - timedelta(days=90)
            ).order_by(HistoricalSales.date.desc()).all()
            
            if not recent_sales:
                return {
                    'error': 'No recent sales data available',
                    'sales_channel_id': sales_channel_id,
                    'market_code': market_code
                }
            
            # Calculate daily sales average
            total_sales = sum(float(sale.quantity * sale.unit_price) for sale in recent_sales)
            daily_average_sales = total_sales / len(recent_sales)
            
            # Calculate AR based on payment terms
            accounts_receivable = daily_average_sales * payment_terms_days
            
            # Calculate collection metrics
            collection_rate = 0.95  # Assume 95% collection rate
            bad_debt_rate = 0.02    # Assume 2% bad debt
            
            # Days Sales Outstanding calculation
            dso = payment_terms_days / collection_rate
            
            # Calculate aging buckets
            current_ar = accounts_receivable * 0.7      # 70% current
            past_due_30 = accounts_receivable * 0.20    # 20% 30 days
            past_due_60 = accounts_receivable * 0.08    # 8% 60 days
            past_due_90 = accounts_receivable * 0.02    # 2% 90+ days
            
            return {
                'sales_channel_id': sales_channel_id,
                'market_code': market_code,
                'daily_average_sales': daily_average_sales,
                'payment_terms_days': payment_terms_days,
                'total_accounts_receivable': accounts_receivable,
                'collectible_ar': accounts_receivable * collection_rate,
                'bad_debt_provision': accounts_receivable * bad_debt_rate,
                'days_sales_outstanding': dso,
                'aging_analysis': {
                    'current': current_ar,
                    '30_days': past_due_30,
                    '60_days': past_due_60,
                    '90_plus_days': past_due_90
                },
                'collection_rate': collection_rate,
                'turnover_ratio': 365 / dso if dso > 0 else 0
            }
            
        except Exception as e:
            return {
                'error': f'Error calculating accounts receivable: {str(e)}',
                'sales_channel_id': sales_channel_id,
                'market_code': market_code
            }
    
    def calculate_accounts_payable(self, supplier_terms_days: int = 30,
                                 cost_structure: Dict[str, float] = None) -> Dict[str, Any]:
        """
        Calculate accounts payable optimization by supplier terms
        
        Args:
            supplier_terms_days: Average payment terms with suppliers
            cost_structure: Dictionary of cost categories and amounts
            
        Returns:
            AP optimization details
        """
        if cost_structure is None:
            cost_structure = {
                'raw_materials': 50000.0,
                'manufacturing_supplies': 15000.0,
                'utilities': 8000.0,
                'services': 12000.0,
                'rent': 10000.0
            }
        
        try:
            total_monthly_costs = sum(cost_structure.values())
            daily_cost_average = total_monthly_costs / 30
            
            # Calculate optimal payables
            accounts_payable = daily_cost_average * supplier_terms_days
            
            # DPO optimization scenarios
            scenarios = {
                'current': {
                    'days': supplier_terms_days,
                    'payables': accounts_payable,
                    'cash_benefit': 0
                },
                'extend_15_days': {
                    'days': supplier_terms_days + 15,
                    'payables': daily_cost_average * (supplier_terms_days + 15),
                    'cash_benefit': daily_cost_average * 15
                },
                'early_payment_2_percent': {
                    'days': 10,
                    'payables': daily_cost_average * 10,
                    'cash_cost': daily_cost_average * (supplier_terms_days - 10),
                    'discount_savings': total_monthly_costs * 0.02
                }
            }
            
            # Calculate Days Payable Outstanding
            dpo = supplier_terms_days
            payables_turnover = 365 / dpo if dpo > 0 else 0
            
            # Cash flow impact analysis
            working_capital_impact = accounts_payable  # Positive impact on WC
            
            return {
                'total_monthly_costs': total_monthly_costs,
                'daily_cost_average': daily_cost_average,
                'current_terms_days': supplier_terms_days,
                'total_accounts_payable': accounts_payable,
                'days_payable_outstanding': dpo,
                'payables_turnover_ratio': payables_turnover,
                'working_capital_benefit': working_capital_impact,
                'cost_breakdown': cost_structure,
                'optimization_scenarios': scenarios,
                'recommended_strategy': self._recommend_payment_strategy(scenarios)
            }
            
        except Exception as e:
            return {
                'error': f'Error calculating accounts payable: {str(e)}',
                'supplier_terms_days': supplier_terms_days
            }
    
    def calculate_cash_conversion_cycle(self, product_id: str, market_code: str,
                                      sales_channel_id: str) -> Dict[str, Any]:
        """
        Calculate cash conversion cycle analysis
        
        Args:
            product_id: Product UUID
            market_code: Market code
            sales_channel_id: Sales channel UUID
            
        Returns:
            Cash conversion cycle details
        """
        try:
            # Get inventory metrics
            inventory_calc = self.calculate_inventory_investment(product_id, market_code)
            if 'error' in inventory_calc:
                return inventory_calc
            
            # Get AR metrics
            ar_calc = self.calculate_accounts_receivable(sales_channel_id, market_code)
            if 'error' in ar_calc:
                return ar_calc
            
            # Get AP metrics
            ap_calc = self.calculate_accounts_payable()
            
            # Calculate cycle components
            dso = ar_calc.get('days_sales_outstanding', 30)
            dio = 365 / inventory_calc.get('turnover_rate', 6) if inventory_calc.get('turnover_rate', 0) > 0 else 60
            dpo = ap_calc.get('days_payable_outstanding', 30)
            
            # Cash conversion cycle = DIO + DSO - DPO
            cash_conversion_cycle = dio + dso - dpo
            
            # Calculate financial impact
            daily_sales = ar_calc.get('daily_average_sales', 0)
            cash_tied_up = cash_conversion_cycle * daily_sales
            
            # Improvement opportunities
            improvements = self._calculate_cycle_improvements(dso, dio, dpo, daily_sales)
            
            return {
                'product_id': product_id,
                'market_code': market_code,
                'sales_channel_id': sales_channel_id,
                'days_sales_outstanding': dso,
                'days_inventory_outstanding': dio,
                'days_payable_outstanding': dpo,
                'cash_conversion_cycle_days': cash_conversion_cycle,
                'daily_sales_value': daily_sales,
                'cash_tied_up_in_cycle': cash_tied_up,
                'annual_cash_impact': cash_tied_up * 365 / cash_conversion_cycle if cash_conversion_cycle > 0 else 0,
                'cycle_efficiency_score': max(0, 100 - cash_conversion_cycle),
                'improvement_opportunities': improvements,
                'benchmark_comparison': self._compare_to_benchmarks(dso, dio, dpo, cash_conversion_cycle)
            }
            
        except Exception as e:
            return {
                'error': f'Error calculating cash conversion cycle: {str(e)}',
                'product_id': product_id,
                'market_code': market_code
            }
    
    def generate_working_capital_metrics(self, date_range: Tuple[date, date],
                                       scenario: str = 'base') -> Dict[str, Any]:
        """
        Generate comprehensive working capital metrics
        
        Args:
            date_range: Tuple of (start_date, end_date)
            scenario: Scenario type ('base', 'optimistic', 'pessimistic')
            
        Returns:
            Comprehensive WC metrics
        """
        start_date, end_date = date_range
        
        try:
            # Query working capital data
            wc_records = WorkingCapital.query.filter(
                WorkingCapital.projection_date >= start_date,
                WorkingCapital.projection_date <= end_date,
                WorkingCapital.scenario_type == scenario,
                WorkingCapital.status == 'projected'
            ).all()
            
            if not wc_records:
                return {
                    'error': 'No working capital data found for the specified period',
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'scenario': scenario
                }
            
            # Aggregate metrics
            total_wc_requirement = sum(float(r.working_capital_requirement) for r in wc_records if r.working_capital_requirement)
            total_ar = sum(float(r.accounts_receivable) for r in wc_records if r.accounts_receivable)
            total_inventory = sum(float(r.inventory_value) for r in wc_records if r.inventory_value)
            total_ap = sum(float(r.accounts_payable) for r in wc_records if r.accounts_payable)
            total_revenue = sum(float(r.projected_sales_revenue) for r in wc_records if r.projected_sales_revenue)
            
            avg_dso = statistics.mean([r.days_sales_outstanding for r in wc_records if r.days_sales_outstanding])
            avg_dio = statistics.mean([r.days_inventory_outstanding for r in wc_records if r.days_inventory_outstanding])
            avg_dpo = statistics.mean([r.days_payable_outstanding for r in wc_records if r.days_payable_outstanding])
            avg_cycle = statistics.mean([r.cash_conversion_cycle_days for r in wc_records if r.cash_conversion_cycle_days])
            
            # Calculate ratios
            wc_to_sales_ratio = total_wc_requirement / total_revenue if total_revenue > 0 else 0
            ar_turnover = (total_revenue * 365) / (total_ar * avg_dso) if total_ar > 0 and avg_dso > 0 else 0
            inventory_turnover = 365 / avg_dio if avg_dio > 0 else 0
            
            return {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'scenario': scenario,
                    'record_count': len(wc_records)
                },
                'working_capital_summary': {
                    'total_requirement': total_wc_requirement,
                    'accounts_receivable': total_ar,
                    'inventory_value': total_inventory,
                    'accounts_payable': total_ap,
                    'net_working_capital': total_wc_requirement
                },
                'cycle_metrics': {
                    'average_dso': avg_dso,
                    'average_dio': avg_dio,
                    'average_dpo': avg_dpo,
                    'average_cash_cycle': avg_cycle
                },
                'financial_ratios': {
                    'wc_to_sales_ratio': wc_to_sales_ratio,
                    'ar_turnover_ratio': ar_turnover,
                    'inventory_turnover_ratio': inventory_turnover,
                    'working_capital_intensity': wc_to_sales_ratio * 100
                },
                'efficiency_scores': self._calculate_efficiency_scores(avg_dso, avg_dio, avg_dpo, avg_cycle),
                'trend_analysis': self._calculate_wc_trends(wc_records)
            }
            
        except Exception as e:
            return {
                'error': f'Error generating working capital metrics: {str(e)}',
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }
    
    def _recommend_payment_strategy(self, scenarios: Dict[str, Any]) -> str:
        """Recommend optimal payment strategy based on scenarios"""
        current = scenarios['current']
        extended = scenarios['extend_15_days']
        early = scenarios['early_payment_2_percent']
        
        # Simple logic - can be enhanced with more sophisticated analysis
        if early['discount_savings'] > extended['cash_benefit']:
            return 'early_payment_2_percent'
        elif extended['cash_benefit'] > current['payables'] * 0.1:  # 10% benefit threshold
            return 'extend_15_days'
        else:
            return 'current'
    
    def _calculate_cycle_improvements(self, dso: float, dio: float, dpo: float, daily_sales: float) -> Dict[str, Any]:
        """Calculate potential improvements to cash conversion cycle"""
        current_cycle = dio + dso - dpo
        
        improvements = {
            'reduce_dso_by_5_days': {
                'new_cycle': dio + (dso - 5) - dpo,
                'cash_freed': 5 * daily_sales,
                'difficulty': 'medium'
            },
            'reduce_inventory_by_10_days': {
                'new_cycle': (dio - 10) + dso - dpo,
                'cash_freed': 10 * daily_sales,
                'difficulty': 'high'
            },
            'extend_payables_by_7_days': {
                'new_cycle': dio + dso - (dpo + 7),
                'cash_freed': 7 * daily_sales,
                'difficulty': 'low'
            },
            'combined_optimization': {
                'new_cycle': (dio - 5) + (dso - 3) - (dpo + 5),
                'cash_freed': 13 * daily_sales,
                'difficulty': 'high'
            }
        }
        
        for key, improvement in improvements.items():
            improvement['cycle_reduction_days'] = current_cycle - improvement['new_cycle']
            improvement['annual_cash_benefit'] = improvement['cash_freed'] * (365 / current_cycle) if current_cycle > 0 else 0
        
        return improvements
    
    def _compare_to_benchmarks(self, dso: float, dio: float, dpo: float, cycle: float) -> Dict[str, Any]:
        """Compare metrics to industry benchmarks"""
        # Use manufacturing benchmark as default
        benchmark = self.INDUSTRY_BENCHMARKS['manufacturing']
        
        return {
            'dso_vs_benchmark': {
                'actual': dso,
                'benchmark': benchmark['days_sales_outstanding'],
                'variance': dso - benchmark['days_sales_outstanding'],
                'performance': 'good' if dso <= benchmark['days_sales_outstanding'] else 'needs_improvement'
            },
            'dio_vs_benchmark': {
                'actual': dio,
                'benchmark': benchmark['days_inventory_outstanding'],
                'variance': dio - benchmark['days_inventory_outstanding'],
                'performance': 'good' if dio <= benchmark['days_inventory_outstanding'] else 'needs_improvement'
            },
            'dpo_vs_benchmark': {
                'actual': dpo,
                'benchmark': benchmark['days_payable_outstanding'],
                'variance': dpo - benchmark['days_payable_outstanding'],
                'performance': 'good' if dpo >= benchmark['days_payable_outstanding'] else 'can_improve'
            },
            'overall_efficiency': 'excellent' if cycle < 30 else 'good' if cycle < 60 else 'needs_improvement'
        }
    
    def _calculate_efficiency_scores(self, dso: float, dio: float, dpo: float, cycle: float) -> Dict[str, float]:
        """Calculate efficiency scores for working capital components"""
        # Scoring based on industry standards (0-100 scale)
        dso_score = max(0, 100 - (dso - 30) * 2) if dso > 30 else 100
        dio_score = max(0, 100 - (dio - 45) * 1.5) if dio > 45 else 100
        dpo_score = min(100, dpo * 2) if dpo < 50 else 100
        cycle_score = max(0, 100 - cycle) if cycle > 0 else 100
        
        overall_score = (dso_score + dio_score + dpo_score + cycle_score) / 4
        
        return {
            'dso_efficiency_score': round(dso_score, 2),
            'dio_efficiency_score': round(dio_score, 2),
            'dpo_efficiency_score': round(dpo_score, 2),
            'cycle_efficiency_score': round(cycle_score, 2),
            'overall_efficiency_score': round(overall_score, 2)
        }
    
    def _calculate_wc_trends(self, wc_records: List[WorkingCapital]) -> Dict[str, Any]:
        """Calculate working capital trends over time"""
        if len(wc_records) < 2:
            return {'trend': 'insufficient_data'}
        
        # Sort by date
        sorted_records = sorted(wc_records, key=lambda x: x.projection_date)
        
        # Calculate trends for key metrics
        wc_requirements = [float(r.working_capital_requirement) for r in sorted_records if r.working_capital_requirement]
        net_cash_flows = [float(r.net_cash_flow) for r in sorted_records if r.net_cash_flow]
        
        if len(wc_requirements) >= 2:
            wc_trend = (wc_requirements[-1] - wc_requirements[0]) / len(wc_requirements)
        else:
            wc_trend = 0
        
        if len(net_cash_flows) >= 2:
            cash_trend = (net_cash_flows[-1] - net_cash_flows[0]) / len(net_cash_flows)
        else:
            cash_trend = 0
        
        return {
            'working_capital_trend': 'improving' if wc_trend < 0 else 'stable' if abs(wc_trend) < 1000 else 'increasing',
            'cash_flow_trend': 'improving' if cash_trend > 0 else 'stable' if abs(cash_trend) < 1000 else 'declining',
            'wc_trend_value': wc_trend,
            'cash_trend_value': cash_trend,
            'data_points': len(sorted_records),
            'period_days': (sorted_records[-1].projection_date - sorted_records[0].projection_date).days
        }