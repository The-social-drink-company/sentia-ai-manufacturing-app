"""
Admin portal related database models
"""
from datetime import datetime
from enum import Enum as PyEnum
from app import db
from sqlalchemy import Enum, Text, Integer, Float, Boolean, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship


class AlertType(PyEnum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"


class AlertStatus(PyEnum):
    UNREAD = "unread"
    READ = "read"
    DISMISSED = "dismissed"


class SystemAlert(db.Model):
    """System alerts for admin dashboard"""
    __tablename__ = 'system_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(Text, nullable=False)
    alert_type = db.Column(Enum(AlertType), nullable=False)
    status = db.Column(Enum(AlertStatus), default=AlertStatus.UNREAD)
    source = db.Column(db.String(100))  # Source of alert (system, integration, user, etc.)
    severity = db.Column(db.Integer, default=1)  # 1=low, 2=medium, 3=high, 4=critical
    
    # Metadata
    created_at = db.Column(DateTime, default=datetime.utcnow)
    updated_at = db.Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    read_at = db.Column(DateTime)
    dismissed_at = db.Column(DateTime)
    
    # Relations
    created_by_id = db.Column(db.Integer, ForeignKey('user.id'))
    created_by = relationship("User", backref="created_alerts")
    
    def mark_read(self):
        """Mark alert as read"""
        self.status = AlertStatus.READ
        self.read_at = datetime.utcnow()
        db.session.commit()
    
    def dismiss(self):
        """Dismiss alert"""
        self.status = AlertStatus.DISMISSED
        self.dismissed_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'alert_type': self.alert_type.value,
            'status': self.status.value,
            'source': self.source,
            'severity': self.severity,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None
        }


class SystemMetric(db.Model):
    """System performance and health metrics"""
    __tablename__ = 'system_metrics'
    
    id = db.Column(db.Integer, primary_key=True)
    metric_name = db.Column(db.String(100), nullable=False)  # cpu_usage, memory_usage, disk_usage, etc.
    metric_value = db.Column(Float, nullable=False)
    unit = db.Column(db.String(20))  # %, MB, GB, count, etc.
    
    # Metadata
    recorded_at = db.Column(DateTime, default=datetime.utcnow, index=True)
    source = db.Column(db.String(50))  # system, database, application
    
    def to_dict(self):
        return {
            'id': self.id,
            'metric_name': self.metric_name,
            'metric_value': self.metric_value,
            'unit': self.unit,
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None,
            'source': self.source
        }


class SecurityEvent(db.Model):
    """Security events and audit trail"""
    __tablename__ = 'security_events'
    
    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False)  # login_failed, permission_denied, etc.
    description = db.Column(Text)
    ip_address = db.Column(db.String(45))  # IPv4/IPv6 address
    user_agent = db.Column(Text)
    
    # Risk assessment
    risk_level = db.Column(db.Integer, default=1)  # 1=low, 2=medium, 3=high, 4=critical
    blocked = db.Column(Boolean, default=False)
    
    # Metadata
    occurred_at = db.Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relations
    user_id = db.Column(db.Integer, ForeignKey('user.id'), nullable=True)
    user = relationship("User", backref="security_events")
    
    def to_dict(self):
        return {
            'id': self.id,
            'event_type': self.event_type,
            'description': self.description,
            'ip_address': self.ip_address,
            'risk_level': self.risk_level,
            'blocked': self.blocked,
            'occurred_at': self.occurred_at.isoformat() if self.occurred_at else None,
            'user_id': self.user_id
        }


class MaintenanceWindow(db.Model):
    """Scheduled maintenance windows"""
    __tablename__ = 'maintenance_windows'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(Text)
    
    # Schedule
    scheduled_start = db.Column(DateTime, nullable=False)
    scheduled_end = db.Column(DateTime, nullable=False)
    actual_start = db.Column(DateTime)
    actual_end = db.Column(DateTime)
    
    # Status
    status = db.Column(db.String(20), default='scheduled')  # scheduled, in_progress, completed, cancelled
    maintenance_mode_enabled = db.Column(Boolean, default=False)
    
    # Metadata
    created_at = db.Column(DateTime, default=datetime.utcnow)
    created_by_id = db.Column(db.Integer, ForeignKey('user.id'))
    created_by = relationship("User", backref="maintenance_windows")
    
    def activate(self):
        """Start maintenance window"""
        self.status = 'in_progress'
        self.actual_start = datetime.utcnow()
        self.maintenance_mode_enabled = True
        db.session.commit()
    
    def complete(self):
        """Complete maintenance window"""
        self.status = 'completed'
        self.actual_end = datetime.utcnow()
        self.maintenance_mode_enabled = False
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'scheduled_start': self.scheduled_start.isoformat() if self.scheduled_start else None,
            'scheduled_end': self.scheduled_end.isoformat() if self.scheduled_end else None,
            'status': self.status,
            'maintenance_mode_enabled': self.maintenance_mode_enabled,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class BackupRecord(db.Model):
    """Database backup records"""
    __tablename__ = 'backup_records'
    
    id = db.Column(db.Integer, primary_key=True)
    backup_type = db.Column(db.String(20), nullable=False)  # full, incremental, differential
    file_path = db.Column(db.String(500))
    file_size_mb = db.Column(Float)
    
    # Status
    status = db.Column(db.String(20), default='in_progress')  # in_progress, completed, failed
    error_message = db.Column(Text)
    
    # Timing
    started_at = db.Column(DateTime, default=datetime.utcnow)
    completed_at = db.Column(DateTime)
    duration_seconds = db.Column(Integer)
    
    # Metadata
    created_by_id = db.Column(db.Integer, ForeignKey('user.id'))
    created_by = relationship("User", backref="backup_records")
    
    def complete_backup(self, file_path=None, file_size_mb=None):
        """Mark backup as completed"""
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
        if self.started_at:
            delta = self.completed_at - self.started_at
            self.duration_seconds = int(delta.total_seconds())
        if file_path:
            self.file_path = file_path
        if file_size_mb:
            self.file_size_mb = file_size_mb
        db.session.commit()
    
    def fail_backup(self, error_message):
        """Mark backup as failed"""
        self.status = 'failed'
        self.completed_at = datetime.utcnow()
        self.error_message = error_message
        if self.started_at:
            delta = self.completed_at - self.started_at
            self.duration_seconds = int(delta.total_seconds())
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'backup_type': self.backup_type,
            'file_path': self.file_path,
            'file_size_mb': self.file_size_mb,
            'status': self.status,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'duration_seconds': self.duration_seconds,
            'error_message': self.error_message
        }