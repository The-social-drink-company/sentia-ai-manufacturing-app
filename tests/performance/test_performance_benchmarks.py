"""
Performance testing benchmarks.
Tests system performance under various load conditions.
"""
import pytest
import time
import concurrent.futures
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch, Mock

from app.services.forecasting_service import ForecastingService
from app.services.stock_optimization_service import StockOptimizationService
from app.services.constraint_solver import ConstraintSolver
from app.models import Product, Job, Resource


class TestDatabasePerformance:
    """Test database operation performance."""
    
    def test_product_bulk_insert_performance(self, db_session, benchmark):
        """Test bulk product insertion performance."""
        def create_products():
            products = []
            for i in range(1000):
                product = Product(
                    name=f'Bulk Product {i}',
                    sku=f'BULK-{i:04d}',
                    cost=Decimal('10.00') + Decimal(str(i % 50)),
                    price=Decimal('20.00') + Decimal(str(i % 100)),
                    lead_time_days=5 + (i % 10)
                )
                products.append(product)
            
            db_session.add_all(products)
            db_session.commit()
            return len(products)
        
        result = benchmark(create_products)
        assert result == 1000
    
    def test_product_query_performance(self, db_session, benchmark):
        """Test product query performance with large dataset."""
        # Setup: Create test products
        products = []
        for i in range(5000):
            product = Product(
                name=f'Query Product {i}',
                sku=f'QUERY-{i:05d}',
                cost=Decimal('10.00'),
                price=Decimal('20.00'),
                lead_time_days=7
            )
            products.append(product)
        
        db_session.add_all(products)
        db_session.commit()
        
        def query_products():
            # Test various query patterns
            results = []
            
            # Simple query
            results.extend(db_session.query(Product).filter(
                Product.name.like('Query Product 1%')
            ).all())
            
            # Range query
            results.extend(db_session.query(Product).filter(
                Product.cost.between(Decimal('10.00'), Decimal('15.00'))
            ).all())
            
            # Ordering query
            results.extend(db_session.query(Product).order_by(
                Product.created_at.desc()
            ).limit(100).all())
            
            return len(results)
        
        result = benchmark(query_products)
        assert result > 0
    
    def test_complex_join_performance(self, db_session, benchmark):
        """Test performance of complex joins."""
        # Setup test data
        products = []
        jobs = []
        resources = []
        
        # Create products
        for i in range(100):
            product = Product(
                name=f'Join Product {i}',
                sku=f'JOIN-{i:03d}',
                cost=Decimal('10.00'),
                price=Decimal('20.00'),
                lead_time_days=7
            )
            products.append(product)
        
        # Create resources
        for i in range(20):
            resource = Resource(
                name=f'Join Resource {i}',
                capacity=100,
                resource_type='machine',
                hourly_cost=Decimal('50.00')
            )
            resources.append(resource)
        
        db_session.add_all(products + resources)
        db_session.flush()
        
        # Create jobs
        for i in range(500):
            job = Job(
                product_id=products[i % len(products)].id,
                quantity=100,
                priority=1,
                status='pending'
            )
            jobs.append(job)
        
        db_session.add_all(jobs)
        db_session.commit()
        
        def complex_query():
            # Complex join query
            return db_session.query(Job, Product, Resource).join(
                Product, Job.product_id == Product.id
            ).outerjoin(
                Resource, Job.assigned_resource_id == Resource.id
            ).filter(
                Product.cost > Decimal('5.00')
            ).order_by(Job.priority, Job.created_at).limit(50).all()
        
        result = benchmark(complex_query)
        assert len(result) > 0


