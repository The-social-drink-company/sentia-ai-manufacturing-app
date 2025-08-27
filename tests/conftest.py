import os
import sys
import pytest
import tempfile
from unittest.mock import patch, MagicMock

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@pytest.fixture(scope='session')
def app():
    """Create application for the tests."""
    from app import create_app
    from config import TestConfig
    
    # Create test app with SQLite in-memory database
    test_config = TestConfig()
    test_config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    test_config.WTF_CSRF_ENABLED = False
    test_config.TESTING = True
    
    app = create_app(test_config)
    
    with app.app_context():
        from app import db
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client for the Flask application."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create test CLI runner for the Flask application."""
    return app.test_cli_runner()

@pytest.fixture
def auth(client):
    """Authentication helper fixture."""
    class AuthActions:
        def __init__(self, client):
            self._client = client

        def login(self, username='test@example.com', password='testpass'):
            return self._client.post(
                '/auth/login',
                data={'email': username, 'password': password}
            )

        def logout(self):
            return self._client.get('/auth/logout')

    return AuthActions(client)

@pytest.fixture
def db_session(app):
    """Create database session for tests."""
    from app import db
    
    with app.app_context():
        yield db.session

@pytest.fixture
def sample_user():
    """Create sample user for testing."""
    from app.models.user import User
    user = User(
        id='550e8400-e29b-41d4-a716-446655440000',
        email='test@example.com',
        first_name='Test',
        last_name='User'
    )
    user.set_password('testpass')
    return user

@pytest.fixture
def sample_product():
    """Create sample product for testing."""
    from app.models.product import Product
    return Product(
        id='550e8400-e29b-41d4-a716-446655440001',
        name='Test Product',
        sku='TEST-001',
        cost=10.00,
        price=20.00,
        lead_time_days=7
    )

@pytest.fixture
def sample_market():
    """Create sample market for testing."""
    from app.models.market import Market
    return Market(
        id='550e8400-e29b-41d4-a716-446655440002',
        name='US Market',
        country='US',
        currency='USD'
    )

@pytest.fixture
def sample_job(sample_product):
    """Create sample job for testing."""
    from app.models.job import Job
    return Job(
        id='550e8400-e29b-41d4-a716-446655440003',
        product_id=sample_product.id,
        quantity=100,
        priority=1,
        status='pending'
    )

@pytest.fixture
def sample_resource():
    """Create sample resource for testing."""
    from app.models.resource import Resource
    return Resource(
        id='550e8400-e29b-41d4-a716-446655440004',
        name='Test Machine',
        capacity=100,
        resource_type='machine'
    )

@pytest.fixture
def mock_external_apis():
    """Mock external API calls for testing."""
    with patch('app.services.amazon_sp_client.AmazonSPClient') as mock_amazon, \
         patch('app.services.shopify_client.ShopifyClient') as mock_shopify, \
         patch('app.services.xero_client.XeroClient') as mock_xero:
        
        # Configure mock responses
        mock_amazon.return_value.get_orders.return_value = []
        mock_shopify.return_value.get_orders.return_value = []
        mock_xero.return_value.get_financial_data.return_value = {}
        
        yield {
            'amazon': mock_amazon,
            'shopify': mock_shopify,
            'xero': mock_xero
        }

@pytest.fixture
def temp_upload_dir():
    """Create temporary directory for file uploads."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Setup test environment variables."""
    test_env = {
        'FLASK_ENV': 'testing',
        'SECRET_KEY': 'test-secret-key',
        'DATABASE_URL': 'sqlite:///:memory:',
        'TESTING': 'True'
    }
    
    with patch.dict(os.environ, test_env):
        yield