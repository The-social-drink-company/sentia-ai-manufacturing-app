from flask import Blueprint, render_template, redirect, url_for, request, flash, session, jsonify, current_app
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash, generate_password_hash
from urllib.parse import urlparse
import secrets
from datetime import datetime, timezone, timedelta

from app import db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.utils.security import rate_limit, log_user_activity, csrf_protect, admin_required, generate_csrf_token

bp = Blueprint('auth', __name__, url_prefix='/auth')

@bp.route('/login', methods=['GET', 'POST'])
@rate_limit(max_requests=10, window_seconds=300, per_user=False)  # 10 attempts per 5 minutes per IP
def login():
    if current_user.is_authenticated and not current_user.needs_password_change():
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        username_or_email = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        remember_me = bool(request.form.get('remember_me'))
        
        if not username_or_email or not password:
            flash('Username/email and password are required.', 'error')
            AuditLog.log_activity(
                activity_type='login_failed',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                details={'reason': 'missing_credentials', 'username': username_or_email},
                success=False
            )
            return render_template('auth/login.html', csrf_token=generate_csrf_token())
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username_or_email) | (User.email == username_or_email),
            User.is_active == True
        ).first()
        
        if not user:
            flash('Invalid username/email or password.', 'error')
            AuditLog.log_activity(
                activity_type='login_failed',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                details={'reason': 'user_not_found', 'username': username_or_email},
                success=False
            )
            return render_template('auth/login.html', csrf_token=generate_csrf_token())
        
        # Check if account is locked
        if user.is_account_locked():
            flash('Account is temporarily locked due to multiple failed login attempts.', 'error')
            AuditLog.log_activity(
                user_id=user.id,
                activity_type='login_failed',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                details={'reason': 'account_locked'},
                success=False
            )
            return render_template('auth/login.html', csrf_token=generate_csrf_token())
        
        # Verify password
        if not user.check_password(password):
            user.increment_failed_login()
            flash('Invalid username/email or password.', 'error')
            AuditLog.log_activity(
                user_id=user.id,
                activity_type='login_failed',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                details={'reason': 'invalid_password'},
                success=False
            )
            return render_template('auth/login.html', csrf_token=generate_csrf_token())
        
        # Update login information
        user.update_login_info(request.remote_addr)
        
        # Login user
        login_user(user, remember=remember_me, duration=timedelta(days=7 if remember_me else 1))
        
        # Generate session token for additional security
        user.generate_session_token(expiry_hours=24 if not remember_me else 168)
        db.session.commit()
        
        # Log successful login
        AuditLog.log_activity(
            user_id=user.id,
            activity_type='login_success',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            details={'remember_me': remember_me}
        )
        
        flash(f'Welcome back, {user.display_name or user.username}!', 'success')
        
        # Check if password change is needed
        if user.needs_password_change():
            flash('You must change your password before continuing.', 'warning')
            return redirect(url_for('auth.change_password'))
        
        # Redirect to next page or dashboard
        next_page = request.args.get('next')
        if not next_page or urlparse(next_page).netloc != '':
            next_page = url_for('main.dashboard')
        
        return redirect(next_page)
    
    return render_template('auth/login.html', csrf_token=generate_csrf_token())

@bp.route('/logout')
@login_required
@log_user_activity('logout')
def logout():
    if current_user.is_authenticated:
        current_user.clear_session()
        AuditLog.log_activity(
            user_id=current_user.id,
            activity_type='logout',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
    
    logout_user()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('main.index'))

@bp.route('/register', methods=['GET', 'POST'])
@admin_required
@rate_limit(max_requests=5, window_seconds=600)  # 5 registrations per 10 minutes
@log_user_activity('user_registration_attempt')
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip().lower()
        first_name = request.form.get('first_name', '').strip()
        last_name = request.form.get('last_name', '').strip()
        role = request.form.get('role', 'viewer').strip()
        department = request.form.get('department', '').strip()
        access_regions = request.form.getlist('access_regions')
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        # Validation
        errors = []
        
        if not username or len(username) < 3:
            errors.append('Username must be at least 3 characters long.')
        
        if User.query.filter_by(username=username).first():
            errors.append('Username already exists.')
        
        if not email or '@' not in email:
            errors.append('Valid email address is required.')
        
        if User.query.filter_by(email=email).first():
            errors.append('Email address already exists.')
        
        if role not in ['admin', 'manager', 'operator', 'viewer']:
            errors.append('Invalid role specified.')
        
        if not password:
            errors.append('Password is required.')
        elif not User.validate_password_strength(password):
            errors.append('Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.')
        
        if password != confirm_password:
            errors.append('Passwords do not match.')
        
        if errors:
            for error in errors:
                flash(error, 'error')
            return render_template('auth/register.html', 
                                 csrf_token=generate_csrf_token(),
                                 form_data=request.form)
        
        try:
            # Create new user
            user = User(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                department=department if department else None,
                access_regions=access_regions if access_regions else None,
                is_admin=(role == 'admin')
            )
            user.set_password(password)
            
            db.session.add(user)
            db.session.commit()
            
            AuditLog.log_activity(
                user_id=current_user.id,
                activity_type='user_created',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                details={
                    'created_user_id': str(user.id),
                    'created_username': username,
                    'created_role': role
                }
            )
            
            flash(f'User {username} has been created successfully.', 'success')
            return redirect(url_for('auth.user_management'))
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error creating user: {str(e)}")
            flash('An error occurred while creating the user. Please try again.', 'error')
    
    return render_template('auth/register.html', 
                         csrf_token=generate_csrf_token(),
                         regions=['UK', 'EU', 'USA'],
                         departments=['manufacturing', 'planning', 'sales', 'finance', 'quality'])

@bp.route('/change-password', methods=['GET', 'POST'])
@login_required
@rate_limit(max_requests=5, window_seconds=600)
def change_password():
    if request.method == 'POST':
        current_password = request.form.get('current_password', '')
        new_password = request.form.get('new_password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if not current_user.check_password(current_password):
            flash('Current password is incorrect.', 'error')
            return render_template('auth/change_password.html', csrf_token=generate_csrf_token())
        
        if not User.validate_password_strength(new_password):
            flash('New password must be at least 8 characters and contain uppercase, lowercase, number, and special character.', 'error')
            return render_template('auth/change_password.html', csrf_token=generate_csrf_token())
        
        if new_password != confirm_password:
            flash('New passwords do not match.', 'error')
            return render_template('auth/change_password.html', csrf_token=generate_csrf_token())
        
        if current_password == new_password:
            flash('New password must be different from current password.', 'error')
            return render_template('auth/change_password.html', csrf_token=generate_csrf_token())
        
        try:
            current_user.set_password(new_password)
            db.session.commit()
            
            AuditLog.log_activity(
                user_id=current_user.id,
                activity_type='password_changed',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            
            flash('Password changed successfully.', 'success')
            return redirect(url_for('main.dashboard'))
            
        except ValueError as e:
            flash(str(e), 'error')
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error changing password: {str(e)}")
            flash('An error occurred while changing password. Please try again.', 'error')
    
    return render_template('auth/change_password.html', csrf_token=generate_csrf_token())

@bp.route('/reset-password', methods=['GET', 'POST'])
@rate_limit(max_requests=3, window_seconds=600, per_user=False)  # 3 attempts per 10 minutes per IP
def reset_password():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        
        if not email:
            flash('Email address is required.', 'error')
            return render_template('auth/reset_password.html', csrf_token=generate_csrf_token())
        
        user = User.query.filter_by(email=email, is_active=True).first()
        
        if user:
            token = user.generate_password_reset_token()
            db.session.commit()
            
            # In a real application, you would send an email here
            # For now, we'll just flash the token (NOT recommended for production)
            flash(f'Password reset instructions have been sent to {email}.', 'info')
            
            AuditLog.log_activity(
                user_id=user.id,
                activity_type='password_reset_requested',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                details={'email': email}
            )
        else:
            # Don't reveal if email exists or not
            flash(f'If an account with email {email} exists, password reset instructions have been sent.', 'info')
        
        return redirect(url_for('auth.login'))
    
    return render_template('auth/reset_password.html', csrf_token=generate_csrf_token())

@bp.route('/reset-password/<token>', methods=['GET', 'POST'])
@rate_limit(max_requests=3, window_seconds=600, per_user=False)
def reset_password_token(token):
    user = User.query.filter_by(password_reset_token=token).first()
    
    if not user or not user.verify_password_reset_token(token):
        flash('Invalid or expired password reset token.', 'error')
        return redirect(url_for('auth.reset_password'))
    
    if request.method == 'POST':
        new_password = request.form.get('new_password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if not User.validate_password_strength(new_password):
            flash('Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.', 'error')
            return render_template('auth/reset_password_token.html', token=token, csrf_token=generate_csrf_token())
        
        if new_password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('auth/reset_password_token.html', token=token, csrf_token=generate_csrf_token())
        
        try:
            user.set_password(new_password)
            user.clear_password_reset_token()
            user.failed_login_attempts = 0
            user.account_locked_until = None
            db.session.commit()
            
            AuditLog.log_activity(
                user_id=user.id,
                activity_type='password_reset_completed',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            
            flash('Password has been reset successfully. You can now log in.', 'success')
            return redirect(url_for('auth.login'))
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error resetting password: {str(e)}")
            flash('An error occurred while resetting password. Please try again.', 'error')
    
    return render_template('auth/reset_password_token.html', token=token, csrf_token=generate_csrf_token())

@bp.route('/profile')
@login_required
def profile():
    return render_template('auth/profile.html', user=current_user)

@bp.route('/user-management')
@admin_required
@log_user_activity('access_user_management')
def user_management():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    
    users = User.query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return render_template('auth/user_management.html', users=users)

@bp.route('/user/<user_id>/toggle-active', methods=['POST'])
@admin_required
@log_user_activity('toggle_user_active')
def toggle_user_active(user_id):
    user = User.query.get_or_404(user_id)
    
    if user.id == current_user.id:
        flash('You cannot deactivate your own account.', 'error')
        return redirect(url_for('auth.user_management'))
    
    user.is_active = not user.is_active
    db.session.commit()
    
    AuditLog.log_activity(
        user_id=current_user.id,
        activity_type='user_status_changed',
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent'),
        details={
            'target_user_id': str(user.id),
            'target_username': user.username,
            'new_status': 'active' if user.is_active else 'inactive'
        }
    )
    
    status = 'activated' if user.is_active else 'deactivated'
    flash(f'User {user.username} has been {status}.', 'success')
    
    return redirect(url_for('auth.user_management'))

@bp.route('/user/<user_id>/unlock', methods=['POST'])
@admin_required
@log_user_activity('unlock_user_account')
def unlock_user_account(user_id):
    user = User.query.get_or_404(user_id)
    
    user.unlock_account()
    
    AuditLog.log_activity(
        user_id=current_user.id,
        activity_type='user_account_unlocked',
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent'),
        details={
            'target_user_id': str(user.id),
            'target_username': user.username
        }
    )
    
    flash(f'User account {user.username} has been unlocked.', 'success')
    return redirect(url_for('auth.user_management'))

# Context processor to make CSRF token available in templates
@bp.app_context_processor
def inject_csrf_token():
    return dict(csrf_token=generate_csrf_token)