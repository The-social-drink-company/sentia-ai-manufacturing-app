# Background Jobs System Documentation

## Overview

The CapLiquify Manufacturing Platform uses BullMQ with Redis for processing background jobs asynchronously. This system handles compute-intensive operations like AI forecasting, inventory optimization, data imports/exports, and API syncing.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Client    │─────▶│    API      │─────▶│    Queue    │
│  (Browser)  │      │   Server    │      │   Manager   │
└─────────────┘      └─────────────┘      └─────────────┘
                            │                      │
                            │                      ▼
                     ┌──────┴──────┐      ┌─────────────┐
                     │     SSE     │◀─────│   Workers   │
                     │   Updates   │      │  (BullMQ)   │
                     └─────────────┘      └─────────────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │   Redis     │
                                          │   Queue     │
                                          └─────────────┘
```

## Components

### 1. Redis Connection ([server/lib/redis.js](../server/lib/redis.js))

Manages Redis connections for BullMQ queues and general caching.

**Features**:
- Connection pooling
- Automatic reconnection
- Health monitoring
- Error handling

**Usage**:
```javascript
const { getRedisClient, createBullMQConnection } = require('./lib/redis');

// Get general Redis client
const client = getRedisClient();
await client.set('key', 'value');

// Create BullMQ connection
const connection = createBullMQConnection();
```

### 2. QueueManager ([server/queues/QueueManager.js](../server/queues/QueueManager.js))

Central management for all BullMQ queues.

**Queues**:
| Queue | Purpose | Concurrency | Timeout |
|-------|---------|-------------|---------|
| forecast-queue | AI forecast computations | 3 | 5 min |
| optimization-queue | Inventory optimization | 2 | 5 min |
| sync-queue | API integration syncs | 2 | 10 min |
| import-queue | CSV/Excel imports | 1 | 15 min |
| export-queue | Report generation | 2 | 10 min |
| notification-queue | Email/SMS/push | 5 | 30 sec |
| analytics-queue | Analytics calculations | 2 | 10 min |

**Usage**:
```javascript
const { getInstance } = require('./queues/QueueManager');

const queueManager = getInstance();
await queueManager.initialize();

// Add job to queue
await queueManager.addJob('forecast', 'run-forecast', {
  productId: 'product-123',
  horizon: 30,
  userId: 'user-456',
}, {
  priority: 1, // Higher priority
});

// Get job status
const status = await queueManager.getJobStatus('forecast', 'job-id');

// Get queue statistics
const stats = await queueManager.getQueueStats('forecast');
```

### 3. Workers

#### ForecastWorker ([server/workers/ForecastWorker.js](../server/workers/ForecastWorker.js))

Processes demand forecasting using ensemble models.

**Models**:
- Moving Average (baseline)
- Linear Regression
- Exponential Smoothing
- Seasonal (if patterns detected)

**Job Data**:
```javascript
{
  productId: 'uuid',
  horizon: 30,        // Days to forecast
  models: ['all'],    // or ['ma', 'linear', 'exp']
  userId: 'uuid'      // For SSE updates
}
```

**Progress Updates**:
- 10%: Loading historical data
- 20%: Preprocessing data
- 30%: Running forecast models
- 60%: Calculating ensemble
- 80%: Calculating accuracy
- 90%: Saving results
- 100%: Complete

**Returns**:
```javascript
{
  success: true,
  forecastId: 'uuid',
  productId: 'uuid',
  horizon: 30,
  accuracy: 12.5,  // MAPE percentage
  predictions: 30
}
```

#### OptimizationWorker ([server/workers/OptimizationWorker.js](../server/workers/OptimizationWorker.js))

Processes inventory optimization calculations.

**Calculations**:
- EOQ (Economic Order Quantity)
- Safety Stock
- Reorder Points
- Multi-warehouse allocation

**Job Data**:
```javascript
{
  productId: 'uuid',
  constraints: {
    orderingCost: 50,
    holdingCostRate: 0.25,
    serviceLevelZ: 1.65  // 95% service level
  },
  userId: 'uuid'
}
```

**Returns**:
```javascript
{
  success: true,
  resultId: 'uuid',
  eoq: 500,
  safetyStock: 100,
  reorderPoint: 350
}
```

#### SyncWorker ([server/workers/SyncWorker.js](../server/workers/SyncWorker.js))

Processes API integration synchronization jobs.

**Job Data**:
```javascript
{
  integrationId: 'uuid',
  dataTypes: ['orders', 'inventory'],
  force: false
}
```

#### ImportWorker ([server/workers/ImportWorker.js](../server/workers/ImportWorker.js))

Processes CSV/Excel data imports.

**Job Data**:
```javascript
{
  filePath: '/path/to/file.csv',
  entityType: 'products',
  userId: 'uuid'
}
```

**Returns**:
```javascript
{
  success: true,
  report: {
    total: 1000,
    valid: 950,
    invalid: 50,
    imported: 950,
    errors: [
      { row: 10, data: {...}, errors: ['SKU required'] }
    ]
  }
}
```

#### ExportWorker ([server/workers/ExportWorker.js](../server/workers/ExportWorker.js))

Processes report generation (CSV, JSON, PDF).

**Job Data**:
```javascript
{
  entity: 'products',
  format: 'csv',
  filters: { category: 'beverages' },
  userId: 'uuid'
}
```

**Returns**:
```javascript
{
  success: true,
  exportId: 'uuid',
  filePath: '/exports/products-export-2025-10-17.csv'
}
```

#### NotificationWorker ([server/workers/NotificationWorker.js](../server/workers/NotificationWorker.js))

Processes email/SMS/push notifications.

**Job Data**:
```javascript
{
  userId: 'uuid',
  type: 'EMAIL',
  title: 'Forecast Complete',
  message: 'Your forecast for Product X is ready',
  data: { forecastId: 'uuid' }
}
```

#### AnalyticsWorker ([server/workers/AnalyticsWorker.js](../server/workers/AnalyticsWorker.js))

Processes background analytics calculations.

**Job Data**:
```javascript
{
  type: 'inventory-turnover',
  params: {
    organizationId: 'uuid',
    startDate: '2025-01-01',
    endDate: '2025-10-17'
  }
}
```

### 4. WorkerManager ([server/workers/WorkerManager.js](../server/workers/WorkerManager.js))

Manages all worker lifecycles.

**Usage**:
```javascript
const { getInstance } = require('./workers/WorkerManager');

