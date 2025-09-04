# Forecasting Algorithms - Business Logic Documentation

## Overview

This document defines the forecasting algorithms, model selection methodology, backtesting protocols, and prediction interval calibration methods used in the Sentia Manufacturing Dashboard demand forecasting system.

## Algorithm Portfolio

### Core Models

#### 1. Simple Moving Average (SMA)
- **Purpose**: Baseline model for trend detection
- **Parameters**: 
  - `window_size`: 7, 14, 28 days (configurable)
- **Use Case**: Stable demand patterns with minimal seasonality
- **Strengths**: Robust to outliers, fast computation
- **Weaknesses**: Lags on trend changes, no seasonality handling

#### 2. Holt-Winters Exponential Smoothing
- **Purpose**: Seasonal demand forecasting
- **Parameters**:
  - `alpha` (level): 0.1-0.9
  - `beta` (trend): 0.1-0.9  
  - `gamma` (seasonal): 0.1-0.9
  - `seasonality_type`: 'additive' | 'multiplicative'
  - `seasonal_periods`: 7 (weekly), 28 (monthly)
- **Use Case**: Clear seasonal patterns (weekly, monthly cycles)
- **Strengths**: Handles trend and seasonality, adaptive
- **Weaknesses**: Sensitive to parameter tuning, requires stable patterns

#### 3. ARIMA (AutoRegressive Integrated Moving Average)
- **Purpose**: Complex time series with trend and dependencies
- **Parameters**:
  - `p` (AR order): 0-3
  - `d` (differencing): 0-2
  - `q` (MA order): 0-3
- **Auto-selection**: Use AIC/BIC criteria for parameter optimization
- **Use Case**: Non-stationary series with autocorrelation
- **Strengths**: Theoretical foundation, flexible
- **Weaknesses**: Parameter complexity, computational cost

#### 4. Linear Regression with Features
- **Purpose**: Feature-rich forecasting with exogenous variables
- **Features**:
  - `lag_features`: y_{t-1}, y_{t-7}, y_{t-28}
  - `moving_averages`: 7-day, 14-day, 28-day MA
  - `seasonal_dummies`: Day of week, month indicators
  - `promo_flags`: Promotional period indicators
  - `price_features`: Price changes, elasticity factors
  - `calendar_features`: Holidays, events (UK/EU/USA specific)
- **Use Case**: Rich feature sets with external drivers
- **Strengths**: Interpretable, handles external factors
- **Weaknesses**: Feature engineering complexity, overfitting risk

### Ensemble Model

#### Weighted Average Ensemble
- **Method**: Inverse error weighting based on backtest performance
- **Weights Calculation**:
  ```javascript
  weight_i = (1 / MAPE_i) / sum(1 / MAPE_j for all models)
  ```
- **Weight Constraints**:
  - Minimum weight: 5% (prevent zero weights)
  - Maximum weight: 70% (prevent dominance)
  - Normalization: Weights sum to 1.0
- **Persistence**: Weights stored per series_id in database

## Model Selection Protocol

### Rolling-Origin Backtesting

#### Configuration
- **Backtest Folds**: Configurable (default: 5 folds)
- **Forecast Horizon**: Match production horizon (30/60/90 days)
- **Training Window**: Minimum 90 days, maximum 365 days
- **Step Size**: 7 days (weekly progression)

#### Fold Structure
```
Fold 1: Train[t-270:t-180] → Test[t-180:t-150]
Fold 2: Train[t-263:t-173] → Test[t-173:t-143]
Fold 3: Train[t-256:t-166] → Test[t-166:t-136]
Fold 4: Train[t-249:t-159] → Test[t-159:t-129]
Fold 5: Train[t-242:t-152] → Test[t-152:t-122]
```

#### Evaluation Metrics

##### Primary Metric: MAPE (Mean Absolute Percentage Error)
```javascript
MAPE = (100/n) * Σ|((actual_i - predicted_i) / actual_i)|
```
- **Target**: < 15% for good performance
- **Interpretability**: Business-friendly percentage error

##### Secondary Metrics:
1. **sMAPE (Symmetric MAPE)**:
   ```javascript
   sMAPE = (100/n) * Σ|(actual_i - predicted_i) / ((actual_i + predicted_i)/2)|
   ```
   - **Target**: < 20%
   - **Advantage**: Symmetric, bounded [0,200]

2. **RMSE (Root Mean Square Error)**:
   ```javascript
   RMSE = √((1/n) * Σ(actual_i - predicted_i)²)
   ```
   - **Target**: Domain-specific thresholds
   - **Advantage**: Penalizes large errors

3. **MAE (Mean Absolute Error)**:
   ```javascript
   MAE = (1/n) * Σ|actual_i - predicted_i|
   ```
   - **Advantage**: Robust to outliers, interpretable units

#### Selection Logic
1. **Primary**: Select model with lowest MAPE across all folds
2. **Tie-breaker 1**: If MAPE difference < 1%, choose lower sMAPE
3. **Tie-breaker 2**: If sMAPE difference < 2%, choose lower RMSE
4. **Ensemble**: Always computed; selected if beats best individual model

