class FeatureEngineeringService {
  constructor(options = {}) {
    this.config = {
      outlierMethod: options.outlierMethod || 'iqr',
      outlierThreshold: options.outlierThreshold || 1.5,
      maxMissingPercent: options.maxMissingPercent || 0.2,
      maxConsecutiveZeros: options.maxConsecutiveZeros || 5,
      minHistoryDays: options.minHistoryDays || 90
    };
  }

  // Main data quality assessment
  assessDataQuality(timeSeries) {
    const missing = this.countMissing(timeSeries);
    const zeros = this.countConsecutiveZeros(timeSeries);
    const outliers = this.detectOutliers(timeSeries);
    const recency = this.assessRecency(timeSeries);

    const completeness = (timeSeries.length - missing) / timeSeries.length;
    const recencyScore = Math.max(0, 1 - (recency / 14)); // Decay over 14 days
    const consistency = 1 - (zeros.maxConsecutive / timeSeries.length);
    const stability = 1 - (outliers.count / timeSeries.length);

    return {
      overall: (completeness + recencyScore + consistency + stability) / 4,
      scores: {
        completeness,
        recency: recencyScore,
        consistency,
        stability
      },
      issues: {
        missingValues: missing,
        consecutiveZeros: zeros,
        outliers: outliers,
        daysSinceLastUpdate: recency
      },
      recommendations: this.generateRecommendations({
        completeness,
        recency: recencyScore,
        consistency,
        stability,
        missing,
        zeros,
        outliers
      })
    };
  }

  // Outlier detection methods
  detectOutliers(timeSeries, method = null) {
    const outlierMethod = method || this.config.outlierMethod;
    const values = timeSeries.map(point => parseFloat(point.value)).filter(v => !isNaN(v));

    if (values.length === 0) {
      return { method: outlierMethod, count: 0, indices: [], bounds: null };
    }

    let outlierIndices = [];
    let bounds = null;

    switch (outlierMethod) {
      case 'iqr':
        ({ outlierIndices, bounds } = this.detectIQROutliers(values));
        break;
      case 'zscore':
        ({ outlierIndices, bounds } = this.detectZScoreOutliers(values));
        break;
      case 'modified_zscore':
        ({ outlierIndices, bounds } = this.detectModifiedZScoreOutliers(values));
        break;
      case 'contextual':
        ({ outlierIndices, bounds } = this.detectContextualOutliers(timeSeries));
        break;
      default:
        ({ outlierIndices, bounds } = this.detectIQROutliers(values));
    }

    return {
      method: outlierMethod,
      count: outlierIndices.length,
      indices: outlierIndices,
      bounds: bounds,
      percentage: (outlierIndices.length / values.length) * 100
    };
  }

  detectIQROutliers(values) {
    const sorted = [...values].sort((a, _b) => a - b);
    const q1 = this.percentile(sorted, 25);
    const q3 = this.percentile(sorted, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - (this.config.outlierThreshold * iqr);
    const upperBound = q3 + (this.config.outlierThreshold * iqr);

    const outlierIndices = values
      .map((val, idx) => ({ val, idx }))
      .filter(item => item.val < lowerBound || item.val > upperBound)
      .map(item => item.idx);

    return {
      outlierIndices,
      bounds: { lower: lowerBound, upper: upperBound, q1, q3, iqr }
    };
  }

  detectZScoreOutliers(values, threshold = 3) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const outlierIndices = values
      .map((val, idx) => ({ val, idx, zscore: Math.abs((val - mean) / stdDev) }))
      .filter(item => item.zscore > threshold)
      .map(item => item.idx);

    return {
      outlierIndices,
      bounds: { 
        mean, 
        stdDev, 
        threshold,
        lower: mean - (threshold * stdDev),
        upper: mean + (threshold * stdDev)
      }
    };
  }

  detectModifiedZScoreOutliers(values, threshold = 3.5) {
    const median = this.percentile(values, 50);
    const mad = this.calculateMAD(values);
    
    const outlierIndices = values
      .map((val, idx) => ({ 
        val, 
        idx, 
        modifiedZScore: Math.abs(0.6745 * (val - median) / mad) 
      }))
      .filter(item => item.modifiedZScore > threshold)
      .map(item => item.idx);

    return {
      outlierIndices,
      bounds: { 
        median, 
        mad, 
        threshold,
        lower: median - (threshold * mad / 0.6745),
        upper: median + (threshold * mad / 0.6745)
      }
    };
  }

