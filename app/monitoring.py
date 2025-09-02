"""
Application monitoring and metrics collection.
Integrates with Railway's monitoring and external services.
"""

import os
import time
import logging
from functools import wraps
from flask import request, g, current_app
from datetime import datetime, timedelta
import psutil

# Metrics storage (in production, use Redis or external service)
metrics_store = {}

class MetricsCollector:
    """Collect and store application metrics."""
    
    def __init__(self):
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
    
    def record_request(self, endpoint, method, status_code, response_time):
        """Record API request metrics."""
        key = f"requests.{endpoint}.{method}"
        
        if key not in metrics_store:
            metrics_store[key] = {
                'count': 0,
                'total_time': 0,
                'errors': 0,
                'avg_response_time': 0
            }
        
        metrics_store[key]['count'] += 1
        metrics_store[key]['total_time'] += response_time
        metrics_store[key]['avg_response_time'] = (
            metrics_store[key]['total_time'] / metrics_store[key]['count']
        )
        
        if status_code >= 400:
            metrics_store[key]['errors'] += 1
        
        self.request_count += 1
        if status_code >= 500:
            self.error_count += 1
    
    def record_business_metric(self, metric_name, value, labels=None):
        """Record custom business metrics."""
        key = f"business.{metric_name}"
        
        if labels:
            label_string = ".".join([f"{k}_{v}" for k, v in labels.items()])
            key = f"{key}.{label_string}"
        
        if key not in metrics_store:
            metrics_store[key] = []
        
        metrics_store[key].append({
            'value': value,
            'timestamp': time.time()
        })
        
        # Keep only last 1000 data points
        if len(metrics_store[key]) > 1000:
            metrics_store[key] = metrics_store[key][-1000:]
    
    def get_system_metrics(self):
        """Get current system metrics."""
        return {
            'cpu_percent': psutil.cpu_percent(),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_percent': psutil.disk_usage('/').percent,
            'uptime_seconds': time.time() - self.start_time,
            'total_requests': self.request_count,
            'total_errors': self.error_count,
            'error_rate': (self.error_count / max(self.request_count, 1)) * 100
        }
    
    def get_all_metrics(self):
        """Get all collected metrics."""
        return {
            'system': self.get_system_metrics(),
            'requests': {k: v for k, v in metrics_store.items() if k.startswith('requests.')},
            'business': {k: v for k, v in metrics_store.items() if k.startswith('business.')},
            'timestamp': datetime.utcnow().isoformat()
        }

# Global metrics collector
collector = MetricsCollector()

