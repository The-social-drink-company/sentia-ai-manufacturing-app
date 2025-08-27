"""
Cash Flow Projection Service

Provides comprehensive cash flow forecasting, seasonal analysis,
and liquidity management capabilities.
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple, Any
from decimal import Decimal
from dateutil.relativedelta import relativedelta
import statistics
import calendar

from sqlalchemy import func, and_, extract
from app import db
from app.models.working_capital import WorkingCapital
from app.models.forecast import Forecast
from app.models.historical_sales import HistoricalSales
from app.models.product import Product
from app.models.market import Market


class CashFlowProjectionService:
    """Service for cash flow forecasting and liquidity analysis"""
    
    # Seasonal adjustment factors by month (1.0 = average)
    SEASONAL_FACTORS = {
        1: 0.85,   # January
        2: 0.90,   # February
        3: 0.95,   # March
        4: 1.00,   # April
        5: 1.05,   # May
        6: 1.10,   # June
        7: 1.15,   # July
        8: 1.20,   # August
        9: 1.15,   # September
        10: 1.10,  # October
        11: 1.30,  # November (holiday season)
        12: 1.40   # December (holiday season)
    }
    
    def __init__(self):
        self.db = db
    
    def generate_monthly_cash_flow_projection(self, start_date: date, periods: int = 12,
                                            scenario: str = 'base') -> Dict[str, Any]:
        """
        Generate monthly cash flow projections
        
        Args:
            start_date: Starting date for projection
            periods: Number of months to project
            scenario: Scenario type ('base', 'optimistic', 'pessimistic')
            
        Returns:
            Monthly cash flow projection data
        """
        try:
            projections = []
            cumulative_cash = 0
            current_date = start_date
            
            # Get base data for calculations
            base_working_capital = self._get_base_working_capital_data(current_date, scenario)
            historical_patterns = self._analyze_historical_cash_patterns()
            
            for month in range(periods):
                monthly_projection = self._calculate_monthly_cash_flow(
                    current_date, base_working_capital, historical_patterns, scenario
                )
                
                # Update cumulative cash flow
                cumulative_cash += monthly_projection['net_cash_flow']
                monthly_projection['cumulative_cash_flow'] = cumulative_cash
                monthly_projection['period'] = month + 1
                monthly_projection['date'] = current_date.isoformat()
                
                projections.append(monthly_projection)
                
                # Move to next month
                current_date = current_date.replace(day=1) + relativedelta(months=1)
            
            # Calculate summary statistics
            summary = self._calculate_cash_flow_summary(projections)
            
            # Identify cash flow issues
            alerts = self._identify_cash_flow_alerts(projections)
            
            return {
                'scenario': scenario,
                'projection_period': {
                    'start_date': start_date.isoformat(),
                    'end_date': projections[-1]['date'] if projections else None,
                    'periods': periods
                },
                'monthly_projections': projections,
                'summary_statistics': summary,
                'cash_flow_alerts': alerts,
                'seasonal_analysis': self._analyze_seasonal_patterns(projections),
                'liquidity_analysis': self._analyze_liquidity_requirements(projections)
            }
            
        except Exception as e:
            return {
                'error': f'Error generating cash flow projection: {str(e)}',
                'start_date': start_date.isoformat(),
                'scenario': scenario
            }
    
    def analyze_seasonal_cash_patterns(self, years_back: int = 2) -> Dict[str, Any]:
        """
        Analyze seasonal cash flow patterns from historical data
        
        Args:
            years_back: Number of years to analyze
            
        Returns:
            Seasonal pattern analysis
        """
        try:
            cutoff_date = date.today() - relativedelta(years=years_back)
            
            # Get historical cash flow data by month
            monthly_data = db.session.query(
                extract('month', WorkingCapital.projection_date).label('month'),
                func.avg(WorkingCapital.net_cash_flow).label('avg_cash_flow'),
                func.stddev(WorkingCapital.net_cash_flow).label('cash_flow_volatility'),
                func.sum(WorkingCapital.projected_sales_revenue).label('total_revenue'),
                func.count().label('record_count')
            ).filter(
                WorkingCapital.projection_date >= cutoff_date,
                WorkingCapital.status == 'actual'
            ).group_by(extract('month', WorkingCapital.projection_date)).all()
            
            if not monthly_data:
                return {'error': 'Insufficient historical data for seasonal analysis'}
            
            # Calculate seasonal patterns
            seasonal_patterns = {}
            total_avg = sum(float(row.avg_cash_flow) for row in monthly_data if row.avg_cash_flow) / len(monthly_data)
            
            for row in monthly_data:
                month_name = calendar.month_name[int(row.month)]
                seasonal_index = float(row.avg_cash_flow) / total_avg if total_avg != 0 else 1.0
                
                seasonal_patterns[month_name] = {
                    'month_number': int(row.month),
                    'average_cash_flow': float(row.avg_cash_flow) if row.avg_cash_flow else 0,
                    'cash_flow_volatility': float(row.cash_flow_volatility) if row.cash_flow_volatility else 0,
                    'total_revenue': float(row.total_revenue) if row.total_revenue else 0,
                    'seasonal_index': seasonal_index,
                    'pattern_strength': 'strong' if abs(seasonal_index - 1.0) > 0.2 else 'moderate' if abs(seasonal_index - 1.0) > 0.1 else 'weak'
                }
            
            # Identify peak and trough months
            peak_month = max(seasonal_patterns.keys(), key=lambda k: seasonal_patterns[k]['seasonal_index'])
            trough_month = min(seasonal_patterns.keys(), key=lambda k: seasonal_patterns[k]['seasonal_index'])
            
            return {
                'analysis_period': f'{years_back} years',
                'seasonal_patterns': seasonal_patterns,
                'peak_cash_flow_month': peak_month,
                'trough_cash_flow_month': trough_month,
                'seasonal_volatility': statistics.stdev([p['seasonal_index'] for p in seasonal_patterns.values()]),
                'recommendations': self._generate_seasonal_recommendations(seasonal_patterns)
            }
            
        except Exception as e:
            return {
                'error': f'Error analyzing seasonal patterns: {str(e)}',
                'years_back': years_back
            }
    
    def project_growth_scenario_impact(self, base_projections: List[Dict],
                                     growth_rates: Dict[str, float]) -> Dict[str, Any]:
        """
        Model cash flow impact of different growth scenarios
        
        Args:
            base_projections: Base case monthly projections
            growth_rates: Dictionary of growth rates by component
            
        Returns:
            Growth scenario analysis
        """
        scenarios = {}
        
        # Define growth scenarios
        scenario_configs = {
            'conservative': {
                'revenue_growth': growth_rates.get('revenue', 0.05),
                'cost_growth': growth_rates.get('cost', 0.03),
                'working_capital_multiplier': 1.1
            },
            'moderate': {
                'revenue_growth': growth_rates.get('revenue', 0.15),
                'cost_growth': growth_rates.get('cost', 0.08),
                'working_capital_multiplier': 1.2
            },
            'aggressive': {
                'revenue_growth': growth_rates.get('revenue', 0.30),
                'cost_growth': growth_rates.get('cost', 0.15),
                'working_capital_multiplier': 1.4
            }
        }
        
        for scenario_name, config in scenario_configs.items():
            scenario_projections = []
            cumulative_impact = 0
            
            for i, base_month in enumerate(base_projections):
                # Apply growth rates with compounding
                growth_factor = (1 + config['revenue_growth'] / 12) ** i
                cost_growth_factor = (1 + config['cost_growth'] / 12) ** i
                
                # Adjust cash flows
                adjusted_revenue = base_month.get('cash_inflows', 0) * growth_factor
                adjusted_costs = base_month.get('cash_outflows', 0) * cost_growth_factor
                
                # Working capital impact (growth requires more WC investment)
                wc_investment = (adjusted_revenue - base_month.get('cash_inflows', 0)) * config['working_capital_multiplier']
                
                net_cash_flow = adjusted_revenue - adjusted_costs - wc_investment
                cumulative_impact += net_cash_flow - base_month.get('net_cash_flow', 0)
                
                scenario_projections.append({
                    'month': i + 1,
                    'base_net_cash_flow': base_month.get('net_cash_flow', 0),
                    'scenario_net_cash_flow': net_cash_flow,
                    'impact_vs_base': net_cash_flow - base_month.get('net_cash_flow', 0),
                    'cumulative_impact': cumulative_impact,
                    'revenue_multiple': growth_factor,
                    'cost_multiple': cost_growth_factor,
                    'wc_investment_required': wc_investment
                })
            
            scenarios[scenario_name] = {
                'config': config,
                'projections': scenario_projections,
                'total_impact': cumulative_impact,
                'max_funding_requirement': min(p['cumulative_impact'] for p in scenario_projections),
                'break_even_month': self._find_break_even_month(scenario_projections),
                'risk_assessment': self._assess_scenario_risk(scenario_projections, config)
            }
        
        return {
            'base_scenario_summary': self._summarize_base_projections(base_projections),
            'growth_scenarios': scenarios,
            'scenario_comparison': self._compare_scenarios(scenarios),
            'funding_requirements': self._calculate_funding_requirements(scenarios)
        }
    
    def calculate_credit_facility_requirements(self, cash_projections: List[Dict],
                                             safety_margin: float = 0.20) -> Dict[str, Any]:
        """
        Calculate credit facility requirements based on cash flow projections
        
        Args:
            cash_projections: Monthly cash flow projections
            safety_margin: Safety margin percentage
            
        Returns:
            Credit facility analysis
        """
        try:
            # Find minimum cash position
            min_cash_position = min(p.get('cumulative_cash_flow', 0) for p in cash_projections)
            max_cash_deficit = abs(min_cash_position) if min_cash_position < 0 else 0
            
            # Calculate facility requirements
            base_facility_requirement = max_cash_deficit
            facility_with_safety = base_facility_requirement * (1 + safety_margin)
            
            # Analyze usage patterns
            months_with_deficit = len([p for p in cash_projections if p.get('cumulative_cash_flow', 0) < 0])
            avg_utilization = sum(abs(min(0, p.get('cumulative_cash_flow', 0))) for p in cash_projections) / len(cash_projections)
            
            # Calculate costs
            facility_fee = facility_with_safety * 0.005  # 0.5% annual commitment fee
            estimated_interest = avg_utilization * 0.06  # 6% annual interest on usage
            total_annual_cost = facility_fee + estimated_interest
            
            # Facility recommendations
            facility_types = {
                'revolving_credit_line': {
                    'amount': facility_with_safety,
                    'type': 'Revolving Credit Line',
                    'commitment_fee_rate': 0.005,
                    'interest_rate': 0.06,
                    'annual_cost': total_annual_cost,
                    'flexibility': 'high',
                    'recommendation': 'primary' if months_with_deficit > 3 else 'secondary'
                },
                'overdraft_facility': {
                    'amount': min(facility_with_safety, 50000),  # Typically smaller
                    'type': 'Overdraft Facility',
                    'commitment_fee_rate': 0.002,
                    'interest_rate': 0.08,
                    'annual_cost': facility_with_safety * 0.002 + avg_utilization * 0.08,
                    'flexibility': 'medium',
                    'recommendation': 'primary' if months_with_deficit <= 3 else 'supplementary'
                },
                'asset_based_lending': {
                    'amount': facility_with_safety * 1.2,  # Higher amount, asset-backed
                    'type': 'Asset-Based Lending',
                    'commitment_fee_rate': 0.003,
                    'interest_rate': 0.04,
                    'annual_cost': facility_with_safety * 0.003 + avg_utilization * 0.04,
                    'flexibility': 'low',
                    'recommendation': 'consider' if facility_with_safety > 100000 else 'not_recommended'
                }
            }
            
            return {
                'cash_flow_analysis': {
                    'minimum_cash_position': min_cash_position,
                    'maximum_deficit': max_cash_deficit,
                    'months_with_deficit': months_with_deficit,
                    'average_utilization': avg_utilization
                },
                'facility_requirements': {
                    'base_requirement': base_facility_requirement,
                    'recommended_facility_size': facility_with_safety,
                    'safety_margin_applied': safety_margin,
                    'utilization_forecast': avg_utilization / facility_with_safety if facility_with_safety > 0 else 0
                },
                'facility_options': facility_types,
                'cost_analysis': {
                    'estimated_annual_cost': total_annual_cost,
                    'cost_as_percentage_of_revenue': self._calculate_cost_percentage(cash_projections, total_annual_cost),
                    'break_even_analysis': self._calculate_facility_break_even(facility_types, cash_projections)
                },
                'recommendations': self._generate_facility_recommendations(facility_types, cash_projections)
            }
            
        except Exception as e:
            return {
                'error': f'Error calculating credit facility requirements: {str(e)}',
                'safety_margin': safety_margin
            }
    
    def _get_base_working_capital_data(self, date_ref: date, scenario: str) -> Dict[str, Any]:
        """Get base working capital data for projections"""
        recent_wc = WorkingCapital.query.filter(
            WorkingCapital.projection_date <= date_ref,
            WorkingCapital.scenario_type == scenario
        ).order_by(WorkingCapital.projection_date.desc()).first()
        
        if not recent_wc:
            return {
                'average_monthly_revenue': 100000,
                'average_monthly_costs': 80000,
                'working_capital_ratio': 0.25,
                'payment_terms_days': 30,
                'collection_efficiency': 0.95
            }
        
        return {
            'average_monthly_revenue': float(recent_wc.projected_sales_revenue) if recent_wc.projected_sales_revenue else 100000,
            'average_monthly_costs': float(recent_wc.cost_of_goods_sold + recent_wc.manufacturing_costs) if recent_wc.cost_of_goods_sold else 80000,
            'working_capital_ratio': 0.25,
            'payment_terms_days': recent_wc.payment_terms_days or 30,
            'collection_efficiency': float(recent_wc.collection_rate) if recent_wc.collection_rate else 0.95
        }
    
    def _analyze_historical_cash_patterns(self) -> Dict[str, Any]:
        """Analyze historical cash flow patterns"""
        # Simple implementation - can be enhanced
        return {
            'revenue_volatility': 0.15,
            'cost_volatility': 0.10,
            'seasonal_strength': 0.25,
            'growth_trend': 0.08
        }
    
    def _calculate_monthly_cash_flow(self, target_date: date, base_data: Dict,
                                   patterns: Dict, scenario: str) -> Dict[str, Any]:
        """Calculate cash flow for a specific month"""
        month = target_date.month
        seasonal_factor = self.SEASONAL_FACTORS.get(month, 1.0)
        
        # Base revenue and costs with seasonal adjustment
        base_revenue = base_data['average_monthly_revenue'] * seasonal_factor
        base_costs = base_data['average_monthly_costs']
        
        # Scenario adjustments
        scenario_multipliers = {
            'optimistic': {'revenue': 1.15, 'costs': 0.95},
            'base': {'revenue': 1.0, 'costs': 1.0},
            'pessimistic': {'revenue': 0.85, 'costs': 1.05}
        }
        
        multiplier = scenario_multipliers.get(scenario, scenario_multipliers['base'])
        
        # Cash inflows (considering collection delays)
        collection_delay = base_data['payment_terms_days'] / 30  # Convert to months
        cash_inflows = base_revenue * multiplier['revenue'] * base_data['collection_efficiency']
        
        # Cash outflows
        cash_outflows = base_costs * multiplier['costs']
        
        # Additional outflows (taxes, interest, etc.)
        other_outflows = base_revenue * 0.05  # 5% for misc expenses
        
        net_cash_flow = cash_inflows - cash_outflows - other_outflows
        
        return {
            'cash_inflows': cash_inflows,
            'cash_outflows': cash_outflows,
            'other_outflows': other_outflows,
            'net_cash_flow': net_cash_flow,
            'seasonal_factor': seasonal_factor,
            'scenario_adjustments': multiplier
        }
    
    def _calculate_cash_flow_summary(self, projections: List[Dict]) -> Dict[str, Any]:
        """Calculate summary statistics for cash flow projections"""
        net_flows = [p['net_cash_flow'] for p in projections]
        cumulative_flows = [p['cumulative_cash_flow'] for p in projections]
        
        return {
            'total_net_cash_flow': sum(net_flows),
            'average_monthly_flow': statistics.mean(net_flows),
            'cash_flow_volatility': statistics.stdev(net_flows) if len(net_flows) > 1 else 0,
            'minimum_cumulative_position': min(cumulative_flows),
            'maximum_cumulative_position': max(cumulative_flows),
            'months_with_negative_flow': len([f for f in net_flows if f < 0]),
            'months_with_negative_position': len([f for f in cumulative_flows if f < 0])
        }
    
    def _identify_cash_flow_alerts(self, projections: List[Dict]) -> List[Dict[str, Any]]:
        """Identify potential cash flow issues"""
        alerts = []
        
        for i, projection in enumerate(projections):
            # Check for negative cumulative cash flow
            if projection.get('cumulative_cash_flow', 0) < -10000:
                alerts.append({
                    'type': 'liquidity_risk',
                    'month': i + 1,
                    'severity': 'high' if projection['cumulative_cash_flow'] < -50000 else 'medium',
                    'message': f'Negative cumulative cash flow of ${abs(projection["cumulative_cash_flow"]):,.0f}',
                    'recommendation': 'Consider securing additional financing or reducing expenses'
                })
            
            # Check for large negative monthly flows
            if projection.get('net_cash_flow', 0) < -20000:
                alerts.append({
                    'type': 'monthly_deficit',
                    'month': i + 1,
                    'severity': 'medium',
                    'message': f'Large monthly cash deficit of ${abs(projection["net_cash_flow"]):,.0f}',
                    'recommendation': 'Review expense timing and collection procedures'
                })
        
        return alerts
    
    def _analyze_seasonal_patterns(self, projections: List[Dict]) -> Dict[str, Any]:
        """Analyze seasonal patterns in projections"""
        # Group by quarter
        quarterly_flows = {1: [], 2: [], 3: [], 4: []}
        
        for i, proj in enumerate(projections):
            quarter = ((i % 12) // 3) + 1
            quarterly_flows[quarter].append(proj['net_cash_flow'])
        
        quarterly_averages = {q: statistics.mean(flows) if flows else 0 for q, flows in quarterly_flows.items()}
        
        return {
            'quarterly_averages': quarterly_averages,
            'strongest_quarter': max(quarterly_averages, key=quarterly_averages.get),
            'weakest_quarter': min(quarterly_averages, key=quarterly_averages.get),
            'seasonal_variation': max(quarterly_averages.values()) - min(quarterly_averages.values())
        }
    
    def _analyze_liquidity_requirements(self, projections: List[Dict]) -> Dict[str, Any]:
        """Analyze liquidity requirements"""
        min_position = min(p.get('cumulative_cash_flow', 0) for p in projections)
        
        return {
            'minimum_cash_requirement': abs(min_position) if min_position < 0 else 0,
            'recommended_cash_buffer': abs(min_position) * 1.2 if min_position < 0 else 10000,
            'liquidity_risk_level': 'high' if min_position < -50000 else 'medium' if min_position < -10000 else 'low'
        }
    
    def _generate_seasonal_recommendations(self, patterns: Dict) -> List[str]:
        """Generate recommendations based on seasonal patterns"""
        recommendations = []
        
        # Find the most volatile months
        volatility_threshold = 0.2
        high_volatility_months = [month for month, data in patterns.items() 
                                if abs(data['seasonal_index'] - 1.0) > volatility_threshold]
        
        if high_volatility_months:
            recommendations.append(f'Plan for cash flow volatility in {", ".join(high_volatility_months)}')
        
        # Find peak and trough recommendations
        peak_months = [month for month, data in patterns.items() if data['seasonal_index'] > 1.15]
        trough_months = [month for month, data in patterns.items() if data['seasonal_index'] < 0.85]
        
        if peak_months:
            recommendations.append(f'Capitalize on strong cash flow periods: {", ".join(peak_months)}')
        
        if trough_months:
            recommendations.append(f'Prepare for cash flow challenges in: {", ".join(trough_months)}')
        
        return recommendations
    
    def _find_break_even_month(self, scenario_projections: List[Dict]) -> Optional[int]:
        """Find the break-even month for a scenario"""
        for proj in scenario_projections:
            if proj.get('cumulative_impact', 0) >= 0:
                return proj['month']
        return None
    
    def _assess_scenario_risk(self, projections: List[Dict], config: Dict) -> str:
        """Assess risk level of a scenario"""
        min_impact = min(p.get('cumulative_impact', 0) for p in projections)
        
        if min_impact < -100000:
            return 'high'
        elif min_impact < -50000:
            return 'medium'
        else:
            return 'low'
    
    def _summarize_base_projections(self, projections: List[Dict]) -> Dict[str, Any]:
        """Summarize base projections"""
        net_flows = [p.get('net_cash_flow', 0) for p in projections]
        
        return {
            'total_net_flow': sum(net_flows),
            'average_monthly_flow': statistics.mean(net_flows),
            'flow_volatility': statistics.stdev(net_flows) if len(net_flows) > 1 else 0
        }
    
    def _compare_scenarios(self, scenarios: Dict) -> Dict[str, Any]:
        """Compare different scenarios"""
        return {
            'best_case': max(scenarios.keys(), key=lambda k: scenarios[k]['total_impact']),
            'worst_case': min(scenarios.keys(), key=lambda k: scenarios[k]['total_impact']),
            'impact_range': max(s['total_impact'] for s in scenarios.values()) - min(s['total_impact'] for s in scenarios.values())
        }
    
    def _calculate_funding_requirements(self, scenarios: Dict) -> Dict[str, Any]:
        """Calculate funding requirements across scenarios"""
        max_funding = max(abs(s['max_funding_requirement']) for s in scenarios.values())
        
        return {
            'maximum_funding_required': max_funding,
            'scenarios_requiring_funding': [name for name, data in scenarios.items() if data['max_funding_requirement'] < 0],
            'recommended_facility_size': max_funding * 1.25  # 25% buffer
        }
    
    def _calculate_cost_percentage(self, projections: List[Dict], annual_cost: float) -> float:
        """Calculate facility cost as percentage of revenue"""
        total_revenue = sum(p.get('cash_inflows', 0) for p in projections)
        return (annual_cost / total_revenue * 100) if total_revenue > 0 else 0
    
    def _calculate_facility_break_even(self, facility_types: Dict, projections: List[Dict]) -> Dict[str, Any]:
        """Calculate break-even analysis for different facility types"""
        # Simple break-even based on cost vs cash flow improvement
        return {
            'facility_pays_for_itself': True,
            'break_even_months': 6,  # Simplified calculation
            'net_benefit': 10000     # Simplified calculation
        }
    
    def _generate_facility_recommendations(self, facility_types: Dict, projections: List[Dict]) -> List[str]:
        """Generate facility recommendations"""
        recommendations = []
        
        # Find primary recommendation
        primary_facilities = [name for name, data in facility_types.items() 
                            if data.get('recommendation') == 'primary']
        
        if primary_facilities:
            recommendations.append(f'Primary recommendation: {primary_facilities[0]}')
        
        recommendations.append('Negotiate favorable terms including covenant flexibility')
        recommendations.append('Consider seasonal credit line adjustments')
        
        return recommendations