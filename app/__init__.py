from flask import Flask, send_from_directory, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_login import LoginManager
from config import Config
import os

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()

def create_app(config_class=Config):
    # Configure Flask to serve React build files
    app = Flask(__name__, static_folder='../dist', static_url_path='')
    app.config.from_object(config_class)
    
    db.init_app(app)
    migrate.init_app(app, db)
    # Configure CORS for React frontend with dynamic origins
    cors_origins = app.config.get('CORS_ORIGINS', ['http://localhost:3000', 'http://127.0.0.1:3000'])
    CORS(app, origins=cors_origins)
    
    # Initialize Clerk JWT authentication for API endpoints
    from app.auth.clerk_jwt_auth import ClerkJWTAuth
    clerk_jwt_auth = ClerkJWTAuth()
    clerk_jwt_auth.init_app(app)
    
    # Removed Flask-Login user loader - authentication handled by Clerk React
    
    # Import models so Flask-Migrate can detect them
    from app.models import (
        User, ClerkUser, Product, Market, SalesChannel, HistoricalSales,
        Forecast, InventoryLevel, WorkingCapital, SystemSettings,
        Job, Schedule, Resource, DataImport, ImportError, ImportLog, ImportTemplate,
        ApiCredential, ApiIntegration, IntegrationSyncLog, WebhookEvent, IntegrationHealth,
        SystemAlert, SystemMetric, SecurityEvent, MaintenanceWindow, BackupRecord
    )
    
    from app.routes import api, data_import, api_integrations, admin
    # Removed main and auth blueprints - frontend handled by React
    app.register_blueprint(api.bp)
    app.register_blueprint(data_import.bp)
    app.register_blueprint(api_integrations.bp)
    app.register_blueprint(admin.bp)
    
    # Serve React SPA - catch-all route for React Router
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react_app(path):
        # Serve static files from dist directory
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        # Fallback to index.html for React Router
        return send_file(os.path.join(app.static_folder, 'index.html'))
    
    # Register CLI commands
    from app import cli
    from app.cli_integrations import register_cli_commands
    cli.init_app(app)
    register_cli_commands(app)
    
    # Initialize middleware
    from app.middleware import init_middleware
    init_middleware(app)
    
    # Initialize monitoring
    from app.monitoring import init_monitoring
    init_monitoring(app)
    
    # Create logs directory for production
    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')
    
    # Initialize config-specific settings
    config_class.init_app(app)
    
    return app