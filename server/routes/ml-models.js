/**
 * ML Models API Routes
 * Endpoints for managing machine learning models, training, and predictions
 */

import express from 'express'
import aiForecastingEngine from '../../services/ai-forecasting-engine.js'
import modelPersistenceService from '../../services/model-persistence-service.js'
import {
  loadModelsFromDatabase,
  saveModelToDatabase,
  listModels,
  trainModelWithPersistence,
  getModelPerformanceHistory,
} from '../../services/ai-forecasting-engine-persistence.js'
import { logInfo, logError } from '../../services/observability/structuredLogger.js'

const router = express.Router()

/**
 * GET /api/ml-models
 * List all ML models with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { name, isActive, status, modelType } = req.query

    const filters = {}
    if (name) filters.name = name
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    if (status) filters.status = status
    if (modelType) filters.modelType = modelType

    const models = await listModels(filters)

    res.json({
      success: true,
      count: models.length,
      models: models.map(model => ({
        id: model.id,
        name: model.name,
        displayName: model.displayName,
        version: model.version,
        modelType: model.modelType,
        status: model.status,
        isActive: model.isActive,
        ensembleWeight: model.ensembleWeight,
        metrics: {
          accuracy: model.accuracy,
          mse: model.mse,
          mae: model.mae,
          mape: model.mape,
          rmse: model.rmse,
          r2Score: model.r2Score,
        },
        weightsSize: model.weightsSize,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        trainingCount: model._count?.trainingHistory || 0,
        predictionCount: model._count?.predictions || 0,
      })),
    })
  } catch (error) {
    logError('Failed to list ML models:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve models',
      message: error.message,
    })
  }
})

/**
 * GET /api/ml-models/status
 * Get current status of all models in the AI forecasting engine
 */
router.get('/status', async (req, res) => {
  try {
    const status = await aiForecastingEngine.getModelStatus()

    res.json({
      success: true,
      status,
    })
  } catch (error) {
    logError('Failed to get model status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve model status',
      message: error.message,
    })
  }
})

/**
 * GET /api/ml-models/:name/versions
 * Get all versions of a specific model
 */
router.get('/:name/versions', async (req, res) => {
  try {
    const { name } = req.params

    const models = await listModels({ name })

    res.json({
      success: true,
      modelName: name,
      versions: models.map(model => ({
        id: model.id,
        version: model.version,
        isActive: model.isActive,
        status: model.status,
        metrics: {
          accuracy: model.accuracy,
          mse: model.mse,
          mae: model.mae,
        },
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      })),
    })
  } catch (error) {
    logError(`Failed to get versions for model ${req.params.name}:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve model versions',
      message: error.message,
    })
  }
})

/**
 * GET /api/ml-models/:name/performance
 * Get performance history for a model
 */
router.get('/:name/performance', async (req, res) => {
  try {
    const { name } = req.params

    const history = await getModelPerformanceHistory(name)

    res.json({
      success: true,
      modelName: name,
      performanceHistory: history,
    })
  } catch (error) {
    logError(`Failed to get performance history for ${req.params.name}:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance history',
      message: error.message,
    })
  }
})

/**
 * POST /api/ml-models/:name/train
 * Train a specific model with provided data
 */
router.post('/:name/train', async (req, res) => {
  try {
    const { name } = req.params
    const { data, saveToDatabase = true } = req.body

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid training data',
        message: 'Data must be an array of historical values',
      })
    }

    logInfo(`Starting training for model: ${name}`)

    // Train model with persistence
    const originalPersistenceState = aiForecastingEngine.persistenceEnabled
    aiForecastingEngine.persistenceEnabled = saveToDatabase

    const result = await trainModelWithPersistence(aiForecastingEngine, name, data)

    aiForecastingEngine.persistenceEnabled = originalPersistenceState

    res.json({
      success: true,
      model: name,
      result: {
        performance: result.performance,
        trainingTime: result.trainingTime,
        databaseId: result.databaseId || null,
        version: result.version || null,
        persisted: result.persisted,
      },
    })
  } catch (error) {
    logError(`Failed to train model ${req.params.name}:`, error)
    res.status(500).json({
      success: false,
      error: 'Training failed',
      message: error.message,
    })
  }
})

/**
 * POST /api/ml-models/train-all
 * Train all models with provided data
 */
router.post('/train-all', async (req, res) => {
  try {
    const { data, saveToDatabase = true } = req.body

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid training data',
        message: 'Data must be an array of historical values',
      })
    }

    logInfo('Starting training for all models')

    const originalPersistenceState = aiForecastingEngine.persistenceEnabled
    aiForecastingEngine.persistenceEnabled = saveToDatabase

    const results = await aiForecastingEngine.trainAllModels(data)

    // Save each model to database if persistence enabled
    if (saveToDatabase) {
      for (const [modelName, result] of Object.entries(results)) {
        if (result.success !== false) {
          try {
            await saveModelToDatabase(aiForecastingEngine, modelName, result.trainingHistory)
          } catch (error) {
            logError(`Failed to save ${modelName} to database:`, error)
          }
        }
      }
    }

    aiForecastingEngine.persistenceEnabled = originalPersistenceState

    res.json({
      success: true,
      results,
    })
  } catch (error) {
    logError('Failed to train all models:', error)
    res.status(500).json({
      success: false,
      error: 'Training failed',
      message: error.message,
    })
  }
})

