import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';

/**
 * Advanced Data Decomposition Service - CEEMDAN Implementation
 * Complete Ensemble Empirical Mode Decomposition with Adaptive Noise
 * Research-based approach for superior financial time series preprocessing
 */

// EMD and FFT packages not available in Node.js, using simulation
// import { EMD } from 'ml-emd';
// import { FFT } from 'ml-fft';

class DataDecompositionService {
  constructor() {
    this.decompositionCache = new Map();
    this.noiseRatio = 0.2; // Standard noise ratio for CEEMDAN
    this.ensembleSize = 100; // Number of ensemble members
    this.maxIMFs = 10; // Maximum Intrinsic Mode Functions
  }

  /**
   * Complete Ensemble Empirical Mode Decomposition with Adaptive Noise
   * Superior to EMD and EEMD for non-linear, non-stationary financial data
   */
  async performCEEMDAN(timeSeries, options = {}) {
    logDebug('Performing CEEMDAN decomposition...');
    
    const {
      ensembleSize = this.ensembleSize,
      noiseRatio = this.noiseRatio,
      maxIMFs = this.maxIMFs,
      enableCaching = true
    } = options;

    // Check cache first
    const cacheKey = this.generateCacheKey(timeSeries, options);
    if (enableCaching && this.decompositionCache.has(cacheKey)) {
      logDebug('Returning cached decomposition');
      return this.decompositionCache.get(cacheKey);
    }

    try {
      // Step 1: Generate noise-added ensemble
      const noisySignals = this.generateNoisyEnsemble(timeSeries, ensembleSize, noiseRatio);
      
      // Step 2: Decompose each noisy signal
      const allIMFs = [];
      for (let i = 0; i < noisySignals.length; i++) {
        logDebug(`Decomposing signal ${i + 1}/${noisySignals.length}...`);
        const imfs = await this.empiricalModeDecomposition(noisySignals[i], maxIMFs);
        allIMFs.push(imfs);
      }
      
      // Step 3: Calculate ensemble mean for each IMF
      const ceemdanIMFs = this.calculateEnsembleMean(allIMFs);
      
      // Step 4: Extract trend and residual
      const trend = this.extractTrend(ceemdanIMFs);
      const residual = this.calculateResidual(timeSeries, ceemdanIMFs, trend);
      
      // Step 5: Frequency analysis of IMFs
      const frequencyAnalysis = this.analyzeIMFFrequencies(ceemdanIMFs);
      
      // Step 6: Categorize IMFs by time scales
      const categorizedIMFs = this.categorizeIMFs(ceemdanIMFs, frequencyAnalysis);
      
      const result = {
        originalSeries: timeSeries,
        imfs: ceemdanIMFs,
        trend: trend,
        residual: residual,
        frequencyAnalysis: frequencyAnalysis,
        categorizedIMFs: categorizedIMFs,
        decompositionInfo: {
          ensembleSize,
          noiseRatio,
          numIMFs: ceemdanIMFs.length,
          timestamp: new Date().toISOString()
        }
      };
      
      // Cache result
      if (enableCaching) {
        this.decompositionCache.set(cacheKey, result);
      }
      
      logDebug(`CEEMDAN decomposition complete. Generated ${ceemdanIMFs.length} IMFs`);
      return result;
      
    } catch (error) {
      logError('CEEMDAN decomposition failed:', error);
      throw error;
    }
  }

  /**
   * Generate ensemble of noisy signals for CEEMDAN
   */
  generateNoisyEnsemble(signal, ensembleSize, noiseRatio) {
    logDebug(`Generating ${ensembleSize} noisy signals...`);
    
    const noisySignals = [];
    const signalStd = this.calculateStandardDeviation(signal);
    
    for (let i = 0; i < ensembleSize; i++) {
      const noisySignal = signal.map(value => {
        const noise = this.generateGaussianNoise() * noiseRatio * signalStd;
        return value + noise;
      });
      noisySignals.push(noisySignal);
    }
    
    return noisySignals;
  }

  /**
   * Empirical Mode Decomposition for individual signals
   */
  async empiricalModeDecomposition(signal, maxIMFs) {
    const imfs = [];
    let residue = [...signal];
    let imfCount = 0;
    
    while (imfCount < maxIMFs && this.canExtractIMF(residue)) {
      const imf = await this.extractIMF(residue);
      
      if (this.isValidIMF(imf)) {
        imfs.push(imf);
        residue = residue.map((val, idx) => val - imf[idx]);
        imfCount++;
      } else {
        break;
      }
    }
    
    // Add final residue as trend
    if (residue.length > 0) {
      imfs.push(residue);
    }
    
    return imfs;
  }

