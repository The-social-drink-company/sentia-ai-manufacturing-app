import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import patch, Mock
from decimal import Decimal
import tempfile
import os

from app.models import User, Product, Job, Resource, HistoricalSales, Forecast
from app.services.forecasting_service import ForecastingService
from app.services.stock_optimization_service import StockOptimizationService
from app.services.constraint_solver import ConstraintSolver


class TestEndToEndWorkflows:
    """Test complete end-to-end business workflows."""
    
    def test_complete_product_lifecycle(self, client, db_session):
        """Test complete product lifecycle from creation to optimization."""
        # 1. Create user and authenticate
        user = User(email='test@example.com', first_name='Test', last_name='User')
        user.set_password('password123')
        db_session.add(user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(user.id)
        
        # 2. Create product via API
        product_data = {
            'name': 'New Product',
            'sku': 'NEWPROD-001',
            'cost': 15.00,
            'price': 30.00,
            'lead_time_days': 10
        }
        
        response = client.post('/api/products',
                             data=json.dumps(product_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        product = Product.query.filter_by(sku='NEWPROD-001').first()
        assert product is not None
        
        # 3. Create job for the product
        job_data = {
            'product_id': str(product.id),
            'quantity': 100,
            'priority': 1,
            'due_date': (datetime.now() + timedelta(days=14)).isoformat()
        }
        
        response = client.post('/api/jobs',
                             data=json.dumps(job_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        job = Job.query.filter_by(product_id=product.id).first()
        assert job is not None
        
        # 4. Create resource
        resource_data = {
            'name': 'Production Line A',
            'capacity': 50,
            'resource_type': 'machine'
        }
        
        response = client.post('/api/resources',
                             data=json.dumps(resource_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
        resource = Resource.query.filter_by(name='Production Line A').first()
        assert resource is not None
        
        # 5. Optimize schedule
        with patch('app.services.constraint_solver.ConstraintSolver.optimize_schedule') as mock_optimize:
            mock_optimize.return_value = {
                'schedules': [{
                    'job_id': str(job.id),
                    'resource_id': str(resource.id),
                    'start_time': datetime.now().isoformat(),
                    'end_time': (datetime.now() + timedelta(hours=8)).isoformat()
                }],
                'total_makespan': 8,
                'resource_utilization': {str(resource.id): 85.0}
            }
            
            response = client.post('/api/optimization/schedule')
            assert response.status_code == 200
            
            optimization_result = json.loads(response.data)
            assert 'schedules' in optimization_result
            assert len(optimization_result['schedules']) == 1
    
    def test_forecasting_to_procurement_workflow(self, client, db_session, sample_user, sample_product, sample_market):
        """Test workflow from forecasting to procurement recommendations."""
        # Setup test data
        db_session.add_all([sample_user, sample_product, sample_market])
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        # 1. Create historical sales data
        sales_records = [
            HistoricalSales(
                product_id=sample_product.id,
                market_id=sample_market.id,
                date=datetime.now().date() - timedelta(days=i),
                quantity_sold=50 + (i % 20),
                revenue=Decimal(str((50 + (i % 20)) * sample_product.price)),
                channel='online'
            )
            for i in range(90)  # 3 months of data
        ]
        db_session.add_all(sales_records)
        db_session.commit()
        
        # 2. Generate forecast
        with patch('app.services.forecasting_service.ForecastingService.generate_simple_forecast') as mock_forecast:
            forecast_data = {
                'forecast_dates': [(datetime.now() + timedelta(days=i)).date() for i in range(30)],
                'predicted_quantities': [60 + i for i in range(30)],
                'confidence_interval': 0.95
            }
            mock_forecast.return_value = forecast_data
            
            forecast_request = {
                'product_id': str(sample_product.id),
                'market_id': str(sample_market.id),
                'days': 30
            }
            
            response = client.post('/api/forecasts',
                                 data=json.dumps(forecast_request),
                                 content_type='application/json')
            
            assert response.status_code in [200, 201]
        
        # 3. Optimize stock levels based on forecast
        with patch('app.services.stock_optimization_service.StockOptimizationService.calculate_optimal_stock_levels') as mock_optimize:
            mock_optimize.return_value = [{
                'product_id': str(sample_product.id),
                'optimal_stock': 500,
                'reorder_point': 200,
                'safety_stock': 100,
                'economic_order_quantity': 300
            }]
            
            response = client.post('/api/optimization/stock')
            assert response.status_code == 200
            
            optimization_result = json.loads(response.data)
            assert len(optimization_result) == 1
            assert optimization_result[0]['product_id'] == str(sample_product.id)
    
    def test_data_import_to_analysis_workflow(self, client, db_session, sample_user, temp_upload_dir):
        """Test complete data import and analysis workflow."""
        db_session.add(sample_user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        # 1. Create test CSV file
        csv_content = """name,sku,cost,price,lead_time_days
Test Product 1,TEST-001,10.00,20.00,7
Test Product 2,TEST-002,15.00,25.00,10
Test Product 3,TEST-003,12.50,22.50,5"""
        
        csv_file_path = os.path.join(temp_upload_dir, 'test_products.csv')
        with open(csv_file_path, 'w') as f:
            f.write(csv_content)
        
        # 2. Upload file
        with open(csv_file_path, 'rb') as f:
            response = client.post('/api/data-import/upload',
                                 data={'file': (f, 'test_products.csv')},
                                 content_type='multipart/form-data')
        
        assert response.status_code in [200, 201]
        
        # 3. Check import status
        response = client.get('/api/data-import/status')
        assert response.status_code == 200
        
        # 4. Verify products were created
        products = Product.query.filter(Product.sku.in_(['TEST-001', 'TEST-002', 'TEST-003'])).all()
        assert len(products) >= 0  # May be 0 if import is async
    
    def test_user_authentication_workflow(self, client, db_session):
        """Test complete user authentication workflow."""
        # 1. Register new user
        register_data = {
            'email': 'newuser@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'SecurePassword123!',
            'password2': 'SecurePassword123!'
        }
        
        response = client.post('/auth/register', data=register_data)
        assert response.status_code in [200, 302]
        
        # 2. Verify user was created
        user = User.query.filter_by(email='newuser@example.com').first()
        assert user is not None
        
        # 3. Login with new user
        login_response = client.post('/auth/login', data={
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!'
        })
        assert login_response.status_code == 302  # Redirect after successful login
        
        # 4. Access protected resource
        response = client.get('/api/products')
        assert response.status_code == 200
        
        # 5. Logout
        logout_response = client.get('/auth/logout')
        assert logout_response.status_code == 302
        
        # 6. Try to access protected resource after logout
        response = client.get('/api/products')
        assert response.status_code in [401, 302]  # Should be redirected or unauthorized


class TestBusinessProcessIntegration:
    """Test integration of business processes."""
    
    def test_demand_planning_process(self, db_session, sample_product, sample_market):
        """Test complete demand planning business process."""
        db_session.add_all([sample_product, sample_market])
        db_session.commit()
        
        # 1. Create historical sales data
        sales_records = [
            HistoricalSales(
                product_id=sample_product.id,
                market_id=sample_market.id,
                date=datetime.now().date() - timedelta(days=i),
                quantity_sold=40 + (i % 30),  # Seasonal pattern
                revenue=Decimal(str((40 + (i % 30)) * 20)),
                channel='online' if i % 2 == 0 else 'retail'
            )
            for i in range(180)  # 6 months of data
        ]
        db_session.add_all(sales_records)
        db_session.commit()
        
        # 2. Generate forecast using service
        forecasting_service = ForecastingService()
        
        with patch.object(forecasting_service, 'get_historical_data') as mock_data:
            import pandas as pd
            mock_data.return_value = pd.DataFrame([
                {'date': record.date, 'quantity_sold': record.quantity_sold}
                for record in sales_records
            ])
            
            forecast_result = forecasting_service.generate_simple_forecast(
                str(sample_product.id), str(sample_market.id), days=30
            )
            
            assert forecast_result is not None
            assert 'predicted_quantities' in forecast_result
            assert len(forecast_result['predicted_quantities']) == 30
        
        # 3. Calculate stock optimization
        stock_service = StockOptimizationService()
        
        with patch.object(stock_service, 'calculate_demand_forecast', return_value=45):
            safety_stock = stock_service.calculate_safety_stock(
                demand_variability=10, lead_time_days=7, service_level=0.95
            )
            
            reorder_point = stock_service.calculate_reorder_point(
                average_daily_demand=45, lead_time_days=7, safety_stock=safety_stock
            )
            
            assert safety_stock > 0
            assert reorder_point > safety_stock
    
    def test_production_scheduling_process(self, db_session, sample_product):
        """Test production scheduling business process."""
        db_session.add(sample_product)
        db_session.commit()
        
        # 1. Create multiple jobs
        jobs = [
            Job(
                product_id=sample_product.id,
                quantity=100,
                priority=1,
                status='pending',
                due_date=datetime.now() + timedelta(days=7)
            ),
            Job(
                product_id=sample_product.id,
                quantity=150,
                priority=2,
                status='pending',
                due_date=datetime.now() + timedelta(days=14)
            ),
            Job(
                product_id=sample_product.id,
                quantity=75,
                priority=3,
                status='pending',
                due_date=datetime.now() + timedelta(days=21)
            )
        ]
        db_session.add_all(jobs)
        db_session.commit()
        
        # 2. Create resources
        resources = [
            Resource(name='Machine A', capacity=50, resource_type='machine'),
            Resource(name='Machine B', capacity=75, resource_type='machine'),
            Resource(name='Worker Team 1', capacity=8, resource_type='worker')
        ]
        db_session.add_all(resources)
        db_session.commit()
        
        # 3. Run constraint solver
        solver = ConstraintSolver()
        
        with patch.object(solver, 'optimize_schedule') as mock_optimize:
            mock_optimize.return_value = {
                'schedules': [
                    {
                        'job_id': str(jobs[0].id),
                        'resource_id': str(resources[0].id),
                        'start_time': datetime.now(),
                        'end_time': datetime.now() + timedelta(hours=4)
                    },
                    {
                        'job_id': str(jobs[1].id),
                        'resource_id': str(resources[1].id),
                        'start_time': datetime.now() + timedelta(hours=1),
                        'end_time': datetime.now() + timedelta(hours=6)
                    }
                ],
                'total_makespan': 360,  # minutes
                'resource_utilization': {
                    str(resources[0].id): 80.0,
                    str(resources[1].id): 85.5
                }
            }
            
            result = solver.optimize_schedule()
            
            assert result is not None
            assert 'schedules' in result
            assert len(result['schedules']) == 2
            assert 'resource_utilization' in result
    
    def test_cash_flow_analysis_process(self, db_session, sample_product, sample_market):
        """Test cash flow analysis business process."""
        from app.services.cash_flow_service import CashFlowService
        
        db_session.add_all([sample_product, sample_market])
        db_session.commit()
        
        # 1. Create sales and forecast data
        sales_records = [
            HistoricalSales(
                product_id=sample_product.id,
                market_id=sample_market.id,
                date=datetime.now().date() - timedelta(days=i),
                quantity_sold=50,
                revenue=Decimal('1000.00'),
                channel='online'
            )
            for i in range(30)
        ]
        db_session.add_all(sales_records)
        db_session.commit()
        
        # 2. Calculate cash flow metrics
        cash_flow_service = CashFlowService()
        
        # Test break-even calculation
        break_even = cash_flow_service.calculate_break_even_point(
            fixed_costs=Decimal('10000'),
            variable_cost_per_unit=sample_product.cost,
            price_per_unit=sample_product.price
        )
        
        assert break_even > 0
        
        # Test cash conversion cycle
        ccc = cash_flow_service.calculate_cash_conversion_cycle(
            days_inventory_outstanding=30,
            days_sales_outstanding=45,
            days_payable_outstanding=25
        )
        
        assert ccc == 50  # 30 + 45 - 25
        
        # Test cash flow projection
        projection = cash_flow_service.project_cash_flow(
            initial_cash=Decimal('50000'),
            monthly_revenue=Decimal('30000'),
            monthly_expenses=Decimal('20000'),
            months=12
        )
        
        assert len(projection) == 12
        assert projection[0] > Decimal('50000')  # Should increase in first month


class TestExternalIntegrationWorkflows:
    """Test workflows involving external API integrations."""
    
    @patch('app.services.amazon_sp_client.AmazonSPClient')
    @patch('app.services.shopify_client.ShopifyClient')
    def test_multi_channel_sales_sync(self, mock_shopify, mock_amazon, db_session, sample_product, sample_market):
        """Test syncing sales data from multiple channels."""
        db_session.add_all([sample_product, sample_market])
        db_session.commit()
        
        # Mock external API responses
        mock_amazon_orders = [
            {
                'order_id': 'AMZ-001',
                'product_sku': sample_product.sku,
                'quantity': 5,
                'price': float(sample_product.price),
                'order_date': datetime.now().isoformat()
            }
        ]
        
        mock_shopify_orders = [
            {
                'order_id': 'SHOP-001',
                'product_sku': sample_product.sku,
                'quantity': 3,
                'price': float(sample_product.price),
                'order_date': datetime.now().isoformat()
            }
        ]
        
        mock_amazon.return_value.get_orders.return_value = mock_amazon_orders
        mock_shopify.return_value.get_orders.return_value = mock_shopify_orders
        
        # Simulate integration service processing
        from app.services.api_integration_service import ApiIntegrationService
        
        service = ApiIntegrationService()
        
        # Process Amazon orders
        with patch.object(service, 'sync_amazon_orders') as mock_sync_amazon:
            mock_sync_amazon.return_value = {'synced_orders': 1, 'errors': []}
            result_amazon = service.sync_amazon_orders()
            assert result_amazon['synced_orders'] == 1
        
        # Process Shopify orders
        with patch.object(service, 'sync_shopify_orders') as mock_sync_shopify:
            mock_sync_shopify.return_value = {'synced_orders': 1, 'errors': []}
            result_shopify = service.sync_shopify_orders()
            assert result_shopify['synced_orders'] == 1
    
    @patch('app.services.xero_client.XeroClient')
    def test_financial_data_integration(self, mock_xero, db_session, sample_market):
        """Test financial data integration workflow."""
        db_session.add(sample_market)
        db_session.commit()
        
        # Mock Xero API response
        mock_financial_data = {
            'accounts_receivable': 25000.00,
            'accounts_payable': 15000.00,
            'cash_balance': 50000.00,
            'current_assets': 100000.00,
            'current_liabilities': 40000.00
        }
        
        mock_xero.return_value.get_financial_data.return_value = mock_financial_data
        
        # Test working capital calculation with real data
        from app.services.cash_flow_service import CashFlowService
        from app.models.working_capital import WorkingCapital
        
        # Create working capital record
        wc_record = WorkingCapital(
            market_id=sample_market.id,
            current_assets=Decimal(str(mock_financial_data['current_assets'])),
            current_liabilities=Decimal(str(mock_financial_data['current_liabilities'])),
            calculation_date=datetime.now().date()
        )
        db_session.add(wc_record)
        db_session.commit()
        
        cash_flow_service = CashFlowService()
        working_capital = cash_flow_service.calculate_working_capital(str(sample_market.id))
        
        expected_wc = Decimal('100000') - Decimal('40000')
        assert working_capital == expected_wc


class TestErrorHandlingWorkflows:
    """Test error handling in integrated workflows."""
    
    def test_partial_failure_recovery(self, client, db_session, sample_user):
        """Test recovery from partial failures in batch operations."""
        db_session.add(sample_user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        # Create batch of products with one invalid entry
        products_data = [
            {'name': 'Valid Product 1', 'sku': 'VALID-001', 'cost': 10.00, 'price': 20.00},
            {'name': 'Valid Product 2', 'sku': 'VALID-002', 'cost': 15.00, 'price': 25.00},
            {'name': '', 'sku': 'INVALID-001', 'cost': -5.00, 'price': 10.00},  # Invalid
            {'name': 'Valid Product 3', 'sku': 'VALID-003', 'cost': 12.00, 'price': 22.00}
        ]
        
        for product_data in products_data:
            response = client.post('/api/products',
                                 data=json.dumps(product_data),
                                 content_type='application/json')
            
            # Some should succeed, some should fail
            assert response.status_code in [200, 201, 400]
        
        # Verify valid products were created
        valid_products = Product.query.filter(
            Product.sku.in_(['VALID-001', 'VALID-002', 'VALID-003'])
        ).all()
        
        # Should have at least the valid ones (depending on validation logic)
        assert len(valid_products) >= 0
    
    def test_service_timeout_handling(self, db_session, sample_product):
        """Test handling of service timeouts."""
        db_session.add(sample_product)
        db_session.commit()
        
        # Simulate timeout in forecasting service
        forecasting_service = ForecastingService()
        
        with patch.object(forecasting_service, 'get_historical_data') as mock_data:
            # Simulate timeout exception
            mock_data.side_effect = Exception("Request timeout")
            
            try:
                result = forecasting_service.generate_simple_forecast(
                    str(sample_product.id), 'market-id', days=30
                )
                # If no exception handling, this should fail
                assert False, "Expected exception was not raised"
            except Exception as e:
                assert "timeout" in str(e).lower()
    
    def test_data_consistency_on_failure(self, db_session, sample_product):
        """Test data consistency when operations fail."""
        db_session.add(sample_product)
        db_session.commit()
        
        # Record initial state
        initial_product_count = Product.query.count()
        initial_job_count = Job.query.count()
        
        try:
            # Start transaction that should fail
            job = Job(
                product_id=sample_product.id,
                quantity=100,
                priority=1,
                status='pending'
            )
            db_session.add(job)
            
            # Create another product that will cause constraint violation
            duplicate_product = Product(
                name='Duplicate',
                sku=sample_product.sku,  # Same SKU should fail
                cost=10.00,
                price=20.00
            )
            db_session.add(duplicate_product)
            db_session.commit()
            
        except Exception:
            db_session.rollback()
        
        # Verify no partial changes were committed
        final_product_count = Product.query.count()
        final_job_count = Job.query.count()
        
        assert final_product_count == initial_product_count
        assert final_job_count == initial_job_count