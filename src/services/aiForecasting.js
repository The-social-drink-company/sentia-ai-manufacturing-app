import axios from 'axios'
import { amazonSPAPI, amazonUtils } from './amazonApi'
import { shopifyUK, shopifyEU, shopifyUSA, shopifyUtils } from './shopifyApi'

// AI-Powered Demand Forecasting Service
class AIForecastingService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
    this.claudeApiKey = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY
    this.apiBaseUrl = 'https://api.openai.com/v1'
    
    this.client = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 60000,
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    // Model configurations
    this.models = {
      gpt4: 'gpt-4-1106-preview',
      gpt35: 'gpt-3.5-turbo-1106'
    }
    
    // Cache for expensive AI operations
    this.forecastCache = new Map()
    this.cacheExpiry = 60 * 60 * 1000 // 1 hour
  }

  // Generate AI-enhanced demand forecast
  async generateEnhancedForecast(options = {}) {
    const {
      sku,
      timeHorizon = 90,
      includeExternalFactors = true,
      model = 'gpt35',
      confidenceInterval = 0.95
    } = options

    // Check cache first
    const cacheKey = `forecast_${sku}_${timeHorizon}_${model}`
    const cached = this.forecastCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return { ...cached.data, fromCache: true }
    }

    try {
      // Step 1: Gather historical data from all sources
      const historicalData = await this.aggregateHistoricalData(sku)
      
      if (!historicalData.success) {
        throw new Error(`Failed to gather historical data: ${historicalData.error}`)
      }

      // Step 2: Prepare data for AI analysis
      const analysisData = this.prepareDataForAI(historicalData.data)
      
      // Step 3: Generate AI-enhanced forecast
      const aiResponse = await this.callOpenAI({
        model: this.models[model],
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(includeExternalFactors)
          },
          {
            role: 'user',
            content: this.buildForecastPrompt(analysisData, timeHorizon, confidenceInterval)
          }
        ],
        temperature: 0.1, // Low temperature for consistent predictions
        max_tokens: 2000
      })

      // Step 4: Parse AI response and generate forecast
      const forecast = await this.parseAIForecast(aiResponse, historicalData.data)
      
      // Cache the result
      this.forecastCache.set(cacheKey, {
        data: forecast,
        timestamp: Date.now()
      })

      return {
        ...forecast,
        fromCache: false,
        aiModel: model,
        dataQuality: this.assessDataQuality(historicalData.data)
      }
    } catch (error) {
      console.error('AI Forecasting error:', error)
      return {
        success: false,
        error: error.message,
        fallbackMethod: 'traditional'
      }
    }
  }

  // Aggregate historical data from all sources
  async aggregateHistoricalData(sku, days = 180) {
    try {
      const promises = []

      // Amazon data
      if (amazonSPAPI.isConfigured()) {
        promises.push(
          amazonSPAPI.transformOrdersForForecasting(days)
            .then(result => ({ source: 'amazon', ...result }))
        )
      }

      // Shopify data (all regions)
      const shopifyInstances = [
        { name: 'UK', instance: shopifyUK },
        { name: 'EU', instance: shopifyEU },
        { name: 'USA', instance: shopifyUSA }
      ]

      shopifyInstances.forEach(({ name, instance }) => {
        if (instance.isConfigured()) {
          promises.push(
            instance.transformOrdersForForecasting(days)
              .then(result => ({ source: `shopify_${name}`, region: name, ...result }))
          )
        }
      })

      const results = await Promise.allSettled(promises)
      
      // Combine successful results
      const combinedData = {
        sources: [],
        demandData: {},
        timeRange: { days, endDate: new Date() },
        dataPoints: 0
      }

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          const sourceData = result.value
          combinedData.sources.push({
            source: sourceData.source,
            region: sourceData.region,
            productCount: sourceData.summary.totalProducts,
            orderCount: sourceData.summary.totalOrders
          })

          // Merge demand data
          if (sourceData.data[sku]) {
            const productData = sourceData.data[sku]
            
            if (!combinedData.demandData[sku]) {
              combinedData.demandData[sku] = {
                sku,
                productName: productData.productName,
                sources: [],
                dailyDemand: {},
                totalQuantity: 0,
                totalRevenue: 0,
                regions: []
              }
            }

            // Merge daily demand
            Object.entries(productData.dailyDemand).forEach(([date, quantity]) => {
              if (!combinedData.demandData[sku].dailyDemand[date]) {
                combinedData.demandData[sku].dailyDemand[date] = 0
              }
              combinedData.demandData[sku].dailyDemand[date] += quantity
            })

            combinedData.demandData[sku].sources.push(sourceData.source)
            combinedData.demandData[sku].totalQuantity += productData.totalQuantity
            combinedData.demandData[sku].totalRevenue += productData.totalRevenue
            
            if (sourceData.region) {
              combinedData.demandData[sku].regions.push(sourceData.region)
            }
          }
        }
      })

      combinedData.dataPoints = Object.keys(combinedData.demandData[sku]?.dailyDemand || {}).length

      return {
        success: combinedData.sources.length > 0,
        data: combinedData,
        error: combinedData.sources.length === 0 ? 'No data sources available' : null
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      }
    }
  }

  // Prepare data for AI analysis
  prepareDataForAI(data) {
    if (!data.demandData) return null

    const productData = Object.values(data.demandData)[0]
    if (!productData) return null

    const dailyDemand = productData.dailyDemand
    const sortedDates = Object.keys(dailyDemand).sort()
    
    // Calculate basic statistics
    const values = Object.values(dailyDemand)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    
    // Detect trends
    const trendData = this.calculateTrend(sortedDates, dailyDemand)
    
    // Detect seasonality
    const seasonalityData = this.detectSeasonality(sortedDates, dailyDemand)
    
    return {
      sku: productData.sku,
      productName: productData.productName,
      sources: productData.sources,
      regions: productData.regions,
      dataPoints: sortedDates.length,
      timeSpan: {
        start: sortedDates[0],
        end: sortedDates[sortedDates.length - 1],
        days: sortedDates.length
      },
      statistics: {
        mean: Math.round(mean * 100) / 100,
        standardDeviation: Math.round(stdDev * 100) / 100,
        coefficientOfVariation: mean > 0 ? Math.round((stdDev / mean) * 10000) / 100 : 0,
        totalQuantity: productData.totalQuantity,
        averageDailyDemand: Math.round((productData.totalQuantity / sortedDates.length) * 100) / 100
      },
      trends: trendData,
      seasonality: seasonalityData,
      recentPerformance: this.calculateRecentPerformance(sortedDates, dailyDemand),
      dataSeries: sortedDates.map(date => ({
        date,
        quantity: dailyDemand[date]
      }))
    }
  }

  // Build system prompt for AI
  buildSystemPrompt(includeExternalFactors) {
    let prompt = `You are an expert demand forecasting analyst for a manufacturing and e-commerce company. Your task is to analyze historical sales data and provide accurate demand forecasts.

You have access to multi-channel sales data from Amazon, Shopify (UK, EU, USA), and other sources. You should consider:

1. Historical demand patterns and trends
2. Seasonality and cyclical behavior
3. Statistical measures (mean, standard deviation, coefficient of variation)
4. Recent performance trends
5. Data quality and reliability factors`

    if (includeExternalFactors) {
      prompt += `
6. External factors that might affect demand:
   - Economic conditions and consumer confidence
   - Seasonal shopping patterns (holidays, back-to-school, etc.)
   - Market trends and competition
   - Supply chain disruptions
   - Marketing campaigns and promotions`
    }

    prompt += `

Provide forecasts in JSON format with the following structure:
{
  "forecast": [
    {"date": "YYYY-MM-DD", "predicted_demand": number, "confidence_lower": number, "confidence_upper": number}
  ],
  "insights": {
    "trend_direction": "increasing|decreasing|stable",
    "seasonality_detected": boolean,
    "risk_factors": ["factor1", "factor2"],
    "confidence_score": number_0_to_100,
    "key_assumptions": ["assumption1", "assumption2"]
  },
  "recommendations": ["recommendation1", "recommendation2"]
}

Be precise, data-driven, and conservative in your predictions. Consider the reliability and quality of the input data.`

    return prompt
  }

  // Build forecast prompt
  buildForecastPrompt(analysisData, timeHorizon, confidenceInterval) {
    return `Please analyze the following product demand data and provide a ${timeHorizon}-day forecast:

PRODUCT INFORMATION:
- SKU: ${analysisData.sku}
- Product Name: ${analysisData.productName}
- Data Sources: ${analysisData.sources.join(', ')}
- Sales Regions: ${analysisData.regions.join(', ')}

DATA QUALITY:
- Data Points: ${analysisData.dataPoints} days
- Time Span: ${analysisData.timeSpan.start} to ${analysisData.timeSpan.end}
- Data Coverage: ${Math.round((analysisData.dataPoints / analysisData.timeSpan.days) * 100)}%

STATISTICAL SUMMARY:
- Average Daily Demand: ${analysisData.statistics.averageDailyDemand}
- Total Quantity Sold: ${analysisData.statistics.totalQuantity}
- Standard Deviation: ${analysisData.statistics.standardDeviation}
- Coefficient of Variation: ${analysisData.statistics.coefficientOfVariation}%

TRENDS:
- Overall Trend: ${analysisData.trends.direction}
- Trend Strength: ${analysisData.trends.strength}
- Growth Rate: ${analysisData.trends.growthRate}% per period

SEASONALITY:
- Seasonal Pattern Detected: ${analysisData.seasonality.hasPattern ? 'Yes' : 'No'}
- Pattern Strength: ${analysisData.seasonality.strength || 'N/A'}
- Peak Period: ${analysisData.seasonality.peakPeriod || 'N/A'}

RECENT PERFORMANCE (Last 30 days):
- Average Demand: ${analysisData.recentPerformance.averageDemand}
- Trend: ${analysisData.recentPerformance.trend}
- Volatility: ${analysisData.recentPerformance.volatility}

HISTORICAL DATA SAMPLE (Last 14 days):
${analysisData.dataSeries.slice(-14).map(d => `${d.date}: ${d.quantity} units`).join('\n')}

Please provide a ${timeHorizon}-day forecast with ${Math.round(confidenceInterval * 100)}% confidence intervals. Consider all patterns, trends, and data quality factors in your analysis.`
  }

  // Call OpenAI API
  async callOpenAI(params) {
    try {
      const response = await this.client.post('/chat/completions', params)
      return response.data.choices[0].message.content
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.')
      } else if (error.response?.status === 401) {
        throw new Error('OpenAI API authentication failed. Please check your API key.')
      } else {
        throw new Error(`OpenAI API error: ${error.message}`)
      }
    }
  }

  // Parse AI forecast response
  async parseAIForecast(aiResponse, historicalData) {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate and enhance the forecast
      return {
        success: true,
        forecast: parsed.forecast.map(item => ({
          date: item.date,
          predicted_demand: Math.max(0, Math.round(item.predicted_demand * 100) / 100),
          confidence_lower: Math.max(0, Math.round(item.confidence_lower * 100) / 100),
          confidence_upper: Math.max(0, Math.round(item.confidence_upper * 100) / 100),
          method: 'ai_enhanced'
        })),
        insights: {
          ...parsed.insights,
          model_type: 'openai_gpt',
          generated_at: new Date().toISOString(),
          data_sources: historicalData.sources.map(s => s.source)
        },
        recommendations: parsed.recommendations || [],
        metadata: {
          forecast_horizon: parsed.forecast.length,
          confidence_interval: 0.95,
          model_confidence: parsed.insights.confidence_score,
          data_quality_score: this.assessDataQuality(historicalData)
        }
      }
    } catch (error) {
      console.error('Failed to parse AI forecast:', error)
      
      // Fallback to simple statistical forecast
      return this.generateFallbackForecast(historicalData, error.message)
    }
  }

  // Helper methods for data analysis
  calculateTrend(dates, dailyDemand) {
    if (dates.length < 7) {
      return { direction: 'insufficient_data', strength: 0, growthRate: 0 }
    }

    const values = dates.map(date => dailyDemand[date])
    const n = values.length
    
    // Simple linear regression
    const sumX = dates.reduce((sum, _, i) => sum + i, 0)
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0)
    const sumXX = dates.reduce((sum, _, i) => sum + (i * i), 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    const direction = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable'
    const strength = Math.abs(slope)
    const growthRate = sumY > 0 ? (slope / (sumY / n)) * 100 : 0
    
    return {
      direction,
      strength: Math.round(strength * 1000) / 1000,
      growthRate: Math.round(growthRate * 100) / 100,
      slope,
      intercept
    }
  }

  detectSeasonality(dates, dailyDemand) {
    if (dates.length < 14) {
      return { hasPattern: false, strength: 0 }
    }

    // Weekly seasonality detection
    const dayOfWeekData = {}
    dates.forEach(date => {
      const dayOfWeek = new Date(date).getDay()
      if (!dayOfWeekData[dayOfWeek]) dayOfWeekData[dayOfWeek] = []
      dayOfWeekData[dayOfWeek].push(dailyDemand[date])
    })

    const weeklyAverages = Object.keys(dayOfWeekData).map(day => {
      const values = dayOfWeekData[day]
      return values.reduce((sum, val) => sum + val, 0) / values.length
    })

    const overallAverage = weeklyAverages.reduce((sum, val) => sum + val, 0) / weeklyAverages.length
    const variance = weeklyAverages.reduce((sum, val) => sum + Math.pow(val - overallAverage, 2), 0) / weeklyAverages.length
    const stdDev = Math.sqrt(variance)

    const hasPattern = stdDev > overallAverage * 0.2
    const strength = overallAverage > 0 ? stdDev / overallAverage : 0

    return {
      hasPattern,
      strength: Math.round(strength * 1000) / 1000,
      weeklyPattern: weeklyAverages,
      peakDay: weeklyAverages.indexOf(Math.max(...weeklyAverages)),
      peakPeriod: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weeklyAverages.indexOf(Math.max(...weeklyAverages))]
    }
  }

  calculateRecentPerformance(dates, dailyDemand, days = 30) {
    const recentDates = dates.slice(-days)
    const recentValues = recentDates.map(date => dailyDemand[date])
    
    if (recentValues.length === 0) {
      return { averageDemand: 0, trend: 'no_data', volatility: 0 }
    }

    const averageDemand = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length
    const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - averageDemand, 2), 0) / recentValues.length
    const volatility = Math.sqrt(variance)

    // Simple trend for recent period
    const firstHalf = recentValues.slice(0, Math.floor(recentValues.length / 2))
    const secondHalf = recentValues.slice(-Math.floor(recentValues.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    
    const trendDirection = secondAvg > firstAvg * 1.1 ? 'increasing' : 
                          secondAvg < firstAvg * 0.9 ? 'decreasing' : 'stable'

    return {
      averageDemand: Math.round(averageDemand * 100) / 100,
      trend: trendDirection,
      volatility: Math.round(volatility * 100) / 100
    }
  }

  assessDataQuality(data) {
    const sources = data.sources?.length || 0
    const dataPoints = Object.keys(data.demandData).length
    const timeSpan = data.timeRange?.days || 0
    
    let score = 0
    
    // Multi-source bonus
    score += Math.min(sources * 20, 40)
    
    // Data completeness
    if (timeSpan > 0) {
      const completeness = dataPoints / timeSpan
      score += Math.min(completeness * 40, 40)
    }
    
    // Recency bonus
    const daysSinceLastData = Math.floor((Date.now() - new Date(data.timeRange?.endDate).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLastData <= 1) score += 10
    else if (daysSinceLastData <= 7) score += 5
    
    // Minimum data points
    if (dataPoints >= 30) score += 10
    
    return Math.min(Math.round(score), 100)
  }

  generateFallbackForecast(historicalData, error) {
    // Simple moving average fallback
    console.warn(`AI forecast failed: ${error}. Using fallback method.`)
    
    const productData = Object.values(historicalData.demandData)[0]
    if (!productData) {
      return { success: false, error: 'No historical data available' }
    }

    const dailyDemand = productData.dailyDemand
    const values = Object.values(dailyDemand)
    const average = values.reduce((sum, val) => sum + val, 0) / values.length
    
    // Generate simple forecast
    const forecast = []
    for (let i = 1; i <= 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        predicted_demand: Math.round(average * 100) / 100,
        confidence_lower: Math.round(average * 0.8 * 100) / 100,
        confidence_upper: Math.round(average * 1.2 * 100) / 100,
        method: 'moving_average_fallback'
      })
    }

    return {
      success: true,
      forecast,
      insights: {
        trend_direction: 'stable',
        seasonality_detected: false,
        confidence_score: 60,
        model_type: 'fallback',
        generated_at: new Date().toISOString()
      },
      recommendations: ['Insufficient data for AI analysis', 'Consider gathering more historical data'],
      metadata: {
        forecast_horizon: 30,
        confidence_interval: 0.8,
        model_confidence: 60,
        data_quality_score: this.assessDataQuality(historicalData),
        fallback_reason: error
      }
    }
  }

  isConfigured() {
    return !!(this.openaiApiKey || this.claudeApiKey)
  }
}

// Singleton instance
export const aiForecasting = new AIForecastingService()

// Export for testing
export { AIForecastingService }