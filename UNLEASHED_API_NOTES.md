# Unleashed API Integration Notes

## Stock Movements Endpoint - 403 Forbidden Issue

### Problem

The `/StockMovements` endpoint returns 403 Forbidden error, indicating insufficient permissions.

### Potential Causes

1. **API Key Permissions**: The API key may not have permissions to access stock movement data
2. **Endpoint Availability**: Stock movements might be a premium/restricted feature
3. **Account Limitations**: The Unleashed account plan may not include this endpoint

### Solutions Implemented

#### 1. Reduced Page Sizes

- Changed from 500 to 100 items per page to avoid timeouts
- This helps with API rate limiting and response times

#### 2. Added Retry Logic with Exponential Backoff

- Implemented 3 retry attempts with exponential delay
- Helps handle temporary API failures

#### 3. Increased Transaction Timeouts

- Set Prisma transaction timeout to 30 seconds (from default 5 seconds)
- Added 5 second maxWait time for acquiring database locks

#### 4. Fixed WebSocket Service References

- Corrected import to use singleton instance directly
- Fixed broadcast methods to use proper WebSocket namespaces

### Recommendations for Client

1. **Check API Permissions in Unleashed**:
   - Log into Unleashed admin panel
   - Navigate to Settings > API Access
   - Verify that the API key has permissions for:
     - Stock On Hand (working)
     - Purchase Orders (working)
     - Sales Orders (working)
     - Stock Movements (currently failing with 403)

2. **Alternative Data Sources**:
   - If Stock Movements endpoint is not available, consider:
     - Calculating movements from Purchase Orders and Sales Orders
     - Using Stock Adjustment data if available
     - Implementing manual stock movement tracking

3. **Contact Unleashed Support**:
   - If the API key should have access but doesn't
   - Request enabling Stock Movements API access
   - Verify account plan includes this feature

## Performance Optimizations Applied

1. **Reduced Batch Sizes**: 100-500 items per sync operation
2. **Transaction Timeouts**: 30 seconds for large operations
3. **Parallel Processing**: Where possible without overwhelming the API
4. **Caching**: Consider implementing Redis caching for frequently accessed data
5. **Rate Limiting**: Respect API rate limits with retry logic

## Error Handling

All API errors are now properly logged and handled:

- Connection timeouts trigger retries
- 403 errors are caught and reported
- Failed syncs don't crash the application
- WebSocket broadcasts continue even if individual operations fail
