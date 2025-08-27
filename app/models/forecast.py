from datetime import datetime, timezone, date
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Forecast(db.Model):
    __tablename__ = 'forecasts'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    product_id = db.Column(UUID(as_uuid=True), db.ForeignKey('products.id'), nullable=False)
    sales_channel_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sales_channels.id'), nullable=False)
    
    # Forecast period
    forecast_date = db.Column(db.Date, nullable=False, index=True)
    forecast_period = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly
    forecast_horizon_days = db.Column(db.Integer, nullable=False)
    
    # Demand forecasts
    predicted_demand = db.Column(db.Integer, nullable=False)
    demand_lower_bound = db.Column(db.Integer)  # 95% confidence interval
    demand_upper_bound = db.Column(db.Integer)  # 95% confidence interval
    confidence_score = db.Column(db.Numeric(3, 2))  # 0-1 scale
    
    # Revenue forecasts
    predicted_revenue = db.Column(db.Numeric(12, 2))
    revenue_lower_bound = db.Column(db.Numeric(12, 2))
    revenue_upper_bound = db.Column(db.Numeric(12, 2))
    
    # Seasonal and trend factors
    seasonal_factor = db.Column(db.Numeric(5, 4))
    trend_factor = db.Column(db.Numeric(5, 4))
    promotional_factor = db.Column(db.Numeric(5, 4))
    external_factors = db.Column(db.JSON)  # Economic indicators, events, etc.
    
    # Model information
    model_type = db.Column(db.String(50), nullable=False)  # ARIMA, Prophet, ML, Manual
    model_version = db.Column(db.String(20))
    training_data_start = db.Column(db.Date)
    training_data_end = db.Column(db.Date)
    model_accuracy_score = db.Column(db.Numeric(5, 4))  # MAE, MAPE, etc.
    
    # Forecast status
    status = db.Column(db.String(20), default='active', nullable=False)  # active, superseded, manual_override
    is_approved = db.Column(db.Boolean, default=False, nullable=False)
    approved_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime(timezone=True))
    
    # Actual vs forecast tracking
    actual_demand = db.Column(db.Integer)
    actual_revenue = db.Column(db.Numeric(12, 2))
    forecast_error = db.Column(db.Numeric(8, 2))
    forecast_accuracy = db.Column(db.Numeric(5, 4))
    
    # Notes and adjustments
    notes = db.Column(db.Text)
    manual_adjustments = db.Column(db.JSON)
    
    # Status and metadata
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Indexes for performance
    __table_args__ = (
        db.Index('ix_forecast_date_product', 'forecast_date', 'product_id'),
        db.Index('ix_forecast_date_channel', 'forecast_date', 'sales_channel_id'),
        db.Index('ix_forecast_product_channel_date', 'product_id', 'sales_channel_id', 'forecast_date'),
        db.Index('ix_forecast_status_approved', 'status', 'is_approved'),
        db.Index('ix_forecast_model_type', 'model_type'),
        # Unique constraint to prevent duplicate forecasts
        db.UniqueConstraint('product_id', 'sales_channel_id', 'forecast_date', 'forecast_period', 
                          name='uq_forecast_product_channel_date_period'),
    )
    
    def __repr__(self):
        return f'<Forecast {self.forecast_date}: {self.predicted_demand} units ({self.model_type})>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'product_id': str(self.product_id),
            'sales_channel_id': str(self.sales_channel_id),
            'forecast_date': self.forecast_date.isoformat() if self.forecast_date else None,
            'forecast_period': self.forecast_period,
            'forecast_horizon_days': self.forecast_horizon_days,
            'predicted_demand': self.predicted_demand,
            'demand_lower_bound': self.demand_lower_bound,
            'demand_upper_bound': self.demand_upper_bound,
            'confidence_score': float(self.confidence_score) if self.confidence_score else None,
            'predicted_revenue': float(self.predicted_revenue) if self.predicted_revenue else None,
            'revenue_lower_bound': float(self.revenue_lower_bound) if self.revenue_lower_bound else None,
            'revenue_upper_bound': float(self.revenue_upper_bound) if self.revenue_upper_bound else None,
            'seasonal_factor': float(self.seasonal_factor) if self.seasonal_factor else None,
            'trend_factor': float(self.trend_factor) if self.trend_factor else None,
            'promotional_factor': float(self.promotional_factor) if self.promotional_factor else None,
            'external_factors': self.external_factors,
            'model_type': self.model_type,
            'model_version': self.model_version,
            'training_data_start': self.training_data_start.isoformat() if self.training_data_start else None,
            'training_data_end': self.training_data_end.isoformat() if self.training_data_end else None,
            'model_accuracy_score': float(self.model_accuracy_score) if self.model_accuracy_score else None,
            'status': self.status,
            'is_approved': self.is_approved,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'actual_demand': self.actual_demand,
            'actual_revenue': float(self.actual_revenue) if self.actual_revenue else None,
            'forecast_error': float(self.forecast_error) if self.forecast_error else None,
            'forecast_accuracy': float(self.forecast_accuracy) if self.forecast_accuracy else None,
            'notes': self.notes,
            'manual_adjustments': self.manual_adjustments,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_active_forecast(cls, product_id, sales_channel_id, forecast_date):
        return cls.query.filter_by(
            product_id=product_id,
            sales_channel_id=sales_channel_id,
            forecast_date=forecast_date,
            status='active'
        ).first()
    
    @classmethod
    def get_forecasts_by_date_range(cls, product_id, sales_channel_id, start_date, end_date):
        return cls.query.filter(
            cls.product_id == product_id,
            cls.sales_channel_id == sales_channel_id,
            cls.forecast_date >= start_date,
            cls.forecast_date <= end_date,
            cls.status == 'active'
        ).order_by(cls.forecast_date).all()
    
    def approve_forecast(self, approved_by_user_id):
        self.is_approved = True
        self.approved_by = approved_by_user_id
        self.approved_at = datetime.now(timezone.utc)
        db.session.commit()
    
    def update_actual_values(self, actual_demand, actual_revenue=None):
        self.actual_demand = actual_demand
        self.actual_revenue = actual_revenue
        
        # Calculate forecast error and accuracy
        if actual_demand is not None and self.predicted_demand is not None:
            self.forecast_error = actual_demand - self.predicted_demand
            if actual_demand > 0:
                self.forecast_accuracy = 1 - abs(self.forecast_error) / actual_demand
        
        db.session.commit()
    
    def supersede(self, superseded_by_forecast_id):
        self.status = 'superseded'
        self.notes = f"Superseded by forecast {superseded_by_forecast_id}"
        db.session.commit()