const workerManager = getInstance();

// Start all workers
await workerManager.startAll();

// Stop all workers
await workerManager.stopAll();

// Get specific worker
const forecastWorker = workerManager.getWorker('forecast');
```

## Job Configuration

### Priority Levels

```javascript
// High priority (processed first)
{ priority: 1 }

// Medium priority
{ priority: 5 }

// Low priority
{ priority: 10 }
```

### Retry Strategy

All queues use exponential backoff:
```javascript
{
  attempts: 3,  // Max 3 retries
  backoff: {
    type: 'exponential',
    delay: 2000  // Start with 2 seconds
  }
}
```

Retry delays: 2s → 4s → 8s

### Timeouts

| Queue | Timeout | Purpose |
|-------|---------|---------|
| forecast | 5 min | Allow complex AI calculations |
| optimization | 5 min | Multiple constraint evaluations |
| sync | 10 min | Large API data transfers |
| import | 15 min | Large file processing |
| export | 10 min | Report generation |
| notification | 30 sec | Quick delivery |
| analytics | 10 min | Complex calculations |

### Job Retention

**Completed Jobs**:
- Kept for 24 hours (forecast, optimization, sync, analytics)
- Kept for 3 days (exports)
- Kept for 7 days (imports)

**Failed Jobs**:
- Kept for 7 days (most queues)
- Kept for 30 days (imports - for debugging)

## SSE Integration

Jobs emit real-time updates via Server-Sent Events.

**Event Types**:
- `job:progress` - Progress updates
- `job:complete` - Job completion
- `job:failed` - Job failure

**Example**:
```javascript
// Server side (in worker)
const { emitSSEEvent } = require('../services/sse');

emitSSEEvent(userId, 'job:progress', {
  jobId: job.id,
  type: 'forecast',
  progress: 50,
  message: 'Running models...'
});

// Client side
const eventSource = new EventSource('/api/v1/sse');

eventSource.addEventListener('job:progress', (event) => {
  const data = JSON.parse(event.data);
  console.log(`Job ${data.jobId}: ${data.progress}%`);
});
```

## API Endpoints

### Queue Management

**Add Job**:
```http
POST /api/v1/queues/:queueKey/jobs
Content-Type: application/json

{
  "name": "run-forecast",
  "data": {
    "productId": "uuid",
    "horizon": 30
  },
  "options": {
    "priority": 1
  }
}
```

**Get Job Status**:
```http
GET /api/v1/queues/:queueKey/jobs/:jobId
```

**Retry Failed Job**:
```http
POST /api/v1/queues/:queueKey/jobs/:jobId/retry
```

**Get Queue Stats**:
```http
GET /api/v1/queues/:queueKey/stats
```

**Get Failed Jobs**:
```http
GET /api/v1/queues/:queueKey/failed?start=0&end=10
```

**Pause Queue**:
```http
POST /api/v1/queues/:queueKey/pause
```

**Resume Queue**:
```http
POST /api/v1/queues/:queueKey/resume
```

**Clean Queue**:
```http
POST /api/v1/queues/:queueKey/clean
Content-Type: application/json

