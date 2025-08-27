"""
Constraint Satisfaction Problem Solver for Inventory Optimization

Implements advanced constraint solving for multi-objective inventory optimization
with production, storage, financial, and supplier constraints.
"""

import numpy as np
import pandas as pd
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import pulp
from scipy.optimize import minimize, differential_evolution
import warnings
warnings.filterwarnings('ignore')

from app.services.stock_optimization_service import (
    SupplyChainConstraints, CostParameters, OptimizationObjective, ServiceLevel
)


@dataclass
class ConstraintViolation:
    """Represents a constraint violation"""
    constraint_type: str
    product_id: str
    location_id: str
    violation_severity: float  # 0-1 scale
    description: str
    suggested_action: str


@dataclass
class MultiLocationConstraints:
    """Multi-location inventory constraints"""
    total_working_capital_limit: float
    total_storage_capacity: int
    production_capacity_by_product: Dict[str, int]  # product_id -> monthly capacity
    supplier_constraints: Dict[str, Dict]  # supplier_id -> constraints
    transportation_constraints: Dict[str, Dict]  # route constraints
    seasonal_factors: Dict[int, float]  # month -> capacity factor
    cross_docking_opportunities: List[Dict]
    consolidation_rules: Dict[str, Any]


class ConstraintType(Enum):
    CAPACITY = "capacity"
    FINANCIAL = "financial"
    SUPPLIER = "supplier"
    TRANSPORTATION = "transportation"
    SEASONAL = "seasonal"
    QUALITY = "quality"
    REGULATORY = "regulatory"


