from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for, current_app
from flask_login import login_required, current_user
from datetime import datetime
import json
import logging
from app import db
from app.models.api_integration import (
    ApiIntegration, ApiCredential, IntegrationProvider, IntegrationType, 
    IntegrationStatus, IntegrationSyncLog, WebhookEvent, IntegrationHealth
)
from app.services.api_integration_service import ApiIntegrationService
from app.utils.security import admin_required

logger = logging.getLogger(__name__)

bp = Blueprint('api_integrations', __name__, url_prefix='/admin/integrations')

@bp.route('/')
@login_required
@admin_required
def index():
    """API integrations dashboard"""
    # Get all integrations with their health status
    integrations = ApiIntegration.query.all()
    
    # Get recent sync logs
    recent_syncs = IntegrationSyncLog.query.order_by(
        IntegrationSyncLog.started_at.desc()
    ).limit(10).all()
    
    # Get health summary
    health_checks = IntegrationHealth.query.filter(
        IntegrationHealth.check_time >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    ).all()
    
    # Calculate statistics
    stats = {
        'total_integrations': len(integrations),
        'active_integrations': len([i for i in integrations if i.is_active]),
        'healthy_integrations': len([h for h in health_checks if h.is_healthy]),
        'failed_syncs_today': len([s for s in recent_syncs if s.status == 'failed' and s.started_at.date() == datetime.utcnow().date()])
    }
    
    return render_template(
        'admin/integrations/index.html',
        integrations=integrations,
        recent_syncs=recent_syncs,
        stats=stats
    )

@bp.route('/credentials')
@login_required
@admin_required
def credentials():
    """Manage API credentials"""
    credentials = ApiCredential.query.all()
    providers = [provider.value for provider in IntegrationProvider]
    
    return render_template(
        'admin/integrations/credentials.html',
        credentials=credentials,
        providers=providers
    )

@bp.route('/credentials/create', methods=['GET', 'POST'])
@login_required
@admin_required
def create_credential():
    """Create new API credential"""
    if request.method == 'POST':
        try:
            provider = IntegrationProvider(request.form['provider'])
            
            credential = ApiCredential(
                provider=provider,
                name=request.form['name'],
                client_id=request.form.get('client_id'),
                client_secret=request.form.get('client_secret'),
                api_key=request.form.get('api_key'),
                shop_url=request.form.get('shop_url'),
                marketplace_id=request.form.get('marketplace_id'),
                region=request.form.get('region'),
                environment=request.form.get('environment', 'production')
            )
            
            # Store additional configuration
            config = {}
            if provider == IntegrationProvider.XERO:
                config['tenant_id'] = request.form.get('tenant_id')
            elif provider == IntegrationProvider.AMAZON_SP:
                config['sts_role_arn'] = request.form.get('sts_role_arn')
            
            if config:
                credential.config_json = config
            
            db.session.add(credential)
            db.session.commit()
            
            flash('API credential created successfully', 'success')
            return redirect(url_for('api_integrations.credentials'))
            
        except Exception as e:
            logger.error(f"Failed to create API credential: {str(e)}")
            flash(f'Failed to create credential: {str(e)}', 'error')
    
    providers = [provider.value for provider in IntegrationProvider]
    return render_template('admin/integrations/create_credential.html', providers=providers)

