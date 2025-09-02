"""
Business logic unit tests for core manufacturing operations.
Tests for forecasting, optimization, scheduling, and financial calculations.
"""
import pytest
from datetime import datetime, timedelta, date
from decimal import Decimal
from unittest.mock import Mock, patch, MagicMock
import pandas as pd
import numpy as np

from app.services.forecasting_service import ForecastingService
from app.services.stock_optimization_service import StockOptimizationService
from app.services.cash_flow_service import CashFlowService
from app.services.constraint_solver import ConstraintSolver
from app.models import Product, InventoryLevel, HistoricalSales, Forecast, WorkingCapital


class TestForecastingBusinessLogic:
    """Test forecasting service business logic."""
    
    @pytest.fixture
    def forecasting_service(self):
        """Create forecasting service instance."""
        return ForecastingService()
    
    @pytest.fixture
    def sample_sales_data(self):
        """Create sample historical sales data."""
        dates = pd.date_range('2024-01-01', '2024-12-31', freq='D')
        return pd.DataFrame({
            'date': dates,
            'quantity_sold': np.random.poisson(50, len(dates)),
            'revenue': np.random.normal(1000, 100, len(dates))
        })
    
    def test_moving_average_calculation(self, forecasting_service, sample_sales_data):
        """Test moving average forecast calculation - TC-FORE-001."""
        window_size = 7
        
        # Calculate moving average manually for verification
        expected_ma = sample_sales_data['quantity_sold'].rolling(window=window_size).mean().iloc[-1]
        
        with patch.object(forecasting_service, 'get_historical_data', return_value=sample_sales_data):
            result = forecasting_service.calculate_moving_average('product-id', 'market-id', window_size)
            
            assert abs(result - expected_ma) < 0.01  # Allow small floating point differences
    
    def test_seasonal_decomposition(self, forecasting_service, sample_sales_data):
        """Test seasonal decomposition logic - TC-FORE-002."""
        # Add seasonal pattern to test data
        seasonal_data = sample_sales_data.copy()
        seasonal_data['day_of_year'] = seasonal_data['date'].dt.dayofyear
        seasonal_data['seasonal_factor'] = 1 + 0.2 * np.sin(2 * np.pi * seasonal_data['day_of_year'] / 365)
        seasonal_data['quantity_sold'] = seasonal_data['quantity_sold'] * seasonal_data['seasonal_factor']
        
        with patch.object(forecasting_service, 'get_historical_data', return_value=seasonal_data):
            result = forecasting_service.detect_seasonality('product-id', 'market-id')
            
            assert 'seasonal_period' in result
            assert 'seasonal_strength' in result
            assert result['seasonal_strength'] > 0
    
    def test_trend_analysis(self, forecasting_service, sample_sales_data):
        """Test trend analysis calculation."""
        # Add linear trend to test data
        trend_data = sample_sales_data.copy()
        trend_data['quantity_sold'] = trend_data['quantity_sold'] + np.arange(len(trend_data)) * 0.1
        
        with patch.object(forecasting_service, 'get_historical_data', return_value=trend_data):
            result = forecasting_service.calculate_trend('product-id', 'market-id')
            
            assert 'trend_slope' in result
            assert 'trend_intercept' in result
            assert result['trend_slope'] > 0  # Should detect upward trend
    
    def test_forecast_accuracy_metrics(self, forecasting_service):
        """Test forecast accuracy calculation - TC-FORE-003."""
        actual = [100, 110, 95, 105, 120]
        predicted = [98, 112, 92, 108, 118]
        
        accuracy = forecasting_service.calculate_forecast_accuracy(actual, predicted)
        
        # Calculate expected MAPE (Mean Absolute Percentage Error)
        mape_values = [abs((a - p) / a) * 100 for a, p in zip(actual, predicted)]
        expected_mape = sum(mape_values) / len(mape_values)
        expected_accuracy = 100 - expected_mape
        
        assert abs(accuracy - expected_accuracy) < 0.01
    
    def test_confidence_interval_calculation(self, forecasting_service, sample_sales_data):
        """Test confidence interval calculation - TC-FORE-005."""
        with patch.object(forecasting_service, 'get_historical_data', return_value=sample_sales_data):
            result = forecasting_service.generate_forecast_with_confidence(
                'product-id', 'market-id', days=30, confidence_level=0.95
            )
            
            assert 'forecast' in result
            assert 'lower_bound' in result
            assert 'upper_bound' in result
            assert len(result['forecast']) == 30
            
            # Lower bound should be less than forecast, upper bound should be greater
            for i in range(len(result['forecast'])):
                assert result['lower_bound'][i] <= result['forecast'][i]
                assert result['forecast'][i] <= result['upper_bound'][i]
    
    def test_multi_step_ahead_forecast(self, forecasting_service, sample_sales_data):
        """Test multi-step ahead forecasting."""
        forecast_horizons = [7, 14, 30, 90]
        
        with patch.object(forecasting_service, 'get_historical_data', return_value=sample_sales_data):
            for horizon in forecast_horizons:
                result = forecasting_service.generate_simple_forecast(
                    'product-id', 'market-id', days=horizon
                )
                
                assert len(result['predicted_quantities']) == horizon
                assert len(result['forecast_dates']) == horizon
                assert all(q > 0 for q in result['predicted_quantities'])  # Quantities should be positive
    
    def test_forecast_model_comparison(self, forecasting_service, sample_sales_data):
        """Test comparison of different forecasting models."""
        models = ['moving_average', 'exponential_smoothing', 'linear_regression']
        
        with patch.object(forecasting_service, 'get_historical_data', return_value=sample_sales_data):
            results = {}
            
            for model in models:
                if hasattr(forecasting_service, f'generate_{model}_forecast'):
                    method = getattr(forecasting_service, f'generate_{model}_forecast')
                    results[model] = method('product-id', 'market-id', days=30)
            
            # All models should produce forecasts of the same length
            if results:
                forecast_lengths = [len(result['predicted_quantities']) for result in results.values()]
                assert all(length == 30 for length in forecast_lengths)


