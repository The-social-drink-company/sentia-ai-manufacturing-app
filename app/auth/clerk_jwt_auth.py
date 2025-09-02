"""
Clerk JWT token verification for Flask API endpoints.
Validates JWT tokens sent from Clerk React frontend.
"""

import os
import jwt
from functools import wraps
from flask import request, jsonify, current_app, g
from jwt import PyJWKClient
import requests


class ClerkJWTAuth:
    """Clerk JWT token verification service for Flask API."""
    
    def __init__(self, app=None):
        self.app = app
        self.jwks_client = None
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize Clerk JWT authentication with Flask app."""
        self.app = app
        app.extensions = getattr(app, 'extensions', {})
        app.extensions['clerk_jwt_auth'] = self
        
        # Get Clerk secret key for JWT verification
        self.secret_key = app.config.get('CLERK_SECRET_KEY')
        if not self.secret_key:
            current_app.logger.warning("CLERK_SECRET_KEY not set - JWT verification will be skipped in development")
        
        # Initialize JWKS client for production
        clerk_domain = app.config.get('CLERK_DOMAIN')
        if clerk_domain and self.secret_key:
            jwks_url = f"https://{clerk_domain}/.well-known/jwks.json"
            self.jwks_client = PyJWKClient(jwks_url)
    
    def verify_token(self, token):
        """
        Verify Clerk JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            Dict containing user information if valid, None if invalid
        """
        if not self.secret_key:
            # Skip verification in development if no secret key
            current_app.logger.debug("Skipping JWT verification - no secret key configured")
            return {"user_id": "dev_user", "development_mode": True}
        
        try:
            # Get signing key
            if self.jwks_client:
                signing_key = self.jwks_client.get_signing_key_from_jwt(token)
                key = signing_key.key
            else:
                # Fallback to secret key for development
                key = self.secret_key
            
            # Verify and decode token
            payload = jwt.decode(
                token,
                key,
                algorithms=["RS256", "HS256"],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "require_exp": True,
                    "require_iat": True
                }
            )
            
            return {
                "user_id": payload.get("sub"),
                "session_id": payload.get("sid"),
                "issued_at": payload.get("iat"),
                "expires_at": payload.get("exp"),
                "payload": payload
            }
            
        except jwt.ExpiredSignatureError:
            current_app.logger.warning("JWT token has expired")
            return None
        except jwt.InvalidTokenError as e:
            current_app.logger.warning(f"Invalid JWT token: {str(e)}")
            return None
        except Exception as e:
            current_app.logger.error(f"JWT verification error: {str(e)}")
            return None
    
    def get_token_from_request(self):
        """Extract JWT token from Authorization header."""
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        # Expected format: "Bearer <token>"
        parts = auth_header.split()
        if len(parts) != 2 or parts[0] != 'Bearer':
            return None
            
        return parts[1]
    
    def authenticate_request(self):
        """
        Authenticate current Flask request.
        
        Returns:
            Dict containing authentication state
        """
        token = self.get_token_from_request()
        if not token:
            return {"authenticated": False, "reason": "No token provided"}
        
        user_info = self.verify_token(token)
        if not user_info:
            return {"authenticated": False, "reason": "Invalid or expired token"}
        
        return {
            "authenticated": True,
            "user_id": user_info.get("user_id"),
            "session_id": user_info.get("session_id"),
            "user_info": user_info
        }


def require_clerk_auth(f):
    """Decorator to require Clerk JWT authentication for API endpoints."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        clerk_jwt = current_app.extensions.get('clerk_jwt_auth')
        if not clerk_jwt:
            return jsonify({'error': 'Authentication not configured'}), 500
        
        auth_result = clerk_jwt.authenticate_request()
        if not auth_result.get("authenticated"):
            return jsonify({
                'error': 'Authentication required',
                'reason': auth_result.get("reason")
            }), 401
        
        # Store auth info in Flask g object for use in the endpoint
        g.clerk_user_id = auth_result.get("user_id")
        g.clerk_session_id = auth_result.get("session_id")
        g.clerk_user_info = auth_result.get("user_info")
        
        return f(*args, **kwargs)
    
    return decorated_function


def get_current_clerk_user_id():
    """Get current authenticated Clerk user ID."""
    return getattr(g, 'clerk_user_id', None)


def get_current_clerk_user_info():
    """Get current authenticated Clerk user information."""
    return getattr(g, 'clerk_user_info', None)