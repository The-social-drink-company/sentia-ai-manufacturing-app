class LinearRegressionModel {
  constructor(options = {}) {
    this.lagOrder = options.lagOrder || 7;
    this.movingAverageWindows = options.movingAverageWindows || [7, 14, 28];
    this.includeSeasonal = options.includeSeasonal !== false;
    this.regularization = options.regularization || 0.01;
    
    this.coefficients = null;
    this.intercept = null;
    this.timeSeries = null;
    this.fitted = false;
    this.featureNames = [];
  }

  async fit(timeSeries) {
    this.timeSeries = timeSeries.map(point => ({
      date: new Date(point.date),
      value: parseFloat(point.value)
    }));

    // Generate feature matrix and target vector
    const { X, y } = this.prepareTrainingData();
    
    if (X.length === 0 || y.length === 0) {
      throw new Error('Insufficient data to create features for linear regression');
    }

    // Fit linear regression with regularization (Ridge regression)
    this.fitLinearRegression(X, y);
    
    this.fitted = true;
    return this;
  }

  prepareTrainingData() {
    const n = this.timeSeries.length;
    const values = this.timeSeries.map(point => point.value);
    const dates = this.timeSeries.map(point => point.date);
    
    const X = [];
    const y = [];
    this.featureNames = [];
    
    // Start from max lag to ensure all features are available
    const startIndex = Math.max(this.lagOrder, Math.max(...this.movingAverageWindows));
    
    for (let i = startIndex; i < n; i++) {
      const features = [];
      
      // Lag features
      for (let lag = 1; lag <= this.lagOrder; lag++) {
        if (i - lag >= 0) {
          features.push(values[i - lag]);
          if (i === startIndex) this.featureNames.push(`lag_${lag}`);
        }
      }
      
      // Moving average features
      this.movingAverageWindows.forEach(window => {
        if (i >= window) {
          const ma = values.slice(i - window, i).reduce((sum, val) => sum + val, 0) / window;
          features.push(ma);
          if (i === startIndex) this.featureNames.push(`ma_${window}`);
        }
      });
      
      // Seasonal features (if enabled)
      if (this.includeSeasonal) {
        const dayOfWeek = dates[i].getDay();
        const monthOfYear = dates[i].getMonth();
        
        // Day of week dummy variables (0-6)
        for (let dow = 0; dow < 7; dow++) {
          features.push(dayOfWeek === dow ? 1 : 0);
          if (i === startIndex) this.featureNames.push(`dow_${dow}`);
        }
        
        // Month dummy variables (0-11)
        for (let month = 0; month < 12; month++) {
          features.push(monthOfYear === month ? 1 : 0);
          if (i === startIndex) this.featureNames.push(`month_${month}`);
        }
      }
      
      // Add time trend
      features.push(i / n); // Normalized time trend
      if (i === startIndex) this.featureNames.push('time_trend');
      
      X.push(features);
      y.push(values[i]);
    }
    
    return { X, y };
  }

  fitLinearRegression(X, y) {
    if (X.length === 0 || X[0].length === 0) {
      throw new Error('Empty feature matrix');
    }

    const m = X.length; // Number of samples
    const n = X[0].length; // Number of features
    
    // Add intercept column to X
    const X_with_intercept = X.map(row => [1, ...row]);
    
    // Solve using normal equation with regularization: (X^T X + λI)^(-1) X^T y
    const XTX = this.matrixMultiply(this.transpose(X_with_intercept), X_with_intercept);
    
    // Add regularization to diagonal (except intercept)
    for (let i = 1; i < XTX.length; i++) {
      XTX[i][i] += this.regularization;
    }
    
    const XTy = this.matrixVectorMultiply(this.transpose(X_with_intercept), y);
    
    // Solve linear system
    const coefficients = this.solveLinearSystem(XTX, XTy);
    
    this.intercept = coefficients[0];
    this.coefficients = coefficients.slice(1);
  }

  async forecast(horizon) {
    if (!this.fitted) {
      throw new Error('Model must be fitted before forecasting');
    }

    const forecasts = [];
    const values = [...this.timeSeries.map(point => point.value)];
    const lastDate = new Date(this.timeSeries[this.timeSeries.length - 1].date);
    
    for (let h = 1; h <= horizon; h++) {
      // Generate features for forecast step h
      const currentIndex = this.timeSeries.length + h - 1;
      const features = [];
      
      // Lag features
      for (let lag = 1; lag <= this.lagOrder; lag++) {
        const lagIndex = values.length - lag;
        if (lagIndex >= 0) {
          features.push(values[lagIndex]);
        } else {
          features.push(0); // Fallback for insufficient history
        }
      }
      
      // Moving average features
      this.movingAverageWindows.forEach(window => {
        const start = Math.max(0, values.length - window);
        const ma = values.slice(start).reduce((sum, val) => sum + val, 0) / (values.length - start);
        features.push(ma);
      });
      
      // Seasonal features
      if (this.includeSeasonal) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(forecastDate.getDate() + h);
        
        const dayOfWeek = forecastDate.getDay();
        const monthOfYear = forecastDate.getMonth();
        
        // Day of week dummy variables
        for (let dow = 0; dow < 7; dow++) {
          features.push(dayOfWeek === dow ? 1 : 0);
        }
        
        // Month dummy variables
        for (let month = 0; month < 12; month++) {
          features.push(monthOfYear === month ? 1 : 0);
        }
      }
      
      // Time trend
      const normalizedTime = currentIndex / (this.timeSeries.length + horizon);
      features.push(normalizedTime);
      
      // Make prediction
      let prediction = this.intercept;
      for (let i = 0; i < this.coefficients.length && i < features.length; i++) {
        prediction += this.coefficients[i] * features[i];
      }
      
      prediction = Math.max(0, prediction); // Ensure non-negative
      forecasts.push(prediction);
      values.push(prediction); // Use prediction as input for next step
    }
    
    return forecasts;
  }

  // Matrix operations helper methods
  transpose(matrix) {
    return matrix[0].map((_, _colIndex) => matrix.map(row => row[colIndex]));
  }

  matrixMultiply(A, B) {
    const result = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < B[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < B.length; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  matrixVectorMultiply(matrix, vector) {
    return matrix.map(row => 
      row.reduce((sum, val, i) => sum + val * vector[i], 0)
    );
  }

  solveLinearSystem(A, b) {
    // Simple Gaussian elimination with partial pivoting
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);
    
    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // Make diagonal element 1
      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-10) {
        throw new Error('Matrix is singular');
      }
      
      for (let j = i; j <= n; j++) {
        augmented[i][j] /= pivot;
      }
      
      // Eliminate column
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
    
    // Back substitution
    const solution = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      solution[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        solution[i] -= augmented[i][j] * solution[j];
      }
    }
    
    return solution;
  }

  getParameters() {
    return {
      lagOrder: this.lagOrder,
      movingAverageWindows: this.movingAverageWindows,
      includeSeasonal: this.includeSeasonal,
      regularization: this.regularization,
      type: 'LinearRegression'
    };
  }

  getDiagnostics() {
    return {
      coefficients: this.coefficients ? [...this.coefficients] : null,
      intercept: this.intercept,
      featureNames: [...this.featureNames],
      parameters: this.getParameters()
    };
  }
}

export default LinearRegressionModel;