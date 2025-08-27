from datetime import datetime, timezone, date
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class WorkingCapital(db.Model):
    __tablename__ = 'working_capital'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Time dimension
    projection_date = db.Column(db.Date, nullable=False, index=True)
    projection_period = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly, quarterly
    
    # Product and market context
    product_id = db.Column(UUID(as_uuid=True), db.ForeignKey('products.id'))
    market_code = db.Column(db.String(10), db.ForeignKey('markets.code'))
    sales_channel_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sales_channels.id'))
    currency_code = db.Column(db.String(3), nullable=False)
    
    # Cash inflows (revenues)
    projected_sales_revenue = db.Column(db.Numeric(15, 2), default=0)
    actual_sales_revenue = db.Column(db.Numeric(15, 2))
    payment_terms_days = db.Column(db.Integer, default=0)  # Days until payment received
    collection_rate = db.Column(db.Numeric(5, 4), default=1.0)  # % of sales actually collected
    
    # Cash outflows (costs)
    cost_of_goods_sold = db.Column(db.Numeric(12, 2), default=0)
    inventory_investment = db.Column(db.Numeric(12, 2), default=0)
    manufacturing_costs = db.Column(db.Numeric(12, 2), default=0)
    raw_materials_cost = db.Column(db.Numeric(12, 2), default=0)
    labor_costs = db.Column(db.Numeric(12, 2), default=0)
    
    # Operating expenses
    marketing_spend = db.Column(db.Numeric(10, 2), default=0)
    platform_fees = db.Column(db.Numeric(10, 2), default=0)
    shipping_costs = db.Column(db.Numeric(10, 2), default=0)
    storage_fees = db.Column(db.Numeric(8, 2), default=0)
    administrative_costs = db.Column(db.Numeric(8, 2), default=0)
    
    # Tax obligations
    vat_gst_payable = db.Column(db.Numeric(10, 2), default=0)
    corporate_tax_payable = db.Column(db.Numeric(10, 2), default=0)
    customs_duties = db.Column(db.Numeric(8, 2), default=0)
    
    # Working capital components
    accounts_receivable = db.Column(db.Numeric(12, 2), default=0)
    inventory_value = db.Column(db.Numeric(12, 2), default=0)
    accounts_payable = db.Column(db.Numeric(12, 2), default=0)
    accrued_expenses = db.Column(db.Numeric(10, 2), default=0)
    
    # Cash flow projections
    net_cash_flow = db.Column(db.Numeric(15, 2))
    cumulative_cash_flow = db.Column(db.Numeric(15, 2))
    cash_conversion_cycle_days = db.Column(db.Integer)
    
    # Working capital metrics
    working_capital_requirement = db.Column(db.Numeric(15, 2))
    working_capital_turnover = db.Column(db.Numeric(6, 4))
    days_sales_outstanding = db.Column(db.Integer)
    days_inventory_outstanding = db.Column(db.Integer)
    days_payable_outstanding = db.Column(db.Integer)
    
    # Risk and scenario analysis
    scenario_type = db.Column(db.String(20), default='base')  # optimistic, base, pessimistic
    confidence_level = db.Column(db.Numeric(3, 2))  # 0-1 scale
    risk_factors = db.Column(db.JSON)
    sensitivity_analysis = db.Column(db.JSON)
    
    # Status and validation
    status = db.Column(db.String(20), default='projected', nullable=False)  # projected, actual, revised
    is_approved = db.Column(db.Boolean, default=False, nullable=False)
    approved_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime(timezone=True))
    
    # Notes and assumptions
    notes = db.Column(db.Text)
    assumptions = db.Column(db.JSON)
    data_sources = db.Column(db.JSON)
    
    # Status and metadata
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Indexes for performance
    __table_args__ = (
        db.Index('ix_working_capital_date', 'projection_date'),
        db.Index('ix_working_capital_product_date', 'product_id', 'projection_date'),
        db.Index('ix_working_capital_market_date', 'market_code', 'projection_date'),
        db.Index('ix_working_capital_scenario_status', 'scenario_type', 'status'),
        db.Index('ix_working_capital_currency', 'currency_code'),
        # Unique constraint for specific projections
        db.UniqueConstraint('product_id', 'market_code', 'sales_channel_id', 'projection_date', 
                          'projection_period', 'scenario_type', 
                          name='uq_working_capital_projection'),
    )
    
    def __repr__(self):
        return f'<WorkingCapital {self.projection_date}: {self.currency_code} {self.net_cash_flow}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'projection_date': self.projection_date.isoformat() if self.projection_date else None,
            'projection_period': self.projection_period,
            'product_id': str(self.product_id) if self.product_id else None,
            'market_code': self.market_code,
            'sales_channel_id': str(self.sales_channel_id) if self.sales_channel_id else None,
            'currency_code': self.currency_code,
            'projected_sales_revenue': float(self.projected_sales_revenue) if self.projected_sales_revenue else 0,
            'actual_sales_revenue': float(self.actual_sales_revenue) if self.actual_sales_revenue else None,
            'payment_terms_days': self.payment_terms_days,
            'collection_rate': float(self.collection_rate) if self.collection_rate else None,
            'cost_of_goods_sold': float(self.cost_of_goods_sold) if self.cost_of_goods_sold else 0,
            'inventory_investment': float(self.inventory_investment) if self.inventory_investment else 0,
            'manufacturing_costs': float(self.manufacturing_costs) if self.manufacturing_costs else 0,
            'raw_materials_cost': float(self.raw_materials_cost) if self.raw_materials_cost else 0,
            'labor_costs': float(self.labor_costs) if self.labor_costs else 0,
            'marketing_spend': float(self.marketing_spend) if self.marketing_spend else 0,
            'platform_fees': float(self.platform_fees) if self.platform_fees else 0,
            'shipping_costs': float(self.shipping_costs) if self.shipping_costs else 0,
            'storage_fees': float(self.storage_fees) if self.storage_fees else 0,
            'administrative_costs': float(self.administrative_costs) if self.administrative_costs else 0,
            'vat_gst_payable': float(self.vat_gst_payable) if self.vat_gst_payable else 0,
            'corporate_tax_payable': float(self.corporate_tax_payable) if self.corporate_tax_payable else 0,
            'customs_duties': float(self.customs_duties) if self.customs_duties else 0,
            'accounts_receivable': float(self.accounts_receivable) if self.accounts_receivable else 0,
            'inventory_value': float(self.inventory_value) if self.inventory_value else 0,
            'accounts_payable': float(self.accounts_payable) if self.accounts_payable else 0,
            'accrued_expenses': float(self.accrued_expenses) if self.accrued_expenses else 0,
            'net_cash_flow': float(self.net_cash_flow) if self.net_cash_flow else None,
            'cumulative_cash_flow': float(self.cumulative_cash_flow) if self.cumulative_cash_flow else None,
            'cash_conversion_cycle_days': self.cash_conversion_cycle_days,
            'working_capital_requirement': float(self.working_capital_requirement) if self.working_capital_requirement else None,
            'working_capital_turnover': float(self.working_capital_turnover) if self.working_capital_turnover else None,
            'days_sales_outstanding': self.days_sales_outstanding,
            'days_inventory_outstanding': self.days_inventory_outstanding,
            'days_payable_outstanding': self.days_payable_outstanding,
            'scenario_type': self.scenario_type,
            'confidence_level': float(self.confidence_level) if self.confidence_level else None,
            'risk_factors': self.risk_factors,
            'sensitivity_analysis': self.sensitivity_analysis,
            'status': self.status,
            'is_approved': self.is_approved,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'notes': self.notes,
            'assumptions': self.assumptions,
            'data_sources': self.data_sources,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def calculate_working_capital_metrics(self):
        # Calculate working capital requirement
        self.working_capital_requirement = (
            (self.accounts_receivable or 0) + 
            (self.inventory_value or 0) - 
            (self.accounts_payable or 0)
        )
        
        # Calculate net cash flow
        total_inflows = (self.projected_sales_revenue or 0) * (self.collection_rate or 1.0)
        total_outflows = (
            (self.cost_of_goods_sold or 0) +
            (self.inventory_investment or 0) +
            (self.manufacturing_costs or 0) +
            (self.raw_materials_cost or 0) +
            (self.labor_costs or 0) +
            (self.marketing_spend or 0) +
            (self.platform_fees or 0) +
            (self.shipping_costs or 0) +
            (self.storage_fees or 0) +
            (self.administrative_costs or 0) +
            (self.vat_gst_payable or 0) +
            (self.corporate_tax_payable or 0) +
            (self.customs_duties or 0)
        )
        
        self.net_cash_flow = total_inflows - total_outflows
        
        # Calculate cash conversion cycle
        if all([self.days_sales_outstanding, self.days_inventory_outstanding, self.days_payable_outstanding]):
            self.cash_conversion_cycle_days = (
                self.days_sales_outstanding + 
                self.days_inventory_outstanding - 
                self.days_payable_outstanding
            )
        
        # Calculate working capital turnover
        if self.working_capital_requirement and self.working_capital_requirement != 0:
            self.working_capital_turnover = (self.projected_sales_revenue or 0) / self.working_capital_requirement
    
    @classmethod
    def get_cash_flow_projection(cls, start_date, end_date, product_id=None, market_code=None):
        query = cls.query.filter(
            cls.projection_date >= start_date,
            cls.projection_date <= end_date,
            cls.status == 'projected'
        )
        
        if product_id:
            query = query.filter(cls.product_id == product_id)
        if market_code:
            query = query.filter(cls.market_code == market_code)
            
        return query.order_by(cls.projection_date).all()
    
    @classmethod
    def get_working_capital_summary(cls, date_filter, scenario_type='base'):
        return db.session.query(
            db.func.sum(cls.working_capital_requirement).label('total_wc_requirement'),
            db.func.sum(cls.net_cash_flow).label('total_net_cash_flow'),
            db.func.avg(cls.cash_conversion_cycle_days).label('avg_cash_cycle'),
            db.func.count().label('record_count')
        ).filter(
            cls.projection_date == date_filter,
            cls.scenario_type == scenario_type,
            cls.status == 'projected'
        ).first()