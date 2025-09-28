import React, { useState, useEffect } from 'react';
import './AIInsights.css';

const AIInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const mockInsights = [
    {
      id: 1,
      category: 'cash-flow',
      title: 'Cash Flow Optimization Opportunity',
      description: 'Your accounts receivable turnover could be improved by 15% with automated invoicing.',
      impact: 'High',
      savings: 45000,
      timeframe: '90 days',
      confidence: 92,
      actionItems: [
        'Implement automated invoicing system',
        'Set up payment reminders at 15, 30, and 45 days',
        'Offer early payment discounts (2/10 net 30)'
      ]
    },
    {
      id: 2,
      category: 'inventory',
      title: 'Inventory Level Optimization',
      description: 'Reduce inventory holding costs by optimizing stock levels based on demand patterns.',
      impact: 'Medium',
      savings: 28000,
      timeframe: '120 days',
      confidence: 87,
      actionItems: [
        'Implement just-in-time inventory management',
        'Analyze seasonal demand patterns',
        'Negotiate better supplier payment terms'
      ]
    },
    {
      id: 3,
      category: 'procurement',
      title: 'Supplier Payment Terms Enhancement',
      description: 'Negotiate extended payment terms with top 5 suppliers to improve cash flow.',
      impact: 'High',
      savings: 62000,
      timeframe: '60 days',
      confidence: 78,
      actionItems: [
        'Review current supplier contracts',
        'Negotiate 60-day payment terms with key suppliers',
        'Establish volume-based payment incentives'
      ]
    },
    {
      id: 4,
      category: 'forecasting',
      title: 'Demand Forecasting Improvement',
      description: 'AI-powered demand forecasting can reduce overstock by 25% and stockouts by 40%.',
      impact: 'High',
      savings: 85000,
      timeframe: '180 days',
      confidence: 94,
      actionItems: [
        'Implement machine learning forecasting models',
        'Integrate historical sales data with market trends',
        'Set up automated reorder points'
      ]
    },
    {
      id: 5,
      category: 'efficiency',
      title: 'Production Efficiency Enhancement',
      description: 'Optimize production scheduling to reduce waste and improve throughput by 12%.',
      impact: 'Medium',
      savings: 34000,
      timeframe: '150 days',
      confidence: 89,
      actionItems: [
        'Analyze current production bottlenecks',
        'Implement lean manufacturing principles',
        'Optimize shift scheduling and resource allocation'
      ]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Insights', icon: '🔍' },
    { id: 'cash-flow', name: 'Cash Flow', icon: '💰' },
    { id: 'inventory', name: 'Inventory', icon: '📦' },
    { id: 'procurement', name: 'Procurement', icon: '🤝' },
    { id: 'forecasting', name: 'Forecasting', icon: '📈' },
    { id: 'efficiency', name: 'Efficiency', icon: '⚡' }
  ];

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setInsights(mockInsights);
      setLoading(false);
    }, 1500);
  }, []);

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  const totalSavings = insights.reduce((sum, insight) => sum + insight.savings, 0);

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#10b981';
    if (confidence >= 75) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="ai-insights">
        <div className="insights-header">
          <h2>🤖 AI-Powered Manufacturing Insights</h2>
          <p>Analyzing your data to identify optimization opportunities...</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Generating insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-insights">
      <div className="insights-header">
        <h2>🤖 AI-Powered Manufacturing Insights</h2>
        <p>Intelligent recommendations to optimize your manufacturing operations</p>
      </div>

      <div className="insights-summary">
        <div className="summary-card">
          <h3>Total Potential Savings</h3>
          <div className="summary-value">${totalSavings.toLocaleString()}</div>
          <p>Annual optimization potential</p>
        </div>
        <div className="summary-card">
          <h3>Active Insights</h3>
          <div className="summary-value">{insights.length}</div>
          <p>Actionable recommendations</p>
        </div>
        <div className="summary-card">
          <h3>Average Confidence</h3>
          <div className="summary-value">
            {Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)}%
          </div>
          <p>AI prediction accuracy</p>
        </div>
      </div>

      <div className="insights-content">
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-filter ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        <div className="insights-grid">
          {filteredInsights.map(insight => (
            <div key={insight.id} className="insight-card">
              <div className="insight-header">
                <h3>{insight.title}</h3>
                <div className="insight-badges">
                  <span 
                    className="impact-badge"
                    style={{ backgroundColor: getImpactColor(insight.impact) }}
                  >
                    {insight.impact} Impact
                  </span>
                  <span 
                    className="confidence-badge"
                    style={{ backgroundColor: getConfidenceColor(insight.confidence) }}
                  >
                    {insight.confidence}% Confidence
                  </span>
                </div>
              </div>

              <p className="insight-description">{insight.description}</p>

              <div className="insight-metrics">
                <div className="metric">
                  <span className="metric-label">Potential Savings</span>
                  <span className="metric-value">${insight.savings.toLocaleString()}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Implementation Time</span>
                  <span className="metric-value">{insight.timeframe}</span>
                </div>
              </div>

              <div className="action-items">
                <h4>Recommended Actions:</h4>
                <ul>
                  {insight.actionItems.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>

              <div className="insight-actions">
                <button className="action-button primary">Implement</button>
                <button className="action-button secondary">Learn More</button>
                <button className="action-button tertiary">Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
