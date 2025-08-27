import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import patch, Mock

from app.models import User, Product, Job, Resource


class TestAuthAPI:
    """Test authentication API endpoints."""
    
    def test_login_endpoint(self, client, db_session):
        """Test user login endpoint."""
        # Create test user
        user = User(email='test@example.com', first_name='Test', last_name='User')
        user.set_password('password123')
        db_session.add(user)
        db_session.commit()
        
        response = client.post('/auth/login', data={
            'email': 'test@example.com',
            'password': 'password123'
        })
        
        assert response.status_code == 302  # Redirect after successful login
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        response = client.post('/auth/login', data={
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 200  # Returns to login page
    
    def test_logout_endpoint(self, client, auth, db_session, sample_user):
        """Test user logout endpoint."""
        db_session.add(sample_user)
        db_session.commit()
        
        auth.login()
        response = auth.logout()
        
        assert response.status_code == 302  # Redirect after logout
    
    def test_register_endpoint(self, client):
        """Test user registration endpoint."""
        response = client.post('/auth/register', data={
            'email': 'newuser@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'password123',
            'password2': 'password123'
        })
        
        # Check if registration was successful or redirects
        assert response.status_code in [200, 302]


class TestProductAPI:
    """Test product API endpoints."""
    
    def test_get_products_list(self, client, db_session, sample_user):
        """Test getting products list."""
        db_session.add(sample_user)
        db_session.commit()
        
        # Create test products
        products = [
            Product(name='Product 1', sku='PROD-001', cost=10.00, price=20.00),
            Product(name='Product 2', sku='PROD-002', cost=15.00, price=25.00)
        ]
        db_session.add_all(products)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        response = client.get('/api/products')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert len(data) >= 2
    
    def test_create_product(self, client, db_session, sample_user):
        """Test creating a new product."""
        db_session.add(sample_user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        product_data = {
            'name': 'New Product',
            'sku': 'NEW-001',
            'cost': 12.50,
            'price': 25.00,
            'lead_time_days': 10
        }
        
        response = client.post('/api/products',
                             data=json.dumps(product_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
    
    def test_get_single_product(self, client, db_session, sample_user, sample_product):
        """Test getting a single product."""
        db_session.add_all([sample_user, sample_product])
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        response = client.get(f'/api/products/{sample_product.id}')
        
        if response.status_code == 200:
            data = json.loads(response.data)
            assert data['name'] == sample_product.name
            assert data['sku'] == sample_product.sku
    
    def test_update_product(self, client, db_session, sample_user, sample_product):
        """Test updating a product."""
        db_session.add_all([sample_user, sample_product])
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        updated_data = {
            'name': 'Updated Product Name',
            'price': 30.00
        }
        
        response = client.put(f'/api/products/{sample_product.id}',
                            data=json.dumps(updated_data),
                            content_type='application/json')
        
        assert response.status_code in [200, 204]
    
    def test_delete_product(self, client, db_session, sample_user, sample_product):
        """Test deleting a product."""
        db_session.add_all([sample_user, sample_product])
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        response = client.delete(f'/api/products/{sample_product.id}')
        assert response.status_code in [200, 204]


class TestJobAPI:
    """Test job API endpoints."""
    
    def test_get_jobs_list(self, client, db_session, sample_user, sample_product):
        """Test getting jobs list."""
        db_session.add_all([sample_user, sample_product])
        db_session.commit()
        
        # Create test jobs
        jobs = [
            Job(product_id=sample_product.id, quantity=100, priority=1, status='pending'),
            Job(product_id=sample_product.id, quantity=50, priority=2, status='in_progress')
        ]
        db_session.add_all(jobs)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        response = client.get('/api/jobs')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert len(data) >= 2
    
    def test_create_job(self, client, db_session, sample_user, sample_product):
        """Test creating a new job."""
        db_session.add_all([sample_user, sample_product])
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        job_data = {
            'product_id': str(sample_product.id),
            'quantity': 75,
            'priority': 1,
            'due_date': (datetime.now() + timedelta(days=14)).isoformat()
        }
        
        response = client.post('/api/jobs',
                             data=json.dumps(job_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
    
    def test_update_job_status(self, client, db_session, sample_user, sample_product):
        """Test updating job status."""
        db_session.add_all([sample_user, sample_product])
        db_session.commit()
        
        job = Job(product_id=sample_product.id, quantity=100, priority=1, status='pending')
        db_session.add(job)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        update_data = {'status': 'in_progress'}
        
        response = client.put(f'/api/jobs/{job.id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        
        assert response.status_code in [200, 204]


class TestResourceAPI:
    """Test resource API endpoints."""
    
    def test_get_resources_list(self, client, db_session, sample_user):
        """Test getting resources list."""
        db_session.add(sample_user)
        db_session.commit()
        
        # Create test resources
        resources = [
            Resource(name='Machine 1', capacity=100, resource_type='machine'),
            Resource(name='Worker 1', capacity=8, resource_type='worker')
        ]
        db_session.add_all(resources)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        response = client.get('/api/resources')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert len(data) >= 2
    
    def test_create_resource(self, client, db_session, sample_user):
        """Test creating a new resource."""
        db_session.add(sample_user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        resource_data = {
            'name': 'New Machine',
            'capacity': 150,
            'resource_type': 'machine',
            'hourly_cost': 75.00
        }
        
        response = client.post('/api/resources',
                             data=json.dumps(resource_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
    
    @patch('app.services.constraint_solver.ConstraintSolver.calculate_resource_utilization')
    def test_get_resource_utilization(self, mock_utilization, client, db_session, sample_user, sample_resource):
        """Test getting resource utilization."""
        mock_utilization.return_value = 75.5
        
        db_session.add_all([sample_user, sample_resource])
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        response = client.get(f'/api/resources/{sample_resource.id}/utilization')
        
        if response.status_code == 200:
            data = json.loads(response.data)
            assert 'utilization' in data


class TestForecastAPI:
    """Test forecast API endpoints."""
    
    @patch('app.services.forecasting_service.ForecastingService.generate_simple_forecast')
    def test_generate_forecast(self, mock_forecast, client, db_session, sample_user, sample_product, sample_market):
        """Test generating a forecast."""
        mock_forecast.return_value = {
            'forecast_dates': [(datetime.now() + timedelta(days=i)).date() for i in range(30)],
            'predicted_quantities': [50 + i for i in range(30)],
            'confidence_interval': 0.95
        }
        
        db_session.add_all([sample_user, sample_product, sample_market])
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        forecast_data = {
            'product_id': str(sample_product.id),
            'market_id': str(sample_market.id),
            'days': 30
        }
        
        response = client.post('/api/forecasts',
                             data=json.dumps(forecast_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]
    
    def test_get_forecast_history(self, client, db_session, sample_user):
        """Test getting forecast history."""
        db_session.add(sample_user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        response = client.get('/api/forecasts')
        assert response.status_code == 200


class TestOptimizationAPI:
    """Test optimization API endpoints."""
    
    @patch('app.services.stock_optimization_service.StockOptimizationService.calculate_optimal_stock_levels')
    def test_optimize_stock_levels(self, mock_optimize, client, db_session, sample_user):
        """Test stock optimization endpoint."""
        mock_optimize.return_value = [
            {'product_id': 'p1', 'optimal_stock': 100, 'reorder_point': 50},
            {'product_id': 'p2', 'optimal_stock': 75, 'reorder_point': 30}
        ]
        
        db_session.add(sample_user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        response = client.post('/api/optimization/stock')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert len(data) >= 2
    
    @patch('app.services.constraint_solver.ConstraintSolver.optimize_schedule')
    def test_optimize_schedule(self, mock_optimize, client, db_session, sample_user):
        """Test schedule optimization endpoint."""
        mock_optimize.return_value = {
            'schedules': [],
            'total_makespan': 120,
            'resource_utilization': {'r1': 85.5, 'r2': 72.3}
        }
        
        db_session.add(sample_user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        response = client.post('/api/optimization/schedule')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert 'schedules' in data
        assert 'total_makespan' in data


class TestDataImportAPI:
    """Test data import API endpoints."""
    
    def test_upload_file_endpoint(self, client, db_session, sample_user, temp_upload_dir):
        """Test file upload endpoint."""
        db_session.add(sample_user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        # Create test CSV file
        import io
        csv_content = "name,sku,cost,price\nTest Product,TEST-001,10.00,20.00"
        csv_file = (io.BytesIO(csv_content.encode('utf-8')), 'test.csv')
        
        response = client.post('/api/data-import/upload',
                             data={'file': csv_file},
                             content_type='multipart/form-data')
        
        assert response.status_code in [200, 201]
    
    def test_get_import_status(self, client, db_session, sample_user):
        """Test getting import status."""
        db_session.add(sample_user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        response = client.get('/api/data-import/status')
        assert response.status_code == 200


class TestErrorHandling:
    """Test API error handling."""
    
    def test_unauthorized_access(self, client):
        """Test unauthorized access to protected endpoints."""
        response = client.get('/api/products')
        assert response.status_code in [401, 302]  # Unauthorized or redirect to login
    
    def test_invalid_json_data(self, client, db_session, sample_user):
        """Test handling invalid JSON data."""
        db_session.add(sample_user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        response = client.post('/api/products',
                             data='invalid json',
                             content_type='application/json')
        
        assert response.status_code == 400
    
    def test_resource_not_found(self, client, db_session, sample_user):
        """Test handling resource not found."""
        db_session.add(sample_user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        response = client.get('/api/products/nonexistent-id')
        assert response.status_code == 404
    
    def test_validation_errors(self, client, db_session, sample_user):
        """Test handling validation errors."""
        db_session.add(sample_user)
        db_session.commit()
        
        with client.session_transaction() as sess:
            sess['_user_id'] = str(sample_user.id)
        
        # Invalid product data (missing required fields)
        invalid_data = {'name': ''}  # Empty name should fail validation
        
        response = client.post('/api/products',
                             data=json.dumps(invalid_data),
                             content_type='application/json')
        
        assert response.status_code == 400