from typing import List, Dict, Optional
from sqlalchemy import or_, and_, func
from app import db
from app.models.help_system import HelpArticle, Tooltip, UserTutorialProgress, HelpFeedback, SupportTicket, KnowledgeBaseSearch
from datetime import datetime
import json

class HelpService:
    """Service for managing help system functionality."""
    
    @staticmethod
    def search_help_articles(query: str, user_id: Optional[int] = None, 
                           category: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """Search help articles with full-text search."""
        
        # Log the search query
        search_log = KnowledgeBaseSearch(
            user_id=user_id,
            query=query,
            results_count=0
        )
        
        # Build search query
        search_query = HelpArticle.query.filter(HelpArticle.status == 'published')
        
        if category:
            search_query = search_query.filter(HelpArticle.category == category)
        
        if query.strip():
            # Simple text search across title, content, and tags
            search_terms = query.lower().split()
            conditions = []
            
            for term in search_terms:
                term_conditions = [
                    func.lower(HelpArticle.title).contains(term),
                    func.lower(HelpArticle.content).contains(term),
                    func.lower(HelpArticle.summary).contains(term)
                ]
                conditions.append(or_(*term_conditions))
            
            search_query = search_query.filter(and_(*conditions))
        
        # Order by relevance (view count and helpfulness)
        results = search_query.order_by(
            (HelpArticle.helpful_votes - HelpArticle.unhelpful_votes).desc(),
            HelpArticle.view_count.desc(),
            HelpArticle.updated_at.desc()
        ).limit(limit).all()
        
        # Update search log
        search_log.results_count = len(results)
        db.session.add(search_log)
        db.session.commit()
        
        return [article.to_dict() for article in results]
    
    @staticmethod
    def get_article_by_slug(slug: str, user_id: Optional[int] = None) -> Optional[Dict]:
        """Get help article by slug and increment view count."""
        article = HelpArticle.query.filter_by(slug=slug, status='published').first()
        
        if article:
            # Increment view count
            article.view_count = HelpArticle.view_count + 1
            db.session.commit()
            
            return article.to_dict()
        
        return None
    
    @staticmethod
    def get_contextual_help(page_path: str) -> List[Dict]:
        """Get contextual tooltips and help for a specific page."""
        tooltips = Tooltip.query.filter_by(
            page_path=page_path, 
            is_active=True
        ).all()
        
        return [tooltip.to_dict() for tooltip in tooltips]
    
    @staticmethod
    def create_help_article(data: Dict, created_by: int) -> HelpArticle:
        """Create a new help article."""
        article = HelpArticle(
            title=data['title'],
            slug=data['slug'],
            content=data['content'],
            summary=data.get('summary'),
            category=data['category'],
            subcategory=data.get('subcategory'),
            tags=data.get('tags', []),
            status=data.get('status', 'draft'),
            created_by=created_by
        )
        
        db.session.add(article)
        db.session.commit()
        
        return article
    
    @staticmethod
    def update_help_article(article_id: int, data: Dict) -> Optional[HelpArticle]:
        """Update an existing help article."""
        article = HelpArticle.query.get(article_id)
        
        if not article:
            return None
        
        for key, value in data.items():
            if hasattr(article, key):
                setattr(article, key, value)
        
        article.updated_at = datetime.utcnow()
        db.session.commit()
        
        return article
    
    @staticmethod
    def submit_article_feedback(article_id: int, user_id: Optional[int], 
                              feedback_type: str, rating: Optional[int] = None, 
                              comment: Optional[str] = None) -> HelpFeedback:
        """Submit feedback for a help article."""
        feedback = HelpFeedback(
            article_id=article_id,
            user_id=user_id,
            feedback_type=feedback_type,
            rating=rating,
            comment=comment
        )
        
        db.session.add(feedback)
        
        # Update article vote counts
        article = HelpArticle.query.get(article_id)
        if article:
            if feedback_type == 'helpful':
                article.helpful_votes = HelpArticle.helpful_votes + 1
            elif feedback_type == 'not_helpful':
                article.unhelpful_votes = HelpArticle.unhelpful_votes + 1
        
        db.session.commit()
        
        return feedback

class TutorialService:
    """Service for managing interactive tutorials."""
    
    # Define available tutorials
    TUTORIALS = {
        'getting_started': {
            'id': 'getting_started',
            'title': 'Getting Started with Sentia Dashboard',
            'description': 'Learn the basics of navigating and using the dashboard',
            'steps': [
                {
                    'id': 'welcome',
                    'title': 'Welcome to Sentia Dashboard',
                    'content': 'Let\'s take a tour of the main features',
                    'target': '.dashboard-welcome',
                    'position': 'bottom'
                },
                {
                    'id': 'navigation',
                    'title': 'Main Navigation',
                    'content': 'Use this navigation bar to access different modules',
                    'target': '.navbar',
                    'position': 'bottom'
                },
                {
                    'id': 'dashboard_overview',
                    'title': 'Dashboard Overview',
                    'content': 'Your main dashboard shows key metrics and quick actions',
                    'target': '.dashboard-content',
                    'position': 'top'
                }
            ]
        },
        'forecasting_basics': {
            'id': 'forecasting_basics',
            'title': 'Demand Forecasting Basics',
            'description': 'Learn how to generate and interpret demand forecasts',
            'steps': [
                {
                    'id': 'forecast_intro',
                    'title': 'Introduction to Forecasting',
                    'content': 'Forecasting helps predict future demand for your products',
                    'target': '.forecasting-intro',
                    'position': 'bottom'
                },
                {
                    'id': 'select_products',
                    'title': 'Select Products',
                    'content': 'Choose which products to forecast',
                    'target': '.product-selector',
                    'position': 'right'
                },
                {
                    'id': 'choose_method',
                    'title': 'Choose Forecasting Method',
                    'content': 'Different methods work better for different patterns',
                    'target': '.method-selector',
                    'position': 'top'
                },
                {
                    'id': 'interpret_results',
                    'title': 'Interpret Results',
                    'content': 'Learn how to read forecast charts and accuracy metrics',
                    'target': '.forecast-results',
                    'position': 'left'
                }
            ]
        },
        'inventory_optimization': {
            'id': 'inventory_optimization',
            'title': 'Stock Optimization Tutorial',
            'description': 'Optimize your inventory levels and reduce costs',
            'steps': [
                {
                    'id': 'optimization_intro',
                    'title': 'Stock Optimization Overview',
                    'content': 'Learn how to balance stock levels and costs',
                    'target': '.optimization-intro',
                    'position': 'bottom'
                },
                {
                    'id': 'set_parameters',
                    'title': 'Set Optimization Parameters',
                    'content': 'Configure service levels and cost parameters',
                    'target': '.parameter-form',
                    'position': 'right'
                },
                {
                    'id': 'review_recommendations',
                    'title': 'Review Recommendations',
                    'content': 'Analyze the optimization results and recommendations',
                    'target': '.optimization-results',
                    'position': 'top'
                }
            ]
        }
    }
    
    @staticmethod
    def get_tutorial(tutorial_id: str) -> Optional[Dict]:
        """Get tutorial definition by ID."""
        return TutorialService.TUTORIALS.get(tutorial_id)
    
    @staticmethod
    def get_user_tutorial_progress(user_id: int, tutorial_id: str) -> Dict:
        """Get user's progress for a specific tutorial."""
        progress = UserTutorialProgress.query.filter_by(
            user_id=user_id,
            tutorial_id=tutorial_id
        ).first()
        
        tutorial = TutorialService.get_tutorial(tutorial_id)
        if not tutorial:
            return {}
        
        if not progress:
            progress = UserTutorialProgress(
                user_id=user_id,
                tutorial_id=tutorial_id,
                status='not_started'
            )
            db.session.add(progress)
            db.session.commit()
        
        # Add total steps for percentage calculation
        progress._total_steps = len(tutorial['steps'])
        
        result = progress.to_dict()
        result['tutorial'] = tutorial
        return result
    
    @staticmethod
    def start_tutorial(user_id: int, tutorial_id: str) -> Optional[Dict]:
        """Start a tutorial for a user."""
        tutorial = TutorialService.get_tutorial(tutorial_id)
        if not tutorial:
            return None
        
        progress = UserTutorialProgress.query.filter_by(
            user_id=user_id,
            tutorial_id=tutorial_id
        ).first()
        
        if not progress:
            progress = UserTutorialProgress(
                user_id=user_id,
                tutorial_id=tutorial_id
            )
            db.session.add(progress)
        
        progress.status = 'in_progress'
        progress.started_at = datetime.utcnow()
        progress.current_step = 0
        progress.completed_steps = []
        
        db.session.commit()
        
        # Add total steps for percentage calculation
        progress._total_steps = len(tutorial['steps'])
        
        result = progress.to_dict()
        result['tutorial'] = tutorial
        return result
    
    @staticmethod
    def complete_tutorial_step(user_id: int, tutorial_id: str, step_id: str) -> Optional[Dict]:
        """Mark a tutorial step as completed."""
        progress = UserTutorialProgress.query.filter_by(
            user_id=user_id,
            tutorial_id=tutorial_id
        ).first()
        
        if not progress:
            return None
        
        tutorial = TutorialService.get_tutorial(tutorial_id)
        if not tutorial:
            return None
        
        if step_id not in progress.completed_steps:
            progress.completed_steps.append(step_id)
            progress.current_step = len(progress.completed_steps)
            
            # Check if tutorial is complete
            if len(progress.completed_steps) >= len(tutorial['steps']):
                progress.status = 'completed'
                progress.completed_at = datetime.utcnow()
            
            db.session.commit()
        
        # Add total steps for percentage calculation
        progress._total_steps = len(tutorial['steps'])
        
        result = progress.to_dict()
        result['tutorial'] = tutorial
        return result
    
    @staticmethod
    def get_user_tutorial_list(user_id: int) -> List[Dict]:
        """Get all tutorials with user progress."""
        tutorials = []
        
        for tutorial_id, tutorial in TutorialService.TUTORIALS.items():
            progress = UserTutorialProgress.query.filter_by(
                user_id=user_id,
                tutorial_id=tutorial_id
            ).first()
            
            tutorial_info = tutorial.copy()
            
            if progress:
                progress._total_steps = len(tutorial['steps'])
                tutorial_info['progress'] = progress.to_dict()
            else:
                tutorial_info['progress'] = {
                    'status': 'not_started',
                    'progress_percentage': 0,
                    'current_step': 0
                }
            
            tutorials.append(tutorial_info)
        
        return tutorials

class SupportService:
    """Service for managing support tickets and user assistance."""
    
    @staticmethod
    def create_support_ticket(user_id: int, subject: str, description: str, 
                            category: str, priority: str = 'medium') -> SupportTicket:
        """Create a new support ticket."""
        # Generate ticket number
        ticket_count = SupportTicket.query.count()
        ticket_number = f"ST-{datetime.now().strftime('%Y%m%d')}-{ticket_count + 1:04d}"
        
        ticket = SupportTicket(
            ticket_number=ticket_number,
            user_id=user_id,
            subject=subject,
            description=description,
            category=category,
            priority=priority,
            status='open'
        )
        
        db.session.add(ticket)
        db.session.commit()
        
        return ticket
    
    @staticmethod
    def get_user_tickets(user_id: int, status: Optional[str] = None) -> List[Dict]:
        """Get support tickets for a user."""
        query = SupportTicket.query.filter_by(user_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        tickets = query.order_by(SupportTicket.created_at.desc()).all()
        
        return [ticket.to_dict() for ticket in tickets]
    
    @staticmethod
    def update_ticket_status(ticket_id: int, status: str, assigned_to: Optional[int] = None) -> Optional[SupportTicket]:
        """Update support ticket status."""
        ticket = SupportTicket.query.get(ticket_id)
        
        if not ticket:
            return None
        
        ticket.status = status
        
        if assigned_to:
            ticket.assigned_to = assigned_to
        
        if status in ['resolved', 'closed']:
            ticket.resolved_at = datetime.utcnow()
        
        db.session.commit()
        
        return ticket
    
    @staticmethod
    def get_popular_help_topics() -> List[Dict]:
        """Get most popular help topics based on search queries."""
        popular_searches = db.session.query(
            KnowledgeBaseSearch.query,
            func.count(KnowledgeBaseSearch.id).label('count')
        ).group_by(
            KnowledgeBaseSearch.query
        ).order_by(
            func.count(KnowledgeBaseSearch.id).desc()
        ).limit(10).all()
        
        return [{'query': search[0], 'count': search[1]} for search in popular_searches]
    
    @staticmethod
    def get_help_analytics() -> Dict:
        """Get analytics data for help system."""
        total_articles = HelpArticle.query.filter_by(status='published').count()
        total_searches = KnowledgeBaseSearch.query.count()
        total_tickets = SupportTicket.query.count()
        open_tickets = SupportTicket.query.filter_by(status='open').count()
        
        # Most viewed articles
        popular_articles = HelpArticle.query.filter_by(
            status='published'
        ).order_by(
            HelpArticle.view_count.desc()
        ).limit(5).all()
        
        # Articles needing attention (low helpfulness score)
        problematic_articles = HelpArticle.query.filter(
            HelpArticle.unhelpful_votes > HelpArticle.helpful_votes,
            HelpArticle.status == 'published'
        ).order_by(
            HelpArticle.unhelpful_votes.desc()
        ).limit(5).all()
        
        return {
            'overview': {
                'total_articles': total_articles,
                'total_searches': total_searches,
                'total_tickets': total_tickets,
                'open_tickets': open_tickets
            },
            'popular_articles': [article.to_dict() for article in popular_articles],
            'problematic_articles': [article.to_dict() for article in problematic_articles],
            'popular_searches': SupportService.get_popular_help_topics()
        }