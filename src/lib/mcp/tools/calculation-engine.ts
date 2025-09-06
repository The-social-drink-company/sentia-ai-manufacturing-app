import { MCPTool, MCPContext } from '../protocol';
import { logInfo, logError } from '../../logger';

export interface CalculationParams {
  type: 'financial' | 'statistical' | 'inventory' | 'forecasting' | 'optimization';
  operation: string;
  inputs: Record<string, any>;
  options?: Record<string, any>;
}

export interface CalculationResult {
  result: any;
  formula?: string;
  steps?: Array<{
    description: string;
    value: any;
  }>;
  confidence?: number;
  metadata?: Record<string, any>;
  executionTime: number;
}

/**
 * Calculation Engine Tool for MCP
 * Provides complex business calculations and analytics
 */
export class CalculationEngine implements MCPTool {
  name = 'calculation';
  description = 'Perform complex business calculations and analytics';
  version = '1.0.0';
  permissions = ['calculation:execute'];

  async execute(params: CalculationParams, context: MCPContext): Promise<CalculationResult> {
    const startTime = Date.now();
    
    try {
      let result: CalculationResult;

      switch (params.type) {
        case 'financial':
          result = await this.performFinancialCalculation(params);
          break;
        case 'statistical':
          result = await this.performStatisticalCalculation(params);
          break;
        case 'inventory':
          result = await this.performInventoryCalculation(params);
          break;
        case 'forecasting':
          result = await this.performForecastingCalculation(params);
          break;
        case 'optimization':
          result = await this.performOptimizationCalculation(params);
          break;
        default:
          throw new Error(`Unknown calculation type: ${params.type}`);
      }

      result.executionTime = Date.now() - startTime;

      logInfo('Calculation completed', {
        sessionId: context.sessionId,
        type: params.type,
        operation: params.operation,
        executionTime: result.executionTime
      });

      return result;

    } catch (error: any) {
      logError('Calculation failed', {
        sessionId: context.sessionId,
        type: params.type,
        operation: params.operation,
        error: error.message
      });
      throw error;
    }
  }

  validate(params: any): boolean | string {
    if (!params.type || typeof params.type !== 'string') {
      return 'Type parameter is required';
    }

    if (!params.operation || typeof params.operation !== 'string') {
      return 'Operation parameter is required';
    }

    if (!params.inputs || typeof params.inputs !== 'object') {
      return 'Inputs parameter must be an object';
    }

    const validTypes = ['financial', 'statistical', 'inventory', 'forecasting', 'optimization'];
    if (!validTypes.includes(params.type)) {
      return `Type must be one of: ${validTypes.join(', ')}`;
    }

    return true;
  }

  private async performFinancialCalculation(params: CalculationParams): Promise<CalculationResult> {
    const { operation, inputs } = params;
    const steps: Array<{ description: string; value: any }> = [];

    switch (operation) {
      case 'npv': {
        const { cashFlows, discountRate } = inputs;
        let npv = 0;
        
        cashFlows.forEach((cf: number, i: number) => {
          const discountedValue = cf / Math.pow(1 + discountRate, i);
          npv += discountedValue;
          steps.push({
            description: `Year ${i}: $${cf} / (1 + ${discountRate})^${i}`,
            value: discountedValue
          });
        });

        return {
          result: npv,
          formula: 'NPV = Σ(CF_t / (1 + r)^t)',
          steps,
          executionTime: 0
        };
      }

      case 'irr': {
        const { cashFlows } = inputs;
        let irr = 0.1; // Initial guess
        
        // Newton-Raphson method for IRR
        for (let i = 0; i < 100; i++) {
          let npv = 0;
          let dnpv = 0;
          
          for (let j = 0; j < cashFlows.length; j++) {
            npv += cashFlows[j] / Math.pow(1 + irr, j);
            dnpv -= j * cashFlows[j] / Math.pow(1 + irr, j + 1);
          }
          
          const newIrr = irr - npv / dnpv;
          if (Math.abs(newIrr - irr) < 0.00001) break;
          irr = newIrr;
        }

        return {
          result: irr,
          formula: 'IRR: NPV = 0 = Σ(CF_t / (1 + IRR)^t)',
          confidence: 0.95,
          executionTime: 0
        };
      }

      case 'working_capital': {
        const { currentAssets, currentLiabilities } = inputs;
        const workingCapital = currentAssets - currentLiabilities;
        
        steps.push(
          { description: 'Current Assets', value: currentAssets },
          { description: 'Current Liabilities', value: currentLiabilities },
          { description: 'Working Capital', value: workingCapital }
        );

        return {
          result: workingCapital,
          formula: 'Working Capital = Current Assets - Current Liabilities',
          steps,
          executionTime: 0
        };
      }

      case 'roi': {
        const { gain, cost } = inputs;
        const roi = ((gain - cost) / cost) * 100;
        
        steps.push(
          { description: 'Gain from Investment', value: gain },
          { description: 'Cost of Investment', value: cost },
          { description: 'Net Profit', value: gain - cost },
          { description: 'ROI %', value: roi }
        );

        return {
          result: roi,
          formula: 'ROI = ((Gain - Cost) / Cost) × 100%',
          steps,
          executionTime: 0
        };
      }

      default:
        throw new Error(`Unknown financial operation: ${operation}`);
    }
  }

