import pytest
from datetime import datetime, timedelta
from decimal import Decimal

from app.models import (
    User, Product, Market, SalesChannel, Job, Resource, Schedule,
    HistoricalSales, Forecast, InventoryLevel, WorkingCapital,
    DataImport, ImportError, ApiCredential, SystemAlert
)


class TestUserModel:
    """Test User model functionality."""
    
    def test_user_creation(self, db_session):
        """Test creating a user."""
        user = User(
            email='test@example.com',
            first_name='Test',
            last_name='User'
        )
        user.set_password('password123')
        
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.email == 'test@example.com'
        assert user.full_name == 'Test User'
        assert user.check_password('password123') is True
        assert user.check_password('wrongpassword') is False
    
    def test_user_password_hashing(self):
        """Test password hashing functionality."""
        user = User(email='test@example.com')
        user.set_password('password123')
        
        assert user.password_hash is not None
        assert user.password_hash != 'password123'
        assert user.check_password('password123') is True
        assert user.check_password('wrongpassword') is False
    
    def test_user_repr(self):
        """Test user string representation."""
        user = User(email='test@example.com', first_name='Test', last_name='User')
        assert repr(user) == '<User test@example.com>'


class TestProductModel:
    """Test Product model functionality."""
    
    def test_product_creation(self, db_session):
        """Test creating a product."""
        product = Product(
            name='Test Product',
            sku='TEST-001',
            cost=Decimal('10.00'),
            price=Decimal('20.00'),
            lead_time_days=7
        )
        
        db_session.add(product)
        db_session.commit()
        
        assert product.id is not None
        assert product.name == 'Test Product'
        assert product.sku == 'TEST-001'
        assert product.cost == Decimal('10.00')
        assert product.price == Decimal('20.00')
        assert product.lead_time_days == 7
    
    def test_product_profit_margin(self, db_session):
        """Test product profit margin calculation."""
        product = Product(
            name='Test Product',
            sku='TEST-001',
            cost=Decimal('10.00'),
            price=Decimal('20.00')
        )
        
        expected_margin = ((Decimal('20.00') - Decimal('10.00')) / Decimal('20.00')) * 100
        assert product.profit_margin == expected_margin
    
    def test_product_repr(self):
        """Test product string representation."""
        product = Product(name='Test Product', sku='TEST-001')
        assert repr(product) == '<Product TEST-001: Test Product>'


class TestJobModel:
    """Test Job model functionality."""
    
    def test_job_creation(self, db_session, sample_product):
        """Test creating a job."""
        db_session.add(sample_product)
        db_session.commit()
        
        job = Job(
            product_id=sample_product.id,
            quantity=100,
            priority=1,
            status='pending',
            due_date=datetime.now() + timedelta(days=7)
        )
        
        db_session.add(job)
        db_session.commit()
        
        assert job.id is not None
        assert job.product_id == sample_product.id
        assert job.quantity == 100
        assert job.priority == 1
        assert job.status == 'pending'
    
    def test_job_status_validation(self):
        """Test job status validation."""
        job = Job(quantity=100, priority=1)
        
        # Valid statuses
        valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        for status in valid_statuses:
            job.status = status
            assert job.status == status
    
    def test_job_repr(self, sample_product):
        """Test job string representation."""
        job = Job(product_id=sample_product.id, quantity=100, priority=1)
        expected = f'<Job {job.id}: {100} units of {sample_product.id}>'
        assert repr(job) == expected


class TestResourceModel:
    """Test Resource model functionality."""
    
    def test_resource_creation(self, db_session):
        """Test creating a resource."""
        resource = Resource(
            name='Test Machine',
            capacity=100,
            resource_type='machine',
            hourly_cost=Decimal('50.00')
        )
        
        db_session.add(resource)
        db_session.commit()
        
        assert resource.id is not None
        assert resource.name == 'Test Machine'
        assert resource.capacity == 100
        assert resource.resource_type == 'machine'
        assert resource.hourly_cost == Decimal('50.00')
    
    def test_resource_availability(self):
        """Test resource availability calculation."""
        resource = Resource(name='Test Machine', capacity=100)
        # Add test for availability calculation when implemented
        assert resource.capacity == 100
    
    def test_resource_repr(self):
        """Test resource string representation."""
        resource = Resource(name='Test Machine', resource_type='machine')
        assert repr(resource) == '<Resource Test Machine (machine)>'


