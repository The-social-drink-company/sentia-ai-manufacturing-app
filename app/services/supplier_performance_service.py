"""
Supplier Performance Impact Modeling Service

Models supplier performance metrics and their impact on inventory optimization,
lead times, quality, and supply chain resilience.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import statistics
from collections import defaultdict

from app import db
from app.models.historical_sales import HistoricalSales
from app.models.inventory_level import InventoryLevel


class SupplierRating(Enum):
    EXCELLENT = "A+"
    VERY_GOOD = "A"
    GOOD = "B+"
    ACCEPTABLE = "B"
    BELOW_STANDARD = "C"
    POOR = "D"


class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SupplierMetrics:
    """Core supplier performance metrics"""
    supplier_id: str
    supplier_name: str
    
    # Delivery performance
    on_time_delivery_rate: float  # 0-1
    lead_time_mean_days: float
    lead_time_std_dev: float
    lead_time_variability_coefficient: float
    
    # Quality metrics
    quality_score: float  # 0-1
    defect_rate: float  # 0-1
    return_rate: float  # 0-1
    
    # Cost performance
    price_competitiveness: float  # 0-1 (1 = most competitive)
    cost_stability: float  # 0-1 (1 = most stable)
    payment_terms_score: float  # 0-1
    
    # Capacity and flexibility
    capacity_utilization: float  # 0-1
    capacity_scalability: float  # 0-1
    product_range_flexibility: float  # 0-1
    
    # Communication and service
    communication_responsiveness: float  # 0-1
    technical_support_quality: float  # 0-1
    issue_resolution_speed: float  # 0-1
    
    # Financial stability
    financial_health_score: float  # 0-1
    credit_rating: str
    
    # Compliance and sustainability
    compliance_score: float  # 0-1
    sustainability_rating: float  # 0-1
    
    # Historical data
    total_orders: int = 0
    total_volume: float = 0.0
    relationship_duration_months: int = 0
    
    # Risk assessment
    overall_risk_level: RiskLevel = RiskLevel.MEDIUM
    risk_factors: List[str] = field(default_factory=list)
    
    # Performance trends
    performance_trend_6m: str = "stable"  # improving, stable, declining
    
    def calculate_overall_rating(self) -> SupplierRating:
        """Calculate overall supplier rating based on weighted metrics."""
        weights = {
            'delivery': 0.25,
            'quality': 0.20,
            'cost': 0.15,
            'capacity': 0.15,
            'service': 0.10,
            'financial': 0.10,
            'compliance': 0.05
        }
        
        scores = {
            'delivery': (self.on_time_delivery_rate * 0.6 + 
                        (1 - min(1, self.lead_time_variability_coefficient)) * 0.4),
            'quality': (self.quality_score * 0.7 + 
                       (1 - self.defect_rate) * 0.2 + 
                       (1 - self.return_rate) * 0.1),
            'cost': (self.price_competitiveness * 0.5 + 
                    self.cost_stability * 0.3 + 
                    self.payment_terms_score * 0.2),
            'capacity': (self.capacity_scalability * 0.6 + 
                        self.product_range_flexibility * 0.4),
            'service': (self.communication_responsiveness * 0.4 + 
                       self.technical_support_quality * 0.3 + 
                       self.issue_resolution_speed * 0.3),
            'financial': self.financial_health_score,
            'compliance': (self.compliance_score * 0.6 + 
                          self.sustainability_rating * 0.4)
        }
        
        overall_score = sum(scores[category] * weights[category] 
                          for category in weights.keys())
        
        if overall_score >= 0.95:
            return SupplierRating.EXCELLENT
        elif overall_score >= 0.85:
            return SupplierRating.VERY_GOOD
        elif overall_score >= 0.75:
            return SupplierRating.GOOD
        elif overall_score >= 0.65:
            return SupplierRating.ACCEPTABLE
        elif overall_score >= 0.50:
            return SupplierRating.BELOW_STANDARD
        else:
            return SupplierRating.POOR


@dataclass
class SupplierImpactAnalysis:
    """Analysis of supplier performance impact on inventory optimization"""
    supplier_id: str
    
    # Impact on inventory parameters
    safety_stock_adjustment_factor: float  # Multiplier for safety stock
    reorder_point_adjustment: int  # Additional units for reorder point
    lead_time_buffer_days: float  # Additional lead time buffer
    
    # Cost impacts
    quality_cost_impact: float  # Additional cost due to quality issues
    delivery_cost_impact: float  # Additional cost due to delivery issues
    total_additional_cost_annual: float
    
    # Service level impacts
    service_level_risk: float  # 0-1, risk to achieving target service level
    stockout_probability_increase: float  # Increase in stockout probability
    
    # Recommendations
    optimization_adjustments: Dict[str, float]
    risk_mitigation_strategies: List[str]
    alternative_suppliers: List[str]


class SupplierPerformanceService:
    """
    Service for modeling supplier performance and its impact on inventory optimization.
    
    Provides:
    - Supplier performance evaluation and scoring
    - Impact analysis on inventory parameters
    - Risk assessment and mitigation recommendations
    - Supplier comparison and selection support
    - Performance trend analysis
    """
    
    def __init__(self):
        self.performance_cache = {}
        self.impact_models = {}
        
    def evaluate_supplier_performance(self, 
                                    supplier_id: str,
                                    evaluation_period_months: int = 12) -> SupplierMetrics:
        """
        Evaluate comprehensive supplier performance metrics.
        """
        # In a real implementation, this would pull from:
        # - Purchase order data
        # - Quality control records
        # - Delivery tracking
        # - Financial systems
        # For now, we'll create a realistic example
        
        # This would typically query actual supplier performance data
        metrics = self._calculate_supplier_metrics(supplier_id, evaluation_period_months)
        
        # Cache the results
        self.performance_cache[supplier_id] = metrics
        
        return metrics
    
    def analyze_supplier_impact_on_inventory(self,
                                           supplier_id: str,
                                           product_ids: List[str],
                                           current_inventory_params: Dict[str, Dict]) -> SupplierImpactAnalysis:
        """
        Analyze how supplier performance impacts inventory optimization parameters.
        """
        # Get supplier metrics
        if supplier_id in self.performance_cache:
            metrics = self.performance_cache[supplier_id]
        else:
            metrics = self.evaluate_supplier_performance(supplier_id)
        
        # Calculate impact on safety stock
        # Poor delivery performance requires higher safety stock
        delivery_reliability = metrics.on_time_delivery_rate
        lead_time_variability = metrics.lead_time_variability_coefficient
        
        safety_stock_factor = 1.0
        if delivery_reliability < 0.95:
            safety_stock_factor += (0.95 - delivery_reliability) * 2.0  # Up to 2x increase
        
        if lead_time_variability > 0.2:
            safety_stock_factor += lead_time_variability * 1.5
        
        # Calculate reorder point adjustment
        # Account for quality issues requiring additional buffer
        quality_adjustment = 0
        if metrics.defect_rate > 0.02:  # >2% defect rate
            quality_adjustment = int(metrics.defect_rate * 1000)  # Additional units
        
        # Lead time buffer for unreliable suppliers
        lead_time_buffer = 0.0
        if delivery_reliability < 0.90:
            lead_time_buffer = (0.90 - delivery_reliability) * 10  # Up to 10 days
        
        # Calculate cost impacts
        quality_cost_impact = self._calculate_quality_cost_impact(metrics, product_ids)
        delivery_cost_impact = self._calculate_delivery_cost_impact(metrics, product_ids)
        
        # Service level risk assessment
        service_level_risk = max(0, 0.05 - delivery_reliability + lead_time_variability * 0.5)
        stockout_probability_increase = service_level_risk * 0.5
        
        # Generate optimization adjustments
        optimization_adjustments = {
            'safety_stock_multiplier': safety_stock_factor,
            'reorder_point_addition': quality_adjustment,
            'lead_time_buffer_days': lead_time_buffer,
            'service_level_adjustment': -service_level_risk * 0.1  # Reduce target if supplier unreliable
        }
        
        # Risk mitigation strategies
        mitigation_strategies = self._generate_mitigation_strategies(metrics)
        
        # Alternative suppliers (would be based on actual supplier database)
        alternatives = self._identify_alternative_suppliers(supplier_id, product_ids)
        
        return SupplierImpactAnalysis(
            supplier_id=supplier_id,
            safety_stock_adjustment_factor=safety_stock_factor,
            reorder_point_adjustment=quality_adjustment,
            lead_time_buffer_days=lead_time_buffer,
            quality_cost_impact=quality_cost_impact,
            delivery_cost_impact=delivery_cost_impact,
            total_additional_cost_annual=quality_cost_impact + delivery_cost_impact,
            service_level_risk=service_level_risk,
            stockout_probability_increase=stockout_probability_increase,
            optimization_adjustments=optimization_adjustments,
            risk_mitigation_strategies=mitigation_strategies,
            alternative_suppliers=alternatives
        )
    
    def compare_suppliers(self,
                         supplier_ids: List[str],
                         evaluation_criteria: Dict[str, float] = None) -> Dict[str, any]:
        """
        Compare multiple suppliers across key performance dimensions.
        """
        if evaluation_criteria is None:
            evaluation_criteria = {
                'delivery_performance': 0.25,
                'quality': 0.20,
                'cost': 0.20,
                'capacity': 0.15,
                'service': 0.10,
                'financial_stability': 0.10
            }
        
        supplier_evaluations = {}
        
        for supplier_id in supplier_ids:
            metrics = self.evaluate_supplier_performance(supplier_id)
            
            # Calculate weighted score for each criterion
            scores = {
                'delivery_performance': metrics.on_time_delivery_rate * 0.7 + 
                                      (1 - min(1, metrics.lead_time_variability_coefficient)) * 0.3,
                'quality': metrics.quality_score * 0.8 + (1 - metrics.defect_rate) * 0.2,
                'cost': metrics.price_competitiveness * 0.6 + metrics.cost_stability * 0.4,
                'capacity': metrics.capacity_scalability * 0.6 + metrics.capacity_utilization * 0.4,
                'service': metrics.communication_responsiveness * 0.5 + 
                          metrics.technical_support_quality * 0.5,
                'financial_stability': metrics.financial_health_score
            }
            
            weighted_total = sum(
                scores[criterion] * weight 
                for criterion, weight in evaluation_criteria.items()
            )
            
            supplier_evaluations[supplier_id] = {
                'metrics': metrics,
                'criterion_scores': scores,
                'weighted_total_score': weighted_total,
                'overall_rating': metrics.calculate_overall_rating().value,
                'risk_level': metrics.overall_risk_level.value
            }
        
        # Rank suppliers
        ranked_suppliers = sorted(
            supplier_evaluations.items(),
            key=lambda x: x[1]['weighted_total_score'],
            reverse=True
        )
        
        return {
            'evaluations': supplier_evaluations,
            'ranking': [(supplier_id, evaluation['weighted_total_score']) 
                       for supplier_id, evaluation in ranked_suppliers],
            'evaluation_criteria': evaluation_criteria,
            'evaluation_date': date.today().isoformat()
        }
    
    def generate_supplier_scorecard(self, supplier_id: str) -> Dict[str, any]:
        """
        Generate comprehensive supplier scorecard with KPIs and trends.
        """
        metrics = self.evaluate_supplier_performance(supplier_id)
        
        # KPI categories with traffic light indicators
        kpi_categories = {
            'Delivery Performance': {
                'on_time_delivery': {
                    'value': f"{metrics.on_time_delivery_rate:.1%}",
                    'status': self._get_kpi_status(metrics.on_time_delivery_rate, 0.95, 0.90),
                    'target': '≥95%'
                },
                'lead_time_variability': {
                    'value': f"{metrics.lead_time_variability_coefficient:.2f}",
                    'status': self._get_kpi_status(1 - metrics.lead_time_variability_coefficient, 0.8, 0.6),
                    'target': '<0.20'
                }
            },
            'Quality': {
                'quality_score': {
                    'value': f"{metrics.quality_score:.1%}",
                    'status': self._get_kpi_status(metrics.quality_score, 0.95, 0.90),
                    'target': '≥95%'
                },
                'defect_rate': {
                    'value': f"{metrics.defect_rate:.2%}",
                    'status': self._get_kpi_status(1 - metrics.defect_rate, 0.98, 0.95),
                    'target': '<2%'
                }
            },
            'Cost Performance': {
                'price_competitiveness': {
                    'value': f"{metrics.price_competitiveness:.1%}",
                    'status': self._get_kpi_status(metrics.price_competitiveness, 0.80, 0.70),
                    'target': '≥80%'
                },
                'cost_stability': {
                    'value': f"{metrics.cost_stability:.1%}",
                    'status': self._get_kpi_status(metrics.cost_stability, 0.90, 0.80),
                    'target': '≥90%'
                }
            },
            'Service & Support': {
                'communication_responsiveness': {
                    'value': f"{metrics.communication_responsiveness:.1%}",
                    'status': self._get_kpi_status(metrics.communication_responsiveness, 0.85, 0.75),
                    'target': '≥85%'
                },
                'technical_support': {
                    'value': f"{metrics.technical_support_quality:.1%}",
                    'status': self._get_kpi_status(metrics.technical_support_quality, 0.80, 0.70),
                    'target': '≥80%'
                }
            }
        }
        
        # Overall assessment
        overall_rating = metrics.calculate_overall_rating()
        
        # Risk assessment
        risk_summary = {
            'overall_risk_level': metrics.overall_risk_level.value,
            'key_risk_factors': metrics.risk_factors,
            'mitigation_priority': 'high' if metrics.overall_risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL] else 'medium'
        }
        
        # Performance trends (would use historical data in real implementation)
        performance_trends = {
            'delivery_trend': metrics.performance_trend_6m,
            'quality_trend': metrics.performance_trend_6m,
            'cost_trend': 'stable',
            'overall_trend': metrics.performance_trend_6m
        }
        
        # Action items and recommendations
        action_items = self._generate_supplier_action_items(metrics)
        
        return {
            'supplier_id': supplier_id,
            'supplier_name': metrics.supplier_name,
            'scorecard_date': date.today().isoformat(),
            'overall_rating': overall_rating.value,
            'kpi_categories': kpi_categories,
            'risk_assessment': risk_summary,
            'performance_trends': performance_trends,
            'action_items': action_items,
            'relationship_summary': {
                'duration_months': metrics.relationship_duration_months,
                'total_orders': metrics.total_orders,
                'total_volume': metrics.total_volume
            }
        }
    
    def optimize_supplier_mix(self,
                            product_category: str,
                            demand_forecast: Dict[str, float],
                            available_suppliers: List[str],
                            constraints: Dict[str, any] = None) -> Dict[str, any]:
        """
        Optimize supplier mix for a product category considering performance and risk.
        """
        if constraints is None:
            constraints = {
                'max_suppliers': 3,
                'min_supplier_capacity_share': 0.15,
                'max_supplier_capacity_share': 0.60,
                'risk_diversification_weight': 0.3
            }
        
        # Evaluate all available suppliers
        supplier_evaluations = {}
        for supplier_id in available_suppliers:
            metrics = self.evaluate_supplier_performance(supplier_id)
            impact_analysis = self.analyze_supplier_impact_on_inventory(
                supplier_id, [product_category], {}
            )
            
            supplier_evaluations[supplier_id] = {
                'performance_score': metrics.calculate_overall_rating().value,
                'capacity_available': getattr(metrics, 'capacity_available', 1000),  # Would be real data
                'total_cost_impact': impact_analysis.total_additional_cost_annual,
                'risk_level': metrics.overall_risk_level.value,
                'geographic_location': 'region_1'  # Would be real data
            }
        
        # Calculate optimal allocation
        total_demand = sum(demand_forecast.values())
        optimal_allocation = {}
        
        # Simple greedy optimization (in practice, would use more sophisticated methods)
        # Sort suppliers by performance score adjusted for cost
        sorted_suppliers = sorted(
            supplier_evaluations.items(),
            key=lambda x: x[1]['performance_score'] / (1 + x[1]['total_cost_impact'] / 10000),
            reverse=True
        )
        
        remaining_demand = total_demand
        allocated_suppliers = 0
        max_suppliers = constraints['max_suppliers']
        
        for supplier_id, evaluation in sorted_suppliers:
            if allocated_suppliers >= max_suppliers or remaining_demand <= 0:
                break
            
            # Calculate allocation
            max_allocation = min(
                remaining_demand,
                evaluation['capacity_available'],
                total_demand * constraints['max_supplier_capacity_share']
            )
            
            min_allocation = total_demand * constraints['min_supplier_capacity_share']
            
            if max_allocation >= min_allocation:
                allocation = max_allocation
                optimal_allocation[supplier_id] = {
                    'allocation_volume': allocation,
                    'allocation_percentage': allocation / total_demand,
                    'rationale': f"Primary supplier - high performance score of {evaluation['performance_score']}"
                }
                
                remaining_demand -= allocation
                allocated_suppliers += 1
        
        # Risk assessment of the supplier mix
        risk_assessment = self._assess_supplier_mix_risk(optimal_allocation, supplier_evaluations)
        
        return {
            'optimal_allocation': optimal_allocation,
            'total_demand': total_demand,
            'allocated_demand': total_demand - remaining_demand,
            'unallocated_demand': remaining_demand,
            'supplier_count': len(optimal_allocation),
            'risk_assessment': risk_assessment,
            'cost_impact_summary': {
                'total_additional_cost': sum(
                    supplier_evaluations[sid]['total_cost_impact'] * 
                    allocation['allocation_percentage']
                    for sid, allocation in optimal_allocation.items()
                )
            },
            'recommendations': self._generate_supplier_mix_recommendations(
                optimal_allocation, supplier_evaluations, remaining_demand
            )
        }
    
    def _calculate_supplier_metrics(self, supplier_id: str, period_months: int) -> SupplierMetrics:
        """Calculate supplier metrics from historical data."""
        # In a real implementation, this would query actual data
        # For demonstration, we'll generate realistic metrics
        
        base_performance = np.random.beta(8, 2)  # Skewed toward higher performance
        
        return SupplierMetrics(
            supplier_id=supplier_id,
            supplier_name=f"Supplier {supplier_id}",
            
            # Delivery performance
            on_time_delivery_rate=min(1.0, base_performance + np.random.normal(0, 0.05)),
            lead_time_mean_days=14.0 + np.random.normal(0, 2),
            lead_time_std_dev=2.0 + np.random.exponential(1),
            lead_time_variability_coefficient=np.random.uniform(0.1, 0.3),
            
            # Quality metrics  
            quality_score=min(1.0, base_performance + np.random.normal(0, 0.03)),
            defect_rate=max(0, np.random.exponential(0.01)),
            return_rate=max(0, np.random.exponential(0.005)),
            
            # Cost performance
            price_competitiveness=base_performance * 0.9 + np.random.uniform(0, 0.2),
            cost_stability=base_performance + np.random.normal(0, 0.1),
            payment_terms_score=np.random.uniform(0.7, 1.0),
            
            # Capacity and flexibility
            capacity_utilization=np.random.uniform(0.6, 0.95),
            capacity_scalability=base_performance + np.random.normal(0, 0.1),
            product_range_flexibility=np.random.uniform(0.6, 1.0),
            
            # Communication and service
            communication_responsiveness=base_performance + np.random.normal(0, 0.08),
            technical_support_quality=base_performance + np.random.normal(0, 0.1),
            issue_resolution_speed=base_performance + np.random.normal(0, 0.1),
            
            # Financial stability
            financial_health_score=base_performance + np.random.normal(0, 0.15),
            credit_rating=np.random.choice(['AAA', 'AA+', 'AA', 'A+', 'A', 'BBB+', 'BBB']),
            
            # Compliance and sustainability
            compliance_score=min(1.0, base_performance + np.random.normal(0, 0.05)),
            sustainability_rating=np.random.uniform(0.6, 1.0),
            
            # Historical data
            total_orders=int(np.random.poisson(period_months * 5)),
            total_volume=np.random.exponential(10000),
            relationship_duration_months=np.random.randint(6, 60),
            
            # Risk assessment  
            overall_risk_level=np.random.choice(list(RiskLevel), p=[0.3, 0.4, 0.25, 0.05]),
            risk_factors=[],
            performance_trend_6m=np.random.choice(['improving', 'stable', 'declining'], p=[0.3, 0.5, 0.2])
        )
    
    def _calculate_quality_cost_impact(self, metrics: SupplierMetrics, product_ids: List[str]) -> float:
        """Calculate annual cost impact of quality issues."""
        # Simplified calculation based on defect rate and return rate
        base_annual_volume = 10000  # Would be calculated from actual data
        unit_cost = 50  # Would be from product data
        
        defect_cost = metrics.defect_rate * base_annual_volume * unit_cost * 0.5  # 50% of unit cost for defects
        return_cost = metrics.return_rate * base_annual_volume * unit_cost * 0.3  # 30% for returns
        
        return defect_cost + return_cost
    
    def _calculate_delivery_cost_impact(self, metrics: SupplierMetrics, product_ids: List[str]) -> float:
        """Calculate annual cost impact of delivery issues."""
        # Cost of late deliveries (expediting, stockouts, etc.)
        late_delivery_rate = 1 - metrics.on_time_delivery_rate
        base_annual_orders = 50  # Would be calculated from actual data
        
        expediting_cost = late_delivery_rate * base_annual_orders * 200  # $200 per late order
        stockout_cost = late_delivery_rate * 0.5 * base_annual_orders * 1000  # Potential stockout cost
        
        return expediting_cost + stockout_cost
    
    def _generate_mitigation_strategies(self, metrics: SupplierMetrics) -> List[str]:
        """Generate risk mitigation strategies based on supplier performance."""
        strategies = []
        
        if metrics.on_time_delivery_rate < 0.90:
            strategies.append("Implement delivery performance incentives")
            strategies.append("Increase safety stock levels")
            strategies.append("Develop backup supplier relationships")
        
        if metrics.quality_score < 0.90:
            strategies.append("Implement quality improvement program")
            strategies.append("Increase incoming quality inspection")
            strategies.append("Provide technical support for quality systems")
        
        if metrics.lead_time_variability_coefficient > 0.25:
            strategies.append("Work with supplier on demand planning")
            strategies.append("Implement vendor-managed inventory")
            strategies.append("Increase reorder point buffers")
        
        if metrics.financial_health_score < 0.70:
            strategies.append("Monitor financial health closely")
            strategies.append("Reduce payment terms risk")
            strategies.append("Develop alternative suppliers")
        
        if metrics.capacity_utilization > 0.90:
            strategies.append("Secure capacity commitments")
            strategies.append("Develop alternative capacity sources")
        
        return strategies
    
    def _identify_alternative_suppliers(self, supplier_id: str, product_ids: List[str]) -> List[str]:
        """Identify alternative suppliers for the product categories."""
        # In real implementation, would query supplier database
        # For now, generate example alternatives
        return [f"ALT_SUPPLIER_{i}" for i in range(1, 4)]
    
    def _get_kpi_status(self, value: float, good_threshold: float, acceptable_threshold: float) -> str:
        """Get traffic light status for KPI."""
        if value >= good_threshold:
            return 'green'
        elif value >= acceptable_threshold:
            return 'yellow'
        else:
            return 'red'
    
    def _generate_supplier_action_items(self, metrics: SupplierMetrics) -> List[Dict[str, str]]:
        """Generate action items based on supplier performance."""
        actions = []
        
        if metrics.on_time_delivery_rate < 0.95:
            actions.append({
                'priority': 'high',
                'category': 'delivery',
                'action': 'Schedule delivery performance review meeting',
                'due_date': (date.today() + timedelta(days=14)).isoformat()
            })
        
        if metrics.quality_score < 0.90:
            actions.append({
                'priority': 'high',
                'category': 'quality',
                'action': 'Conduct quality system audit',
                'due_date': (date.today() + timedelta(days=30)).isoformat()
            })
        
        if metrics.communication_responsiveness < 0.80:
            actions.append({
                'priority': 'medium',
                'category': 'service',
                'action': 'Establish improved communication protocols',
                'due_date': (date.today() + timedelta(days=21)).isoformat()
            })
        
        return actions
    
    def _assess_supplier_mix_risk(self, allocation: Dict, supplier_evaluations: Dict) -> Dict:
        """Assess risk of the supplier mix allocation."""
        total_allocation = sum(a['allocation_percentage'] for a in allocation.values())
        
        # Geographic concentration risk
        locations = [supplier_evaluations[sid]['geographic_location'] for sid in allocation.keys()]
        location_concentration = max(locations.count(loc) / len(locations) for loc in set(locations))
        
        # Performance risk
        weighted_performance = sum(
            supplier_evaluations[sid]['performance_score'] * allocation[sid]['allocation_percentage']
            for sid in allocation.keys()
        )
        
        # Capacity concentration risk
        max_supplier_share = max(a['allocation_percentage'] for a in allocation.values())
        
        return {
            'overall_risk_score': (location_concentration * 0.3 + 
                                 (1 - weighted_performance) * 0.4 + 
                                 max_supplier_share * 0.3),
            'geographic_concentration_risk': location_concentration,
            'performance_risk': 1 - weighted_performance,
            'capacity_concentration_risk': max_supplier_share,
            'diversification_score': len(allocation) / 5.0  # Normalized to max 5 suppliers
        }
    
    def _generate_supplier_mix_recommendations(self, 
                                            allocation: Dict, 
                                            supplier_evaluations: Dict, 
                                            unallocated_demand: float) -> List[str]:
        """Generate recommendations for supplier mix optimization."""
        recommendations = []
        
        if unallocated_demand > 0:
            recommendations.append(f"Address {unallocated_demand:.0f} units of unallocated demand")
        
        if len(allocation) < 2:
            recommendations.append("Consider adding secondary supplier for risk mitigation")
        
        max_allocation = max(a['allocation_percentage'] for a in allocation.values())
        if max_allocation > 0.7:
            recommendations.append("Consider reducing dependency on primary supplier")
        
        # Check for performance issues
        for supplier_id, alloc in allocation.items():
            perf_score = supplier_evaluations[supplier_id]['performance_score']
            if perf_score < 0.7 and alloc['allocation_percentage'] > 0.3:
                recommendations.append(f"Review allocation to {supplier_id} due to performance concerns")
        
        return recommendations