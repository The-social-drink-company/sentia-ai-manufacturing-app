from datetime import datetime, timezone, date
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class HistoricalSales(db.Model):
    __tablename__ = 'historical_sales'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    product_id = db.Column(UUID(as_uuid=True), db.ForeignKey('products.id'), nullable=False)
    sales_channel_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sales_channels.id'), nullable=False)
    
    # Time dimension
    sale_date = db.Column(db.Date, nullable=False, index=True)
    sale_datetime = db.Column(db.DateTime(timezone=True), nullable=False)
    
    # Sales metrics
    quantity_sold = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    gross_revenue = db.Column(db.Numeric(12, 2), nullable=False)
    discounts = db.Column(db.Numeric(10, 2), default=0)
    net_revenue = db.Column(db.Numeric(12, 2), nullable=False)
    
    # Costs and margins
    cost_of_goods_sold = db.Column(db.Numeric(10, 2))
    shipping_cost = db.Column(db.Numeric(8, 2))
    platform_fees = db.Column(db.Numeric(8, 2))
    taxes = db.Column(db.Numeric(8, 2))
    net_profit = db.Column(db.Numeric(10, 2))
    
    # Order details
    order_id = db.Column(db.String(100))
    order_item_id = db.Column(db.String(100))
    customer_type = db.Column(db.String(20))  # B2C, B2B
    fulfillment_method = db.Column(db.String(20))  # FBA, FBM, Own
    
    # Geographic and seasonal data
    shipping_country = db.Column(db.String(10))
    shipping_region = db.Column(db.String(50))
    season = db.Column(db.String(20))  # Spring, Summer, Autumn, Winter
    
    # Data source and quality
    data_source = db.Column(db.String(50))  # API, Manual, Import
    data_quality_score = db.Column(db.Numeric(3, 2))  # 0-1 scale
    is_validated = db.Column(db.Boolean, default=False, nullable=False)
    validation_notes = db.Column(db.Text)
    
    # Status and metadata
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Indexes for performance
    __table_args__ = (
        db.Index('ix_historical_sales_date_product', 'sale_date', 'product_id'),
        db.Index('ix_historical_sales_date_channel', 'sale_date', 'sales_channel_id'),
        db.Index('ix_historical_sales_product_channel_date', 'product_id', 'sales_channel_id', 'sale_date'),
        db.Index('ix_historical_sales_validated', 'is_validated', 'data_quality_score'),
        db.Index('ix_historical_sales_order', 'order_id'),
        # Composite index for time-series queries
        db.Index('ix_historical_sales_timeseries', 'product_id', 'sales_channel_id', 'sale_date', 'quantity_sold'),
    )
    
    def __repr__(self):
        return f'<HistoricalSales {self.sale_date}: {self.quantity_sold} units @ {self.unit_price}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'product_id': str(self.product_id),
            'sales_channel_id': str(self.sales_channel_id),
            'sale_date': self.sale_date.isoformat() if self.sale_date else None,
            'sale_datetime': self.sale_datetime.isoformat() if self.sale_datetime else None,
            'quantity_sold': self.quantity_sold,
            'unit_price': float(self.unit_price),
            'gross_revenue': float(self.gross_revenue),
            'discounts': float(self.discounts) if self.discounts else 0,
            'net_revenue': float(self.net_revenue),
            'cost_of_goods_sold': float(self.cost_of_goods_sold) if self.cost_of_goods_sold else None,
            'shipping_cost': float(self.shipping_cost) if self.shipping_cost else None,
            'platform_fees': float(self.platform_fees) if self.platform_fees else None,
            'taxes': float(self.taxes) if self.taxes else None,
            'net_profit': float(self.net_profit) if self.net_profit else None,
            'order_id': self.order_id,
            'order_item_id': self.order_item_id,
            'customer_type': self.customer_type,
            'fulfillment_method': self.fulfillment_method,
            'shipping_country': self.shipping_country,
            'shipping_region': self.shipping_region,
            'season': self.season,
            'data_source': self.data_source,
            'data_quality_score': float(self.data_quality_score) if self.data_quality_score else None,
            'is_validated': self.is_validated,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_sales_by_date_range(cls, product_id, sales_channel_id, start_date, end_date):
        return cls.query.filter(
            cls.product_id == product_id,
            cls.sales_channel_id == sales_channel_id,
            cls.sale_date >= start_date,
            cls.sale_date <= end_date
        ).order_by(cls.sale_date).all()
    
    @classmethod
    def get_aggregate_sales(cls, product_id=None, sales_channel_id=None, start_date=None, end_date=None):
        query = db.session.query(
            db.func.sum(cls.quantity_sold).label('total_quantity'),
            db.func.sum(cls.gross_revenue).label('total_revenue'),
            db.func.sum(cls.net_profit).label('total_profit'),
            db.func.count().label('transaction_count')
        )
        
        if product_id:
            query = query.filter(cls.product_id == product_id)
        if sales_channel_id:
            query = query.filter(cls.sales_channel_id == sales_channel_id)
        if start_date:
            query = query.filter(cls.sale_date >= start_date)
        if end_date:
            query = query.filter(cls.sale_date <= end_date)
            
        return query.first()
    
    @classmethod
    def get_monthly_summary(cls, year, month, product_id=None, sales_channel_id=None):
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        
        query = db.session.query(
            cls.sale_date,
            db.func.sum(cls.quantity_sold).label('daily_quantity'),
            db.func.sum(cls.gross_revenue).label('daily_revenue')
        ).filter(
            cls.sale_date >= start_date,
            cls.sale_date < end_date
        )
        
        if product_id:
            query = query.filter(cls.product_id == product_id)
        if sales_channel_id:
            query = query.filter(cls.sales_channel_id == sales_channel_id)
            
        return query.group_by(cls.sale_date).order_by(cls.sale_date).all()