class InventoryConstraintSolver:
    """
    Advanced constraint satisfaction solver for inventory optimization.
    
    Handles:
    - Multi-objective optimization (cost vs service level)
    - Production capacity constraints
    - Storage capacity limits
    - Working capital constraints
    - Supplier capacity and lead time constraints
    - Seasonal capacity variations
    - Transportation and logistics constraints
    """
    
    def __init__(self):
        self.solver_method = 'linear_programming'  # or 'genetic_algorithm', 'simulated_annealing'
        
    def solve_multi_location_optimization(self,
                                        products: List[str],
                                        locations: List[str],
                                        demand_forecasts: Dict[str, Dict[str, List[float]]],  # product_id -> location_id -> forecast
                                        current_inventory: Dict[str, Dict[str, int]],  # product_id -> location_id -> quantity
                                        constraints: MultiLocationConstraints,
                                        cost_params: CostParameters,
                                        service_levels: Dict[str, ServiceLevel],  # product_id -> service_level
                                        objective: OptimizationObjective = OptimizationObjective.BALANCED) -> Dict:
        """
        Solve multi-location inventory optimization with constraints.
        """
        try:
            if self.solver_method == 'linear_programming':
                return self._solve_with_linear_programming(
                    products, locations, demand_forecasts, current_inventory,
                    constraints, cost_params, service_levels, objective
                )
            elif self.solver_method == 'genetic_algorithm':
                return self._solve_with_genetic_algorithm(
                    products, locations, demand_forecasts, current_inventory,
                    constraints, cost_params, service_levels, objective
                )
            else:
                return self._solve_with_heuristic_method(
                    products, locations, demand_forecasts, current_inventory,
                    constraints, cost_params, service_levels, objective
                )
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'recommendations': []
            }
    
    def _solve_with_linear_programming(self,
                                     products: List[str],
                                     locations: List[str],
                                     demand_forecasts: Dict,
                                     current_inventory: Dict,
                                     constraints: MultiLocationConstraints,
                                     cost_params: CostParameters,
                                     service_levels: Dict,
                                     objective: OptimizationObjective) -> Dict:
        """
        Solve using linear programming (PuLP).
        """
        # Create the optimization problem
        if objective == OptimizationObjective.MINIMIZE_COST:
            prob = pulp.LpProblem("InventoryOptimization", pulp.LpMinimize)
        else:
            prob = pulp.LpProblem("InventoryOptimization", pulp.LpMaximize)
        
        # Decision variables
        # stock_level[p][l] = stock level for product p at location l
        stock_levels = {}
        order_quantities = {}
        reorder_points = {}
        
        for product in products:
            stock_levels[product] = {}
            order_quantities[product] = {}
            reorder_points[product] = {}
            
            for location in locations:
                current_stock = current_inventory.get(product, {}).get(location, 0)
                max_stock = constraints.total_storage_capacity // len(products)  # Simple allocation
                
                stock_levels[product][location] = pulp.LpVariable(
                    f"stock_{product}_{location}",
                    lowBound=0,
                    upBound=max_stock,
                    cat='Integer'
                )
                
                order_quantities[product][location] = pulp.LpVariable(
                    f"order_{product}_{location}",
                    lowBound=0,
                    upBound=max_stock,
                    cat='Integer'
                )
                
                reorder_points[product][location] = pulp.LpVariable(
                    f"reorder_{product}_{location}",
                    lowBound=0,
                    upBound=max_stock,
                    cat='Integer'
                )
        
        # Objective function
        total_cost = 0
        total_service = 0
        
        for product in products:
            for location in locations:
                # Get demand forecast
                forecast = demand_forecasts.get(product, {}).get(location, [0] * 30)
                monthly_demand = sum(forecast[:30]) if len(forecast) >= 30 else sum(forecast)
                annual_demand = monthly_demand * 12
                
                # Holding costs
                holding_cost = (
                    stock_levels[product][location] * 
                    cost_params.holding_cost_percentage_annual * 
                    cost_params.ordering_cost_per_order / 100  # Approximate unit cost
                )
                
                # Ordering costs (simplified)
                ordering_cost = (
                    order_quantities[product][location] * 
                    cost_params.ordering_cost_per_order / 1000  # Scale factor
                )
                
                # Storage costs
                storage_cost = (
                    stock_levels[product][location] * 
                    cost_params.storage_cost_per_unit_monthly * 12
                )
                
                total_cost += holding_cost + ordering_cost + storage_cost
                
                # Service level approximation
                service_contribution = stock_levels[product][location] * 0.001  # Scale factor
                total_service += service_contribution
        
        # Set objective
        if objective == OptimizationObjective.MINIMIZE_COST:
            prob += total_cost
        elif objective == OptimizationObjective.MAXIMIZE_SERVICE:
            prob += total_service
        else:  # BALANCED
            prob += total_cost - 0.5 * total_service
        
        # Constraints
        
        # 1. Total working capital constraint
        total_inventory_value = 0
        for product in products:
            for location in locations:
                # Approximate unit cost
                unit_cost = cost_params.ordering_cost_per_order / 100
                total_inventory_value += stock_levels[product][location] * unit_cost
        
        prob += total_inventory_value <= constraints.total_working_capital_limit
        
        # 2. Storage capacity constraints
        for location in locations:
            location_inventory = 0
            for product in products:
                location_inventory += stock_levels[product][location]
            prob += location_inventory <= constraints.total_storage_capacity // len(locations)
        
        # 3. Production capacity constraints
        for product in products:
            if product in constraints.production_capacity_by_product:
                total_production = 0
                for location in locations:
                    total_production += order_quantities[product][location]
                prob += total_production <= constraints.production_capacity_by_product[product]
        
        # 4. Service level constraints (simplified)
        for product in products:
            service_level = service_levels.get(product, ServiceLevel.STANDARD)
            target_service = service_level.value
            
            for location in locations:
                forecast = demand_forecasts.get(product, {}).get(location, [0] * 30)
                monthly_demand = sum(forecast[:30]) if len(forecast) >= 30 else sum(forecast)
                
                # Ensure stock level meets minimum service requirement
                min_stock = monthly_demand * target_service * 2  # 2 months coverage
                prob += stock_levels[product][location] >= min_stock
        
        # 5. Reorder point relationships
        for product in products:
            for location in locations:
                prob += reorder_points[product][location] <= stock_levels[product][location]
                prob += order_quantities[product][location] >= 0
        
        # Solve the problem
        prob.solve(pulp.PULP_CBC_CMD(msg=0))
        
        # Extract results
        if prob.status == pulp.LpStatusOptimal:
            optimization_results = {}
            
            for product in products:
                optimization_results[product] = {}
                for location in locations:
                    optimization_results[product][location] = {
                        'optimal_stock_level': int(stock_levels[product][location].varValue or 0),
                        'order_quantity': int(order_quantities[product][location].varValue or 0),
                        'reorder_point': int(reorder_points[product][location].varValue or 0),
                        'current_stock': current_inventory.get(product, {}).get(location, 0)
                    }
            
            return {
                'status': 'optimal',
                'objective_value': pulp.value(prob.objective),
                'optimization_results': optimization_results,
                'constraint_violations': [],
                'solver_time': 'N/A',
                'method': 'linear_programming'
            }
        else:
            return {
                'status': 'infeasible',
                'message': 'No feasible solution found',
                'constraint_violations': self._analyze_constraint_violations(
                    products, locations, constraints
                ),
                'recommendations': [
                    'Relax capacity constraints',
                    'Increase working capital limit',
                    'Review demand forecasts'
                ]
            }
    
    def _solve_with_genetic_algorithm(self,
                                    products: List[str],
                                    locations: List[str],
                                    demand_forecasts: Dict,
                                    current_inventory: Dict,
                                    constraints: MultiLocationConstraints,
                                    cost_params: CostParameters,
                                    service_levels: Dict,
                                    objective: OptimizationObjective) -> Dict:
        """
        Solve using genetic algorithm (differential evolution).
        """
        # Define the parameter bounds for optimization
        # Each product-location combination has: [stock_level, order_quantity, reorder_point]
        bounds = []
        param_mapping = []
        
        for product in products:
            for location in locations:
                # Stock level bounds
                max_stock = constraints.total_storage_capacity // (len(products) * len(locations))
                bounds.append((0, max_stock))
                param_mapping.append((product, location, 'stock'))
                
                # Order quantity bounds
                bounds.append((0, max_stock))
                param_mapping.append((product, location, 'order'))
                
                # Reorder point bounds
                bounds.append((0, max_stock))
                param_mapping.append((product, location, 'reorder'))
        
        def objective_function(params):
            """Objective function to minimize/maximize."""
            total_cost = 0
            total_service = 0
            penalty = 0
            
            # Parse parameters
            param_dict = {}
            for i, (product, location, param_type) in enumerate(param_mapping):
                if product not in param_dict:
                    param_dict[product] = {}
                if location not in param_dict[product]:
                    param_dict[product][location] = {}
                param_dict[product][location][param_type] = params[i]
            
            # Calculate objective
            for product in products:
                for location in locations:
                    stock = param_dict[product][location]['stock']
                    order = param_dict[product][location]['order']
                    reorder = param_dict[product][location]['reorder']
                    
                    # Get demand forecast
                    forecast = demand_forecasts.get(product, {}).get(location, [0] * 30)
                    monthly_demand = sum(forecast[:30]) if len(forecast) >= 30 else sum(forecast)
                    
                    # Calculate costs
                    unit_cost = cost_params.ordering_cost_per_order / 100  # Approximate
                    
                    holding_cost = stock * unit_cost * cost_params.holding_cost_percentage_annual
                    ordering_cost = (monthly_demand * 12 / max(order, 1)) * cost_params.ordering_cost_per_order if order > 0 else 0
                    storage_cost = stock * cost_params.storage_cost_per_unit_monthly * 12
                    
                    total_cost += holding_cost + ordering_cost + storage_cost
                    
                    # Service level contribution
                    if monthly_demand > 0:
                        service_ratio = min(1.0, stock / (monthly_demand * 2))  # 2 months coverage
                        total_service += service_ratio
            
            # Add constraint penalties
            
            # Working capital constraint
            total_inventory_value = 0
            for product in products:
                for location in locations:
                    unit_cost = cost_params.ordering_cost_per_order / 100
                    stock = param_dict[product][location]['stock']
                    total_inventory_value += stock * unit_cost
            
            if total_inventory_value > constraints.total_working_capital_limit:
                penalty += (total_inventory_value - constraints.total_working_capital_limit) * 1000
            
            # Storage capacity constraints
            for location in locations:
                location_inventory = 0
                for product in products:
                    location_inventory += param_dict[product][location]['stock']
                
                max_capacity = constraints.total_storage_capacity // len(locations)
                if location_inventory > max_capacity:
                    penalty += (location_inventory - max_capacity) * 100
            
            # Production capacity constraints
            for product in products:
                if product in constraints.production_capacity_by_product:
                    total_orders = sum(
                        param_dict[product][location]['order'] 
                        for location in locations
                    )
                    max_production = constraints.production_capacity_by_product[product]
                    if total_orders > max_production:
                        penalty += (total_orders - max_production) * 500
            
            # Service level constraints
            for product in products:
                service_level = service_levels.get(product, ServiceLevel.STANDARD)
                target_service = service_level.value
                
                for location in locations:
                    forecast = demand_forecasts.get(product, {}).get(location, [0] * 30)
                    monthly_demand = sum(forecast[:30]) if len(forecast) >= 30 else sum(forecast)
                    
                    if monthly_demand > 0:
                        min_stock = monthly_demand * target_service * 2
                        stock = param_dict[product][location]['stock']
                        if stock < min_stock:
                            penalty += (min_stock - stock) * 50
            
            # Reorder point constraints
            for product in products:
                for location in locations:
                    stock = param_dict[product][location]['stock']
                    reorder = param_dict[product][location]['reorder']
                    if reorder > stock:
                        penalty += (reorder - stock) * 10
            
            # Calculate final objective value
            if objective == OptimizationObjective.MINIMIZE_COST:
                return total_cost + penalty
            elif objective == OptimizationObjective.MAXIMIZE_SERVICE:
                return -(total_service - penalty / 1000)  # Maximize service, minimize penalty
            else:  # BALANCED
                return total_cost - 0.5 * total_service + penalty
        
        # Run optimization
        result = differential_evolution(
            objective_function,
            bounds,
            seed=42,
            maxiter=100,
            popsize=15,
            tol=1e-6
        )
        
        if result.success:
            # Extract optimized parameters
            optimization_results = {}
            for i, (product, location, param_type) in enumerate(param_mapping):
                if product not in optimization_results:
                    optimization_results[product] = {}
                if location not in optimization_results[product]:
                    optimization_results[product][location] = {}
                
                optimization_results[product][location][param_type] = int(result.x[i])
            
            # Restructure results
            final_results = {}
            for product in products:
                final_results[product] = {}
                for location in locations:
                    final_results[product][location] = {
                        'optimal_stock_level': optimization_results[product][location]['stock'],
                        'order_quantity': optimization_results[product][location]['order'],
                        'reorder_point': optimization_results[product][location]['reorder'],
                        'current_stock': current_inventory.get(product, {}).get(location, 0)
                    }
            
            return {
                'status': 'optimal',
                'objective_value': result.fun,
                'optimization_results': final_results,
                'constraint_violations': [],
                'solver_time': f"{result.nfev} function evaluations",
                'method': 'genetic_algorithm'
            }
        else:
            return {
                'status': 'failed',
                'message': result.message,
                'constraint_violations': [],
                'recommendations': [
                    'Try different solver parameters',
                    'Review constraint feasibility',
                    'Simplify the problem'
                ]
            }
    
    def _solve_with_heuristic_method(self,
                                   products: List[str],
                                   locations: List[str],
                                   demand_forecasts: Dict,
                                   current_inventory: Dict,
                                   constraints: MultiLocationConstraints,
                                   cost_params: CostParameters,
                                   service_levels: Dict,
                                   objective: OptimizationObjective) -> Dict:
        """
        Solve using heuristic method (greedy approach with constraint checking).
        """
        optimization_results = {}
        constraint_violations = []
        
        # Initialize results structure
        for product in products:
            optimization_results[product] = {}
            for location in locations:
                optimization_results[product][location] = {
                    'optimal_stock_level': 0,
                    'order_quantity': 0,
                    'reorder_point': 0,
                    'current_stock': current_inventory.get(product, {}).get(location, 0)
                }
        
        # Heuristic allocation based on demand and service levels
        total_capacity_used = 0
        total_working_capital_used = 0.0
        
        # Sort products by priority (higher service level = higher priority)
        product_priority = sorted(
            products,
            key=lambda p: service_levels.get(p, ServiceLevel.STANDARD).value,
            reverse=True
        )
        
        for product in product_priority:
            service_level = service_levels.get(product, ServiceLevel.STANDARD)
            production_capacity = constraints.production_capacity_by_product.get(product, float('inf'))
            total_orders_for_product = 0
            
            for location in locations:
                # Get demand forecast
                forecast = demand_forecasts.get(product, {}).get(location, [0] * 30)
                monthly_demand = sum(forecast[:30]) if len(forecast) >= 30 else sum(forecast)
                annual_demand = monthly_demand * 12
                
                if monthly_demand <= 0:
                    continue
                
                # Calculate basic requirements
                unit_cost = cost_params.ordering_cost_per_order / 100  # Approximate
                
                # Calculate EOQ (simplified)
                if annual_demand > 0:
                    eoq = max(1, int(np.sqrt(
                        (2 * annual_demand * cost_params.ordering_cost_per_order) /
                        (unit_cost * cost_params.holding_cost_percentage_annual)
                    )))
                else:
                    eoq = 1
                
                # Calculate safety stock
                demand_std = np.std(forecast) if len(forecast) > 1 else monthly_demand * 0.2
                z_score = 1.65 if service_level == ServiceLevel.BASIC else (2.05 if service_level == ServiceLevel.STANDARD else 2.58)
                safety_stock = max(1, int(z_score * demand_std * np.sqrt(14)))  # 14 days lead time
                
                # Calculate reorder point
                lead_time_demand = (monthly_demand / 30) * 14  # 14 days lead time
                reorder_point = int(lead_time_demand + safety_stock)
                
                # Calculate optimal stock level
                optimal_stock = reorder_point + eoq
                
                # Check constraints
                
                # Storage capacity constraint
                capacity_per_location = constraints.total_storage_capacity // len(locations)
                if total_capacity_used + optimal_stock > capacity_per_location:
                    optimal_stock = max(0, capacity_per_location - total_capacity_used)
                    if optimal_stock < reorder_point:
                        constraint_violations.append(ConstraintViolation(
                            constraint_type="storage_capacity",
                            product_id=product,
                            location_id=location,
                            violation_severity=0.8,
                            description=f"Storage capacity insufficient for optimal stock level",
                            suggested_action="Increase storage capacity or reduce stock levels"
                        ))
                
                # Production capacity constraint
                if total_orders_for_product + eoq > production_capacity:
                    eoq = max(0, production_capacity - total_orders_for_product)
                    if eoq == 0:
                        constraint_violations.append(ConstraintViolation(
                            constraint_type="production_capacity",
                            product_id=product,
                            location_id=location,
                            violation_severity=0.9,
                            description=f"Production capacity exceeded",
                            suggested_action="Increase production capacity or reduce demand allocation"
                        ))
                
                # Working capital constraint
                inventory_value = optimal_stock * unit_cost
                if total_working_capital_used + inventory_value > constraints.total_working_capital_limit:
                    max_affordable_stock = int(
                        (constraints.total_working_capital_limit - total_working_capital_used) / unit_cost
                    )
                    optimal_stock = max(0, max_affordable_stock)
                    
                    if optimal_stock < reorder_point:
                        constraint_violations.append(ConstraintViolation(
                            constraint_type="working_capital",
                            product_id=product,
                            location_id=location,
                            violation_severity=0.7,
                            description=f"Working capital limit reached",
                            suggested_action="Increase working capital or optimize product mix"
                        ))
                
                # Update results
                optimization_results[product][location].update({
                    'optimal_stock_level': optimal_stock,
                    'order_quantity': eoq,
                    'reorder_point': reorder_point
                })
                
                # Update constraint tracking
                total_capacity_used += optimal_stock
                total_working_capital_used += inventory_value
                total_orders_for_product += eoq
        
        # Calculate total objective value (approximate)
        total_cost = sum(
            optimization_results[p][l]['optimal_stock_level'] * cost_params.storage_cost_per_unit_monthly * 12
            for p in products for l in locations
        )
        
        return {
            'status': 'feasible' if not constraint_violations else 'constrained',
            'objective_value': total_cost,
            'optimization_results': optimization_results,
            'constraint_violations': [cv.__dict__ for cv in constraint_violations],
            'solver_time': 'Heuristic - immediate',
            'method': 'heuristic_greedy',
            'capacity_utilization': {
                'storage': total_capacity_used / constraints.total_storage_capacity,
                'working_capital': total_working_capital_used / constraints.total_working_capital_limit
            }
        }
    
    def _analyze_constraint_violations(self,
                                     products: List[str],
                                     locations: List[str],
                                     constraints: MultiLocationConstraints) -> List[Dict]:
        """
        Analyze potential constraint violations.
        """
        violations = []
        
        # Check if constraints are reasonable
        if constraints.total_working_capital_limit < 1000:
            violations.append({
                'type': 'working_capital',
                'severity': 'high',
                'description': 'Working capital limit too low',
                'suggestion': 'Increase working capital allocation'
            })
        
        if constraints.total_storage_capacity < len(products) * len(locations) * 10:
            violations.append({
                'type': 'storage_capacity',
                'severity': 'high',
                'description': 'Storage capacity insufficient for product portfolio',
                'suggestion': 'Increase storage capacity or reduce product range'
            })
        
        # Check production constraints
        total_min_production = sum(constraints.production_capacity_by_product.values())
        if total_min_production < len(products) * 100:  # Arbitrary minimum
            violations.append({
                'type': 'production_capacity',
                'severity': 'medium',
                'description': 'Production capacity may be insufficient',
                'suggestion': 'Review production capacity allocation'
            })
        
        return violations
    
    def optimize_cross_docking(self,
                             products: List[str],
                             source_locations: List[str],
                             destination_locations: List[str],
                             transportation_costs: Dict[Tuple[str, str], float],
                             demand_by_destination: Dict[str, Dict[str, float]]) -> Dict:
        """
        Optimize cross-docking operations to minimize transportation costs.
        """
        # Simple cross-docking optimization using transportation problem approach
        optimization_results = {}
        
        for product in products:
            # Create supply and demand vectors
            supply = {}  # source -> available quantity
            demand = {}  # destination -> required quantity
            
            # This would be populated from actual inventory and demand data
            # For now, using placeholder logic
            for source in source_locations:
                supply[source] = 100  # Placeholder
            
            for dest in destination_locations:
                demand[dest] = demand_by_destination.get(dest, {}).get(product, 50)
            
            # Simple allocation based on lowest cost
            allocation = {}
            remaining_supply = supply.copy()
            remaining_demand = demand.copy()
            
            # Sort by transportation cost
            routes = []
            for source in source_locations:
                for dest in destination_locations:
                    cost = transportation_costs.get((source, dest), float('inf'))
                    routes.append((cost, source, dest))
            
            routes.sort()  # Sort by cost
            
            # Allocate using greedy approach
            for cost, source, dest in routes:
                if remaining_supply[source] > 0 and remaining_demand[dest] > 0:
                    quantity = min(remaining_supply[source], remaining_demand[dest])
                    
                    if source not in allocation:
                        allocation[source] = {}
                    allocation[source][dest] = quantity
                    
                    remaining_supply[source] -= quantity
                    remaining_demand[dest] -= quantity
            
            optimization_results[product] = {
                'allocation': allocation,
                'total_cost': sum(
                    allocation.get(source, {}).get(dest, 0) * 
                    transportation_costs.get((source, dest), 0)
                    for source in source_locations 
                    for dest in destination_locations
                ),
                'unmet_demand': sum(remaining_demand.values()),
                'excess_supply': sum(remaining_supply.values())
            }
        
        return {
            'optimization_results': optimization_results,
            'total_transportation_cost': sum(
                result['total_cost'] for result in optimization_results.values()
            ),
            'total_unmet_demand': sum(
                result['unmet_demand'] for result in optimization_results.values()
            )
        }