/**
 * POST /api/ml-models/:id/activate
 * Activate a specific model version
 */
router.post('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params

    const updatedModel = await modelPersistenceService.activateModel(id)

    // Reload models from database to get the activated version
    await loadModelsFromDatabase(aiForecastingEngine)

    res.json({
      success: true,
      message: `Model ${updatedModel.name} v${updatedModel.version} activated`,
      model: {
        id: updatedModel.id,
        name: updatedModel.name,
        version: updatedModel.version,
        status: updatedModel.status,
        isActive: updatedModel.isActive,
      },
    })
  } catch (error) {
    logError(`Failed to activate model ${req.params.id}:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to activate model',
      message: error.message,
    })
  }
})

/**
 * DELETE /api/ml-models/:id
 * Delete (archive) a model version
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const deletedModel = await modelPersistenceService.deleteModel(id)

    res.json({
      success: true,
      message: `Model ${deletedModel.name} v${deletedModel.version} deleted`,
      model: {
        id: deletedModel.id,
        name: deletedModel.name,
        version: deletedModel.version,
        status: deletedModel.status,
      },
    })
  } catch (error) {
    logError(`Failed to delete model ${req.params.id}:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete model',
      message: error.message,
    })
  }
})

/**
 * PUT /api/ml-models/:id/metrics
 * Update model performance metrics
 */
router.put('/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params
    const { metrics } = req.body

    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid metrics data',
        message: 'Metrics must be an object',
      })
    }

    const updatedModel = await modelPersistenceService.updateMetrics(id, metrics)

    res.json({
      success: true,
      message: 'Metrics updated successfully',
      model: {
        id: updatedModel.id,
        name: updatedModel.name,
        version: updatedModel.version,
        metrics: {
          accuracy: updatedModel.accuracy,
          mse: updatedModel.mse,
          mae: updatedModel.mae,
          mape: updatedModel.mape,
          rmse: updatedModel.rmse,
          r2Score: updatedModel.r2Score,
        },
      },
    })
  } catch (error) {
    logError(`Failed to update metrics for model ${req.params.id}:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to update metrics',
      message: error.message,
    })
  }
})

/**
 * PUT /api/ml-models/ensemble-weights
 * Update ensemble model weights
 */
router.put('/ensemble-weights', async (req, res) => {
  try {
    const { weights } = req.body

    if (!weights || typeof weights !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid weights data',
        message: 'Weights must be an object with model names as keys',
      })
    }

    aiForecastingEngine.updateEnsembleWeights(weights)

    res.json({
      success: true,
      message: 'Ensemble weights updated',
      weights: aiForecastingEngine.ensembleWeights,
    })
  } catch (error) {
    logError('Failed to update ensemble weights:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update ensemble weights',
      message: error.message,
    })
  }
})

/**
 * GET /api/ml-models/performance/summary
 * Get performance summary across all models
 */
router.get('/performance/summary', async (req, res) => {
  try {
    const metrics = aiForecastingEngine.getPerformanceMetrics()

    res.json({
      success: true,
      performance: metrics,
    })
  } catch (error) {
    logError('Failed to get performance summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance summary',
      message: error.message,
    })
  }
})

/**
 * POST /api/ml-models/:name/predict
 * Generate predictions using a specific model
 */
router.post('/:name/predict', async (req, res) => {
  try {
    const { name } = req.params
    const { data, horizon = 7, options = {} } = req.body

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        message: 'Data must be an array',
      })
    }

    const forecast = await aiForecastingEngine.generateSingleModelForecast(
      name,
      data,
      horizon,
      options
    )

    res.json({
      success: true,
      modelName: name,
      forecast,
    })
  } catch (error) {
    logError(`Failed to generate prediction with ${req.params.name}:`, error)
    res.status(500).json({
      success: false,
      error: 'Prediction failed',
      message: error.message,
    })
  }
})

/**
 * POST /api/ml-models/forecast/ensemble
 * Generate ensemble forecast using all active models
 */
router.post('/forecast/ensemble', async (req, res) => {
  try {
    const { data, horizon = 7, options = {} } = req.body

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        message: 'Data must be an array',
      })
    }

    const forecast = await aiForecastingEngine.generateForecast(data, horizon, options)

    res.json({
      success: true,
      forecast,
    })
  } catch (error) {
    logError('Failed to generate ensemble forecast:', error)
    res.status(500).json({
      success: false,
      error: 'Forecast generation failed',
      message: error.message,
    })
  }
})

/**
 * POST /api/ml-models/reload
 * Reload models from database
 */
router.post('/reload', async (req, res) => {
  try {
    logInfo('Reloading models from database...')

    const loaded = await loadModelsFromDatabase(aiForecastingEngine)

    if (loaded) {
      res.json({
        success: true,
        message: 'Models reloaded successfully from database',
      })
    } else {
      res.json({
        success: false,
        message: 'Models not found in database, using in-memory models',
      })
    }
  } catch (error) {
    logError('Failed to reload models:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to reload models',
      message: error.message,
    })
  }
})

export default router