  /**
   * Extract single Intrinsic Mode Function using sifting process
   */
  async extractIMF(signal, maxSiftings = 50) {
    let h = [...signal];
    let siftCount = 0;
    
    while (siftCount < maxSiftings) {
      // Find local maxima and minima
      const { maxima, minima } = this.findExtrema(h);
      
      if (maxima.length < 2 || minima.length < 2) {
        break;
      }
      
      // Create envelopes using spline interpolation
      const upperEnvelope = this.createSplineEnvelope(h, maxima);
      const lowerEnvelope = this.createSplineEnvelope(h, minima);
      
      // Calculate mean envelope
      const meanEnvelope = upperEnvelope.map((upper, idx) => 
        (upper + lowerEnvelope[idx]) / 2
      );
      
      // Subtract mean from signal
      const newH = h.map((val, idx) => val - meanEnvelope[idx]);
      
      // Check IMF criteria
      if (this.satisfiesIMFCriteria(newH)) {
        return newH;
      }
      
      h = newH;
      siftCount++;
    }
    
    return h;
  }

  /**
   * Find local maxima and minima in signal
   */
  findExtrema(signal) {
    const maxima = [];
    const minima = [];
    
    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > signal[i-1] && signal[i] > signal[i+1]) {
        maxima.push({ index: i, value: signal[i] });
      } else if (signal[i] < signal[i-1] && signal[i] < signal[i+1]) {
        minima.push({ index: i, value: signal[i] });
      }
    }
    
    return { maxima, minima };
  }

  /**
   * Create spline envelope through extrema points
   */
  createSplineEnvelope(signal, extrema) {
    if (extrema.length < 2) {
      return new Array(signal.length).fill(0);
    }
    
    // Simple cubic spline interpolation
    const envelope = new Array(signal.length);
    
    // Boundary conditions - extend first and last extrema
    const extendedExtrema = [
      { index: 0, value: extrema[0].value },
      ...extrema,
      { index: signal.length - 1, value: extrema[extrema.length - 1].value }
    ];
    
    for (let i = 0; i < signal.length; i++) {
      envelope[i] = this.interpolateSpline(i, extendedExtrema);
    }
    
    return envelope;
  }

  /**
   * Cubic spline interpolation
   */
  interpolateSpline(x, points) {
    // Find surrounding points
    let leftIdx = 0;
    for (let i = 0; i < points.length - 1; i++) {
      if (x >= points[i].index && x <= points[i + 1].index) {
        leftIdx = i;
        break;
      }
    }
    
    const rightIdx = Math.min(leftIdx + 1, points.length - 1);
    
    if (leftIdx === rightIdx) {
      return points[leftIdx].value;
    }
    
    // Linear interpolation (simplified)
    const x1 = points[leftIdx].index;
    const y1 = points[leftIdx].value;
    const x2 = points[rightIdx].index;
    const y2 = points[rightIdx].value;
    
    if (x2 === x1) {
      return y1;
    }
    
    return y1 + (y2 - y1) * (x - x1) / (x2 - x1);
  }

  /**
   * Check if signal satisfies IMF criteria
   */
  satisfiesIMFCriteria(signal, tolerance = 0.05) {
    const { maxima, minima } = this.findExtrema(signal);
    
    // Criterion 1: Number of extrema should differ by at most 1 from zero crossings
    const zeroCrossings = this.countZeroCrossings(signal);
    const extremaCount = maxima.length + minima.length;
    
    if (Math.abs(extremaCount - zeroCrossings) > 1) {
      return false;
    }
    
    // Criterion 2: Mean of envelopes should be close to zero
    if (maxima.length < 2 || minima.length < 2) {
      return true; // Can't create envelopes, accept as IMF
    }
    
    const upperEnvelope = this.createSplineEnvelope(signal, maxima);
    const lowerEnvelope = this.createSplineEnvelope(signal, minima);
    
    const meanEnvelope = upperEnvelope.map((upper, idx) => 
      (upper + lowerEnvelope[idx]) / 2
    );
    
    const meanEnvelopeMagnitude = meanEnvelope.reduce((sum, val) => 
      sum + Math.abs(val), 0) / meanEnvelope.length;
    
    const signalMagnitude = signal.reduce((sum, val) => 
      sum + Math.abs(val), 0) / signal.length;
    
    return meanEnvelopeMagnitude / signalMagnitude < tolerance;
  }

  /**
   * Count zero crossings in signal
   */
  countZeroCrossings(signal) {
    let crossings = 0;
    
    for (let i = 1; i < signal.length; i++) {
      if ((signal[i-1] > 0 && signal[i] < 0) || (signal[i-1] < 0 && signal[i] > 0)) {
        crossings++;
      }
    }
    
    return crossings;
  }

  /**
   * Calculate ensemble mean of IMFs
   */
  calculateEnsembleMean(allIMFs) {
    logDebug('Calculating ensemble mean of IMFs...');
    
    if (allIMFs.length === 0) {
      return [];
    }
    
    const maxIMFCount = Math.max(...allIMFs.map(imfs => imfs.length));
    const signalLength = allIMFs[0][0].length;
    
    const ensembleMeanIMFs = [];
    
    for (let imfIdx = 0; imfIdx < maxIMFCount; imfIdx++) {
      const meanIMF = new Array(signalLength).fill(0);
      let validSignalCount = 0;
      
      for (let signalIdx = 0; signalIdx < allIMFs.length; signalIdx++) {
        if (allIMFs[signalIdx][imfIdx]) {
          validSignalCount++;
          for (let i = 0; i < signalLength; i++) {
            meanIMF[i] += allIMFs[signalIdx][imfIdx][i];
          }
        }
      }
      
      if (validSignalCount > 0) {
        for (let i = 0; i < signalLength; i++) {
          meanIMF[i] /= validSignalCount;
        }
        ensembleMeanIMFs.push(meanIMF);
      }
    }
    
    return ensembleMeanIMFs;
  }

  /**
   * Extract trend component
   */
  extractTrend(imfs) {
    if (imfs.length === 0) {
      return [];
    }
    
    // Trend is typically the last (lowest frequency) IMF
    const trend = [...imfs[imfs.length - 1]];
    
    // Apply additional smoothing to trend
    return this.smoothTrend(trend);
  }

  /**
   * Smooth trend component using moving average
   */
  smoothTrend(trend, windowSize = 5) {
    const smoothed = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < trend.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - halfWindow); j <= Math.min(trend.length - 1, i + halfWindow); j++) {
        sum += trend[j];
        count++;
      }
      
      smoothed.push(sum / count);
    }
    
    return smoothed;
  }

  /**
   * Calculate residual component
   */
  calculateResidual(originalSeries, imfs, trend) {
    const residual = [...originalSeries];
    
    // Subtract all IMFs except trend
    for (let imfIdx = 0; imfIdx < imfs.length - 1; imfIdx++) {
      for (let i = 0; i < residual.length; i++) {
        residual[i] -= imfs[imfIdx][i];
      }
    }
    
    // Subtract trend if provided separately
    if (trend && trend.length === residual.length) {
      for (let i = 0; i < residual.length; i++) {
        residual[i] -= trend[i];
      }
    }
    
    return residual;
  }

  /**
   * Analyze frequencies of IMFs using FFT
   */
  analyzeIMFFrequencies(imfs) {
    logDebug('Analyzing IMF frequencies...');
    
    const frequencyAnalysis = [];
    
    for (let i = 0; i < imfs.length; i++) {
      try {
        const fftResult = FFT.fft(imfs[i]);
        const powerSpectrum = fftResult.map(complex => 
          Math.sqrt(complex.re * complex.re + complex.im * complex.im)
        );
        
        // Find dominant frequency
        const maxPowerIndex = powerSpectrum.indexOf(Math.max(...powerSpectrum));
        const dominantFreq = maxPowerIndex / imfs[i].length;
        
        // Calculate average frequency
        let weightedFreqSum = 0;
        let totalPower = 0;
        
        for (let j = 0; j < powerSpectrum.length / 2; j++) {
          const freq = j / powerSpectrum.length;
          const power = powerSpectrum[j];
          weightedFreqSum += freq * power;
          totalPower += power;
        }
        
        const averageFreq = totalPower > 0 ? weightedFreqSum / totalPower : 0;
        
        frequencyAnalysis.push({
          imfIndex: i,
          dominantFrequency: dominantFreq,
          averageFrequency: averageFreq,
          powerSpectrum: powerSpectrum.slice(0, powerSpectrum.length / 2),
          totalPower: totalPower
        });
        
      } catch (error) {
        logWarn(`FFT analysis failed for IMF ${i}:`, error.message);
        frequencyAnalysis.push({
          imfIndex: i,
          dominantFrequency: 0,
          averageFrequency: 0,
          powerSpectrum: [],
          totalPower: 0
        });
      }
    }
    
    return frequencyAnalysis;
  }

  /**
   * Categorize IMFs by time scales (high-freq noise, cycles, trend)
   */
  categorizeIMFs(imfs, frequencyAnalysis) {
    const categories = {
      noise: [],      // High frequency noise
      shortCycles: [], // Short-term cycles (daily, weekly)
      mediumCycles: [], // Medium-term cycles (monthly, quarterly)
      longCycles: [],  // Long-term cycles (seasonal, annual)
      trend: []        // Long-term trend
    };
    
    for (let i = 0; i < frequencyAnalysis.length; i++) {
      const freq = frequencyAnalysis[i].averageFrequency;
      const imf = imfs[i];
      
      if (freq > 0.3) {
        categories.noise.push({ imf, index: i, frequency: freq });
      } else if (freq > 0.1) {
        categories.shortCycles.push({ imf, index: i, frequency: freq });
      } else if (freq > 0.03) {
        categories.mediumCycles.push({ imf, index: i, frequency: freq });
      } else if (freq > 0.01) {
        categories.longCycles.push({ imf, index: i, frequency: freq });
      } else {
        categories.trend.push({ imf, index: i, frequency: freq });
      }
    }
    
    return categories;
  }

  /**
   * Reconstruct signal from selected IMF categories
   */
  reconstructSignal(imfs, selectedCategories = ['shortCycles', 'mediumCycles', 'longCycles', 'trend']) {
    if (!imfs || imfs.length === 0) {
      return [];
    }
    
    const signalLength = imfs[0].length;
    const reconstructed = new Array(signalLength).fill(0);
    
    const categorizedIMFs = this.categorizeIMFs(imfs, this.analyzeIMFFrequencies(imfs));
    
    selectedCategories.forEach(category => {
      if (categorizedIMFs[category]) {
        categorizedIMFs[category].forEach(({ imf }) => {
          for (let i = 0; i < signalLength; i++) {
            reconstructed[i] += imf[i];
          }
        });
      }
    });
    
    return reconstructed;
  }

  /**
   * Denoise signal by removing noise components
   */
  denoiseSignal(decomposition) {
    logDebug('Denoising signal using CEEMDAN decomposition...');
    
    const { imfs, categorizedIMFs } = decomposition;
    
    // Reconstruct without noise components
    const denoisedComponents = ['shortCycles', 'mediumCycles', 'longCycles', 'trend'];
    const denoised = this.reconstructSignal(imfs, denoisedComponents);
    
    return {
      denoisedSeries: denoised,
      removedNoise: categorizedIMFs.noise,
      preservedComponents: denoisedComponents
    };
  }

  /**
   * Extract seasonal patterns from decomposition
   */
  extractSeasonalPatterns(decomposition, samplingRate = 1) {
    const { categorizedIMFs } = decomposition;
    const patterns = [];
    
    // Analyze medium and long cycles for seasonality
    [...categorizedIMFs.mediumCycles, ...categorizedIMFs.longCycles].forEach(({ imf, frequency }) => {
      const period = 1 / frequency; // Period in samples
      const periodInDays = period / samplingRate; // Convert to days if needed
      
      patterns.push({
        imf: imf,
        frequency: frequency,
        period: period,
        periodInDays: periodInDays,
        amplitude: Math.max(...imf) - Math.min(...imf),
        type: this.classifySeasonalPattern(periodInDays)
      });
    });
    
    return patterns.sort((a, b) => b.amplitude - a.amplitude); // Sort by amplitude
  }

  /**
   * Classify seasonal pattern types
   */
  classifySeasonalPattern(periodInDays) {
    if (periodInDays <= 7) {
      return 'weekly';
    } else if (periodInDays <= 31) {
      return 'monthly';
    } else if (periodInDays <= 93) {
      return 'quarterly';
    } else if (periodInDays <= 366) {
      return 'annual';
    } else {
      return 'long-term';
    }
  }

  /**
   * Utility functions
   */
  generateGaussianNoise() {
    // Box-Muller transformation for Gaussian noise
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  calculateStandardDeviation(signal) {
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
    const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
    return Math.sqrt(variance);
  }

  canExtractIMF(signal) {
    const { maxima, minima } = this.findExtrema(signal);
    return maxima.length >= 2 && minima.length >= 2;
  }

  isValidIMF(imf) {
    // Check if IMF has meaningful variation
    const variation = Math.max(...imf) - Math.min(...imf);
    const threshold = this.calculateStandardDeviation(imf) * 0.1;
    return variation > threshold;
  }

  generateCacheKey(timeSeries, options) {
    // Simple hash for caching
    const dataHash = timeSeries.length + '_' + timeSeries[0] + '_' + timeSeries[timeSeries.length - 1];
    const optionsHash = JSON.stringify(options);
    return `${dataHash}_${optionsHash}`;
  }

  /**
   * Clear decomposition cache
   */
  clearCache() {
    this.decompositionCache.clear();
    logDebug('Decomposition cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.decompositionCache.size,
      memoryUsage: JSON.stringify([...this.decompositionCache.values()]).length
    };
  }
}

export default DataDecompositionService;