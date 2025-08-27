from datetime import datetime, timezone
from enum import Enum
from app import db
from sqlalchemy.dialects.postgresql import UUID, JSON
import uuid

class ImportStatus(Enum):
    PENDING = 'pending'
    PROCESSING = 'processing'
    VALIDATING = 'validating'
    COMPLETED = 'completed'
    FAILED = 'failed'
    CANCELLED = 'cancelled'

class ImportType(Enum):
    PRODUCTS = 'products'
    HISTORICAL_SALES = 'historical_sales'
    INVENTORY_LEVELS = 'inventory_levels'
    MANUFACTURING_DATA = 'manufacturing_data'
    FINANCIAL_DATA = 'financial_data'
    FORECASTS = 'forecasts'

class FileType(Enum):
    CSV = 'csv'
    XLSX = 'xlsx'
    JSON = 'json'
    XML = 'xml'
    API = 'api'

class DataImport(db.Model):
    __tablename__ = 'data_imports'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Import identification
    import_name = db.Column(db.String(200), nullable=False)
    import_type = db.Column(db.Enum(ImportType), nullable=False, index=True)
    import_description = db.Column(db.Text)
    
    # File information
    original_filename = db.Column(db.String(255))
    file_type = db.Column(db.Enum(FileType), nullable=False)
    file_path = db.Column(db.String(500))
    file_size_bytes = db.Column(db.BigInteger)
    file_hash = db.Column(db.String(64))  # SHA-256 hash
    
    # Processing status
    status = db.Column(db.Enum(ImportStatus), default=ImportStatus.PENDING, nullable=False, index=True)
    progress_percentage = db.Column(db.Integer, default=0)
    current_step = db.Column(db.String(100))
    
    # Processing metrics
    total_rows = db.Column(db.Integer)
    processed_rows = db.Column(db.Integer, default=0)
    successful_rows = db.Column(db.Integer, default=0)
    failed_rows = db.Column(db.Integer, default=0)
    duplicate_rows = db.Column(db.Integer, default=0)
    
    # Data quality metrics
    data_quality_score = db.Column(db.Numeric(3, 2))  # 0-1 scale
    completeness_score = db.Column(db.Numeric(3, 2))
    accuracy_score = db.Column(db.Numeric(3, 2))
    
    # Configuration and settings
    import_settings = db.Column(JSON)  # Store import-specific configuration
    validation_rules = db.Column(JSON)  # Store validation rule overrides
    field_mappings = db.Column(JSON)  # Store field mapping configuration
    
    # Processing times
    started_at = db.Column(db.DateTime(timezone=True))
    completed_at = db.Column(db.DateTime(timezone=True))
    processing_duration_seconds = db.Column(db.Integer)
    
    # Error handling
    error_message = db.Column(db.Text)
    error_details = db.Column(JSON)
    rollback_completed = db.Column(db.Boolean, default=False)
    
    # User and audit information
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    import_errors = db.relationship('ImportError', backref='data_import', lazy='dynamic', cascade='all, delete-orphan')
    import_logs = db.relationship('ImportLog', backref='data_import', lazy='dynamic', cascade='all, delete-orphan')
    
    # Indexes
    __table_args__ = (
        db.Index('ix_data_imports_status_type', 'status', 'import_type'),
        db.Index('ix_data_imports_created_user', 'created_at', 'created_by'),
        db.Index('ix_data_imports_processing', 'status', 'started_at'),
    )
    
    def __repr__(self):
        return f'<DataImport {self.import_name}: {self.status.value}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'import_name': self.import_name,
            'import_type': self.import_type.value,
            'import_description': self.import_description,
            'original_filename': self.original_filename,
            'file_type': self.file_type.value if self.file_type else None,
            'file_size_bytes': self.file_size_bytes,
            'status': self.status.value,
            'progress_percentage': self.progress_percentage,
            'current_step': self.current_step,
            'total_rows': self.total_rows,
            'processed_rows': self.processed_rows,
            'successful_rows': self.successful_rows,
            'failed_rows': self.failed_rows,
            'duplicate_rows': self.duplicate_rows,
            'data_quality_score': float(self.data_quality_score) if self.data_quality_score else None,
            'completeness_score': float(self.completeness_score) if self.completeness_score else None,
            'accuracy_score': float(self.accuracy_score) if self.accuracy_score else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'processing_duration_seconds': self.processing_duration_seconds,
            'error_message': self.error_message,
            'rollback_completed': self.rollback_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update_progress(self, percentage, current_step=None, processed_rows=None):
        """Update import progress"""
        self.progress_percentage = percentage
        if current_step:
            self.current_step = current_step
        if processed_rows is not None:
            self.processed_rows = processed_rows
        self.updated_at = datetime.now(timezone.utc)
        db.session.commit()
    
    def mark_completed(self, successful_rows, failed_rows, duplicate_rows=0):
        """Mark import as completed"""
        self.status = ImportStatus.COMPLETED
        self.completed_at = datetime.now(timezone.utc)
        self.successful_rows = successful_rows
        self.failed_rows = failed_rows
        self.duplicate_rows = duplicate_rows
        self.progress_percentage = 100
        
        if self.started_at:
            duration = self.completed_at - self.started_at
            self.processing_duration_seconds = int(duration.total_seconds())
        
        db.session.commit()
    
    def mark_failed(self, error_message, error_details=None):
        """Mark import as failed"""
        self.status = ImportStatus.FAILED
        self.completed_at = datetime.now(timezone.utc)
        self.error_message = error_message
        self.error_details = error_details
        
        if self.started_at:
            duration = self.completed_at - self.started_at
            self.processing_duration_seconds = int(duration.total_seconds())
        
        db.session.commit()

