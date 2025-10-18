# Forecasting Infrastructure Reference

**Last Updated**: 2025-10-18

## Overview

The application includes a comprehensive ML-powered demand forecasting system with model training, persistence, and real-time predictions.

## Architecture Components

### 1. Model Library (`services/forecasting/models/`)

Production-ready statistical models:

- **ARIMAModel.js** - Full ARIMA(p,d,q) implementation with Yule-Walker equations
- **HoltWintersModel.js** - Triple exponential smoothing for seasonal data
- **LinearRegressionModel.js** - Simple linear regression
- **SimpleMovingAverageModel.js** - Moving average baseline

### 2. Service Layer (`services/forecasting/`)

| Service | Purpose | Key Features |
|---------|---------|--------------|
| **enhancedForecastingEngine.js** (48KB) | Main forecasting orchestrator | Ensemble forecasting, model selection |
| **ForecastingService.js** (23KB) | Core forecasting API | Data preprocessing, validation |
| **MLModelTrainingPipeline.js** | ML model training | ARIMA, LSTM, Random Forest, Neural Network |
| **AccuracyDashboardService.js** | Accuracy tracking | MAE, RMSE, R², MAPE metrics |
| **FeatureEngineeringService.js** | Feature extraction | Lag features, moving averages, trends |
| **BatchProcessor.js** | Bulk processing | Multi-product forecasting |
| **CacheService.js** | Result caching | Redis-backed caching |
| **CFOWorkbenchService.js** | Financial forecasting | Working capital, cash flow |
| **RegionalCalendarService.js** | Calendar adjustments | Holidays, seasonality |
| **FXService.js** | Currency conversion | Multi-currency support |

### 3. Model Persistence (`services/model-persistence-service.js`) ✅ **NEW**

**Purpose**: Save/load trained models to/from database for reuse

**Key Methods**:

```javascript
import modelPersistenceService from './services/model-persistence-service.js';

// Save a trained model
const modelRecord = await modelPersistenceService.saveModel({
  modelType: 'arima',
  modelName: 'Product_XYZ_ARIMA_v1',
  parameters: {
    p: 2,
    d: 1,
    q: 2,
    arCoefficients: [0.3, 0.2],
    maCoefficients: [0.1, 0.15],
    intercept: 0.05
  },
  metrics: {
    overall: {
      mae: 12.5,
      rmse: 18.3,
      r2: 0.87,
      mape: 8.2
    }
  },
  trainingData: historicalData,
  config: { horizon: 30 },
  version: '1.0.0'
}, organizationId, productId);

// Load a trained model
const { model, metadata } = await modelPersistenceService.loadModel(modelId);
const predictions = model.predict(normalizedInput);

// Get best performing model
const bestModel = await modelPersistenceService.getBestModel(
  organizationId,
  productId,
  'ARIMA' // optional model type filter
);

// List all models
const models = await modelPersistenceService.listModels(organizationId, productId);

// Compare model performance
const comparison = await modelPersistenceService.getModelPerformanceComparison(
  organizationId,
  productId
);
```

### 4. Background Processing (`server/workers/ForecastWorker.js`)

BullMQ-powered asynchronous forecast generation:

```javascript
// Queue a forecast job
import { forecastQueue } from '../queues/QueueManager.js';

await forecastQueue.add('generate-forecast', {
  productId: 'prod_123',
  horizon: 30,
  modelType: 'arima',
  organizationId: 'org_456'
});
```

## Database Schema (Prisma)

### MLModel Table

