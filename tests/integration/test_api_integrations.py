"""
API integration tests.
Tests for external API integrations including Amazon SP-API, Shopify, and Xero.
"""
import pytest
import json
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch, Mock, MagicMock
import requests
from requests.exceptions import RequestException, Timeout, ConnectionError

from app.services.amazon_sp_client import AmazonSPClient
from app.services.shopify_client import ShopifyClient
from app.services.xero_client import XeroClient
from app.services.api_integration_service import ApiIntegrationService
from app.models import ApiCredential, DataImport, ImportError


class TestAmazonSPAPIIntegration:
    """Test Amazon Selling Partner API integration - TC-API-001."""
    
    @pytest.fixture
    def amazon_client(self):
        """Create Amazon SP client with mock credentials."""
        credentials = {
            'client_id': 'test_client_id',
            'client_secret': 'test_client_secret',
            'refresh_token': 'test_refresh_token',
            'access_key': 'test_access_key',
            'secret_key': 'test_secret_key',
            'region': 'us-east-1'
        }
        return AmazonSPClient(credentials)
    
    @patch('app.services.amazon_sp_client.requests.post')
    def test_authentication_token_refresh(self, mock_post, amazon_client):
        """Test Amazon SP-API authentication token refresh - TC-API-004."""
        # Mock successful token refresh response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'access_token': 'new_access_token',
            'token_type': 'bearer',
            'expires_in': 3600
        }
        mock_post.return_value = mock_response
        
        token = amazon_client.refresh_access_token()
        
        assert token == 'new_access_token'
        mock_post.assert_called_once()
    
    @patch('app.services.amazon_sp_client.requests.post')
    def test_authentication_failure(self, mock_post, amazon_client):
        """Test handling of authentication failures."""
        # Mock authentication failure
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.json.return_value = {
            'error': 'invalid_client',
            'error_description': 'Client authentication failed'
        }
        mock_post.return_value = mock_response
        
        with pytest.raises(Exception) as exc_info:
            amazon_client.refresh_access_token()
        
        assert 'authentication failed' in str(exc_info.value).lower()
    
    @patch('app.services.amazon_sp_client.requests.get')
    def test_get_orders_success(self, mock_get, amazon_client):
        """Test successful orders retrieval from Amazon SP-API."""
        # Mock successful orders response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'payload': {
                'Orders': [
                    {
                        'AmazonOrderId': 'AMZ-001',
                        'PurchaseDate': '2024-01-15T10:30:00Z',
                        'OrderStatus': 'Shipped',
                        'FulfillmentChannel': 'MFN',
                        'SalesChannel': 'Amazon.com',
                        'OrderTotal': {
                            'CurrencyCode': 'USD',
                            'Amount': '125.99'
                        }
                    }
                ]
            }
        }
        mock_get.return_value = mock_response
        
        with patch.object(amazon_client, 'refresh_access_token', return_value='test_token'):
            orders = amazon_client.get_orders()
        
        assert len(orders) == 1
        assert orders[0]['AmazonOrderId'] == 'AMZ-001'
        assert orders[0]['OrderStatus'] == 'Shipped'
    
    @patch('app.services.amazon_sp_client.requests.get')
    def test_get_order_items(self, mock_get, amazon_client):
        """Test retrieval of order items from Amazon SP-API."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'payload': {
                'OrderItems': [
                    {
                        'ASIN': 'B0123456789',
                        'SellerSKU': 'PROD-001',
                        'OrderItemId': '12345',
                        'Title': 'Test Product',
                        'QuantityOrdered': 2,
                        'ItemPrice': {
                            'CurrencyCode': 'USD',
                            'Amount': '49.99'
                        }
                    }
                ]
            }
        }
        mock_get.return_value = mock_response
        
        with patch.object(amazon_client, 'refresh_access_token', return_value='test_token'):
            items = amazon_client.get_order_items('AMZ-001')
        
        assert len(items) == 1
        assert items[0]['SellerSKU'] == 'PROD-001'
        assert items[0]['QuantityOrdered'] == 2
    
    @patch('app.services.amazon_sp_client.requests.get')
    def test_get_inventory_summary(self, mock_get, amazon_client):
        """Test inventory summary retrieval."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'payload': {
                'inventorySummaries': [
                    {
                        'asin': 'B0123456789',
                        'fnSku': 'PROD-001',
                        'sellerSku': 'PROD-001',
                        'condition': 'NewItem',
                        'inventoryDetails': {
                            'fulfillableQuantity': 100,
                            'inboundWorkingQuantity': 25,
                            'inboundShippedQuantity': 10
                        }
                    }
                ]
            }
        }
        mock_get.return_value = mock_response
        
        with patch.object(amazon_client, 'refresh_access_token', return_value='test_token'):
            inventory = amazon_client.get_inventory_summary()
        
        assert len(inventory) == 1
        assert inventory[0]['sellerSku'] == 'PROD-001'
        assert inventory[0]['inventoryDetails']['fulfillableQuantity'] == 100
    
    @patch('app.services.amazon_sp_client.requests.get')
    def test_rate_limiting_handling(self, mock_get, amazon_client):
        """Test rate limiting handling - TC-API-005."""
        # Mock rate limit response
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.headers = {'Retry-After': '5'}
        mock_get.return_value = mock_response
        
        with patch.object(amazon_client, 'refresh_access_token', return_value='test_token'):
            with patch('time.sleep') as mock_sleep:
                with pytest.raises(Exception) as exc_info:
                    amazon_client.get_orders()
                
                # Should have attempted to wait for rate limit
                assert 'rate limit' in str(exc_info.value).lower()
    
    @patch('app.services.amazon_sp_client.requests.get')
    def test_api_error_handling(self, mock_get, amazon_client):
        """Test API error handling - TC-API-006."""
        # Test various error scenarios
        error_scenarios = [
            (400, {'error': 'InvalidParameterValue', 'message': 'Invalid parameter'}),
            (403, {'error': 'Forbidden', 'message': 'Access denied'}),
            (500, {'error': 'InternalError', 'message': 'Internal server error'}),
            (503, {'error': 'ServiceUnavailable', 'message': 'Service temporarily unavailable'})
        ]
        
        for status_code, error_body in error_scenarios:
            mock_response = Mock()
            mock_response.status_code = status_code
            mock_response.json.return_value = error_body
            mock_get.return_value = mock_response
            
            with patch.object(amazon_client, 'refresh_access_token', return_value='test_token'):
                with pytest.raises(Exception) as exc_info:
                    amazon_client.get_orders()
                
                assert error_body['error'].lower() in str(exc_info.value).lower()


