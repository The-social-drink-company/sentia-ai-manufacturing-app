"""
Admin portal routes for system management and configuration
"""
import psutil
import os
import json
from datetime import datetime, timedelta
from flask import Blueprint, render_template, request, jsonify, current_app, flash, redirect, url_for
from flask_login import login_required, current_user
from functools import wraps
from sqlalchemy import func, desc, asc
from app import db
from app.models import (
    User, SystemAlert, SystemMetric, SecurityEvent, MaintenanceWindow, BackupRecord,
    SystemSettings, ApiIntegration, IntegrationSyncLog, AuditLog,
    AlertType, AlertStatus
)

bp = Blueprint('admin', __name__, url_prefix='/admin')


def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('Admin access required.', 'error')
            return redirect(url_for('main.dashboard'))
        return f(*args, **kwargs)
    return decorated_function


@bp.route('/')
@login_required
@admin_required
def dashboard():
    """Admin dashboard with system overview"""
    
    # System health metrics
    cpu_usage = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Database metrics
    total_users = User.query.count()
    active_users = User.query.filter(User.is_active == True).count()
    total_integrations = ApiIntegration.query.count()
    active_integrations = ApiIntegration.query.filter(ApiIntegration.status == 'active').count()
    
    # Recent alerts
    recent_alerts = SystemAlert.query.filter(
        SystemAlert.status != AlertStatus.DISMISSED
    ).order_by(desc(SystemAlert.created_at)).limit(10).all()
    
    # Failed sync count today
    today = datetime.utcnow().date()
    failed_syncs_today = IntegrationSyncLog.query.filter(
        func.date(IntegrationSyncLog.started_at) == today,
        IntegrationSyncLog.status == 'failed'
    ).count()
    
    # System metrics for charts
    metrics_24h = SystemMetric.query.filter(
        SystemMetric.recorded_at >= datetime.utcnow() - timedelta(hours=24)
    ).order_by(SystemMetric.recorded_at.desc()).all()
    
    # Recent security events
    security_events = SecurityEvent.query.filter(
        SecurityEvent.occurred_at >= datetime.utcnow() - timedelta(hours=24)
    ).order_by(desc(SecurityEvent.occurred_at)).limit(10).all()
    
    # Error rate calculation
    total_requests_today = 1000  # This would come from application metrics
    error_requests_today = len([e for e in security_events if e.risk_level >= 3])
    error_rate = (error_requests_today / total_requests_today * 100) if total_requests_today > 0 else 0
    
    return render_template('admin/dashboard.html',
                         cpu_usage=cpu_usage,
                         memory_usage=memory.percent,
                         disk_usage=disk.percent,
                         total_users=total_users,
                         active_users=active_users,
                         total_integrations=total_integrations,
                         active_integrations=active_integrations,
                         recent_alerts=recent_alerts,
                         failed_syncs_today=failed_syncs_today,
                         metrics=metrics_24h,
                         security_events=security_events,
                         error_rate=error_rate)


@bp.route('/users')
@login_required
@admin_required
def user_management():
    """User management interface"""
    page = request.args.get('page', 1, type=int)
    per_page = 20
    
    search = request.args.get('search', '')
    role_filter = request.args.get('role', 'all')
    status_filter = request.args.get('status', 'all')
    
    query = User.query
    
    if search:
        query = query.filter(
            User.username.contains(search) | 
            User.email.contains(search) |
            User.full_name.contains(search)
        )
    
    if role_filter != 'all':
        if role_filter == 'admin':
            query = query.filter(User.is_admin == True)
        elif role_filter == 'user':
            query = query.filter(User.is_admin == False)
    
    if status_filter != 'all':
        if status_filter == 'active':
            query = query.filter(User.is_active == True)
        elif status_filter == 'inactive':
            query = query.filter(User.is_active == False)
    
    users = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # User statistics
    user_stats = {
        'total': User.query.count(),
        'active': User.query.filter(User.is_active == True).count(),
        'admin': User.query.filter(User.is_admin == True).count(),
        'registered_this_month': User.query.filter(
            User.created_at >= datetime.utcnow().replace(day=1)
        ).count()
    }
    
    return render_template('admin/user_management.html',
                         users=users,
                         user_stats=user_stats,
                         search=search,
                         role_filter=role_filter,
                         status_filter=status_filter)


@bp.route('/users/<int:user_id>/toggle-status', methods=['POST'])
@login_required
@admin_required
def toggle_user_status(user_id):
    """Toggle user active status"""
    user = User.query.get_or_404(user_id)
    
    if user.id == current_user.id:
        return jsonify({'success': False, 'message': 'Cannot deactivate your own account'})
    
    user.is_active = not user.is_active
    db.session.commit()
    
    # Log the action
    AuditLog.log_action(
        user_id=current_user.id,
        action=f"{'activated' if user.is_active else 'deactivated'} user {user.username}",
        resource_type='User',
        resource_id=user.id
    )
    
    return jsonify({
        'success': True, 
        'message': f"User {'activated' if user.is_active else 'deactivated'} successfully",
        'is_active': user.is_active
    })