def monitor_requests(f):
    """Decorator to monitor API endpoint performance."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        
        try:
            response = f(*args, **kwargs)
            status_code = getattr(response, 'status_code', 200)
        except Exception as e:
            status_code = 500
            current_app.logger.error(f"Request error in {f.__name__}: {e}")
            raise
        finally:
            response_time = time.time() - start_time
            endpoint = request.endpoint or 'unknown'
            method = request.method
            
            collector.record_request(endpoint, method, status_code, response_time)
        
        return response
    return decorated_function

class AlertManager:
    """Manage alerts and notifications."""
    
    def __init__(self):
        self.alert_thresholds = {
            'response_time': 2.0,  # seconds
            'error_rate': 5.0,     # percentage
            'cpu_usage': 80.0,     # percentage
            'memory_usage': 85.0,  # percentage
            'disk_usage': 90.0,    # percentage
        }
        
        self.alert_cooldown = 300  # 5 minutes
        self.last_alerts = {}
    
    def check_alerts(self):
        """Check metrics against thresholds and generate alerts."""
        alerts = []
        current_time = time.time()
        metrics = collector.get_all_metrics()
        system_metrics = metrics['system']
        
        # Check system metrics
        for metric, threshold in self.alert_thresholds.items():
            if metric in system_metrics:
                value = system_metrics[metric]
                alert_key = f"system.{metric}"
                
                if value > threshold:
                    # Check cooldown
                    if (alert_key not in self.last_alerts or 
                        current_time - self.last_alerts[alert_key] > self.alert_cooldown):
                        
                        alerts.append({
                            'level': 'critical' if value > threshold * 1.2 else 'warning',
                            'metric': metric,
                            'value': value,
                            'threshold': threshold,
                            'message': f"{metric.replace('_', ' ').title()} is {value:.1f}% (threshold: {threshold}%)",
                            'timestamp': datetime.utcnow().isoformat()
                        })
                        
                        self.last_alerts[alert_key] = current_time
        
        # Check endpoint response times
        for endpoint_key, endpoint_data in metrics['requests'].items():
            if endpoint_data['avg_response_time'] > self.alert_thresholds['response_time']:
                alert_key = f"response_time.{endpoint_key}"
                
                if (alert_key not in self.last_alerts or 
                    current_time - self.last_alerts[alert_key] > self.alert_cooldown):
                    
                    alerts.append({
                        'level': 'warning',
                        'metric': 'response_time',
                        'endpoint': endpoint_key,
                        'value': endpoint_data['avg_response_time'],
                        'threshold': self.alert_thresholds['response_time'],
                        'message': f"High response time for {endpoint_key}: {endpoint_data['avg_response_time']:.2f}s",
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    
                    self.last_alerts[alert_key] = current_time
        
        return alerts
    
    def send_alerts(self, alerts):
        """Send alerts to configured channels."""
        for alert in alerts:
            # Log alert
            if alert['level'] == 'critical':
                current_app.logger.critical(f"ALERT: {alert['message']}")
            else:
                current_app.logger.warning(f"ALERT: {alert['message']}")
            
            # Send to external services
            self._send_to_slack(alert)
            self._send_to_webhook(alert)
    
    def _send_to_slack(self, alert):
        """Send alert to Slack."""
        slack_webhook = os.environ.get('SLACK_WEBHOOK_URL')
        if not slack_webhook:
            return
        
        try:
            import requests
            
            color = 'danger' if alert['level'] == 'critical' else 'warning'
            payload = {
                'attachments': [{
                    'color': color,
                    'title': f"Sentia Alert: {alert['metric'].replace('_', ' ').title()}",
                    'text': alert['message'],
                    'timestamp': int(time.time())
                }]
            }
            
            requests.post(slack_webhook, json=payload, timeout=10)
        except Exception as e:
            current_app.logger.error(f"Failed to send Slack alert: {e}")
    
    def _send_to_webhook(self, alert):
        """Send alert to custom webhook."""
        webhook_url = os.environ.get('ALERT_WEBHOOK_URL')
        if not webhook_url:
            return
        
        try:
            import requests
            requests.post(webhook_url, json=alert, timeout=10)
        except Exception as e:
            current_app.logger.error(f"Failed to send webhook alert: {e}")

# Global alert manager
alert_manager = AlertManager()

def init_monitoring(app):
    """Initialize monitoring for the Flask app."""
    
    @app.route('/metrics')
    def metrics_endpoint():
        """Expose metrics endpoint for monitoring."""
        return collector.get_all_metrics()
    
    @app.route('/alerts')
    def alerts_endpoint():
        """Check and return current alerts."""
        alerts = alert_manager.check_alerts()
        return {'alerts': alerts}
    
    @app.before_request
    def before_request():
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        # Record business metrics
        if hasattr(g, 'start_time'):
            response_time = time.time() - g.start_time
            endpoint = request.endpoint or 'unknown'
            method = request.method
            status_code = response.status_code
            
            collector.record_request(endpoint, method, status_code, response_time)
        
        return response
    
    # Periodic alert checking (in production, use Celery task)
    if not app.debug:
        import threading
        
        def check_alerts_periodically():
            while True:
                try:
                    alerts = alert_manager.check_alerts()
                    if alerts:
                        alert_manager.send_alerts(alerts)
                except Exception as e:
                    app.logger.error(f"Alert checking error: {e}")
                
                time.sleep(60)  # Check every minute
        
        alert_thread = threading.Thread(target=check_alerts_periodically, daemon=True)
        alert_thread.start()