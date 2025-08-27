from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from datetime import datetime, timezone, timedelta
from sqlalchemy.dialects.postgresql import UUID
import uuid
import secrets
import re

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256))
    
    # Profile information
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    display_name = db.Column(db.String(100))
    
    # Role and permissions - Enhanced for Sentia Manufacturing
    role = db.Column(db.String(20), default='viewer', nullable=False)  # admin, manager, operator, viewer
    permissions = db.Column(db.JSON)  # Specific permissions override
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    
    # Department/Area assignments for role-based access
    department = db.Column(db.String(50))  # manufacturing, planning, sales, finance, quality
    access_regions = db.Column(db.JSON)  # ['UK', 'EU', 'USA'] for regional access control
    
    # Authentication and security - Enhanced
    last_login = db.Column(db.DateTime(timezone=True))
    last_login_ip = db.Column(db.String(45))  # Support IPv6
    login_count = db.Column(db.Integer, default=0)
    password_reset_token = db.Column(db.String(255))
    password_reset_expires = db.Column(db.DateTime(timezone=True))
    failed_login_attempts = db.Column(db.Integer, default=0)
    account_locked_until = db.Column(db.DateTime(timezone=True))
    
    # Two-factor authentication
    two_factor_enabled = db.Column(db.Boolean, default=False, nullable=False)
    two_factor_secret = db.Column(db.String(32))
    backup_codes = db.Column(db.JSON)  # List of one-time backup codes
    
    # Session management
    session_token = db.Column(db.String(255))
    session_expires = db.Column(db.DateTime(timezone=True))
    force_password_change = db.Column(db.Boolean, default=False, nullable=False)
    password_changed_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Preferences
    timezone = db.Column(db.String(50), default='UTC')
    language = db.Column(db.String(10), default='en')
    preferences = db.Column(db.JSON)
    
    # Status and metadata
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Indexes
    __table_args__ = (
        db.Index('ix_user_role_active', 'role', 'is_active'),
        db.Index('ix_user_last_login', 'last_login'),
    )
    
    def set_password(self, password):
        if not self.validate_password_strength(password):
            raise ValueError("Password does not meet security requirements")
        self.password_hash = generate_password_hash(password)
        self.password_changed_at = datetime.now(timezone.utc)
        self.force_password_change = False
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    @staticmethod
    def validate_password_strength(password):
        if len(password) < 8:
            return False
        if not re.search(r'[A-Z]', password):
            return False
        if not re.search(r'[a-z]', password):
            return False
        if not re.search(r'\d', password):
            return False
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False
        return True
    
    def generate_password_reset_token(self):
        self.password_reset_token = secrets.token_urlsafe(32)
        self.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        return self.password_reset_token
    
    def verify_password_reset_token(self, token):
        if not self.password_reset_token or not self.password_reset_expires:
            return False
        if datetime.now(timezone.utc) > self.password_reset_expires:
            return False
        return secrets.compare_digest(self.password_reset_token, token)
    
    def clear_password_reset_token(self):
        self.password_reset_token = None
        self.password_reset_expires = None
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': str(self.id),
            'username': self.username,
            'email': self.email if include_sensitive else None,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'display_name': self.display_name or f"{self.first_name or ''} {self.last_name or ''}".strip() or self.username,
            'role': self.role,
            'permissions': self.permissions,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'login_count': self.login_count,
            'timezone': self.timezone,
            'language': self.language,
            'preferences': self.preferences,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        return data
    
    def get_id(self):
        return str(self.id)
    
    @classmethod
    def get_by_username(cls, username):
        return cls.query.filter_by(username=username, is_active=True).first()
    
    @classmethod
    def get_by_email(cls, email):
        return cls.query.filter_by(email=email, is_active=True).first()
    
    def has_permission(self, permission, region=None):
        if not self.is_active:
            return False
            
        if self.is_admin:
            return True
        
        # Check region access if specified
        if region and self.access_regions:
            if region not in self.access_regions:
                return False
        
        # Check specific permissions override
        if self.permissions and permission in self.permissions:
            return self.permissions[permission]
        
        # Enhanced role-based permissions for Sentia Manufacturing
        role_permissions = {
            'admin': {
                'user_management', 'system_settings', 'api_config', 'audit_access',
                'read', 'write', 'delete', 'forecast', 'inventory', 'manufacturing',
                'financial', 'reporting', 'quality', 'planning'
            },
            'manager': {
                'read', 'write', 'forecast', 'inventory', 'manufacturing', 
                'financial', 'reporting', 'planning', 'import_data'
            },
            'operator': {
                'read', 'write', 'manufacturing', 'quality', 'inventory_update'
            },
            'viewer': {
                'read'
            }
        }
        
        allowed_permissions = role_permissions.get(self.role, set())
        return permission in allowed_permissions
    
    def has_department_access(self, department):
        if self.is_admin:
            return True
        return self.department == department or not self.department
    
    def can_access_region(self, region):
        if self.is_admin:
            return True
        if not self.access_regions:
            return True
        return region in self.access_regions
    
    def get_allowed_regions(self):
        if self.is_admin or not self.access_regions:
            return ['UK', 'EU', 'USA']
        return self.access_regions or []
    
    def update_login_info(self, ip_address=None):
        self.last_login = datetime.now(timezone.utc)
        self.last_login_ip = ip_address
        self.login_count = (self.login_count or 0) + 1
        self.failed_login_attempts = 0
        self.account_locked_until = None
        db.session.commit()
    
    def increment_failed_login(self):
        self.failed_login_attempts = (self.failed_login_attempts or 0) + 1
        if self.failed_login_attempts >= 5:
            self.account_locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.session.commit()
    
    def is_account_locked(self):
        if not self.account_locked_until:
            return False
        return datetime.now(timezone.utc) < self.account_locked_until
    
    def unlock_account(self):
        self.account_locked_until = None
        self.failed_login_attempts = 0
        db.session.commit()
    
    def generate_session_token(self, expiry_hours=24):
        self.session_token = secrets.token_urlsafe(32)
        self.session_expires = datetime.now(timezone.utc) + timedelta(hours=expiry_hours)
        return self.session_token
    
    def is_session_valid(self):
        if not self.session_token or not self.session_expires:
            return False
        return datetime.now(timezone.utc) < self.session_expires
    
    def clear_session(self):
        self.session_token = None
        self.session_expires = None
        db.session.commit()
    
    def needs_password_change(self):
        if self.force_password_change:
            return True
        if not self.password_changed_at:
            return True
        # Force password change every 90 days
        password_age = datetime.now(timezone.utc) - self.password_changed_at
        return password_age.days >= 90
    
    def generate_backup_codes(self, count=8):
        codes = [secrets.token_hex(4).upper() for _ in range(count)]
        self.backup_codes = codes
        return codes
    
    def use_backup_code(self, code):
        if not self.backup_codes:
            return False
        if code.upper() in self.backup_codes:
            self.backup_codes.remove(code.upper())
            db.session.commit()
            return True
        return False