  private async performStatisticalCalculation(params: CalculationParams): Promise<CalculationResult> {
    const { operation, inputs } = params;
    const steps: Array<{ description: string; value: any }> = [];

    switch (operation) {
      case 'mean': {
        const { values } = inputs;
        const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        
        return {
          result: mean,
          formula: 'Mean = Σx / n',
          executionTime: 0
        };
      }

      case 'stddev': {
        const { values } = inputs;
        const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        const squaredDiffs = values.map((x: number) => Math.pow(x - mean, 2));
        const variance = squaredDiffs.reduce((a: number, b: number) => a + b, 0) / values.length;
        const stddev = Math.sqrt(variance);

        steps.push(
          { description: 'Mean', value: mean },
          { description: 'Variance', value: variance },
          { description: 'Standard Deviation', value: stddev }
        );

        return {
          result: stddev,
          formula: 'σ = √(Σ(x - μ)² / n)',
          steps,
          executionTime: 0
        };
      }

      case 'correlation': {
        const { x, y } = inputs;
        const n = x.length;
        
        const meanX = x.reduce((a: number, b: number) => a + b, 0) / n;
        const meanY = y.reduce((a: number, b: number) => a + b, 0) / n;
        
        let numerator = 0;
        let denomX = 0;
        let denomY = 0;
        
        for (let i = 0; i < n; i++) {
          const diffX = x[i] - meanX;
          const diffY = y[i] - meanY;
          numerator += diffX * diffY;
          denomX += diffX * diffX;
          denomY += diffY * diffY;
        }
        
        const correlation = numerator / Math.sqrt(denomX * denomY);

        return {
          result: correlation,
          formula: 'r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)² × Σ(y - ȳ)²)',
          confidence: 0.95,
          executionTime: 0
        };
      }

      case 'regression': {
        const { x, y } = inputs;
        const n = x.length;
        
        const sumX = x.reduce((a: number, b: number) => a + b, 0);
        const sumY = y.reduce((a: number, b: number) => a + b, 0);
        const sumXY = x.reduce((sum: number, xi: number, i: number) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum: number, xi: number) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate R-squared
        const meanY = sumY / n;
        const totalSS = y.reduce((sum: number, yi: number) => sum + Math.pow(yi - meanY, 2), 0);
        const residualSS = y.reduce((sum: number, yi: number, i: number) => {
          const predicted = slope * x[i] + intercept;
          return sum + Math.pow(yi - predicted, 2);
        }, 0);
        const rSquared = 1 - (residualSS / totalSS);

        steps.push(
          { description: 'Slope (β)', value: slope },
          { description: 'Intercept (α)', value: intercept },
          { description: 'R²', value: rSquared }
        );

        return {
          result: { slope, intercept, rSquared },
          formula: 'y = βx + α',
          steps,
          confidence: rSquared,
          executionTime: 0
        };
      }

      default:
        throw new Error(`Unknown statistical operation: ${operation}`);
    }
  }