```prisma
model MLModel {
  id                String   @id @default(cuid())
  organizationId    String
  productId         String?
  modelType         String   // ARIMA, LSTM, RANDOM_FOREST, etc.
  modelName         String
  version           String
  filePath          String?  // Filesystem path to model file
  parameters        Json     // Serialized model parameters
  metrics           Json     // Performance metrics (MAE, RMSE, R², MAPE)
  config            Json     // Training configuration
  trainingDataSize  Int
  status            String   // TRAINING, TRAINED, DEPLOYED, ARCHIVED, FAILED
  trainedAt         DateTime
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### DemandForecast Table

```prisma
model DemandForecast {
  id              String   @id @default(cuid())
  productId       String
  forecastDate    DateTime
  horizon         Int      // Days ahead
  forecastedDemand Decimal
  confidenceLower  Decimal?
  confidenceUpper  Decimal?
  modelType       String   // Which model generated this
  accuracy        Decimal? // Actual vs predicted error
  createdAt       DateTime @default(now())
}
```

## Usage Examples

### Example 1: Train and Save ARIMA Model

```javascript
import ARIMAModel from './services/forecasting/models/ARIMAModel.js';
import modelPersistenceService from './services/model-persistence-service.js';

// 1. Prepare historical data
const historicalData = await prisma.salesOrder.findMany({
  where: { productId: 'prod_123' },
  select: { orderDate: true, quantity: true },
  orderBy: { orderDate: 'asc' }
});

const timeSeries = historicalData.map(order => ({
  date: order.orderDate,
  value: order.quantity
}));

// 2. Train ARIMA model
const arimaModel = new ARIMAModel({ p: 2, d: 1, q: 2 });
await arimaModel.fit(timeSeries);

// 3. Generate forecasts
const forecasts = await arimaModel.forecast(30); // 30 days ahead

// 4. Calculate metrics (MAE, RMSE, etc.)
const metrics = calculateMetrics(forecasts, actualData);

// 5. Save model for reuse
const savedModel = await modelPersistenceService.saveModel({
  modelType: 'arima',
  modelName: `ARIMA_${productId}_${new Date().toISOString()}`,
  parameters: arimaModel.getParameters(),
  metrics,
  trainingData: timeSeries,
  config: { horizon: 30 }
}, organizationId, productId);

console.log('Model saved with ID:', savedModel.id);
```

### Example 2: Load and Use Existing Model

```javascript
// 1. Get best model for product
const bestModel = await modelPersistenceService.getBestModel(
  organizationId,
  productId,
  'ARIMA'
);

if (!bestModel) {
  throw new Error('No trained model found');
}

// 2. Load model instance
const { model, metadata } = await modelPersistenceService.loadModel(bestModel.id);

console.log('Using model:', metadata.modelType, 'trained at:', metadata.trainedAt);
console.log('Historical accuracy:', metadata.metrics.overall.mae, 'MAE');

// 3. Generate new predictions
const predictions = model.predict(30); // 30 periods ahead

// 4. Save forecasts to database
for (let i = 0; i < predictions.length; i++) {
  await prisma.demandForecast.create({
    data: {
      productId,
      forecastDate: new Date(Date.now() + i * 86400000), // i days from now
      horizon: i + 1,
      forecastedDemand: predictions[i],
      modelType: metadata.modelType,
      createdAt: new Date()
    }
  });
}
```

### Example 3: ML Model Training Pipeline

```javascript
import { MLModelTrainingPipeline } from './src/features/forecasting/services/MLModelTrainingPipeline.js';
import modelPersistenceService from './services/model-persistence-service.js';

// 1. Initialize training pipeline
const pipeline = new MLModelTrainingPipeline({
  maxTrainingIterations: 1000,
  validationSplit: 0.2,
  testSplit: 0.1,
  learningRate: 0.001
});

// 2. Prepare training data
const trainingData = historicalSalesData.map(row => ({
  date: row.date,
  value: row.quantity
}));

// 3. Train multiple models
const trainingResults = await pipeline.trainForecastingModels(trainingData, {
  enableEarlyStopping: true,
  patience: 10
});

console.log('Training complete!');
console.log('Best model:', trainingResults.bestModel.type);
console.log('MAE:', trainingResults.bestModel.metrics.mae);
console.log('R²:', trainingResults.bestModel.metrics.r2);

