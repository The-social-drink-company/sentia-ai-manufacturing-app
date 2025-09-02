"""
Scalability features for horizontal scaling and load distribution
"""

import asyncio
import threading
import queue
import time
import logging
from typing import Dict, List, Any, Optional, Callable
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask import current_app, request, g
import redis
import json
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)

class TaskQueue:
    """Distributed task queue for background processing."""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client or redis.Redis(decode_responses=True)
        self.workers = {}
        self.is_processing = False
        
    def enqueue(self, task_name: str, *args, **kwargs) -> str:
        """Add task to queue."""
        task_id = str(uuid.uuid4())
        task_data = {
            'id': task_id,
            'name': task_name,
            'args': args,
            'kwargs': kwargs,
            'created_at': datetime.utcnow().isoformat(),
            'status': 'pending'
        }
        
        try:
            # Add to task queue
            self.redis_client.lpush('task_queue', json.dumps(task_data))
            
            # Store task metadata
            self.redis_client.hset(f'task:{task_id}', mapping={
                'status': 'pending',
                'created_at': task_data['created_at'],
                'name': task_name
            })
            
            # Set task expiration (24 hours)
            self.redis_client.expire(f'task:{task_id}', 86400)
            
            logger.info(f"Enqueued task {task_name} with ID {task_id}")
            return task_id
            
        except Exception as e:
            logger.error(f"Failed to enqueue task {task_name}: {e}")
            raise
    
    def dequeue(self, timeout: int = 10) -> Optional[Dict]:
        """Get next task from queue."""
        try:
            result = self.redis_client.brpop('task_queue', timeout=timeout)
            if result:
                queue_name, task_json = result
                return json.loads(task_json)
            return None
        except Exception as e:
            logger.error(f"Failed to dequeue task: {e}")
            return None
    
    def update_task_status(self, task_id: str, status: str, result: Any = None, error: str = None):
        """Update task status."""
        try:
            update_data = {
                'status': status,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            if result is not None:
                update_data['result'] = json.dumps(result) if not isinstance(result, str) else result
            
            if error:
                update_data['error'] = error
            
            self.redis_client.hset(f'task:{task_id}', mapping=update_data)
            logger.info(f"Updated task {task_id} status to {status}")
            
        except Exception as e:
            logger.error(f"Failed to update task {task_id} status: {e}")
    
    def get_task_status(self, task_id: str) -> Dict:
        """Get task status and result."""
        try:
            task_data = self.redis_client.hgetall(f'task:{task_id}')
            if task_data:
                return dict(task_data)
            return {'status': 'not_found'}
        except Exception as e:
            logger.error(f"Failed to get task {task_id} status: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def register_worker(self, task_name: str, worker_func: Callable):
        """Register worker function for a task type."""
        self.workers[task_name] = worker_func
        logger.info(f"Registered worker for task type: {task_name}")
    
    def start_worker_thread(self, worker_id: str = None):
        """Start background worker thread."""
        worker_id = worker_id or f"worker_{uuid.uuid4().hex[:8]}"
        
        def worker_loop():
            logger.info(f"Started worker thread: {worker_id}")
            
            while self.is_processing:
                try:
                    task = self.dequeue(timeout=5)
                    if task:
                        self._process_task(task, worker_id)
                except Exception as e:
                    logger.error(f"Worker {worker_id} error: {e}")
                    time.sleep(1)
            
            logger.info(f"Stopped worker thread: {worker_id}")
        
        thread = threading.Thread(target=worker_loop, daemon=True)
        thread.start()
        return thread
    
    def _process_task(self, task: Dict, worker_id: str):
        """Process a single task."""
        task_id = task['id']
        task_name = task['name']
        
        logger.info(f"Worker {worker_id} processing task {task_id} ({task_name})")
        
        try:
            self.update_task_status(task_id, 'processing')
            
            if task_name not in self.workers:
                raise ValueError(f"No worker registered for task type: {task_name}")
            
            worker_func = self.workers[task_name]
            result = worker_func(*task['args'], **task['kwargs'])
            
            self.update_task_status(task_id, 'completed', result=result)
            logger.info(f"Task {task_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Task {task_id} failed: {e}")
            self.update_task_status(task_id, 'failed', error=str(e))
    
    def start_processing(self, num_workers: int = 4):
        """Start task processing with multiple workers."""
        if self.is_processing:
            return
        
        self.is_processing = True
        
        for i in range(num_workers):
            self.start_worker_thread(f"worker_{i}")
        
        logger.info(f"Started task queue processing with {num_workers} workers")
    
    def stop_processing(self):
        """Stop task processing."""
        self.is_processing = False
        logger.info("Stopped task queue processing")

class LoadBalancer:
    """Simple load balancing for distributing requests."""
    
    def __init__(self):
        self.servers = []
        self.current_index = 0
        self.lock = threading.Lock()
    
    def add_server(self, server_id: str, weight: int = 1):
        """Add server to load balancer."""
        with self.lock:
            self.servers.append({
                'id': server_id,
                'weight': weight,
                'requests': 0,
                'errors': 0,
                'last_check': datetime.utcnow(),
                'healthy': True
            })
        logger.info(f"Added server {server_id} to load balancer")
    
    def get_server(self, strategy: str = 'round_robin') -> Optional[str]:
        """Get next server based on strategy."""
        if not self.servers:
            return None
        
        healthy_servers = [s for s in self.servers if s['healthy']]
        if not healthy_servers:
            return None
        
        if strategy == 'round_robin':
            return self._round_robin_selection(healthy_servers)
        elif strategy == 'least_connections':
            return self._least_connections_selection(healthy_servers)
        elif strategy == 'weighted':
            return self._weighted_selection(healthy_servers)
        else:
            return healthy_servers[0]['id']
    
    def _round_robin_selection(self, servers: List[Dict]) -> str:
        """Round robin server selection."""
        with self.lock:
            server = servers[self.current_index % len(servers)]
            self.current_index += 1
            return server['id']
    
    def _least_connections_selection(self, servers: List[Dict]) -> str:
        """Select server with least connections."""
        return min(servers, key=lambda s: s['requests'])['id']
    
    def _weighted_selection(self, servers: List[Dict]) -> str:
        """Weighted server selection."""
        import random
        
        total_weight = sum(s['weight'] for s in servers)
        random_weight = random.randint(1, total_weight)
        
        current_weight = 0
        for server in servers:
            current_weight += server['weight']
            if random_weight <= current_weight:
                return server['id']
        
        return servers[0]['id']
    
    def record_request(self, server_id: str, success: bool = True):
        """Record request for server."""
        with self.lock:
            for server in self.servers:
                if server['id'] == server_id:
                    server['requests'] += 1
                    if not success:
                        server['errors'] += 1
                    break
    
    def mark_unhealthy(self, server_id: str):
        """Mark server as unhealthy."""
        with self.lock:
            for server in self.servers:
                if server['id'] == server_id:
                    server['healthy'] = False
                    logger.warning(f"Marked server {server_id} as unhealthy")
                    break
    
    def mark_healthy(self, server_id: str):
        """Mark server as healthy."""
        with self.lock:
            for server in self.servers:
                if server['id'] == server_id:
                    server['healthy'] = True
                    logger.info(f"Marked server {server_id} as healthy")
                    break
    
    def get_stats(self) -> Dict[str, Any]:
        """Get load balancer statistics."""
        with self.lock:
            return {
                'total_servers': len(self.servers),
                'healthy_servers': len([s for s in self.servers if s['healthy']]),
                'servers': list(self.servers)
            }

class ConnectionPool:
    """Connection pool for database and external services."""
    
    def __init__(self, create_connection_func: Callable, max_connections: int = 10):
        self.create_connection = create_connection_func
        self.max_connections = max_connections
        self.pool = queue.Queue(maxsize=max_connections)
        self.active_connections = 0
        self.lock = threading.Lock()
        
        # Pre-populate pool
        for _ in range(max_connections):
            try:
                conn = self.create_connection()
                self.pool.put(conn)
            except Exception as e:
                logger.error(f"Failed to create initial connection: {e}")
    
    def get_connection(self, timeout: float = 5.0):
        """Get connection from pool."""
        try:
            conn = self.pool.get(timeout=timeout)
            with self.lock:
                self.active_connections += 1
            return conn
        except queue.Empty:
            raise Exception("Connection pool exhausted")
    
    def return_connection(self, connection):
        """Return connection to pool."""
        try:
            self.pool.put(connection, block=False)
            with self.lock:
                self.active_connections -= 1
        except queue.Full:
            # Pool is full, close connection
            try:
                connection.close()
            except:
                pass
    
    def get_stats(self) -> Dict[str, int]:
        """Get pool statistics."""
        with self.lock:
            return {
                'pool_size': self.pool.qsize(),
                'active_connections': self.active_connections,
                'max_connections': self.max_connections
            }

class DistributedLock:
    """Distributed locking using Redis."""
    
    def __init__(self, redis_client, key: str, timeout: int = 30):
        self.redis_client = redis_client
        self.key = f"lock:{key}"
        self.timeout = timeout
        self.identifier = str(uuid.uuid4())
    
    def __enter__(self):
        return self.acquire()
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()
    
    def acquire(self) -> bool:
        """Acquire distributed lock."""
        try:
            result = self.redis_client.set(
                self.key, 
                self.identifier, 
                ex=self.timeout, 
                nx=True
            )
            if result:
                logger.debug(f"Acquired lock: {self.key}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to acquire lock {self.key}: {e}")
            return False
    
    def release(self) -> bool:
        """Release distributed lock."""
        try:
            # Only release if we own the lock
            lua_script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
            """
            result = self.redis_client.eval(lua_script, 1, self.key, self.identifier)
            if result:
                logger.debug(f"Released lock: {self.key}")
            return bool(result)
        except Exception as e:
            logger.error(f"Failed to release lock {self.key}: {e}")
            return False

class AsyncProcessor:
    """Asynchronous processing for I/O-bound tasks."""
    
    def __init__(self, max_workers: int = 10):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.futures = {}
        
    def submit(self, task_id: str, func: Callable, *args, **kwargs):
        """Submit async task."""
        future = self.executor.submit(func, *args, **kwargs)
        self.futures[task_id] = {
            'future': future,
            'submitted_at': datetime.utcnow()
        }
        return task_id
    
    def get_result(self, task_id: str, timeout: Optional[float] = None):
        """Get task result."""
        if task_id not in self.futures:
            raise ValueError(f"Task {task_id} not found")
        
        future_info = self.futures[task_id]
        future = future_info['future']
        
        try:
            result = future.result(timeout=timeout)
            # Clean up completed future
            del self.futures[task_id]
            return result
        except Exception as e:
            # Clean up failed future
            del self.futures[task_id]
            raise e
    
    def is_done(self, task_id: str) -> bool:
        """Check if task is done."""
        if task_id not in self.futures:
            return False
        return self.futures[task_id]['future'].done()
    
    def cancel(self, task_id: str) -> bool:
        """Cancel task."""
        if task_id not in self.futures:
            return False
        
        future = self.futures[task_id]['future']
        result = future.cancel()
        
        if result:
            del self.futures[task_id]
        
        return result
    
    def cleanup_completed(self):
        """Clean up completed futures."""
        completed_tasks = []
        
        for task_id, future_info in self.futures.items():
            if future_info['future'].done():
                completed_tasks.append(task_id)
        
        for task_id in completed_tasks:
            del self.futures[task_id]
        
        logger.info(f"Cleaned up {len(completed_tasks)} completed tasks")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get processor statistics."""
        active_tasks = len(self.futures)
        completed_tasks = sum(1 for f in self.futures.values() if f['future'].done())
        
        return {
            'active_tasks': active_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': active_tasks - completed_tasks,
            'thread_pool_size': self.executor._max_workers
        }
    
    def shutdown(self, wait: bool = True):
        """Shutdown processor."""
        self.executor.shutdown(wait=wait)

class RateLimiter:
    """Distributed rate limiting."""
    
    def __init__(self, redis_client):
        self.redis_client = redis_client
    
    def is_allowed(self, key: str, limit: int, window: int) -> Dict[str, Any]:
        """Check if request is within rate limit."""
        lua_script = """
        local key = KEYS[1]
        local window = tonumber(ARGV[1])
        local limit = tonumber(ARGV[2])
        local current_time = tonumber(ARGV[3])
        
        -- Remove expired entries
        redis.call('ZREMRANGEBYSCORE', key, 0, current_time - window)
        
        -- Count current requests
        local current_requests = redis.call('ZCARD', key)
        
        if current_requests < limit then
            -- Add current request
            redis.call('ZADD', key, current_time, current_time)
            redis.call('EXPIRE', key, window)
            return {1, limit - current_requests - 1, current_time + window}
        else
            -- Rate limit exceeded
            local oldest_request = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
            local reset_time = oldest_request[2] and (oldest_request[2] + window) or (current_time + window)
            return {0, 0, reset_time}
        end
        """
        
        try:
            current_time = time.time()
            result = self.redis_client.eval(
                lua_script, 1, key, window, limit, current_time
            )
            
            allowed, remaining, reset_time = result
            
            return {
                'allowed': bool(allowed),
                'remaining': int(remaining),
                'reset_time': float(reset_time),
                'limit': limit,
                'window': window
            }
            
        except Exception as e:
            logger.error(f"Rate limiting error for key {key}: {e}")
            # Fail open - allow request if rate limiter fails
            return {
                'allowed': True,
                'remaining': limit,
                'reset_time': time.time() + window,
                'limit': limit,
                'window': window,
                'error': str(e)
            }

class CircuitBreaker:
    """Circuit breaker for external service calls."""
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
        self.lock = threading.Lock()
    
    def call(self, func: Callable, *args, **kwargs):
        """Call function with circuit breaker protection."""
        with self.lock:
            if self.state == 'OPEN':
                if self._should_attempt_reset():
                    self.state = 'HALF_OPEN'
                else:
                    raise Exception("Circuit breaker is OPEN")
            
            try:
                result = func(*args, **kwargs)
                self._on_success()
                return result
            except Exception as e:
                self._on_failure()
                raise e
    
    def _should_attempt_reset(self) -> bool:
        """Check if we should attempt to reset the circuit breaker."""
        if self.last_failure_time is None:
            return False
        
        return (time.time() - self.last_failure_time) >= self.recovery_timeout
    
    def _on_success(self):
        """Handle successful call."""
        self.failure_count = 0
        self.state = 'CLOSED'
    
    def _on_failure(self):
        """Handle failed call."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = 'OPEN'
    
    def get_state(self) -> Dict[str, Any]:
        """Get circuit breaker state."""
        return {
            'state': self.state,
            'failure_count': self.failure_count,
            'failure_threshold': self.failure_threshold,
            'last_failure_time': self.last_failure_time
        }

# Global instances
task_queue = TaskQueue()
load_balancer = LoadBalancer()
async_processor = AsyncProcessor()

def init_scalability(app, redis_client=None):
    """Initialize scalability features."""
    global task_queue
    
    if redis_client:
        task_queue = TaskQueue(redis_client)
    
    # Register common task workers
    task_queue.register_worker('forecast_generation', forecast_worker)
    task_queue.register_worker('data_import', data_import_worker)
    task_queue.register_worker('optimization', optimization_worker)
    
    # Start task processing
    task_queue.start_processing(num_workers=4)
    
    logger.info("Scalability features initialized")

# Example worker functions
def forecast_worker(product_id: int, method: str, horizon: int):
    """Worker function for forecast generation."""
    from app.services.enhanced_forecasting_service import EnhancedForecastingService
    
    service = EnhancedForecastingService()
    return service.generate_forecast(product_id, method, horizon)

def data_import_worker(file_path: str, data_type: str):
    """Worker function for data import."""
    from app.utils.import_processor import ImportProcessor
    
    processor = ImportProcessor()
    return processor.process_file(file_path, data_type)

def optimization_worker(optimization_type: str, parameters: Dict):
    """Worker function for optimization tasks."""
    from app.services.stock_optimization_service import StockOptimizationService
    
    service = StockOptimizationService()
    return service.optimize(parameters)

def get_scalability_stats() -> Dict[str, Any]:
    """Get comprehensive scalability statistics."""
    return {
        'task_queue': {
            'workers': len(task_queue.workers),
            'processing': task_queue.is_processing
        },
        'load_balancer': load_balancer.get_stats(),
        'async_processor': async_processor.get_stats()
    }