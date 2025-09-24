// src/services/landing.js
export const landingAPI = {
  // Check MCP connection status
  checkMCPStatus: async () => {
    try {
      const response = await fetch('/api/mcp/status');
      return await response.json();
    } catch (error) {
      console.error('MCP status check failed:', error);
      return { connected: false, error: error.message };
    }
  },

  // Get AI capabilities
  getAICapabilities: async () => {
    try {
      const response = await fetch('/api/ai/capabilities');
      return await response.json();
    } catch (error) {
      console.error('AI capabilities fetch failed:', error);
      return { 
        capabilities: [
          {
            icon: '🧠',
            name: 'Predictive Analytics',
            description: 'Advanced forecasting using ensemble ML models',
            models: ['GPT-4', 'Claude-3', 'TensorFlow']
          },
          {
            icon: '📊',
            name: 'Real-time Optimization',
            description: 'Continuous process improvement with AI agents',
            models: ['PyTorch', 'Scikit-learn', 'OpenAI']
          },
          {
            icon: '🌐',
            name: 'Natural Language Interface',
            description: 'Query your data using conversational AI',
            models: ['GPT-4', 'Claude-3', 'BERT']
          }
        ]
      };
    }
  },

  // Schedule demo
  scheduleDemo: async (data) => {
    try {
      const response = await fetch('/api/demo/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Demo scheduling failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Get testimonials
  getTestimonials: async () => {
    try {
      const response = await fetch('/api/testimonials');
      return await response.json();
    } catch (error) {
      console.error('Testimonials fetch failed:', error);
      return { testimonials: [] };
    }
  },

  // Get case studies
  getCaseStudies: async () => {
    try {
      const response = await fetch('/api/case-studies');
      return await response.json();
    } catch (error) {
      console.error('Case studies fetch failed:', error);
      return { caseStudies: [] };
    }
  }
};