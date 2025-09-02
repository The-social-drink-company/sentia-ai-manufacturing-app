"""
Clerk User model for storing local user data synchronized with Clerk.
This model acts as a bridge between Clerk authentication and local app data.
"""

from app import db
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
import uuid


class ClerkUser(db.Model):
    """
    Local user model synchronized with Clerk authentication.
    Stores application-specific user data while using Clerk for authentication.
    """
    __tablename__ = 'clerk_users'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Clerk identifiers
    clerk_user_id = db.Column(db.String(255), unique=True, nullable=False, index=True)
    clerk_session_id = db.Column(db.String(255), nullable=True)
    
    # Basic user information (synced from Clerk)
    email = db.Column(db.String(320), nullable=False, index=True)  # RFC 5321 max length
    username = db.Column(db.String(64), nullable=True, index=True)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    
    # Application-specific user data
    role = db.Column(db.String(20), default='viewer', nullable=False)  # admin, manager, operator, viewer
    permissions = db.Column(db.JSON, nullable=True)  # Specific permissions override
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Department/Area assignments for role-based access
    department = db.Column(db.String(50), nullable=True)  # manufacturing, planning, sales, finance, quality
    access_regions = db.Column(db.JSON, nullable=True)  # ['UK', 'EU', 'USA'] for regional access control
    
    # User preferences
    timezone = db.Column(db.String(50), default='UTC')
    language = db.Column(db.String(10), default='en')
    preferences = db.Column(db.JSON, nullable=True)
    
    # Activity tracking
    last_login = db.Column(db.DateTime(timezone=True), nullable=True)
    last_login_ip = db.Column(db.String(45), nullable=True)  # Support IPv6
    login_count = db.Column(db.Integer, default=0)
    
    # Metadata
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Clerk sync metadata
    clerk_synced_at = db.Column(db.DateTime(timezone=True), nullable=True)
    clerk_data = db.Column(db.JSON, nullable=True)  # Store full Clerk user object for reference
    
    # Indexes
    __table_args__ = (
        db.Index('ix_clerk_user_role_active', 'role', 'is_active'),
        db.Index('ix_clerk_user_last_login', 'last_login'),
        db.Index('ix_clerk_user_email', 'email'),
    )
    
    def __repr__(self):
        return f'<ClerkUser {self.email}>'
    
    @classmethod
    def get_or_create_from_clerk(cls, clerk_user_data, session_id=None):
        """
        Get or create a local user record from Clerk user data.
        
        Args:
            clerk_user_data: User data from Clerk API
            session_id: Optional Clerk session ID
            
        Returns:
            ClerkUser instance
        """
        clerk_user_id = clerk_user_data.get('id')
        if not clerk_user_id:
            raise ValueError("Clerk user data must include 'id' field")
        
        # Try to find existing user
        user = cls.query.filter_by(clerk_user_id=clerk_user_id).first()
        
        if user:
            # Update existing user with latest Clerk data
            user.update_from_clerk_data(clerk_user_data, session_id)
        else:
            # Create new user
            user = cls.create_from_clerk_data(clerk_user_data, session_id)
        
        db.session.commit()
        return user
    
    @classmethod
    def create_from_clerk_data(cls, clerk_user_data, session_id=None):
        """Create new user from Clerk data."""
        # Extract email from Clerk data
        email_addresses = clerk_user_data.get('email_addresses', [])
        primary_email = None
        
        for email_obj in email_addresses:
            if isinstance(email_obj, dict):
                if email_obj.get('id') == clerk_user_data.get('primary_email_address_id'):
                    primary_email = email_obj.get('email_address')
                    break
        
        if not primary_email and email_addresses:
            # Fallback to first email if no primary found
            first_email = email_addresses[0]
            if isinstance(first_email, dict):
                primary_email = first_email.get('email_address')
            else:
                primary_email = str(first_email)
        
        if not primary_email:
            raise ValueError("No email address found in Clerk user data")
        
        user = cls(
            clerk_user_id=clerk_user_data['id'],
            clerk_session_id=session_id,
            email=primary_email,
            username=clerk_user_data.get('username'),
            first_name=clerk_user_data.get('first_name'),
            last_name=clerk_user_data.get('last_name'),
            clerk_data=clerk_user_data,
            clerk_synced_at=datetime.now(timezone.utc)
        )
        
        db.session.add(user)
        return user
    
    def update_from_clerk_data(self, clerk_user_data, session_id=None):
        """Update user record with latest Clerk data."""
        # Update basic info
        if 'username' in clerk_user_data:
            self.username = clerk_user_data['username']
        if 'first_name' in clerk_user_data:
            self.first_name = clerk_user_data['first_name']
        if 'last_name' in clerk_user_data:
            self.last_name = clerk_user_data['last_name']
        
        # Update email if changed
        email_addresses = clerk_user_data.get('email_addresses', [])
        for email_obj in email_addresses:
            if isinstance(email_obj, dict):
                if email_obj.get('id') == clerk_user_data.get('primary_email_address_id'):
                    self.email = email_obj.get('email_address')
                    break
        
        # Update session and sync metadata
        self.clerk_session_id = session_id
        self.clerk_data = clerk_user_data
        self.clerk_synced_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
    
    def update_login_info(self, ip_address=None):
        """Update login tracking information."""
        self.last_login = datetime.now(timezone.utc)
        self.last_login_ip = ip_address
        self.login_count = (self.login_count or 0) + 1
        db.session.commit()
    
    def has_permission(self, permission, region=None):
        """Check if user has specific permission."""
        if not self.is_active:
            return False
        
        # Check region access if specified
        if region and self.access_regions:
            if region not in self.access_regions:
                return False
        
        # Check specific permissions override
        if self.permissions and permission in self.permissions:
            return self.permissions[permission]
        
        # Role-based permissions for Sentia Manufacturing
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
        """Check if user has access to specific department."""
        if self.role == 'admin':
            return True
        return self.department == department or not self.department
    
    def can_access_region(self, region):
        """Check if user can access specific region."""
        if self.role == 'admin':
            return True
        if not self.access_regions:
            return True
        return region in self.access_regions
    
    def get_allowed_regions(self):
        """Get list of regions user can access."""
        if self.role == 'admin' or not self.access_regions:
            return ['UK', 'EU', 'USA']
        return self.access_regions or []
    
    @property
    def display_name(self):
        """Get user's display name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.username:
            return self.username
        else:
            return self.email.split('@')[0]
    
    @property
    def is_admin(self):
        """Check if user has admin role."""
        return self.role == 'admin'
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary representation."""
        data = {
            'id': str(self.id),
            'clerk_user_id': self.clerk_user_id,
            'email': self.email if include_sensitive else None,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'display_name': self.display_name,
            'role': self.role,
            'permissions': self.permissions,
            'is_active': self.is_active,
            'is_admin': self.is_admin,
            'department': self.department,
            'access_regions': self.access_regions,
            'timezone': self.timezone,
            'language': self.language,
            'preferences': self.preferences,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'login_count': self.login_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        return data