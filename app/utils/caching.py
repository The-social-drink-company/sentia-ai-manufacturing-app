"""
Advanced caching strategies for Sentia Manufacturing Dashboard
"""

import json
import pickle
import hashlib
import time
import functools
import logging
from typing import Any, Dict, Optional, Union, Callable
from datetime import datetime, timedelta
from flask import current_app, g
from werkzeug.contrib.cache import SimpleCache, MemcachedCache, RedisCache
import redis
from app.utils.performance import performance_metrics

logger = logging.getLogger(__name__)

class CacheManager:
    """Centralized cache management with multiple backends."""
    
    def __init__(self, app=None):
        self.app = app
        self.cache = None
        self.redis_client = None
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize cache based on configuration."""
        cache_type = app.config.get('CACHE_TYPE', 'simple')
        
        if cache_type == 'redis':
            redis_url = app.config.get('REDIS_URL', 'redis://localhost:6379/0')
            try:
                self.redis_client = redis.from_url(redis_url)
                self.cache = RedisCache(self.redis_client)
                logger.info("Initialized Redis cache")
            except Exception as e:
                logger.error(f"Failed to initialize Redis cache: {e}")
                self.cache = SimpleCache()
                logger.info("Fallback to SimpleCache")
        
        elif cache_type == 'memcached':
            memcached_servers = app.config.get('MEMCACHED_SERVERS', ['127.0.0.1:11211'])
            try:
                self.cache = MemcachedCache(memcached_servers)
                logger.info("Initialized Memcached cache")
            except Exception as e:
                logger.error(f"Failed to initialize Memcached cache: {e}")
                self.cache = SimpleCache()
                logger.info("Fallback to SimpleCache")
        
        else:
            self.cache = SimpleCache()
            logger.info("Initialized SimpleCache")
    
    def get(self, key: str, default=None):
        """Get value from cache."""
        try:
            value = self.cache.get(key)
            if value is not None:
                performance_metrics.record_cache_hit()
                return value
            else:
                performance_metrics.record_cache_miss()
                return default
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            performance_metrics.record_cache_miss()
            return default
    
    def set(self, key: str, value: Any, timeout: int = 300):
        """Set value in cache."""
        try:
            return self.cache.set(key, value, timeout=timeout)
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str):
        """Delete value from cache."""
        try:
            return self.cache.delete(key)
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def clear(self):
        """Clear all cache."""
        try:
            return self.cache.clear()
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False
    
    def get_many(self, keys: list):
        """Get multiple values from cache."""
        try:
            return self.cache.get_many(*keys)
        except Exception as e:
            logger.error(f"Cache get_many error: {e}")
            return {}
    
    def set_many(self, mapping: dict, timeout: int = 300):
        """Set multiple values in cache."""
        try:
            return self.cache.set_many(mapping, timeout=timeout)
        except Exception as e:
            logger.error(f"Cache set_many error: {e}")
            return []

# Global cache manager instance
cache = CacheManager()

def cache_key(*args, **kwargs) -> str:
    """Generate cache key from arguments."""
    key_data = {
        'args': args,
        'kwargs': sorted(kwargs.items())
    }
    key_str = json.dumps(key_data, sort_keys=True, default=str)
    return hashlib.md5(key_str.encode()).hexdigest()

def cached(timeout: int = 300, key_prefix: str = '', vary_on_user: bool = False):
    """Decorator for caching function results."""
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            base_key = f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            if vary_on_user and hasattr(g, 'current_user') and g.current_user:
                base_key = f"user:{g.current_user.id}:{base_key}"
            
            # Try to get from cache
            cached_result = cache.get(base_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(base_key, result, timeout=timeout)
            
            return result
        
        return wrapper
    return decorator

class QueryCache:
    """Database query result caching."""
    
    @staticmethod
    def cache_query(query, timeout: int = 300):
        """Cache database query results."""
        query_str = str(query.statement.compile(compile_kwargs={"literal_binds": True}))
        query_hash = hashlib.md5(query_str.encode()).hexdigest()
        cache_key_name = f"query:{query_hash}"
        
        # Try cache first
        cached_result = cache.get(cache_key_name)
        if cached_result is not None:
            return cached_result
        
        # Execute query and cache
        result = query.all()
        
        # Convert to serializable format
        serializable_result = []
        for item in result:
            if hasattr(item, 'to_dict'):
                serializable_result.append(item.to_dict())
            else:
                serializable_result.append(str(item))
        
        cache.set(cache_key_name, serializable_result, timeout=timeout)
        
        return result
    
    @staticmethod
    def invalidate_model_cache(model_name: str):
        """Invalidate all cache entries for a model."""
        # This would require a more sophisticated cache backend
        # For now, we'll use a simple pattern-based approach
        pass

class ForecastCache:
    """Specialized caching for forecast data."""
    
    CACHE_TIMEOUT = 3600  # 1 hour
    
    @classmethod
    def get_forecast_key(cls, product_id: int, method: str, horizon: int) -> str:
        """Generate cache key for forecast."""
        return f"forecast:p{product_id}:m{method}:h{horizon}"
    
    @classmethod
    def cache_forecast(cls, product_id: int, method: str, horizon: int, 
                      forecast_data: Dict, timeout: Optional[int] = None):
        """Cache forecast results."""
        key = cls.get_forecast_key(product_id, method, horizon)
        cache_timeout = timeout or cls.CACHE_TIMEOUT
        
        cache_data = {
            'forecast_data': forecast_data,
            'cached_at': datetime.utcnow().isoformat(),
            'expires_at': (datetime.utcnow() + timedelta(seconds=cache_timeout)).isoformat()
        }
        
        cache.set(key, cache_data, timeout=cache_timeout)
    
    @classmethod
    def get_cached_forecast(cls, product_id: int, method: str, horizon: int) -> Optional[Dict]:
        """Get cached forecast if available."""
        key = cls.get_forecast_key(product_id, method, horizon)
        cached_data = cache.get(key)
        
        if cached_data:
            # Check if still valid
            expires_at = datetime.fromisoformat(cached_data['expires_at'])
            if datetime.utcnow() < expires_at:
                return cached_data['forecast_data']
        
        return None
    
    @classmethod
    def invalidate_product_forecasts(cls, product_id: int):
        """Invalidate all cached forecasts for a product."""
        # This would require a more sophisticated implementation
        # For now, we'll mark it as a TODO
        pass

class ProductCache:
    """Product-specific caching strategies."""
    
    CACHE_TIMEOUT = 1800  # 30 minutes
    
    @classmethod
    @cached(timeout=CACHE_TIMEOUT, key_prefix='products')
    def get_product_catalog(cls):
        """Get cached product catalog."""
        from app.models.product import Product
        products = Product.query.filter_by(is_active=True).all()
        return [product.to_dict() for product in products]
    
    @classmethod
    @cached(timeout=CACHE_TIMEOUT, key_prefix='product_stats')
    def get_product_statistics(cls, product_id: int):
        """Get cached product statistics."""
        from app.models.product import Product
        from app.models.historical_sales import HistoricalSales
        from sqlalchemy import func
        
        # This would contain complex statistics calculation
        # For now, return placeholder
        return {
            'sales_30d': 0,
            'revenue_30d': 0,
            'avg_daily_sales': 0
        }

class UserSessionCache:
    """User session and preference caching."""
    
    @staticmethod
    def cache_user_preferences(user_id: int, preferences: Dict, timeout: int = 86400):
        """Cache user preferences for 24 hours."""
        key = f"user_prefs:{user_id}"
        cache.set(key, preferences, timeout=timeout)
    
    @staticmethod
    def get_user_preferences(user_id: int) -> Optional[Dict]:
        """Get cached user preferences."""
        key = f"user_prefs:{user_id}"
        return cache.get(key)
    
    @staticmethod
    def cache_user_dashboard_data(user_id: int, dashboard_data: Dict, timeout: int = 600):
        """Cache user dashboard data for 10 minutes."""
        key = f"dashboard:{user_id}"
        cache.set(key, dashboard_data, timeout=timeout)
    
    @staticmethod
    def get_user_dashboard_data(user_id: int) -> Optional[Dict]:
        """Get cached dashboard data."""
        key = f"dashboard:{user_id}"
        return cache.get(key)

class APIResponseCache:
    """Cache for external API responses."""
    
    @staticmethod
    def cache_api_response(api_name: str, endpoint: str, params: Dict, 
                          response_data: Any, timeout: int = 3600):
        """Cache external API response."""
        key = f"api:{api_name}:{endpoint}:{cache_key(params)}"
        
        cache_data = {
            'data': response_data,
            'cached_at': datetime.utcnow().isoformat(),
            'params': params
        }
        
        cache.set(key, cache_data, timeout=timeout)
    
    @staticmethod
    def get_cached_api_response(api_name: str, endpoint: str, params: Dict) -> Optional[Any]:
        """Get cached API response."""
        key = f"api:{api_name}:{endpoint}:{cache_key(params)}"
        cached_data = cache.get(key)
        
        if cached_data and cached_data.get('params') == params:
            return cached_data['data']
        
        return None

class CacheWarmer:
    """Warm up frequently accessed cache entries."""
    
    def __init__(self):
        self.warming_tasks = []
    
    def register_warming_task(self, task_func: Callable, interval: int = 3600):
        """Register a cache warming task."""
        self.warming_tasks.append({
            'function': task_func,
            'interval': interval,
            'last_run': 0
        })
    
    def warm_caches(self):
        """Execute cache warming tasks."""
        current_time = time.time()
        
        for task in self.warming_tasks:
            if current_time - task['last_run'] >= task['interval']:
                try:
                    task['function']()
                    task['last_run'] = current_time
                    logger.info(f"Cache warming completed: {task['function'].__name__}")
                except Exception as e:
                    logger.error(f"Cache warming failed: {task['function'].__name__}: {e}")
    
    def warm_product_cache(self):
        """Warm product-related caches."""
        ProductCache.get_product_catalog()
        logger.info("Product cache warmed")
    
    def warm_user_caches(self):
        """Warm frequently accessed user data."""
        from app.models.user import User
        
        # Warm cache for active users
        active_users = User.query.filter_by(is_active=True).limit(100).all()
        for user in active_users:
            try:
                # This would warm user-specific caches
                pass
            except Exception as e:
                logger.error(f"Failed to warm cache for user {user.id}: {e}")

# Global cache warmer instance
cache_warmer = CacheWarmer()

# Register default warming tasks
cache_warmer.register_warming_task(cache_warmer.warm_product_cache, interval=1800)
cache_warmer.register_warming_task(cache_warmer.warm_user_caches, interval=3600)

class CacheStats:
    """Cache performance statistics."""
    
    @staticmethod
    def get_cache_stats() -> Dict[str, Any]:
        """Get comprehensive cache statistics."""
        stats = {
            'hit_rate': 0,
            'total_hits': performance_metrics.metrics['cache_hits'],
            'total_misses': performance_metrics.metrics['cache_misses'],
            'total_requests': performance_metrics.metrics['cache_hits'] + performance_metrics.metrics['cache_misses']
        }
        
        if stats['total_requests'] > 0:
            stats['hit_rate'] = (stats['total_hits'] / stats['total_requests']) * 100
        
        # Add backend-specific stats if available
        if hasattr(cache, 'redis_client') and cache.redis_client:
            try:
                redis_info = cache.redis_client.info()
                stats['backend'] = 'redis'
                stats['backend_stats'] = {
                    'connected_clients': redis_info.get('connected_clients', 0),
                    'used_memory': redis_info.get('used_memory_human', 'Unknown'),
                    'keyspace_hits': redis_info.get('keyspace_hits', 0),
                    'keyspace_misses': redis_info.get('keyspace_misses', 0)
                }
            except Exception as e:
                logger.error(f"Failed to get Redis stats: {e}")
        
        return stats

# Utility functions
def invalidate_user_cache(user_id: int):
    """Invalidate all cache entries for a user."""
    patterns = [
        f"user:{user_id}:*",
        f"user_prefs:{user_id}",
        f"dashboard:{user_id}"
    ]
    
    for pattern in patterns:
        try:
            cache.delete(pattern)
        except Exception as e:
            logger.error(f"Failed to invalidate cache pattern {pattern}: {e}")

def invalidate_model_cache(model_name: str):
    """Invalidate cache entries related to a model."""
    # This would be more sophisticated in a real implementation
    if model_name.lower() == 'product':
        cache.delete('products:get_product_catalog')
    elif model_name.lower() == 'forecast':
        # Would invalidate forecast-related caches
        pass

def get_cache_status() -> Dict[str, Any]:
    """Get current cache system status."""
    return {
        'cache_type': type(cache.cache).__name__,
        'is_connected': True,  # Would check actual connection
        'stats': CacheStats.get_cache_stats(),
        'warming_tasks': len(cache_warmer.warming_tasks)
    }