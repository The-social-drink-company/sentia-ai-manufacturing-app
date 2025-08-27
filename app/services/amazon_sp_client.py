import json
import logging
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from flask import current_app
from app import db
from app.models.api_integration import IntegrationSyncLog
from app.models.product import Product
from app.models.historical_sales import HistoricalSales
from app.models.inventory_level import InventoryLevel
from app.services.api_integration_service import BaseApiClient

logger = logging.getLogger(__name__)

class AmazonSpApiClient(BaseApiClient):
    """Amazon Selling Partner API client"""
    
    # SP-API Endpoints by region
    ENDPOINTS = {
        'us-east-1': 'https://sellingpartnerapi-na.amazon.com',
        'eu-west-1': 'https://sellingpartnerapi-eu.amazon.com',
        'us-west-2': 'https://sellingpartnerapi-fe.amazon.com'
    }
    
    MARKETPLACE_REGIONS = {
        'ATVPDKIKX0DER': 'us-east-1',  # US
        'A1PA6795UKMFR9': 'us-east-1',  # Canada
        'A1F83G8C2ARO7P': 'eu-west-1',  # UK
        'A13V1IB3VIYZZH': 'eu-west-1',  # France
        'A1RKKUPIHCS9HS': 'eu-west-1',  # Spain
        'APJ6JRA9NG5V4': 'eu-west-1',   # Italy
        'A1805ZKKQ2RHD': 'eu-west-1',   # Netherlands
        'A21TJRUUN4KGV': 'eu-west-1',   # India
        'A19VAU5U5O7RUS': 'us-west-2',  # Singapore
        'A39IBJ37TRP1C6': 'us-west-2'   # Australia
    }
    
    def __init__(self, integration):
        super().__init__(integration)
        self.marketplace_id = self.credential.marketplace_id
        self.region = self._get_region()
        self.sts_role_arn = self.credential.config_json.get('sts_role_arn') if self.credential.config_json else None
        
    def _get_region(self) -> str:
        """Get AWS region for the marketplace"""
        if self.credential.region:
            return self.credential.region
        return self.MARKETPLACE_REGIONS.get(self.marketplace_id, 'us-east-1')
    
    def _get_base_url(self) -> str:
        return self.ENDPOINTS.get(self.region, self.ENDPOINTS['us-east-1'])
    
    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        headers.update({
            'x-amz-access-token': self._get_access_token(),
            'x-amz-date': datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
        })
        return headers
    
    def _get_access_token(self) -> str:
        """Get or refresh the LWA access token"""
        if not self.credential.access_token or self.credential.is_token_expired():
            self._refresh_access_token()
        return self.credential.access_token
    
    def _refresh_access_token(self):
        """Refresh the LWA access token"""
        lwa_endpoint = "https://api.amazon.com/auth/o2/token"
        
        if self.credential.refresh_token:
            # Refresh existing token
            data = {
                'grant_type': 'refresh_token',
                'refresh_token': self.credential.refresh_token,
                'client_id': self.credential.client_id,
                'client_secret': self.credential.client_secret
            }
        else:
            # Initial token request using client credentials
            data = {
                'grant_type': 'client_credentials',
                'scope': 'sellingpartnerapi::notifications',
                'client_id': self.credential.client_id,
                'client_secret': self.credential.client_secret
            }
        
        response = self.session.post(lwa_endpoint, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        self.credential.access_token = token_data['access_token']
        
        if 'refresh_token' in token_data:
            self.credential.refresh_token = token_data['refresh_token']
        
        if 'expires_in' in token_data:
            expires_in = int(token_data['expires_in'])
            self.credential.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        db.session.commit()
    
    def _make_request(self, method: str, endpoint: str, **kwargs):
        """Make a signed request to SP-API"""
        # Add marketplace ID to params if not present
        if 'params' not in kwargs:
            kwargs['params'] = {}
        
        if 'MarketplaceIds' not in kwargs['params'] and self.marketplace_id:
            kwargs['params']['MarketplaceIds'] = self.marketplace_id
        
        # Create AWS request for signing
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        aws_request = AWSRequest(method=method, url=url, **kwargs)
        
        # Sign the request if we have AWS credentials
        if self.sts_role_arn:
            self._sign_request(aws_request)
        
        # Make the actual request
        return super()._make_request(method, endpoint, **kwargs)
    
    def _sign_request(self, aws_request: AWSRequest):
        """Sign the request with AWS SigV4"""
        try:
            # Assume the STS role to get temporary credentials
            sts_client = boto3.client('sts', region_name=self.region)
            assumed_role = sts_client.assume_role(
                RoleArn=self.sts_role_arn,
                RoleSessionName=f"sp-api-{self.integration.id}"
            )
            
            credentials = assumed_role['Credentials']
            
            # Create SigV4 auth
            auth = SigV4Auth(
                credentials={
                    'access_key': credentials['AccessKeyId'],
                    'secret_key': credentials['SecretAccessKey'],
                    'token': credentials['SessionToken']
                },
                service_name='execute-api',
                region_name=self.region
            )
            
            # Sign the request
            auth.add_auth(aws_request)
            
        except Exception as e:
            logger.error(f"Failed to sign SP-API request: {str(e)}")
            # Continue without signing - some endpoints may work with just LWA token
    
    def _test_endpoint(self):
        """Test connection using seller info endpoint"""
        return self._make_request('GET', 'sellers/v1/marketplaceParticipations')
    
    def sync_data(self, sync_type: str = 'incremental') -> IntegrationSyncLog:
        """Sync data from Amazon SP-API"""
        sync_log = IntegrationSyncLog(
            integration_id=self.integration.id,
            sync_type=sync_type,
            started_at=datetime.utcnow()
        )
        db.session.add(sync_log)
        db.session.flush()
        
        try:
            total_records = 0
            success_records = 0
            failed_records = 0
            
            # Sync catalog items (products)
            if self.integration.config_json.get('sync_products', True):
                product_stats = self._sync_catalog_items(sync_type)
                total_records += product_stats['total']
                success_records += product_stats['success']
                failed_records += product_stats['failed']
            
            # Sync orders
            if self.integration.config_json.get('sync_orders', True):
                order_stats = self._sync_orders(sync_type)
                total_records += order_stats['total']
                success_records += order_stats['success']
                failed_records += order_stats['failed']
            
            # Sync FBA inventory
            if self.integration.config_json.get('sync_inventory', True):
                inventory_stats = self._sync_fba_inventory(sync_type)
                total_records += inventory_stats['total']
                success_records += inventory_stats['success']
                failed_records += inventory_stats['failed']
            
            # Sync financial events
            if self.integration.config_json.get('sync_finances', True):
                finance_stats = self._sync_financial_events(sync_type)
                total_records += finance_stats['total']
                success_records += finance_stats['success']
                failed_records += finance_stats['failed']
            
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
            logger.error(f"Amazon SP-API sync failed: {str(e)}")
            raise
        
        db.session.commit()
        return sync_log
    
    def _sync_catalog_items(self, sync_type: str) -> Dict[str, int]:
        """Sync catalog items from Amazon"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        try:
            params = {
                'marketplaceIds': self.marketplace_id,
                'includedData': 'attributes,images,productTypes,relationships,salesRanks'
            }
            
            # For incremental sync, we'd need to track which ASINs to update
            # This is simplified for now
            
            response = self._make_request('GET', 'catalog/2022-04-01/items', params=params)
            data = response.json()
            
            items = data.get('items', [])
            
            for item in items:
                try:
                    self._process_catalog_item(item)
                    stats['success'] += 1
                except Exception as e:
                    logger.error(f"Failed to process catalog item {item.get('asin')}: {str(e)}")
                    stats['failed'] += 1
                
                stats['total'] += 1
            
        except Exception as e:
            logger.error(f"Failed to sync Amazon catalog items: {str(e)}")
            raise
        
        return stats
    
    def _process_catalog_item(self, item_data: Dict[str, Any]):
        """Process a single catalog item from Amazon"""
        asin = item_data.get('asin')
        if not asin:
            return
        
        # Find or create product
        product = Product.query.filter_by(
            external_id=asin,
            external_source='amazon'
        ).first()
        
        if not product:
            product = Product(
                external_id=asin,
                external_source='amazon'
            )
            db.session.add(product)
        
        # Update product fields
        attributes = item_data.get('attributes', {})
        
        if 'item_name' in attributes:
            product.name = attributes['item_name'][0].get('value', '') if attributes['item_name'] else ''
        
        if 'bullet_point' in attributes:
            bullet_points = [bp.get('value', '') for bp in attributes['bullet_point']]
            product.description = '\n'.join(bullet_points)
        
        if 'brand' in attributes:
            product.vendor = attributes['brand'][0].get('value', '') if attributes['brand'] else ''
        
        if 'part_number' in attributes:
            product.sku = attributes['part_number'][0].get('value', '') if attributes['part_number'] else ''
        
        # Store raw data
        product.external_data = item_data
        product.updated_at = datetime.utcnow()
    
    def _sync_orders(self, sync_type: str) -> Dict[str, int]:
        """Sync orders from Amazon"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        try:
            # Calculate date range
            if sync_type == 'incremental' and self.integration.last_sync_at:
                created_after = self.integration.last_sync_at.isoformat()
            else:
                # Default to last 30 days for full sync
                created_after = (datetime.utcnow() - timedelta(days=30)).isoformat()
            
            params = {
                'MarketplaceIds': self.marketplace_id,
                'CreatedAfter': created_after,
                'OrderStatuses': 'Shipped,Unshipped,PartiallyShipped'
            }
            
            next_token = None
            while True:
                if next_token:
                    params['NextToken'] = next_token
                
                response = self._make_request('GET', 'orders/v0/orders', params=params)
                data = response.json()
                
                orders = data.get('Orders', [])
                if not orders:
                    break
                
                for order in orders:
                    try:
                        # Get order items
                        order_id = order['AmazonOrderId']
                        items_response = self._make_request('GET', f'orders/v0/orders/{order_id}/orderItems')
                        items_data = items_response.json()
                        
                        self._process_amazon_order(order, items_data.get('OrderItems', []))
                        stats['success'] += 1
                    except Exception as e:
                        logger.error(f"Failed to process order {order.get('AmazonOrderId')}: {str(e)}")
                        stats['failed'] += 1
                    
                    stats['total'] += 1
                
                next_token = data.get('NextToken')
                if not next_token:
                    break
                
        except Exception as e:
            logger.error(f"Failed to sync Amazon orders: {str(e)}")
            raise
        
        return stats
    
    def _process_amazon_order(self, order_data: Dict[str, Any], order_items: List[Dict[str, Any]]):
        """Process an Amazon order and its items"""
        amazon_order_id = order_data['AmazonOrderId']
        
        for item in order_items:
            # Find the product by SKU or ASIN
            product = None
            if item.get('SellerSKU'):
                product = Product.query.filter_by(
                    sku=item['SellerSKU'],
                    external_source='amazon'
                ).first()
            
            if not product and item.get('ASIN'):
                product = Product.query.filter_by(
                    external_id=item['ASIN'],
                    external_source='amazon'
                ).first()
            
            # Create or update historical sales record
            sales_record = HistoricalSales.query.filter_by(
                external_id=f"{amazon_order_id}_{item['OrderItemId']}",
                external_source='amazon'
            ).first()
            
            if not sales_record:
                sales_record = HistoricalSales(
                    external_id=f"{amazon_order_id}_{item['OrderItemId']}",
                    external_source='amazon'
                )
                db.session.add(sales_record)
            
            # Update sales record
            sales_record.product_id = product.id if product else None
            sales_record.sku = item.get('SellerSKU', '')
            sales_record.quantity = int(item.get('QuantityOrdered', 0))
            
            # Parse price
            item_price = item.get('ItemPrice', {})
            if item_price and 'Amount' in item_price:
                sales_record.unit_price = float(item_price['Amount'])
                sales_record.currency = item_price.get('CurrencyCode', 'USD')
            
            sales_record.total_amount = sales_record.quantity * sales_record.unit_price
            
            # Parse order date
            purchase_date = order_data.get('PurchaseDate')
            if purchase_date:
                sales_record.sale_date = datetime.fromisoformat(purchase_date.replace('Z', '+00:00')).replace(tzinfo=None)
            
            # Store additional data
            sales_record.channel = 'amazon'
            sales_record.market = self.marketplace_id
            sales_record.external_data = {
                'order_data': order_data,
                'order_item': item
            }
    
    def _sync_fba_inventory(self, sync_type: str) -> Dict[str, int]:
        """Sync FBA inventory from Amazon"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        try:
            params = {
                'granularityType': 'Marketplace',
                'granularityId': self.marketplace_id,
                'marketplaceIds': self.marketplace_id
            }
            
            response = self._make_request('GET', 'fba/inventory/v1/summaries', params=params)
            data = response.json()
            
            inventory_summaries = data.get('inventorySummaries', [])
            
            for summary in inventory_summaries:
                try:
                    self._process_fba_inventory(summary)
                    stats['success'] += 1
                except Exception as e:
                    logger.error(f"Failed to process FBA inventory: {str(e)}")
                    stats['failed'] += 1
                
                stats['total'] += 1
                
        except Exception as e:
            logger.error(f"Failed to sync FBA inventory: {str(e)}")
            raise
        
        return stats
    
    def _process_fba_inventory(self, inventory_data: Dict[str, Any]):
        """Process FBA inventory data"""
        sku = inventory_data.get('sellerSku')
        if not sku:
            return
        
        # Find the product
        product = Product.query.filter_by(
            sku=sku,
            external_source='amazon'
        ).first()
        
        if not product:
            return
        
        # Create or update inventory level
        inventory_level = InventoryLevel.query.filter_by(
            product_id=product.id,
            location=f"amazon_fba_{self.marketplace_id}"
        ).first()
        
        if not inventory_level:
            inventory_level = InventoryLevel(
                product_id=product.id,
                location=f"amazon_fba_{self.marketplace_id}"
            )
            db.session.add(inventory_level)
        
        # Update quantities
        total_quantity = inventory_data.get('totalQuantity', 0)
        inbound_quantity = inventory_data.get('inboundQuantity', 0)
        available_quantity = inventory_data.get('availableQuantity', 0)
        
        inventory_level.quantity_on_hand = total_quantity
        inventory_level.quantity_available = available_quantity
        inventory_level.quantity_committed = total_quantity - available_quantity
        inventory_level.external_data = inventory_data
        inventory_level.updated_at = datetime.utcnow()
    
    def _sync_financial_events(self, sync_type: str) -> Dict[str, int]:
        """Sync financial events from Amazon"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        try:
            # Calculate date range
            if sync_type == 'incremental' and self.integration.last_sync_at:
                posted_after = self.integration.last_sync_at.isoformat()
            else:
                # Default to last 30 days
                posted_after = (datetime.utcnow() - timedelta(days=30)).isoformat()
            
            params = {
                'PostedAfter': posted_after,
                'MaxResultsPerPage': 100
            }
            
            next_token = None
            while True:
                if next_token:
                    params['NextToken'] = next_token
                
                response = self._make_request('GET', 'finances/2024-06-19/financialEvents', params=params)
                data = response.json()
                
                financial_events = data.get('FinancialEvents', {})
                
                # Process different types of financial events
                for event_type, events in financial_events.items():
                    for event in events:
                        try:
                            self._process_financial_event(event_type, event)
                            stats['success'] += 1
                        except Exception as e:
                            logger.error(f"Failed to process financial event: {str(e)}")
                            stats['failed'] += 1
                        
                        stats['total'] += 1
                
                next_token = data.get('NextToken')
                if not next_token:
                    break
                    
        except Exception as e:
            logger.error(f"Failed to sync Amazon financial events: {str(e)}")
            raise
        
        return stats
    
    def _process_financial_event(self, event_type: str, event_data: Dict[str, Any]):
        """Process a financial event (fees, refunds, etc.)"""
        # This would involve creating financial transaction records
        # For now, we'll just log the event
        logger.info(f"Processing {event_type} financial event: {event_data}")

class AmazonWebhookProcessor:
    """Process Amazon SP-API webhook events"""
    
    def process_webhook(self, event_type: str, payload: Dict[str, Any]):
        """Process webhook event based on type"""
        try:
            if event_type == 'ORDER_STATUS_CHANGE':
                self._process_order_status_webhook(payload)
            elif event_type == 'INVENTORY_UPDATE':
                self._process_inventory_webhook(payload)
            else:
                logger.info(f"Unhandled Amazon webhook event type: {event_type}")
        
        except Exception as e:
            logger.error(f"Failed to process Amazon webhook {event_type}: {str(e)}")
            raise
    
    def _process_order_status_webhook(self, payload: Dict[str, Any]):
        """Process order status change webhook"""
        # Extract order information and update accordingly
        pass
    
    def _process_inventory_webhook(self, payload: Dict[str, Any]):
        """Process inventory update webhook"""
        # Extract inventory information and update accordingly
        pass