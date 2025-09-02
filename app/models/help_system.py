from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import JSON

class HelpArticle(db.Model):
    """Help articles and documentation content."""
    __tablename__ = 'help_articles'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    summary = db.Column(db.String(500))
    category = db.Column(db.String(100), nullable=False)
    subcategory = db.Column(db.String(100))
    tags = db.Column(JSON)
    status = db.Column(db.String(20), default='published')
    view_count = db.Column(db.Integer, default=0)
    helpful_votes = db.Column(db.Integer, default=0)
    unhelpful_votes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    creator = db.relationship('User', backref='help_articles')
    
    def __repr__(self):
        return f'<HelpArticle {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'content': self.content,
            'summary': self.summary,
            'category': self.category,
            'subcategory': self.subcategory,
            'tags': self.tags,
            'status': self.status,
            'view_count': self.view_count,
            'helpful_votes': self.helpful_votes,
            'unhelpful_votes': self.unhelpful_votes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @property
    def helpfulness_score(self):
        total_votes = self.helpful_votes + self.unhelpful_votes
        if total_votes == 0:
            return 0
        return (self.helpful_votes / total_votes) * 100

class Tooltip(db.Model):
    """Interactive tooltips and contextual help."""
    __tablename__ = 'tooltips'
    
    id = db.Column(db.Integer, primary_key=True)
    element_id = db.Column(db.String(200), nullable=False)
    page_path = db.Column(db.String(200), nullable=False)
    title = db.Column(db.String(200))
    content = db.Column(db.Text, nullable=False)
    position = db.Column(db.String(20), default='top')
    trigger = db.Column(db.String(20), default='hover')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'element_id': self.element_id,
            'page_path': self.page_path,
            'title': self.title,
            'content': self.content,
            'position': self.position,
            'trigger': self.trigger,
            'is_active': self.is_active
        }

class UserTutorialProgress(db.Model):
    """Track user progress through interactive tutorials."""
    __tablename__ = 'user_tutorial_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tutorial_id = db.Column(db.String(100), nullable=False)
    completed_steps = db.Column(JSON, default=list)
    current_step = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='not_started')
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='tutorial_progress')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'tutorial_id': self.tutorial_id,
            'completed_steps': self.completed_steps,
            'current_step': self.current_step,
            'status': self.status,
            'progress_percentage': self.progress_percentage,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
    
    @property
    def progress_percentage(self):
        if not hasattr(self, '_total_steps'):
            return 0
        if self._total_steps == 0:
            return 100
        return (len(self.completed_steps) / self._total_steps) * 100

class HelpFeedback(db.Model):
    """User feedback on help content."""
    __tablename__ = 'help_feedback'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    article_id = db.Column(db.Integer, db.ForeignKey('help_articles.id'))
    feedback_type = db.Column(db.String(20), nullable=False)  # helpful, not_helpful, suggestion
    rating = db.Column(db.Integer)  # 1-5 scale
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='help_feedback')
    article = db.relationship('HelpArticle', backref='feedback')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'article_id': self.article_id,
            'feedback_type': self.feedback_type,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SupportTicket(db.Model):
    """Support ticket system."""
    __tablename__ = 'support_tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    ticket_number = db.Column(db.String(20), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    priority = db.Column(db.String(20), default='medium')
    status = db.Column(db.String(20), default='open')
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='support_tickets')
    assignee = db.relationship('User', foreign_keys=[assigned_to], backref='assigned_tickets')
    
    def to_dict(self):
        return {
            'id': self.id,
            'ticket_number': self.ticket_number,
            'user_id': self.user_id,
            'subject': self.subject,
            'description': self.description,
            'category': self.category,
            'priority': self.priority,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class KnowledgeBaseSearch(db.Model):
    """Track search queries for knowledge base improvements."""
    __tablename__ = 'knowledge_base_searches'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    query = db.Column(db.String(500), nullable=False)
    results_count = db.Column(db.Integer, default=0)
    clicked_result_id = db.Column(db.Integer, db.ForeignKey('help_articles.id'))
    session_id = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='searches')
    clicked_article = db.relationship('HelpArticle', backref='search_clicks')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'query': self.query,
            'results_count': self.results_count,
            'clicked_result_id': self.clicked_result_id,
            'session_id': self.session_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }