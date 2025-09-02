"""
WSGI entry point for production deployment.
Optimized for Railway and other cloud platforms.
"""

import os
from app import create_app
from config import config

# Get configuration from environment
config_name = os.environ.get('FLASK_CONFIG', 'production')
app = create_app(config[config_name])

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)