#!/usr/bin/env python3
"""
Application monitoring script for production health checks.
Monitors database, Redis, and application metrics.
"""

import os
import sys
import time
import requests
import psutil
import json
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ApplicationMonitor:
    def __init__(self):
        self.app_url = os.environ.get('APP_URL', 'http://localhost:5000')
        self.metrics = {}
    
    def check_health_endpoint(self):
        """Check the application health endpoint."""
        try:
            response = requests.get(f"{self.app_url}/api/health", timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                self.metrics['health_status'] = health_data.get('status', 'unknown')
                self.metrics['database_status'] = health_data.get('database', 'unknown')
                self.metrics['redis_status'] = health_data.get('redis', 'unknown')
                return True
            else:
                logger.error(f"Health check failed with status: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Health check error: {e}")
            self.metrics['health_status'] = 'error'
            return False
    
    def check_system_resources(self):
        """Check system resource utilization."""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            self.metrics['cpu_usage'] = cpu_percent
            
            # Memory usage
            memory = psutil.virtual_memory()
            self.metrics['memory_usage'] = memory.percent
            self.metrics['memory_available'] = memory.available
            
            # Disk usage
            disk = psutil.disk_usage('/')
            self.metrics['disk_usage'] = disk.percent
            self.metrics['disk_free'] = disk.free
            
            # Process count
            self.metrics['process_count'] = len(psutil.pids())
            
            return True
        except Exception as e:
            logger.error(f"System resource check error: {e}")
            return False
    
    def check_response_time(self):
        """Check application response time."""
        try:
            start_time = time.time()
            response = requests.get(f"{self.app_url}/api/health", timeout=30)
            response_time = (time.time() - start_time) * 1000  # milliseconds
            
            self.metrics['response_time_ms'] = response_time
            
            if response_time > 5000:  # 5 seconds
                logger.warning(f"High response time: {response_time:.2f}ms")
            
            return True
        except Exception as e:
            logger.error(f"Response time check error: {e}")
            return False
    
    def generate_report(self):
        """Generate monitoring report."""
        report = {
            'timestamp': datetime.now().isoformat(),
            'metrics': self.metrics,
            'alerts': []
        }
        
        # Check for alerts
        if self.metrics.get('health_status') != 'healthy':
            report['alerts'].append({
                'level': 'critical',
                'message': f"Application health check failed: {self.metrics.get('health_status')}"
            })
        
        if self.metrics.get('cpu_usage', 0) > 80:
            report['alerts'].append({
                'level': 'warning',
                'message': f"High CPU usage: {self.metrics.get('cpu_usage'):.1f}%"
            })
        
        if self.metrics.get('memory_usage', 0) > 85:
            report['alerts'].append({
                'level': 'warning',
                'message': f"High memory usage: {self.metrics.get('memory_usage'):.1f}%"
            })
        
        if self.metrics.get('disk_usage', 0) > 90:
            report['alerts'].append({
                'level': 'critical',
                'message': f"High disk usage: {self.metrics.get('disk_usage'):.1f}%"
            })
        
        if self.metrics.get('response_time_ms', 0) > 2000:
            report['alerts'].append({
                'level': 'warning',
                'message': f"High response time: {self.metrics.get('response_time_ms'):.1f}ms"
            })
        
        return report
    
    def run_checks(self):
        """Run all monitoring checks."""
        logger.info("Starting monitoring checks...")
        
        checks = [
            ('Health Endpoint', self.check_health_endpoint),
            ('System Resources', self.check_system_resources),
            ('Response Time', self.check_response_time)
        ]
        
        for check_name, check_func in checks:
            try:
                logger.info(f"Running {check_name} check...")
                success = check_func()
                if success:
                    logger.info(f"{check_name} check passed")
                else:
                    logger.warning(f"{check_name} check failed")
            except Exception as e:
                logger.error(f"{check_name} check error: {e}")
        
        # Generate and return report
        report = self.generate_report()
        
        # Log critical alerts
        for alert in report['alerts']:
            if alert['level'] == 'critical':
                logger.critical(alert['message'])
            elif alert['level'] == 'warning':
                logger.warning(alert['message'])
        
        return report

def main():
    monitor = ApplicationMonitor()
    
    if len(sys.argv) > 1 and sys.argv[1] == '--continuous':
        # Continuous monitoring mode
        interval = int(sys.argv[2]) if len(sys.argv) > 2 else 60
        logger.info(f"Starting continuous monitoring (interval: {interval}s)")
        
        while True:
            try:
                report = monitor.run_checks()
                print(json.dumps(report, indent=2))
                time.sleep(interval)
            except KeyboardInterrupt:
                logger.info("Monitoring stopped")
                break
            except Exception as e:
                logger.error(f"Monitoring error: {e}")
                time.sleep(interval)
    else:
        # Single check mode
        report = monitor.run_checks()
        print(json.dumps(report, indent=2))
        
        # Exit with error code if there are critical alerts
        if any(alert['level'] == 'critical' for alert in report['alerts']):
            sys.exit(1)

if __name__ == "__main__":
    main()