class ImportError(db.Model):
    __tablename__ = 'import_errors'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    import_id = db.Column(UUID(as_uuid=True), db.ForeignKey('data_imports.id'), nullable=False)
    
    # Error details
    row_number = db.Column(db.Integer)
    column_name = db.Column(db.String(100))
    error_type = db.Column(db.String(50), nullable=False)  # validation, business_rule, format, etc.
    error_code = db.Column(db.String(20))
    error_message = db.Column(db.Text, nullable=False)
    error_severity = db.Column(db.String(20), default='error')  # info, warning, error, critical
    
    # Data context
    original_value = db.Column(db.Text)
    suggested_value = db.Column(db.Text)
    row_data = db.Column(JSON)  # Store the entire row for context
    
    # Resolution tracking
    is_resolved = db.Column(db.Boolean, default=False)
    resolution_method = db.Column(db.String(50))  # manual, automatic, skipped
    resolved_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    resolved_at = db.Column(db.DateTime(timezone=True))
    resolution_notes = db.Column(db.Text)
    
    # Metadata
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Indexes
    __table_args__ = (
        db.Index('ix_import_errors_import_severity', 'import_id', 'error_severity'),
        db.Index('ix_import_errors_type_resolved', 'error_type', 'is_resolved'),
        db.Index('ix_import_errors_row', 'import_id', 'row_number'),
    )
    
    def __repr__(self):
        return f'<ImportError {self.error_type}: Row {self.row_number}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'import_id': str(self.import_id),
            'row_number': self.row_number,
            'column_name': self.column_name,
            'error_type': self.error_type,
            'error_code': self.error_code,
            'error_message': self.error_message,
            'error_severity': self.error_severity,
            'original_value': self.original_value,
            'suggested_value': self.suggested_value,
            'is_resolved': self.is_resolved,
            'resolution_method': self.resolution_method,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolution_notes': self.resolution_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ImportLog(db.Model):
    __tablename__ = 'import_logs'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    import_id = db.Column(UUID(as_uuid=True), db.ForeignKey('data_imports.id'), nullable=False)
    
    # Log details
    log_level = db.Column(db.String(20), nullable=False)  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    log_message = db.Column(db.Text, nullable=False)
    log_context = db.Column(JSON)  # Additional context data
    
    # Processing context
    step_name = db.Column(db.String(100))
    row_number = db.Column(db.Integer)
    processing_time_ms = db.Column(db.Integer)
    
    # Metadata
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Indexes
    __table_args__ = (
        db.Index('ix_import_logs_import_level', 'import_id', 'log_level'),
        db.Index('ix_import_logs_created', 'created_at'),
    )
    
    def __repr__(self):
        return f'<ImportLog {self.log_level}: {self.log_message[:50]}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'import_id': str(self.import_id),
            'log_level': self.log_level,
            'log_message': self.log_message,
            'log_context': self.log_context,
            'step_name': self.step_name,
            'row_number': self.row_number,
            'processing_time_ms': self.processing_time_ms,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ImportTemplate(db.Model):
    __tablename__ = 'import_templates'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Template identification
    template_name = db.Column(db.String(100), nullable=False, unique=True)
    import_type = db.Column(db.Enum(ImportType), nullable=False)
    version = db.Column(db.String(20), default='1.0')
    description = db.Column(db.Text)
    
    # Template configuration
    file_format = db.Column(db.Enum(FileType), nullable=False)
    field_definitions = db.Column(JSON, nullable=False)  # Column definitions and validation rules
    sample_data = db.Column(JSON)  # Sample data for template generation
    validation_rules = db.Column(JSON)  # Template-specific validation rules
    
    # Template files
    template_file_path = db.Column(db.String(500))
    documentation_path = db.Column(db.String(500))
    
    # Usage tracking
    download_count = db.Column(db.Integer, default=0)
    usage_count = db.Column(db.Integer, default=0)  # Number of times template was used for import
    success_rate = db.Column(db.Numeric(5, 2))  # Percentage of successful imports using this template
    
    # Template metadata
    is_active = db.Column(db.Boolean, default=True)
    is_system_template = db.Column(db.Boolean, default=False)  # System vs user-created templates
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Indexes
    __table_args__ = (
        db.Index('ix_import_templates_type_active', 'import_type', 'is_active'),
        db.Index('ix_import_templates_usage', 'usage_count', 'success_rate'),
    )
    
    def __repr__(self):
        return f'<ImportTemplate {self.template_name}: {self.import_type.value}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'template_name': self.template_name,
            'import_type': self.import_type.value,
            'version': self.version,
            'description': self.description,
            'file_format': self.file_format.value,
            'field_definitions': self.field_definitions,
            'download_count': self.download_count,
            'usage_count': self.usage_count,
            'success_rate': float(self.success_rate) if self.success_rate else None,
            'is_active': self.is_active,
            'is_system_template': self.is_system_template,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def increment_download(self):
        """Increment download counter"""
        self.download_count += 1
        db.session.commit()
    
    def record_usage(self, was_successful):
        """Record template usage and update success rate"""
        self.usage_count += 1
        if self.usage_count == 1:
            self.success_rate = 100.0 if was_successful else 0.0
        else:
            current_successes = (self.success_rate * (self.usage_count - 1)) / 100
            if was_successful:
                current_successes += 1
            self.success_rate = (current_successes / self.usage_count) * 100
        
        db.session.commit()

# Add relationship to User model if not already present
# This would typically go in the User model file, but including here for completeness
# from app.models.user import User
# User.data_imports = db.relationship('DataImport', backref='creator', lazy='dynamic')
# User.import_errors_resolved = db.relationship('ImportError', foreign_keys=[ImportError.resolved_by], backref='resolver', lazy='dynamic')
# User.import_templates = db.relationship('ImportTemplate', backref='creator', lazy='dynamic')