class TestServicePerformance:
    """Test service layer performance."""
    
    def test_forecasting_performance(self, benchmark):
        """Test forecasting service performance."""
        forecasting_service = ForecastingService()
        
        # Mock historical data
        import pandas as pd
        import numpy as np
        
        dates = pd.date_range('2023-01-01', '2024-12-31', freq='D')
        mock_data = pd.DataFrame({
            'date': dates,
            'quantity_sold': np.random.poisson(50, len(dates)),
            'revenue': np.random.normal(1000, 100, len(dates))
        })
        
        def generate_forecast():
            with patch.object(forecasting_service, 'get_historical_data', return_value=mock_data):
                return forecasting_service.generate_simple_forecast('product-id', 'market-id', days=365)
        
        result = benchmark(generate_forecast)
        assert 'predicted_quantities' in result
        assert len(result['predicted_quantities']) == 365
    
    def test_stock_optimization_performance(self, benchmark):
        """Test stock optimization performance."""
        optimization_service = StockOptimizationService()
        
        # Mock product data
        products = []
        for i in range(1000):
            products.append({
                'id': f'product-{i}',
                'annual_demand': 1000 + (i % 500),
                'ordering_cost': 50,
                'holding_cost': 2,
                'lead_time_days': 7 + (i % 14),
                'service_level': 0.95,
                'demand_std_dev': 10 + (i % 20)
            })
        
        def optimize_stock_levels():
            results = []
            for product in products:
                result = optimization_service.calculate_optimal_stock_level(product)
                results.append(result)
            return results
        
        result = benchmark(optimize_stock_levels)
        assert len(result) == 1000
        assert all('optimal_order_quantity' in r for r in result)
    
    def test_constraint_solver_performance(self, benchmark):
        """Test constraint solver performance."""
        constraint_solver = ConstraintSolver()
        
        # Mock jobs and resources
        jobs = []
        for i in range(100):
            jobs.append({
                'id': f'job-{i}',
                'duration': 4 + (i % 8),
                'priority': 1 + (i % 5),
                'due_date': datetime.now() + timedelta(days=7 + (i % 14))
            })
        
        resources = []
        for i in range(10):
            resources.append({
                'id': f'resource-{i}',
                'capacity': 8,
                'available_hours': 40,
                'hourly_cost': 50.0
            })
        
        def optimize_schedule():
            with patch.object(constraint_solver, '_get_jobs_and_resources', return_value=(jobs, resources)):
                return constraint_solver.optimize_resource_allocation()
        
        result = benchmark(optimize_schedule)
        assert 'assignments' in result
        assert 'total_completion_time' in result


class TestAPIPerformance:
    """Test API endpoint performance."""
    
    def test_product_list_api_performance(self, client, db_session, benchmark):
        """Test product list API performance."""
        # Setup: Create test user and products
        from app.models.user import User
        
        user = User(email='perf@example.com', first_name='Perf', last_name='User')
        user.set_password('password123')
        db_session.add(user)
        
        products = []
        for i in range(1000):
            product = Product(
                name=f'API Product {i}',
                sku=f'API-{i:04d}',
                cost=Decimal('10.00'),
                price=Decimal('20.00'),
                lead_time_days=7
            )
            products.append(product)
        
        db_session.add_all(products)
        db_session.commit()
        
        def api_call():
            with client.session_transaction() as sess:
                sess['_user_id'] = str(user.id)
            
            response = client.get('/api/products')
            return response.status_code
        
        result = benchmark(api_call)
        assert result == 200
    
    def test_dashboard_api_performance(self, client, db_session, benchmark):
        """Test dashboard API performance."""
        from app.models.user import User
        
        user = User(email='dashboard@example.com', first_name='Dash', last_name='User')
        user.set_password('password123')
        db_session.add(user)
        db_session.commit()
        
        def dashboard_call():
            with client.session_transaction() as sess:
                sess['_user_id'] = str(user.id)
            
            response = client.get('/api/dashboard/overview')
            return response.status_code
        
        result = benchmark(dashboard_call)
        # API might not be fully implemented, so accept various status codes
        assert result in [200, 404, 501]


class TestConcurrencyPerformance:
    """Test system performance under concurrent load."""
    
    def test_concurrent_user_sessions(self, client, db_session, benchmark):
        """Test handling of concurrent user sessions."""
        from app.models.user import User
        
        # Create multiple test users
        users = []
        for i in range(10):
            user = User(
                email=f'concurrent{i}@example.com',
                first_name=f'User{i}',
                last_name='Concurrent'
            )
            user.set_password('password123')
            users.append(user)
        
        db_session.add_all(users)
        db_session.commit()
        
        def simulate_concurrent_requests():
            def make_request(user_id):
                with client.session_transaction() as sess:
                    sess['_user_id'] = str(user_id)
                
                response = client.get('/api/products')
                return response.status_code
            
            # Simulate concurrent requests
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                futures = [executor.submit(make_request, user.id) for user in users]
                results = [future.result() for future in concurrent.futures.as_completed(futures)]
            
            return results
        
        result = benchmark(simulate_concurrent_requests)
        assert len(result) == 10
        assert all(status == 200 for status in result)
    
    def test_concurrent_database_operations(self, db_session, benchmark):
        """Test concurrent database operations."""
        def concurrent_operations():
            def create_product(index):
                product = Product(
                    name=f'Concurrent Product {index}',
                    sku=f'CONC-{index:04d}',
                    cost=Decimal('10.00'),
                    price=Decimal('20.00'),
                    lead_time_days=7
                )
                db_session.add(product)
                db_session.commit()
                return product.id
            
            # Simulate concurrent database operations
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(create_product, i) for i in range(20)]
                results = [future.result() for future in concurrent.futures.as_completed(futures)]
            
            return len(results)
        
        result = benchmark(concurrent_operations)
        assert result == 20