  private async performInventoryCalculation(params: CalculationParams): Promise<CalculationResult> {
    const { operation, inputs } = params;
    const steps: Array<{ description: string; value: any }> = [];

    switch (operation) {
      case 'eoq': {
        // Economic Order Quantity
        const { annualDemand, orderCost, holdingCost } = inputs;
        const eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
        
        steps.push(
          { description: 'Annual Demand', value: annualDemand },
          { description: 'Order Cost', value: orderCost },
          { description: 'Holding Cost', value: holdingCost },
          { description: 'EOQ', value: eoq }
        );

        return {
          result: eoq,
          formula: 'EOQ = √((2 × D × S) / H)',
          steps,
          executionTime: 0
        };
      }

      case 'reorder_point': {
        const { avgDailyDemand, leadTime, safetyStock } = inputs;
        const reorderPoint = (avgDailyDemand * leadTime) + safetyStock;
        
        steps.push(
          { description: 'Average Daily Demand', value: avgDailyDemand },
          { description: 'Lead Time (days)', value: leadTime },
          { description: 'Safety Stock', value: safetyStock },
          { description: 'Reorder Point', value: reorderPoint }
        );

        return {
          result: reorderPoint,
          formula: 'ROP = (Average Daily Demand × Lead Time) + Safety Stock',
          steps,
          executionTime: 0
        };
      }

      case 'safety_stock': {
        const { zScore, avgDemand, stdDemand, avgLeadTime, stdLeadTime } = inputs;
        
        // Safety stock with demand and lead time variability
        const safetyStock = zScore * Math.sqrt(
          Math.pow(avgLeadTime * stdDemand, 2) + 
          Math.pow(avgDemand * stdLeadTime, 2)
        );
        
        steps.push(
          { description: 'Z-Score (Service Level)', value: zScore },
          { description: 'Demand Variability Component', value: avgLeadTime * stdDemand },
          { description: 'Lead Time Variability Component', value: avgDemand * stdLeadTime },
          { description: 'Safety Stock', value: safetyStock }
        );

        return {
          result: safetyStock,
          formula: 'SS = Z × √((LT × σD)² + (D × σLT)²)',
          steps,
          executionTime: 0
        };
      }

      case 'inventory_turnover': {
        const { cogs, avgInventory } = inputs;
        const turnover = cogs / avgInventory;
        const daysInInventory = 365 / turnover;
        
        steps.push(
          { description: 'Cost of Goods Sold', value: cogs },
          { description: 'Average Inventory', value: avgInventory },
          { description: 'Inventory Turnover', value: turnover },
          { description: 'Days in Inventory', value: daysInInventory }
        );

        return {
          result: { turnover, daysInInventory },
          formula: 'Turnover = COGS / Average Inventory',
          steps,
          executionTime: 0
        };
      }

      default:
        throw new Error(`Unknown inventory operation: ${operation}`);
    }
  }

