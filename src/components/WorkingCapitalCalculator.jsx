import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calculator, 
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'

const WorkingCapitalCalculator = () => {
  const [inputs, setInputs] = useState({
    currentAssets: 2500000,
    currentLiabilities: 1800000,
    debtorDays: 45,
    creditorDays: 30,
    inventoryDays: 60,
    annualRevenue: 12000000,
    costOfGoods: 8000000
  })

  const [optimizations, setOptimizations] = useState({
    targetDebtorDays: 35,
    targetCreditorDays: 35,
    targetInventoryDays: 45
  })

  const [results, setResults] = useState({})

  // Calculate working capital metrics
  useEffect(() => {
    const calculateMetrics = () => {
      const currentWC = inputs.currentAssets - inputs.currentLiabilities
      const dailyRevenue = inputs.annualRevenue / 365
      const dailyCOGS = inputs.costOfGoods / 365

      // Current position
      const currentDebtors = dailyRevenue * inputs.debtorDays
      const currentCreditors = dailyCOGS * inputs.creditorDays
      const currentInventory = dailyCOGS * inputs.inventoryDays

      // Optimized position
      const optimizedDebtors = dailyRevenue * optimizations.targetDebtorDays
      const optimizedCreditors = dailyCOGS * optimizations.targetCreditorDays
      const optimizedInventory = dailyCOGS * optimizations.targetInventoryDays

      // Cash impact
      const debtorImprovement = currentDebtors - optimizedDebtors
      const creditorImprovement = optimizedCreditors - currentCreditors
      const inventoryImprovement = currentInventory - optimizedInventory

      const totalCashUnlock = debtorImprovement + creditorImprovement + inventoryImprovement
      const optimizedWC = currentWC - totalCashUnlock

      // Calculate percentages
      const wcRatio = (currentWC / inputs.currentAssets) * 100
      const optimizedWCRatio = (optimizedWC / inputs.currentAssets) * 100
      const improvementPercentage = ((totalCashUnlock / currentWC) * 100)

      setResults({
        currentWC,
        optimizedWC,
        totalCashUnlock,
        wcRatio,
        optimizedWCRatio,
        improvementPercentage,
        debtorImprovement,
        creditorImprovement,
        inventoryImprovement,
        currentDebtors,
        currentCreditors,
        currentInventory,
        optimizedDebtors,
        optimizedCreditors,
        optimizedInventory
      })
    }

    calculateMetrics()
  }, [inputs, optimizations])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }))
  }

  const handleOptimizationChange = (field, value) => {
    setOptimizations(prev => ({
      ...prev,
      [field]: value[0]
    }))
  }

  const resetToDefaults = () => {
    setInputs({
      currentAssets: 2500000,
      currentLiabilities: 1800000,
      debtorDays: 45,
      creditorDays: 30,
      inventoryDays: 60,
      annualRevenue: 12000000,
      costOfGoods: 8000000
    })
    setOptimizations({
      targetDebtorDays: 35,
      targetCreditorDays: 35,
      targetInventoryDays: 45
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Working Capital Calculator
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Advanced cash flow analysis and optimization recommendations
        </p>
      </div>

      {/* Results Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(results.totalCashUnlock || 0)}
              </h3>
              <p className="text-slate-600">Potential Cash Unlock</p>
              <Badge variant="outline" className="mt-2 bg-green-100 text-green-700">
                {(results.improvementPercentage || 0).toFixed(1)}% improvement
              </Badge>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-600 mb-2">
                {formatCurrency(results.currentWC || 0)}
              </h3>
              <p className="text-slate-600">Current Working Capital</p>
              <p className="text-sm text-slate-500 mt-1">
                {(results.wcRatio || 0).toFixed(1)}% of current assets
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-purple-600 mb-2">
                {formatCurrency(results.optimizedWC || 0)}
              </h3>
              <p className="text-slate-600">Optimized Working Capital</p>
              <p className="text-sm text-slate-500 mt-1">
                {(results.optimizedWCRatio || 0).toFixed(1)}% of current assets
              </p>
            </div>
          </div>
          <Progress value={results.improvementPercentage || 0} className="mt-6 h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="inputs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inputs">Current Position</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Current Position Tab */}
        <TabsContent value="inputs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet Data</CardTitle>
                <CardDescription>Enter your current financial position</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentAssets">Current Assets (£)</Label>
                  <Input
                    id="currentAssets"
                    type="number"
                    value={inputs.currentAssets}
                    onChange={(e) => handleInputChange('currentAssets', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="currentLiabilities">Current Liabilities (£)</Label>
                  <Input
                    id="currentLiabilities"
                    type="number"
                    value={inputs.currentLiabilities}
                    onChange={(e) => handleInputChange('currentLiabilities', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="annualRevenue">Annual Revenue (£)</Label>
                  <Input
                    id="annualRevenue"
                    type="number"
                    value={inputs.annualRevenue}
                    onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="costOfGoods">Cost of Goods Sold (£)</Label>
                  <Input
                    id="costOfGoods"
                    type="number"
                    value={inputs.costOfGoods}
                    onChange={(e) => handleInputChange('costOfGoods', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Working Capital Components</CardTitle>
                <CardDescription>Current payment terms and inventory levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="debtorDays">Debtor Days</Label>
                  <Input
                    id="debtorDays"
                    type="number"
                    value={inputs.debtorDays}
                    onChange={(e) => handleInputChange('debtorDays', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Current: {formatCurrency(results.currentDebtors || 0)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="creditorDays">Creditor Days</Label>
                  <Input
                    id="creditorDays"
                    type="number"
                    value={inputs.creditorDays}
                    onChange={(e) => handleInputChange('creditorDays', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Current: {formatCurrency(results.currentCreditors || 0)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="inventoryDays">Inventory Days</Label>
                  <Input
                    id="inventoryDays"
                    type="number"
                    value={inputs.inventoryDays}
                    onChange={(e) => handleInputChange('inventoryDays', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Current: {formatCurrency(results.currentInventory || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Targets</CardTitle>
              <CardDescription>Adjust targets to see potential cash impact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Target Debtor Days: {optimizations.targetDebtorDays}</Label>
                  <Slider
                    value={[optimizations.targetDebtorDays]}
                    onValueChange={(value) => handleOptimizationChange('targetDebtorDays', value)}
                    max={60}
                    min={15}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>15 days</span>
                    <span>60 days</span>
                  </div>
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <p className="text-sm">
                      Cash Impact: {formatCurrency(results.debtorImprovement || 0)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Target Creditor Days: {optimizations.targetCreditorDays}</Label>
                  <Slider
                    value={[optimizations.targetCreditorDays]}
                    onValueChange={(value) => handleOptimizationChange('targetCreditorDays', value)}
                    max={60}
                    min={15}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>15 days</span>
                    <span>60 days</span>
                  </div>
                  <div className="mt-2 p-2 bg-green-50 rounded">
                    <p className="text-sm">
                      Cash Impact: {formatCurrency(results.creditorImprovement || 0)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Target Inventory Days: {optimizations.targetInventoryDays}</Label>
                  <Slider
                    value={[optimizations.targetInventoryDays]}
                    onValueChange={(value) => handleOptimizationChange('targetInventoryDays', value)}
                    max={90}
                    min={20}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>20 days</span>
                    <span>90 days</span>
                  </div>
                  <div className="mt-2 p-2 bg-purple-50 rounded">
                    <p className="text-sm">
                      Cash Impact: {formatCurrency(results.inventoryImprovement || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current vs Optimized</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span>Debtor Days</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600">{inputs.debtorDays}</span>
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">{optimizations.targetDebtorDays}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span>Creditor Days</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600">{inputs.creditorDays}</span>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">{optimizations.targetCreditorDays}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span>Inventory Days</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600">{inputs.inventoryDays}</span>
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">{optimizations.targetInventoryDays}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Debtor Reduction</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(results.debtorImprovement || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Creditor Extension</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(results.creditorImprovement || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Inventory Optimization</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(results.inventoryImprovement || 0)}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Cash Unlock</span>
                    <span className="text-green-600">
                      {formatCurrency(results.totalCashUnlock || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Quick Wins (30 days)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Implement early payment discounts</p>
                      <p className="text-sm text-slate-600">Offer 2% discount for payments within 10 days</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Automate invoice processing</p>
                      <p className="text-sm text-slate-600">Reduce invoice processing time by 50%</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Review slow-moving inventory</p>
                      <p className="text-sm text-slate-600">Identify and liquidate excess stock</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Medium Term (90 days)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Negotiate extended payment terms</p>
                      <p className="text-sm text-slate-600">Work with suppliers to extend payment periods</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Implement just-in-time inventory</p>
                      <p className="text-sm text-slate-600">Reduce inventory holding costs</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Customer credit management</p>
                      <p className="text-sm text-slate-600">Implement stricter credit controls</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={resetToDefaults} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Full Report
        </Button>
        <Button>
          <Calculator className="h-4 w-4 mr-2" />
          Save Scenario
        </Button>
      </div>
    </div>
  )
}

export default WorkingCapitalCalculator
