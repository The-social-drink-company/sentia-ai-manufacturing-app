from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_login import LoginManager
from config import Config

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
        Job, Schedule, Resource, DataImport, ImportError, ImportLog, ImportTemplate
    )
    
    from app.routes import main, api, auth, data_import
    app.register_blueprint(main.bp)
    app.register_blueprint(api.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(data_import.bp)
    
    # Register CLI commands
    from app import cli
    cli.init_app(app)
    
    return app