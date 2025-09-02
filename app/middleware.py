"""
Security and performance middleware for production deployment.
"""

from flask import request, g, jsonify
import time
import logging
from functools import wraps
from collections import defaultdict

# Rate limiting storage (simple in-memory for basic protection)
request_counts = defaultdict(lambda: defaultdict(int))
request_times = defaultdict(lambda: defaultdict(list))

def add_security_headers(response):
    """Add security headers to all responses."""
    # HSTS
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    
    # XSS Protection
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Content Security Policy
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https:; "
        "frame-ancestors 'none';"
    )
    
    # Referrer Policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Permissions Policy
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    
    return response

def rate_limit(max_requests=100, window=60, per='ip', key_func=None):
    """
    Rate limiting decorator.
    
    Args:
        max_requests: Maximum requests allowed
        window: Time window in seconds
        per: Rate limit per 'ip' or custom key
        key_func: Custom function to generate rate limit key
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Generate rate limit key
            if key_func:
                key = key_func()
            elif per == 'ip':
                key = request.remote_addr
            else:
                key = per
            
            current_time = time.time()
            window_start = current_time - window
            
            # Clean old requests
            request_times[key] = [
                req_time for req_time in request_times[key] 
                if req_time > window_start
            ]
            
            # Check rate limit
            if len(request_times[key]) >= max_requests:
                logging.warning(f"Rate limit exceeded for {key}: {len(request_times[key])} requests")
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Maximum {max_requests} requests per {window} seconds'
                }), 429
            
            # Record this request
            request_times[key].append(current_time)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def setup_request_logging():
    """Set up request logging for monitoring."""
    @g.app_context
    def log_request_info():
        g.start_time = time.time()
    
    def log_response_info(response):
        duration = time.time() - g.start_time if hasattr(g, 'start_time') else 0
        logging.info(
            f"{request.method} {request.path} - "
            f"{response.status_code} - "
            f"{duration:.3f}s - "
            f"{request.remote_addr} - "
            f"{request.headers.get('User-Agent', 'Unknown')}"
        )
        return response
    
    return log_request_info, log_response_info

def init_middleware(app):
    """Initialize all middleware for the Flask app."""
    
    # Security headers
    app.after_request(add_security_headers)
    
    # Request logging
    if not app.debug:
        before_request, after_request = setup_request_logging()
        app.before_request(before_request)
        app.after_request(after_request)
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f"Internal server error: {error}")
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(429)
    def rate_limit_error(error):
        return jsonify({
            'error': 'Rate limit exceeded',
            'message': 'Too many requests, please try again later'
        }), 429