import json
import hashlib
import hmac
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from flask import current_app
from app import db
from app.models.api_integration import IntegrationSyncLog
from app.models.product import Product
from app.models.historical_sales import HistoricalSales
from app.models.inventory_level import InventoryLevel
from app.services.api_integration_service import BaseApiClient

logger = logging.getLogger(__name__)

class ShopifyApiClient(BaseApiClient):
    """Shopify Admin API client"""
    
    def _get_base_url(self) -> str:
        shop_url = self.credential.shop_url
        if not shop_url:
            raise ValueError("Shopify shop URL not configured")
        
        if not shop_url.startswith('https://'):
            shop_url = f"https://{shop_url}"
        
        return f"{shop_url}/admin/api/2024-01"
    
    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        
        if self.credential.access_token:
            headers['X-Shopify-Access-Token'] = self.credential.access_token
        elif self.credential.api_key:
            # For private apps
            headers['Authorization'] = f"Bearer {self.credential.api_key}"
        
        return headers
    
    def _test_endpoint(self):
        """Test connection using shop info endpoint"""
        return self._make_request('GET', 'shop.json')
    
    def sync_data(self, sync_type: str = 'incremental') -> IntegrationSyncLog:
        """Sync data from Shopify"""
        sync_log = IntegrationSyncLog(
            integration_id=self.integration.id,
            sync_type=sync_type,
            started_at=datetime.utcnow()
        )
        db.session.add(sync_log)
        db.session.flush()  # Get the ID
        
        try:
            total_records = 0
            success_records = 0
            failed_records = 0
            
            # Sync products
            if self.integration.config_json.get('sync_products', True):
                product_stats = self._sync_products(sync_type)
                total_records += product_stats['total']
                success_records += product_stats['success']
                failed_records += product_stats['failed']
            
            # Sync orders/sales data
            if self.integration.config_json.get('sync_orders', True):
                order_stats = self._sync_orders(sync_type)
                total_records += order_stats['total']
                success_records += order_stats['success']
                failed_records += order_stats['failed']
            
            # Sync inventory levels
            if self.integration.config_json.get('sync_inventory', True):
                inventory_stats = self._sync_inventory(sync_type)
                total_records += inventory_stats['total']
                success_records += inventory_stats['success']
                failed_records += inventory_stats['failed']
            
            # Update sync log
            sync_log.completed_at = datetime.utcnow()
            sync_log.status = 'completed' if failed_records == 0 else 'partial'
            sync_log.records_processed = total_records
            sync_log.records_success = success_records
            sync_log.records_failed = failed_records
            
        except Exception as e:
            sync_log.completed_at = datetime.utcnow()
            sync_log.status = 'failed'
            sync_log.error_message = str(e)[:500]
            logger.error(f"Shopify sync failed: {str(e)}")
            raise
        
        db.session.commit()
        return sync_log
    
    def _sync_products(self, sync_type: str) -> Dict[str, int]:
        """Sync products from Shopify"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        # Build query parameters
        params = {'limit': 250}
        if sync_type == 'incremental' and self.integration.last_sync_at:
            params['updated_at_min'] = self.integration.last_sync_at.isoformat()
        
        try:
            page_info = None
            while True:
                if page_info:
                    params = {'limit': 250, 'page_info': page_info}
                
                response = self._make_request('GET', 'products.json', params=params)
                data = response.json()
                
                products = data.get('products', [])
                if not products:
                    break
                
                for product_data in products:
                    try:
                        self._process_product(product_data)
                        stats['success'] += 1
                    except Exception as e:
                        logger.error(f"Failed to process product {product_data.get('id')}: {str(e)}")
                        stats['failed'] += 1
                    
                    stats['total'] += 1
                
                # Check for next page
                link_header = response.headers.get('Link')
                page_info = self._extract_page_info(link_header, 'next')
                if not page_info:
                    break
                
        except Exception as e:
            logger.error(f"Failed to sync Shopify products: {str(e)}")
            raise
        
        return stats
    
    def _process_product(self, product_data: Dict[str, Any]):
        """Process a single product from Shopify"""
        shopify_id = str(product_data['id'])
        
        # Find or create product
        product = Product.query.filter_by(
            external_id=shopify_id,
            external_source='shopify'
        ).first()
        
        if not product:
            product = Product(
                external_id=shopify_id,
                external_source='shopify'
            )
            db.session.add(product)
        
        # Update product fields
        product.name = product_data.get('title', '')
        product.description = product_data.get('body_html', '')
        product.product_type = product_data.get('product_type', '')
        product.vendor = product_data.get('vendor', '')
        product.status = 'active' if product_data.get('status') == 'active' else 'inactive'
        
        # Handle variants
        variants = product_data.get('variants', [])
        if variants:
            main_variant = variants[0]
            product.sku = main_variant.get('sku', '')
            product.price = float(main_variant.get('price', 0))
            product.cost_price = float(main_variant.get('compare_at_price', 0)) if main_variant.get('compare_at_price') else None
            product.weight = float(main_variant.get('weight', 0)) if main_variant.get('weight') else None
            product.weight_unit = main_variant.get('weight_unit', 'kg')
        
        # Store raw data
        product.external_data = product_data
        product.updated_at = datetime.utcnow()
    
    def _sync_orders(self, sync_type: str) -> Dict[str, int]:
        """Sync orders from Shopify"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        # Build query parameters
        params = {
            'limit': 250,
            'status': 'any',
            'financial_status': 'any',
            'fulfillment_status': 'any'
        }
        
        if sync_type == 'incremental' and self.integration.last_sync_at:
            params['updated_at_min'] = self.integration.last_sync_at.isoformat()
        
        try:
            page_info = None
            while True:
                if page_info:
                    params = {'limit': 250, 'page_info': page_info}
                
                response = self._make_request('GET', 'orders.json', params=params)
                data = response.json()
                
                orders = data.get('orders', [])
                if not orders:
                    break
                
                for order_data in orders:
                    try:
                        self._process_order(order_data)
                        stats['success'] += 1
                    except Exception as e:
                        logger.error(f"Failed to process order {order_data.get('id')}: {str(e)}")
                        stats['failed'] += 1
                    
                    stats['total'] += 1
                
                # Check for next page
                link_header = response.headers.get('Link')
                page_info = self._extract_page_info(link_header, 'next')
                if not page_info:
                    break
                
        except Exception as e:
            logger.error(f"Failed to sync Shopify orders: {str(e)}")
            raise
        
        return stats
    
    def _process_order(self, order_data: Dict[str, Any]):
        """Process a single order from Shopify"""
        shopify_order_id = str(order_data['id'])
        
        # Process each line item as a historical sales record
        for line_item in order_data.get('line_items', []):
            # Find the product
            product = Product.query.filter_by(
                sku=line_item.get('sku', ''),
                external_source='shopify'
            ).first()
            
            if not product and line_item.get('product_id'):
                product = Product.query.filter_by(
                    external_id=str(line_item['product_id']),
                    external_source='shopify'
                ).first()
            
            # Create or update historical sales record
            sales_record = HistoricalSales.query.filter_by(
                external_id=f"{shopify_order_id}_{line_item['id']}",
                external_source='shopify'
            ).first()
            
            if not sales_record:
                sales_record = HistoricalSales(
                    external_id=f"{shopify_order_id}_{line_item['id']}",
                    external_source='shopify'
                )
                db.session.add(sales_record)
            
            # Update sales record
            sales_record.product_id = product.id if product else None
            sales_record.sku = line_item.get('sku', '')
            sales_record.quantity = line_item.get('quantity', 0)
            sales_record.unit_price = float(line_item.get('price', 0))
            sales_record.total_amount = sales_record.quantity * sales_record.unit_price
            sales_record.currency = order_data.get('currency', 'USD')
            
            # Parse order date
            order_date_str = order_data.get('created_at')
            if order_date_str:
                sales_record.sale_date = datetime.fromisoformat(order_date_str.replace('Z', '+00:00')).replace(tzinfo=None)
            
            # Store additional data
            sales_record.channel = 'shopify'
            sales_record.market = order_data.get('landing_site_ref', 'shopify')
            sales_record.external_data = {
                'order_data': order_data,
                'line_item': line_item
            }
    
    def _sync_inventory(self, sync_type: str) -> Dict[str, int]:
        """Sync inventory levels from Shopify"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        try:
            # Get all locations first
            response = self._make_request('GET', 'locations.json')
            locations = response.json().get('locations', [])
            
            for location in locations:
                location_id = location['id']
                location_stats = self._sync_location_inventory(location_id, sync_type)
                
                stats['total'] += location_stats['total']
                stats['success'] += location_stats['success']
                stats['failed'] += location_stats['failed']
                
        except Exception as e:
            logger.error(f"Failed to sync Shopify inventory: {str(e)}")
            raise
        
        return stats
    
    def _sync_location_inventory(self, location_id: int, sync_type: str) -> Dict[str, int]:
        """Sync inventory for a specific location"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        params = {
            'location_ids': location_id,
            'limit': 250
        }
        
        if sync_type == 'incremental' and self.integration.last_sync_at:
            params['updated_at_min'] = self.integration.last_sync_at.isoformat()
        
        try:
            page_info = None
            while True:
                if page_info:
                    params = {'location_ids': location_id, 'limit': 250, 'page_info': page_info}
                
                response = self._make_request('GET', 'inventory_levels.json', params=params)
                data = response.json()
                
                inventory_levels = data.get('inventory_levels', [])
                if not inventory_levels:
                    break
                
                for inventory_data in inventory_levels:
                    try:
                        self._process_inventory_level(inventory_data, location_id)
                        stats['success'] += 1
                    except Exception as e:
                        logger.error(f"Failed to process inventory level: {str(e)}")
                        stats['failed'] += 1
                    
                    stats['total'] += 1
                
                # Check for next page
                link_header = response.headers.get('Link')
                page_info = self._extract_page_info(link_header, 'next')
                if not page_info:
                    break
                    
        except Exception as e:
            logger.error(f"Failed to sync location {location_id} inventory: {str(e)}")
            raise
        
        return stats
    
    def _process_inventory_level(self, inventory_data: Dict[str, Any], location_id: int):
        """Process a single inventory level record"""
        inventory_item_id = inventory_data.get('inventory_item_id')
        if not inventory_item_id:
            return
        
        # Get inventory item details to find the variant/product
        try:
            response = self._make_request('GET', f'inventory_items/{inventory_item_id}.json')
            inventory_item = response.json().get('inventory_item', {})
            variant_id = inventory_item.get('variant_id')
            
            if not variant_id:
                return
            
            # Get variant details to find the product
            response = self._make_request('GET', f'variants/{variant_id}.json')
            variant = response.json().get('variant', {})
            product_id = variant.get('product_id')
            sku = variant.get('sku')
            
            if not sku:
                return
            
            # Find the product in our database
            product = Product.query.filter_by(
                sku=sku,
                external_source='shopify'
            ).first()
            
            if not product:
                return
            
            # Create or update inventory level
            inventory_level = InventoryLevel.query.filter_by(
                product_id=product.id,
                location=f"shopify_location_{location_id}"
            ).first()
            
            if not inventory_level:
                inventory_level = InventoryLevel(
                    product_id=product.id,
                    location=f"shopify_location_{location_id}"
                )
                db.session.add(inventory_level)
            
            inventory_level.quantity_available = inventory_data.get('available', 0)
            inventory_level.quantity_committed = 0  # Shopify doesn't provide this directly
            inventory_level.quantity_on_hand = inventory_data.get('available', 0)
            inventory_level.external_data = inventory_data
            inventory_level.updated_at = datetime.utcnow()
            
        except Exception as e:
            logger.error(f"Failed to get inventory item details for {inventory_item_id}: {str(e)}")
            raise
    
    def _extract_page_info(self, link_header: str, rel: str) -> Optional[str]:
        """Extract page_info from Link header for pagination"""
        if not link_header:
            return None
        
        links = link_header.split(',')
        for link in links:
            if f'rel="{rel}"' in link:
                # Extract URL from <...>
                url_match = link.split('<')[1].split('>')[0]
                # Extract page_info parameter
                if 'page_info=' in url_match:
                    return url_match.split('page_info=')[1].split('&')[0]
        
        return None

