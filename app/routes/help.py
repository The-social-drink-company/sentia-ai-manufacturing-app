from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from flask_login import login_required, current_user
from app.services.help_service import HelpService, TutorialService, SupportService
from app.utils.security import require_permission, log_user_activity

bp = Blueprint('help', __name__, url_prefix='/help')

@bp.route('/')
@login_required
@require_permission('read')
@log_user_activity('help_access')
def index():
    """Help system main page."""
    # Get popular articles and categories
    popular_articles = HelpService.search_help_articles('', limit=6)
    tutorials = TutorialService.get_user_tutorial_list(current_user.id)
    
    return render_template('help/index.html', 
                         popular_articles=popular_articles,
                         tutorials=tutorials)

@bp.route('/search')
@login_required
@require_permission('read')
def search():
    """Search help articles."""
    query = request.args.get('q', '')
    category = request.args.get('category')
    
    articles = HelpService.search_help_articles(
        query=query, 
        user_id=current_user.id,
        category=category,
        limit=20
    )
    
    if request.headers.get('Content-Type') == 'application/json':
        return jsonify({
            'success': True,
            'data': {
                'articles': articles,
                'query': query,
                'category': category
            }
        })
    
    return render_template('help/search.html', 
                         articles=articles,
                         query=query,
                         category=category)

@bp.route('/article/<slug>')
@login_required
@require_permission('read')
def view_article(slug):
    """View a specific help article."""
    article = HelpService.get_article_by_slug(slug, current_user.id)
    
    if not article:
        flash('Article not found.', 'error')
        return redirect(url_for('help.index'))
    
    return render_template('help/article.html', article=article)

@bp.route('/tutorials')
@login_required
@require_permission('read')
def tutorials():
    """List available tutorials."""
    tutorials = TutorialService.get_user_tutorial_list(current_user.id)
    
    return render_template('help/tutorials.html', tutorials=tutorials)

@bp.route('/tutorial/<tutorial_id>')
@login_required
@require_permission('read')
def view_tutorial(tutorial_id):
    """View and start a tutorial."""
    tutorial_data = TutorialService.get_user_tutorial_progress(current_user.id, tutorial_id)
    
    if not tutorial_data:
        flash('Tutorial not found.', 'error')
        return redirect(url_for('help.tutorials'))
    
    return render_template('help/tutorial.html', tutorial_data=tutorial_data)

@bp.route('/support')
@login_required
@require_permission('read')
def support():
    """Support ticket system."""
    tickets = SupportService.get_user_tickets(current_user.id)
    
    return render_template('help/support.html', tickets=tickets)

@bp.route('/support/new', methods=['GET', 'POST'])
@login_required
@require_permission('create')
def new_support_ticket():
    """Create a new support ticket."""
    if request.method == 'POST':
        try:
            ticket = SupportService.create_support_ticket(
                user_id=current_user.id,
                subject=request.form['subject'],
                description=request.form['description'],
                category=request.form['category'],
                priority=request.form.get('priority', 'medium')
            )
            
            flash(f'Support ticket {ticket.ticket_number} created successfully.', 'success')
            return redirect(url_for('help.support'))
            
        except Exception as e:
            flash(f'Error creating support ticket: {str(e)}', 'error')
    
    return render_template('help/new_ticket.html')

# API Endpoints
@bp.route('/api/search')
@login_required
@require_permission('read')
def api_search():
    """API endpoint for searching help articles."""
    query = request.args.get('q', '')
    category = request.args.get('category')
    limit = min(int(request.args.get('limit', 10)), 50)
    
    articles = HelpService.search_help_articles(
        query=query,
        user_id=current_user.id,
        category=category,
        limit=limit
    )
    
    return jsonify({
        'success': True,
        'data': {
            'articles': articles,
            'query': query,
            'total': len(articles)
        }
    })

@bp.route('/api/contextual/<path:page_path>')
@login_required
@require_permission('read')
def api_contextual_help(page_path):
    """Get contextual help for a specific page."""
    tooltips = HelpService.get_contextual_help(page_path)
    
    return jsonify({
        'success': True,
        'data': {
            'tooltips': tooltips,
            'page_path': page_path
        }
    })

@bp.route('/api/feedback', methods=['POST'])
@login_required
@require_permission('create')
def api_submit_feedback():
    """Submit feedback for a help article."""
    data = request.get_json()
    
    try:
        feedback = HelpService.submit_article_feedback(
            article_id=data['article_id'],
            user_id=current_user.id,
            feedback_type=data['feedback_type'],
            rating=data.get('rating'),
            comment=data.get('comment')
        )
        
        return jsonify({
            'success': True,
            'data': feedback.to_dict(),
            'message': 'Feedback submitted successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'FEEDBACK_ERROR',
                'message': str(e)
            }
        }), 400

@bp.route('/api/tutorial/<tutorial_id>/start', methods=['POST'])
@login_required
@require_permission('read')
def api_start_tutorial(tutorial_id):
    """Start a tutorial."""
    try:
        tutorial_data = TutorialService.start_tutorial(current_user.id, tutorial_id)
        
        if not tutorial_data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'TUTORIAL_NOT_FOUND',
                    'message': 'Tutorial not found'
                }
            }), 404
        
        return jsonify({
            'success': True,
            'data': tutorial_data,
            'message': 'Tutorial started successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'TUTORIAL_ERROR',
                'message': str(e)
            }
        }), 500

@bp.route('/api/tutorial/<tutorial_id>/step/<step_id>/complete', methods=['POST'])
@login_required
@require_permission('read')
def api_complete_tutorial_step(tutorial_id, step_id):
    """Mark a tutorial step as completed."""
    try:
        tutorial_data = TutorialService.complete_tutorial_step(
            current_user.id, tutorial_id, step_id
        )
        
        if not tutorial_data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'TUTORIAL_NOT_FOUND',
                    'message': 'Tutorial or step not found'
                }
            }), 404
        
        return jsonify({
            'success': True,
            'data': tutorial_data,
            'message': 'Tutorial step completed'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'TUTORIAL_ERROR',
                'message': str(e)
            }
        }), 500

@bp.route('/api/tutorial/<tutorial_id>/progress')
@login_required
@require_permission('read')
def api_tutorial_progress(tutorial_id):
    """Get tutorial progress for current user."""
    tutorial_data = TutorialService.get_user_tutorial_progress(current_user.id, tutorial_id)
    
    if not tutorial_data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'TUTORIAL_NOT_FOUND',
                'message': 'Tutorial not found'
            }
        }), 404
    
    return jsonify({
        'success': True,
        'data': tutorial_data
    })

@bp.route('/api/tickets', methods=['GET'])
@login_required
@require_permission('read')
def api_get_tickets():
    """Get user's support tickets."""
    status = request.args.get('status')
    tickets = SupportService.get_user_tickets(current_user.id, status)
    
    return jsonify({
        'success': True,
        'data': {
            'tickets': tickets,
            'status_filter': status
        }
    })

@bp.route('/api/tickets', methods=['POST'])
@login_required
@require_permission('create')
def api_create_ticket():
    """Create a new support ticket via API."""
    data = request.get_json()
    
    try:
        ticket = SupportService.create_support_ticket(
            user_id=current_user.id,
            subject=data['subject'],
            description=data['description'],
            category=data['category'],
            priority=data.get('priority', 'medium')
        )
        
        return jsonify({
            'success': True,
            'data': ticket.to_dict(),
            'message': f'Support ticket {ticket.ticket_number} created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'TICKET_CREATION_ERROR',
                'message': str(e)
            }
        }), 400