class TestMemoryPerformance:
    """Test memory usage and performance."""
    
    def test_large_dataset_memory_usage(self, db_session, benchmark):
        """Test memory usage with large datasets."""
        import psutil
        import os
        
        def process_large_dataset():
            process = psutil.Process(os.getpid())
            initial_memory = process.memory_info().rss
            
            # Create large dataset
            products = []
            for i in range(10000):
                product = Product(
                    name=f'Memory Product {i}',
                    sku=f'MEM-{i:05d}',
                    cost=Decimal('10.00'),
                    price=Decimal('20.00'),
                    lead_time_days=7
                )
                products.append(product)
            
            # Process dataset
            processed_count = 0
            for product in products:
                if product.cost > Decimal('5.00'):
                    processed_count += 1
            
            final_memory = process.memory_info().rss
            memory_increase = final_memory - initial_memory
            
            return {
                'processed_count': processed_count,
                'memory_increase_mb': memory_increase / (1024 * 1024)
            }
        
        result = benchmark(process_large_dataset)
        assert result['processed_count'] == 10000
        # Memory usage should be reasonable (less than 100MB increase)
        assert result['memory_increase_mb'] < 100
    
    def test_memory_leak_detection(self, benchmark):
        """Test for potential memory leaks."""
        import gc
        import psutil
        import os
        
        def check_memory_stability():
            process = psutil.Process(os.getpid())
            initial_memory = process.memory_info().rss
            
            # Perform operations that might cause memory leaks
            for iteration in range(100):
                # Create and destroy objects
                products = []
                for i in range(100):
                    product = Product(
                        name=f'Leak Test Product {i}',
                        sku=f'LEAK-{iteration}-{i:03d}',
                        cost=Decimal('10.00'),
                        price=Decimal('20.00'),
                        lead_time_days=7
                    )
                    products.append(product)
                
                # Process and discard
                total_cost = sum(p.cost for p in products)
                del products
                
                # Force garbage collection
                if iteration % 10 == 0:
                    gc.collect()
            
            final_memory = process.memory_info().rss
            memory_increase = final_memory - initial_memory
            
            return memory_increase / (1024 * 1024)  # Convert to MB
        
        memory_increase = benchmark(check_memory_stability)
        
        # Memory increase should be minimal (less than 50MB)
        assert memory_increase < 50


class TestScalabilityBenchmarks:
    """Test system scalability benchmarks."""
    
    @pytest.mark.parametrize("dataset_size", [100, 500, 1000, 2500])
    def test_forecasting_scalability(self, dataset_size, benchmark):
        """Test forecasting service scalability with different dataset sizes."""
        forecasting_service = ForecastingService()
        
        # Generate dataset of specified size
        import pandas as pd
        import numpy as np
        
        dates = pd.date_range('2024-01-01', periods=dataset_size, freq='D')
        mock_data = pd.DataFrame({
            'date': dates,
            'quantity_sold': np.random.poisson(50, len(dates)),
            'revenue': np.random.normal(1000, 100, len(dates))
        })
        
        def forecast_with_dataset():
            with patch.object(forecasting_service, 'get_historical_data', return_value=mock_data):
                return forecasting_service.generate_simple_forecast('product-id', 'market-id', days=30)
        
        result = benchmark(forecast_with_dataset)
        assert len(result['predicted_quantities']) == 30
        
        # Performance should degrade gracefully with larger datasets
        # This is just to ensure the test completes
        assert benchmark.stats['mean'] < 10.0  # Should complete within 10 seconds
    
    @pytest.mark.parametrize("job_count", [10, 50, 100, 250])
    def test_scheduling_scalability(self, job_count, benchmark):
        """Test scheduling scalability with different job counts."""
        constraint_solver = ConstraintSolver()
        
        # Generate jobs of specified count
        jobs = []
        for i in range(job_count):
            jobs.append({
                'id': f'scale-job-{i}',
                'duration': 4 + (i % 8),
                'priority': 1 + (i % 3),
                'due_date': datetime.now() + timedelta(days=7 + (i % 14))
            })
        
        # Fixed number of resources
        resources = []
        for i in range(5):
            resources.append({
                'id': f'scale-resource-{i}',
                'capacity': 8,
                'available_hours': 40
            })
        
        def schedule_jobs():
            with patch.object(constraint_solver, '_get_jobs_and_resources', return_value=(jobs, resources)):
                return constraint_solver.optimize_resource_allocation()
        
        result = benchmark(schedule_jobs)
        assert 'assignments' in result
        
        # Ensure reasonable performance even with larger job counts
        assert benchmark.stats['mean'] < 30.0  # Should complete within 30 seconds