@bp.route('/users/<int:user_id>/toggle-admin', methods=['POST'])
@login_required
@admin_required
def toggle_user_admin(user_id):
    """Toggle user admin status"""
    user = User.query.get_or_404(user_id)
    
    if user.id == current_user.id:
        return jsonify({'success': False, 'message': 'Cannot modify your own admin status'})
    
    user.is_admin = not user.is_admin
    db.session.commit()
    
    # Log the action
    AuditLog.log_action(
        user_id=current_user.id,
        action=f"{'granted' if user.is_admin else 'revoked'} admin privileges for user {user.username}",
        resource_type='User',
        resource_id=user.id
    )
    
    return jsonify({
        'success': True, 
        'message': f"Admin privileges {'granted' if user.is_admin else 'revoked'} successfully",
        'is_admin': user.is_admin
    })


@bp.route('/system-config')
@login_required
@admin_required
def system_configuration():
    """System configuration interface"""
    settings = SystemSettings.query.all()
    settings_dict = {s.key: s for s in settings}
    
    return render_template('admin/system_configuration.html', settings=settings_dict)


@bp.route('/system-config/update', methods=['POST'])
@login_required
@admin_required
def update_system_config():
    """Update system configuration"""
    data = request.get_json()
    
    try:
        for key, value in data.items():
            setting = SystemSettings.query.filter_by(key=key).first()
            if setting:
                setting.value = str(value)
                setting.updated_by_id = current_user.id
            else:
                setting = SystemSettings(
                    key=key,
                    value=str(value),
                    created_by_id=current_user.id,
                    updated_by_id=current_user.id
                )
                db.session.add(setting)
        
        db.session.commit()
        
        # Log the action
        AuditLog.log_action(
            user_id=current_user.id,
            action=f"Updated system configuration: {list(data.keys())}",
            resource_type='SystemSettings'
        )
        
        return jsonify({'success': True, 'message': 'Configuration updated successfully'})
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating system configuration: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update configuration'}), 500


