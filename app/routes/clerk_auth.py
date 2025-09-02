"""
Clerk authentication routes for Flask integration.
Handles user session management and API endpoints for Clerk-authenticated users.
"""

from flask import Blueprint, request, jsonify, current_app, session, redirect, url_for, render_template
from app import db
from app.models.clerk_user import ClerkUser
from app.models.audit_log import AuditLog
from app.auth import require_auth, get_clerk_user, get_clerk_user_id
from datetime import datetime, timezone
import logging

bp = Blueprint('clerk_auth', __name__, url_prefix='/clerk-auth')

@bp.route('/webhook', methods=['POST'])
def clerk_webhook():
    """
    Handle Clerk webhook events for user lifecycle management.
    This endpoint receives webhook events from Clerk when users are created, updated, or deleted.
    """
    try:
        # Get webhook data
        data = request.get_json()
        event_type = data.get('type')
        
        current_app.logger.info(f"Received Clerk webhook: {event_type}")
        
        if event_type == 'user.created':
            handle_user_created(data.get('data'))
        elif event_type == 'user.updated':
            handle_user_updated(data.get('data'))
        elif event_type == 'user.deleted':
            handle_user_deleted(data.get('data'))
        elif event_type == 'session.created':
            handle_session_created(data.get('data'))
        elif event_type == 'session.ended':
            handle_session_ended(data.get('data'))
        
        return jsonify({'status': 'success'}), 200
    
    except Exception as e:
        current_app.logger.error(f"Error processing Clerk webhook: {str(e)}")
        return jsonify({'error': 'Webhook processing failed'}), 500


def handle_user_created(user_data):
    """Handle user creation from Clerk."""
    try:
        clerk_user = ClerkUser.create_from_clerk_data(user_data)
        db.session.commit()
        
        AuditLog.log_activity(
            activity_type='clerk_user_created',
            details={
                'clerk_user_id': user_data.get('id'),
                'email': clerk_user.email,
                'source': 'clerk_webhook'
            }
        )
        current_app.logger.info(f"Created user from Clerk: {clerk_user.email}")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating user from Clerk: {str(e)}")


def handle_user_updated(user_data):
    """Handle user update from Clerk."""
    try:
        clerk_user_id = user_data.get('id')
        user = ClerkUser.query.filter_by(clerk_user_id=clerk_user_id).first()
        
        if user:
            user.update_from_clerk_data(user_data)
            db.session.commit()
            
            AuditLog.log_activity(
                user_id=str(user.id),
                activity_type='clerk_user_updated',
                details={
                    'clerk_user_id': clerk_user_id,
                    'source': 'clerk_webhook'
                }
            )
            current_app.logger.info(f"Updated user from Clerk: {user.email}")
        else:
            # User doesn't exist locally, create them
            handle_user_created(user_data)
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating user from Clerk: {str(e)}")


def handle_user_deleted(user_data):
    """Handle user deletion from Clerk."""
    try:
        clerk_user_id = user_data.get('id')
        user = ClerkUser.query.filter_by(clerk_user_id=clerk_user_id).first()
        
        if user:
            user.is_active = False  # Soft delete
            db.session.commit()
            
            AuditLog.log_activity(
                user_id=str(user.id),
                activity_type='clerk_user_deleted',
                details={
                    'clerk_user_id': clerk_user_id,
                    'source': 'clerk_webhook'
                }
            )
            current_app.logger.info(f"Deactivated user from Clerk: {user.email}")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting user from Clerk: {str(e)}")


def handle_session_created(session_data):
    """Handle session creation from Clerk."""
    try:
        clerk_user_id = session_data.get('user_id')
        session_id = session_data.get('id')
        
        user = ClerkUser.query.filter_by(clerk_user_id=clerk_user_id).first()
        if user:
            user.clerk_session_id = session_id
            user.update_login_info()
            db.session.commit()
            
            AuditLog.log_activity(
                user_id=str(user.id),
                activity_type='clerk_session_created',
                details={
                    'session_id': session_id,
                    'source': 'clerk_webhook'
                }
            )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error handling session creation: {str(e)}")


def handle_session_ended(session_data):
    """Handle session end from Clerk."""
    try:
        session_id = session_data.get('id')
        
        user = ClerkUser.query.filter_by(clerk_session_id=session_id).first()
        if user:
            user.clerk_session_id = None
            db.session.commit()
            
            AuditLog.log_activity(
                user_id=str(user.id),
                activity_type='clerk_session_ended',
                details={
                    'session_id': session_id,
                    'source': 'clerk_webhook'
                }
            )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error handling session end: {str(e)}")


