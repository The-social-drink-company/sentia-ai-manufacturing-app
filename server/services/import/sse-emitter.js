/**
 * SSE Emitter for Import/Export Progress
 *
 * Emits Server-Sent Events for real-time progress updates
 *
 * @module services/import/sse-emitter
 */

let sseService

// Lazy load SSE service to avoid circular dependencies
function getSSEService() {
  if (!sseService) {
    try {
      sseService = require('../sse/index.cjs')
    } catch (error) {
      console.warn('SSE service not available:', error.message)
      return null
    }
  }
  return sseService
}

/**
 * Emit import progress update
 */
function emitImportProgress(importJobId, progress) {
  const sse = getSSEService()
  if (!sse || !sse.emit) return

  try {
    // Emit to job-specific channel
    sse.emit(`import:${importJobId}`, 'import:progress', {
      jobId: importJobId,
      progress: progress.progress,
      processedRows: progress.processedRows,
      succeededRows: progress.succeededRows,
      failedRows: progress.failedRows,
      status: 'IMPORTING',
      timestamp: new Date().toISOString(),
    })

    // Emit to general import channel
    sse.emit('import', 'import:progress', {
      jobId: importJobId,
      progress: progress.progress,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to emit import progress:', error.message)
  }
}

/**
 * Emit import started event
 */
function emitImportStarted(importJobId, metadata) {
  const sse = getSSEService()
  if (!sse || !sse.emit) return

  try {
    sse.emit(`import:${importJobId}`, 'import:started', {
      jobId: importJobId,
      status: 'IMPORTING',
      ...metadata,
      timestamp: new Date().toISOString(),
    })

    sse.emit('import', 'import:started', {
      jobId: importJobId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to emit import started:', error.message)
  }
}

/**
 * Emit import completed event
 */
function emitImportCompleted(importJobId, result) {
  const sse = getSSEService()
  if (!sse || !sse.emit) return

  try {
    sse.emit(`import:${importJobId}`, 'import:completed', {
      jobId: importJobId,
      status: 'COMPLETED',
      totalRows: result.totalRows,
      succeededRows: result.succeededRows,
      failedRows: result.failedRows,
      duration: result.duration,
      timestamp: new Date().toISOString(),
    })

    sse.emit('import', 'import:completed', {
      jobId: importJobId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to emit import completed:', error.message)
  }
}

/**
 * Emit import failed event
 */
function emitImportFailed(importJobId, error) {
  const sse = getSSEService()
  if (!sse || !sse.emit) return

  try {
    sse.emit(`import:${importJobId}`, 'import:failed', {
      jobId: importJobId,
      status: 'FAILED',
      error: error.message,
      timestamp: new Date().toISOString(),
    })

    sse.emit('import', 'import:failed', {
      jobId: importJobId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to emit import failed:', error.message)
  }
}

/**
 * Emit export progress update
 */
function emitExportProgress(exportJobId, progress) {
  const sse = getSSEService()
  if (!sse || !sse.emit) return

  try {
    sse.emit(`export:${exportJobId}`, 'export:progress', {
      jobId: exportJobId,
      progress,
      status: 'EXPORTING',
      timestamp: new Date().toISOString(),
    })

    sse.emit('export', 'export:progress', {
      jobId: exportJobId,
      progress,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to emit export progress:', error.message)
  }
}

/**
 * Emit export started event
 */
function emitExportStarted(exportJobId, metadata) {
  const sse = getSSEService()
  if (!sse || !sse.emit) return

  try {
    sse.emit(`export:${exportJobId}`, 'export:started', {
      jobId: exportJobId,
      status: 'EXPORTING',
      ...metadata,
      timestamp: new Date().toISOString(),
    })

    sse.emit('export', 'export:started', {
      jobId: exportJobId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to emit export started:', error.message)
  }
}

/**
 * Emit export completed event
 */
function emitExportCompleted(exportJobId, result) {
  const sse = getSSEService()
  if (!sse || !sse.emit) return

  try {
    sse.emit(`export:${exportJobId}`, 'export:completed', {
      jobId: exportJobId,
      status: 'COMPLETED',
      rowCount: result.rowCount,
      fileSize: result.size,
      filename: result.filename,
      duration: result.duration,
      timestamp: new Date().toISOString(),
    })

    sse.emit('export', 'export:completed', {
      jobId: exportJobId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to emit export completed:', error.message)
  }
}

/**
 * Emit export failed event
 */
function emitExportFailed(exportJobId, error) {
  const sse = getSSEService()
  if (!sse || !sse.emit) return

  try {
    sse.emit(`export:${exportJobId}`, 'export:failed', {
      jobId: exportJobId,
      status: 'FAILED',
      error: error.message,
      timestamp: new Date().toISOString(),
    })

    sse.emit('export', 'export:failed', {
      jobId: exportJobId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to emit export failed:', error.message)
  }
}

module.exports = {
  // Import events
  emitImportProgress,
  emitImportStarted,
  emitImportCompleted,
  emitImportFailed,

  // Export events
  emitExportProgress,
  emitExportStarted,
  emitExportCompleted,
  emitExportFailed,
}
