from app import db
from datetime import datetime

class Resource(db.Model):
    __tablename__ = 'resources'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    capacity = db.Column(db.Float, default=1.0)
    status = db.Column(db.String(20), default='available')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_maintenance = db.Column(db.DateTime)
    next_maintenance = db.Column(db.DateTime)
    
    efficiency_rating = db.Column(db.Float, default=1.0)
    cost_per_hour = db.Column(db.Float)
    
    location = db.Column(db.String(100))
    description = db.Column(db.Text)
    
    def __repr__(self):
        return f'<Resource {self.name}>'