@bp.route('/user/sync', methods=['POST'])
@require_auth
def sync_user():
    """
    Sync current user data with Clerk.
    This endpoint is called by the frontend to ensure local user data is up to date.
    """
    try:
        clerk_user_data = get_clerk_user()
        if not clerk_user_data:
            return jsonify({'error': 'No Clerk user data available'}), 400
        
        clerk_user_id = clerk_user_data.get('id')
        if not clerk_user_id:
            return jsonify({'error': 'Invalid Clerk user data'}), 400
        
        # Get or create local user record
        user = ClerkUser.get_or_create_from_clerk(clerk_user_data)
        
        # Update login info
        user.update_login_info(request.remote_addr)
        
        return jsonify({
            'status': 'success',
            'user': user.to_dict()
        })
    
    except Exception as e:
        current_app.logger.error(f"Error syncing user: {str(e)}")
        return jsonify({'error': 'User sync failed'}), 500


@bp.route('/user/profile', methods=['GET'])
@require_auth
def get_user_profile():
    """Get current user profile."""
    try:
        clerk_user_id = get_clerk_user_id()
        if not clerk_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        user = ClerkUser.query.filter_by(clerk_user_id=clerk_user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict())
    
    except Exception as e:
        current_app.logger.error(f"Error getting user profile: {str(e)}")
        return jsonify({'error': 'Failed to get user profile'}), 500


@bp.route('/user/profile', methods=['PUT'])
@require_auth
def update_user_profile():
    """Update user profile (application-specific data only)."""
    try:
        clerk_user_id = get_clerk_user_id()
        if not clerk_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        user = ClerkUser.query.filter_by(clerk_user_id=clerk_user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Only allow updating application-specific fields
        updatable_fields = ['role', 'department', 'access_regions', 'timezone', 'language', 'preferences']
        
        # Check permissions for role changes
        if 'role' in data and data['role'] != user.role:
            # Only admins can change roles
            if not user.has_permission('user_management'):
                return jsonify({'error': 'Permission denied'}), 403
        
        # Update allowed fields
        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field])
        
        user.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        AuditLog.log_activity(
            user_id=str(user.id),
            activity_type='user_profile_updated',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            details={'updated_fields': list(data.keys())}
        )
        
        return jsonify({
            'status': 'success',
            'user': user.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating user profile: {str(e)}")
        return jsonify({'error': 'Failed to update user profile'}), 500


@bp.route('/user/permissions')
@require_auth
def get_user_permissions():
    """Get current user's permissions."""
    try:
        clerk_user_id = get_clerk_user_id()
        if not clerk_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        user = ClerkUser.query.filter_by(clerk_user_id=clerk_user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get all possible permissions
        permissions = {}
        permission_list = [
            'user_management', 'system_settings', 'api_config', 'audit_access',
            'read', 'write', 'delete', 'forecast', 'inventory', 'manufacturing',
            'financial', 'reporting', 'quality', 'planning', 'import_data'
        ]
        
        for permission in permission_list:
            permissions[permission] = user.has_permission(permission)
        
        return jsonify({
            'permissions': permissions,
            'role': user.role,
            'is_admin': user.is_admin,
            'department': user.department,
            'access_regions': user.get_allowed_regions()
        })
    
    except Exception as e:
        current_app.logger.error(f"Error getting user permissions: {str(e)}")
        return jsonify({'error': 'Failed to get user permissions'}), 500


@bp.route('/admin/users')
@require_auth
def list_users():
    """List all users (admin only)."""
    try:
        clerk_user_id = get_clerk_user_id()
        if not clerk_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        current_user = ClerkUser.query.filter_by(clerk_user_id=clerk_user_id).first()
        if not current_user or not current_user.has_permission('user_management'):
            return jsonify({'error': 'Permission denied'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        users_query = ClerkUser.query.filter_by(is_active=True)
        users = users_query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': users.page,
            'per_page': users.per_page
        })
    
    except Exception as e:
        current_app.logger.error(f"Error listing users: {str(e)}")
        return jsonify({'error': 'Failed to list users'}), 500


@bp.route('/signout')
def signout():
    """Handle user signout (redirect to main page)."""
    # Clear any local session data
    session.clear()
    
    # Redirect to main page where Clerk will handle the signout
    return redirect(url_for('main.index'))


@bp.route('/dashboard')
@require_auth
def dashboard():
    """Protected dashboard route."""
    try:
        clerk_user_id = get_clerk_user_id()
        if not clerk_user_id:
            return redirect(url_for('main.index'))
        
        user = ClerkUser.query.filter_by(clerk_user_id=clerk_user_id).first()
        if not user:
            # User exists in Clerk but not locally, create them
            clerk_user_data = get_clerk_user()
            if clerk_user_data:
                user = ClerkUser.get_or_create_from_clerk(clerk_user_data)
            else:
                return redirect(url_for('main.index'))
        
        # Update login info
        user.update_login_info(request.remote_addr)
        
        return render_template('dashboard.html', user=user)
    
    except Exception as e:
        current_app.logger.error(f"Error accessing dashboard: {str(e)}")
        return redirect(url_for('main.index'))