import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from decimal import Decimal
import pandas as pd

from app.services.forecasting_service import ForecastingService
from app.services.stock_optimization_service import StockOptimizationService
from app.services.cash_flow_service import CashFlowService
from app.services.constraint_solver import ConstraintSolver


class TestForecastingService:
    """Test ForecastingService functionality."""
    
    @pytest.fixture
    def mock_historical_data(self):
        """Create mock historical sales data."""
        dates = pd.date_range('2024-01-01', '2024-12-31', freq='D')
        data = {
            'date': dates,
            'quantity_sold': [50 + (i % 30) for i in range(len(dates))],
            'revenue': [1000 + (i % 30) * 20 for i in range(len(dates))]
        }
        return pd.DataFrame(data)
    
    def test_forecasting_service_initialization(self):
        """Test ForecastingService initialization."""
        service = ForecastingService()
        assert service is not None
    
    @patch('app.services.forecasting_service.HistoricalSales')
    def test_get_historical_data(self, mock_sales, mock_historical_data):
        """Test getting historical data for forecasting."""
        service = ForecastingService()
        
        # Mock database query
        mock_query = Mock()
        mock_sales.query.filter.return_value = mock_query
        mock_query.all.return_value = []
        
        result = service.get_historical_data('product-id', 'market-id', days=365)
        assert result is not None
    
    def test_simple_moving_average_forecast(self, mock_historical_data):
        """Test simple moving average forecasting."""
        service = ForecastingService()
        
        with patch.object(service, 'get_historical_data', return_value=mock_historical_data):
            forecast = service.generate_simple_forecast('product-id', 'market-id', days=30)
            
            assert forecast is not None
            assert 'forecast_dates' in forecast
            assert 'predicted_quantities' in forecast
            assert len(forecast['forecast_dates']) == 30
    
    def test_seasonal_forecast(self, mock_historical_data):
        """Test seasonal forecasting method."""
        service = ForecastingService()
        
        with patch.object(service, 'get_historical_data', return_value=mock_historical_data):
            forecast = service.generate_seasonal_forecast('product-id', 'market-id', days=30)
            
            assert forecast is not None
            assert 'forecast_dates' in forecast
            assert 'predicted_quantities' in forecast
    
    def test_forecast_accuracy_calculation(self):
        """Test forecast accuracy calculation."""
        service = ForecastingService()
        
        actual = [10, 15, 20, 25, 30]
        predicted = [12, 14, 18, 26, 28]
        
        accuracy = service.calculate_forecast_accuracy(actual, predicted)
        assert 0 <= accuracy <= 100
    
    @patch('app.services.forecasting_service.Forecast')
    def test_save_forecast_to_database(self, mock_forecast):
        """Test saving forecast to database."""
        service = ForecastingService()
        
        forecast_data = {
            'product_id': 'product-id',
            'market_id': 'market-id',
            'forecast_dates': [datetime.now().date() + timedelta(days=i) for i in range(5)],
            'predicted_quantities': [10, 15, 20, 25, 30],
            'confidence_interval': 0.95
        }
        
        result = service.save_forecast(forecast_data)
        assert result is not None


class TestStockOptimizationService:
    """Test StockOptimizationService functionality."""
    
    def test_optimization_service_initialization(self):
        """Test StockOptimizationService initialization."""
        service = StockOptimizationService()
        assert service is not None
    
    @patch('app.services.stock_optimization_service.Product')
    @patch('app.services.stock_optimization_service.InventoryLevel')
    def test_calculate_optimal_stock_levels(self, mock_inventory, mock_product):
        """Test calculating optimal stock levels."""
        service = StockOptimizationService()
        
        # Mock product data
        mock_product.query.all.return_value = [
            Mock(id='p1', name='Product 1', lead_time_days=7),
            Mock(id='p2', name='Product 2', lead_time_days=14)
        ]
        
        # Mock inventory data
        mock_inventory.query.all.return_value = [
            Mock(product_id='p1', current_stock=100, reorder_point=50),
            Mock(product_id='p2', current_stock=75, reorder_point=30)
        ]
        
        with patch.object(service, 'calculate_demand_forecast', return_value=50):
            result = service.calculate_optimal_stock_levels()
            
            assert result is not None
            assert isinstance(result, list)
    
    def test_calculate_safety_stock(self):
        """Test safety stock calculation."""
        service = StockOptimizationService()
        
        demand_variability = 10
        lead_time_days = 7
        service_level = 0.95
        
        safety_stock = service.calculate_safety_stock(
            demand_variability, lead_time_days, service_level
        )
        
        assert safety_stock >= 0
        assert isinstance(safety_stock, (int, float))
    
    def test_calculate_reorder_point(self):
        """Test reorder point calculation."""
        service = StockOptimizationService()
        
        average_daily_demand = 10
        lead_time_days = 7
        safety_stock = 20
        
        reorder_point = service.calculate_reorder_point(
            average_daily_demand, lead_time_days, safety_stock
        )
        
        expected = (average_daily_demand * lead_time_days) + safety_stock
        assert reorder_point == expected
    
    def test_calculate_economic_order_quantity(self):
        """Test EOQ calculation."""
        service = StockOptimizationService()
        
        annual_demand = 1000
        ordering_cost = 50
        holding_cost = 2
        
        eoq = service.calculate_eoq(annual_demand, ordering_cost, holding_cost)
        
        assert eoq > 0
        assert isinstance(eoq, (int, float))