@bp.route('/credentials/<int:credential_id>/edit', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_credential(credential_id):
    """Edit API credential"""
    credential = ApiCredential.query.get_or_404(credential_id)
    
    if request.method == 'POST':
        try:
            credential.name = request.form['name']
            credential.client_id = request.form.get('client_id')
            credential.client_secret = request.form.get('client_secret')
            credential.api_key = request.form.get('api_key')
            credential.shop_url = request.form.get('shop_url')
            credential.marketplace_id = request.form.get('marketplace_id')
            credential.region = request.form.get('region')
            credential.environment = request.form.get('environment', 'production')
            credential.is_active = 'is_active' in request.form
            
            # Update additional configuration
            config = credential.config_json or {}
            if credential.provider == IntegrationProvider.XERO:
                config['tenant_id'] = request.form.get('tenant_id')
            elif credential.provider == IntegrationProvider.AMAZON_SP:
                config['sts_role_arn'] = request.form.get('sts_role_arn')
            
            credential.config_json = config
            credential.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            flash('API credential updated successfully', 'success')
            return redirect(url_for('api_integrations.credentials'))
            
        except Exception as e:
            logger.error(f"Failed to update API credential: {str(e)}")
            flash(f'Failed to update credential: {str(e)}', 'error')
    
    return render_template('admin/integrations/edit_credential.html', credential=credential)

@bp.route('/credentials/<int:credential_id>/test')
@login_required
@admin_required
def test_credential(credential_id):
    """Test API credential connection"""
    credential = ApiCredential.query.get_or_404(credential_id)
    
    try:
        # Create a temporary integration to test the credential
        temp_integration = ApiIntegration(
            credential=credential,
            provider=credential.provider,
            integration_type=IntegrationType.API,
            config_json={}
        )
        
        client = ApiIntegrationService.get_client(temp_integration)
        health_check = client.test_connection()
        
        if health_check.is_healthy:
            return jsonify({
                'success': True,
                'message': 'Connection successful',
                'response_time': health_check.response_time_ms
            })
        else:
            return jsonify({
                'success': False,
                'message': health_check.error_message or 'Connection failed'
            })
            
    except Exception as e:
        logger.error(f"Failed to test credential {credential_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        })

@bp.route('/create', methods=['GET', 'POST'])
@login_required
@admin_required
def create_integration():
    """Create new API integration"""
    if request.method == 'POST':
        try:
            credential_id = request.form['credential_id']
            credential = ApiCredential.query.get_or_404(credential_id)
            
            integration = ApiIntegration(
                credential_id=credential_id,
                provider=credential.provider,
                name=request.form['name'],
                integration_type=IntegrationType(request.form['integration_type']),
                endpoint_url=request.form.get('endpoint_url'),
                webhook_url=request.form.get('webhook_url'),
                sync_frequency_minutes=int(request.form.get('sync_frequency_minutes', 60)),
                max_retries=int(request.form.get('max_retries', 3))
            )
            
            # Configure sync options
            config = {
                'sync_products': 'sync_products' in request.form,
                'sync_orders': 'sync_orders' in request.form,
                'sync_inventory': 'sync_inventory' in request.form,
                'sync_finances': 'sync_finances' in request.form
            }
            
            if integration.provider == IntegrationProvider.XERO:
                config.update({
                    'sync_accounts': 'sync_accounts' in request.form,
                    'sync_invoices': 'sync_invoices' in request.form,
                    'sync_payments': 'sync_payments' in request.form,
                    'sync_bank_transactions': 'sync_bank_transactions' in request.form,
                    'sync_budgets': 'sync_budgets' in request.form
                })
            
            integration.config_json = config
            integration.is_active = 'is_active' in request.form
            
            db.session.add(integration)
            db.session.commit()
            
            # Schedule first sync
            integration.schedule_next_sync()
            db.session.commit()
            
            flash('API integration created successfully', 'success')
            return redirect(url_for('api_integrations.index'))
            
        except Exception as e:
            logger.error(f"Failed to create API integration: {str(e)}")
            flash(f'Failed to create integration: {str(e)}', 'error')
    
    credentials = ApiCredential.query.filter_by(is_active=True).all()
    integration_types = [type_.value for type_ in IntegrationType]
    
    return render_template(
        'admin/integrations/create_integration.html',
        credentials=credentials,
        integration_types=integration_types
    )

@bp.route('/<int:integration_id>')
@login_required
@admin_required
def view_integration(integration_id):
    """View integration details"""
    integration = ApiIntegration.query.get_or_404(integration_id)
    
    # Get recent sync logs
    sync_logs = IntegrationSyncLog.query.filter_by(
        integration_id=integration_id
    ).order_by(IntegrationSyncLog.started_at.desc()).limit(20).all()
    
    # Get recent health checks
    health_checks = IntegrationHealth.query.filter_by(
        integration_id=integration_id
    ).order_by(IntegrationHealth.check_time.desc()).limit(10).all()
    
    return render_template(
        'admin/integrations/view_integration.html',
        integration=integration,
        sync_logs=sync_logs,
        health_checks=health_checks
    )

@bp.route('/<int:integration_id>/edit', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_integration(integration_id):
    """Edit API integration"""
    integration = ApiIntegration.query.get_or_404(integration_id)
    
    if request.method == 'POST':
        try:
            integration.name = request.form['name']
            integration.endpoint_url = request.form.get('endpoint_url')
            integration.webhook_url = request.form.get('webhook_url')
            integration.sync_frequency_minutes = int(request.form.get('sync_frequency_minutes', 60))
            integration.max_retries = int(request.form.get('max_retries', 3))
            
            # Update sync configuration
            config = integration.config_json or {}
            config.update({
                'sync_products': 'sync_products' in request.form,
                'sync_orders': 'sync_orders' in request.form,
                'sync_inventory': 'sync_inventory' in request.form,
                'sync_finances': 'sync_finances' in request.form
            })
            
            if integration.provider == IntegrationProvider.XERO:
                config.update({
                    'sync_accounts': 'sync_accounts' in request.form,
                    'sync_invoices': 'sync_invoices' in request.form,
                    'sync_payments': 'sync_payments' in request.form,
                    'sync_bank_transactions': 'sync_bank_transactions' in request.form,
                    'sync_budgets': 'sync_budgets' in request.form
                })
            
            integration.config_json = config
            integration.is_active = 'is_active' in request.form
            integration.updated_at = datetime.utcnow()
            
            # Reschedule next sync if frequency changed
            if integration.is_active:
                integration.schedule_next_sync()
            
            db.session.commit()
            
            flash('Integration updated successfully', 'success')
            return redirect(url_for('api_integrations.view_integration', integration_id=integration_id))
            
        except Exception as e:
            logger.error(f"Failed to update integration: {str(e)}")
            flash(f'Failed to update integration: {str(e)}', 'error')
    
    return render_template('admin/integrations/edit_integration.html', integration=integration)

@bp.route('/<int:integration_id>/sync', methods=['POST'])
@login_required
@admin_required
def trigger_sync(integration_id):
    """Manually trigger integration sync"""
    integration = ApiIntegration.query.get_or_404(integration_id)
    sync_type = request.json.get('sync_type', 'incremental')
    
    try:
        sync_log = ApiIntegrationService.sync_integration(integration_id, sync_type)
        
        if sync_log:
            return jsonify({
                'success': True,
                'message': f'Sync triggered successfully',
                'sync_log_id': sync_log.id
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Sync could not be started - check integration status'
            })
            
    except Exception as e:
        logger.error(f"Failed to trigger sync for integration {integration_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        })

@bp.route('/<int:integration_id>/health')
@login_required
@admin_required
def check_health(integration_id):
    """Check integration health"""
    integration = ApiIntegration.query.get_or_404(integration_id)
    
    try:
        client = ApiIntegrationService.get_client(integration)
        health_check = client.test_connection()
        
        return jsonify({
            'success': True,
            'is_healthy': health_check.is_healthy,
            'response_time': health_check.response_time_ms,
            'error_message': health_check.error_message
        })
        
    except Exception as e:
        logger.error(f"Failed to check health for integration {integration_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        })

@bp.route('/sync-logs')
@login_required
@admin_required
def sync_logs():
    """View sync logs"""
    page = request.args.get('page', 1, type=int)
    integration_id = request.args.get('integration_id', type=int)
    status = request.args.get('status')
    
    query = IntegrationSyncLog.query
    
    if integration_id:
        query = query.filter_by(integration_id=integration_id)
    
    if status:
        query = query.filter_by(status=status)
    
    sync_logs = query.order_by(
        IntegrationSyncLog.started_at.desc()
    ).paginate(
        page=page, per_page=50, error_out=False
    )
    
    integrations = ApiIntegration.query.all()
    
    return render_template(
        'admin/integrations/sync_logs.html',
        sync_logs=sync_logs,
        integrations=integrations,
        current_integration_id=integration_id,
        current_status=status
    )

@bp.route('/webhooks')
@login_required
@admin_required
def webhooks():
    """View webhook events"""
    page = request.args.get('page', 1, type=int)
    provider = request.args.get('provider')
    processed = request.args.get('processed')
    
    query = WebhookEvent.query
    
    if provider:
        query = query.filter_by(provider=IntegrationProvider(provider))
    
    if processed is not None:
        query = query.filter_by(processed=processed.lower() == 'true')
    
    webhook_events = query.order_by(
        WebhookEvent.created_at.desc()
    ).paginate(
        page=page, per_page=50, error_out=False
    )
    
    providers = [provider.value for provider in IntegrationProvider]
    
    return render_template(
        'admin/integrations/webhooks.html',
        webhook_events=webhook_events,
        providers=providers,
        current_provider=provider,
        current_processed=processed
    )

@bp.route('/webhook/<provider>', methods=['POST'])
def receive_webhook(provider):
    """Receive webhook from external providers"""
    try:
        provider_enum = IntegrationProvider(provider)
        
        # Get request data
        payload = request.get_json() or {}
        headers = dict(request.headers)
        
        # Basic validation - in production you'd verify signatures
        if provider == 'shopify':
            # Verify Shopify webhook signature
            hmac_header = request.headers.get('X-Shopify-Hmac-Sha256')
            topic = request.headers.get('X-Shopify-Topic')
            if not hmac_header or not topic:
                return jsonify({'error': 'Missing required headers'}), 400
            event_type = topic
        elif provider == 'amazon_sp':
            event_type = payload.get('eventType', 'unknown')
        elif provider == 'xero':
            event_type = 'webhook'
        else:
            return jsonify({'error': 'Unknown provider'}), 400
        
        # Process webhook
        webhook_event = ApiIntegrationService.process_webhook(
            provider, event_type, payload, headers
        )
        
        return jsonify({
            'success': True,
            'event_id': webhook_event.id
        })
        
    except Exception as e:
        logger.error(f"Failed to process webhook from {provider}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# API endpoints for monitoring dashboard
@bp.route('/api/stats')
@login_required
@admin_required
def api_stats():
    """Get integration statistics for dashboard"""
    try:
        integrations = ApiIntegration.query.all()
        
        # Calculate various statistics
        stats = {
            'total_integrations': len(integrations),
            'active_integrations': len([i for i in integrations if i.is_active]),
            'by_provider': {},
            'by_status': {},
            'sync_stats': {}
        }
        
        # Count by provider
        for integration in integrations:
            provider = integration.provider.value
            stats['by_provider'][provider] = stats['by_provider'].get(provider, 0) + 1
        
        # Count by status
        for integration in integrations:
            status = integration.status.value
            stats['by_status'][status] = stats['by_status'].get(status, 0) + 1
        
        # Get sync statistics for the last 24 hours
        yesterday = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        recent_syncs = IntegrationSyncLog.query.filter(
            IntegrationSyncLog.started_at >= yesterday
        ).all()
        
        stats['sync_stats'] = {
            'total_syncs': len(recent_syncs),
            'successful_syncs': len([s for s in recent_syncs if s.status == 'completed']),
            'failed_syncs': len([s for s in recent_syncs if s.status == 'failed']),
            'partial_syncs': len([s for s in recent_syncs if s.status == 'partial'])
        }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Failed to get API stats: {str(e)}")
        return jsonify({'error': str(e)}), 500