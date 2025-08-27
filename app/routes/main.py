from flask import Blueprint, render_template, redirect, url_for
from flask_login import login_required, current_user
from app.utils.security import require_permission, log_user_activity

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return render_template('index.html')

@bp.route('/dashboard')
@login_required
@require_permission('read')
@log_user_activity('dashboard_access')
def dashboard():
    return render_template('dashboard.html')

@bp.route('/schedule')
@login_required
@require_permission('manufacturing')
@log_user_activity('schedule_access')
def schedule():
    return render_template('schedule.html')