class TestStockOptimizationLogic:
    """Test stock optimization business logic."""
    
    @pytest.fixture
    def optimization_service(self):
        """Create stock optimization service instance."""
        return StockOptimizationService()
    
    def test_eoq_calculation(self, optimization_service):
        """Test Economic Order Quantity calculation - TC-STOCK-004."""
        annual_demand = 1000
        ordering_cost = Decimal('50.00')
        holding_cost = Decimal('2.00')
        
        eoq = optimization_service.calculate_eoq(annual_demand, ordering_cost, holding_cost)
        
        # EOQ formula: sqrt(2 * D * S / H)
        expected_eoq = (2 * annual_demand * float(ordering_cost) / float(holding_cost)) ** 0.5
        
        assert abs(float(eoq) - expected_eoq) < 0.01
    
    def test_safety_stock_calculation(self, optimization_service):
        """Test safety stock calculation - TC-STOCK-002."""
        demand_std_dev = 15
        lead_time_days = 7
        service_level = 0.95
        
        safety_stock = optimization_service.calculate_safety_stock(
            demand_std_dev, lead_time_days, service_level
        )
        
        # Safety stock should be positive
        assert safety_stock > 0
        
        # Higher service level should result in higher safety stock
        higher_service_level = 0.99
        higher_safety_stock = optimization_service.calculate_safety_stock(
            demand_std_dev, lead_time_days, higher_service_level
        )
        
        assert higher_safety_stock > safety_stock
    
    def test_reorder_point_calculation(self, optimization_service):
        """Test reorder point calculation - TC-STOCK-003."""
        average_daily_demand = 10
        lead_time_days = 7
        safety_stock = 20
        
        reorder_point = optimization_service.calculate_reorder_point(
            average_daily_demand, lead_time_days, safety_stock
        )
        
        expected_reorder_point = (average_daily_demand * lead_time_days) + safety_stock
        assert reorder_point == expected_reorder_point
    
    def test_inventory_turnover_calculation(self, optimization_service):
        """Test inventory turnover calculation - TC-STOCK-006."""
        annual_cost_of_goods_sold = Decimal('500000.00')
        average_inventory_value = Decimal('50000.00')
        
        turnover = optimization_service.calculate_inventory_turnover(
            annual_cost_of_goods_sold, average_inventory_value
        )
        
        expected_turnover = annual_cost_of_goods_sold / average_inventory_value
        assert abs(turnover - expected_turnover) < Decimal('0.01')
    
    def test_abc_analysis(self, optimization_service):
        """Test ABC analysis for inventory classification."""
        # Sample product data with revenue values
        products = [
            {'id': 'p1', 'annual_revenue': 50000},
            {'id': 'p2', 'annual_revenue': 30000},
            {'id': 'p3', 'annual_revenue': 15000},
            {'id': 'p4', 'annual_revenue': 3000},
            {'id': 'p5', 'annual_revenue': 1000},
        ]
        
        classification = optimization_service.perform_abc_analysis(products)
        
        assert 'A' in classification
        assert 'B' in classification
        assert 'C' in classification
        
        # Products should be classified based on revenue contribution
        total_products = sum(len(products) for products in classification.values())
        assert total_products == len(products)
    
    def test_stockout_probability_calculation(self, optimization_service):
        """Test stockout probability calculation."""
        current_stock = 100
        average_daily_demand = 15
        demand_std_dev = 5
        lead_time_days = 7
        
        probability = optimization_service.calculate_stockout_probability(
            current_stock, average_daily_demand, demand_std_dev, lead_time_days
        )
        
        assert 0 <= probability <= 1
        
        # Higher stock should result in lower stockout probability
        higher_stock_prob = optimization_service.calculate_stockout_probability(
            current_stock + 50, average_daily_demand, demand_std_dev, lead_time_days
        )
        
        assert higher_stock_prob <= probability
    
    def test_optimal_stock_level_calculation(self, optimization_service):
        """Test optimal stock level calculation - TC-STOCK-001."""
        product_data = {
            'id': 'test-product',
            'annual_demand': 1000,
            'ordering_cost': 50,
            'holding_cost': 2,
            'lead_time_days': 7,
            'service_level': 0.95,
            'demand_std_dev': 10
        }
        
        result = optimization_service.calculate_optimal_stock_level(product_data)
        
        assert 'optimal_order_quantity' in result
        assert 'reorder_point' in result
        assert 'safety_stock' in result
        assert 'max_stock_level' in result
        
        # All values should be positive
        for key, value in result.items():
            assert value > 0


