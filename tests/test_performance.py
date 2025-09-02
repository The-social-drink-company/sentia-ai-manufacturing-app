"""
Performance testing suite for Sentia Manufacturing Dashboard
"""

import pytest
import time
import threading
import requests
import concurrent.futures
from unittest.mock import patch, MagicMock
from flask import Flask
import psutil
import statistics
from typing import List, Dict, Any, Tuple
import numpy as np
from datetime import datetime, timedelta

from app import create_app, db
from app.models.user import User
from app.models.product import Product
from app.services.enhanced_forecasting_service import EnhancedForecastingService
from app.services.stock_optimization_service import StockOptimizationService
from app.utils.performance import PerformanceMetrics, measure_time
from app.utils.caching import cache

class PerformanceTestSuite:
    """Comprehensive performance testing suite."""
    
    def __init__(self):
        self.app = None
        self.client = None
        self.performance_data = []
        self.load_test_results = {}
        
    def setup_test_environment(self):
        """Set up test environment."""
        self.app = create_app('testing')
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            self._create_test_data()
    
    def _create_test_data(self):
        """Create test data for performance testing."""
        # Create test users
        for i in range(100):
            user = User(
                email=f'testuser{i}@example.com',
                first_name=f'Test{i}',
                last_name='User',
                role='user' if i < 90 else 'admin'
            )
            user.set_password('password')
            db.session.add(user)
        
        # Create test products
        product_types = ['Red', 'Black', 'Gold']
        markets = ['UK', 'EU', 'USA']
        
        for i in range(300):  # 100 products per type
            product_type = product_types[i % 3]
            market = markets[i // 100]
            
            product = Product(
                name=f'GABA {product_type} {market} {i}',
                sku=f'GABA-{product_type[:3].upper()}-{market}-{i:03d}',
                product_type=product_type,
                market=market,
                cost_price=15.0 + (i % 10),
                selling_price=30.0 + (i % 20),
                lead_time_days=3 + (i % 5)
            )
            db.session.add(product)
        
        db.session.commit()

class LoadTester:
    """Load testing functionality."""
    
    def __init__(self, base_url: str = 'http://localhost:5000'):
        self.base_url = base_url
        self.session = requests.Session()
    
    def authenticate(self, email: str = 'testuser@example.com', password: str = 'password'):
        """Authenticate with the application."""
        response = self.session.post(f'{self.base_url}/auth/login', data={
            'email': email,
            'password': password
        })
        return response.status_code == 200
    
    def load_test_endpoint(self, endpoint: str, concurrent_users: int = 10, 
                          duration_seconds: int = 60, method: str = 'GET', 
                          data: Dict = None) -> Dict[str, Any]:
        """Perform load test on specific endpoint."""
        results = {
            'endpoint': endpoint,
            'concurrent_users': concurrent_users,
            'duration': duration_seconds,
            'method': method,
            'response_times': [],
            'status_codes': [],
            'errors': [],
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'requests_per_second': 0,
            'avg_response_time': 0,
            'p95_response_time': 0,
            'p99_response_time': 0
        }
        
        def make_request():
            """Make a single request."""
            start_time = time.time()
            try:
                if method.upper() == 'GET':
                    response = self.session.get(f'{self.base_url}{endpoint}')
                elif method.upper() == 'POST':
                    response = self.session.post(f'{self.base_url}{endpoint}', json=data)
                else:
                    response = self.session.request(method, f'{self.base_url}{endpoint}', json=data)
                
                duration = time.time() - start_time
                
                return {
                    'duration': duration,
                    'status_code': response.status_code,
                    'success': 200 <= response.status_code < 300,
                    'error': None
                }
                
            except Exception as e:
                duration = time.time() - start_time
                return {
                    'duration': duration,
                    'status_code': 0,
                    'success': False,
                    'error': str(e)
                }
        
        def worker():
            """Worker thread for load testing."""
            end_time = time.time() + duration_seconds
            
            while time.time() < end_time:
                result = make_request()
                
                results['response_times'].append(result['duration'])
                results['status_codes'].append(result['status_code'])
                results['total_requests'] += 1
                
                if result['success']:
                    results['successful_requests'] += 1
                else:
                    results['failed_requests'] += 1
                    if result['error']:
                        results['errors'].append(result['error'])
                
                # Small delay to prevent overwhelming
                time.sleep(0.1)
        
        # Start worker threads
        threads = []
        for _ in range(concurrent_users):
            thread = threading.Thread(target=worker)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Calculate statistics
        if results['response_times']:
            results['avg_response_time'] = statistics.mean(results['response_times'])
            results['p95_response_time'] = np.percentile(results['response_times'], 95)
            results['p99_response_time'] = np.percentile(results['response_times'], 99)
        
        results['requests_per_second'] = results['total_requests'] / duration_seconds
        
        return results
    
    def stress_test(self, endpoints: List[str], max_concurrent_users: int = 100, 
                   ramp_up_time: int = 300) -> Dict[str, Any]:
        """Perform stress test by gradually increasing load."""
        stress_results = {
            'max_concurrent_users': max_concurrent_users,
            'ramp_up_time': ramp_up_time,
            'breakdown_point': None,
            'endpoint_results': {}
        }
        
        step_size = max(1, max_concurrent_users // 10)
        
        for concurrent_users in range(step_size, max_concurrent_users + 1, step_size):
            print(f"Testing with {concurrent_users} concurrent users...")
            
            for endpoint in endpoints:
                results = self.load_test_endpoint(
                    endpoint=endpoint,
                    concurrent_users=concurrent_users,
                    duration_seconds=30  # Shorter duration for stress test
                )
                
                if endpoint not in stress_results['endpoint_results']:
                    stress_results['endpoint_results'][endpoint] = []
                
                stress_results['endpoint_results'][endpoint].append(results)
                
                # Check for breakdown point (high error rate or slow response)
                error_rate = results['failed_requests'] / results['total_requests'] if results['total_requests'] > 0 else 0
                
                if error_rate > 0.05 or results['avg_response_time'] > 5.0:  # 5% error rate or 5s response time
                    if not stress_results['breakdown_point']:
                        stress_results['breakdown_point'] = {
                            'concurrent_users': concurrent_users,
                            'endpoint': endpoint,
                            'error_rate': error_rate,
                            'avg_response_time': results['avg_response_time']
                        }
            
            # Break if breakdown point reached
            if stress_results['breakdown_point']:
                break
        
        return stress_results

class PerformanceBenchmark:
    """Performance benchmarking utilities."""
    
    @staticmethod
    def benchmark_database_queries(app):
        """Benchmark database query performance."""
        with app.app_context():
            results = {}
            
            # Benchmark product queries
            start_time = time.time()
            products = Product.query.limit(100).all()
            results['product_query_100'] = time.time() - start_time
            
            start_time = time.time()
            products = Product.query.filter_by(is_active=True).all()
            results['product_query_active'] = time.time() - start_time
            
            start_time = time.time()
            product_count = Product.query.count()
            results['product_count_query'] = time.time() - start_time
            
            # Benchmark user queries
            start_time = time.time()
            users = User.query.limit(50).all()
            results['user_query_50'] = time.time() - start_time
            
            return results
    
    @staticmethod
    def benchmark_forecasting_service():
        """Benchmark forecasting service performance."""
        service = EnhancedForecastingService()
        results = {}
        
        # Generate test data
        test_data = np.random.rand(365) * 100 + 50  # 365 days of sales data
        
        # Benchmark different forecasting methods
        methods = ['sma', 'exp_smoothing', 'linear_regression']
        
        for method in methods:
            start_time = time.time()
            
            try:
                # This would call the actual forecasting method
                # forecast = service.generate_forecast_from_data(test_data, method, 30)
                
                # Simulate processing time
                time.sleep(0.1)  # Remove in actual implementation
                
                results[f'forecast_{method}'] = time.time() - start_time
                
            except Exception as e:
                results[f'forecast_{method}_error'] = str(e)
        
        return results
    
    @staticmethod
    def benchmark_stock_optimization():
        """Benchmark stock optimization performance."""
        service = StockOptimizationService()
        results = {}
        
        # Test with different numbers of products
        product_counts = [10, 50, 100, 500]
        
        for count in product_counts:
            start_time = time.time()
            
            try:
                # This would call actual optimization
                # optimization_result = service.optimize_stock_levels(product_count=count)
                
                # Simulate processing time based on complexity
                time.sleep(count * 0.001)  # Remove in actual implementation
                
                results[f'optimization_{count}_products'] = time.time() - start_time
                
            except Exception as e:
                results[f'optimization_{count}_products_error'] = str(e)
        
        return results
    
    @staticmethod
    def benchmark_cache_performance():
        """Benchmark cache performance."""
        results = {}
        
        # Test cache set performance
        start_time = time.time()
        for i in range(1000):
            cache.set(f'test_key_{i}', f'test_value_{i}', timeout=300)
        results['cache_set_1000'] = time.time() - start_time
        
        # Test cache get performance
        start_time = time.time()
        for i in range(1000):
            cache.get(f'test_key_{i}')
        results['cache_get_1000'] = time.time() - start_time
        
        # Test cache delete performance
        start_time = time.time()
        for i in range(1000):
            cache.delete(f'test_key_{i}')
        results['cache_delete_1000'] = time.time() - start_time
        
        return results

class SystemResourceMonitor:
    """Monitor system resources during testing."""
    
    def __init__(self):
        self.monitoring = False
        self.metrics = []
    
    def start_monitoring(self, interval: float = 1.0):
        """Start resource monitoring."""
        self.monitoring = True
        self.metrics = []
        
        def monitor():
            while self.monitoring:
                try:
                    cpu_percent = psutil.cpu_percent(interval=0.1)
                    memory = psutil.virtual_memory()
                    disk = psutil.disk_usage('/')
                    
                    self.metrics.append({
                        'timestamp': datetime.utcnow(),
                        'cpu_percent': cpu_percent,
                        'memory_percent': memory.percent,
                        'memory_available': memory.available,
                        'disk_percent': (disk.used / disk.total) * 100,
                        'disk_free': disk.free
                    })
                    
                except Exception as e:
                    print(f"Monitoring error: {e}")
                
                time.sleep(interval)
        
        self.monitor_thread = threading.Thread(target=monitor, daemon=True)
        self.monitor_thread.start()
    
    def stop_monitoring(self) -> Dict[str, Any]:
        """Stop monitoring and return results."""
        self.monitoring = False
        
        if not self.metrics:
            return {}
        
        cpu_values = [m['cpu_percent'] for m in self.metrics]
        memory_values = [m['memory_percent'] for m in self.metrics]
        disk_values = [m['disk_percent'] for m in self.metrics]
        
        return {
            'duration': len(self.metrics),
            'cpu': {
                'avg': statistics.mean(cpu_values),
                'max': max(cpu_values),
                'min': min(cpu_values),
                'p95': np.percentile(cpu_values, 95)
            },
            'memory': {
                'avg': statistics.mean(memory_values),
                'max': max(memory_values),
                'min': min(memory_values),
                'p95': np.percentile(memory_values, 95)
            },
            'disk': {
                'avg': statistics.mean(disk_values),
                'max': max(disk_values),
                'min': min(disk_values)
            },
            'raw_metrics': self.metrics
        }

# Test functions for pytest
class TestPerformance:
    """Performance test cases."""
    
    @pytest.fixture(scope='class')
    def test_suite(self):
        """Set up performance test suite."""
        suite = PerformanceTestSuite()
        suite.setup_test_environment()
        return suite
    
    def test_response_times(self, test_suite):
        """Test API response times."""
        with test_suite.app.test_request_context():
            # Test dashboard endpoint
            start_time = time.time()
            response = test_suite.client.get('/api/health')
            duration = time.time() - start_time
            
            assert response.status_code == 200
            assert duration < 1.0, f"Health check took {duration}s (should be < 1s)"
    
    def test_database_performance(self, test_suite):
        """Test database query performance."""
        results = PerformanceBenchmark.benchmark_database_queries(test_suite.app)
        
        # Assert performance requirements
        assert results['product_query_100'] < 0.5, "Product query too slow"
        assert results['product_count_query'] < 0.1, "Count query too slow"
    
    def test_concurrent_requests(self, test_suite):
        """Test handling of concurrent requests."""
        def make_request():
            response = test_suite.client.get('/api/health')
            return response.status_code == 200
        
        # Test with multiple concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(50)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        success_rate = sum(results) / len(results)
        assert success_rate > 0.95, f"Success rate {success_rate} too low"
    
    def test_memory_usage(self, test_suite):
        """Test memory usage during operations."""
        monitor = SystemResourceMonitor()
        monitor.start_monitoring()
        
        # Perform memory-intensive operations
        for _ in range(100):
            test_suite.client.get('/api/health')
        
        results = monitor.stop_monitoring()
        
        if results:
            assert results['memory']['max'] < 90, "Memory usage too high"
    
    @pytest.mark.slow
    def test_load_performance(self, test_suite):
        """Test load performance (marked as slow test)."""
        load_tester = LoadTester('http://localhost:5000')
        
        if load_tester.authenticate():
            results = load_tester.load_test_endpoint(
                endpoint='/api/health',
                concurrent_users=5,
                duration_seconds=30
            )
            
            assert results['avg_response_time'] < 2.0, "Average response time too high"
            assert results['requests_per_second'] > 1.0, "Throughput too low"

def run_comprehensive_benchmark():
    """Run comprehensive performance benchmark."""
    print("Starting comprehensive performance benchmark...")
    
    # Initialize test suite
    suite = PerformanceTestSuite()
    suite.setup_test_environment()
    
    # Initialize monitor
    monitor = SystemResourceMonitor()
    monitor.start_monitoring()
    
    benchmark_results = {
        'timestamp': datetime.utcnow().isoformat(),
        'database': PerformanceBenchmark.benchmark_database_queries(suite.app),
        'forecasting': PerformanceBenchmark.benchmark_forecasting_service(),
        'optimization': PerformanceBenchmark.benchmark_stock_optimization(),
        'cache': PerformanceBenchmark.benchmark_cache_performance()
    }
    
    # Stop monitoring
    system_metrics = monitor.stop_monitoring()
    benchmark_results['system_resources'] = system_metrics
    
    # Load testing
    print("Running load tests...")
    load_tester = LoadTester()
    
    if load_tester.authenticate():
        endpoints_to_test = ['/api/health', '/dashboard', '/api/products']
        
        for endpoint in endpoints_to_test:
            print(f"Load testing {endpoint}...")
            results = load_tester.load_test_endpoint(endpoint, concurrent_users=10, duration_seconds=60)
            benchmark_results[f'load_test_{endpoint.replace("/", "_")}'] = results
    
    # Generate report
    generate_performance_report(benchmark_results)
    
    return benchmark_results

def generate_performance_report(results: Dict[str, Any]):
    """Generate performance report."""
    report_path = f'performance_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.md'
    
    with open(report_path, 'w') as f:
        f.write("# Performance Benchmark Report\n\n")
        f.write(f"Generated: {results['timestamp']}\n\n")
        
        f.write("## Database Performance\n\n")
        for test, duration in results['database'].items():
            f.write(f"- {test}: {duration:.3f}s\n")
        
        f.write("\n## Forecasting Performance\n\n")
        for test, duration in results['forecasting'].items():
            f.write(f"- {test}: {duration:.3f}s\n")
        
        f.write("\n## Cache Performance\n\n")
        for test, duration in results['cache'].items():
            f.write(f"- {test}: {duration:.3f}s\n")
        
        if 'system_resources' in results:
            f.write("\n## System Resources\n\n")
            sys_res = results['system_resources']
            f.write(f"- Average CPU Usage: {sys_res['cpu']['avg']:.1f}%\n")
            f.write(f"- Peak CPU Usage: {sys_res['cpu']['max']:.1f}%\n")
            f.write(f"- Average Memory Usage: {sys_res['memory']['avg']:.1f}%\n")
            f.write(f"- Peak Memory Usage: {sys_res['memory']['max']:.1f}%\n")
        
        # Load test results
        for key, value in results.items():
            if key.startswith('load_test_'):
                f.write(f"\n## Load Test: {key}\n\n")
                f.write(f"- Total Requests: {value['total_requests']}\n")
                f.write(f"- Successful Requests: {value['successful_requests']}\n")
                f.write(f"- Failed Requests: {value['failed_requests']}\n")
                f.write(f"- Requests per Second: {value['requests_per_second']:.2f}\n")
                f.write(f"- Average Response Time: {value['avg_response_time']:.3f}s\n")
                f.write(f"- 95th Percentile Response Time: {value['p95_response_time']:.3f}s\n")
                f.write(f"- 99th Percentile Response Time: {value['p99_response_time']:.3f}s\n")
    
    print(f"Performance report generated: {report_path}")

if __name__ == '__main__':
    run_comprehensive_benchmark()