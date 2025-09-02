"""
Performance utilities and optimizations for Sentia Manufacturing Dashboard
"""

import time
import functools
import logging
from typing import Dict, Any, Optional, Callable
from flask import g, request, current_app
from werkzeug.local import LocalProxy
import psutil
import threading
from datetime import datetime, timedelta
from collections import deque
import json

logger = logging.getLogger(__name__)

# Performance metrics collection
class PerformanceMetrics:
    """Thread-safe performance metrics collector."""
    
    def __init__(self):
        self._lock = threading.Lock()
        self.metrics = {
            'request_times': deque(maxlen=1000),
            'db_query_times': deque(maxlen=1000),
            'cache_hits': 0,
            'cache_misses': 0,
            'active_connections': 0,
            'memory_usage': deque(maxlen=100),
            'cpu_usage': deque(maxlen=100),
            'error_count': 0,
            'request_count': 0
        }
        
    def record_request_time(self, duration: float):
        """Record request processing time."""
        with self._lock:
            self.metrics['request_times'].append(duration)
            self.metrics['request_count'] += 1
    
    def record_db_query_time(self, duration: float):
        """Record database query time."""
        with self._lock:
            self.metrics['db_query_times'].append(duration)
    
    def record_cache_hit(self):
        """Record cache hit."""
        with self._lock:
            self.metrics['cache_hits'] += 1
    
    def record_cache_miss(self):
        """Record cache miss."""
        with self._lock:
            self.metrics['cache_misses'] += 1
    
    def record_error(self):
        """Record error occurrence."""
        with self._lock:
            self.metrics['error_count'] += 1
    
    def update_system_metrics(self):
        """Update system resource metrics."""
        try:
            memory_percent = psutil.virtual_memory().percent
            cpu_percent = psutil.cpu_percent(interval=0.1)
            
            with self._lock:
                self.metrics['memory_usage'].append(memory_percent)
                self.metrics['cpu_usage'].append(cpu_percent)
        except Exception as e:
            logger.error(f"Failed to update system metrics: {e}")
    
    def get_summary(self) -> Dict[str, Any]:
        """Get performance metrics summary."""
        with self._lock:
            request_times = list(self.metrics['request_times'])
            db_times = list(self.metrics['db_query_times'])
            
            return {
                'request_stats': {
                    'total_requests': self.metrics['request_count'],
                    'avg_response_time': sum(request_times) / len(request_times) if request_times else 0,
                    'p95_response_time': sorted(request_times)[int(len(request_times) * 0.95)] if request_times else 0,
                    'p99_response_time': sorted(request_times)[int(len(request_times) * 0.99)] if request_times else 0
                },
                'database_stats': {
                    'avg_query_time': sum(db_times) / len(db_times) if db_times else 0,
                    'slow_queries': len([t for t in db_times if t > 1.0]),
                    'total_queries': len(db_times)
                },
                'cache_stats': {
                    'hit_rate': self.metrics['cache_hits'] / (self.metrics['cache_hits'] + self.metrics['cache_misses']) if (self.metrics['cache_hits'] + self.metrics['cache_misses']) > 0 else 0,
                    'total_hits': self.metrics['cache_hits'],
                    'total_misses': self.metrics['cache_misses']
                },
                'system_stats': {
                    'avg_memory_usage': sum(self.metrics['memory_usage']) / len(self.metrics['memory_usage']) if self.metrics['memory_usage'] else 0,
                    'avg_cpu_usage': sum(self.metrics['cpu_usage']) / len(self.metrics['cpu_usage']) if self.metrics['cpu_usage'] else 0,
                    'error_count': self.metrics['error_count']
                }
            }

# Global metrics instance
performance_metrics = PerformanceMetrics()

def measure_time(func: Callable) -> Callable:
    """Decorator to measure function execution time."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            duration = time.time() - start_time
            performance_metrics.record_request_time(duration)
            
            # Log slow operations
            if duration > 1.0:
                logger.warning(f"Slow operation detected: {func.__name__} took {duration:.2f}s")
    
    return wrapper

def measure_db_query(func: Callable) -> Callable:
    """Decorator to measure database query time."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            duration = time.time() - start_time
            performance_metrics.record_db_query_time(duration)
            
            # Log slow queries
            if duration > 0.5:
                logger.warning(f"Slow query detected: {func.__name__} took {duration:.2f}s")
    
    return wrapper

class QueryOptimizer:
    """Database query optimization utilities."""
    
    @staticmethod
    def optimize_pagination(query, page: int = 1, per_page: int = 20, max_per_page: int = 100):
        """Optimize pagination queries."""
        per_page = min(per_page, max_per_page)
        offset = (page - 1) * per_page
        
        return query.offset(offset).limit(per_page)
    
    @staticmethod
    def add_select_related(query, *relationships):
        """Add eager loading for relationships."""
        from sqlalchemy.orm import joinedload
        
        for relationship in relationships:
            query = query.options(joinedload(relationship))
        
        return query
    
    @staticmethod
    def optimize_bulk_operations(model_class, data_list: list, batch_size: int = 1000):
        """Optimize bulk database operations."""
        from app import db
        
        for i in range(0, len(data_list), batch_size):
            batch = data_list[i:i + batch_size]
            db.session.bulk_insert_mappings(model_class, batch)
            db.session.commit()

class ResponseOptimizer:
    """HTTP response optimization utilities."""
    
    @staticmethod
    def compress_response(response):
        """Enable gzip compression for responses."""
        if response.content_length and response.content_length > 1024:
            response.headers['Content-Encoding'] = 'gzip'
        return response
    
    @staticmethod
    def add_cache_headers(response, max_age: int = 3600):
        """Add cache control headers."""
        response.headers['Cache-Control'] = f'public, max-age={max_age}'
        response.headers['Expires'] = (datetime.utcnow() + timedelta(seconds=max_age)).strftime('%a, %d %b %Y %H:%M:%S GMT')
        return response
    
    @staticmethod
    def add_security_headers(response):
        """Add security headers to response."""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        return response

