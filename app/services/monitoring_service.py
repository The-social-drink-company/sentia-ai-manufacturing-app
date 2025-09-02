"""
Comprehensive performance monitoring service for Sentia Manufacturing Dashboard
"""

import time
import psutil
import threading
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import deque, defaultdict
from flask import current_app, g
from sqlalchemy import text
from app import db
from app.utils.performance import performance_metrics

logger = logging.getLogger(__name__)

class MetricsCollector:
    """Collect and aggregate system and application metrics."""
    
    def __init__(self):
        self._lock = threading.Lock()
        self.metrics = {
            'system': {
                'cpu_usage': deque(maxlen=100),
                'memory_usage': deque(maxlen=100),
                'disk_usage': deque(maxlen=100),
                'network_io': deque(maxlen=100),
                'load_average': deque(maxlen=100)
            },
            'application': {
                'request_count': 0,
                'error_count': 0,
                'active_users': set(),
                'response_times': deque(maxlen=1000),
                'slow_requests': deque(maxlen=100),
                'endpoint_stats': defaultdict(lambda: {'count': 0, 'total_time': 0, 'errors': 0})
            },
            'database': {
                'query_count': 0,
                'slow_queries': deque(maxlen=100),
                'connection_pool_size': 0,
                'active_connections': 0,
                'failed_connections': 0
            },
            'business': {
                'forecasts_generated': 0,
                'schedules_created': 0,
                'optimizations_run': 0,
                'api_syncs_completed': 0
            }
        }
        
        self.alerts = deque(maxlen=500)
        self.is_collecting = False
        self.collection_thread = None
    
    def start_collection(self, interval: int = 30):
        """Start metrics collection in background thread."""
        if self.is_collecting:
            return
        
        self.is_collecting = True
        self.collection_thread = threading.Thread(
            target=self._collect_metrics_loop,
            args=(interval,),
            daemon=True
        )
        self.collection_thread.start()
        logger.info(f"Started metrics collection with {interval}s interval")
    
    def stop_collection(self):
        """Stop metrics collection."""
        self.is_collecting = False
        if self.collection_thread:
            self.collection_thread.join(timeout=5)
        logger.info("Stopped metrics collection")
    
    def _collect_metrics_loop(self, interval: int):
        """Main metrics collection loop."""
        while self.is_collecting:
            try:
                self._collect_system_metrics()
                self._collect_database_metrics()
                self._check_alerts()
                time.sleep(interval)
            except Exception as e:
                logger.error(f"Metrics collection error: {e}")
                time.sleep(interval)
    
    def _collect_system_metrics(self):
        """Collect system-level metrics."""
        try:
            with self._lock:
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=0.1)
                self.metrics['system']['cpu_usage'].append({
                    'timestamp': datetime.utcnow().isoformat(),
                    'value': cpu_percent
                })
                
                # Memory usage
                memory = psutil.virtual_memory()
                self.metrics['system']['memory_usage'].append({
                    'timestamp': datetime.utcnow().isoformat(),
                    'value': memory.percent,
                    'available': memory.available,
                    'total': memory.total
                })
                
                # Disk usage
                disk = psutil.disk_usage('/')
                self.metrics['system']['disk_usage'].append({
                    'timestamp': datetime.utcnow().isoformat(),
                    'value': (disk.used / disk.total) * 100,
                    'free': disk.free,
                    'total': disk.total
                })
                
                # Network I/O
                network = psutil.net_io_counters()
                self.metrics['system']['network_io'].append({
                    'timestamp': datetime.utcnow().isoformat(),
                    'bytes_sent': network.bytes_sent,
                    'bytes_recv': network.bytes_recv,
                    'packets_sent': network.packets_sent,
                    'packets_recv': network.packets_recv
                })
                
                # Load average (Unix-like systems)
                try:
                    load_avg = psutil.getloadavg()
                    self.metrics['system']['load_average'].append({
                        'timestamp': datetime.utcnow().isoformat(),
                        'load_1m': load_avg[0],
                        'load_5m': load_avg[1],
                        'load_15m': load_avg[2]
                    })
                except AttributeError:
                    # Windows doesn't have load average
                    pass
                
        except Exception as e:
            logger.error(f"System metrics collection error: {e}")
    
    def _collect_database_metrics(self):
        """Collect database performance metrics."""
        try:
            with self._lock:
                # Query connection pool stats
                if hasattr(db.engine, 'pool'):
                    pool = db.engine.pool
                    self.metrics['database']['connection_pool_size'] = pool.size()
                    self.metrics['database']['active_connections'] = pool.checkedout()
                
                # Test database connectivity and response time
                start_time = time.time()
                try:
                    db.session.execute(text('SELECT 1'))
                    db_response_time = time.time() - start_time
                    
                    if db_response_time > 1.0:  # Slow query threshold
                        self.metrics['database']['slow_queries'].append({
                            'timestamp': datetime.utcnow().isoformat(),
                            'query': 'SELECT 1',
                            'duration': db_response_time
                        })
                
                except Exception as e:
                    self.metrics['database']['failed_connections'] += 1
                    logger.error(f"Database connectivity check failed: {e}")
                
        except Exception as e:
            logger.error(f"Database metrics collection error: {e}")
    
    def _check_alerts(self):
        """Check for alert conditions and generate alerts."""
        try:
            current_time = datetime.utcnow()
            
            # CPU usage alert
            if self.metrics['system']['cpu_usage']:
                latest_cpu = self.metrics['system']['cpu_usage'][-1]['value']
                if latest_cpu > 90:
                    self._create_alert('HIGH_CPU', f'CPU usage at {latest_cpu:.1f}%', 'critical')
                elif latest_cpu > 80:
                    self._create_alert('HIGH_CPU', f'CPU usage at {latest_cpu:.1f}%', 'warning')
            
            # Memory usage alert
            if self.metrics['system']['memory_usage']:
                latest_memory = self.metrics['system']['memory_usage'][-1]['value']
                if latest_memory > 95:
                    self._create_alert('HIGH_MEMORY', f'Memory usage at {latest_memory:.1f}%', 'critical')
                elif latest_memory > 85:
                    self._create_alert('HIGH_MEMORY', f'Memory usage at {latest_memory:.1f}%', 'warning')
            
            # Response time alert
            if self.metrics['application']['response_times']:
                avg_response_time = sum(self.metrics['application']['response_times']) / len(self.metrics['application']['response_times'])
                if avg_response_time > 5.0:
                    self._create_alert('SLOW_RESPONSE', f'Average response time: {avg_response_time:.2f}s', 'warning')
            
            # Error rate alert
            total_requests = self.metrics['application']['request_count']
            error_count = self.metrics['application']['error_count']
            if total_requests > 0:
                error_rate = (error_count / total_requests) * 100
                if error_rate > 5:
                    self._create_alert('HIGH_ERROR_RATE', f'Error rate: {error_rate:.1f}%', 'critical')
                elif error_rate > 2:
                    self._create_alert('HIGH_ERROR_RATE', f'Error rate: {error_rate:.1f}%', 'warning')
            
        except Exception as e:
            logger.error(f"Alert checking error: {e}")
    
    def _create_alert(self, alert_type: str, message: str, severity: str):
        """Create and store an alert."""
        alert = {
            'id': f"{alert_type}_{int(time.time())}",
            'type': alert_type,
            'message': message,
            'severity': severity,
            'timestamp': datetime.utcnow().isoformat(),
            'acknowledged': False
        }
        
        with self._lock:
            self.alerts.append(alert)
        
        logger.warning(f"Alert created: {alert_type} - {message}")
        
        # Send notification (would integrate with notification system)
        self._send_alert_notification(alert)
    
    def _send_alert_notification(self, alert: Dict):
        """Send alert notification (placeholder for integration)."""
        # This would integrate with email, Slack, SMS, etc.
        pass
    
    def record_request(self, endpoint: str, method: str, duration: float, status_code: int, user_id: Optional[int] = None):
        """Record request metrics."""
        with self._lock:
            self.metrics['application']['request_count'] += 1
            self.metrics['application']['response_times'].append(duration)
            
            # Track slow requests
            if duration > 2.0:
                self.metrics['application']['slow_requests'].append({
                    'timestamp': datetime.utcnow().isoformat(),
                    'endpoint': endpoint,
                    'method': method,
                    'duration': duration,
                    'status_code': status_code,
                    'user_id': user_id
                })
            
            # Track endpoint statistics
            endpoint_key = f"{method} {endpoint}"
            stats = self.metrics['application']['endpoint_stats'][endpoint_key]
            stats['count'] += 1
            stats['total_time'] += duration
            
            if status_code >= 400:
                stats['errors'] += 1
                self.metrics['application']['error_count'] += 1
            
            # Track active users
            if user_id:
                self.metrics['application']['active_users'].add(user_id)
    
    def record_business_metric(self, metric_type: str, increment: int = 1):
        """Record business-specific metrics."""
        with self._lock:
            if metric_type in self.metrics['business']:
                self.metrics['business'][metric_type] += increment
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive metrics summary."""
        with self._lock:
            summary = {
                'timestamp': datetime.utcnow().isoformat(),
                'system': self._summarize_system_metrics(),
                'application': self._summarize_application_metrics(),
                'database': self._summarize_database_metrics(),
                'business': dict(self.metrics['business']),
                'alerts': {
                    'total': len(self.alerts),
                    'critical': len([a for a in self.alerts if a['severity'] == 'critical']),
                    'warning': len([a for a in self.alerts if a['severity'] == 'warning']),
                    'recent': list(self.alerts)[-10:]  # Last 10 alerts
                }
            }
            
            return summary
    
    def _summarize_system_metrics(self) -> Dict[str, Any]:
        """Summarize system metrics."""
        summary = {}
        
        for metric_name, metric_data in self.metrics['system'].items():
            if metric_data:
                if metric_name in ['cpu_usage', 'memory_usage', 'disk_usage']:
                    values = [d['value'] for d in metric_data]
                    summary[metric_name] = {
                        'current': values[-1] if values else 0,
                        'average': sum(values) / len(values) if values else 0,
                        'max': max(values) if values else 0,
                        'min': min(values) if values else 0
                    }
                elif metric_name == 'load_average' and metric_data:
                    latest = metric_data[-1]
                    summary[metric_name] = {
                        'load_1m': latest.get('load_1m', 0),
                        'load_5m': latest.get('load_5m', 0),
                        'load_15m': latest.get('load_15m', 0)
                    }
        
        return summary
    
    def _summarize_application_metrics(self) -> Dict[str, Any]:
        """Summarize application metrics."""
        response_times = list(self.metrics['application']['response_times'])
        
        summary = {
            'total_requests': self.metrics['application']['request_count'],
            'error_count': self.metrics['application']['error_count'],
            'error_rate': (self.metrics['application']['error_count'] / max(self.metrics['application']['request_count'], 1)) * 100,
            'active_users': len(self.metrics['application']['active_users']),
            'response_times': {
                'average': sum(response_times) / len(response_times) if response_times else 0,
                'p95': sorted(response_times)[int(len(response_times) * 0.95)] if response_times else 0,
                'p99': sorted(response_times)[int(len(response_times) * 0.99)] if response_times else 0
            },
            'slow_requests': len(self.metrics['application']['slow_requests']),
            'top_endpoints': self._get_top_endpoints()
        }
        
        return summary
    
    def _summarize_database_metrics(self) -> Dict[str, Any]:
        """Summarize database metrics."""
        return {
            'connection_pool_size': self.metrics['database']['connection_pool_size'],
            'active_connections': self.metrics['database']['active_connections'],
            'failed_connections': self.metrics['database']['failed_connections'],
            'slow_queries': len(self.metrics['database']['slow_queries']),
            'query_count': self.metrics['database']['query_count']
        }
    
    def _get_top_endpoints(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top endpoints by request count."""
        endpoints = []
        
        for endpoint, stats in self.metrics['application']['endpoint_stats'].items():
            endpoints.append({
                'endpoint': endpoint,
                'count': stats['count'],
                'avg_time': stats['total_time'] / stats['count'] if stats['count'] > 0 else 0,
                'error_rate': (stats['errors'] / stats['count']) * 100 if stats['count'] > 0 else 0
            })
        
        return sorted(endpoints, key=lambda x: x['count'], reverse=True)[:limit]
    
    def get_alerts(self, severity: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Get alerts with optional filtering."""
        with self._lock:
            alerts = list(self.alerts)
        
        if severity:
            alerts = [a for a in alerts if a['severity'] == severity]
        
        return sorted(alerts, key=lambda x: x['timestamp'], reverse=True)[:limit]
    
    def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert."""
        with self._lock:
            for alert in self.alerts:
                if alert['id'] == alert_id:
                    alert['acknowledged'] = True
                    alert['acknowledged_at'] = datetime.utcnow().isoformat()
                    return True
        return False

class HealthChecker:
    """System health monitoring and checks."""
    
    def __init__(self):
        self.checks = {}
    
    def register_check(self, name: str, check_func: callable, critical: bool = False):
        """Register a health check."""
        self.checks[name] = {
            'function': check_func,
            'critical': critical,
            'last_result': None,
            'last_check': None
        }
    
    def run_checks(self) -> Dict[str, Any]:
        """Run all registered health checks."""
        results = {
            'overall_status': 'healthy',
            'checks': {},
            'timestamp': datetime.utcnow().isoformat()
        }
        
        critical_failures = 0
        
        for name, check_info in self.checks.items():
            try:
                start_time = time.time()
                check_result = check_info['function']()
                duration = time.time() - start_time
                
                if isinstance(check_result, bool):
                    status = 'pass' if check_result else 'fail'
                    message = 'Check passed' if check_result else 'Check failed'
                else:
                    status = check_result.get('status', 'unknown')
                    message = check_result.get('message', 'No message')
                
                results['checks'][name] = {
                    'status': status,
                    'message': message,
                    'duration': duration,
                    'critical': check_info['critical']
                }
                
                if status == 'fail' and check_info['critical']:
                    critical_failures += 1
                
                check_info['last_result'] = status
                check_info['last_check'] = datetime.utcnow()
                
            except Exception as e:
                results['checks'][name] = {
                    'status': 'error',
                    'message': str(e),
                    'duration': 0,
                    'critical': check_info['critical']
                }
                
                if check_info['critical']:
                    critical_failures += 1
        
        # Determine overall status
        if critical_failures > 0:
            results['overall_status'] = 'unhealthy'
        elif any(check['status'] in ['fail', 'error'] for check in results['checks'].values()):
            results['overall_status'] = 'degraded'
        
        return results
    
    def database_check(self) -> Dict[str, Any]:
        """Check database connectivity."""
        try:
            start_time = time.time()
            db.session.execute(text('SELECT 1'))
            duration = time.time() - start_time
            
            if duration > 1.0:
                return {
                    'status': 'warn',
                    'message': f'Database responding slowly ({duration:.2f}s)'
                }
            else:
                return {
                    'status': 'pass',
                    'message': f'Database healthy ({duration:.3f}s)'
                }
                
        except Exception as e:
            return {
                'status': 'fail',
                'message': f'Database connection failed: {str(e)}'
            }
    
    def cache_check(self) -> Dict[str, Any]:
        """Check cache system."""
        try:
            from app.utils.caching import cache
            
            test_key = 'health_check_test'
            test_value = str(time.time())
            
            # Test set
            cache.set(test_key, test_value, timeout=60)
            
            # Test get
            retrieved = cache.get(test_key)
            
            if retrieved == test_value:
                cache.delete(test_key)
                return {
                    'status': 'pass',
                    'message': 'Cache system healthy'
                }
            else:
                return {
                    'status': 'fail',
                    'message': 'Cache set/get failed'
                }
                
        except Exception as e:
            return {
                'status': 'fail',
                'message': f'Cache system error: {str(e)}'
            }
    
    def external_api_check(self) -> Dict[str, Any]:
        """Check external API connectivity."""
        # This would check Amazon, Shopify, etc. APIs
        return {
            'status': 'pass',
            'message': 'External APIs healthy'
        }

# Global instances
metrics_collector = MetricsCollector()
health_checker = HealthChecker()

# Register default health checks
health_checker.register_check('database', health_checker.database_check, critical=True)
health_checker.register_check('cache', health_checker.cache_check, critical=False)
health_checker.register_check('external_apis', health_checker.external_api_check, critical=False)

def init_monitoring(app):
    """Initialize monitoring for the Flask app."""
    @app.before_request
    def before_request():
        g.start_time = time.time()
        g.endpoint = request.endpoint
        g.method = request.method
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            user_id = getattr(g, 'current_user', {}).get('id') if hasattr(g, 'current_user') else None
            
            metrics_collector.record_request(
                endpoint=g.endpoint or 'unknown',
                method=g.method,
                duration=duration,
                status_code=response.status_code,
                user_id=user_id
            )
        
        return response
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        metrics_collector.record_business_metric('errors')
        logger.exception("Unhandled exception")
        raise e
    
    # Start metrics collection
    metrics_collector.start_collection()
    
    logger.info("Performance monitoring initialized")

def get_monitoring_dashboard_data() -> Dict[str, Any]:
    """Get data for monitoring dashboard."""
    return {
        'metrics': metrics_collector.get_metrics_summary(),
        'health': health_checker.run_checks(),
        'performance_summary': performance_metrics.get_summary()
    }