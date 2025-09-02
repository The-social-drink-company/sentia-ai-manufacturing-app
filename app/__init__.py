from flask import Flask
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
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)
    
    # Initialize Flask-Login
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    login_manager.session_protection = 'strong'
    
    @login_manager.user_loader
    def load_user(user_id):
        from app.models.user import User
        return User.query.get(user_id)
    
    # Import models so Flask-Migrate can detect them
    from app.models import (
        User, Product, Market, SalesChannel, HistoricalSales,
        Forecast, InventoryLevel, WorkingCapital, SystemSettings,
        Job, Schedule, Resource, DataImport, ImportError, ImportLog, ImportTemplate,
        ApiCredential, ApiIntegration, IntegrationSyncLog, WebhookEvent, IntegrationHealth,
        SystemAlert, SystemMetric, SecurityEvent, MaintenanceWindow, BackupRecord
    )
    
    from app.routes import main, api, auth, data_import, api_integrations, admin
    app.register_blueprint(main.bp)
    app.register_blueprint(api.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(data_import.bp)
    app.register_blueprint(api_integrations.bp)
    app.register_blueprint(admin.bp)
    
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