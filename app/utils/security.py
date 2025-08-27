from functools import wraps
from flask import request, jsonify, session, redirect, url_for, flash, abort, current_app
from flask_login import current_user, login_required
import time
from datetime import datetime, timezone
from collections import defaultdict
import ipaddress
import secrets
from app import db
from app.models.user import User

# Rate limiting storage
_rate_limit_storage = defaultdict(list)

def require_permission(permission, region=None, department=None):
    """Decorator to require specific permission for a route"""
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for('auth.login'))
            
            if not current_user.is_active:
                flash('Your account has been deactivated. Please contact an administrator.', 'error')
                return redirect(url_for('auth.login'))
            
            if current_user.is_account_locked():
                flash('Your account is temporarily locked due to multiple failed login attempts.', 'error')
                return redirect(url_for('auth.login'))
            
            if current_user.needs_password_change():
                flash('You must change your password before continuing.', 'warning')
                return redirect(url_for('auth.change_password'))
            
            if not current_user.has_permission(permission, region):
                if request.is_json:
                    return jsonify({'error': 'Insufficient permissions'}), 403
                flash('You do not have permission to access this resource.', 'error')
                return redirect(url_for('main.dashboard'))
            
            if department and not current_user.has_department_access(department):
                if request.is_json:
                    return jsonify({'error': 'Insufficient department access'}), 403
                flash('You do not have access to this department.', 'error')
                return redirect(url_for('main.dashboard'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_role(roles):
    """Decorator to require specific role(s) for a route"""
    if isinstance(roles, str):
        roles = [roles]
    
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for('auth.login'))
            
            if current_user.role not in roles and not current_user.is_admin:
                if request.is_json:
                    return jsonify({'error': 'Insufficient role privileges'}), 403
                flash('You do not have the required role to access this resource.', 'error')
                return redirect(url_for('main.dashboard'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            if request.is_json:
                return jsonify({'error': 'Administrator access required'}), 403
            flash('Administrator access required.', 'error')
            return redirect(url_for('main.dashboard'))
        return f(*args, **kwargs)
    return decorated_function

def rate_limit(max_requests=100, window_seconds=3600, per_user=True):
    """Rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            now = time.time()
            
            # Determine the key for rate limiting
            if per_user and current_user.is_authenticated:
                key = f"user_{current_user.id}"
            else:
                key = request.remote_addr or 'unknown'
            
            # Clean old entries
            _rate_limit_storage[key] = [
                timestamp for timestamp in _rate_limit_storage[key]
                if now - timestamp < window_seconds
            ]
            
            # Check rate limit
            if len(_rate_limit_storage[key]) >= max_requests:
                if request.is_json:
                    return jsonify({'error': 'Rate limit exceeded'}), 429
                flash('Too many requests. Please try again later.', 'error')
                return redirect(url_for('main.index'))
            
            # Add current request
            _rate_limit_storage[key].append(now)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_ip_access(allowed_networks=None):
    """Decorator to validate IP access"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not allowed_networks:
                return f(*args, **kwargs)
            
            client_ip = request.remote_addr
            if not client_ip:
                if request.is_json:
                    return jsonify({'error': 'Unable to determine client IP'}), 403
                abort(403)
            
            try:
                client_addr = ipaddress.ip_address(client_ip)
                allowed = False
                
                for network in allowed_networks:
                    if client_addr in ipaddress.ip_network(network):
                        allowed = True
                        break
                
                if not allowed:
                    current_app.logger.warning(f"IP access denied for {client_ip}")
                    if request.is_json:
                        return jsonify({'error': 'Access denied from your IP address'}), 403
                    abort(403)
                    
            except ValueError:
                current_app.logger.error(f"Invalid IP address format: {client_ip}")
                if request.is_json:
                    return jsonify({'error': 'Invalid request'}), 400
                abort(400)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_user_activity(activity_type, details=None):
    """Decorator to log user activities"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            result = f(*args, **kwargs)
            
            if current_user.is_authenticated:
                log_activity(
                    user_id=current_user.id,
                    activity_type=activity_type,
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get('User-Agent'),
                    details=details or {},
                    endpoint=request.endpoint,
                    method=request.method
                )
            
            return result
        return decorated_function
    return decorator

def csrf_protect(f):
    """Simple CSRF protection decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'POST':
            token = session.pop('_csrf_token', None)
            if not token or token != request.form.get('_csrf_token'):
                if request.is_json:
                    return jsonify({'error': 'CSRF token validation failed'}), 403
                flash('Security token validation failed. Please try again.', 'error')
                return redirect(request.referrer or url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function

def generate_csrf_token():
    """Generate CSRF token for forms"""
    if '_csrf_token' not in session:
        session['_csrf_token'] = secrets.token_urlsafe(32)
    return session['_csrf_token']

def log_activity(user_id, activity_type, ip_address=None, user_agent=None, 
                details=None, endpoint=None, method=None):
    """Log user activity to database"""
    try:
        from app.models.audit_log import AuditLog
        
        log_entry = AuditLog(
            user_id=user_id,
            activity_type=activity_type,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {},
            endpoint=endpoint,
            method=method,
            timestamp=datetime.now(timezone.utc)
        )
        
        db.session.add(log_entry)
        db.session.commit()
        
    except Exception as e:
        current_app.logger.error(f"Failed to log user activity: {str(e)}")

def validate_session_security():
    """Validate current session security"""
    if not current_user.is_authenticated:
        return False
    
    if not current_user.is_session_valid():
        return False
    
    # Check if user needs to change password
    if current_user.needs_password_change():
        return False
    
    # Check if account is locked
    if current_user.is_account_locked():
        return False
    
    return True

def secure_headers(f):
    """Add security headers to response"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        response = f(*args, **kwargs)
        
        if hasattr(response, 'headers'):
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response
    return decorated_function