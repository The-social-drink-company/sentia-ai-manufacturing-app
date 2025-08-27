import click
import json
from datetime import datetime
from flask import current_app
from flask.cli import with_appcontext
from app import db
from app.models.api_integration import (
    ApiIntegration, ApiCredential, IntegrationProvider, 
    IntegrationType, IntegrationStatus
)
from app.services.api_integration_service import ApiIntegrationService
from app.services.integration_monitor import IntegrationMonitor, run_monitoring_cycle

@click.group()
def integrations():
    """API integration management commands."""
    pass

@integrations.command()
@with_appcontext
def monitor():
    """Run integration monitoring cycle."""
    click.echo("Starting integration monitoring cycle...")
    
    try:
        results = run_monitoring_cycle()
        
        click.echo(f"Monitoring cycle completed:")
        click.echo(f"  - Health checks: {results['health_checks']}")
        click.echo(f"  - Sync logs: {results['sync_logs']}")
        click.echo(f"  - Processed webhooks: {results['processed_webhooks']}")
        click.echo(f"  - Alerts generated: {len(results['alerts'])}")
        
        if results['alerts']:
            click.echo("\nAlerts:")
            for alert in results['alerts']:
                click.echo(f"  - {alert['severity'].upper()}: {alert['message']}")
        
        # Print overall statistics
        stats = results['statistics']['overall']
        click.echo(f"\nOverall Statistics:")
        click.echo(f"  - Total integrations: {stats['total_integrations']}")
        click.echo(f"  - Active integrations: {stats['active_integrations']}")
        click.echo(f"  - Health score: {stats['health_score']:.1f}%")
        click.echo(f"  - Sync success rate: {stats['sync_success_rate']:.1f}%")
        click.echo(f"  - Webhook processing rate: {stats['webhook_processing_rate']:.1f}%")
        
    except Exception as e:
        click.echo(f"Monitoring cycle failed: {str(e)}", err=True)
        raise click.Abort()

@integrations.command()
@with_appcontext
def health_check():
    """Run health checks for all active integrations."""
    click.echo("Running health checks...")
    
    monitor = IntegrationMonitor()
    health_checks = monitor.run_health_checks()
    
    click.echo(f"Completed health checks for {len(health_checks)} integrations:")
    
    for health_check in health_checks:
        status = "HEALTHY" if health_check.is_healthy else "UNHEALTHY"
        integration_name = health_check.integration.name
        response_time = health_check.response_time_ms or 0
        
        click.echo(f"  - {integration_name}: {status} ({response_time}ms)")
        
        if not health_check.is_healthy and health_check.error_message:
            click.echo(f"    Error: {health_check.error_message}")

@integrations.command()
@with_appcontext
def sync_due():
    """Process all integrations that are due for synchronization."""
    click.echo("Processing due synchronizations...")
    
    sync_logs = ApiIntegrationService.sync_all_due_integrations()
    
    click.echo(f"Processed {len(sync_logs)} synchronizations:")
    
    for sync_log in sync_logs:
        if sync_log:  # sync_log can be None if sync couldn't start
            integration_name = sync_log.integration.name
            status = sync_log.status
            records = sync_log.records_processed or 0
            success_rate = (sync_log.records_success / records * 100) if records > 0 else 0
            
            click.echo(f"  - {integration_name}: {status.upper()} ({records} records, {success_rate:.1f}% success)")
            
            if sync_log.error_message:
                click.echo(f"    Error: {sync_log.error_message}")

