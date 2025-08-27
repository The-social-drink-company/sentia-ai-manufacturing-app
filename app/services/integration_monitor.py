import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy import and_
from flask import current_app
from app import db
from app.models.api_integration import (
    ApiIntegration, IntegrationSyncLog, IntegrationHealth,
    IntegrationStatus, WebhookEvent
)
from app.services.api_integration_service import ApiIntegrationService

logger = logging.getLogger(__name__)

class IntegrationMonitor:
    """Service for monitoring API integration health and performance"""
    
    def __init__(self):
        self.alert_thresholds = {
            'sync_failure_count': 3,  # Alert after 3 consecutive failures
            'response_time_ms': 10000,  # Alert if response time > 10s
            'health_check_failure_hours': 2,  # Alert if no successful health check in 2 hours
            'webhook_processing_delay_minutes': 30  # Alert if webhooks not processed in 30 minutes
        }
    
    def run_health_checks(self) -> List[IntegrationHealth]:
        """Run health checks for all active integrations"""
        logger.info("Starting integration health checks")
        
        active_integrations = ApiIntegration.query.filter_by(is_active=True).all()
        health_checks = []
        
        for integration in active_integrations:
            try:
                logger.info(f"Health check for integration {integration.id}: {integration.name}")
                
                # Skip if integration is rate limited and reset time hasn't passed
                if (integration.status == IntegrationStatus.RATE_LIMITED and 
                    integration.rate_limit_reset_at and 
                    datetime.utcnow() < integration.rate_limit_reset_at):
                    logger.info(f"Skipping rate limited integration {integration.id}")
                    continue
                
                client = ApiIntegrationService.get_client(integration)
                health_check = client.test_connection()
                health_checks.append(health_check)
                
                # Update integration status based on health check
                if health_check.is_healthy:
                    if integration.status == IntegrationStatus.ERROR:
                        integration.status = IntegrationStatus.ACTIVE
                        integration.error_message = None
                        logger.info(f"Integration {integration.id} recovered from error state")
                else:
                    if integration.status == IntegrationStatus.ACTIVE:
                        integration.status = IntegrationStatus.ERROR
                        integration.error_message = health_check.error_message
                        logger.warning(f"Integration {integration.id} moved to error state")
                
                db.session.commit()
                
            except Exception as e:
                logger.error(f"Failed to perform health check for integration {integration.id}: {str(e)}")
                
                # Create a failed health check record
                health_check = IntegrationHealth(
                    integration_id=integration.id,
                    check_time=datetime.utcnow(),
                    is_healthy=False,
                    error_message=str(e)[:500]
                )
                db.session.add(health_check)
                health_checks.append(health_check)
                
                # Update integration status
                integration.status = IntegrationStatus.ERROR
                integration.error_message = str(e)[:500]
                db.session.commit()
                
                continue
        
        logger.info(f"Completed health checks for {len(health_checks)} integrations")
        return health_checks
    
    def process_due_syncs(self) -> List[IntegrationSyncLog]:
        """Process all integrations that are due for synchronization"""
        logger.info("Processing due synchronizations")
        
        sync_logs = ApiIntegrationService.sync_all_due_integrations()
        
        logger.info(f"Processed {len(sync_logs)} due synchronizations")
        return sync_logs
    
    def process_pending_webhooks(self) -> int:
        """Process pending webhook events"""
        logger.info("Processing pending webhooks")
        
        # Get unprocessed webhooks older than 5 minutes but not older than 24 hours
        cutoff_recent = datetime.utcnow() - timedelta(minutes=5)
        cutoff_old = datetime.utcnow() - timedelta(hours=24)
        
        pending_webhooks = WebhookEvent.query.filter(
            and_(
                WebhookEvent.processed == False,
                WebhookEvent.created_at <= cutoff_recent,
                WebhookEvent.created_at >= cutoff_old,
                WebhookEvent.retry_count < 3
            )
        ).limit(100).all()  # Process max 100 at a time
        
        processed_count = 0
        for webhook in pending_webhooks:
            try:
                ApiIntegrationService._process_webhook_event(webhook)
                processed_count += 1
            except Exception as e:
                logger.error(f"Failed to process webhook {webhook.id}: {str(e)}")
                webhook.retry_count += 1
                webhook.error_message = str(e)[:500]
                db.session.commit()
        
        logger.info(f"Processed {processed_count} pending webhooks")
        return processed_count
    
    def generate_alerts(self) -> List[Dict[str, Any]]:
        """Generate alerts for integration issues"""
        alerts = []
        
        # Check for consecutive sync failures
        sync_failure_alerts = self._check_sync_failures()
        alerts.extend(sync_failure_alerts)
        
        # Check for poor performance
        performance_alerts = self._check_performance_issues()
        alerts.extend(performance_alerts)
        
        # Check for stale health checks
        health_alerts = self._check_stale_health_checks()
        alerts.extend(health_alerts)
        
        # Check for webhook processing delays
        webhook_alerts = self._check_webhook_delays()
        alerts.extend(webhook_alerts)
        
        # Log alerts
        for alert in alerts:
            logger.warning(f"Integration Alert: {alert['message']}")
        
        return alerts
    
    def _check_sync_failures(self) -> List[Dict[str, Any]]:
        """Check for consecutive sync failures"""
        alerts = []
        
        # Get recent sync logs grouped by integration
        recent_cutoff = datetime.utcnow() - timedelta(hours=24)
        
        integrations = ApiIntegration.query.filter_by(is_active=True).all()
        
        for integration in integrations:
            recent_syncs = IntegrationSyncLog.query.filter(
                and_(
                    IntegrationSyncLog.integration_id == integration.id,
                    IntegrationSyncLog.started_at >= recent_cutoff
                )
            ).order_by(IntegrationSyncLog.started_at.desc()).limit(5).all()
            
            if len(recent_syncs) >= self.alert_thresholds['sync_failure_count']:
                failed_count = len([s for s in recent_syncs if s.status == 'failed'])
                
                if failed_count >= self.alert_thresholds['sync_failure_count']:
                    alerts.append({
                        'type': 'sync_failure',
                        'integration_id': integration.id,
                        'integration_name': integration.name,
                        'message': f"Integration '{integration.name}' has {failed_count} consecutive sync failures",
                        'severity': 'high',
                        'timestamp': datetime.utcnow()
                    })
        
        return alerts
    
    def _check_performance_issues(self) -> List[Dict[str, Any]]:
        """Check for performance issues"""
        alerts = []
        
        # Check recent health checks for slow response times
        recent_cutoff = datetime.utcnow() - timedelta(hours=1)
        
        slow_health_checks = IntegrationHealth.query.filter(
            and_(
                IntegrationHealth.check_time >= recent_cutoff,
                IntegrationHealth.response_time_ms > self.alert_thresholds['response_time_ms'],
                IntegrationHealth.is_healthy == True  # Only alert on successful but slow requests
            )
        ).all()
        
        for health_check in slow_health_checks:
            alerts.append({
                'type': 'performance',
                'integration_id': health_check.integration_id,
                'integration_name': health_check.integration.name,
                'message': f"Integration '{health_check.integration.name}' has slow response time: {health_check.response_time_ms}ms",
                'severity': 'medium',
                'timestamp': datetime.utcnow()
            })
        
        return alerts
    
    def _check_stale_health_checks(self) -> List[Dict[str, Any]]:
        """Check for integrations without recent successful health checks"""
        alerts = []
        
        stale_cutoff = datetime.utcnow() - timedelta(hours=self.alert_thresholds['health_check_failure_hours'])
        
        integrations = ApiIntegration.query.filter_by(is_active=True).all()
        
        for integration in integrations:
            last_healthy_check = IntegrationHealth.query.filter(
                and_(
                    IntegrationHealth.integration_id == integration.id,
                    IntegrationHealth.is_healthy == True
                )
            ).order_by(IntegrationHealth.check_time.desc()).first()
            
            if not last_healthy_check or last_healthy_check.check_time < stale_cutoff:
                alerts.append({
                    'type': 'health_stale',
                    'integration_id': integration.id,
                    'integration_name': integration.name,
                    'message': f"Integration '{integration.name}' has no successful health checks in {self.alert_thresholds['health_check_failure_hours']} hours",
                    'severity': 'high',
                    'timestamp': datetime.utcnow()
                })
        
        return alerts
    
    def _check_webhook_delays(self) -> List[Dict[str, Any]]:
        """Check for webhook processing delays"""
        alerts = []
        
        delay_cutoff = datetime.utcnow() - timedelta(minutes=self.alert_thresholds['webhook_processing_delay_minutes'])
        
        delayed_webhooks = WebhookEvent.query.filter(
            and_(
                WebhookEvent.processed == False,
                WebhookEvent.created_at < delay_cutoff,
                WebhookEvent.retry_count < 3
            )
        ).count()
        
        if delayed_webhooks > 0:
            alerts.append({
                'type': 'webhook_delay',
                'message': f"{delayed_webhooks} webhooks have been pending processing for more than {self.alert_thresholds['webhook_processing_delay_minutes']} minutes",
                'severity': 'medium',
                'timestamp': datetime.utcnow()
            })
        
        return alerts
    
    def get_integration_statistics(self) -> Dict[str, Any]:
        """Get comprehensive integration statistics"""
        stats = {
            'timestamp': datetime.utcnow(),
            'integrations': {},
            'overall': {}
        }
        
        # Overall statistics
        total_integrations = ApiIntegration.query.count()
        active_integrations = ApiIntegration.query.filter_by(is_active=True).count()
        
        # Health statistics (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(hours=24)
        recent_health_checks = IntegrationHealth.query.filter(
            IntegrationHealth.check_time >= yesterday
        ).all()
        
        healthy_checks = len([h for h in recent_health_checks if h.is_healthy])
        total_health_checks = len(recent_health_checks)
        
        # Sync statistics (last 24 hours)
        recent_syncs = IntegrationSyncLog.query.filter(
            IntegrationSyncLog.started_at >= yesterday
        ).all()
        
        successful_syncs = len([s for s in recent_syncs if s.status == 'completed'])
        failed_syncs = len([s for s in recent_syncs if s.status == 'failed'])
        total_syncs = len(recent_syncs)
        
        # Webhook statistics (last 24 hours)
        recent_webhooks = WebhookEvent.query.filter(
            WebhookEvent.created_at >= yesterday
        ).all()
        
        processed_webhooks = len([w for w in recent_webhooks if w.processed])
        total_webhooks = len(recent_webhooks)
        
        stats['overall'] = {
            'total_integrations': total_integrations,
            'active_integrations': active_integrations,
            'health_score': (healthy_checks / total_health_checks * 100) if total_health_checks > 0 else 0,
            'sync_success_rate': (successful_syncs / total_syncs * 100) if total_syncs > 0 else 0,
            'webhook_processing_rate': (processed_webhooks / total_webhooks * 100) if total_webhooks > 0 else 0,
            'total_health_checks_24h': total_health_checks,
            'total_syncs_24h': total_syncs,
            'total_webhooks_24h': total_webhooks
        }
        
        # Per-integration statistics
        integrations = ApiIntegration.query.all()
        for integration in integrations:
            integration_health_checks = [h for h in recent_health_checks if h.integration_id == integration.id]
            integration_syncs = [s for s in recent_syncs if s.integration_id == integration.id]
            
            healthy_count = len([h for h in integration_health_checks if h.is_healthy])
            successful_sync_count = len([s for s in integration_syncs if s.status == 'completed'])
            
            avg_response_time = 0
            if integration_health_checks:
                valid_response_times = [h.response_time_ms for h in integration_health_checks if h.response_time_ms]
                if valid_response_times:
                    avg_response_time = sum(valid_response_times) / len(valid_response_times)
            
            stats['integrations'][integration.id] = {
                'name': integration.name,
                'provider': integration.provider.value,
                'status': integration.status.value,
                'is_active': integration.is_active,
                'health_checks_24h': len(integration_health_checks),
                'healthy_checks_24h': healthy_count,
                'health_rate': (healthy_count / len(integration_health_checks) * 100) if integration_health_checks else 0,
                'syncs_24h': len(integration_syncs),
                'successful_syncs_24h': successful_sync_count,
                'sync_success_rate': (successful_sync_count / len(integration_syncs) * 100) if integration_syncs else 0,
                'avg_response_time_ms': avg_response_time,
                'last_sync': integration.last_sync_at.isoformat() if integration.last_sync_at else None,
                'next_sync': integration.next_sync_at.isoformat() if integration.next_sync_at else None
            }
        
        return stats
    
    def cleanup_old_logs(self, days_to_keep: int = 90):
        """Clean up old monitoring logs and data"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        # Clean up old sync logs
        old_sync_logs = IntegrationSyncLog.query.filter(
            IntegrationSyncLog.started_at < cutoff_date
        ).delete()
        
        # Clean up old health checks
        old_health_checks = IntegrationHealth.query.filter(
            IntegrationHealth.check_time < cutoff_date
        ).delete()
        
        # Clean up old processed webhooks
        old_webhooks = WebhookEvent.query.filter(
            and_(
                WebhookEvent.created_at < cutoff_date,
                WebhookEvent.processed == True
            )
        ).delete()
        
        db.session.commit()
        
        logger.info(f"Cleaned up {old_sync_logs} sync logs, {old_health_checks} health checks, and {old_webhooks} webhooks older than {days_to_keep} days")
        
        return {
            'sync_logs_deleted': old_sync_logs,
            'health_checks_deleted': old_health_checks,
            'webhooks_deleted': old_webhooks
        }

def run_monitoring_cycle():
    """Run a complete monitoring cycle (health checks, sync processing, alert generation)"""
    monitor = IntegrationMonitor()
    
    try:
        logger.info("Starting integration monitoring cycle")
        
        # Run health checks
        health_checks = monitor.run_health_checks()
        
        # Process due syncs
        sync_logs = monitor.process_due_syncs()
        
        # Process pending webhooks
        processed_webhooks = monitor.process_pending_webhooks()
        
        # Generate alerts
        alerts = monitor.generate_alerts()
        
        # Get statistics
        stats = monitor.get_integration_statistics()
        
        logger.info(f"Monitoring cycle completed: {len(health_checks)} health checks, {len(sync_logs)} syncs, {processed_webhooks} webhooks processed, {len(alerts)} alerts generated")
        
        return {
            'health_checks': len(health_checks),
            'sync_logs': len(sync_logs),
            'processed_webhooks': processed_webhooks,
            'alerts': alerts,
            'statistics': stats
        }
        
    except Exception as e:
        logger.error(f"Monitoring cycle failed: {str(e)}")
        raise