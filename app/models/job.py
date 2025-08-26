from app import db
from datetime import datetime

class Job(db.Model):
    __tablename__ = 'jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    job_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_name = db.Column(db.String(200), nullable=False)
    product_type = db.Column(db.String(100))
    quantity = db.Column(db.Integer, nullable=False)
    priority = db.Column(db.Integer, default=5)
    status = db.Column(db.String(20), default='pending')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime, nullable=False)
    start_date = db.Column(db.DateTime)
    completion_date = db.Column(db.DateTime)
    
    estimated_hours = db.Column(db.Float)
    actual_hours = db.Column(db.Float)
    
    notes = db.Column(db.Text)
    
    schedule_id = db.Column(db.Integer, db.ForeignKey('schedules.id'))
    
    def __repr__(self):
        return f'<Job {self.job_number}>'