  detectContextualOutliers(timeSeries) {
    // Group by day of week for contextual analysis
    const dayGroups = {};
    timeSeries.forEach((point, idx) => {
      const date = new Date(point.date);
      const dayOfWeek = date.getDay();
      
      if (!dayGroups[dayOfWeek]) {
        dayGroups[dayOfWeek] = [];
      }
      dayGroups[dayOfWeek].push({ value: parseFloat(point.value), index: idx });
    });

    const outlierIndices = [];
    const dayStats = {};

    // Check each day of week separately
    Object.keys(dayGroups).forEach(day => {
      const dayValues = dayGroups[day].map(item => item.value);
      const dayMean = dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length;
      const dayVariance = dayValues.reduce((sum, val) => sum + Math.pow(val - dayMean, 2), 0) / dayValues.length;
      const dayStdDev = Math.sqrt(dayVariance);

      dayStats[day] = { mean: dayMean, stdDev: dayStdDev };

      // Find outliers within this day of week
      dayGroups[day].forEach(item => {
        if (Math.abs(item.value - dayMean) > 2.5 * dayStdDev) {
          outlierIndices.push(item.index);
        }
      });
    });

    return {
      outlierIndices,
      bounds: { dayStats, method: 'contextual', threshold: 2.5 }
    };
  }

  // Outlier treatment methods
  treatOutliers(timeSeries, outliers, method = 'winsorize') {
    const treated = timeSeries.map(point => ({ ...point }));
    const values = timeSeries.map(point => parseFloat(point.value));

    switch (method) {
      case 'winsorize':
        const p5 = this.percentile(values, 5);
        const p95 = this.percentile(values, 95);
        
        outliers.indices.forEach(idx => {
          const originalValue = values[idx];
          treated[idx].value = Math.max(p5, Math.min(p95, originalValue));
          treated[idx].outlier_treated = true;
          treated[idx].original_value = originalValue;
          treated[idx].treatment_method = 'winsorize';
        });
        break;

      case 'cap':
        if (outliers.bounds && outliers.bounds.lower !== undefined && outliers.bounds.upper !== undefined) {
          outliers.indices.forEach(idx => {
            const originalValue = values[idx];
            treated[idx].value = Math.max(outliers.bounds.lower, Math.min(outliers.bounds.upper, originalValue));
            treated[idx].outlier_treated = true;
            treated[idx].original_value = originalValue;
            treated[idx].treatment_method = 'cap';
          });
        }
        break;

      case 'flag_only':
        outliers.indices.forEach(idx => {
          treated[idx].outlier_flagged = true;
          treated[idx].outlier_method = outliers.method;
        });
        break;

      case 'remove':
        // Return filtered series without outliers
        return treated.filter((_, idx) => !outliers.indices.includes(idx));

      default:
        // No treatment, just flag
        outliers.indices.forEach(idx => {
          treated[idx].outlier_flagged = true;
        });
    }

    return treated;
  }

  // Missing data handling
  imputeMissingValues(timeSeries, method = 'auto') {
    const imputed = [...timeSeries];
    const missingIndices = this.findMissingIndices(timeSeries);

    missingIndices.forEach(({ start, end }) => {
      const gapLength = end - start + 1;
      const imputationMethod = method === 'auto' ? this.selectImputationMethod(gapLength) : method;

      switch (imputationMethod) {
        case 'forward_fill':
          this.forwardFill(imputed, start, end);
          break;
        case 'linear_interpolation':
          this.linearInterpolation(imputed, start, end);
          break;
        case 'seasonal_naive':
          this.seasonalNaive(imputed, start, end, 7); // Weekly seasonality
          break;
        case 'mark_missing':
          // Keep as missing but mark
          for (let i = start; i <= end; i++) {
            imputed[i].missing_imputed = false;
            imputed[i].missing_method = 'not_imputed';
          }
          break;
      }
    });

    return imputed;
  }

  selectImputationMethod(gapLength) {
    if (gapLength <= 3) return 'forward_fill';
    if (gapLength <= 7) return 'linear_interpolation';
    return 'mark_missing';
  }

  forwardFill(series, start, end) {
    const lastValidValue = start > 0 ? series[start - 1].value : null;
    if (lastValidValue !== null) {
      for (let i = start; i <= end; i++) {
        series[i].value = lastValidValue;
        series[i].missing_imputed = true;
        series[i].imputation_method = 'forward_fill';
      }
    }
  }

  linearInterpolation(series, start, end) {
    const beforeValue = start > 0 ? parseFloat(series[start - 1].value) : null;
    const afterValue = end < series.length - 1 ? parseFloat(series[end + 1].value) : null;

    if (beforeValue !== null && afterValue !== null) {
      const gapLength = end - start + 1;
      const step = (afterValue - beforeValue) / (gapLength + 1);

      for (let i = start; i <= end; i++) {
        const position = i - start + 1;
        series[i].value = beforeValue + (step * position);
        series[i].missing_imputed = true;
        series[i].imputation_method = 'linear_interpolation';
      }
    } else {
      // Fall back to forward fill or use mean
      this.forwardFill(series, start, end);
    }
  }

  seasonalNaive(series, start, end, seasonalPeriod = 7) {
    for (let i = start; i <= end; i++) {
      const seasonalIndex = i - seasonalPeriod;
      if (seasonalIndex >= 0 && series[seasonalIndex].value !== null) {
        series[i].value = series[seasonalIndex].value;
        series[i].missing_imputed = true;
        series[i].imputation_method = 'seasonal_naive';
      } else {
        this.forwardFill(series, i, i);
      }
    }
  }

