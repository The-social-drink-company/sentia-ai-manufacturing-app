from flask import Blueprint, render_template, redirect, url_for, request, flash
from werkzeug.security import check_password_hash, generate_password_hash

bp = Blueprint('auth', __name__, url_prefix='/auth')

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        return redirect(url_for('main.dashboard'))
    return render_template('auth/login.html')

@bp.route('/logout')
def logout():
    return redirect(url_for('main.index'))

@bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        return redirect(url_for('auth.login'))
    return render_template('auth/register.html')