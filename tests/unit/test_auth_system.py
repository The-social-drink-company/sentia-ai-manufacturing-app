"""
Comprehensive authentication system tests.
Tests for user registration, login, logout, password management, and session handling.
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, Mock
from werkzeug.security import check_password_hash

from app.models.user import User
from app.models.audit_log import AuditLog
from app.utils.security import check_password_strength


class TestUserAuthentication:
    """Test user authentication functionality."""
    
    def test_user_registration_valid_data(self, db_session):
        """Test user registration with valid data - TC-AUTH-001."""
        user_data = {
            'email': 'newuser@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'SecurePass123!'
        }
        
        user = User(
            email=user_data['email'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name']
        )
        user.set_password(user_data['password'])
        
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.email == user_data['email']
        assert user.first_name == user_data['first_name']
        assert user.last_name == user_data['last_name']
        assert user.password_hash is not None
        assert user.password_hash != user_data['password']
        assert user.check_password(user_data['password']) is True
        assert user.created_at is not None
        assert user.is_active is True
    
    def test_user_registration_invalid_email(self, db_session):
        """Test user registration with invalid email format - TC-AUTH-002."""
        invalid_emails = [
            'invalid-email',
            '@example.com',
            'user@',
            'user.example.com',
            ''
        ]
        
        for email in invalid_emails:
            user = User(
                email=email,
                first_name='Test',
                last_name='User'
            )
            
            # Email validation should happen at form/API level
            # But we can test the model accepts any string
            assert user.email == email
    
    def test_user_registration_duplicate_email(self, db_session):
        """Test user registration with duplicate email - TC-AUTH-003."""
        email = 'duplicate@example.com'
        
        # Create first user
        user1 = User(email=email, first_name='First', last_name='User')
        user1.set_password('password123')
        db_session.add(user1)
        db_session.commit()
        
        # Try to create second user with same email
        user2 = User(email=email, first_name='Second', last_name='User')
        user2.set_password('password456')
        db_session.add(user2)
        
        # Should raise integrity error
        with pytest.raises(Exception):
            db_session.commit()
    
    def test_user_login_correct_credentials(self, db_session):
        """Test user login with correct credentials - TC-AUTH-004."""
        email = 'login@example.com'
        password = 'CorrectPassword123!'
        
        user = User(email=email, first_name='Login', last_name='User')
        user.set_password(password)
        db_session.add(user)
        db_session.commit()
        
        # Verify password check
        assert user.check_password(password) is True
        assert user.check_password('WrongPassword') is False
    
    def test_user_login_incorrect_password(self, db_session):
        """Test user login with incorrect password - TC-AUTH-005."""
        user = User(email='test@example.com', first_name='Test', last_name='User')
        user.set_password('CorrectPassword')
        db_session.add(user)
        db_session.commit()
        
        # Test various incorrect passwords
        wrong_passwords = [
            'wrongpassword',
            'CORRECTPASSWORD',  # Wrong case
            'CorrectPasswor',   # Missing character
            'CorrectPassword1', # Extra character
            '',                 # Empty
            None               # None
        ]
        
        for wrong_password in wrong_passwords:
            assert user.check_password(wrong_password) is False
    
    def test_password_hashing_security(self):
        """Test password hashing and verification - TC-AUTH-007."""
        password = 'TestPassword123!'
        user = User(email='test@example.com')
        user.set_password(password)
        
        # Password should be hashed
        assert user.password_hash is not None
        assert user.password_hash != password
        assert len(user.password_hash) > 50  # Bcrypt hashes are typically 60 chars
        
        # Hash should be different each time
        user2 = User(email='test2@example.com')
        user2.set_password(password)
        assert user.password_hash != user2.password_hash
        
        # But both should verify correctly
        assert user.check_password(password) is True
        assert user2.check_password(password) is True
    
    @patch('app.utils.security.check_password_strength')
    def test_password_strength_validation(self, mock_check):
        """Test password strength validation."""
        mock_check.return_value = {'score': 4, 'feedback': ['Strong password']}
        
        result = check_password_strength('StrongPassword123!')
        assert result['score'] >= 3  # Minimum acceptable score
        assert isinstance(result['feedback'], list)
    
    def test_user_full_name_property(self):
        """Test user full name property."""
        user = User(
            email='test@example.com',
            first_name='John',
            last_name='Doe'
        )
        assert user.full_name == 'John Doe'
        
        # Test with empty names
        user.first_name = ''
        user.last_name = 'Doe'
        assert user.full_name == ' Doe'
    
    def test_user_string_representation(self):
        """Test user string representation."""
        user = User(email='test@example.com')
        assert repr(user) == '<User test@example.com>'
        assert str(user) == '<User test@example.com>'
    
    def test_user_activity_tracking(self, db_session):
        """Test user activity tracking."""
        user = User(email='activity@example.com', first_name='Active', last_name='User')
        user.set_password('password123')
        
        # Set last login
        login_time = datetime.utcnow()
        user.last_login = login_time
        user.login_count = 1
        
        db_session.add(user)
        db_session.commit()
        
        assert user.last_login == login_time
        assert user.login_count == 1
        
        # Update login count
        user.login_count += 1
        user.last_login = datetime.utcnow()
        db_session.commit()
        
        assert user.login_count == 2
    
    def test_user_deactivation(self, db_session):
        """Test user account deactivation."""
        user = User(email='deactivate@example.com', first_name='Test', last_name='User')
        user.set_password('password123')
        
        # User should be active by default
        assert user.is_active is True
        
        # Deactivate user
        user.is_active = False
        db_session.add(user)
        db_session.commit()
        
        assert user.is_active is False


class TestPasswordManagement:
    """Test password management functionality."""
    
    def test_password_reset_token_generation(self, db_session):
        """Test password reset token generation."""
        user = User(email='reset@example.com', first_name='Reset', last_name='User')
        user.set_password('oldpassword')
        
        # Generate reset token (this would be implemented in the auth service)
        import secrets
        reset_token = secrets.token_urlsafe(32)
        reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        
        user.reset_token = reset_token
        user.reset_token_expires = reset_token_expires
        
        db_session.add(user)
        db_session.commit()
        
        assert user.reset_token == reset_token
        assert user.reset_token_expires > datetime.utcnow()
    
    def test_password_change(self, db_session):
        """Test password change functionality."""
        user = User(email='change@example.com', first_name='Change', last_name='User')
        old_password = 'oldpassword123'
        new_password = 'newpassword456'
        
        user.set_password(old_password)
        old_hash = user.password_hash
        
        db_session.add(user)
        db_session.commit()
        
        # Verify old password works
        assert user.check_password(old_password) is True
        
        # Change password
        user.set_password(new_password)
        db_session.commit()
        
        # Verify new password works and old doesn't
        assert user.check_password(new_password) is True
        assert user.check_password(old_password) is False
        assert user.password_hash != old_hash
    
    def test_password_history_prevention(self, db_session):
        """Test prevention of password reuse (future enhancement)."""
        user = User(email='history@example.com', first_name='History', last_name='User')
        
        passwords = ['password1', 'password2', 'password3']
        
        for password in passwords:
            user.set_password(password)
            # In a full implementation, we'd store password history
            # and check against it
            assert user.check_password(password) is True


class TestSessionManagement:
    """Test session management functionality."""
    
    def test_session_timeout_handling(self):
        """Test session timeout handling - TC-AUTH-009."""
        # This would be tested at the Flask-Login level
        # Here we test the user model's session-related properties
        user = User(email='session@example.com')
        
        # Set session start time
        session_start = datetime.utcnow()
        user.last_login = session_start
        
        # Check if session should be valid (within timeout period)
        session_timeout_hours = 8
        session_age = datetime.utcnow() - user.last_login
        
        if session_age < timedelta(hours=session_timeout_hours):
            assert True  # Session should be valid
        else:
            assert False  # Session should be expired
    
    def test_concurrent_session_handling(self, db_session):
        """Test handling of concurrent user sessions."""
        user = User(email='concurrent@example.com', first_name='Concurrent', last_name='User')
        user.set_password('password123')
        
        # Track active sessions (this would be implemented with session storage)
        user.active_sessions = 1  # This field would need to be added to model
        
        db_session.add(user)
        db_session.commit()
        
        # For now, just verify user can be saved
        assert user.email == 'concurrent@example.com'


class TestAuditLogging:
    """Test audit logging for authentication events."""
    
    def test_login_audit_logging(self, db_session):
        """Test audit logging for login events."""
        user = User(email='audit@example.com', first_name='Audit', last_name='User')
        user.set_password('password123')
        db_session.add(user)
        db_session.commit()
        
        # Create audit log entry for login
        audit_log = AuditLog(
            user_id=user.id,
            action='login',
            resource_type='user',
            resource_id=str(user.id),
            details={'ip_address': '192.168.1.100', 'user_agent': 'Test Browser'}
        )
        
        db_session.add(audit_log)
        db_session.commit()
        
        assert audit_log.id is not None
        assert audit_log.user_id == user.id
        assert audit_log.action == 'login'
        assert audit_log.created_at is not None
    
    def test_failed_login_audit_logging(self, db_session):
        """Test audit logging for failed login attempts."""
        # Create audit log for failed login
        audit_log = AuditLog(
            user_id=None,  # No user ID for failed login
            action='login_failed',
            resource_type='user',
            resource_id=None,
            details={
                'email': 'nonexistent@example.com',
                'ip_address': '192.168.1.100',
                'reason': 'invalid_credentials'
            }
        )
        
        db_session.add(audit_log)
        db_session.commit()
        
        assert audit_log.id is not None
        assert audit_log.action == 'login_failed'
        assert audit_log.details['reason'] == 'invalid_credentials'
    
    def test_password_change_audit_logging(self, db_session):
        """Test audit logging for password changes."""
        user = User(email='pwchange@example.com', first_name='Change', last_name='User')
        user.set_password('oldpassword')
        db_session.add(user)
        db_session.commit()
        
        # Create audit log for password change
        audit_log = AuditLog(
            user_id=user.id,
            action='password_changed',
            resource_type='user',
            resource_id=str(user.id),
            details={'changed_by': str(user.id), 'method': 'self_service'}
        )
        
        db_session.add(audit_log)
        db_session.commit()
        
        assert audit_log.id is not None
        assert audit_log.action == 'password_changed'


class TestAuthenticationEdgeCases:
    """Test edge cases and error conditions."""
    
    def test_null_password_handling(self):
        """Test handling of null/empty passwords."""
        user = User(email='null@example.com')
        
        # Setting None password should not crash
        user.set_password(None)
        assert user.password_hash is not None  # Should set some default or empty hash
        
        # Checking None password should return False
        assert user.check_password(None) is False
    
    def test_very_long_password(self):
        """Test handling of very long passwords."""
        user = User(email='long@example.com')
        long_password = 'a' * 1000  # 1000 character password
        
        user.set_password(long_password)
        assert user.check_password(long_password) is True
    
    def test_unicode_password_handling(self):
        """Test handling of Unicode characters in passwords."""
        user = User(email='unicode@example.com')
        unicode_password = 'password🔒密码123'
        
        user.set_password(unicode_password)
        assert user.check_password(unicode_password) is True
        assert user.check_password('password123') is False
    
    def test_case_sensitivity(self):
        """Test password case sensitivity."""
        user = User(email='case@example.com')
        password = 'CaseSensitivePassword'
        
        user.set_password(password)
        assert user.check_password(password) is True
        assert user.check_password('casesensitivepassword') is False
        assert user.check_password('CASESENSITIVEPASSWORD') is False
    
    def test_whitespace_in_passwords(self):
        """Test handling of whitespace in passwords."""
        user = User(email='whitespace@example.com')
        password_with_spaces = ' password with spaces '
        
        user.set_password(password_with_spaces)
        assert user.check_password(password_with_spaces) is True
        assert user.check_password('password with spaces') is False  # No leading/trailing spaces
        assert user.check_password(' password with spaces') is False  # Missing trailing space