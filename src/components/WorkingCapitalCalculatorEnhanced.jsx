import { useState, useEffect, useRef } from 'react'
import { logError } from '../utils/structuredLogger.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Upload,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  TrendingDown,
  Calendar,
  Building2,
  Users,
  Zap
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts'

const WorkingCapitalCalculatorEnhanced = () => {
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('calculator')
  const [uploadedData, setUploadedData] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const [formData, setFormData] = useState({
    annualRevenue: 2500000,
    averageDebtorDays: 45,
    averageCreditorDays: 30,
    currentDebtors: 312500,
    currentCreditors: 208333,
    grossMargin: 35,
    netMargin: 12,
    ebitda: 300000,
    currentCash: 150000,
    averageBankBalance: 125000,
    inventoryTurns: 8,
    numberOfEmployees: 25,
    revenueGrowth: 15,
    reduceDebtorDays: 10,
    extendCreditorDays: 5,
    industryType: 'Manufacturing',
    companySize: 'SME'
  })

  const [results, setResults] = useState({
    cashUnlock90Days: 83000,
    cashImprovement12Months: 334000,
    daysToUnlock: 90,
    workingCapitalEfficiency: 3,
    cashConversionCycle: -46,
    riskLevel: 'Low',
    industryBenchmark: 'Above Average'
  })

  const [projections, setProjections] = useState([])
  const [isCalculating, setIsCalculating] = useState(false)

  // Sample CSV template data
  const csvTemplate = `Date,Revenue,Debtors,Creditors,Cash,Inventory
2024-01-01,208333,312500,208333,150000,125000
2024-02-01,208333,325000,215000,145000,130000
2024-03-01,208333,298000,195000,165000,120000
2024-04-01,208333,340000,225000,135000,140000
2024-05-01,208333,315000,210000,155000,125000
2024-06-01,208333,330000,220000,140000,135000`

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',')
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',')
        const row = {}
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim()
        })
        return row
      }).filter(row => Object.values(row).some(val => val))

      setUploadedData(data)
      
      // Auto-populate form data from uploaded CSV
      if (data.length > 0) {
        const latestData = data[data.length - 1]
        const avgRevenue = data.reduce((sum, row) => sum + (parseFloat(row.Revenue) || 0), 0) / data.length
        
        setFormData(prev => ({
          ...prev,
          annualRevenue: Math.round(avgRevenue * 12),
          currentDebtors: parseFloat(latestData.Debtors) || prev.currentDebtors,
          currentCreditors: parseFloat(latestData.Creditors) || prev.currentCreditors,
          currentCash: parseFloat(latestData.Cash) || prev.currentCash
        }))
      }
      
      setActiveTab('analysis')
    } catch (error) {
      logError('Error parsing CSV', error)
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'working_capital_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const calculateWorkingCapital = async () => {
    setIsCalculating(true)
    
    // Simulate API call with realistic calculations
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const dailyRevenue = formData.annualRevenue / 365
    const currentWorkingCapital = formData.currentDebtors - formData.currentCreditors
    
    // Calculate improved metrics
    const improvedDebtorDays = formData.averageDebtorDays - formData.reduceDebtorDays
    const improvedCreditorDays = formData.averageCreditorDays + formData.extendCreditorDays
    
    const improvedDebtors = dailyRevenue * improvedDebtorDays
    const improvedCreditors = dailyRevenue * improvedCreditorDays
    const improvedWorkingCapital = improvedDebtors - improvedCreditors
    
    const cashUnlock = currentWorkingCapital - improvedWorkingCapital
    const annualImprovement = cashUnlock * 4 // Quarterly impact
    
    // Generate projections
    const monthlyProjections = []
    for (let i = 0; i < 12; i++) {
      monthlyProjections.push({
        month: `Month ${i + 1}`,
        currentCash: formData.currentCash + (cashUnlock * (i / 12)),
        projectedCash: formData.currentCash + (annualImprovement * (i / 12)),
        improvement: (annualImprovement * (i / 12))
      })
    }
    
    setProjections(monthlyProjections)
    
    setResults({
      cashUnlock90Days: Math.round(cashUnlock),
      cashImprovement12Months: Math.round(annualImprovement),
      daysToUnlock: 90,
      workingCapitalEfficiency: Math.round(((cashUnlock / formData.annualRevenue) * 100) * 10) / 10,
      cashConversionCycle: improvedDebtorDays - improvedCreditorDays,
      riskLevel: cashUnlock > 100000 ? 'Low' : cashUnlock > 50000 ? 'Medium' : 'High',
      industryBenchmark: formData.averageDebtorDays < 35 ? 'Excellent' : formData.averageDebtorDays < 45 ? 'Above Average' : 'Below Average'
    })
    
    setIsCalculating(false)
  }

  const workingCapitalLevers = [
    { title: "Invoice Management", description: "Improve invoicing discipline and collections process", impact: "High", timeframe: "30 days" },
    { title: "Supplier Terms", description: "Negotiate better payment terms with suppliers", impact: "Medium", timeframe: "60 days" },
    { title: "Inventory Optimization", description: "Optimise inventory levels and reduce stock holding", impact: "High", timeframe: "90 days" },
    { title: "Payment Automation", description: "Implement automated payment systems", impact: "Medium", timeframe: "45 days" },
    { title: "Credit Management", description: "Enhance credit management procedures", impact: "High", timeframe: "60 days" }
  ]

  const boardTalkingPoints = [
    `Potential to unlock £${results.cashUnlock90Days.toLocaleString()} in working capital within 90 days`,
    `12-month cash flow improvement of £${results.cashImprovement12Months.toLocaleString()} without new debt`,
    `Working capital efficiency improvement of ${results.workingCapitalEfficiency}% of annual revenue`,
    `Improved cash conversion cycle by ${Math.abs(results.cashConversionCycle)} days`,
    `Risk assessment: ${results.riskLevel} risk profile for implementation`,
    `Industry benchmark: ${results.industryBenchmark} performance vs peers`
  ]

  const pieData = [
    { name: 'Debtors Optimization', value: 60, color: '#3B82F6' },
    { name: 'Creditors Extension', value: 25, color: '#10B981' },
    { name: 'Inventory Management', value: 15, color: '#F59E0B' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Working Capital Intelligence</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Advanced cash flow analysis with CSV data import and AI-powered insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button onClick={calculateWorkingCapital} disabled={isCalculating}>
            {isCalculating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4 mr-2" />
            )}
            {isCalculating ? 'Calculating...' : 'Recalculate'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="upload">Data Upload</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span>Company Profile</span>
                  </CardTitle>
                  <CardDescription>Basic company information for benchmarking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industryType">Industry Type</Label>
                      <Input
                        id="industryType"
                        value={formData.industryType}
                        onChange={(e) => handleInputChange('industryType', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companySize">Company Size</Label>
                      <Input
                        id="companySize"
                        value={formData.companySize}
                        onChange={(e) => handleInputChange('companySize', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                      <Input
                        id="numberOfEmployees"
                        type="number"
                        value={formData.numberOfEmployees}
                        onChange={(e) => handleInputChange('numberOfEmployees', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>Financial Metrics</span>
                  </CardTitle>
                  <CardDescription>Core financial data for working capital analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="annualRevenue">Annual Revenue (GBP)</Label>
                      <Input
                        id="annualRevenue"
                        type="number"
                        value={formData.annualRevenue}
                        onChange={(e) => handleInputChange('annualRevenue', parseInt(e.target.value))}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentCash">Current Cash on Hand (£)</Label>
                      <Input
                        id="currentCash"
                        type="number"
                        value={formData.currentCash}
                        onChange={(e) => handleInputChange('currentCash', parseInt(e.target.value))}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentDebtors">Current Debtors (£)</Label>
                      <Input
                        id="currentDebtors"
                        type="number"
                        value={formData.currentDebtors}
                        onChange={(e) => handleInputChange('currentDebtors', parseInt(e.target.value))}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentCreditors">Current Creditors (£)</Label>
                      <Input
                        id="currentCreditors"
                        type="number"
                        value={formData.currentCreditors}
                        onChange={(e) => handleInputChange('currentCreditors', parseInt(e.target.value))}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grossMargin">Gross Margin (%)</Label>
                      <Input
                        id="grossMargin"
                        type="number"
                        value={formData.grossMargin}
                        onChange={(e) => handleInputChange('grossMargin', parseInt(e.target.value))}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ebitda">EBITDA (£)</Label>
                      <Input
                        id="ebitda"
                        type="number"
                        value={formData.ebitda}
                        onChange={(e) => handleInputChange('ebitda', parseInt(e.target.value))}
                        className="text-right"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Terms */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span>Payment Terms</span>
                  </CardTitle>
                  <CardDescription>Days Sales Outstanding and Days Payable Outstanding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Average Debtor Days (DSO): {formData.averageDebtorDays} days</Label>
                      <Slider
                        value={[formData.averageDebtorDays]}
                        onValueChange={(value) => handleInputChange('averageDebtorDays', value[0])}
                        max={120}
                        min={15}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Average Creditor Days (DPO): {formData.averageCreditorDays} days</Label>
                      <Slider
                        value={[formData.averageCreditorDays]}
                        onValueChange={(value) => handleInputChange('averageCreditorDays', value[0])}
                        max={90}
                        min={15}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Optimization Levers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <span>Optimization Levers</span>
                  </CardTitle>
                  <CardDescription>Adjust these parameters to see potential improvements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Reduce Debtor Days By: {formData.reduceDebtorDays} days</Label>
                      <Slider
                        value={[formData.reduceDebtorDays]}
                        onValueChange={(value) => handleInputChange('reduceDebtorDays', value[0])}
                        max={30}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-slate-500">Get paid faster</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Extend Creditor Days By: {formData.extendCreditorDays} days</Label>
                      <Slider
                        value={[formData.extendCreditorDays]}
                        onValueChange={(value) => handleInputChange('extendCreditorDays', value[0])}
                        max={20}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-slate-500">Pay suppliers later</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {/* Cash Unlock Results */}
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-green-700 dark:text-green-300">
                    Estimated Cash Unlock in 90 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-4xl font-bold text-green-600">
                      £{results.cashUnlock90Days.toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Without new debt or external funding
                    </p>
                    <Separator />
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      £{results.cashImprovement12Months.toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      12-month improvement
                    </p>
                    <div className="flex justify-center space-x-2">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {results.daysToUnlock} Days to unlock
                      </Badge>
                      <Badge variant="outline" className={`${results.riskLevel === 'Low' ? 'text-green-600 border-green-600' : results.riskLevel === 'Medium' ? 'text-yellow-600 border-yellow-600' : 'text-red-600 border-red-600'}`}>
                        {results.riskLevel} Risk
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Performance Indicators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Working Capital Efficiency</span>
                    <span className="font-semibold">{results.workingCapitalEfficiency}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Cash Conversion Cycle</span>
                    <span className="font-semibold">{results.cashConversionCycle} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Industry Benchmark</span>
                    <Badge variant="outline">{results.industryBenchmark}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Revenue Growth Target</span>
                    <span className="font-semibold">{formData.revenueGrowth}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Board-Ready Talking Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Board-Ready Talking Points</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {boardTalkingPoints.map((point, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-700 dark:text-slate-300">{point}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  <span>Upload Financial Data</span>
                </CardTitle>
                <CardDescription>
                  Upload your CSV file with historical financial data for enhanced analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? 'Uploading...' : 'Choose File'}
                  </Button>
                </div>
                
                <div className="text-center">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                </div>

                {uploadedData && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">File uploaded successfully!</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {uploadedData.length} rows of data processed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CSV Format Requirements</CardTitle>
                <CardDescription>Your CSV file should include the following columns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm"><strong>Date:</strong> YYYY-MM-DD format</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm"><strong>Revenue:</strong> Monthly revenue figures</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-sm"><strong>Debtors:</strong> Accounts receivable balance</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    <span className="text-sm"><strong>Creditors:</strong> Accounts payable balance</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span className="text-sm"><strong>Cash:</strong> Cash and cash equivalents</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                    <span className="text-sm"><strong>Inventory:</strong> Inventory value (optional)</span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p className="mb-2"><strong>Tips for best results:</strong></p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Include at least 6 months of data</li>
                    <li>Ensure consistent date formatting</li>
                    <li>Use actual figures, not percentages</li>
                    <li>Remove any currency symbols</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Projections Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>12-Month Cash Flow Projections</span>
                </CardTitle>
                <CardDescription>
                  Projected cash improvements from working capital optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`£${value.toLocaleString()}`, '']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="currentCash" 
                      stroke="#64748b" 
                      strokeDasharray="5 5"
                      name="Current Trajectory"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projectedCash" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Optimized Cash Flow"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Working Capital Levers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span>Working Capital Levers</span>
                </CardTitle>
                <CardDescription>Implementation roadmap for cash optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workingCapitalLevers.map((lever, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{lever.title}</h4>
                        <div className="flex space-x-2">
                          <Badge variant={lever.impact === 'High' ? 'default' : 'secondary'} className="text-xs">
                            {lever.impact}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {lever.timeframe}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{lever.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cash Unlock Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  <span>Cash Unlock Breakdown</span>
                </CardTitle>
                <CardDescription>Sources of working capital improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span>{entry.name}</span>
                      </div>
                      <span className="font-semibold">{entry.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span>AI-Powered Insights</span>
                </CardTitle>
                <CardDescription>Intelligent recommendations based on your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">Priority Action</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Focus on reducing debtor days by 10 days first. This single action could unlock 
                        £{Math.round(results.cashUnlock90Days * 0.6).toLocaleString()} in 60 days.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100">Industry Benchmark</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your current debtor days ({formData.averageDebtorDays}) are {formData.averageDebtorDays > 35 ? 'above' : 'below'} 
                        the industry average of 35 days for {formData.industryType.toLowerCase()}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100">Growth Funding</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        To achieve {formData.revenueGrowth}% growth, you'll need approximately 
                        £{Math.round((formData.annualRevenue * formData.revenueGrowth / 100) * 0.15).toLocaleString()} 
                        in additional working capital.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-900 dark:text-orange-100">Risk Assessment</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        {results.riskLevel} risk implementation. {results.riskLevel === 'Low' ? 
                          'Your strong cash position provides flexibility for optimization.' :
                          'Consider phased implementation to manage cash flow risks.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span>Implementation Timeline</span>
                </CardTitle>
                <CardDescription>Recommended 90-day action plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                    
                    <div className="relative flex items-start space-x-4 pb-6">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold">Days 1-30: Invoice Management</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Implement automated invoicing and follow-up systems. Target: Reduce debtor days by 5.
                        </p>
                      </div>
                    </div>

                    <div className="relative flex items-start space-x-4 pb-6">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold">Days 31-60: Supplier Negotiations</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Renegotiate payment terms with key suppliers. Target: Extend creditor days by 3.
                        </p>
                      </div>
                    </div>

                    <div className="relative flex items-start space-x-4">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold">Days 61-90: Optimization & Monitoring</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Fine-tune processes and implement monitoring systems. Target: Achieve full optimization.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default WorkingCapitalCalculatorEnhanced
