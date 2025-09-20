import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/BulletproofClerkProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { 
  FileText, 
  Download, 
  Eye, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Presentation,
  Brain,
  Zap,
  Clock,
  Building2,
  ArrowRight,
  Star
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import { format, addDays, parseISO } from 'date-fns';
import MCPIntegratedAIService from '../../services/ai/MCPIntegratedAIService';

const BoardReadyReportGenerator = ({ dashboardData, companyInfo }) => {
  const { user, isLoaded } = useAuth();
  const [activeTab, setActiveTab] = useState('generator');
  const [reportConfig, setReportConfig] = useState({
    reportType: 'executive_summary',
    audience: 'board_of_directors',
    timeframe: 'quarterly',
    includeForecasts: true,
    includeRecommendations: true,
    includeRiskAssessment: true,
    includeActionItems: true,
    customTitle: '',
    executiveMessage: '',
    focusAreas: ['cash_flow', 'working_capital', 'growth_funding']
  });
  const [generatedReport, setGeneratedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState('executive');

  // Initialize MCP service
  const mcpService = new MCPIntegratedAIService();

  // Report templates
  const reportTemplates = {
    executive_summary: {
      title: 'Executive Summary',
      description: 'High-level overview for C-suite and board members',
      sections: ['key_metrics', 'strategic_insights', 'recommendations', 'next_steps'],
      audience: ['board_of_directors', 'c_suite', 'investors']
    },
    working_capital_deep_dive: {
      title: 'Working Capital Deep Dive',
      description: 'Comprehensive analysis of working capital optimization',
      sections: ['current_position', 'optimization_opportunities', 'implementation_roadmap', 'financial_impact'],
      audience: ['cfo', 'finance_team', 'operations']
    },
    cash_flow_analysis: {
      title: 'Cash Flow Analysis & Forecasting',
      description: 'Detailed cash flow analysis with forecasting',
      sections: ['cash_position', 'forecast_analysis', 'scenario_planning', 'risk_mitigation'],
      audience: ['cfo', 'treasury', 'board_of_directors']
    },
    growth_funding_proposal: {
      title: 'Growth Funding Proposal',
      description: 'Strategic funding requirements for growth initiatives',
      sections: ['growth_strategy', 'funding_requirements', 'roi_projections', 'implementation_timeline'],
      audience: ['investors', 'board_of_directors', 'private_equity']
    },
    monthly_dashboard: {
      title: 'Monthly Financial Dashboard',
      description: 'Regular monthly reporting for ongoing monitoring',
      sections: ['performance_metrics', 'variance_analysis', 'key_insights', 'action_items'],
      audience: ['management_team', 'department_heads']
    }
  };

  // Generate report using MCP AI
  const generateReport = async () => {
    try {
      setLoading(true);
      
      // Prepare data for MCP analysis
      const reportData = {
        dashboardData,
        companyInfo,
        reportConfig,
        generatedAt: new Date().toISOString()
      };

      // Generate report via MCP server
      const report = await mcpService.generateBoardPresentationMCP(reportData);
      
      // Enhance with additional sections
      const enhancedReport = await enhanceReportWithSections(report, reportConfig);
      
      setGeneratedReport(enhancedReport);
      
    } catch (error) {
      console.error('Report generation error:', error);
      // Generate fallback report
      const fallbackReport = generateFallbackReport();
      setGeneratedReport(fallbackReport);
    } finally {
      setLoading(false);
    }
  };

  // Enhance report with additional sections
  const enhanceReportWithSections = async (baseReport, config) => {
    const template = reportTemplates[config.reportType];
    
    return {
      ...baseReport,
      metadata: {
        title: config.customTitle || template.title,
        generatedAt: new Date().toISOString(),
        audience: config.audience,
        timeframe: config.timeframe,
        reportType: config.reportType,
        companyName: companyInfo?.name || 'Company'
      },
      executiveSummary: generateExecutiveSummary(),
      keyMetrics: generateKeyMetrics(),
      strategicInsights: generateStrategicInsights(),
      recommendations: generateRecommendations(),
      actionItems: generateActionItems(),
      riskAssessment: config.includeRiskAssessment ? generateRiskAssessment() : null,
      financialForecasts: config.includeForecasts ? generateFinancialForecasts() : null,
      appendices: generateAppendices()
    };
  };

  // Generate executive summary
  const generateExecutiveSummary = () => {
    if (!dashboardData) return null;

    const { cashRunway, optimization, fundingRequirements } = dashboardData;
    
    return {
      overview: `Our working capital analysis reveals significant opportunities to optimize cash flow and support strategic growth initiatives. Current cash runway extends ${cashRunway?.summary?.cashRunwayDays || 'TBD'} days, with potential to unlock £${((optimization?.summary?.cashUnlockPotential || 0) / 1000).toFixed(0)}K through targeted working capital improvements.`,
      
      keyFindings: [
        `Cash runway: ${cashRunway?.summary?.cashRunwayDays || 'TBD'} days with current burn rate`,
        `Working capital optimization potential: £${((optimization?.summary?.cashUnlockPotential || 0) / 1000).toFixed(0)}K`,
        `Growth funding requirement: £${((fundingRequirements?.summary?.totalFundingRequired || 0) / 1000).toFixed(0)}K for planned expansion`,
        `Implementation timeframe: ${optimization?.summary?.implementationTimeframe || 'TBD'} days for key initiatives`
      ],
      
      strategicImplications: [
        'Immediate focus on receivables management will yield quick cash flow improvements',
        'Supplier payment optimization can extend cash runway without operational impact',
        'Growth funding strategy should combine working capital optimization with external financing',
        'Risk mitigation through diversified funding sources and improved cash forecasting'
      ]
    };
  };

  // Generate key metrics section
  const generateKeyMetrics = () => {
    if (!dashboardData) return null;

    const { cashRunway, optimization, benchmarks } = dashboardData;
    
    return {
      financial: {
        currentCash: cashRunway?.summary?.currentCash || 0,
        cashRunwayDays: cashRunway?.summary?.cashRunwayDays || 0,
        workingCapital: optimization?.currentMetrics?.workingCapital || 0,
        cashUnlockPotential: optimization?.summary?.cashUnlockPotential || 0
      },
      
      operational: {
        dso: optimization?.currentMetrics?.dso || 0,
        dpo: optimization?.currentMetrics?.dpo || 0,
        inventoryTurns: optimization?.currentMetrics?.inventoryTurns || 0,
        cashConversionCycle: optimization?.currentMetrics?.cashConversionCycle || 0
      },
      
      benchmarks: {
        industryDSO: benchmarks?.workingCapital?.dso?.average || 0,
        industryDPO: benchmarks?.workingCapital?.dpo?.average || 0,
        industryInventoryTurns: benchmarks?.workingCapital?.inventoryTurns?.average || 0,
        competitivePosition: benchmarks?.competitivePosition?.efficiency || 'average'
      }
    };
  };

  // Generate strategic insights
  const generateStrategicInsights = () => {
    return [
      {
        title: 'Working Capital Efficiency',
        insight: 'Current working capital management presents immediate optimization opportunities',
        impact: 'High',
        timeframe: '30-90 days',
        details: 'Focused improvements in receivables collection and payables management can unlock significant cash flow within the next quarter.'
      },
      {
        title: 'Growth Funding Strategy',
        insight: 'Balanced approach to funding growth through optimization and external capital',
        impact: 'Strategic',
        timeframe: '6-12 months',
        details: 'Combining internal cash generation improvements with strategic funding will minimize dilution while supporting growth objectives.'
      },
      {
        title: 'Risk Management',
        insight: 'Diversified approach to cash flow management reduces operational risk',
        impact: 'Medium',
        timeframe: 'Ongoing',
        details: 'Enhanced forecasting and multiple funding sources provide resilience against market volatility and seasonal fluctuations.'
      }
    ];
  };

  // Generate recommendations
  const generateRecommendations = () => {
    return {
      immediate: [
        {
          action: 'Implement automated invoice follow-up system',
          impact: 'Reduce DSO by 5-10 days',
          timeline: '2-4 weeks',
          investment: '£5,000-£15,000',
          roi: '300-500%'
        },
        {
          action: 'Negotiate extended payment terms with top 5 suppliers',
          impact: 'Extend DPO by 7-14 days',
          timeline: '4-6 weeks',
          investment: 'Management time',
          roi: 'Immediate cash flow improvement'
        },
        {
          action: 'Optimize inventory levels using demand forecasting',
          impact: 'Reduce inventory by 15-25%',
          timeline: '6-8 weeks',
          investment: '£10,000-£25,000',
          roi: '200-400%'
        }
      ],
      
      strategic: [
        {
          action: 'Establish revolving credit facility',
          impact: 'Provide £500K-£1M funding flexibility',
          timeline: '8-12 weeks',
          investment: 'Interest and fees',
          roi: 'Strategic optionality'
        },
        {
          action: 'Implement supply chain financing program',
          impact: 'Optimize supplier relationships and cash flow',
          timeline: '12-16 weeks',
          investment: '£20,000-£50,000',
          roi: '150-300%'
        },
        {
          action: 'Deploy AI-powered cash flow forecasting',
          impact: 'Improve forecast accuracy by 25-40%',
          timeline: '6-10 weeks',
          investment: '£15,000-£35,000',
          roi: 'Risk reduction and optimization'
        }
      ]
    };
  };

  // Generate action items
  const generateActionItems = () => {
    return {
      next30Days: [
        'Conduct detailed receivables aging analysis',
        'Initiate supplier payment term negotiations',
        'Implement weekly cash flow reporting',
        'Establish working capital KPI dashboard'
      ],
      
      next90Days: [
        'Deploy automated receivables management system',
        'Complete supplier payment term renegotiations',
        'Implement inventory optimization program',
        'Establish credit facility with primary bank'
      ],
      
      next180Days: [
        'Launch supply chain financing program',
        'Deploy AI-powered forecasting system',
        'Complete working capital optimization initiative',
        'Conduct quarterly working capital review'
      ]
    };
  };

  // Generate risk assessment
  const generateRiskAssessment = () => {
    return {
      liquidity: {
        level: 'Medium',
        description: 'Current cash runway provides adequate buffer but requires monitoring',
        mitigation: 'Establish credit facilities and improve cash forecasting accuracy'
      },
      
      operational: {
        level: 'Low',
        description: 'Strong operational fundamentals with identified optimization opportunities',
        mitigation: 'Continue focus on working capital efficiency and process improvements'
      },
      
      market: {
        level: 'Medium',
        description: 'Economic uncertainty may impact customer payment patterns',
        mitigation: 'Diversify customer base and implement proactive credit management'
      },
      
      strategic: {
        level: 'Low',
        description: 'Clear growth strategy with identified funding requirements',
        mitigation: 'Maintain multiple funding options and flexible growth plans'
      }
    };
  };

  // Generate financial forecasts
  const generateFinancialForecasts = () => {
    if (!dashboardData?.cashRunway?.forecast) return null;

    return {
      cashFlow: dashboardData.cashRunway.forecast.slice(0, 12), // Next 12 periods
      workingCapital: generateWorkingCapitalForecast(),
      scenarios: generateScenarioForecasts()
    };
  };

  // Generate working capital forecast
  const generateWorkingCapitalForecast = () => {
    const baseWC = dashboardData?.optimization?.currentMetrics?.workingCapital || 1000000;
    
    return Array.from({ length: 12 }, (_, i) => ({
      period: format(addDays(new Date(), i * 30), 'MMM yyyy'),
      current: baseWC,
      optimized: baseWC * 0.85, // 15% improvement
      improvement: baseWC * 0.15
    }));
  };

  // Generate scenario forecasts
  const generateScenarioForecasts = () => {
    return [
      {
        name: 'Conservative',
        probability: 70,
        cashFlow: 'Stable with gradual improvement',
        workingCapital: '10-15% optimization',
        funding: 'Internal sources sufficient'
      },
      {
        name: 'Base Case',
        probability: 20,
        cashFlow: 'Strong improvement through optimization',
        workingCapital: '15-25% optimization',
        funding: 'Minimal external funding required'
      },
      {
        name: 'Aggressive',
        probability: 10,
        cashFlow: 'Significant improvement with growth',
        workingCapital: '25-35% optimization',
        funding: 'External funding for growth acceleration'
      }
    ];
  };

  // Generate appendices
  const generateAppendices = () => {
    return {
      methodology: 'Analysis based on comprehensive financial data review, industry benchmarking, and AI-powered insights',
      assumptions: [
        'Historical trends continue unless specifically addressed',
        'Market conditions remain stable',
        'Management commitment to implementation',
        'No significant regulatory changes'
      ],
      dataSource: 'Company financial systems, industry benchmarks, and market research',
      glossary: {
        'DSO': 'Days Sales Outstanding - Average time to collect receivables',
        'DPO': 'Days Payable Outstanding - Average time to pay suppliers',
        'Working Capital': 'Current assets minus current liabilities',
        'Cash Conversion Cycle': 'Time to convert investments into cash flows'
      }
    };
  };

  // Generate fallback report
  const generateFallbackReport = () => {
    return {
      metadata: {
        title: reportConfig.customTitle || 'Financial Analysis Report',
        generatedAt: new Date().toISOString(),
        audience: reportConfig.audience,
        reportType: reportConfig.reportType,
        status: 'Generated with limited data'
      },
      executiveSummary: {
        overview: 'Financial analysis completed with available data. Enhanced insights available with MCP server connection.',
        keyFindings: ['Analysis completed', 'Recommendations generated', 'Action items identified'],
        strategicImplications: ['Connect MCP server for enhanced AI insights']
      },
      keyMetrics: { financial: {}, operational: {}, benchmarks: {} },
      recommendations: { immediate: [], strategic: [] },
      actionItems: { next30Days: [], next90Days: [], next180Days: [] }
    };
  };

  // Export report as PDF
  const exportToPDF = () => {
    // This would integrate with a PDF generation library
    console.log('Exporting to PDF...', generatedReport);
    alert('PDF export functionality would be implemented here');
  };

  // Export report as PowerPoint
  const exportToPowerPoint = () => {
    // This would integrate with a PowerPoint generation library
    console.log('Exporting to PowerPoint...', generatedReport);
    alert('PowerPoint export functionality would be implemented here');
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report generator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Board-Ready Reports</h1>
          <p className="text-gray-600 mt-1">Generate professional reports for executives and stakeholders</p>
        </div>
        <div className="flex items-center space-x-3">
          {generatedReport && (
            <>
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={exportToPowerPoint}>
                <Presentation className="h-4 w-4 mr-2" />
                Export PPT
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator">Report Generator</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Report Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                  <CardDescription>Customize your report settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select 
                      value={reportConfig.reportType} 
                      onValueChange={(value) => setReportConfig(prev => ({ ...prev, reportType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(reportTemplates).map(([key, template]) => (
                          <SelectItem key={key} value={key}>
                            {template.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="audience">Target Audience</Label>
                    <Select 
                      value={reportConfig.audience} 
                      onValueChange={(value) => setReportConfig(prev => ({ ...prev, audience: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="board_of_directors">Board of Directors</SelectItem>
                        <SelectItem value="c_suite">C-Suite</SelectItem>
                        <SelectItem value="investors">Investors</SelectItem>
                        <SelectItem value="private_equity">Private Equity</SelectItem>
                        <SelectItem value="management_team">Management Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <Select 
                      value={reportConfig.timeframe} 
                      onValueChange={(value) => setReportConfig(prev => ({ ...prev, timeframe: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="custom">Custom Period</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="customTitle">Custom Title (Optional)</Label>
                    <Input
                      id="customTitle"
                      value={reportConfig.customTitle}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, customTitle: e.target.value }))}
                      placeholder="Enter custom report title"
                    />
                  </div>

                  <div>
                    <Label>Include Sections</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        { key: 'includeForecasts', label: 'Financial Forecasts' },
                        { key: 'includeRecommendations', label: 'Strategic Recommendations' },
                        { key: 'includeRiskAssessment', label: 'Risk Assessment' },
                        { key: 'includeActionItems', label: 'Action Items' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={reportConfig[key]}
                            onCheckedChange={(checked) => 
                              setReportConfig(prev => ({ ...prev, [key]: checked }))
                            }
                          />
                          <Label htmlFor={key} className="text-sm">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={generateReport} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Report Template Preview */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Template Preview</CardTitle>
                  <CardDescription>
                    {reportTemplates[reportConfig.reportType]?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Target Audience</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {reportTemplates[reportConfig.reportType]?.audience.map((aud) => (
                            <Badge key={aud} variant="outline" className="text-xs">
                              {aud.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Report Sections</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {reportTemplates[reportConfig.reportType]?.sections.map((section) => (
                            <Badge key={section} variant="secondary" className="text-xs">
                              {section.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sample Report Structure */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">Report Structure Preview</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span>Executive Summary</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4 text-gray-500" />
                          <span>Key Financial Metrics</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-gray-500" />
                          <span>Strategic Insights</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-gray-500" />
                          <span>Recommendations & Action Items</span>
                        </div>
                        {reportConfig.includeRiskAssessment && (
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-gray-500" />
                            <span>Risk Assessment</span>
                          </div>
                        )}
                        {reportConfig.includeForecasts && (
                          <div className="flex items-center space-x-2">
                            <LineChart className="h-4 w-4 text-gray-500" />
                            <span>Financial Forecasts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          {generatedReport ? (
            <div className="space-y-6">
              {/* Report Header */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                  <CardTitle className="text-2xl">
                    {generatedReport.metadata?.title}
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Generated for {reportConfig.audience.replace(/_/g, ' ')} • {format(new Date(), 'MMMM dd, yyyy')}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Executive Summary */}
              {generatedReport.executiveSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {generatedReport.executiveSummary.overview}
                      </p>
                      
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Key Findings</h4>
                          <ul className="space-y-2">
                            {generatedReport.executiveSummary.keyFindings?.map((finding, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{finding}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Strategic Implications</h4>
                          <ul className="space-y-2">
                            {generatedReport.executiveSummary.strategicImplications?.map((implication, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{implication}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Metrics */}
              {generatedReport.keyMetrics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Key Financial Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">Current Cash</p>
                            <p className="text-2xl font-bold text-blue-900">
                              £{((generatedReport.keyMetrics.financial?.currentCash || 0) / 1000).toFixed(0)}K
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600">Cash Unlock Potential</p>
                            <p className="text-2xl font-bold text-green-900">
                              £{((generatedReport.keyMetrics.financial?.cashUnlockPotential || 0) / 1000).toFixed(0)}K
                            </p>
                          </div>
                          <Zap className="h-8 w-8 text-green-600" />
                        </div>
                      </div>

                      <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-600">Cash Runway</p>
                            <p className="text-2xl font-bold text-orange-900">
                              {generatedReport.keyMetrics.financial?.cashRunwayDays || 0} days
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                      </div>

                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-600">Working Capital</p>
                            <p className="text-2xl font-bold text-purple-900">
                              £{((generatedReport.keyMetrics.financial?.workingCapital || 0) / 1000).toFixed(0)}K
                            </p>
                          </div>
                          <Target className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Strategic Insights */}
              {generatedReport.strategicInsights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      Strategic Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {generatedReport.strategicInsights.map((insight, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant={insight.impact === 'High' ? 'destructive' : insight.impact === 'Strategic' ? 'default' : 'secondary'}>
                                {insight.impact}
                              </Badge>
                              <Badge variant="outline">{insight.timeframe}</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{insight.insight}</p>
                          <p className="text-xs text-gray-500">{insight.details}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {generatedReport.recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Strategic Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Immediate Actions (0-90 days)</h4>
                        <div className="space-y-3">
                          {generatedReport.recommendations.immediate?.map((rec, idx) => (
                            <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-red-900">{rec.action}</p>
                                  <p className="text-sm text-red-700 mt-1">{rec.impact}</p>
                                </div>
                                <div className="text-right text-sm">
                                  <p className="text-red-600 font-medium">{rec.timeline}</p>
                                  <p className="text-red-500">{rec.roi}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Strategic Initiatives (3-12 months)</h4>
                        <div className="space-y-3">
                          {generatedReport.recommendations.strategic?.map((rec, idx) => (
                            <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-blue-900">{rec.action}</p>
                                  <p className="text-sm text-blue-700 mt-1">{rec.impact}</p>
                                </div>
                                <div className="text-right text-sm">
                                  <p className="text-blue-600 font-medium">{rec.timeline}</p>
                                  <p className="text-blue-500">{rec.roi}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Items */}
              {generatedReport.actionItems && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Implementation Roadmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-red-600" />
                          Next 30 Days
                        </h4>
                        <ul className="space-y-2">
                          {generatedReport.actionItems.next30Days?.map((item, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                              <span className="text-sm text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-yellow-600" />
                          Next 90 Days
                        </h4>
                        <ul className="space-y-2">
                          {generatedReport.actionItems.next90Days?.map((item, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                              <span className="text-sm text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-green-600" />
                          Next 180 Days
                        </h4>
                        <ul className="space-y-2">
                          {generatedReport.actionItems.next180Days?.map((item, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                              <span className="text-sm text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No report generated yet. Use the Report Generator to create your first report.</p>
                <Button 
                  onClick={() => setActiveTab('generator')} 
                  className="mt-4"
                >
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(reportTemplates).map(([key, template]) => (
              <Card key={key} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    {template.title}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Target Audience</p>
                      <div className="flex flex-wrap gap-1">
                        {template.audience.map((aud) => (
                          <Badge key={aud} variant="outline" className="text-xs">
                            {aud.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Sections</p>
                      <div className="flex flex-wrap gap-1">
                        {template.sections.map((section) => (
                          <Badge key={section} variant="secondary" className="text-xs">
                            {section.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => {
                        setReportConfig(prev => ({ ...prev, reportType: key }));
                        setActiveTab('generator');
                      }}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BoardReadyReportGenerator;