### Hyperparameter Optimization

#### Search Spaces
```javascript
const hyperparameterGrids = {
  SMA: {
    window_size: [7, 14, 21, 28]
  },
  HoltWinters: {
    alpha: [0.1, 0.3, 0.5, 0.7, 0.9],
    beta: [0.1, 0.3, 0.5, 0.7],
    gamma: [0.1, 0.3, 0.5, 0.7],
    seasonality_type: ['additive', 'multiplicative'],
    seasonal_periods: [7, 14, 28]
  },
  ARIMA: {
    p: [0, 1, 2, 3],
    d: [0, 1, 2],
    q: [0, 1, 2, 3]
  },
  Linear: {
    regularization: [0.0, 0.01, 0.1, 1.0],
    lag_order: [1, 7, 14, 28],
    ma_windows: [[7], [7,14], [7,14,28]]
  }
}
```

#### Grid Search Strategy
- **Method**: Exhaustive grid search within bounds
- **Constraint**: Maximum 100 parameter combinations per model
- **Parallelization**: Independent parameter sets processed concurrently
- **Early Stopping**: Stop if no improvement for 10 consecutive trials

## Prediction Interval Calibration

### Methodology
- **Target Coverage**: 95% (configurable: 80%, 90%, 95%, 99%)
- **Method**: Empirical residual variance from backtest folds
- **Distribution Assumption**: Gaussian residuals (validated per series)

### Calibration Process

#### 1. Residual Collection
```javascript
// Collect residuals from all backtest folds
const residuals = [];
for (const fold of backtestFolds) {
  for (const prediction of fold.predictions) {
    residuals.push(prediction.actual - prediction.forecast);
  }
}
```

#### 2. Variance Estimation
```javascript
const residualVariance = calculateVariance(residuals);
const residualStdDev = Math.sqrt(residualVariance);
```

#### 3. Interval Calculation
```javascript
const zScore = {
  80: 1.282,
  90: 1.645, 
  95: 1.960,
  99: 2.576
}[coverageLevel];

const lowerBound = forecast - (zScore * residualStdDev);
const upperBound = forecast + (zScore * residualStdDev);
```

#### 4. Coverage Validation
```javascript
const achievedCoverage = residuals.filter(r => 
  Math.abs(r) <= zScore * residualStdDev
).length / residuals.length;
```

### Coverage Monitoring
- **Storage**: Per-series achieved coverage tracked in database
- **Alerting**: Coverage deviation > 10% from target triggers review
- **Recalibration**: Automatic recalibration if coverage consistently off-target

## Feature Engineering Standards

### Lag Features
```javascript
const lagFeatures = {
  y_lag_1: timeSeries[t-1],      // Previous day
  y_lag_7: timeSeries[t-7],      // Same day last week
  y_lag_28: timeSeries[t-28],    // Same day last month
  y_lag_91: timeSeries[t-91],    // Same day last quarter
  y_lag_365: timeSeries[t-365]   // Same day last year
};
```

### Moving Averages
```javascript
const movingAverages = {
  ma_7: calculateMA(timeSeries, 7, t),    // Weekly trend
  ma_14: calculateMA(timeSeries, 14, t),  // Bi-weekly trend  
  ma_28: calculateMA(timeSeries, 28, t),  // Monthly trend
  ma_91: calculateMA(timeSeries, 91, t)   // Quarterly trend
};
```

### Seasonal Features
```javascript
const seasonalFeatures = {
  day_of_week: new Date(t).getDay(),          // 0-6
  week_of_month: Math.ceil(date.getDate()/7), // 1-5
  month_of_year: new Date(t).getMonth(),      // 0-11
  quarter: Math.floor(new Date(t).getMonth()/3) + 1, // 1-4
  is_weekend: [0,6].includes(new Date(t).getDay()),
  is_month_end: isLastDayOfMonth(t),
  is_quarter_end: isLastDayOfQuarter(t)
};
```

### External Features
```javascript
const externalFeatures = {
  // Promotional indicators
  is_promo_period: checkPromoCalendar(t),
  promo_intensity: getPromoIntensity(t), // 0.0-1.0
  
  // Price features
  price_change_pct: (price[t] - price[t-1]) / price[t-1],
  price_vs_ma_28: price[t] / calculateMA(prices, 28, t),
  
  // Calendar events (region-specific)
  is_holiday: checkHolidayCalendar(t, region),
  is_holiday_adjacent: checkAdjacentHoliday(t, region),
  special_event: getSpecialEvent(t, region), // Black Friday, Prime Day, etc.
  
  // Economic indicators (if available)
  fx_rate: getFXRate(baseCurrency, targetCurrency, t),
  fx_volatility: calculateFXVolatility(baseCurrency, targetCurrency, t, 30)
};
```

## Outlier Handling

### Detection Methods

