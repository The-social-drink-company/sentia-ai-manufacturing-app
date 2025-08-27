import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from flask import current_app
from app import db
from app.models.api_integration import (
    ApiIntegration, IntegrationSyncLog, IntegrationStatus, 
    ApiCredential, WebhookEvent, IntegrationHealth
)

logger = logging.getLogger(__name__)

class RateLimitError(Exception):
    def __init__(self, message, reset_at=None):
        super().__init__(message)
        self.reset_at = reset_at

class AuthenticationError(Exception):
    pass

class BaseApiClient:
    """Base class for all API integrations with common functionality"""
    
    def __init__(self, integration: ApiIntegration):
        self.integration = integration
        self.credential = integration.credential
        self.session = self._create_session()
        self.base_url = self._get_base_url()
    
    def _create_session(self) -> requests.Session:
        """Create a requests session with retry strategy and rate limiting"""
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=2,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST", "PUT", "DELETE"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Set default timeout
        session.request = lambda *args, **kwargs: session.request(*args, timeout=30, **kwargs)
        
        return session
    
    def _get_base_url(self) -> str:
        """Override in subclasses to provide the base URL"""
        return ""
    
    def _get_headers(self) -> Dict[str, str]:
        """Override in subclasses to provide authentication headers"""
        return {
            'User-Agent': 'Sentia-Manufacturing-Dashboard/1.0',
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make an authenticated request with error handling and rate limiting"""
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        headers = self._get_headers()
        
        if 'headers' in kwargs:
            headers.update(kwargs['headers'])
            del kwargs['headers']
        
        try:
            response = self.session.request(method, url, headers=headers, **kwargs)
            
            # Update rate limiting info
            self._update_rate_limits(response)
            
            # Handle rate limiting
            if response.status_code == 429:
                reset_time = self._parse_rate_limit_reset(response)
                self._handle_rate_limit(reset_time)
                raise RateLimitError("Rate limit exceeded", reset_time)
            
            # Handle authentication errors
            if response.status_code in [401, 403]:
                self._handle_auth_error(response)
                raise AuthenticationError(f"Authentication failed: {response.status_code}")
            
            response.raise_for_status()
            return response
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed for {self.integration.provider.value}: {str(e)}")
            raise
    
    def _update_rate_limits(self, response: requests.Response):
        """Update integration rate limit info from response headers"""
        rate_limit_headers = [
            'X-RateLimit-Remaining', 'X-Shopify-Shop-Api-Call-Limit',
            'x-amzn-RateLimit-Limit', 'RateLimit-Remaining'
        ]
        
        for header in rate_limit_headers:
            if header in response.headers:
                try:
                    if 'remaining' in header.lower():
                        self.integration.rate_limit_remaining = int(response.headers[header])
                    break
                except ValueError:
                    continue
    
    def _parse_rate_limit_reset(self, response: requests.Response) -> Optional[datetime]:
        """Parse rate limit reset time from response headers"""
        reset_headers = ['X-RateLimit-Reset', 'Retry-After']
        
        for header in reset_headers:
            if header in response.headers:
                try:
                    if header == 'Retry-After':
                        seconds = int(response.headers[header])
                        return datetime.utcnow() + timedelta(seconds=seconds)
                    else:
                        timestamp = int(response.headers[header])
                        return datetime.fromtimestamp(timestamp)
                except (ValueError, OSError):
                    continue
        
        # Default to 60 seconds if no reset time found
        return datetime.utcnow() + timedelta(seconds=60)
    
    def _handle_rate_limit(self, reset_at: datetime):
        """Handle rate limiting by updating integration status"""
        self.integration.status = IntegrationStatus.RATE_LIMITED
        self.integration.rate_limit_reset_at = reset_at
        self.integration.error_message = f"Rate limited until {reset_at}"
        db.session.commit()
        
        logger.warning(f"Integration {self.integration.id} rate limited until {reset_at}")
    
    def _handle_auth_error(self, response: requests.Response):
        """Handle authentication errors"""
        self.integration.status = IntegrationStatus.ERROR
        self.integration.error_message = f"Authentication error: {response.status_code}"
        db.session.commit()
        
        logger.error(f"Authentication error for integration {self.integration.id}")
    
    def test_connection(self) -> IntegrationHealth:
        """Test the API connection and return health status"""
        start_time = time.time()
        health_check = IntegrationHealth(
            integration_id=self.integration.id,
            check_time=datetime.utcnow()
        )
        
        try:
            response = self._test_endpoint()
            response_time = int((time.time() - start_time) * 1000)
            
            health_check.is_healthy = response.status_code == 200
            health_check.response_time_ms = response_time
            health_check.status_code = response.status_code
            
            if not health_check.is_healthy:
                health_check.error_message = f"HTTP {response.status_code}: {response.text[:500]}"
            
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            health_check.is_healthy = False
            health_check.response_time_ms = response_time
            health_check.error_message = str(e)[:500]
        
        db.session.add(health_check)
        db.session.commit()
        
        return health_check
    
    def _test_endpoint(self) -> requests.Response:
        """Override in subclasses to provide a test endpoint"""
        raise NotImplementedError("Subclasses must implement _test_endpoint")
    
    def sync_data(self, sync_type: str = 'incremental') -> IntegrationSyncLog:
        """Sync data from the API - override in subclasses"""
        raise NotImplementedError("Subclasses must implement sync_data")

class ApiIntegrationService:
    """Service class to manage API integrations"""
    
    @staticmethod
    def get_client(integration: ApiIntegration) -> BaseApiClient:
        """Factory method to get the appropriate API client"""
        from app.services.shopify_client import ShopifyApiClient
        from app.services.amazon_sp_client import AmazonSpApiClient
        from app.services.xero_client import XeroApiClient
        
        client_map = {
            'shopify': ShopifyApiClient,
            'amazon_sp': AmazonSpApiClient,
            'xero': XeroApiClient
        }
        
        client_class = client_map.get(integration.provider.value)
        if not client_class:
            raise ValueError(f"No client available for provider: {integration.provider.value}")
        
        return client_class(integration)
    
    @staticmethod
    def sync_integration(integration_id: int, sync_type: str = 'incremental') -> IntegrationSyncLog:
        """Sync a specific integration"""
        integration = ApiIntegration.query.get_or_404(integration_id)
        
        if not integration.can_sync_now():
            raise ValueError(f"Integration {integration_id} cannot sync now: {integration.status.value}")
        
        # Update integration status
        integration.status = IntegrationStatus.ACTIVE
        integration.last_sync_at = datetime.utcnow()
        db.session.commit()
        
        try:
            client = ApiIntegrationService.get_client(integration)
            sync_log = client.sync_data(sync_type)
            
            # Update integration after successful sync
            integration.status = IntegrationStatus.ACTIVE
            integration.error_message = None
            integration.retry_count = 0
            integration.schedule_next_sync()
            
        except (RateLimitError, AuthenticationError) as e:
            logger.warning(f"Integration {integration_id} sync failed: {str(e)}")
            # Status already updated in the client
            return None
            
        except Exception as e:
            logger.error(f"Integration {integration_id} sync failed: {str(e)}")
            integration.status = IntegrationStatus.ERROR
            integration.error_message = str(e)[:500]
            integration.retry_count += 1
            
            # Create failed sync log
            sync_log = IntegrationSyncLog(
                integration_id=integration_id,
                sync_type=sync_type,
                status='failed',
                error_message=str(e)[:500],
                completed_at=datetime.utcnow()
            )
            db.session.add(sync_log)
        
        db.session.commit()
        return sync_log
    
    @staticmethod
    def sync_all_due_integrations():
        """Sync all integrations that are due for synchronization"""
        due_integrations = ApiIntegration.query.filter(
            ApiIntegration.is_active == True,
            ApiIntegration.next_sync_at <= datetime.utcnow(),
            ApiIntegration.status != IntegrationStatus.ERROR
        ).all()
        
        results = []
        for integration in due_integrations:
            try:
                sync_log = ApiIntegrationService.sync_integration(integration.id)
                results.append(sync_log)
                
                # Add delay between syncs to avoid overwhelming APIs
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Failed to sync integration {integration.id}: {str(e)}")
                continue
        
        return results
    
    @staticmethod
    def process_webhook(provider: str, event_type: str, payload: Dict[str, Any], headers: Dict[str, str]) -> WebhookEvent:
        """Process incoming webhook events"""
        webhook_event = WebhookEvent(
            provider=provider,
            event_type=event_type,
            payload=payload,
            headers=headers
        )
        
        # Extract event ID if available
        if provider == 'shopify' and 'X-Shopify-Hmac-Sha256' in headers:
            webhook_event.event_id = headers.get('X-Shopify-Webhook-Id')
            webhook_event.topic = headers.get('X-Shopify-Topic')
        elif provider == 'amazon_sp':
            webhook_event.event_id = payload.get('eventId')
            webhook_event.topic = payload.get('eventType')
        
        db.session.add(webhook_event)
        db.session.commit()
        
        # Process the webhook event asynchronously
        try:
            ApiIntegrationService._process_webhook_event(webhook_event)
        except Exception as e:
            logger.error(f"Failed to process webhook {webhook_event.id}: {str(e)}")
            webhook_event.error_message = str(e)[:500]
            db.session.commit()
        
        return webhook_event
    
    @staticmethod
    def _process_webhook_event(webhook_event: WebhookEvent):
        """Process a webhook event based on its type"""
        try:
            if webhook_event.provider.value == 'shopify':
                ApiIntegrationService._process_shopify_webhook(webhook_event)
            elif webhook_event.provider.value == 'amazon_sp':
                ApiIntegrationService._process_amazon_webhook(webhook_event)
            
            webhook_event.processed = True
            webhook_event.processed_at = datetime.utcnow()
            
        except Exception as e:
            webhook_event.error_message = str(e)[:500]
            webhook_event.retry_count += 1
            raise
        
        db.session.commit()
    
    @staticmethod
    def _process_shopify_webhook(webhook_event: WebhookEvent):
        """Process Shopify webhook events"""
        # Import here to avoid circular imports
        from app.services.shopify_client import ShopifyWebhookProcessor
        
        processor = ShopifyWebhookProcessor()
        processor.process_webhook(webhook_event.topic, webhook_event.payload)
    
    @staticmethod
    def _process_amazon_webhook(webhook_event: WebhookEvent):
        """Process Amazon SP-API webhook events"""
        # Import here to avoid circular imports
        from app.services.amazon_sp_client import AmazonWebhookProcessor
        
        processor = AmazonWebhookProcessor()
        processor.process_webhook(webhook_event.event_type, webhook_event.payload)
    
    @staticmethod
    def test_all_integrations() -> List[IntegrationHealth]:
        """Test health of all active integrations"""
        active_integrations = ApiIntegration.query.filter(
            ApiIntegration.is_active == True
        ).all()
        
        health_checks = []
        for integration in active_integrations:
            try:
                client = ApiIntegrationService.get_client(integration)
                health_check = client.test_connection()
                health_checks.append(health_check)
            except Exception as e:
                logger.error(f"Failed to test integration {integration.id}: {str(e)}")
                continue
        
        return health_checks