// 4. Save all trained models
for (const [modelType, result] of Object.entries(trainingResults.models)) {
  if (result.trained) {
    await modelPersistenceService.saveModel({
      modelType,
      modelName: `${modelType}_${productId}_${Date.now()}`,
      parameters: result.model,
      metrics: result.metrics,
      trainingData,
      config: {},
      version: '1.0.0'
    }, organizationId, productId);
  }
}
```

### Example 4: Ensemble Forecasting

```javascript
import modelPersistenceService from './services/model-persistence-service.js';

// 1. Load multiple trained models
const models = await modelPersistenceService.listModels(organizationId, productId, {
  status: 'TRAINED'
});

// 2. Generate predictions from each model
const predictions = [];
for (const modelRecord of models) {
  const { model } = await modelPersistenceService.loadModel(modelRecord.id);
  const forecast = model.predict(30);
  predictions.push({
    modelType: modelRecord.modelType,
    forecast,
    weight: 1 / (modelRecord.metrics?.overall?.mae || 1) // Weight by inverse MAE
  });
}

// 3. Combine predictions (weighted average)
const totalWeight = predictions.reduce((sum, p) => sum + p.weight, 0);
const ensembleForecast = predictions[0].forecast.map((_, i) => {
  return predictions.reduce((sum, p) => {
    return sum + (p.forecast[i] * p.weight / totalWeight);
  }, 0);
});

console.log('Ensemble forecast for next 30 days:', ensembleForecast);
```

## API Endpoints

### `/api/forecasts` (api/forecasting.js)

```javascript
// GET /api/forecasts/:productId
// Returns latest forecasts for a product

// POST /api/forecasts/generate
// Queue a new forecast generation job
{
  "productId": "prod_123",
  "horizon": 30,
  "modelType": "arima" // or "ensemble", "lstm", etc.
}

// GET /api/forecasts/models/:organizationId
// List all trained models for organization
```

## Model Performance Metrics

All models are evaluated using:

- **MAE** (Mean Absolute Error) - Average absolute difference between predicted and actual
- **RMSE** (Root Mean Squared Error) - Square root of average squared errors
- **R²** (R-squared) - Proportion of variance explained by model (0-1, higher is better)
- **MAPE** (Mean Absolute Percentage Error) - Average percentage error

## File Storage

Models are stored in two locations:

1. **Database** (`MLModel` table) - Metadata and parameters (JSON)
2. **Filesystem** - Full model files at `data/models/`

Example: `data/models/arima_org_456_prod_123_2025-10-18T12-30-45.json`

## Environment Variables

```bash
# Model storage path (default: ./data/models)
MODEL_STORAGE_PATH=/var/app/data/models

# Redis for caching (used by CacheService)
REDIS_URL=redis://localhost:6379
```

## Next Steps for Implementation

1. **Add Model Retraining Logic**: Automatically retrain models when accuracy drops
2. **Real-time Accuracy Tracking**: Compare forecasts with actual sales daily
3. **Model Versioning**: Track model evolution over time
4. **A/B Testing**: Deploy multiple models and compare performance
5. **Auto-Model Selection**: Automatically choose best model based on recent performance

## Key Files to Modify

Want to add model persistence to your forecasting workflow? Integrate in these locations:

1. **server/workers/ForecastWorker.js** - Save model after training
2. **api/forecasting.js** - Load best model for predictions
3. **services/forecasting/enhancedForecastingEngine.js** - Use persisted models
4. **src/features/forecasting/services/MLModelTrainingPipeline.js** - Save after training

## Summary

✅ **What Exists**: Full forecasting infrastructure with ARIMA, Holt-Winters, ML training pipeline
✅ **What's New**: Model persistence service for saving/loading trained models
🔄 **What's Next**: Integration of persistence into existing forecasting workflows
