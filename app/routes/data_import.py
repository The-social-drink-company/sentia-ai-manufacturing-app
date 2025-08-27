from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime, timezone
import threading
import uuid

from app import db
from app.models.data_import import DataImport, ImportError, ImportLog, ImportTemplate, ImportStatus, ImportType, FileType
from app.utils.import_processor import ImportProcessor, FileUploadHandler
from app.utils.security import require_permission, log_user_activity
from app.utils.validation import create_product_validator, create_sales_validator

bp = Blueprint('data_import', __name__, url_prefix='/data-import')

@bp.route('/')
@login_required
@require_permission('data_import')
@log_user_activity('data_import_access')
def index():
    """Data import dashboard"""
    # Get recent imports
    recent_imports = DataImport.query.filter_by(created_by=current_user.id)\
        .order_by(DataImport.created_at.desc())\
        .limit(10).all()
    
    # Get import statistics
    total_imports = DataImport.query.filter_by(created_by=current_user.id).count()
    successful_imports = DataImport.query.filter_by(created_by=current_user.id, status=ImportStatus.COMPLETED).count()
    failed_imports = DataImport.query.filter_by(created_by=current_user.id, status=ImportStatus.FAILED).count()
    
    stats = {
        'total': total_imports,
        'successful': successful_imports,
        'failed': failed_imports,
        'success_rate': (successful_imports / total_imports * 100) if total_imports > 0 else 0
    }
    
    return render_template('data_import/index.html', 
                         recent_imports=recent_imports, 
                         stats=stats)

@bp.route('/upload', methods=['GET', 'POST'])
@login_required
@require_permission('data_import')
@log_user_activity('data_import_upload')
def upload():
    """Handle file upload and processing"""
    if request.method == 'GET':
        return render_template('data_import/upload.html')
    
    try:
        # Get form data
        import_name = request.form.get('import_name')
        import_type = request.form.get('import_type')
        import_description = request.form.get('import_description', '')
        action = request.form.get('action', 'import')  # 'validate' or 'import'
        
        # Validation settings
        skip_validation = request.form.get('skip_validation') == 'on'
        check_duplicates = request.form.get('check_duplicates') == 'on'
        auto_correct = request.form.get('auto_correct') == 'on'
        error_threshold = int(request.form.get('error_threshold', 10))
        
        # Validate required fields
        if not import_name or not import_type:
            return jsonify({
                'success': False,
                'error': 'Import name and type are required'
            }), 400
        
        # Get uploaded files
        files = request.files.getlist('files')
        if not files or not files[0].filename:
            return jsonify({
                'success': False,
                'error': 'No files uploaded'
            }), 400
        
        # Initialize file handler
        upload_folder = os.path.join(current_app.instance_path, 'uploads')
        file_handler = FileUploadHandler(upload_folder)
        
        results = []
        
        for file in files:
            if file.filename:
                try:
                    # Save file
                    file_path, file_hash, file_size = file_handler.save_uploaded_file(file, import_type)
                    file_type = file_handler.get_file_type(file.filename)
                    
                    if action == 'validate':
                        # Just validate and preview
                        preview_data = file_handler.preview_file_data(file_path, file_type)
                        validation_result = _validate_file_data(file_path, file_type, import_type)
                        
                        results.append({
                            'filename': file.filename,
                            'preview': preview_data,
                            'validation': validation_result,
                            'success': True
                        })
                    else:
                        # Create import record and start processing
                        data_import = DataImport(
                            import_name=f"{import_name} - {file.filename}",
                            import_type=ImportType(import_type),
                            import_description=import_description,
                            original_filename=file.filename,
                            file_type=file_type,
                            file_path=file_path,
                            file_size_bytes=file_size,
                            file_hash=file_hash,
                            import_settings={
                                'skip_validation': skip_validation,
                                'check_duplicates': check_duplicates,
                                'auto_correct': auto_correct,
                                'error_threshold': error_threshold
                            },
                            created_by=current_user.id
                        )
                        
                        db.session.add(data_import)
                        db.session.commit()
                        
                        # Start background processing
                        _start_background_import(str(data_import.id))
                        
                        results.append({
                            'filename': file.filename,
                            'import_id': str(data_import.id),
                            'success': True
                        })
                
                except Exception as e:
                    results.append({
                        'filename': file.filename,
                        'error': str(e),
                        'success': False
                    })
        
        if action == 'validate':
            # Return validation results
            return jsonify({
                'success': True,
                'results': results
            })
        else:
            # Return import IDs for progress tracking
            if len(results) == 1:
                return jsonify({
                    'success': True,
                    'import_id': results[0].get('import_id'),
                    'redirect_url': url_for('data_import.progress', import_id=results[0].get('import_id'))
                })
            else:
                return jsonify({
                    'success': True,
                    'results': results,
                    'redirect_url': url_for('data_import.history')
                })
    
    except Exception as e:
        current_app.logger.error(f"Upload error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Upload failed: {str(e)}'
        }), 500