  // Feature generation
  generateLagFeatures(timeSeries, lags = [1, 7, 28]) {
    return timeSeries.map((point, index) => {
      const features = { ...point };
      
      lags.forEach(lag => {
        const lagIndex = index - lag;
        if (lagIndex >= 0) {
          features[`lag_${lag}`] = timeSeries[lagIndex].value;
        } else {
          features[`lag_${lag}`] = null;
        }
      });

      return features;
    });
  }

  generateMovingAverageFeatures(timeSeries, windows = [7, 14, 28]) {
    return timeSeries.map((point, index) => {
      const features = { ...point };
      
      windows.forEach(window => {
        if (index >= window - 1) {
          const windowValues = timeSeries
            .slice(index - window + 1, index + 1)
            .map(p => parseFloat(p.value))
            .filter(v => !isNaN(v));
          
          if (windowValues.length > 0) {
            features[`ma_${window}`] = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
          } else {
            features[`ma_${window}`] = null;
          }
        } else {
          features[`ma_${window}`] = null;
        }
      });

      return features;
    });
  }

  generateSeasonalFeatures(timeSeries) {
    return timeSeries.map(point => {
      const date = new Date(point.date);
      const features = {
        ...point,
        day_of_week: date.getDay(),
        week_of_month: Math.ceil(date.getDate() / 7),
        month_of_year: date.getMonth(),
        quarter: Math.floor(date.getMonth() / 3) + 1,
        is_weekend: [0, 6].includes(date.getDay()),
        is_month_end: this.isLastDayOfMonth(date),
        is_quarter_end: this.isLastDayOfQuarter(date)
      };

      return features;
    });
  }

  // Utility methods
  countMissing(timeSeries) {
    return timeSeries.filter(point => 
      point.value === null || 
      point.value === undefined || 
      point.value === '' ||
      (typeof point.value === 'number' && isNaN(point.value))
    ).length;
  }

  countConsecutiveZeros(timeSeries) {
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    let totalZeros = 0;

    timeSeries.forEach(point => {
      if (parseFloat(point.value) === 0) {
        currentConsecutive++;
        totalZeros++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    });

    return { maxConsecutive, totalZeros };
  }

  assessRecency(timeSeries) {
    if (timeSeries.length === 0) return Infinity;
    
    const lastDate = new Date(timeSeries[timeSeries.length - 1].date);
    const now = new Date();
    const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  }

  findMissingIndices(timeSeries) {
    const missing = [];
    let start = null;

    timeSeries.forEach((point, index) => {
      const isMissing = point.value === null || 
                       point.value === undefined || 
                       point.value === '' ||
                       (typeof point.value === 'number' && isNaN(point.value));

      if (isMissing && start === null) {
        start = index;
      } else if (!isMissing && start !== null) {
        missing.push({ start, end: index - 1 });
        start = null;
      }
    });

    // Handle case where series ends with missing values
    if (start !== null) {
      missing.push({ start, end: timeSeries.length - 1 });
    }

    return missing;
  }

  percentile(values, p) {
    const sorted = [...values].sort((a, _b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  calculateMAD(values) {
    const median = this.percentile(values, 50);
    const deviations = values.map(val => Math.abs(val - median));
    return this.percentile(deviations, 50);
  }

  isLastDayOfMonth(date) {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.getMonth() !== date.getMonth();
  }

  isLastDayOfQuarter(date) {
    const month = date.getMonth();
    const isQuarterEndMonth = [2, 5, 8, 11].includes(month); // Mar, Jun, Sep, Dec
    return isQuarterEndMonth && this.isLastDayOfMonth(date);
  }

  generateRecommendations(qualityMetrics) {
    const recommendations = [];

    if (qualityMetrics.completeness < 0.8) {
      recommendations.push({
        type: 'data_quality',
        priority: 'high',
        message: `${qualityMetrics.missing} missing values detected. Consider data imputation or investigate data source.`
      });
    }

    if (qualityMetrics.recency < 0.5) {
      recommendations.push({
        type: 'data_freshness',
        priority: 'medium',
        message: 'Data appears stale. Check data collection pipeline and update frequency.'
      });
    }

    if (qualityMetrics.zeros.maxConsecutive > this.config.maxConsecutiveZeros) {
      recommendations.push({
        type: 'data_consistency',
        priority: 'medium',
        message: `${qualityMetrics.zeros.maxConsecutive} consecutive zeros detected. Verify if this represents true business conditions.`
      });
    }

    if (qualityMetrics.outliers.count > 0) {
      recommendations.push({
        type: 'outliers',
        priority: 'low',
        message: `${qualityMetrics.outliers.count} outliers detected (${qualityMetrics.outliers.percentage.toFixed(1)}%). Consider outlier treatment before forecasting.`
      });
    }

    return recommendations;
  }
}

export default FeatureEngineeringService;