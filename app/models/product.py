from datetime import datetime, timezone
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sku = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # GABA Red, GABA Black, GABA Gold
    market_region = db.Column(db.String(10), nullable=False)  # UK, EU, USA
    
    # Product specifications
    weight_kg = db.Column(db.Numeric(8, 3))
    dimensions_cm = db.Column(db.String(50))
    unit_cost = db.Column(db.Numeric(10, 2))
    selling_price = db.Column(db.Numeric(10, 2))
    
    # Manufacturing details
    production_time_hours = db.Column(db.Numeric(6, 2))
    batch_size_min = db.Column(db.Integer)
    batch_size_max = db.Column(db.Integer)
    
    # Status and metadata
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Relationships
    historical_sales = db.relationship('HistoricalSales', backref='product', lazy='dynamic')
    forecasts = db.relationship('Forecast', backref='product', lazy='dynamic')
    inventory_levels = db.relationship('InventoryLevel', backref='product', lazy='dynamic')
    
    # Indexes
    __table_args__ = (
        db.Index('ix_product_category_market', 'category', 'market_region'),
        db.Index('ix_product_active_created', 'is_active', 'created_at'),
    )
    
    def __repr__(self):
        return f'<Product {self.sku}: {self.name}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'sku': self.sku,
            'name': self.name,
            'category': self.category,
            'market_region': self.market_region,
            'weight_kg': float(self.weight_kg) if self.weight_kg else None,
            'dimensions_cm': self.dimensions_cm,
            'unit_cost': float(self.unit_cost) if self.unit_cost else None,
            'selling_price': float(self.selling_price) if self.selling_price else None,
            'production_time_hours': float(self.production_time_hours) if self.production_time_hours else None,
            'batch_size_min': self.batch_size_min,
            'batch_size_max': self.batch_size_max,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_by_sku(cls, sku):
        return cls.query.filter_by(sku=sku, is_active=True).first()
    
    @classmethod
    def get_by_category_and_market(cls, category, market_region):
        return cls.query.filter_by(
            category=category, 
            market_region=market_region, 
            is_active=True
        ).all()