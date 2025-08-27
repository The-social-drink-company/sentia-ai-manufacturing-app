from app import db
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Resource(db.Model):
    __tablename__ = 'resources'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False)
    capacity = db.Column(db.Float, default=1.0)
    status = db.Column(db.String(20), default='available')
    
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_maintenance = db.Column(db.DateTime(timezone=True))
    next_maintenance = db.Column(db.DateTime(timezone=True))
    
    efficiency_rating = db.Column(db.Float, default=1.0)
    cost_per_hour = db.Column(db.Float)
    
    location = db.Column(db.String(100))
    description = db.Column(db.Text)
    
    def __repr__(self):
        return f'<Resource {self.name}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'type': self.type,
            'capacity': self.capacity,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_maintenance': self.last_maintenance.isoformat() if self.last_maintenance else None,
            'next_maintenance': self.next_maintenance.isoformat() if self.next_maintenance else None,
            'efficiency_rating': self.efficiency_rating,
            'cost_per_hour': self.cost_per_hour,
            'location': self.location,
            'description': self.description
        }