from datetime import datetime, timezone
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class SalesChannel(db.Model):
    __tablename__ = 'sales_channels'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    channel_type = db.Column(db.String(50), nullable=False)  # Amazon, Shopify
    market_code = db.Column(db.String(10), db.ForeignKey('markets.code'), nullable=False)
    
    # Channel configuration
    api_endpoint = db.Column(db.String(255))
    api_credentials_encrypted = db.Column(db.Text)
    marketplace_id = db.Column(db.String(100))
    
    # Channel characteristics
    commission_rate = db.Column(db.Numeric(5, 4))  # Platform commission as decimal
    fulfillment_method = db.Column(db.String(20))  # FBA, FBM, Own
    average_processing_days = db.Column(db.Integer)
    
    # Integration settings
    sync_enabled = db.Column(db.Boolean, default=True, nullable=False)
    sync_frequency_minutes = db.Column(db.Integer, default=60)
    last_sync_at = db.Column(db.DateTime(timezone=True))
    sync_status = db.Column(db.String(20), default='pending')  # success, error, pending
    sync_error_message = db.Column(db.Text)
    
    # Performance metrics
    monthly_sales_target = db.Column(db.Numeric(12, 2))
    conversion_rate = db.Column(db.Numeric(5, 4))
    return_rate = db.Column(db.Numeric(5, 4))
    
    # Status and metadata
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Relationships
    historical_sales = db.relationship('HistoricalSales', backref='sales_channel', lazy='dynamic')
    forecasts = db.relationship('Forecast', backref='sales_channel', lazy='dynamic')
    
    # Indexes
    __table_args__ = (
        db.Index('ix_sales_channel_type_market', 'channel_type', 'market_code'),
        db.Index('ix_sales_channel_active_sync', 'is_active', 'sync_enabled'),
        db.Index('ix_sales_channel_last_sync', 'last_sync_at'),
    )
    
    def __repr__(self):
        return f'<SalesChannel {self.name} ({self.channel_type} - {self.market_code})>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'channel_type': self.channel_type,
            'market_code': self.market_code,
            'api_endpoint': self.api_endpoint,
            'marketplace_id': self.marketplace_id,
            'commission_rate': float(self.commission_rate) if self.commission_rate else None,
            'fulfillment_method': self.fulfillment_method,
            'average_processing_days': self.average_processing_days,
            'sync_enabled': self.sync_enabled,
            'sync_frequency_minutes': self.sync_frequency_minutes,
            'last_sync_at': self.last_sync_at.isoformat() if self.last_sync_at else None,
            'sync_status': self.sync_status,
            'sync_error_message': self.sync_error_message,
            'monthly_sales_target': float(self.monthly_sales_target) if self.monthly_sales_target else None,
            'conversion_rate': float(self.conversion_rate) if self.conversion_rate else None,
            'return_rate': float(self.return_rate) if self.return_rate else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_by_type_and_market(cls, channel_type, market_code):
        return cls.query.filter_by(
            channel_type=channel_type, 
            market_code=market_code, 
            is_active=True
        ).all()
    
    @classmethod
    def get_sync_enabled(cls):
        return cls.query.filter_by(sync_enabled=True, is_active=True).all()
    
    def update_sync_status(self, status, error_message=None):
        self.sync_status = status
        self.sync_error_message = error_message
        self.last_sync_at = datetime.now(timezone.utc)
        db.session.commit()