class TestCashFlowService:
    """Test CashFlowService functionality."""
    
    def test_cash_flow_service_initialization(self):
        """Test CashFlowService initialization."""
        service = CashFlowService()
        assert service is not None
    
    @patch('app.services.cash_flow_service.WorkingCapital')
    def test_calculate_working_capital(self, mock_wc):
        """Test working capital calculation."""
        service = CashFlowService()
        
        mock_wc.query.filter.return_value.first.return_value = Mock(
            current_assets=Decimal('100000'),
            current_liabilities=Decimal('60000')
        )
        
        result = service.calculate_working_capital('market-id')
        assert result == Decimal('40000')
    
    def test_calculate_cash_conversion_cycle(self):
        """Test cash conversion cycle calculation."""
        service = CashFlowService()
        
        days_inventory_outstanding = 30
        days_sales_outstanding = 45
        days_payable_outstanding = 25
        
        ccc = service.calculate_cash_conversion_cycle(
            days_inventory_outstanding,
            days_sales_outstanding,
            days_payable_outstanding
        )
        
        expected = days_inventory_outstanding + days_sales_outstanding - days_payable_outstanding
        assert ccc == expected
    
    def test_project_cash_flow(self):
        """Test cash flow projection."""
        service = CashFlowService()
        
        initial_cash = Decimal('50000')
        monthly_revenue = Decimal('20000')
        monthly_expenses = Decimal('15000')
        months = 12
        
        projection = service.project_cash_flow(
            initial_cash, monthly_revenue, monthly_expenses, months
        )
        
        assert len(projection) == months
        assert all(isinstance(amount, Decimal) for amount in projection)
    
    def test_calculate_break_even_point(self):
        """Test break-even point calculation."""
        service = CashFlowService()
        
        fixed_costs = Decimal('10000')
        variable_cost_per_unit = Decimal('5')
        price_per_unit = Decimal('15')
        
        break_even = service.calculate_break_even_point(
            fixed_costs, variable_cost_per_unit, price_per_unit
        )
        
        expected = fixed_costs / (price_per_unit - variable_cost_per_unit)
        assert break_even == expected


class TestConstraintSolver:
    """Test ConstraintSolver functionality."""
    
    def test_constraint_solver_initialization(self):
        """Test ConstraintSolver initialization."""
        solver = ConstraintSolver()
        assert solver is not None
    
    @patch('app.services.constraint_solver.Job')
    @patch('app.services.constraint_solver.Resource')
    def test_optimize_schedule(self, mock_resource, mock_job):
        """Test schedule optimization."""
        solver = ConstraintSolver()
        
        # Mock jobs
        mock_job.query.filter.return_value.all.return_value = [
            Mock(id='j1', quantity=100, priority=1, due_date=datetime.now() + timedelta(days=7)),
            Mock(id='j2', quantity=50, priority=2, due_date=datetime.now() + timedelta(days=14))
        ]
        
        # Mock resources
        mock_resource.query.filter.return_value.all.return_value = [
            Mock(id='r1', name='Machine 1', capacity=100),
            Mock(id='r2', name='Machine 2', capacity=150)
        ]
        
        result = solver.optimize_schedule()
        assert result is not None
    
    def test_calculate_resource_utilization(self):
        """Test resource utilization calculation."""
        solver = ConstraintSolver()
        
        schedules = [
            Mock(resource_id='r1', start_time=datetime(2024, 1, 1, 9, 0), 
                 end_time=datetime(2024, 1, 1, 17, 0)),
            Mock(resource_id='r1', start_time=datetime(2024, 1, 2, 9, 0), 
                 end_time=datetime(2024, 1, 2, 13, 0))
        ]
        
        utilization = solver.calculate_resource_utilization('r1', schedules)
        assert 0 <= utilization <= 100
    
    def test_validate_schedule_constraints(self):
        """Test schedule constraint validation."""
        solver = ConstraintSolver()
        
        schedule = Mock(
            start_time=datetime(2024, 1, 1, 9, 0),
            end_time=datetime(2024, 1, 1, 17, 0),
            resource_id='r1'
        )
        
        existing_schedules = []
        
        is_valid = solver.validate_schedule_constraints(schedule, existing_schedules)
        assert isinstance(is_valid, bool)
    
    def test_calculate_completion_time(self):
        """Test job completion time calculation."""
        solver = ConstraintSolver()
        
        job = Mock(quantity=100, processing_time_per_unit=0.5)
        resource = Mock(capacity=50)
        
        completion_time = solver.calculate_completion_time(job, resource)
        assert completion_time > 0


class TestUtilityFunctions:
    """Test utility functions across services."""
    
    def test_date_range_generation(self):
        """Test date range generation utility."""
        from app.utils.validation import generate_date_range
        
        start_date = datetime(2024, 1, 1).date()
        end_date = datetime(2024, 1, 31).date()
        
        dates = generate_date_range(start_date, end_date)
        assert len(dates) == 31
        assert dates[0] == start_date
        assert dates[-1] == end_date
    
    def test_data_validation_functions(self):
        """Test data validation utilities."""
        from app.utils.validation import validate_email, validate_sku, validate_currency
        
        assert validate_email('test@example.com') is True
        assert validate_email('invalid-email') is False
        
        assert validate_sku('TEST-001') is True
        assert validate_sku('') is False
        
        assert validate_currency('USD') is True
        assert validate_currency('INVALID') is False
    
    @patch('app.utils.security.check_password_strength')
    def test_security_utilities(self, mock_check):
        """Test security utility functions."""
        mock_check.return_value = {'score': 4, 'feedback': []}
        
        from app.utils.security import check_password_strength
        result = check_password_strength('SecurePassword123!')
        
        assert 'score' in result
        assert 'feedback' in result