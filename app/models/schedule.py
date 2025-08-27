from app import db
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Schedule(db.Model):
    __tablename__ = 'schedules'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    version = db.Column(db.Integer, default=1)
    status = db.Column(db.String(20), default='draft')
    
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    start_date = db.Column(db.DateTime(timezone=True), nullable=False)
    end_date = db.Column(db.DateTime(timezone=True), nullable=False)
    
    optimization_score = db.Column(db.Float)
    total_jobs = db.Column(db.Integer, default=0)
    completed_jobs = db.Column(db.Integer, default=0)
    
    jobs = db.relationship('Job', backref='schedule', lazy='dynamic')
    
    def __repr__(self):
        return f'<Schedule {self.name} v{self.version}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'version': self.version,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': str(self.created_by) if self.created_by else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'optimization_score': self.optimization_score,
            'total_jobs': self.total_jobs,
            'completed_jobs': self.completed_jobs
        }