{
  "grace": 3600000,  // 1 hour
  "limit": 1000,
  "type": "completed"
}
```

## Monitoring

### Queue Statistics

```javascript
const stats = await queueManager.getQueueStats('forecast');
/*
{
  queueName: 'forecast-queue',
  waiting: 5,      // Jobs waiting
  active: 2,       // Jobs processing
  completed: 1000, // Jobs completed
  failed: 10,      // Jobs failed
  delayed: 0,      // Jobs delayed
  isPaused: false,
  total: 1017
}
*/
```

### Redis Health

```javascript
const { healthCheck, getRedisStats } = require('./lib/redis');

const health = await healthCheck();
/*
{
  healthy: true,
  latency: 5,
  status: 'excellent'
}
*/

const stats = await getRedisStats();
/*
{
  dbSize: 1250,
  totalConnectionsReceived: 5000,
  totalCommandsProcessed: 50000,
  instantaneousOpsPerSec: 100,
  hitRate: '95.5%'
}
*/
```

## Error Handling

### Job Failures

Jobs automatically retry with exponential backoff. After max retries, jobs move to failed state.

**Check Failed Jobs**:
```javascript
const failedJobs = await queueManager.getFailedJobs('forecast', 0, 10);

failedJobs.forEach(job => {
  console.log(`Job ${job.id} failed:`, job.failedReason);
  console.log('Data:', job.data);
  console.log('Attempts:', job.attemptsMade);
});
```

**Retry Failed Job**:
```javascript
await queueManager.retryJob('forecast', 'job-id');
```

### Dead Letter Queue (DLQ)

Failed jobs after all retries are kept for inspection:
- 7 days retention (default)
- 30 days for imports
- Manual retry available

## Testing

### Unit Tests

```bash
npm test -- tests/queues/QueueManager.test.js
npm test -- tests/workers/ForecastWorker.test.js
```

### Integration Tests

```bash
npm test -- tests/integration/queues.test.js
```

### Load Tests

```bash
# Add 1000 jobs
for i in {1..1000}; do
  curl -X POST http://localhost:5000/api/v1/queues/forecast/jobs \
    -H "Content-Type: application/json" \
    -d '{"name":"load-test","data":{"productId":"test-'$i'"}}'
done
```

## Performance Optimization

### Concurrency Tuning

Adjust worker concurrency based on server resources:

```javascript
// In worker constructor
this.worker = new Worker('queue-name', processor, {
  connection: this.connection,
  concurrency: 5,  // Increase for more parallel processing
});
```

### Rate Limiting

Limit jobs processed per time window:

```javascript
{
  limiter: {
    max: 10,        // Max 10 jobs
    duration: 60000 // Per minute
  }
}
```

### Memory Management

Clear completed jobs regularly:

```javascript
// Clean completed jobs older than 1 hour
await queueManager.cleanQueue('forecast', 3600000, 1000, 'completed');
```

## Troubleshooting

### Issue: Redis Connection Failed

**Solution**:
```bash
# Check Redis is running
redis-cli ping

# Check environment variable
echo $REDIS_URL

# Test connection
curl http://localhost:5000/api/v1/health/redis
```

### Issue: Jobs Stuck in Active State

**Solution**:
```javascript
// Stalled jobs are automatically detected and retried
// Check queue events for 'stalled' events

// Manually clean stalled jobs
await queue.clean(0, 0, 'active');
```

### Issue: High Memory Usage

**Solution**:
```javascript
// Clean old jobs more aggressively
await queueManager.cleanQueue('forecast', 3600000, 500, 'completed');

// Reduce job retention
{
  removeOnComplete: {
    age: 3600,    // 1 hour instead of 24
    count: 100    // Keep fewer jobs
  }
}
```

### Issue: Worker Not Processing Jobs

**Solution**:
```bash
# Check worker logs
tail -f logs/workers.log

# Verify worker is running
curl http://localhost:5000/api/v1/workers/status

# Restart workers
npm run workers:restart
```

## Best Practices

1. **Always provide userId** for SSE updates
2. **Use priority levels** for time-sensitive jobs
3. **Monitor queue depths** to detect bottlenecks
4. **Clean old jobs regularly** to prevent memory issues
5. **Test with mock data** before production
6. **Log job failures** for debugging
7. **Use job IDs** for tracking and correlation
8. **Set appropriate timeouts** for job types
9. **Handle job failures gracefully** in UI
10. **Monitor Redis health** continuously

## Environment Variables

```bash
# Redis connection
REDIS_URL=redis://localhost:6379

# Queue configuration
QUEUE_CONCURRENCY_FORECAST=3
QUEUE_CONCURRENCY_OPTIMIZATION=2
QUEUE_CONCURRENCY_SYNC=2

# Job timeouts (milliseconds)
JOB_TIMEOUT_FORECAST=300000   # 5 minutes
JOB_TIMEOUT_IMPORT=900000     # 15 minutes

# Worker health check interval
WORKER_HEALTH_CHECK_INTERVAL=60000  # 1 minute
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/issues
- Email: support@sentia.com
- Documentation: https://docs.sentia.com

---

**Last Updated**: October 17, 2025
**Version**: 1.0.0
**Maintained By**: Engineering Team
