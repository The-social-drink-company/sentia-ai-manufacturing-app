from datetime import datetime, timezone, date
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class InventoryLevel(db.Model):
    __tablename__ = 'inventory_levels'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    product_id = db.Column(UUID(as_uuid=True), db.ForeignKey('products.id'), nullable=False)
    
    # Location and storage
    location_type = db.Column(db.String(50), nullable=False)  # warehouse, fba, store, transit
    location_id = db.Column(db.String(100), nullable=False)  # warehouse ID, FBA center ID, etc.
    location_name = db.Column(db.String(200))
    country_code = db.Column(db.String(10))
    
    # Inventory quantities
    available_quantity = db.Column(db.Integer, nullable=False, default=0)
    reserved_quantity = db.Column(db.Integer, default=0)  # Allocated but not shipped
    inbound_quantity = db.Column(db.Integer, default=0)  # In transit to location
    defective_quantity = db.Column(db.Integer, default=0)  # Damaged/returns
    total_quantity = db.Column(db.Integer, nullable=False, default=0)
    
    # Stock levels and thresholds
    reorder_point = db.Column(db.Integer)
    safety_stock = db.Column(db.Integer)
    maximum_stock = db.Column(db.Integer)
    economic_order_quantity = db.Column(db.Integer)
    
    # Costs
    unit_cost = db.Column(db.Numeric(10, 2))
    total_value = db.Column(db.Numeric(12, 2))
    storage_cost_per_unit_monthly = db.Column(db.Numeric(8, 4))
    
    # Age and turnover
    average_age_days = db.Column(db.Integer)
    oldest_stock_date = db.Column(db.Date)
    turnover_rate_monthly = db.Column(db.Numeric(6, 4))
    
    # Forecasting support
    expected_demand_30d = db.Column(db.Integer)
    days_of_supply = db.Column(db.Integer)
    stock_out_risk_score = db.Column(db.Numeric(3, 2))  # 0-1 scale
    
    # Status and alerts
    status = db.Column(db.String(20), default='normal', nullable=False)  # normal, low, critical, excess
    last_movement_date = db.Column(db.Date)
    last_count_date = db.Column(db.Date)
    requires_recount = db.Column(db.Boolean, default=False)
    
    # Data source and accuracy
    data_source = db.Column(db.String(50))  # manual, api, system
    last_sync_at = db.Column(db.DateTime(timezone=True))
    sync_status = db.Column(db.String(20), default='success')
    
    # Notes and adjustments
    notes = db.Column(db.Text)
    adjustment_reason = db.Column(db.String(200))
    
    # Snapshot date (for historical tracking)
    snapshot_date = db.Column(db.Date, default=date.today, nullable=False, index=True)
    
    # Status and metadata
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Indexes for performance
    __table_args__ = (
        db.Index('ix_inventory_product_location', 'product_id', 'location_id'),
        db.Index('ix_inventory_location_type', 'location_type'),
        db.Index('ix_inventory_status_date', 'status', 'snapshot_date'),
        db.Index('ix_inventory_snapshot_date', 'snapshot_date'),
        db.Index('ix_inventory_country', 'country_code'),
        # Unique constraint for current inventory levels
        db.UniqueConstraint('product_id', 'location_id', 'snapshot_date', 
                          name='uq_inventory_product_location_date'),
    )
    
    def __repr__(self):
        return f'<InventoryLevel {self.location_name}: {self.available_quantity} units>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'product_id': str(self.product_id),
            'location_type': self.location_type,
            'location_id': self.location_id,
            'location_name': self.location_name,
            'country_code': self.country_code,
            'available_quantity': self.available_quantity,
            'reserved_quantity': self.reserved_quantity,
            'inbound_quantity': self.inbound_quantity,
            'defective_quantity': self.defective_quantity,
            'total_quantity': self.total_quantity,
            'reorder_point': self.reorder_point,
            'safety_stock': self.safety_stock,
            'maximum_stock': self.maximum_stock,
            'economic_order_quantity': self.economic_order_quantity,
            'unit_cost': float(self.unit_cost) if self.unit_cost else None,
            'total_value': float(self.total_value) if self.total_value else None,
            'storage_cost_per_unit_monthly': float(self.storage_cost_per_unit_monthly) if self.storage_cost_per_unit_monthly else None,
            'average_age_days': self.average_age_days,
            'oldest_stock_date': self.oldest_stock_date.isoformat() if self.oldest_stock_date else None,
            'turnover_rate_monthly': float(self.turnover_rate_monthly) if self.turnover_rate_monthly else None,
            'expected_demand_30d': self.expected_demand_30d,
            'days_of_supply': self.days_of_supply,
            'stock_out_risk_score': float(self.stock_out_risk_score) if self.stock_out_risk_score else None,
            'status': self.status,
            'last_movement_date': self.last_movement_date.isoformat() if self.last_movement_date else None,
            'last_count_date': self.last_count_date.isoformat() if self.last_count_date else None,
            'requires_recount': self.requires_recount,
            'data_source': self.data_source,
            'last_sync_at': self.last_sync_at.isoformat() if self.last_sync_at else None,
            'sync_status': self.sync_status,
            'notes': self.notes,
            'adjustment_reason': self.adjustment_reason,
            'snapshot_date': self.snapshot_date.isoformat() if self.snapshot_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_current_inventory(cls, product_id, location_id=None):
        query = cls.query.filter_by(
            product_id=product_id,
            snapshot_date=date.today()
        )
        
        if location_id:
            query = query.filter_by(location_id=location_id)
        
        return query.all()
    
    @classmethod
    def get_total_available_inventory(cls, product_id, country_code=None):
        query = db.session.query(
            db.func.sum(cls.available_quantity).label('total_available')
        ).filter(
            cls.product_id == product_id,
            cls.snapshot_date == date.today()
        )
        
        if country_code:
            query = query.filter(cls.country_code == country_code)
        
        result = query.first()
        return result.total_available if result.total_available else 0
    
    @classmethod
    def get_low_stock_items(cls, threshold_days=7):
        return cls.query.filter(
            cls.snapshot_date == date.today(),
            cls.days_of_supply <= threshold_days,
            cls.status.in_(['low', 'critical'])
        ).all()
    
    def calculate_stock_metrics(self):
        # Calculate total quantity
        self.total_quantity = (
            self.available_quantity + 
            self.reserved_quantity + 
            self.inbound_quantity + 
            self.defective_quantity
        )
        
        # Calculate total value
        if self.unit_cost and self.total_quantity:
            self.total_value = self.unit_cost * self.total_quantity
        
        # Determine status based on stock levels
        if self.reorder_point and self.available_quantity <= self.reorder_point:
            if self.safety_stock and self.available_quantity <= self.safety_stock:
                self.status = 'critical'
            else:
                self.status = 'low'
        elif self.maximum_stock and self.total_quantity >= self.maximum_stock:
            self.status = 'excess'
        else:
            self.status = 'normal'
    
    def update_stock_metrics(self):
        self.calculate_stock_metrics()
        db.session.commit()