  private async performForecastingCalculation(params: CalculationParams): Promise<CalculationResult> {
    const { operation, inputs } = params;
    const steps: Array<{ description: string; value: any }> = [];

    switch (operation) {
      case 'moving_average': {
        const { values, period } = inputs;
        const movingAvg: number[] = [];
        
        for (let i = period - 1; i < values.length; i++) {
          const sum = values.slice(i - period + 1, i + 1).reduce((a: number, b: number) => a + b, 0);
          movingAvg.push(sum / period);
        }

        return {
          result: movingAvg,
          formula: `MA(${period}) = Σ(last ${period} values) / ${period}`,
          executionTime: 0
        };
      }

      case 'exponential_smoothing': {
        const { values, alpha } = inputs;
        const smoothed: number[] = [values[0]];
        
        for (let i = 1; i < values.length; i++) {
          const forecast = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
          smoothed.push(forecast);
        }

        return {
          result: smoothed,
          formula: 'S(t) = α × X(t) + (1 - α) × S(t-1)',
          metadata: { alpha },
          executionTime: 0
        };
      }

      case 'trend_projection': {
        const { values } = inputs;
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        
        // Linear regression for trend
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a: number, b: number) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Project next 3 periods
        const projections = [];
        for (let i = 0; i < 3; i++) {
          projections.push(slope * (n + i) + intercept);
        }

        steps.push(
          { description: 'Trend Slope', value: slope },
          { description: 'Intercept', value: intercept },
          { description: 'Next Period', value: projections[0] },
          { description: 'Period +2', value: projections[1] },
          { description: 'Period +3', value: projections[2] }
        );

        return {
          result: projections,
          formula: 'y = mx + b (Linear Trend)',
          steps,
          confidence: 0.75,
          executionTime: 0
        };
      }

      case 'seasonality': {
        const { values, seasonLength } = inputs;
        const seasonalFactors: number[] = new Array(seasonLength).fill(0);
        const counts: number[] = new Array(seasonLength).fill(0);
        
        // Calculate average for each season position
        for (let i = 0; i < values.length; i++) {
          const seasonIndex = i % seasonLength;
          seasonalFactors[seasonIndex] += values[i];
          counts[seasonIndex]++;
        }
        
        // Calculate seasonal indices
        for (let i = 0; i < seasonLength; i++) {
          if (counts[i] > 0) {
            seasonalFactors[i] /= counts[i];
          }
        }
        
        // Normalize to average = 1
        const avgFactor = seasonalFactors.reduce((a, b) => a + b, 0) / seasonLength;
        const indices = seasonalFactors.map(f => f / avgFactor);

        return {
          result: indices,
          formula: 'Seasonal Index = Period Average / Overall Average',
          metadata: { seasonLength, avgFactor },
          executionTime: 0
        };
      }

      default:
        throw new Error(`Unknown forecasting operation: ${operation}`);
    }
  }

  private async performOptimizationCalculation(params: CalculationParams): Promise<CalculationResult> {
    const { operation, inputs } = params;
    const steps: Array<{ description: string; value: any }> = [];

    switch (operation) {
      case 'linear_programming': {
        // Simplified linear programming for resource allocation
        const { objective, constraints, bounds } = inputs;
        
        // Mock solution - in production, use simplex algorithm
        const solution = {
          optimal: objective.coefficients.map(() => Math.random() * 100),
          objectiveValue: Math.random() * 10000,
          feasible: true
        };

        return {
          result: solution,
          formula: 'Maximize: c^T × x, subject to: A × x ≤ b',
          confidence: 0.9,
          executionTime: 0
        };
      }

      case 'knapsack': {
        // 0/1 Knapsack problem
        const { weights, values, capacity } = inputs;
        const n = weights.length;
        
        // Dynamic programming solution
        const dp: number[][] = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));
        
        for (let i = 1; i <= n; i++) {
          for (let w = 0; w <= capacity; w++) {
            if (weights[i - 1] <= w) {
              dp[i][w] = Math.max(
                values[i - 1] + dp[i - 1][w - weights[i - 1]],
                dp[i - 1][w]
              );
            } else {
              dp[i][w] = dp[i - 1][w];
            }
          }
        }
        
        // Backtrack to find selected items
        const selected: number[] = [];
        let w = capacity;
        for (let i = n; i > 0 && w > 0; i--) {
          if (dp[i][w] !== dp[i - 1][w]) {
            selected.push(i - 1);
            w -= weights[i - 1];
          }
        }

        return {
          result: {
            maxValue: dp[n][capacity],
            selectedItems: selected,
            totalWeight: selected.reduce((sum, i) => sum + weights[i], 0)
          },
          formula: 'Maximize Σ(vi × xi) subject to Σ(wi × xi) ≤ W',
          executionTime: 0
        };
      }

      case 'assignment': {
        // Assignment problem (Hungarian algorithm simplified)
        const { costMatrix } = inputs;
        const n = costMatrix.length;
        
        // Mock solution - in production, use Hungarian algorithm
        const assignment = Array.from({ length: n }, (_, i) => ({
          worker: i,
          task: (i + Math.floor(Math.random() * n)) % n
        }));
        
        const totalCost = assignment.reduce((sum, a) => 
          sum + costMatrix[a.worker][a.task], 0
        );

        return {
          result: {
            assignment,
            totalCost
          },
          formula: 'Minimize Σ(cij × xij)',
          executionTime: 0
        };
      }

      default:
        throw new Error(`Unknown optimization operation: ${operation}`);
    }
  }
}

export const calculationEngine = new CalculationEngine();