class ShopifyWebhookProcessor:
    """Process Shopify webhook events"""
    
    @staticmethod
    def verify_webhook(data: bytes, hmac_header: str, webhook_secret: str) -> bool:
        """Verify Shopify webhook signature"""
        calculated_hmac = hmac.new(
            webhook_secret.encode('utf-8'),
            data,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(calculated_hmac, hmac_header)
    
    def process_webhook(self, topic: str, payload: Dict[str, Any]):
        """Process webhook event based on topic"""
        try:
            if topic == 'orders/create' or topic == 'orders/updated':
                self._process_order_webhook(payload)
            elif topic == 'products/create' or topic == 'products/update':
                self._process_product_webhook(payload)
            elif topic == 'inventory_levels/update':
                self._process_inventory_webhook(payload)
            else:
                logger.info(f"Unhandled Shopify webhook topic: {topic}")
        
        except Exception as e:
            logger.error(f"Failed to process Shopify webhook {topic}: {str(e)}")
            raise
    
    def _process_order_webhook(self, order_data: Dict[str, Any]):
        """Process order create/update webhook"""
        client = ShopifyApiClient(None)  # We'll need to refactor this to not require integration
        client._process_order(order_data)
        db.session.commit()
    
    def _process_product_webhook(self, product_data: Dict[str, Any]):
        """Process product create/update webhook"""
        client = ShopifyApiClient(None)  # We'll need to refactor this to not require integration
        client._process_product(product_data)
        db.session.commit()
    
    def _process_inventory_webhook(self, inventory_data: Dict[str, Any]):
        """Process inventory level update webhook"""
        # This would need to be implemented similar to the sync method
        pass