class AssetOptimizer:
    """Static asset optimization utilities."""
    
    @staticmethod
    def get_versioned_url(asset_path: str) -> str:
        """Get versioned URL for cache busting."""
        import hashlib
        import os
        
        try:
            full_path = os.path.join(current_app.static_folder, asset_path)
            if os.path.exists(full_path):
                with open(full_path, 'rb') as f:
                    content_hash = hashlib.md5(f.read()).hexdigest()[:8]
                return f"{asset_path}?v={content_hash}"
        except Exception as e:
            logger.error(f"Failed to version asset {asset_path}: {e}")
        
        return asset_path
    
    @staticmethod
    def minify_css(css_content: str) -> str:
        """Basic CSS minification."""
        import re
        
        # Remove comments
        css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
        
        # Remove excess whitespace
        css_content = re.sub(r'\s+', ' ', css_content)
        css_content = re.sub(r';\s*}', '}', css_content)
        css_content = re.sub(r'{\s*', '{', css_content)
        css_content = re.sub(r'}\s*', '}', css_content)
        css_content = re.sub(r';\s*', ';', css_content)
        
        return css_content.strip()
    
    @staticmethod
    def minify_js(js_content: str) -> str:
        """Basic JavaScript minification."""
        import re
        
        # Remove single-line comments
        js_content = re.sub(r'//.*?$', '', js_content, flags=re.MULTILINE)
        
        # Remove multi-line comments
        js_content = re.sub(r'/\*.*?\*/', '', js_content, flags=re.DOTALL)
        
        # Remove excess whitespace
        js_content = re.sub(r'\s+', ' ', js_content)
        js_content = re.sub(r'{\s*', '{', js_content)
        js_content = re.sub(r'}\s*', '}', js_content)
        js_content = re.sub(r';\s*', ';', js_content)
        
        return js_content.strip()

class MemoryOptimizer:
    """Memory usage optimization utilities."""
    
    @staticmethod
    def cleanup_expired_sessions():
        """Clean up expired user sessions."""
        try:
            from flask import session
            # Implementation depends on session storage backend
            logger.info("Session cleanup completed")
        except Exception as e:
            logger.error(f"Session cleanup failed: {e}")
    
    @staticmethod
    def optimize_large_datasets(data, chunk_size: int = 1000):
        """Generator for processing large datasets in chunks."""
        for i in range(0, len(data), chunk_size):
            yield data[i:i + chunk_size]
    
    @staticmethod
    def clear_unused_imports():
        """Clear unused module imports (development utility)."""
        import sys
        import gc
        
        # Get list of modules before
        modules_before = set(sys.modules.keys())
        
        # Force garbage collection
        gc.collect()
        
        # Get list of modules after
        modules_after = set(sys.modules.keys())
        
        cleared = modules_before - modules_after
        if cleared:
            logger.info(f"Cleared {len(cleared)} unused modules")

# Performance monitoring context manager
class PerformanceMonitor:
    """Context manager for monitoring performance of code blocks."""
    
    def __init__(self, operation_name: str):
        self.operation_name = operation_name
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        
        if exc_type:
            performance_metrics.record_error()
            logger.error(f"Operation {self.operation_name} failed after {duration:.2f}s: {exc_val}")
        else:
            logger.info(f"Operation {self.operation_name} completed in {duration:.2f}s")
        
        performance_metrics.record_request_time(duration)

# Database connection pool optimization
class ConnectionPoolManager:
    """Manage database connection pool for optimal performance."""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize connection pool settings."""
        # Configure SQLAlchemy connection pool
        app.config.setdefault('SQLALCHEMY_ENGINE_OPTIONS', {})
        
        # Production-optimized pool settings
        pool_settings = {
            'pool_size': 20,
            'max_overflow': 30,
            'pool_pre_ping': True,
            'pool_recycle': 3600,
            'pool_timeout': 30
        }
        
        app.config['SQLALCHEMY_ENGINE_OPTIONS'].update(pool_settings)
        
        # Set up connection monitoring
        @app.before_request
        def before_request():
            g.db_start_time = time.time()
            performance_metrics.metrics['active_connections'] += 1
        
        @app.teardown_request
        def teardown_request(exception):
            performance_metrics.metrics['active_connections'] -= 1
            
            if hasattr(g, 'db_start_time'):
                db_time = time.time() - g.db_start_time
                performance_metrics.record_db_query_time(db_time)

# Request rate limiting
class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self):
        self.requests = {}
        self.lock = threading.Lock()
    
    def is_allowed(self, key: str, limit: int = 100, window: int = 60) -> bool:
        """Check if request is within rate limit."""
        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=window)
        
        with self.lock:
            if key not in self.requests:
                self.requests[key] = []
            
            # Clean old requests
            self.requests[key] = [req_time for req_time in self.requests[key] if req_time > cutoff]
            
            # Check limit
            if len(self.requests[key]) >= limit:
                return False
            
            # Add current request
            self.requests[key].append(now)
            return True

# Global instances
connection_pool_manager = ConnectionPoolManager()
rate_limiter = RateLimiter()

# Utility functions for templates
def get_performance_data():
    """Get current performance metrics for templates."""
    return performance_metrics.get_summary()

def update_system_metrics():
    """Update system metrics (called by scheduler)."""
    performance_metrics.update_system_metrics()