class TestShopifyAPIIntegration:
    """Test Shopify API integration - TC-API-002."""
    
    @pytest.fixture
    def shopify_client(self):
        """Create Shopify client with mock credentials."""
        credentials = {
            'shop_name': 'test-shop',
            'access_token': 'test_access_token',
            'api_version': '2023-10'
        }
        return ShopifyClient(credentials)
    
    @patch('app.services.shopify_client.requests.get')
    def test_get_products_success(self, mock_get, shopify_client):
        """Test successful products retrieval from Shopify."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'products': [
                {
                    'id': 123456789,
                    'title': 'Test Product',
                    'handle': 'test-product',
                    'status': 'active',
                    'variants': [
                        {
                            'id': 987654321,
                            'sku': 'PROD-001',
                            'price': '29.99',
                            'inventory_quantity': 100
                        }
                    ]
                }
            ]
        }
        mock_get.return_value = mock_response
        
        products = shopify_client.get_products()
        
        assert len(products) == 1
        assert products[0]['title'] == 'Test Product'
        assert products[0]['variants'][0]['sku'] == 'PROD-001'
    
    @patch('app.services.shopify_client.requests.get')
    def test_get_orders_with_pagination(self, mock_get, shopify_client):
        """Test orders retrieval with pagination."""
        # Mock first page response
        first_page = Mock()
        first_page.status_code = 200
        first_page.json.return_value = {
            'orders': [
                {
                    'id': 111,
                    'order_number': 'SHOP-001',
                    'created_at': '2024-01-15T10:30:00Z',
                    'total_price': '99.99',
                    'line_items': [
                        {
                            'sku': 'PROD-001',
                            'quantity': 2,
                            'price': '49.99'
                        }
                    ]
                }
            ]
        }
        first_page.headers = {
            'Link': '<https://test-shop.myshopify.com/admin/api/2023-10/orders.json?page_info=next_page>; rel="next"'
        }
        
        # Mock second page response
        second_page = Mock()
        second_page.status_code = 200
        second_page.json.return_value = {
            'orders': [
                {
                    'id': 222,
                    'order_number': 'SHOP-002',
                    'created_at': '2024-01-16T11:30:00Z',
                    'total_price': '149.99'
                }
            ]
        }
        second_page.headers = {}
        
        mock_get.side_effect = [first_page, second_page]
        
        orders = shopify_client.get_orders(limit=1)
        
        assert len(orders) == 2
        assert orders[0]['order_number'] == 'SHOP-001'
        assert orders[1]['order_number'] == 'SHOP-002'
    
    @patch('app.services.shopify_client.requests.get')
    def test_get_inventory_levels(self, mock_get, shopify_client):
        """Test inventory levels retrieval."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'inventory_levels': [
                {
                    'inventory_item_id': 123,
                    'location_id': 456,
                    'available': 50
                },
                {
                    'inventory_item_id': 124,
                    'location_id': 456,
                    'available': 25
                }
            ]
        }
        mock_get.return_value = mock_response
        
        inventory = shopify_client.get_inventory_levels()
        
        assert len(inventory) == 2
        assert inventory[0]['available'] == 50
        assert inventory[1]['available'] == 25
    
    @patch('app.services.shopify_client.requests.put')
    def test_update_inventory_level(self, mock_put, shopify_client):
        """Test inventory level update."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'inventory_level': {
                'inventory_item_id': 123,
                'location_id': 456,
                'available': 75
            }
        }
        mock_put.return_value = mock_response
        
        result = shopify_client.update_inventory_level(
            inventory_item_id=123,
            location_id=456,
            quantity=75
        )
        
        assert result['available'] == 75
    
    def test_webhook_signature_verification(self, shopify_client):
        """Test Shopify webhook signature verification."""
        webhook_secret = 'test_webhook_secret'
        payload = b'{"test": "data"}'
        
        # Generate test signature
        import hmac
        import hashlib
        import base64
        
        signature = base64.b64encode(
            hmac.new(webhook_secret.encode(), payload, hashlib.sha256).digest()
        ).decode()
        
        is_valid = shopify_client.verify_webhook_signature(
            payload, signature, webhook_secret
        )
        
        assert is_valid is True
        
        # Test invalid signature
        is_invalid = shopify_client.verify_webhook_signature(
            payload, 'invalid_signature', webhook_secret
        )
        
        assert is_invalid is False


class TestXeroAPIIntegration:
    """Test Xero API integration - TC-API-003."""
    
    @pytest.fixture
    def xero_client(self):
        """Create Xero client with mock credentials."""
        credentials = {
            'client_id': 'test_client_id',
            'client_secret': 'test_client_secret',
            'access_token': 'test_access_token',
            'tenant_id': 'test_tenant_id'
        }
        return XeroClient(credentials)
    
    @patch('app.services.xero_client.requests.get')
    def test_get_invoices(self, mock_get, xero_client):
        """Test invoices retrieval from Xero."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'Invoices': [
                {
                    'InvoiceID': 'INV-001',
                    'InvoiceNumber': '2024-001',
                    'Type': 'ACCREC',
                    'Status': 'PAID',
                    'Date': '2024-01-15',
                    'DueDate': '2024-02-15',
                    'Total': 1250.00,
                    'AmountPaid': 1250.00,
                    'Contact': {
                        'Name': 'Test Customer'
                    }
                }
            ]
        }
        mock_get.return_value = mock_response
        
        invoices = xero_client.get_invoices()
        
        assert len(invoices) == 1
        assert invoices[0]['InvoiceNumber'] == '2024-001'
        assert invoices[0]['Total'] == 1250.00
    
    @patch('app.services.xero_client.requests.get')
    def test_get_bank_transactions(self, mock_get, xero_client):
        """Test bank transactions retrieval."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'BankTransactions': [
                {
                    'BankTransactionID': 'BT-001',
                    'Type': 'RECEIVE',
                    'Status': 'AUTHORISED',
                    'Date': '2024-01-15',
                    'Total': 500.00,
                    'Contact': {
                        'Name': 'Customer Payment'
                    },
                    'LineItems': [
                        {
                            'Description': 'Product Sale',
                            'Quantity': 10,
                            'UnitAmount': 50.00,
                            'LineAmount': 500.00
                        }
                    ]
                }
            ]
        }
        mock_get.return_value = mock_response
        
        transactions = xero_client.get_bank_transactions()
        
        assert len(transactions) == 1
        assert transactions[0]['Type'] == 'RECEIVE'
        assert transactions[0]['Total'] == 500.00
    
    @patch('app.services.xero_client.requests.get')
    def test_get_profit_and_loss_report(self, mock_get, xero_client):
        """Test profit and loss report retrieval."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'Reports': [
                {
                    'ReportID': 'ProfitAndLoss',
                    'ReportName': 'Profit and Loss',
                    'ReportTitles': ['Profit and Loss', 'Test Company'],
                    'Rows': [
                        {
                            'RowType': 'Section',
                            'Title': 'Income',
                            'Rows': [
                                {
                                    'RowType': 'Row',
                                    'Title': 'Sales',
                                    'Cells': [
                                        {'Value': '50000.00'}
                                    ]
                                }
                            ]
                        },
                        {
                            'RowType': 'Section',
                            'Title': 'Expenses',
                            'Rows': [
                                {
                                    'RowType': 'Row',
                                    'Title': 'Cost of Goods Sold',
                                    'Cells': [
                                        {'Value': '30000.00'}
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        mock_get.return_value = mock_response
        
        report = xero_client.get_profit_and_loss_report()
        
        assert report['ReportName'] == 'Profit and Loss'
        assert len(report['Rows']) == 2
    
    @patch('app.services.xero_client.requests.post')
    def test_create_invoice(self, mock_post, xero_client):
        """Test invoice creation in Xero."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'Invoices': [
                {
                    'InvoiceID': 'NEW-INV-001',
                    'InvoiceNumber': '2024-002',
                    'Type': 'ACCREC',
                    'Status': 'DRAFT',
                    'Total': 750.00
                }
            ]
        }
        mock_post.return_value = mock_response
        
        invoice_data = {
            'Type': 'ACCREC',
            'Contact': {'Name': 'New Customer'},
            'LineItems': [
                {
                    'Description': 'Product Sale',
                    'Quantity': 15,
                    'UnitAmount': 50.00
                }
            ]
        }
        
        result = xero_client.create_invoice(invoice_data)
        
        assert result['InvoiceID'] == 'NEW-INV-001'
        assert result['Total'] == 750.00


class TestAPIIntegrationService:
    """Test unified API integration service."""
    
    @pytest.fixture
    def integration_service(self, db_session):
        """Create API integration service."""
        return ApiIntegrationService(db_session)
    
    def test_sync_all_platforms(self, integration_service, db_session, mock_external_apis):
        """Test synchronization across all platforms - TC-API-007."""
        # Mock credentials
        amazon_cred = ApiCredential(
            platform='amazon',
            credential_name='sp_api',
            encrypted_data='encrypted_amazon_creds'
        )
        
        shopify_cred = ApiCredential(
            platform='shopify',
            credential_name='admin_api',
            encrypted_data='encrypted_shopify_creds'
        )
        
        xero_cred = ApiCredential(
            platform='xero',
            credential_name='accounting_api',
            encrypted_data='encrypted_xero_creds'
        )
        
        db_session.add_all([amazon_cred, shopify_cred, xero_cred])
        db_session.commit()
        
        # Mock successful sync responses
        with patch.object(integration_service, '_sync_amazon_data') as mock_amazon_sync, \
             patch.object(integration_service, '_sync_shopify_data') as mock_shopify_sync, \
             patch.object(integration_service, '_sync_xero_data') as mock_xero_sync:
            
            mock_amazon_sync.return_value = {'orders': 5, 'inventory_items': 10}
            mock_shopify_sync.return_value = {'orders': 3, 'products': 15}
            mock_xero_sync.return_value = {'invoices': 8, 'transactions': 12}
            
            result = integration_service.sync_all_platforms()
            
            assert 'amazon' in result
            assert 'shopify' in result
            assert 'xero' in result
            assert result['amazon']['orders'] == 5
            assert result['shopify']['products'] == 15
            assert result['xero']['invoices'] == 8
    
    def test_data_transformation_mapping(self, integration_service):
        """Test data transformation and mapping - TC-IMPORT-003."""
        # Test Amazon order transformation
        amazon_order = {
            'AmazonOrderId': 'AMZ-12345',
            'PurchaseDate': '2024-01-15T10:30:00Z',
            'OrderStatus': 'Shipped',
            'OrderTotal': {'Amount': '125.99', 'CurrencyCode': 'USD'}
        }
        
        transformed = integration_service.transform_amazon_order(amazon_order)
        
        assert transformed['external_id'] == 'AMZ-12345'
        assert transformed['platform'] == 'amazon'
        assert transformed['total_amount'] == Decimal('125.99')
        assert transformed['currency'] == 'USD'
        
        # Test Shopify product transformation
        shopify_product = {
            'id': 123456789,
            'title': 'Test Product',
            'variants': [
                {
                    'sku': 'PROD-001',
                    'price': '29.99',
                    'inventory_quantity': 100
                }
            ]
        }
        
        transformed = integration_service.transform_shopify_product(shopify_product)
        
        assert transformed['external_id'] == '123456789'
        assert transformed['platform'] == 'shopify'
        assert transformed['name'] == 'Test Product'
        assert len(transformed['variants']) == 1
    
    def test_error_handling_and_retry(self, integration_service):
        """Test error handling and retry logic - TC-API-008."""
        with patch.object(integration_service, '_make_api_request') as mock_request:
            # Simulate connection error, then timeout, then success
            mock_request.side_effect = [
                ConnectionError('Connection failed'),
                Timeout('Request timeout'),
                {'success': True, 'data': 'test_data'}
            ]
            
            result = integration_service.sync_with_retry('test_endpoint', max_retries=3)
            
            assert result['success'] is True
            assert mock_request.call_count == 3
    
    def test_rate_limit_backoff(self, integration_service):
        """Test rate limit handling with exponential backoff."""
        with patch.object(integration_service, '_make_api_request') as mock_request, \
             patch('time.sleep') as mock_sleep:
            
            # Simulate rate limit, then success
            rate_limit_response = Mock()
            rate_limit_response.status_code = 429
            rate_limit_response.headers = {'Retry-After': '2'}
            
            success_response = Mock()
            success_response.status_code = 200
            success_response.json.return_value = {'data': 'success'}
            
            mock_request.side_effect = [
                RequestException(response=rate_limit_response),
                success_response
            ]
            
            result = integration_service.sync_with_rate_limit_handling('test_endpoint')
            
            assert result['data'] == 'success'
            mock_sleep.assert_called_once()
    
    def test_webhook_processing(self, integration_service, db_session):
        """Test webhook processing - TC-API-010."""
        # Test Shopify webhook
        shopify_webhook = {
            'id': 123456,
            'name': 'orders/create',
            'created_at': '2024-01-15T10:30:00Z',
            'order': {
                'id': 789012,
                'order_number': 'SHOP-001',
                'total_price': '99.99'
            }
        }
        
        result = integration_service.process_shopify_webhook('orders/create', shopify_webhook)
        
        assert result['processed'] is True
        assert result['order_id'] == 789012
        
        # Verify data import record created
        import_record = db_session.query(DataImport).filter_by(
            import_type='webhook_shopify_order'
        ).first()
        
        assert import_record is not None
        assert import_record.status == 'completed'
    
    def test_data_validation_during_import(self, integration_service, db_session):
        """Test data validation during import - TC-IMPORT-004."""
        # Test with invalid data
        invalid_product_data = {
            'name': '',  # Empty name
            'sku': 'INVALID SKU WITH SPACES',  # Invalid SKU format
            'price': '-10.00',  # Negative price
            'inventory_quantity': 'not_a_number'  # Invalid quantity
        }
        
        result = integration_service.validate_and_import_product(invalid_product_data)
        
        assert result['success'] is False
        assert len(result['errors']) > 0
        
        # Check that import errors were recorded
        import_errors = db_session.query(ImportError).all()
        assert len(import_errors) > 0
        
        # Test with valid data
        valid_product_data = {
            'name': 'Valid Product',
            'sku': 'VALID-001',
            'price': '25.99',
            'inventory_quantity': 100
        }
        
        result = integration_service.validate_and_import_product(valid_product_data)
        
        assert result['success'] is True
        assert len(result['errors']) == 0
    
    def test_incremental_sync(self, integration_service, db_session):
        """Test incremental data synchronization - TC-IMPORT-008."""
        # Record last sync time
        last_sync = datetime.now() - timedelta(hours=24)
        integration_service.set_last_sync_time('amazon_orders', last_sync)
        
        with patch.object(integration_service, '_get_amazon_orders_since') as mock_orders:
            mock_orders.return_value = [
                {'AmazonOrderId': 'AMZ-NEW-001', 'PurchaseDate': datetime.now().isoformat()},
                {'AmazonOrderId': 'AMZ-NEW-002', 'PurchaseDate': datetime.now().isoformat()}
            ]
            
            result = integration_service.sync_amazon_orders_incremental()
            
            assert result['new_orders'] == 2
            mock_orders.assert_called_with(last_sync)
    
    def test_data_consistency_validation(self, integration_service):
        """Test data consistency validation across platforms."""
        # Test SKU consistency between Amazon and Shopify
        amazon_products = [
            {'SellerSKU': 'PROD-001', 'ASIN': 'B001', 'FulfillableQuantity': 50},
            {'SellerSKU': 'PROD-002', 'ASIN': 'B002', 'FulfillableQuantity': 25}
        ]
        
        shopify_products = [
            {'sku': 'PROD-001', 'inventory_quantity': 45},  # Slight difference
            {'sku': 'PROD-003', 'inventory_quantity': 75}   # Not in Amazon
        ]
        
        consistency_report = integration_service.validate_cross_platform_consistency(
            amazon_products, shopify_products
        )
        
        assert 'discrepancies' in consistency_report
        assert 'missing_in_amazon' in consistency_report
        assert 'missing_in_shopify' in consistency_report
        
        # Should identify PROD-002 missing in Shopify and PROD-003 missing in Amazon
        assert 'PROD-003' in consistency_report['missing_in_amazon']
        assert 'PROD-002' in consistency_report['missing_in_shopify']