#### 1. Statistical Outliers
```javascript
const detectStatisticalOutliers = (timeSeries, method = 'iqr') => {
  switch(method) {
    case 'iqr':
      const q1 = percentile(timeSeries, 25);
      const q3 = percentile(timeSeries, 75);
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      return timeSeries.map(x => x < lowerBound || x > upperBound);
    
    case 'zscore':
      const mean = calculateMean(timeSeries);
      const std = calculateStdDev(timeSeries);
      return timeSeries.map(x => Math.abs((x - mean) / std) > 3);
    
    case 'modified_zscore':
      const median = percentile(timeSeries, 50);
      const mad = calculateMAD(timeSeries);
      return timeSeries.map(x => Math.abs(0.6745 * (x - median) / mad) > 3.5);
  }
};
```

#### 2. Contextual Outliers
```javascript
const detectContextualOutliers = (timeSeries, context) => {
  // Day-of-week specific outliers
  const dayPattern = groupByDayOfWeek(timeSeries);
  return timeSeries.map((value, index) => {
    const day = getDayOfWeek(index);
    const dayMean = calculateMean(dayPattern[day]);
    const dayStd = calculateStdDev(dayPattern[day]);
    return Math.abs(value - dayMean) > 2.5 * dayStd;
  });
};
```

### Treatment Strategy
1. **Flag, Don't Drop**: Mark outliers but retain in dataset
2. **Winsorization**: Cap extreme values at 95th/5th percentiles
3. **Robust Methods**: Use median/MAD instead of mean/std where applicable
4. **Down-weighting**: Reduce influence in model training (weight = 0.1-0.5)
5. **Documentation**: Record all outlier treatment decisions

```javascript
const treatOutliers = (timeSeries, outlierFlags, method = 'winsorize') => {
  switch(method) {
    case 'winsorize':
      const p5 = percentile(timeSeries, 5);
      const p95 = percentile(timeSeries, 95);
      return timeSeries.map(x => Math.max(p5, Math.min(p95, x)));
    
    case 'cap':
      const q1 = percentile(timeSeries, 25);
      const q3 = percentile(timeSeries, 75);
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      return timeSeries.map(x => Math.max(lower, Math.min(upper, x)));
    
    case 'flag_only':
      return { values: timeSeries, outlier_flags: outlierFlags };
  }
};
```

## Data Quality Requirements

### Minimum Data Requirements
- **History**: Minimum 90 days for model training
- **Completeness**: Maximum 20% missing values
- **Recency**: Maximum 7 days since last data point
- **Consistency**: No more than 5 consecutive zeros (unless business valid)

### Imputation Strategy
1. **Short Gaps** (≤ 3 days): Forward fill
2. **Medium Gaps** (4-7 days): Linear interpolation
3. **Long Gaps** (> 7 days): Mark as missing, down-weight in training
4. **Start/End Missing**: Use seasonal patterns or industry averages

### Quality Scoring
```javascript
const calculateDataQuality = (timeSeries) => {
  const completeness = (timeSeries.length - countMissing(timeSeries)) / timeSeries.length;
  const recency = Math.max(0, 1 - (daysSinceLastUpdate / 14)); // Decay over 14 days
  const consistency = 1 - (countConsecutiveZeros(timeSeries) / timeSeries.length);
  const stability = 1 - (countOutliers(timeSeries) / timeSeries.length);
  
  return {
    overall: (completeness + recency + consistency + stability) / 4,
    completeness,
    recency, 
    consistency,
    stability
  };
};
```

## Model Diagnostics

### Residual Analysis
1. **Normality Test**: Shapiro-Wilk test on residuals
2. **Autocorrelation**: Ljung-Box test for residual independence
3. **Heteroscedasticity**: Breusch-Pagan test for constant variance
4. **Stationarity**: Augmented Dickey-Fuller test

### Model Stability
1. **Parameter Drift**: Track parameter changes over time
2. **Performance Drift**: Monitor MAPE degradation
3. **Prediction Bias**: Track mean residual (should be near zero)
4. **Coverage Stability**: Monitor prediction interval coverage

### Diagnostic Storage
```javascript
const modelDiagnostics = {
  series_id: string,
  model_type: string,
  backtest_metrics: {
    mape: number,
    smape: number, 
    rmse: number,
    mae: number
  },
  residual_stats: {
    mean: number,
    std: number,
    skewness: number,
    kurtosis: number,
    normality_p_value: number
  },
  prediction_intervals: {
    target_coverage: number,
    achieved_coverage: number,
    calibration_date: timestamp
  },
  model_parameters: object,
  ensemble_weights: object,
  last_updated: timestamp
};
```

## Performance Targets

### Accuracy Targets
- **Excellent**: MAPE < 10%
- **Good**: MAPE 10-15% 
- **Acceptable**: MAPE 15-25%
- **Poor**: MAPE > 25%

### Coverage Targets
- **Target**: 95% ± 5% for 95% prediction intervals
- **Monitoring**: Monthly coverage assessment
- **Recalibration**: Triggered if coverage deviates by > 10%

### Latency Targets
- **Single Series Forecast**: < 2 seconds
- **Batch Forecasting** (100 series): < 30 seconds
- **Backtest Computation**: < 10 seconds per model per series

This business logic serves as the foundation for the enhanced forecasting system, ensuring rigorous model selection, calibrated uncertainty quantification, and robust feature engineering practices.