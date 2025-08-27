from datetime import datetime, timezone
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class SystemSettings(db.Model):
    __tablename__ = 'system_settings'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Setting identification
    category = db.Column(db.String(50), nullable=False, index=True)  # forecast, inventory, integration, etc.
    key = db.Column(db.String(100), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Value storage (supporting different data types)
    value_text = db.Column(db.Text)
    value_integer = db.Column(db.BigInteger)
    value_decimal = db.Column(db.Numeric(20, 8))
    value_boolean = db.Column(db.Boolean)
    value_json = db.Column(db.JSON)
    value_date = db.Column(db.Date)
    value_datetime = db.Column(db.DateTime(timezone=True))
    
    # Data type and validation
    data_type = db.Column(db.String(20), nullable=False)  # text, integer, decimal, boolean, json, date, datetime
    is_encrypted = db.Column(db.Boolean, default=False, nullable=False)
    validation_rules = db.Column(db.JSON)  # Min/max values, regex patterns, etc.
    default_value = db.Column(db.Text)
    
    # Setting metadata
    is_system_setting = db.Column(db.Boolean, default=False, nullable=False)  # System vs user-configurable
    is_sensitive = db.Column(db.Boolean, default=False, nullable=False)  # API keys, passwords, etc.
    requires_restart = db.Column(db.Boolean, default=False, nullable=False)
    
    # Scoping and environment
    environment = db.Column(db.String(20))  # development, test, production, or null for all
    scope = db.Column(db.String(50), default='global')  # global, user, tenant, product, etc.
    scope_id = db.Column(db.String(100))  # ID of the scoped entity
    
    # Version control
    version = db.Column(db.Integer, default=1, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    effective_from = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    effective_to = db.Column(db.DateTime(timezone=True))
    
    # Change tracking
    previous_value = db.Column(db.Text)
    change_reason = db.Column(db.String(200))
    
    # Status and metadata
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    updated_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Indexes for performance
    __table_args__ = (
        db.Index('ix_system_settings_category_key', 'category', 'key'),
        db.Index('ix_system_settings_scope', 'scope', 'scope_id'),
        db.Index('ix_system_settings_environment', 'environment'),
        db.Index('ix_system_settings_active_effective', 'is_active', 'effective_from', 'effective_to'),
        # Unique constraint for active settings
        db.UniqueConstraint('category', 'key', 'scope', 'scope_id', 'environment', 'version',
                          name='uq_system_settings_active'),
    )
    
    def __repr__(self):
        return f'<SystemSettings {self.category}.{self.key}: {self.get_value()}>'
    
    def get_value(self):
        """Get the actual value based on data type"""
        if self.data_type == 'text':
            return self.value_text
        elif self.data_type == 'integer':
            return self.value_integer
        elif self.data_type == 'decimal':
            return float(self.value_decimal) if self.value_decimal is not None else None
        elif self.data_type == 'boolean':
            return self.value_boolean
        elif self.data_type == 'json':
            return self.value_json
        elif self.data_type == 'date':
            return self.value_date
        elif self.data_type == 'datetime':
            return self.value_datetime
        else:
            return self.value_text
    
    def set_value(self, value):
        """Set the value based on data type"""
        # Clear all value fields first
        self.value_text = None
        self.value_integer = None
        self.value_decimal = None
        self.value_boolean = None
        self.value_json = None
        self.value_date = None
        self.value_datetime = None
        
        if self.data_type == 'text':
            self.value_text = str(value) if value is not None else None
        elif self.data_type == 'integer':
            self.value_integer = int(value) if value is not None else None
        elif self.data_type == 'decimal':
            self.value_decimal = float(value) if value is not None else None
        elif self.data_type == 'boolean':
            self.value_boolean = bool(value) if value is not None else None
        elif self.data_type == 'json':
            self.value_json = value
        elif self.data_type == 'date':
            self.value_date = value
        elif self.data_type == 'datetime':
            self.value_datetime = value
        else:
            self.value_text = str(value) if value is not None else None
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'category': self.category,
            'key': self.key,
            'name': self.name,
            'description': self.description,
            'value': self.get_value(),
            'data_type': self.data_type,
            'is_encrypted': self.is_encrypted,
            'validation_rules': self.validation_rules,
            'default_value': self.default_value,
            'is_system_setting': self.is_system_setting,
            'is_sensitive': self.is_sensitive,
            'requires_restart': self.requires_restart,
            'environment': self.environment,
            'scope': self.scope,
            'scope_id': self.scope_id,
            'version': self.version,
            'is_active': self.is_active,
            'effective_from': self.effective_from.isoformat() if self.effective_from else None,
            'effective_to': self.effective_to.isoformat() if self.effective_to else None,
            'change_reason': self.change_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_setting(cls, category, key, scope='global', scope_id=None, environment=None):
        """Get a setting value by category and key"""
        query = cls.query.filter_by(
            category=category,
            key=key,
            scope=scope,
            is_active=True
        ).filter(
            cls.effective_from <= datetime.now(timezone.utc)
        ).filter(
            db.or_(
                cls.effective_to.is_(None),
                cls.effective_to > datetime.now(timezone.utc)
            )
        )
        
        if scope_id:
            query = query.filter_by(scope_id=scope_id)
        if environment:
            query = query.filter(db.or_(cls.environment == environment, cls.environment.is_(None)))
        
        return query.order_by(cls.version.desc()).first()
    
    @classmethod
    def get_settings_by_category(cls, category, scope='global', scope_id=None, environment=None):
        """Get all settings in a category"""
        query = cls.query.filter_by(
            category=category,
            scope=scope,
            is_active=True
        ).filter(
            cls.effective_from <= datetime.now(timezone.utc)
        ).filter(
            db.or_(
                cls.effective_to.is_(None),
                cls.effective_to > datetime.now(timezone.utc)
            )
        )
        
        if scope_id:
            query = query.filter_by(scope_id=scope_id)
        if environment:
            query = query.filter(db.or_(cls.environment == environment, cls.environment.is_(None)))
        
        return query.all()
    
    @classmethod
    def set_setting(cls, category, key, value, data_type, name=None, description=None, 
                   scope='global', scope_id=None, environment=None, change_reason=None, 
                   created_by=None):
        """Create or update a setting"""
        # Check if setting already exists
        existing = cls.get_setting(category, key, scope, scope_id, environment)
        
        if existing:
            # Store previous value
            previous_value = str(existing.get_value()) if existing.get_value() is not None else None
            
            # Create new version
            new_setting = cls(
                category=category,
                key=key,
                name=name or existing.name,
                description=description or existing.description,
                data_type=data_type,
                scope=scope,
                scope_id=scope_id,
                environment=environment,
                version=existing.version + 1,
                previous_value=previous_value,
                change_reason=change_reason,
                created_by=created_by,
                updated_by=created_by
            )
            new_setting.set_value(value)
            
            # Deactivate old version
            existing.is_active = False
            existing.effective_to = datetime.now(timezone.utc)
            
        else:
            # Create new setting
            new_setting = cls(
                category=category,
                key=key,
                name=name,
                description=description,
                data_type=data_type,
                scope=scope,
                scope_id=scope_id,
                environment=environment,
                change_reason=change_reason,
                created_by=created_by,
                updated_by=created_by
            )
            new_setting.set_value(value)
        
        db.session.add(new_setting)
        db.session.commit()
        
        return new_setting