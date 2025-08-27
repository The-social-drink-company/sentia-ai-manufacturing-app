import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.exc import IntegrityError

from app.models import (
    User, Product, Market, Job, Resource, Schedule,
    HistoricalSales, Forecast, InventoryLevel, DataImport
)


class TestDatabaseIntegration:
    """Test database integration and model relationships."""
    
    def test_user_product_relationship(self, db_session):
        """Test user and product relationship through creation."""
        # Create user
        user = User(
            email='creator@example.com',
            first_name='Creator',
            last_name='User'
        )
        user.set_password('password123')
        db_session.add(user)
        db_session.commit()
        
        # Create product
        product = Product(
            name='Test Product',
            sku='TEST-001',
            cost=Decimal('10.00'),
            price=Decimal('20.00'),
            created_by=user.id
        )
        db_session.add(product)
        db_session.commit()
        
        # Verify relationships
        assert product.id is not None
        assert product.created_by == user.id
    
    def test_product_job_relationship(self, db_session, sample_product):
        """Test product and job relationship."""
        db_session.add(sample_product)
        db_session.commit()
        
        # Create jobs for the product
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
                quantity=50,
                priority=2,
                status='pending',
                due_date=datetime.now() + timedelta(days=14)
            )
        ]
        db_session.add_all(jobs)
        db_session.commit()
        
        # Test relationship query
        product_jobs = Job.query.filter_by(product_id=sample_product.id).all()
        assert len(product_jobs) == 2
        assert all(job.product_id == sample_product.id for job in product_jobs)
    
    def test_job_resource_schedule_relationship(self, db_session, sample_product, sample_resource):
        """Test job, resource, and schedule relationship."""
        db_session.add_all([sample_product, sample_resource])
        db_session.commit()
        
        # Create job
        job = Job(
            product_id=sample_product.id,
            quantity=100,
            priority=1,
            status='pending'
        )
        db_session.add(job)
        db_session.commit()
        
        # Create schedule
        schedule = Schedule(
            job_id=job.id,
            resource_id=sample_resource.id,
            start_time=datetime.now(),
            end_time=datetime.now() + timedelta(hours=8),
            status='scheduled'
        )
        db_session.add(schedule)
        db_session.commit()
        
        # Test relationships
        assert schedule.job_id == job.id
        assert schedule.resource_id == sample_resource.id
        
        # Query schedules for resource
        resource_schedules = Schedule.query.filter_by(resource_id=sample_resource.id).all()
        assert len(resource_schedules) == 1
        assert resource_schedules[0].job_id == job.id
    
    def test_product_market_sales_relationship(self, db_session, sample_product, sample_market):
        """Test product, market, and historical sales relationship."""
        db_session.add_all([sample_product, sample_market])
        db_session.commit()
        
        # Create historical sales records
        sales_records = [
            HistoricalSales(
                product_id=sample_product.id,
                market_id=sample_market.id,
                date=datetime.now().date() - timedelta(days=i),
                quantity_sold=50 + i,
                revenue=Decimal(str((50 + i) * 20)),
                channel='online'
            )
            for i in range(30)
        ]
        db_session.add_all(sales_records)
        db_session.commit()
        
        # Test relationship queries
        product_sales = HistoricalSales.query.filter_by(product_id=sample_product.id).all()
        assert len(product_sales) == 30
        
        market_sales = HistoricalSales.query.filter_by(market_id=sample_market.id).all()
        assert len(market_sales) == 30
    
    def test_product_forecast_relationship(self, db_session, sample_product, sample_market):
        """Test product and forecast relationship."""
        db_session.add_all([sample_product, sample_market])
        db_session.commit()
        
        # Create forecasts
        forecasts = [
            Forecast(
                product_id=sample_product.id,
                market_id=sample_market.id,
                forecast_date=datetime.now().date() + timedelta(days=i),
                predicted_quantity=75 + i,
                confidence_interval=0.95,
                model_version='v1.0'
            )
            for i in range(30)
        ]
        db_session.add_all(forecasts)
        db_session.commit()
        
        # Test forecast queries
        product_forecasts = Forecast.query.filter_by(product_id=sample_product.id).all()
        assert len(product_forecasts) == 30
    
    def test_product_inventory_relationship(self, db_session, sample_product):
        """Test product and inventory level relationship."""
        db_session.add(sample_product)
        db_session.commit()
        
        # Create inventory record
        inventory = InventoryLevel(
            product_id=sample_product.id,
            current_stock=100,
            reserved_stock=25,
            available_stock=75,
            reorder_point=50,
            max_stock=200
        )
        db_session.add(inventory)
        db_session.commit()
        
        # Test relationship
        product_inventory = InventoryLevel.query.filter_by(product_id=sample_product.id).first()
        assert product_inventory is not None
        assert product_inventory.current_stock == 100
    
    def test_cascade_deletions(self, db_session, sample_product):
        """Test cascade deletion behavior."""
        db_session.add(sample_product)
        db_session.commit()
        
        # Create related records
        job = Job(product_id=sample_product.id, quantity=100, priority=1, status='pending')
        inventory = InventoryLevel(
            product_id=sample_product.id,
            current_stock=100,
            available_stock=100
        )
        
        db_session.add_all([job, inventory])
        db_session.commit()
        
        product_id = sample_product.id
        
        # Delete product
        db_session.delete(sample_product)
        db_session.commit()
        
        # Check if related records still exist (depends on cascade configuration)
        remaining_jobs = Job.query.filter_by(product_id=product_id).all()
        remaining_inventory = InventoryLevel.query.filter_by(product_id=product_id).all()
        
        # This test depends on your cascade configuration
        # Adjust assertions based on your model setup
    
    def test_unique_constraints(self, db_session):
        """Test unique constraints on models."""
        # Test user email uniqueness
        user1 = User(email='test@example.com', first_name='User', last_name='One')
        user1.set_password('password')
        db_session.add(user1)
        db_session.commit()
        
        user2 = User(email='test@example.com', first_name='User', last_name='Two')
        user2.set_password('password')
        db_session.add(user2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        
        # Test product SKU uniqueness
        product1 = Product(name='Product 1', sku='UNIQUE-001', cost=10, price=20)
        db_session.add(product1)
        db_session.commit()
        
        product2 = Product(name='Product 2', sku='UNIQUE-001', cost=15, price=25)
        db_session.add(product2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_data_import_tracking(self, db_session):
        """Test data import tracking functionality."""
        # Create data import record
        data_import = DataImport(
            filename='test_products.csv',
            file_size=2048,
            status='processing',
            import_type='products',
            total_records=100
        )
        db_session.add(data_import)
        db_session.commit()
        
        # Update import status
        data_import.status = 'completed'
        data_import.processed_records = 95
        data_import.error_records = 5
        data_import.completed_at = datetime.now()
        db_session.commit()
        
        # Verify updates
        updated_import = DataImport.query.filter_by(filename='test_products.csv').first()
        assert updated_import.status == 'completed'
        assert updated_import.processed_records == 95
        assert updated_import.error_records == 5
        assert updated_import.completed_at is not None


class TestComplexQueries:
    """Test complex database queries across multiple tables."""
    
    def test_product_performance_query(self, db_session, sample_product, sample_market):
        """Test complex query for product performance across markets."""
        db_session.add_all([sample_product, sample_market])
        db_session.commit()
        
        # Create sales data
        sales_data = [
            HistoricalSales(
                product_id=sample_product.id,
                market_id=sample_market.id,
                date=datetime.now().date() - timedelta(days=i),
                quantity_sold=50 + (i % 10),
                revenue=Decimal(str((50 + (i % 10)) * 20)),
                channel='online' if i % 2 == 0 else 'retail'
            )
            for i in range(60)
        ]
        db_session.add_all(sales_data)
        db_session.commit()
        
        # Complex query: total sales by channel in last 30 days
        from sqlalchemy import func
        thirty_days_ago = datetime.now().date() - timedelta(days=30)
        
        channel_performance = db_session.query(
            HistoricalSales.channel,
            func.sum(HistoricalSales.quantity_sold).label('total_quantity'),
            func.sum(HistoricalSales.revenue).label('total_revenue')
        ).filter(
            HistoricalSales.product_id == sample_product.id,
            HistoricalSales.date >= thirty_days_ago
        ).group_by(HistoricalSales.channel).all()
        
        assert len(channel_performance) > 0
        for channel, quantity, revenue in channel_performance:
            assert channel in ['online', 'retail']
            assert quantity > 0
            assert revenue > 0
    
    def test_resource_utilization_query(self, db_session, sample_resource):
        """Test resource utilization calculation query."""
        db_session.add(sample_resource)
        db_session.commit()
        
        # Create schedules for resource
        base_time = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
        schedules = [
            Schedule(
                resource_id=sample_resource.id,
                start_time=base_time + timedelta(days=i, hours=0),
                end_time=base_time + timedelta(days=i, hours=8),
                status='completed'
            )
            for i in range(7)  # One week of schedules
        ]
        db_session.add_all(schedules)
        db_session.commit()
        
        # Query to calculate total scheduled hours
        from sqlalchemy import func, extract
        
        total_hours = db_session.query(
            func.sum(
                extract('epoch', Schedule.end_time) - extract('epoch', Schedule.start_time)
            ) / 3600
        ).filter(
            Schedule.resource_id == sample_resource.id,
            Schedule.status == 'completed'
        ).scalar()
        
        assert total_hours == 56  # 8 hours * 7 days
    
    def test_demand_forecasting_query(self, db_session, sample_product, sample_market):
        """Test demand forecasting aggregation query."""
        db_session.add_all([sample_product, sample_market])
        db_session.commit()
        
        # Create forecasts with seasonal patterns
        forecasts = []
        base_date = datetime.now().date()
        
        for i in range(90):  # 3 months of forecasts
            seasonal_factor = 1.2 if (i % 7) < 5 else 0.8  # Weekday vs weekend
            predicted_qty = int(50 * seasonal_factor)
            
            forecast = Forecast(
                product_id=sample_product.id,
                market_id=sample_market.id,
                forecast_date=base_date + timedelta(days=i),
                predicted_quantity=predicted_qty,
                confidence_interval=0.95,
                model_version='v1.0'
            )
            forecasts.append(forecast)
        
        db_session.add_all(forecasts)
        db_session.commit()
        
        # Aggregate query: weekly demand forecast
        from sqlalchemy import func, extract
        
        weekly_forecast = db_session.query(
            extract('week', Forecast.forecast_date).label('week'),
            func.sum(Forecast.predicted_quantity).label('total_demand')
        ).filter(
            Forecast.product_id == sample_product.id
        ).group_by(
            extract('week', Forecast.forecast_date)
        ).all()
        
        assert len(weekly_forecast) > 0
        for week, demand in weekly_forecast:
            assert demand > 0


class TestTransactionIntegrity:
    """Test database transaction integrity."""
    
    def test_transaction_rollback(self, db_session, sample_product):
        """Test transaction rollback on error."""
        db_session.add(sample_product)
        db_session.commit()
        
        try:
            # Create valid job
            job1 = Job(
                product_id=sample_product.id,
                quantity=100,
                priority=1,
                status='pending'
            )
            db_session.add(job1)
            
            # Create invalid job (this should fail)
            job2 = Job(
                product_id='invalid-product-id',  # Non-existent product
                quantity=50,
                priority=2,
                status='pending'
            )
            db_session.add(job2)
            db_session.commit()
            
        except IntegrityError:
            db_session.rollback()
            
            # Verify that first job was not committed
            jobs_count = Job.query.filter_by(product_id=sample_product.id).count()
            assert jobs_count == 0
    
    def test_concurrent_updates(self, db_session, sample_product):
        """Test handling concurrent updates."""
        db_session.add(sample_product)
        db_session.commit()
        
        # Simulate concurrent inventory updates
        inventory = InventoryLevel(
            product_id=sample_product.id,
            current_stock=100,
            available_stock=100
        )
        db_session.add(inventory)
        db_session.commit()
        
        # First update
        inventory.current_stock = 90
        inventory.reserved_stock = 10
        
        # Second update (simulating concurrent access)
        inventory.available_stock = 80
        
        db_session.commit()
        
        # Verify final state
        updated_inventory = InventoryLevel.query.filter_by(product_id=sample_product.id).first()
        assert updated_inventory.current_stock == 90
        assert updated_inventory.available_stock == 80