@integrations.command()
@click.option('--integration-id', type=int, help='Specific integration ID to sync')
@click.option('--sync-type', default='incremental', help='Type of sync: incremental or full')
@with_appcontext
def sync(integration_id, sync_type):
    """Manually trigger synchronization for specific integration or all due."""
    if integration_id:
        click.echo(f"Syncing integration {integration_id} ({sync_type})...")
        
        try:
            sync_log = ApiIntegrationService.sync_integration(integration_id, sync_type)
            
            if sync_log:
                click.echo(f"Sync completed: {sync_log.status}")
                click.echo(f"Records processed: {sync_log.records_processed}")
                click.echo(f"Success rate: {sync_log.records_success / sync_log.records_processed * 100:.1f}%" 
                          if sync_log.records_processed > 0 else "No records")
                
                if sync_log.error_message:
                    click.echo(f"Error: {sync_log.error_message}")
            else:
                click.echo("Sync could not be started - check integration status")
                
        except Exception as e:
            click.echo(f"Sync failed: {str(e)}", err=True)
            raise click.Abort()
    else:
        click.echo(f"Syncing all due integrations ({sync_type})...")
        sync_logs = ApiIntegrationService.sync_all_due_integrations()
        click.echo(f"Processed {len(sync_logs)} synchronizations")

@integrations.command()
@with_appcontext
def status():
    """Show status of all integrations."""
    integrations = ApiIntegration.query.all()
    
    if not integrations:
        click.echo("No integrations configured.")
        return
    
    click.echo(f"{'ID':<4} {'Name':<20} {'Provider':<12} {'Status':<12} {'Last Sync':<16} {'Next Sync':<16}")
    click.echo("-" * 88)
    
    for integration in integrations:
        last_sync = integration.last_sync_at.strftime('%Y-%m-%d %H:%M') if integration.last_sync_at else 'Never'
        next_sync = integration.next_sync_at.strftime('%Y-%m-%d %H:%M') if integration.next_sync_at else 'N/A'
        
        click.echo(f"{integration.id:<4} {integration.name[:20]:<20} {integration.provider.value:<12} "
                  f"{integration.status.value:<12} {last_sync:<16} {next_sync:<16}")

@integrations.command()
@with_appcontext
def stats():
    """Show detailed integration statistics."""
    monitor = IntegrationMonitor()
    statistics = monitor.get_integration_statistics()
    
    overall = statistics['overall']
    
    click.echo("=== Overall Statistics ===")
    click.echo(f"Total integrations: {overall['total_integrations']}")
    click.echo(f"Active integrations: {overall['active_integrations']}")
    click.echo(f"Health score (24h): {overall['health_score']:.1f}%")
    click.echo(f"Sync success rate (24h): {overall['sync_success_rate']:.1f}%")
    click.echo(f"Webhook processing rate (24h): {overall['webhook_processing_rate']:.1f}%")
    click.echo(f"Total health checks (24h): {overall['total_health_checks_24h']}")
    click.echo(f"Total syncs (24h): {overall['total_syncs_24h']}")
    click.echo(f"Total webhooks (24h): {overall['total_webhooks_24h']}")
    
    click.echo("\n=== Per-Integration Statistics ===")
    click.echo(f"{'Name':<20} {'Provider':<10} {'Status':<10} {'Health':<8} {'Sync Rate':<10} {'Avg RT':<8}")
    click.echo("-" * 76)
    
    for integration_stats in statistics['integrations'].values():
        name = integration_stats['name'][:20]
        provider = integration_stats['provider'][:10]
        status = integration_stats['status'][:10]
        health_rate = f"{integration_stats['health_rate']:.1f}%"
        sync_rate = f"{integration_stats['sync_success_rate']:.1f}%"
        avg_rt = f"{integration_stats['avg_response_time_ms']:.0f}ms" if integration_stats['avg_response_time_ms'] else "N/A"
        
        click.echo(f"{name:<20} {provider:<10} {status:<10} {health_rate:<8} {sync_rate:<10} {avg_rt:<8}")

@integrations.command()
@click.option('--days', default=90, help='Number of days to keep (default: 90)')
@with_appcontext
def cleanup():
    """Clean up old integration logs and data."""
    click.echo(f"Cleaning up integration data older than {days} days...")
    
    monitor = IntegrationMonitor()
    results = monitor.cleanup_old_logs(days)
    
    click.echo(f"Cleanup completed:")
    click.echo(f"  - Sync logs deleted: {results['sync_logs_deleted']}")
    click.echo(f"  - Health checks deleted: {results['health_checks_deleted']}")
    click.echo(f"  - Webhooks deleted: {results['webhooks_deleted']}")

