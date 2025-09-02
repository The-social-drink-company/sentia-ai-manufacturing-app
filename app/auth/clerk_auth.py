"""
Clerk authentication service for Flask integration.
Provides authentication helpers for validating Clerk session tokens.
"""

import os
from typing import Optional, Dict, Any
from flask import request, current_app, g
from clerk_backend_api import Clerk, AuthenticateRequestOptions
import httpx


class ClerkAuth:
    """Clerk authentication service for Flask."""
    
    def __init__(self, app=None):
        self.app = app
        self._client = None
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize Clerk authentication with Flask app."""
        self.app = app
        app.extensions = getattr(app, 'extensions', {})
        app.extensions['clerk_auth'] = self
        
        # Initialize Clerk client
        secret_key = app.config.get('CLERK_SECRET_KEY')
        if not secret_key:
            raise ValueError("CLERK_SECRET_KEY must be set in app configuration")
        
        self._client = Clerk(bearer_auth=secret_key)
    
    def authenticate_request(self, flask_request=None) -> Dict[str, Any]:
        """
        Authenticate a Flask request using Clerk session token.
        
        Args:
            flask_request: Flask request object (defaults to current request)
            
        Returns:
            Dict containing authentication state and user information
        """
        if flask_request is None:
            flask_request = request
        
        try:
            # Convert Flask request to httpx.Request for Clerk SDK
            httpx_request = self._convert_flask_to_httpx_request(flask_request)
            
            # Get authorized parties from config
            authorized_parties = self._get_authorized_parties()
            
            # Authenticate with Clerk
            request_state = self._client.authenticate_request(
                httpx_request,
                AuthenticateRequestOptions(
                    authorized_parties=authorized_parties
                )
            )
            
            return {
                'is_signed_in': request_state.is_signed_in,
                'user_id': getattr(request_state, 'user_id', None),
                'user': getattr(request_state, 'user', None),
                'session_id': getattr(request_state, 'session_id', None),
                'session': getattr(request_state, 'session', None),
                'org_id': getattr(request_state, 'org_id', None),
                'organization': getattr(request_state, 'organization', None),
                'reason': getattr(request_state, 'reason', None)
            }
        except Exception as e:
            current_app.logger.error(f"Clerk authentication error: {str(e)}")
            return {
                'is_signed_in': False,
                'user_id': None,
                'user': None,
                'session_id': None,
                'session': None,
                'org_id': None,
                'organization': None,
                'reason': f"Authentication error: {str(e)}"
            }
    
    def _convert_flask_to_httpx_request(self, flask_request) -> httpx.Request:
        """Convert Flask request to httpx.Request for Clerk SDK."""
        # Get the authorization header
        headers = {}
        if 'Authorization' in flask_request.headers:
            headers['Authorization'] = flask_request.headers['Authorization']
        
        # Get session token from cookie if not in Authorization header
        if not headers.get('Authorization') and '__session' in flask_request.cookies:
            headers['Authorization'] = f"Bearer {flask_request.cookies['__session']}"
        
        # Create httpx request
        return httpx.Request(
            method=flask_request.method,
            url=str(flask_request.url),
            headers=headers,
            content=flask_request.get_data()
        )
    
    def _get_authorized_parties(self) -> list:
        """Get list of authorized parties from config."""
        # Default authorized parties - customize based on your setup
        cors_origins = self.app.config.get('CORS_ORIGINS', [])
        authorized_parties = []
        
        for origin in cors_origins:
            if origin != '*':
                authorized_parties.append(origin)
        
        # Add localhost for development
        if self.app.debug:
            authorized_parties.extend([
                'http://localhost:3000',
                'http://localhost:5000',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:5000'
            ])
        
        return authorized_parties if authorized_parties else ['http://localhost:3000']
    
    def get_current_user_id(self) -> Optional[str]:
        """Get current authenticated user ID from request context."""
        auth_state = getattr(g, '_clerk_auth_state', None)
        if not auth_state:
            auth_state = self.authenticate_request()
            g._clerk_auth_state = auth_state
        
        return auth_state.get('user_id') if auth_state.get('is_signed_in') else None
    
    def get_current_user(self) -> Optional[Dict[str, Any]]:
        """Get current authenticated user data from request context."""
        auth_state = getattr(g, '_clerk_auth_state', None)
        if not auth_state:
            auth_state = self.authenticate_request()
            g._clerk_auth_state = auth_state
        
        return auth_state.get('user') if auth_state.get('is_signed_in') else None
    
    def is_signed_in(self) -> bool:
        """Check if current request is from authenticated user."""
        auth_state = getattr(g, '_clerk_auth_state', None)
        if not auth_state:
            auth_state = self.authenticate_request()
            g._clerk_auth_state = auth_state
        
        return auth_state.get('is_signed_in', False)


def require_auth(f):
    """Decorator to require Clerk authentication for a route."""
    from functools import wraps
    from flask import jsonify, redirect, url_for, request
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        clerk_auth = current_app.extensions.get('clerk_auth')
        if not clerk_auth:
            return jsonify({'error': 'Clerk authentication not configured'}), 500
        
        if not clerk_auth.is_signed_in():
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({'error': 'Authentication required'}), 401
            else:
                return redirect(url_for('auth.login'))
        
        return f(*args, **kwargs)
    return decorated_function


def get_clerk_user():
    """Get current Clerk user from request context."""
    clerk_auth = current_app.extensions.get('clerk_auth')
    if clerk_auth:
        return clerk_auth.get_current_user()
    return None


def get_clerk_user_id():
    """Get current Clerk user ID from request context."""
    clerk_auth = current_app.extensions.get('clerk_auth')
    if clerk_auth:
        return clerk_auth.get_current_user_id()
    return None