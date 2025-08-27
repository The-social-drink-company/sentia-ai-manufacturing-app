#!/usr/bin/env python3
"""
Script to create admin user for testing.
"""

from app import create_app, db
from app.models.user import User

def create_admin_user():
    """Create admin user for testing"""
    app = create_app()
    
    with app.app_context():
        # Check if admin already exists
        existing_admin = User.query.filter_by(username='admin').first()
        if existing_admin:
            print("Admin user already exists")
            return existing_admin
        
        # Create new admin user
        admin = User(
            username='admin',
            email='admin@test.com',
            role='admin',
            is_active=True
        )
        
        # Set a secure password
        admin.set_password('AdminTest123!')
        
        db.session.add(admin)
        db.session.commit()
        
        print(f"Created admin user: {admin.username}")
        print(f"Email: {admin.email}")
        print(f"Role: {admin.role}")
        
        return admin

if __name__ == '__main__':
    create_admin_user()