@integrations.command()
@click.option('--provider', required=True, help='Integration provider (shopify, amazon_sp, xero)')
@click.option('--name', required=True, help='Integration name')
@click.option('--credential-id', required=True, type=int, help='Credential ID to use')
@click.option('--sync-frequency', default=60, help='Sync frequency in minutes (default: 60)')
@click.option('--active/--inactive', default=True, help='Whether integration is active')
@with_appcontext
def create(provider, name, credential_id, sync_frequency, active):
    """Create a new integration."""
    try:
        provider_enum = IntegrationProvider(provider)
        credential = ApiCredential.query.get(credential_id)
        
        if not credential:
            click.echo(f"Credential {credential_id} not found", err=True)
            raise click.Abort()
        
        if credential.provider != provider_enum:
            click.echo(f"Credential provider ({credential.provider.value}) doesn't match specified provider ({provider})", err=True)
            raise click.Abort()
        
        integration = ApiIntegration(
            credential_id=credential_id,
            provider=provider_enum,
            name=name,
            integration_type=IntegrationType.API,
            sync_frequency_minutes=sync_frequency,
            is_active=active,
            config_json={
                'sync_products': True,
                'sync_orders': True,
                'sync_inventory': True,
                'sync_finances': True
            }
        )
        
        db.session.add(integration)
        db.session.commit()
        
        if active:
            integration.schedule_next_sync()
            db.session.commit()
        
        click.echo(f"Created integration '{name}' with ID {integration.id}")
        
    except ValueError as e:
        click.echo(f"Invalid provider: {provider}", err=True)
        raise click.Abort()
    except Exception as e:
        click.echo(f"Failed to create integration: {str(e)}", err=True)
        raise click.Abort()

@integrations.command()
@click.option('--provider', required=True, help='Credential provider (shopify, amazon_sp, xero)')
@click.option('--name', required=True, help='Credential name')
@click.option('--client-id', help='OAuth client ID')
@click.option('--client-secret', help='OAuth client secret')
@click.option('--api-key', help='API key (for private apps)')
@click.option('--shop-url', help='Shop URL (for Shopify)')
@click.option('--marketplace-id', help='Marketplace ID (for Amazon)')
@click.option('--region', help='AWS region (for Amazon)')
@click.option('--environment', default='production', help='Environment (production/sandbox)')
@with_appcontext
def create_credential(provider, name, client_id, client_secret, api_key, shop_url, marketplace_id, region, environment):
    """Create a new API credential."""
    try:
        provider_enum = IntegrationProvider(provider)
        
        credential = ApiCredential(
            provider=provider_enum,
            name=name,
            client_id=client_id,
            client_secret=client_secret,
            api_key=api_key,
            shop_url=shop_url,
            marketplace_id=marketplace_id,
            region=region,
            environment=environment
        )
        
        db.session.add(credential)
        db.session.commit()
        
        click.echo(f"Created credential '{name}' with ID {credential.id}")
        
    except ValueError as e:
        click.echo(f"Invalid provider: {provider}", err=True)
        raise click.Abort()
    except Exception as e:
        click.echo(f"Failed to create credential: {str(e)}", err=True)
        raise click.Abort()

@integrations.command()
@with_appcontext
def list_credentials():
    """List all API credentials."""
    credentials = ApiCredential.query.all()
    
    if not credentials:
        click.echo("No credentials configured.")
        return
    
    click.echo(f"{'ID':<4} {'Name':<20} {'Provider':<12} {'Environment':<12} {'Status':<8}")
    click.echo("-" * 60)
    
    for credential in credentials:
        status = "Active" if credential.is_active else "Inactive"
        click.echo(f"{credential.id:<4} {credential.name[:20]:<20} {credential.provider.value:<12} "
                  f"{credential.environment:<12} {status:<8}")

def register_cli_commands(app):
    """Register CLI commands with the Flask app."""
    app.cli.add_command(integrations)