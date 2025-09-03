"""
Unleashed Software API Client
Handles authentication and communication with the Unleashed API
"""

import hashlib
import hmac
import requests
import os
from datetime import datetime
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv

load_dotenv('.env.local')


class UnleashedClient:
    """Client for interacting with Unleashed Software API"""
    
    def __init__(self):
        self.api_id = os.getenv('UNLEASHED_API_ID')
        self.api_key = os.getenv('UNLEASHED_API_KEY')
        self.base_url = os.getenv('UNLEASHED_API_URL', 'https://api.unleashedsoftware.com')
        
        if not self.api_id or not self.api_key:
            raise ValueError("Unleashed API credentials not found in environment variables")
    
    def _generate_signature(self, query_string=""):
        """
        Generate HMAC-SHA256 signature for API authentication
        
        Args:
            query_string: The query string part of the URL (if any)
        
        Returns:
            Base64 encoded signature
        """
        if query_string:
            # Remove leading '?' if present
            if query_string.startswith('?'):
                query_string = query_string[1:]
        
        # Create the signature using HMAC-SHA256
        signature = hmac.new(
            self.api_key.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        # Return base64 encoded signature
        import base64
        return base64.b64encode(signature).decode('utf-8')
    
    def _make_request(self, endpoint, method='GET', params=None, data=None):
        """
        Make authenticated request to Unleashed API
        
        Args:
            endpoint: API endpoint (e.g., '/Customers')
            method: HTTP method (GET, POST, PUT, DELETE)
            params: Query parameters
            data: Request body data
        
        Returns:
            Response JSON data
        """
        # Build full URL
        url = f"{self.base_url}{endpoint}"
        
        # Build query string for signature
        query_string = ""
        if params:
            query_pairs = []
            for key, value in sorted(params.items()):
                query_pairs.append(f"{key}={value}")
            query_string = "&".join(query_pairs)
        
        # Generate signature
        signature = self._generate_signature(query_string)
        
        # Set headers
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'api-auth-id': self.api_id,
            'api-auth-signature': signature
        }
        
        # Make request
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, headers=headers, params=params, json=data)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, params=params, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response status: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            raise
    
    # Product Methods
    def get_products(self, page=1, page_size=200):
        """Get products from Unleashed"""
        params = {
            'pageNumber': page,
            'pageSize': page_size
        }
        return self._make_request('/Products', params=params)
    
    def get_product(self, product_guid):
        """Get a specific product by GUID"""
        return self._make_request(f'/Products/{product_guid}')
    
    # Stock on Hand Methods
    def get_stock_on_hand(self, page=1, page_size=200):
        """Get current stock on hand"""
        params = {
            'pageNumber': page,
            'pageSize': page_size
        }
        return self._make_request('/StockOnHand', params=params)
    
    # Sales Order Methods
    def get_sales_orders(self, page=1, page_size=200, order_status=None):
        """Get sales orders"""
        params = {
            'pageNumber': page,
            'pageSize': page_size
        }
        if order_status:
            params['orderStatus'] = order_status
        return self._make_request('/SalesOrders', params=params)
    
    def get_sales_order(self, order_guid):
        """Get a specific sales order by GUID"""
        return self._make_request(f'/SalesOrders/{order_guid}')
    
    # Purchase Order Methods
    def get_purchase_orders(self, page=1, page_size=200):
        """Get purchase orders"""
        params = {
            'pageNumber': page,
            'pageSize': page_size
        }
        return self._make_request('/PurchaseOrders', params=params)
    
    # Customer Methods
    def get_customers(self, page=1, page_size=200):
        """Get customers"""
        params = {
            'pageNumber': page,
            'pageSize': page_size
        }
        return self._make_request('/Customers', params=params)
    
    def get_customer(self, customer_guid):
        """Get a specific customer by GUID"""
        return self._make_request(f'/Customers/{customer_guid}')
    
    # Supplier Methods
    def get_suppliers(self, page=1, page_size=200):
        """Get suppliers"""
        params = {
            'pageNumber': page,
            'pageSize': page_size
        }
        return self._make_request('/Suppliers', params=params)
    
    # Warehouse Methods
    def get_warehouses(self):
        """Get all warehouses"""
        return self._make_request('/Warehouses')
    
    # Bill of Materials Methods
    def get_bill_of_materials(self, page=1, page_size=200):
        """Get bills of materials"""
        params = {
            'pageNumber': page,
            'pageSize': page_size
        }
        return self._make_request('/BillsOfMaterials', params=params)
    
    # Stock Adjustments
    def get_stock_adjustments(self, page=1, page_size=200):
        """Get stock adjustments"""
        params = {
            'pageNumber': page,
            'pageSize': page_size
        }
        return self._make_request('/StockAdjustments', params=params)
    
    # Test connection
    def test_connection(self):
        """Test API connection by fetching warehouses"""
        try:
            result = self.get_warehouses()
            return True, f"Successfully connected. Found {len(result.get('Items', []))} warehouses."
        except Exception as e:
            return False, f"Connection failed: {str(e)}"


if __name__ == "__main__":
    # Test the client
    try:
        client = UnleashedClient()
        success, message = client.test_connection()
        print(f"Connection test: {message}")
        
        if success:
            # Try to get some products
            print("\nFetching products...")
            products = client.get_products(page_size=5)
            
            if 'Items' in products:
                print(f"Found {products.get('Total', 0)} products total")
                for product in products['Items'][:5]:
                    print(f"  - {product.get('ProductCode', 'N/A')}: {product.get('ProductDescription', 'N/A')}")
            
            # Try to get stock on hand
            print("\nFetching stock on hand...")
            stock = client.get_stock_on_hand(page_size=5)
            
            if 'Items' in stock:
                print(f"Found {stock.get('Total', 0)} stock items total")
                for item in stock['Items'][:5]:
                    print(f"  - {item.get('ProductCode', 'N/A')}: {item.get('QtyOnHand', 0)} units")
    
    except Exception as e:
        print(f"Error: {e}")