@bp.route('/alerts')
@login_required
@admin_required
def system_alerts():
    """System alerts management"""
    page = request.args.get('page', 1, type=int)
    per_page = 20
    
    alert_type = request.args.get('type', 'all')
    status = request.args.get('status', 'all')
    
    query = SystemAlert.query
    
    if alert_type != 'all':
        query = query.filter(SystemAlert.alert_type == alert_type)
    
    if status != 'all':
        query = query.filter(SystemAlert.status == status)
    
    alerts = query.order_by(desc(SystemAlert.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Alert statistics
    alert_stats = {
        'total': SystemAlert.query.count(),
        'unread': SystemAlert.query.filter(SystemAlert.status == AlertStatus.UNREAD).count(),
        'critical': SystemAlert.query.filter(SystemAlert.severity >= 4).count(),
        'today': SystemAlert.query.filter(
            func.date(SystemAlert.created_at) == datetime.utcnow().date()
        ).count()
    }
    
    return render_template('admin/alerts.html',
                         alerts=alerts,
                         alert_stats=alert_stats,
                         alert_type=alert_type,
                         status=status)


@bp.route('/alerts/<int:alert_id>/mark-read', methods=['POST'])
@login_required
@admin_required
def mark_alert_read(alert_id):
    """Mark alert as read"""
    alert = SystemAlert.query.get_or_404(alert_id)
    alert.mark_read()
    
    return jsonify({'success': True, 'message': 'Alert marked as read'})


@bp.route('/alerts/<int:alert_id>/dismiss', methods=['POST'])
@login_required
@admin_required
def dismiss_alert(alert_id):
    """Dismiss alert"""
    alert = SystemAlert.query.get_or_404(alert_id)
    alert.dismiss()
    
    return jsonify({'success': True, 'message': 'Alert dismissed'})


@bp.route('/security')
@login_required
@admin_required
def security_monitoring():
    """Security monitoring interface"""
    page = request.args.get('page', 1, type=int)
    per_page = 50
    
    event_type = request.args.get('event_type', 'all')
    risk_level = request.args.get('risk_level', 'all')
    
    query = SecurityEvent.query
    
    if event_type != 'all':
        query = query.filter(SecurityEvent.event_type == event_type)
    
    if risk_level != 'all':
        query = query.filter(SecurityEvent.risk_level == int(risk_level))
    
    events = query.order_by(desc(SecurityEvent.occurred_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Security statistics
    security_stats = {
        'total_today': SecurityEvent.query.filter(
            func.date(SecurityEvent.occurred_at) == datetime.utcnow().date()
        ).count(),
        'high_risk': SecurityEvent.query.filter(SecurityEvent.risk_level >= 3).count(),
        'blocked': SecurityEvent.query.filter(SecurityEvent.blocked == True).count(),
        'unique_ips_today': db.session.query(SecurityEvent.ip_address).filter(
            func.date(SecurityEvent.occurred_at) == datetime.utcnow().date()
        ).distinct().count()
    }
    
    return render_template('admin/security.html',
                         events=events,
                         security_stats=security_stats,
                         event_type=event_type,
                         risk_level=risk_level)


@bp.route('/maintenance')
@login_required
@admin_required
def maintenance_management():
    """Maintenance window management"""
    windows = MaintenanceWindow.query.order_by(desc(MaintenanceWindow.scheduled_start)).all()
    
    return render_template('admin/maintenance.html', windows=windows)


@bp.route('/maintenance/create', methods=['POST'])
@login_required
@admin_required
def create_maintenance_window():
    """Create new maintenance window"""
    data = request.get_json()
    
    try:
        window = MaintenanceWindow(
            title=data['title'],
            description=data.get('description'),
            scheduled_start=datetime.fromisoformat(data['scheduled_start']),
            scheduled_end=datetime.fromisoformat(data['scheduled_end']),
            created_by_id=current_user.id
        )
        
        db.session.add(window)
        db.session.commit()
        
        # Log the action
        AuditLog.log_action(
            user_id=current_user.id,
            action=f"Created maintenance window: {window.title}",
            resource_type='MaintenanceWindow',
            resource_id=window.id
        )
        
        return jsonify({'success': True, 'message': 'Maintenance window created successfully'})
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating maintenance window: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to create maintenance window'}), 500


@bp.route('/backups')
@login_required
@admin_required
def backup_management():
    """Backup management interface"""
    backups = BackupRecord.query.order_by(desc(BackupRecord.started_at)).limit(50).all()
    
    backup_stats = {
        'total': BackupRecord.query.count(),
        'successful': BackupRecord.query.filter(BackupRecord.status == 'completed').count(),
        'failed': BackupRecord.query.filter(BackupRecord.status == 'failed').count(),
        'this_week': BackupRecord.query.filter(
            BackupRecord.started_at >= datetime.utcnow() - timedelta(days=7)
        ).count()
    }
    
    return render_template('admin/backups.html', backups=backups, backup_stats=backup_stats)


@bp.route('/metrics/system', methods=['GET'])
@login_required
@admin_required
def get_system_metrics():
    """Get current system metrics"""
    try:
        # Collect current system metrics
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Store metrics in database
        metrics = [
            SystemMetric(metric_name='cpu_usage', metric_value=cpu_usage, unit='%', source='system'),
            SystemMetric(metric_name='memory_usage', metric_value=memory.percent, unit='%', source='system'),
            SystemMetric(metric_name='disk_usage', metric_value=disk.percent, unit='%', source='system'),
            SystemMetric(metric_name='memory_available', metric_value=memory.available / 1024 / 1024, unit='MB', source='system'),
        ]
        
        for metric in metrics:
            db.session.add(metric)
        db.session.commit()
        
        return jsonify({
            'cpu_usage': cpu_usage,
            'memory_usage': memory.percent,
            'memory_available_mb': memory.available / 1024 / 1024,
            'disk_usage': disk.percent,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error collecting system metrics: {str(e)}")
        return jsonify({'error': 'Failed to collect metrics'}), 500


@bp.route('/metrics/history', methods=['GET'])
@login_required
@admin_required
def get_metrics_history():
    """Get historical metrics data"""
    hours = int(request.args.get('hours', 24))
    metric_name = request.args.get('metric_name', 'cpu_usage')
    
    since = datetime.utcnow() - timedelta(hours=hours)
    
    metrics = SystemMetric.query.filter(
        SystemMetric.metric_name == metric_name,
        SystemMetric.recorded_at >= since
    ).order_by(SystemMetric.recorded_at).all()
    
    return jsonify({
        'metrics': [m.to_dict() for m in metrics],
        'metric_name': metric_name,
        'hours': hours
    })


@bp.route('/logs')
@login_required
@admin_required
def system_logs():
    """System logs viewer"""
    page = request.args.get('page', 1, type=int)
    per_page = 100
    
    log_level = request.args.get('level', 'all')
    search = request.args.get('search', '')
    
    # For now, show audit logs. In production, you'd integrate with actual log files
    query = AuditLog.query
    
    if search:
        query = query.filter(AuditLog.action.contains(search))
    
    logs = query.order_by(desc(AuditLog.timestamp)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return render_template('admin/logs.html',
                         logs=logs,
                         log_level=log_level,
                         search=search)