@bp.route('/progress/<import_id>')
@login_required
@require_permission('data_import')
def progress(import_id):
    """Show import progress"""
    data_import = DataImport.query.get_or_404(import_id)
    
    # Check permissions
    if data_import.created_by != current_user.id and not current_user.has_permission('admin'):
        flash('Access denied', 'error')
        return redirect(url_for('data_import.index'))
    
    return render_template('data_import/progress.html', data_import=data_import)

@bp.route('/api/progress/<import_id>')
@login_required
@require_permission('data_import')
def api_progress(import_id):
    """API endpoint for import progress"""
    data_import = DataImport.query.get_or_404(import_id)
    
    # Check permissions
    if data_import.created_by != current_user.id and not current_user.has_permission('admin'):
        return jsonify({'error': 'Access denied'}), 403
    
    # Get recent logs
    recent_logs = ImportLog.query.filter_by(import_id=import_id)\
        .order_by(ImportLog.created_at.desc())\
        .limit(10).all()
    
    # Get error summary
    error_count = ImportError.query.filter_by(import_id=import_id, error_severity='error').count()
    warning_count = ImportError.query.filter_by(import_id=import_id, error_severity='warning').count()
    
    return jsonify({
        'import': data_import.to_dict(),
        'logs': [log.to_dict() for log in recent_logs],
        'error_summary': {
            'errors': error_count,
            'warnings': warning_count
        }
    })

@bp.route('/history')
@login_required
@require_permission('data_import')
def history():
    """Import history"""
    page = request.args.get('page', 1, type=int)
    per_page = 20
    
    # Base query
    query = DataImport.query
    
    # Filter by user if not admin
    if not current_user.has_permission('admin'):
        query = query.filter_by(created_by=current_user.id)
    
    # Apply filters
    status_filter = request.args.get('status')
    if status_filter:
        query = query.filter_by(status=ImportStatus(status_filter))
    
    type_filter = request.args.get('type')
    if type_filter:
        query = query.filter_by(import_type=ImportType(type_filter))
    
    # Order and paginate
    imports = query.order_by(DataImport.created_at.desc())\
        .paginate(page=page, per_page=per_page)
    
    return render_template('data_import/history.html', imports=imports)

@bp.route('/details/<import_id>')
@login_required
@require_permission('data_import')
def details(import_id):
    """Import details"""
    data_import = DataImport.query.get_or_404(import_id)
    
    # Check permissions
    if data_import.created_by != current_user.id and not current_user.has_permission('admin'):
        flash('Access denied', 'error')
        return redirect(url_for('data_import.history'))
    
    # Get errors and logs
    errors = ImportError.query.filter_by(import_id=import_id)\
        .order_by(ImportError.row_number, ImportError.column_name).all()
    
    logs = ImportLog.query.filter_by(import_id=import_id)\
        .order_by(ImportLog.created_at).all()
    
    return render_template('data_import/details.html', 
                         data_import=data_import, 
                         errors=errors, 
                         logs=logs)

@bp.route('/templates')
@login_required
@require_permission('data_import')
def templates():
    """Import templates"""
    templates = ImportTemplate.query.filter_by(is_active=True)\
        .order_by(ImportTemplate.import_type, ImportTemplate.template_name).all()
    
    return render_template('data_import/templates.html', templates=templates)

@bp.route('/templates/<template_id>/download')
@login_required
@require_permission('data_import')
def download_template(template_id):
    """Download import template"""
    template = ImportTemplate.query.get_or_404(template_id)
    template.increment_download()
    
    # Generate template file
    template_content = _generate_template_content(template)
    
    return jsonify({
        'success': True,
        'template': template_content,
        'filename': f"{template.template_name.lower().replace(' ', '_')}_template.{template.file_format.value}"
    })

