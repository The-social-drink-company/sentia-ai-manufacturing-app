import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence, RunnableMap } from '@langchain/core/runnables';
import axios from 'axios';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize LLM agents
const agents = {
  analyst: new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.2,
    apiKey: process.env.OPENAI_API_KEY,
  }),
  forecaster: new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.3,
    apiKey: process.env.OPENAI_API_KEY,
  }),
  strategist: new ChatAnthropic({
    modelName: 'claude-3-opus-20240229',
    temperature: 0.4,
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
};

// Agent prompts
const prompts = {
  analyst: ChatPromptTemplate.fromTemplate(`
    You are a senior financial analyst specializing in liquidity management.
    Analyze the following financial data and provide insights.
    
    Data: {data}
    Query: {query}
    
    Provide:
    1. Current liquidity position analysis
    2. Key risk indicators
    3. Trends and patterns
    4. Actionable recommendations
  `),
  
  forecaster: ChatPromptTemplate.fromTemplate(`
    You are an expert in financial forecasting and predictive analytics.
    Based on the historical data, create forecast scenarios.
    
    Historical Data: {data}
    Forecast Period: {period}
    Assumptions: {assumptions}
    
    Generate:
    1. Base case scenario
    2. Optimistic scenario
    3. Pessimistic scenario
    4. Confidence intervals
    5. Key drivers and sensitivities
  `),
  
  strategist: ChatPromptTemplate.fromTemplate(`
    You are a strategic financial advisor focused on working capital optimization.
    Develop strategic recommendations based on the analysis.
    
    Current State: {currentState}
    Forecast: {forecast}
    Constraints: {constraints}
    
    Recommend:
    1. Working capital optimization strategies
    2. Cash flow improvement tactics
    3. Risk mitigation measures
    4. Investment priorities
    5. Implementation roadmap
  `),
};

// Orchestration chains
const chains = {
  analyst: RunnableSequence.from([
    prompts.analyst,
    agents.analyst,
    new StringOutputParser(),
  ]),
  
  forecaster: RunnableSequence.from([
    prompts.forecaster,
    agents.forecaster,
    new StringOutputParser(),
  ]),
  
  strategist: RunnableSequence.from([
    prompts.strategist,
    agents.strategist,
    new StringOutputParser(),
  ]),
};

// Multi-agent orchestration
const orchestrateAgents = async (request) => {
  const { query, context, capabilities = ['analyze'] } = request;
  
  // Fetch relevant data from lakehouse
  const lakehouseUrl = process.env.LAKEHOUSE_URL || 'http://localhost:8100';
  const dataResponse = await axios.post(`${lakehouseUrl}/query`, {
    sql: `
      SELECT * FROM analytics.liquidity_metrics 
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY date DESC
    `
  });
  
  const results = {};
  
  // Run requested capabilities
  if (capabilities.includes('analyze')) {
    results.analysis = await chains.analyst.invoke({
      data: JSON.stringify(dataResponse.data.data),
      query,
    });
  }
  
  if (capabilities.includes('forecast')) {
    results.forecast = await chains.forecaster.invoke({
      data: JSON.stringify(dataResponse.data.data),
      period: context?.timeRange || '30 days',
      assumptions: JSON.stringify(context?.assumptions || {}),
    });
  }
  
  if (capabilities.includes('recommend')) {
    results.recommendations = await chains.strategist.invoke({
      currentState: results.analysis || 'Current state analysis pending',
      forecast: results.forecast || 'Forecast pending',
      constraints: JSON.stringify(context?.constraints || {}),
    });
  }
  
  return {
    query,
    timestamp: new Date().toISOString(),
    results,
    data: dataResponse.data.data,
    confidence: 0.85,
  };
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'orchestrator',
    agents: Object.keys(agents),
    timestamp: new Date().toISOString(),
  });
});

// Agent query endpoint
app.post('/query', async (req, res) => {
  try {
    const { query, context, capabilities } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    logger.info(`Processing query: ${query}`);
    
    const result = await orchestrateAgents({ query, context, capabilities });
    
    res.json(result);
  } catch (error) {
    logger.error('Orchestration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Specific agent endpoints
app.post('/analyze', async (req, res) => {
  try {
    const { data, query } = req.body;
    
    const result = await chains.analyst.invoke({ data, query });
    
    res.json({
      analysis: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/forecast', async (req, res) => {
  try {
    const { data, period, assumptions } = req.body;
    
    const result = await chains.forecaster.invoke({
      data,
      period,
      assumptions: JSON.stringify(assumptions),
    });
    
    res.json({
      forecast: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Forecast error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/recommend', async (req, res) => {
  try {
    const { currentState, forecast, constraints } = req.body;
    
    const result = await chains.strategist.invoke({
      currentState,
      forecast,
      constraints: JSON.stringify(constraints),
    });
    
    res.json({
      recommendations: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Recommendation error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.ORCHESTRATOR_PORT || 8102;
app.listen(PORT, () => {
  logger.info(`Orchestrator service running on port ${PORT}`);
});