class TestScheduleModel:
    """Test Schedule model functionality."""
    
    def test_schedule_creation(self, db_session, sample_job, sample_resource):
        """Test creating a schedule."""
        db_session.add_all([sample_job, sample_resource])
        db_session.commit()
        
        start_time = datetime.now()
        end_time = start_time + timedelta(hours=8)
        
        schedule = Schedule(
            job_id=sample_job.id,
            resource_id=sample_resource.id,
            start_time=start_time,
            end_time=end_time,
            status='scheduled'
        )
        
        db_session.add(schedule)
        db_session.commit()
        
        assert schedule.id is not None
        assert schedule.job_id == sample_job.id
        assert schedule.resource_id == sample_resource.id
        assert schedule.status == 'scheduled'
    
    def test_schedule_duration(self):
        """Test schedule duration calculation."""
        start_time = datetime(2024, 1, 1, 9, 0, 0)
        end_time = datetime(2024, 1, 1, 17, 0, 0)
        
        schedule = Schedule(
            start_time=start_time,
            end_time=end_time
        )
        
        expected_duration = timedelta(hours=8)
        assert schedule.duration == expected_duration
    
    def test_schedule_repr(self, sample_job, sample_resource):
        """Test schedule string representation."""
        schedule = Schedule(
            job_id=sample_job.id,
            resource_id=sample_resource.id
        )
        expected = f'<Schedule {schedule.id}: Job {sample_job.id} on Resource {sample_resource.id}>'
        assert repr(schedule) == expected


class TestMarketModel:
    """Test Market model functionality."""
    
    def test_market_creation(self, db_session):
        """Test creating a market."""
        market = Market(
            name='US Market',
            country='US',
            currency='USD',
            timezone='America/New_York'
        )
        
        db_session.add(market)
        db_session.commit()
        
        assert market.id is not None
        assert market.name == 'US Market'
        assert market.country == 'US'
        assert market.currency == 'USD'
    
    def test_market_repr(self):
        """Test market string representation."""
        market = Market(name='US Market', country='US')
        assert repr(market) == '<Market US Market (US)>'


class TestHistoricalSalesModel:
    """Test HistoricalSales model functionality."""
    
    def test_historical_sales_creation(self, db_session, sample_product, sample_market):
        """Test creating historical sales record."""
        db_session.add_all([sample_product, sample_market])
        db_session.commit()
        
        sales = HistoricalSales(
            product_id=sample_product.id,
            market_id=sample_market.id,
            date=datetime.now().date(),
            quantity_sold=50,
            revenue=Decimal('1000.00'),
            channel='online'
        )
        
        db_session.add(sales)
        db_session.commit()
        
        assert sales.id is not None
        assert sales.product_id == sample_product.id
        assert sales.market_id == sample_market.id
        assert sales.quantity_sold == 50
        assert sales.revenue == Decimal('1000.00')


class TestForecastModel:
    """Test Forecast model functionality."""
    
    def test_forecast_creation(self, db_session, sample_product, sample_market):
        """Test creating a forecast."""
        db_session.add_all([sample_product, sample_market])
        db_session.commit()
        
        forecast_date = datetime.now().date() + timedelta(days=30)
        
        forecast = Forecast(
            product_id=sample_product.id,
            market_id=sample_market.id,
            forecast_date=forecast_date,
            predicted_quantity=75,
            confidence_interval=0.95,
            model_version='v1.0'
        )
        
        db_session.add(forecast)
        db_session.commit()
        
        assert forecast.id is not None
        assert forecast.predicted_quantity == 75
        assert forecast.confidence_interval == 0.95


class TestInventoryLevelModel:
    """Test InventoryLevel model functionality."""
    
    def test_inventory_level_creation(self, db_session, sample_product):
        """Test creating an inventory level record."""
        db_session.add(sample_product)
        db_session.commit()
        
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
        
        assert inventory.id is not None
        assert inventory.current_stock == 100
        assert inventory.available_stock == 75
        assert inventory.reorder_point == 50
    
    def test_inventory_stock_calculations(self):
        """Test inventory stock calculation methods."""
        inventory = InventoryLevel(
            current_stock=100,
            reserved_stock=25
        )
        
        # Available stock should be calculated
        expected_available = inventory.current_stock - inventory.reserved_stock
        assert inventory.available_stock == expected_available or inventory.available_stock == 75


class TestDataImportModel:
    """Test DataImport model functionality."""
    
    def test_data_import_creation(self, db_session):
        """Test creating a data import record."""
        data_import = DataImport(
            filename='test_data.csv',
            file_size=1024,
            status='pending',
            import_type='products'
        )
        
        db_session.add(data_import)
        db_session.commit()
        
        assert data_import.id is not None
        assert data_import.filename == 'test_data.csv'
        assert data_import.file_size == 1024
        assert data_import.status == 'pending'
    
    def test_import_error_creation(self, db_session):
        """Test creating an import error record."""
        error = ImportError(
            row_number=5,
            column_name='price',
            error_message='Invalid price format',
            error_type='validation'
        )
        
        db_session.add(error)
        db_session.commit()
        
        assert error.id is not None
        assert error.row_number == 5
        assert error.error_message == 'Invalid price format'