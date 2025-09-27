import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Factory,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Settings,
  Lightbulb,
  ArrowRight,
  Star,
  Filter
} from 'lucide-react'

const AIInsights = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [insights, setInsights] = useState([])
  const [metrics, setMetrics] = useState({})

  // Simulate AI insights data
  useEffect(() => {
    const generateInsights = () => {
      const allInsights = [
        {
          id: 1,
          category: 'production',
          title: 'Machine Scheduling Optimization',
          description: 'AI analysis shows 15% downtime reduction possible through optimized scheduling',
          impact: 'high',
          confidence: 92,
          savings: 89000,
          timeframe: '30 days',
          status: 'new',
          recommendation: 'Implement dynamic scheduling algorithm to reduce machine idle time',
          details: 'Current scheduling shows 18% machine downtime. AI modeling suggests optimal scheduling could reduce this to 3%, improving overall equipment effectiveness.',
          actions: [
            'Deploy AI scheduling system',
            'Train operators on new protocols',
            'Monitor performance metrics'
          ]
        },
        {
          id: 2,
          category: 'inventory',
          title: 'Inventory Level Optimization',
          description: 'Reduce excess inventory by 20% while maintaining 99.5% service levels',
          impact: 'high',
          confidence: 85,
          savings: 67000,
          timeframe: '60 days',
          status: 'in-progress',
          recommendation: 'Implement just-in-time inventory management with AI demand forecasting',
          details: 'Current inventory turnover is 4.2x annually. AI forecasting can optimize stock levels to achieve 5.8x turnover while maintaining service quality.',
          actions: [
            'Deploy demand forecasting model',
            'Adjust reorder points',
            'Implement supplier integration'
          ]
        },
        {
          id: 3,
          category: 'quality',
          title: 'Predictive Quality Control',
          description: 'Reduce defect rates by 35% through predictive quality monitoring',
          impact: 'medium',
          confidence: 78,
          savings: 45000,
          timeframe: '45 days',
          status: 'new',
          recommendation: 'Install IoT sensors for real-time quality monitoring and prediction',
          details: 'Current defect rate is 2.8%. Machine learning models can predict quality issues before they occur, reducing defects to 1.8%.',
          actions: [
            'Install quality sensors',
            'Train ML prediction models',
            'Integrate with production systems'
          ]
        },
        {
          id: 4,
          category: 'energy',
          title: 'Energy Consumption Optimization',
          description: 'Reduce energy costs by 12% through intelligent power management',
          impact: 'medium',
          confidence: 88,
          savings: 28000,
          timeframe: '90 days',
          status: 'new',
          recommendation: 'Implement smart energy management system with load balancing',
          details: 'Peak energy usage occurs during 2-4 PM daily. Load shifting and smart scheduling can reduce peak demand charges significantly.',
          actions: [
            'Install smart meters',
            'Implement load balancing',
            'Optimize production schedules'
          ]
        },
        {
          id: 5,
          category: 'maintenance',
          title: 'Predictive Maintenance Program',
          description: 'Prevent 85% of unplanned downtime through predictive maintenance',
          impact: 'high',
          confidence: 94,
          savings: 125000,
          timeframe: '120 days',
          status: 'recommended',
          recommendation: 'Deploy IoT sensors and ML models for equipment health monitoring',
          details: 'Current unplanned downtime costs £147,000 annually. Predictive maintenance can reduce this by 85% through early failure detection.',
          actions: [
            'Install vibration sensors',
            'Deploy ML health models',
            'Train maintenance team'
          ]
        }
      ]

      const filteredInsights = selectedCategory === 'all' 
        ? allInsights 
        : allInsights.filter(insight => insight.category === selectedCategory)

      setInsights(filteredInsights)

      // Calculate metrics
      const totalSavings = allInsights.reduce((sum, insight) => sum + insight.savings, 0)
      const avgConfidence = allInsights.reduce((sum, insight) => sum + insight.confidence, 0) / allInsights.length
      const highImpactCount = allInsights.filter(insight => insight.impact === 'high').length
      const implementableCount = allInsights.filter(insight => insight.timeframe !== '120 days').length

      setMetrics({
        totalSavings,
        avgConfidence,
        highImpactCount,
        implementableCount,
        totalInsights: allInsights.length
      })
    }

    generateInsights()
  }, [selectedCategory])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'in-progress': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'recommended': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'production': return <Factory className="h-5 w-5" />
      case 'inventory': return <BarChart3 className="h-5 w-5" />
      case 'quality': return <Target className="h-5 w-5" />
      case 'energy': return <Zap className="h-5 w-5" />
      case 'maintenance': return <Settings className="h-5 w-5" />
      default: return <Brain className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          AI Manufacturing Insights
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Intelligent recommendations powered by machine learning and data analytics
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Savings Potential</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(metrics.totalSavings || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Across all recommendations</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">AI Confidence</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(metrics.avgConfidence || 0)}%
                </p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Average prediction accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">High Impact Items</p>
                <p className="text-2xl font-bold text-purple-600">
                  {metrics.highImpactCount || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Priority recommendations</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Quick Wins</p>
                <p className="text-2xl font-bold text-orange-600">
                  {metrics.implementableCount || 0}
                </p>
              </div>
              <Lightbulb className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Implementable in 90 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Insight Categories</span>
              </CardTitle>
              <CardDescription>Filter insights by manufacturing area</CardDescription>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Insights</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.map((insight) => (
          <Card key={insight.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(insight.category)}
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                </div>
                <div className="flex space-x-2">
                  <Badge className={getImpactColor(insight.impact)}>
                    {insight.impact} impact
                  </Badge>
                  <Badge className={getStatusColor(insight.status)}>
                    {insight.status}
                  </Badge>
                </div>
              </div>
              <CardDescription>{insight.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-slate-600">Savings</p>
                    <p className="font-bold text-green-600">
                      {formatCurrency(insight.savings)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Confidence</p>
                    <p className="font-bold text-blue-600">{insight.confidence}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Timeline</p>
                    <p className="font-bold text-purple-600">{insight.timeframe}</p>
                  </div>
                </div>

                {/* Confidence Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>AI Confidence Level</span>
                    <span>{insight.confidence}%</span>
                  </div>
                  <Progress value={insight.confidence} className="h-2" />
                </div>

                {/* Recommendation */}
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Recommendation:
                  </p>
                  <p className="text-sm text-slate-600">{insight.recommendation}</p>
                </div>

                {/* Action Items */}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Key Actions:</p>
                  <div className="space-y-1">
                    {insight.actions.map((action, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-slate-600">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" className="flex-1">
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Implement
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Learn More
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Star className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Implementation Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Roadmap</CardTitle>
          <CardDescription>Recommended timeline for deploying AI insights</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="30days" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="30days">30 Days</TabsTrigger>
              <TabsTrigger value="60days">60 Days</TabsTrigger>
              <TabsTrigger value="90days">90 Days</TabsTrigger>
              <TabsTrigger value="120days">120+ Days</TabsTrigger>
            </TabsList>
            
            <TabsContent value="30days" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Machine Scheduling Optimization</p>
                    <p className="text-sm text-slate-600">Quick implementation, high impact</p>
                  </div>
                  <Badge className="ml-auto">$89K savings</Badge>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="60days" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Inventory Level Optimization</p>
                    <p className="text-sm text-slate-600">Moderate complexity, high ROI</p>
                  </div>
                  <Badge className="ml-auto">$67K savings</Badge>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="90days" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Quality Control & Energy Optimization</p>
                    <p className="text-sm text-slate-600">Combined implementation for efficiency</p>
                  </div>
                  <Badge className="ml-auto">$73K savings</Badge>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="120days" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Predictive Maintenance Program</p>
                    <p className="text-sm text-slate-600">Complex but highest impact initiative</p>
                  </div>
                  <Badge className="ml-auto">$125K savings</Badge>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Center */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button>
          <TrendingUp className="h-4 w-4 mr-2" />
          Generate Implementation Plan
        </Button>
        <Button variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Export Insights Report
        </Button>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Configure AI Models
        </Button>
      </div>
    </div>
  )
}

export default AIInsights