class TestCashFlowBusinessLogic:
    """Test cash flow service business logic."""
    
    @pytest.fixture
    def cash_flow_service(self):
        """Create cash flow service instance."""
        return CashFlowService()
    
    def test_working_capital_calculation(self, cash_flow_service):
        """Test working capital calculation."""
        current_assets = Decimal('150000.00')
        current_liabilities = Decimal('100000.00')
        
        working_capital = cash_flow_service.calculate_working_capital_value(
            current_assets, current_liabilities
        )
        
        expected_wc = current_assets - current_liabilities
        assert working_capital == expected_wc
    
    def test_cash_conversion_cycle(self, cash_flow_service):
        """Test cash conversion cycle calculation."""
        days_inventory_outstanding = 45  # DIO
        days_sales_outstanding = 30      # DSO
        days_payable_outstanding = 25    # DPO
        
        ccc = cash_flow_service.calculate_cash_conversion_cycle(
            days_inventory_outstanding,
            days_sales_outstanding,
            days_payable_outstanding
        )
        
        expected_ccc = days_inventory_outstanding + days_sales_outstanding - days_payable_outstanding
        assert ccc == expected_ccc
    
    def test_cash_flow_projection(self, cash_flow_service):
        """Test cash flow projection calculation."""
        initial_cash = Decimal('50000.00')
        monthly_inflows = [Decimal('20000.00'), Decimal('25000.00'), Decimal('22000.00')]
        monthly_outflows = [Decimal('15000.00'), Decimal('18000.00'), Decimal('16000.00')]
        
        projection = cash_flow_service.project_cash_flow(
            initial_cash, monthly_inflows, monthly_outflows
        )
        
        assert len(projection) == len(monthly_inflows)
        
        # Verify cumulative calculation
        expected_balance = initial_cash
        for i, (inflow, outflow) in enumerate(zip(monthly_inflows, monthly_outflows)):
            expected_balance += inflow - outflow
            assert projection[i] == expected_balance
    
    def test_break_even_analysis(self, cash_flow_service):
        """Test break-even point calculation."""
        fixed_costs = Decimal('10000.00')
        variable_cost_per_unit = Decimal('5.00')
        selling_price_per_unit = Decimal('15.00')
        
        break_even_units = cash_flow_service.calculate_break_even_point(
            fixed_costs, variable_cost_per_unit, selling_price_per_unit
        )
        
        contribution_margin = selling_price_per_unit - variable_cost_per_unit
        expected_break_even = fixed_costs / contribution_margin
        
        assert break_even_units == expected_break_even
    
    def test_net_present_value_calculation(self, cash_flow_service):
        """Test NPV calculation for investment analysis."""
        initial_investment = Decimal('100000.00')
        cash_flows = [Decimal('30000.00'), Decimal('40000.00'), Decimal('50000.00')]
        discount_rate = Decimal('0.10')  # 10%
        
        npv = cash_flow_service.calculate_npv(
            initial_investment, cash_flows, discount_rate
        )
        
        # Calculate expected NPV manually
        expected_npv = -initial_investment
        for i, cash_flow in enumerate(cash_flows):
            expected_npv += cash_flow / ((1 + discount_rate) ** (i + 1))
        
        assert abs(npv - expected_npv) < Decimal('0.01')
    
    def test_payback_period_calculation(self, cash_flow_service):
        """Test payback period calculation."""
        initial_investment = Decimal('100000.00')
        annual_cash_flows = [Decimal('30000.00'), Decimal('40000.00'), Decimal('50000.00')]
        
        payback_period = cash_flow_service.calculate_payback_period(
            initial_investment, annual_cash_flows
        )
        
        # Should recover investment in less than 3 years
        assert payback_period < 3
        assert payback_period > 2  # Since 30k + 40k = 70k < 100k, but 30k + 40k + 50k > 100k


