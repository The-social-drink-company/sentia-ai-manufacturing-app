import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

const WorkingCapitalCalculator = () => {
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
    extendCreditorDays: 5
  })

  const [results, setResults] = useState({
    cashUnlock90Days: 83000,
    cashImprovement12Months: 334000,
    daysToUnlock: 90,
    workingCapitalEfficiency: 3,
    cashConversionCycle: -46
  })

  const [isCalculating, setIsCalculating] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
    
    setResults({
      cashUnlock90Days: Math.round(cashUnlock),
      cashImprovement12Months: Math.round(annualImprovement),
      daysToUnlock: 90,
      workingCapitalEfficiency: Math.round(((cashUnlock / formData.annualRevenue) * 100) * 10) / 10,
      cashConversionCycle: improvedDebtorDays - improvedCreditorDays
    })
    
    setIsCalculating(false)
  }

  const workingCapitalLevers = [
    "Improve invoicing discipline and collections process",
    "Negotiate better payment terms with suppliers",
    "Optimise inventory levels and reduce stock holding",
    "Implement automated payment systems",
    "Enhance credit management procedures"
  ]

  const boardTalkingPoints = [
    `Potential to unlock £${results.cashUnlock90Days.toLocaleString()} in working capital within 90 days`,
    `12-month cash flow improvement of £${results.cashImprovement12Months.toLocaleString()} without new debt`,
    `Working capital efficiency improvement of ${results.workingCapitalEfficiency}% of annual revenue`,
    `Improved cash conversion cycle by ${results.cashConversionCycle} days`
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Working Capital Calculator</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Advanced cash flow analysis and optimization recommendations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-6">
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
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {results.daysToUnlock} Days to unlock
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Working Capital Levers */}
          <Card>
            <CardHeader>
              <CardTitle>Working Capital Levers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workingCapitalLevers.map((lever, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700 dark:text-slate-300">{lever}</p>
                  </div>
                ))}
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
    </div>
  )
}

export default WorkingCapitalCalculator
