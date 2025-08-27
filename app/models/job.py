from app import db
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Job(db.Model):
    __tablename__ = 'jobs'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    customer_name = db.Column(db.String(200), nullable=False)
    product_type = db.Column(db.String(100))
    quantity = db.Column(db.Integer, nullable=False)
    priority = db.Column(db.Integer, default=5)
    status = db.Column(db.String(20), default='pending')
    
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    due_date = db.Column(db.DateTime(timezone=True), nullable=False)
    start_date = db.Column(db.DateTime(timezone=True))
    completion_date = db.Column(db.DateTime(timezone=True))
    
    estimated_hours = db.Column(db.Float)
    actual_hours = db.Column(db.Float)
    
    notes = db.Column(db.Text)
    
    schedule_id = db.Column(UUID(as_uuid=True), db.ForeignKey('schedules.id'))
    
    def __repr__(self):
        return f'<Job {self.job_number}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'job_number': self.job_number,
            'customer_name': self.customer_name,
            'product_type': self.product_type,
            'quantity': self.quantity,
            'priority': self.priority,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'estimated_hours': self.estimated_hours,
            'actual_hours': self.actual_hours,
            'notes': self.notes,
            'schedule_id': str(self.schedule_id) if self.schedule_id else None
        }