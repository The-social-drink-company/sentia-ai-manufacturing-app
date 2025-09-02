from typing import List, Dict, Optional, Tuple
from sqlalchemy import or_, and_, func, desc, asc
from sqlalchemy.orm import joinedload
from app import db
from app.models.help_system import HelpArticle, HelpFeedback, KnowledgeBaseSearch
from app.models.user import User
from datetime import datetime, timedelta
import json
import re
from collections import defaultdict

class KnowledgeBaseService:
    """Advanced knowledge base with categorization, tagging, and analytics."""
    
    # Predefined categories and subcategories
    CATEGORIES = {
        'getting_started': {
            'name': 'Getting Started',
            'description': 'Basic setup and first steps',
            'subcategories': {
                'installation': 'Installation & Setup',
                'first_login': 'First Login',
                'navigation': 'Navigation Basics'
            }
        },
        'product_management': {
            'name': 'Product Management',
            'description': 'Managing your product catalog',
            'subcategories': {
                'adding_products': 'Adding Products',
                'pricing': 'Pricing & Costs',
                'variants': 'Product Variants'
            }
        },
        'forecasting': {
            'name': 'Demand Forecasting',
            'description': 'Predicting future demand',
            'subcategories': {
                'methods': 'Forecasting Methods',
                'accuracy': 'Accuracy Analysis',
                'seasonal': 'Seasonal Forecasting'
            }
        },
        'inventory': {
            'name': 'Inventory Management',
            'description': 'Stock optimization and control',
            'subcategories': {
                'optimization': 'Stock Optimization',
                'monitoring': 'Level Monitoring',
                'alerts': 'Alerts & Notifications'
            }
        },
        'production': {
            'name': 'Production Planning',
            'description': 'Manufacturing scheduling',
            'subcategories': {
                'scheduling': 'Schedule Creation',
                'resources': 'Resource Management',
                'optimization': 'Schedule Optimization'
            }
        },
        'integrations': {
            'name': 'API Integrations',
            'description': 'External system connections',
            'subcategories': {
                'amazon': 'Amazon SP-API',
                'shopify': 'Shopify Integration',
                'xero': 'Xero Accounting'
            }
        },
        'reporting': {
            'name': 'Reports & Analytics',
            'description': 'Business intelligence and reporting',
            'subcategories': {
                'standard_reports': 'Standard Reports',
                'custom_reports': 'Custom Reports',
                'dashboards': 'Dashboard Analytics'
            }
        },
        'troubleshooting': {
            'name': 'Troubleshooting',
            'description': 'Common issues and solutions',
            'subcategories': {
                'performance': 'Performance Issues',
                'errors': 'Error Messages',
                'data_quality': 'Data Quality'
            }
        }
    }
    
    @classmethod
    def get_category_structure(cls) -> Dict:
        """Get the full category and subcategory structure."""
        return cls.CATEGORIES
    
    @classmethod
    def search_articles(cls, query: str, user_id: Optional[int] = None,
                       category: Optional[str] = None, subcategory: Optional[str] = None,
                       tags: Optional[List[str]] = None, limit: int = 20) -> Dict:
        """Advanced search with relevance scoring and analytics."""
        
        # Build base query
        search_query = HelpArticle.query.filter(HelpArticle.status == 'published')
        
        # Apply filters
        if category:
            search_query = search_query.filter(HelpArticle.category == category)
        
        if subcategory:
            search_query = search_query.filter(HelpArticle.subcategory == subcategory)
        
        # Tag filtering
        if tags:
            for tag in tags:
                search_query = search_query.filter(
                    HelpArticle.tags.contains([tag])
                )
        
        # Full-text search with relevance scoring
        results = []
        if query.strip():
            search_terms = cls._extract_search_terms(query)
            scored_articles = cls._calculate_relevance_scores(search_query.all(), search_terms)
            results = sorted(scored_articles, key=lambda x: x['relevance_score'], reverse=True)
        else:
            # No search query, order by popularity and recency
            articles = search_query.order_by(
                (HelpArticle.helpful_votes - HelpArticle.unhelpful_votes).desc(),
                HelpArticle.view_count.desc(),
                HelpArticle.updated_at.desc()
            ).limit(limit).all()
            results = [{'article': article.to_dict(), 'relevance_score': 0} for article in articles]
        
        # Log search
        cls._log_search(query, user_id, len(results))
        
        # Return top results
        return {
            'articles': [r['article'] for r in results[:limit]],
            'total_found': len(results),
            'search_terms': query,
            'applied_filters': {
                'category': category,
                'subcategory': subcategory,
                'tags': tags
            }
        }
    
    @classmethod
    def _extract_search_terms(cls, query: str) -> List[str]:
        """Extract and normalize search terms."""
        # Remove special characters and split into words
        terms = re.findall(r'\b\w+\b', query.lower())
        
        # Remove common stop words
        stop_words = {'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        terms = [term for term in terms if term not in stop_words and len(term) > 2]
        
        return terms
    
    @classmethod
    def _calculate_relevance_scores(cls, articles: List[HelpArticle], search_terms: List[str]) -> List[Dict]:
        """Calculate relevance scores for search results."""
        scored_results = []
        
        for article in articles:
            score = 0
            article_text = f"{article.title} {article.summary} {article.content}".lower()
            
            # Title matches (highest weight)
            title_lower = article.title.lower()
            for term in search_terms:
                if term in title_lower:
                    score += 10
                    if title_lower.startswith(term):
                        score += 5  # Bonus for title starting with term
            
            # Summary matches (medium weight)
            if article.summary:
                summary_lower = article.summary.lower()
                for term in search_terms:
                    score += summary_lower.count(term) * 3
            
            # Content matches (lower weight but can add up)
            content_lower = article.content.lower()
            for term in search_terms:
                score += min(content_lower.count(term), 10)  # Cap content matches
            
            # Tag matches (medium weight)
            if article.tags:
                for tag in article.tags:
                    tag_lower = tag.lower()
                    for term in search_terms:
                        if term in tag_lower:
                            score += 5
            
            # Boost for popular articles
            popularity_boost = (article.helpful_votes - article.unhelpful_votes) * 0.1
            view_boost = min(article.view_count * 0.01, 5)  # Cap view boost
            
            total_score = score + popularity_boost + view_boost
            
            if total_score > 0:  # Only include articles with some relevance
                scored_results.append({
                    'article': article.to_dict(),
                    'relevance_score': total_score
                })
        
        return scored_results
    
    @classmethod
    def _log_search(cls, query: str, user_id: Optional[int], results_count: int):
        """Log search query for analytics."""
        search_log = KnowledgeBaseSearch(
            user_id=user_id,
            query=query,
            results_count=results_count
        )
        db.session.add(search_log)
        db.session.commit()
    
    @classmethod
    def get_popular_articles(cls, category: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """Get most popular articles by views and ratings."""
        query = HelpArticle.query.filter(HelpArticle.status == 'published')
        
        if category:
            query = query.filter(HelpArticle.category == category)
        
        articles = query.order_by(
            (HelpArticle.helpful_votes - HelpArticle.unhelpful_votes).desc(),
            HelpArticle.view_count.desc()
        ).limit(limit).all()
        
        return [article.to_dict() for article in articles]
    
    @classmethod
    def get_recent_articles(cls, category: Optional[str] = None, days: int = 30, limit: int = 10) -> List[Dict]:
        """Get recently updated articles."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = HelpArticle.query.filter(
            HelpArticle.status == 'published',
            HelpArticle.updated_at >= cutoff_date
        )
        
        if category:
            query = query.filter(HelpArticle.category == category)
        
        articles = query.order_by(HelpArticle.updated_at.desc()).limit(limit).all()
        
        return [article.to_dict() for article in articles]
    
    @classmethod
    def get_trending_searches(cls, days: int = 7, limit: int = 10) -> List[Dict]:
        """Get trending search queries."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        trending = db.session.query(
            KnowledgeBaseSearch.query,
            func.count(KnowledgeBaseSearch.id).label('search_count'),
            func.avg(KnowledgeBaseSearch.results_count).label('avg_results')
        ).filter(
            KnowledgeBaseSearch.created_at >= cutoff_date,
            KnowledgeBaseSearch.query != ''
        ).group_by(
            KnowledgeBaseSearch.query
        ).order_by(
            func.count(KnowledgeBaseSearch.id).desc()
        ).limit(limit).all()
        
        return [
            {
                'query': result[0],
                'search_count': result[1],
                'avg_results': float(result[2]) if result[2] else 0
            }
            for result in trending
        ]
    
    @classmethod
    def get_articles_by_category(cls, category: str, subcategory: Optional[str] = None, 
                                limit: int = 20) -> List[Dict]:
        """Get articles in a specific category."""
        query = HelpArticle.query.filter(
            HelpArticle.status == 'published',
            HelpArticle.category == category
        )
        
        if subcategory:
            query = query.filter(HelpArticle.subcategory == subcategory)
        
        articles = query.order_by(
            HelpArticle.helpful_votes.desc(),
            HelpArticle.view_count.desc()
        ).limit(limit).all()
        
        return [article.to_dict() for article in articles]
    
    @classmethod
    def get_related_articles(cls, article_id: int, limit: int = 5) -> List[Dict]:
        """Get articles related to the current article."""
        current_article = HelpArticle.query.get(article_id)
        if not current_article:
            return []
        
        # Find articles with similar tags and category
        query = HelpArticle.query.filter(
            HelpArticle.status == 'published',
            HelpArticle.id != article_id
        )
        
        # Same category articles
        related_articles = query.filter(
            HelpArticle.category == current_article.category
        ).order_by(
            HelpArticle.helpful_votes.desc(),
            HelpArticle.view_count.desc()
        ).limit(limit).all()
        
        # If we have tags, try to find articles with matching tags
        if current_article.tags and len(related_articles) < limit:
            tag_matches = query.filter(
                or_(*[HelpArticle.tags.contains([tag]) for tag in current_article.tags])
            ).limit(limit - len(related_articles)).all()
            
            # Combine and deduplicate
            all_related = related_articles + tag_matches
            related_articles = list({a.id: a for a in all_related}.values())[:limit]
        
        return [article.to_dict() for article in related_articles]
    
    @classmethod
    def get_article_analytics(cls, article_id: int) -> Dict:
        """Get detailed analytics for a specific article."""
        article = HelpArticle.query.get(article_id)
        if not article:
            return {}
        
        # Get feedback stats
        feedback_stats = db.session.query(
            HelpFeedback.feedback_type,
            func.count(HelpFeedback.id).label('count'),
            func.avg(HelpFeedback.rating).label('avg_rating')
        ).filter(
            HelpFeedback.article_id == article_id
        ).group_by(HelpFeedback.feedback_type).all()
        
        # Get search statistics
        search_clicks = KnowledgeBaseSearch.query.filter(
            KnowledgeBaseSearch.clicked_result_id == article_id
        ).count()
        
        # Calculate click-through rate
        total_searches = KnowledgeBaseSearch.query.count()
        ctr = (search_clicks / total_searches * 100) if total_searches > 0 else 0
        
        return {
            'article': article.to_dict(),
            'feedback_stats': [
                {
                    'type': stat[0],
                    'count': stat[1],
                    'avg_rating': float(stat[2]) if stat[2] else None
                }
                for stat in feedback_stats
            ],
            'search_clicks': search_clicks,
            'click_through_rate': round(ctr, 2),
            'helpfulness_ratio': article.helpfulness_score
        }
    
    @classmethod
    def suggest_content_gaps(cls) -> List[Dict]:
        """Analyze search patterns to suggest missing content."""
        # Get searches with low result counts
        low_result_searches = db.session.query(
            KnowledgeBaseSearch.query,
            func.count(KnowledgeBaseSearch.id).label('search_count'),
            func.avg(KnowledgeBaseSearch.results_count).label('avg_results')
        ).group_by(
            KnowledgeBaseSearch.query
        ).having(
            func.avg(KnowledgeBaseSearch.results_count) < 3,
            func.count(KnowledgeBaseSearch.id) >= 5
        ).order_by(
            func.count(KnowledgeBaseSearch.id).desc()
        ).limit(20).all()
        
        suggestions = []
        for search_query, search_count, avg_results in low_result_searches:
            # Suggest category based on keywords
            suggested_category = cls._suggest_category_for_query(search_query)
            
            suggestions.append({
                'search_query': search_query,
                'search_frequency': search_count,
                'avg_results': float(avg_results) if avg_results else 0,
                'suggested_category': suggested_category,
                'priority': 'high' if search_count >= 10 else 'medium'
            })
        
        return suggestions
    
    @classmethod
    def _suggest_category_for_query(cls, query: str) -> str:
        """Suggest category based on query keywords."""
        query_lower = query.lower()
        
        # Keyword mapping to categories
        category_keywords = {
            'forecasting': ['forecast', 'prediction', 'demand', 'sales', 'future'],
            'inventory': ['inventory', 'stock', 'warehouse', 'reorder', 'level'],
            'production': ['production', 'schedule', 'manufacturing', 'resource', 'capacity'],
            'product_management': ['product', 'catalog', 'sku', 'pricing', 'cost'],
            'integrations': ['api', 'integration', 'amazon', 'shopify', 'xero', 'sync'],
            'reporting': ['report', 'analytics', 'dashboard', 'metrics', 'kpi'],
            'troubleshooting': ['error', 'problem', 'issue', 'fix', 'troubleshoot', 'debug']
        }
        
        # Score each category
        category_scores = defaultdict(int)
        for category, keywords in category_keywords.items():
            for keyword in keywords:
                if keyword in query_lower:
                    category_scores[category] += 1
        
        # Return category with highest score, or 'getting_started' as default
        if category_scores:
            return max(category_scores, key=category_scores.get)
        else:
            return 'getting_started'
    
    @classmethod
    def get_knowledge_base_stats(cls) -> Dict:
        """Get overall knowledge base statistics."""
        total_articles = HelpArticle.query.filter_by(status='published').count()
        total_searches = KnowledgeBaseSearch.query.count()
        
        # Category distribution
        category_stats = db.session.query(
            HelpArticle.category,
            func.count(HelpArticle.id).label('article_count'),
            func.sum(HelpArticle.view_count).label('total_views'),
            func.avg(HelpArticle.helpful_votes - HelpArticle.unhelpful_votes).label('avg_rating')
        ).filter(
            HelpArticle.status == 'published'
        ).group_by(HelpArticle.category).all()
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_searches = KnowledgeBaseSearch.query.filter(
            KnowledgeBaseSearch.created_at >= thirty_days_ago
        ).count()
        
        recent_articles = HelpArticle.query.filter(
            HelpArticle.updated_at >= thirty_days_ago,
            HelpArticle.status == 'published'
        ).count()
        
        return {
            'overview': {
                'total_articles': total_articles,
                'total_searches': total_searches,
                'recent_searches_30d': recent_searches,
                'recent_articles_30d': recent_articles
            },
            'category_breakdown': [
                {
                    'category': stat[0],
                    'article_count': stat[1],
                    'total_views': stat[2] or 0,
                    'avg_rating': float(stat[3]) if stat[3] else 0
                }
                for stat in category_stats
            ],
            'top_searches': cls.get_trending_searches(days=30, limit=10),
            'content_gaps': cls.suggest_content_gaps()
        }