from datetime import datetime, timezone
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Market(db.Model):
    __tablename__ = 'markets'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = db.Column(db.String(10), unique=True, nullable=False, index=True)  # UK, EU, USA
    name = db.Column(db.String(100), nullable=False)
    region = db.Column(db.String(50), nullable=False)
    
    # Market characteristics
    currency_code = db.Column(db.String(3), nullable=False)  # GBP, EUR, USD
    tax_rate = db.Column(db.Numeric(5, 4))  # VAT/Sales tax as decimal
    
    # Shipping and logistics
    standard_shipping_days = db.Column(db.Integer)
    express_shipping_days = db.Column(db.Integer)
    customs_requirements = db.Column(db.Text)
    
    # Regulatory information
    regulatory_requirements = db.Column(db.JSON)
    import_restrictions = db.Column(db.Text)
    
    # Status and metadata
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Relationships
    sales_channels = db.relationship('SalesChannel', backref='market', lazy='dynamic')
    products = db.relationship('Product', backref='market', lazy='dynamic', 
                              primaryjoin='Market.code == foreign(Product.market_region)')
    
    def __repr__(self):
        return f'<Market {self.code}: {self.name}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'code': self.code,
            'name': self.name,
            'region': self.region,
            'currency_code': self.currency_code,
            'tax_rate': float(self.tax_rate) if self.tax_rate else None,
            'standard_shipping_days': self.standard_shipping_days,
            'express_shipping_days': self.express_shipping_days,
            'customs_requirements': self.customs_requirements,
            'regulatory_requirements': self.regulatory_requirements,
            'import_restrictions': self.import_restrictions,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_by_code(cls, code):
        return cls.query.filter_by(code=code, is_active=True).first()
    
    @classmethod
    def get_active_markets(cls):
        return cls.query.filter_by(is_active=True).all()