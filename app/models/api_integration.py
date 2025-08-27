from datetime import datetime, timedelta
from enum import Enum
from flask_sqlalchemy import SQLAlchemy
from app import db

class IntegrationProvider(Enum):
    SHOPIFY = "shopify"
    AMAZON_SP = "amazon_sp"
    XERO = "xero"

class IntegrationType(Enum):
    API = "api"
    WEBHOOK = "webhook"
    BATCH = "batch"

class IntegrationStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    RATE_LIMITED = "rate_limited"
    AUTHENTICATING = "authenticating"

class ApiCredential(db.Model):
    __tablename__ = 'api_credentials'
    
    id = db.Column(db.Integer, primary_key=True)
    provider = db.Column(db.Enum(IntegrationProvider), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    client_id = db.Column(db.Text)
    client_secret = db.Column(db.Text)
    access_token = db.Column(db.Text)
    refresh_token = db.Column(db.Text)
    token_expires_at = db.Column(db.DateTime)
    api_key = db.Column(db.Text)
    shop_url = db.Column(db.String(255))  # For Shopify
    marketplace_id = db.Column(db.String(50))  # For Amazon
    region = db.Column(db.String(20))
    environment = db.Column(db.String(20), default='production')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    integrations = db.relationship('ApiIntegration', back_populates='credential', lazy='dynamic')
    
    def __repr__(self):
        return f'<ApiCredential {self.provider.value}: {self.name}>'
    
    def is_token_expired(self):
        if not self.token_expires_at:
            return False
        return datetime.utcnow() >= self.token_expires_at
    
    def needs_refresh(self, buffer_minutes=30):
        if not self.token_expires_at:
            return False
        return datetime.utcnow() >= (self.token_expires_at - timedelta(minutes=buffer_minutes))

class ApiIntegration(db.Model):
    __tablename__ = 'api_integrations'
    
    id = db.Column(db.Integer, primary_key=True)
    credential_id = db.Column(db.Integer, db.ForeignKey('api_credentials.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    provider = db.Column(db.Enum(IntegrationProvider), nullable=False)
    integration_type = db.Column(db.Enum(IntegrationType), nullable=False)
    endpoint_url = db.Column(db.String(500))
    webhook_url = db.Column(db.String(500))
    sync_frequency_minutes = db.Column(db.Integer, default=60)  # How often to sync
    last_sync_at = db.Column(db.DateTime)
    next_sync_at = db.Column(db.DateTime)
    status = db.Column(db.Enum(IntegrationStatus), default=IntegrationStatus.INACTIVE)
    error_message = db.Column(db.Text)
    retry_count = db.Column(db.Integer, default=0)
    max_retries = db.Column(db.Integer, default=3)
    rate_limit_remaining = db.Column(db.Integer)
    rate_limit_reset_at = db.Column(db.DateTime)
    config_json = db.Column(db.JSON)  # Store provider-specific configuration
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    credential = db.relationship('ApiCredential', back_populates='integrations')
    sync_logs = db.relationship('IntegrationSyncLog', back_populates='integration', lazy='dynamic')
    
    def __repr__(self):
        return f'<ApiIntegration {self.provider.value}: {self.name}>'
    
    def can_sync_now(self):
        if not self.is_active or self.status == IntegrationStatus.ERROR:
            return False
        if self.status == IntegrationStatus.RATE_LIMITED:
            return datetime.utcnow() >= self.rate_limit_reset_at if self.rate_limit_reset_at else False
        return True
    
    def schedule_next_sync(self):
        if self.sync_frequency_minutes and self.sync_frequency_minutes > 0:
            self.next_sync_at = datetime.utcnow() + timedelta(minutes=self.sync_frequency_minutes)

class IntegrationSyncLog(db.Model):
    __tablename__ = 'integration_sync_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    integration_id = db.Column(db.Integer, db.ForeignKey('api_integrations.id'), nullable=False)
    sync_type = db.Column(db.String(50), nullable=False)  # 'full', 'incremental', 'webhook'
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='running')  # 'running', 'completed', 'failed', 'partial'
    records_processed = db.Column(db.Integer, default=0)
    records_success = db.Column(db.Integer, default=0)
    records_failed = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text)
    response_data = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    integration = db.relationship('ApiIntegration', back_populates='sync_logs')
    
    def __repr__(self):
        return f'<IntegrationSyncLog {self.id}: {self.sync_type}>'
    
    @property
    def duration_seconds(self):
        if not self.completed_at:
            return None
        return (self.completed_at - self.started_at).total_seconds()
    
    @property
    def success_rate(self):
        if self.records_processed == 0:
            return 0
        return (self.records_success / self.records_processed) * 100

class WebhookEvent(db.Model):
    __tablename__ = 'webhook_events'
    
    id = db.Column(db.Integer, primary_key=True)
    provider = db.Column(db.Enum(IntegrationProvider), nullable=False)
    event_type = db.Column(db.String(100), nullable=False)
    event_id = db.Column(db.String(255))  # Provider's unique event ID
    topic = db.Column(db.String(100))  # e.g., 'orders/create', 'inventory/update'
    payload = db.Column(db.JSON, nullable=False)
    headers = db.Column(db.JSON)
    processed = db.Column(db.Boolean, default=False)
    processed_at = db.Column(db.DateTime)
    error_message = db.Column(db.Text)
    retry_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<WebhookEvent {self.provider.value}: {self.event_type}>'

class IntegrationHealth(db.Model):
    __tablename__ = 'integration_health'
    
    id = db.Column(db.Integer, primary_key=True)
    integration_id = db.Column(db.Integer, db.ForeignKey('api_integrations.id'), nullable=False)
    check_time = db.Column(db.DateTime, default=datetime.utcnow)
    is_healthy = db.Column(db.Boolean, nullable=False)
    response_time_ms = db.Column(db.Integer)
    error_message = db.Column(db.Text)
    status_code = db.Column(db.Integer)
    
    # Relationships
    integration = db.relationship('ApiIntegration', backref='health_checks')
    
    def __repr__(self):
        return f'<IntegrationHealth {self.integration_id}: {self.is_healthy}>'