class TestConstraintSolverLogic:
    """Test constraint solver business logic."""
    
    @pytest.fixture
    def constraint_solver(self):
        """Create constraint solver instance."""
        return ConstraintSolver()
    
    def test_resource_allocation_optimization(self, constraint_solver):
        """Test resource allocation optimization - TC-CONS-001."""
        jobs = [
            {'id': 'j1', 'duration': 4, 'priority': 1, 'due_date': datetime.now() + timedelta(days=7)},
            {'id': 'j2', 'duration': 6, 'priority': 2, 'due_date': datetime.now() + timedelta(days=5)},
            {'id': 'j3', 'duration': 3, 'priority': 3, 'due_date': datetime.now() + timedelta(days=10)}
        ]
        
        resources = [
            {'id': 'r1', 'capacity': 8, 'available_hours': 40},
            {'id': 'r2', 'capacity': 6, 'available_hours': 30}
        ]
        
        with patch.object(constraint_solver, '_get_jobs_and_resources', return_value=(jobs, resources)):
            result = constraint_solver.optimize_resource_allocation()
            
            assert 'assignments' in result
            assert 'total_completion_time' in result
            assert 'resource_utilization' in result
    
    def test_capacity_constraint_validation(self, constraint_solver):
        """Test capacity constraint validation - TC-CONS-005."""
        resource_capacity = 8  # hours per day
        job_duration = 6       # hours
        
        is_feasible = constraint_solver.validate_capacity_constraint(
            resource_capacity, job_duration
        )
        
        assert is_feasible is True
        
        # Test infeasible case
        is_infeasible = constraint_solver.validate_capacity_constraint(
            resource_capacity, 10  # Job requires more hours than resource has
        )
        
        assert is_infeasible is False
    
    def test_due_date_constraint_handling(self, constraint_solver):
        """Test due date constraint handling - TC-CONS-004."""
        job_start_time = datetime.now()
        job_duration_hours = 8
        job_due_date = datetime.now() + timedelta(days=2)
        
        is_on_time = constraint_solver.validate_due_date_constraint(
            job_start_time, job_duration_hours, job_due_date
        )
        
        assert is_on_time is True
        
        # Test late completion
        late_due_date = datetime.now() + timedelta(hours=4)  # Due in 4 hours but takes 8
        is_late = constraint_solver.validate_due_date_constraint(
            job_start_time, job_duration_hours, late_due_date
        )
        
        assert is_late is False
    
    def test_makespan_minimization(self, constraint_solver):
        """Test makespan minimization objective - TC-CONS-007."""
        schedule = [
            {'resource_id': 'r1', 'start_time': 0, 'end_time': 8},
            {'resource_id': 'r1', 'start_time': 8, 'end_time': 14},
            {'resource_id': 'r2', 'start_time': 0, 'end_time': 6},
        ]
        
        makespan = constraint_solver.calculate_makespan(schedule)
        
        # Makespan should be the latest end time
        expected_makespan = max(task['end_time'] for task in schedule)
        assert makespan == expected_makespan
    
    def test_resource_utilization_calculation(self, constraint_solver):
        """Test resource utilization calculation - TC-CONS-008."""
        resource_id = 'r1'
        total_available_time = 40  # hours
        scheduled_time = 32        # hours
        
        utilization = constraint_solver.calculate_resource_utilization_percentage(
            scheduled_time, total_available_time
        )
        
        expected_utilization = (scheduled_time / total_available_time) * 100
        assert abs(utilization - expected_utilization) < 0.01
    
    def test_priority_based_scheduling(self, constraint_solver):
        """Test priority-based job scheduling - TC-CONS-003."""
        jobs = [
            {'id': 'j1', 'priority': 3, 'duration': 4},  # Lower priority number = higher priority
            {'id': 'j2', 'priority': 1, 'duration': 6},  # Highest priority
            {'id': 'j3', 'priority': 2, 'duration': 3}   # Medium priority
        ]
        
        sorted_jobs = constraint_solver.sort_jobs_by_priority(jobs)
        
        # Jobs should be sorted by priority (1, 2, 3)
        assert sorted_jobs[0]['id'] == 'j2'  # Priority 1
        assert sorted_jobs[1]['id'] == 'j3'  # Priority 2
        assert sorted_jobs[2]['id'] == 'j1'  # Priority 3
    
    def test_schedule_feasibility_check(self, constraint_solver):
        """Test schedule feasibility checking - TC-CONS-009."""
        proposed_schedule = [
            {'job_id': 'j1', 'resource_id': 'r1', 'start_time': 0, 'duration': 8},
            {'job_id': 'j2', 'resource_id': 'r1', 'start_time': 8, 'duration': 6},
            {'job_id': 'j3', 'resource_id': 'r2', 'start_time': 0, 'duration': 4}
        ]
        
        resource_constraints = {
            'r1': {'capacity': 8, 'available_hours': 40},
            'r2': {'capacity': 6, 'available_hours': 30}
        }
        
        is_feasible = constraint_solver.validate_schedule_feasibility(
            proposed_schedule, resource_constraints
        )
        
        assert is_feasible is True
    
    def test_multi_objective_optimization(self, constraint_solver):
        """Test multi-objective optimization - TC-CONS-010."""
        objectives = {
            'minimize_makespan': 0.4,      # 40% weight
            'maximize_utilization': 0.3,   # 30% weight
            'minimize_tardiness': 0.3      # 30% weight
        }
        
        schedule_metrics = {
            'makespan': 20,
            'average_utilization': 85,
            'total_tardiness': 5
        }
        
        objective_score = constraint_solver.calculate_multi_objective_score(
            schedule_metrics, objectives
        )
        
        assert 0 <= objective_score <= 100  # Score should be normalized
        assert isinstance(objective_score, (int, float))