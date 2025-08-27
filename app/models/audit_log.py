from app import db
from datetime import datetime, timezone, timedelta
from sqlalchemy.dialects.postgresql import UUID
import uuid

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    
    # Activity information
    activity_type = db.Column(db.String(50), nullable=False, index=True)
    endpoint = db.Column(db.String(200))
    method = db.Column(db.String(10))
    
    # Request information
    ip_address = db.Column(db.String(45))  # Support IPv6
    user_agent = db.Column(db.Text)
    
    # Additional details
    details = db.Column(db.JSON)
    success = db.Column(db.Boolean, default=True)
    error_message = db.Column(db.Text)
    
    # Timestamp
    timestamp = db.Column(db.DateTime(timezone=True), 
                         default=lambda: datetime.now(timezone.utc), 
                         nullable=False, index=True)
    
    # Indexes for efficient querying
    __table_args__ = (
        db.Index('ix_audit_user_activity', 'user_id', 'activity_type'),
        db.Index('ix_audit_timestamp_type', 'timestamp', 'activity_type'),
        db.Index('ix_audit_ip_timestamp', 'ip_address', 'timestamp'),
    )
    
    # Relationship
    user = db.relationship('User', backref='audit_logs', lazy='select')
    
    def __repr__(self):
        return f'<AuditLog {self.activity_type} by {self.user_id} at {self.timestamp}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id) if self.user_id else None,
            'username': self.user.username if self.user else None,
            'activity_type': self.activity_type,
            'endpoint': self.endpoint,
            'method': self.method,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'details': self.details,
            'success': self.success,
            'error_message': self.error_message,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
    
    @classmethod
    def log_activity(cls, user_id=None, activity_type=None, endpoint=None, 
                    method=None, ip_address=None, user_agent=None, 
                    details=None, success=True, error_message=None):
        """Create a new audit log entry"""
        log_entry = cls(
            user_id=user_id,
            activity_type=activity_type,
            endpoint=endpoint,
            method=method,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
            success=success,
            error_message=error_message
        )
        
        db.session.add(log_entry)
        try:
            db.session.commit()
            return log_entry
        except Exception as e:
            db.session.rollback()
            return None
    
    @classmethod
    def get_user_activity(cls, user_id, limit=50, activity_type=None):
        """Get recent activity for a user"""
        query = cls.query.filter_by(user_id=user_id)
        
        if activity_type:
            query = query.filter_by(activity_type=activity_type)
        
        return query.order_by(cls.timestamp.desc()).limit(limit).all()
    
    @classmethod
    def get_suspicious_activity(cls, hours=24, limit=100):
        """Get potentially suspicious activities"""
        from_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        return cls.query.filter(
            cls.timestamp >= from_time,
            cls.activity_type.in_(['login_failed', 'access_denied', 'suspicious_request'])
        ).order_by(cls.timestamp.desc()).limit(limit).all()
    
    @classmethod
    def cleanup_old_logs(cls, days_to_keep=90):
        """Clean up old audit logs"""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_to_keep)
        
        deleted = cls.query.filter(cls.timestamp < cutoff_date).delete()
        db.session.commit()
        
        return deleted