@bp.route('/api/validate-data', methods=['POST'])
@login_required
@require_permission('data_import')
def api_validate_data():
    """API endpoint to validate data without importing"""
    try:
        data = request.json
        import_type = data.get('import_type')
        rows = data.get('data', [])
        
        if not import_type or not rows:
            return jsonify({'error': 'Missing import type or data'}), 400
        
        # Get validator
        validator = _get_validator_for_type(import_type)
        
        # Validate data
        results, duplicate_info = validator.validate_dataset(rows)
        
        # Summarize results
        total_rows = len(results)
        error_rows = sum(1 for r in results if not r.is_valid)
        warning_rows = sum(1 for r in results if r.warnings)
        
        all_errors = []
        all_warnings = []
        
        for i, result in enumerate(results):
            for error in result.errors:
                error.row_number = i + 1
                all_errors.append(error)
            for warning in result.warnings:
                warning.row_number = i + 1
                all_warnings.append(warning)
        
        return jsonify({
            'success': True,
            'summary': {
                'total_rows': total_rows,
                'valid_rows': total_rows - error_rows,
                'error_rows': error_rows,
                'warning_rows': warning_rows,
                'duplicate_rows': duplicate_info['count']
            },
            'errors': [_error_to_dict(e) for e in all_errors[:50]],  # Limit to first 50
            'warnings': [_error_to_dict(w) for w in all_warnings[:50]]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _validate_file_data(file_path: str, file_type: FileType, import_type: str) -> dict:
    """Validate data in uploaded file"""
    try:
        # Initialize file handler and load data
        upload_folder = os.path.join(current_app.instance_path, 'uploads')
        file_handler = FileUploadHandler(upload_folder)
        
        # Load first 100 rows for validation
        preview_data = file_handler.preview_file_data(file_path, file_type, max_rows=100)
        
        # Get validator
        validator = _get_validator_for_type(import_type)
        
        # Validate data
        results, duplicate_info = validator.validate_dataset(preview_data['data'])
        
        # Summarize results
        total_rows = len(results)
        error_rows = sum(1 for r in results if not r.is_valid)
        warning_rows = sum(1 for r in results if r.warnings)
        
        errors = []
        warnings = []
        
        for i, result in enumerate(results):
            for error in result.errors:
                errors.append({
                    'row_number': i + 1,
                    'field_name': error.field_name,
                    'message': error.message,
                    'original_value': error.original_value,
                    'suggested_value': error.suggested_value
                })
            for warning in result.warnings:
                warnings.append({
                    'row_number': i + 1,
                    'field_name': warning.field_name,
                    'message': warning.message,
                    'original_value': warning.original_value,
                    'suggested_value': warning.suggested_value
                })
        
        return {
            'total_rows': total_rows,
            'valid_rows': total_rows - error_rows,
            'error_rows': error_rows,
            'warning_rows': warning_rows,
            'duplicate_rows': duplicate_info['count'],
            'errors': errors[:20],  # Limit to first 20
            'warnings': warnings[:20]
        }
    
    except Exception as e:
        return {'error': str(e)}

def _get_validator_for_type(import_type: str):
    """Get appropriate validator for import type"""
    validators = {
        'products': create_product_validator,
        'historical_sales': create_sales_validator,
    }
    
    validator_func = validators.get(import_type)
    if validator_func:
        return validator_func()
    else:
        from app.utils.validation import DataValidator
        return DataValidator()

def _start_background_import(import_id: str):
    """Start background import processing"""
    def process_import():
        try:
            with current_app.app_context():
                processor = ImportProcessor(import_id)
                processor.process_import()
        except Exception as e:
            current_app.logger.error(f"Background import failed for {import_id}: {str(e)}")
    
    # Start background thread
    thread = threading.Thread(target=process_import)
    thread.daemon = True
    thread.start()

def _generate_template_content(template: ImportTemplate) -> dict:
    """Generate template content for download"""
    field_definitions = template.field_definitions or {}
    sample_data = template.sample_data or []
    
    # Create headers
    headers = list(field_definitions.keys())
    
    # Create sample rows
    rows = sample_data if sample_data else [
        {field: f'Sample {field}' for field in headers}
    ]
    
    return {
        'headers': headers,
        'rows': rows,
        'field_definitions': field_definitions,
        'description': template.description
    }

def _error_to_dict(error) -> dict:
    """Convert validation error to dictionary"""
    return {
        'row_number': getattr(error, 'row_number', None),
        'field_name': error.field_name,
        'error_type': error.error_type.value if hasattr(error.error_type, 'value') else str(error.error_type),
        'error_code': error.error_code,
        'message': error.message,
        'severity': error.severity.value if hasattr(error.severity, 'value') else str(error.severity),
        'original_value': error.original_value,
        'suggested_value': error.suggested_value
    }