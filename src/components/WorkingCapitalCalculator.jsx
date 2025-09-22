import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { 
  Calculator, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
  Target,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  ArrowRight
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const WorkingCapitalCalculator = () => {
  const [activeTab, setActiveTab] = useState('calculator');
  const [formData, setFormData] = useState({
    currentAssets: '',
    currentLiabilities: '',
    inventory: '',
    accountsReceivable: '',
    accountsPayable: '',
    cashEquivalents: '',
    revenue: '',
    cogs: '',
    targetGrowth: ''
  });
  const [results, setResults] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // CSV Upload Handler
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          setCsvData(result.data);
          // Auto-populate form if CSV has the right structure
          if (result.data.length > 1) {
            const headers = result.data[0];
            const values = result.data[1];
            const newFormData = { ...formData };
            
            headers.forEach((header, index) => {
              const normalizedHeader = header.toLowerCase().replace(/\s+/g, '');
              if (normalizedHeader.includes('currentassets')) newFormData.currentAssets = values[index];
              if (normalizedHeader.includes('currentliabilities')) newFormData.currentLiabilities = values[index];
              if (normalizedHeader.includes('inventory')) newFormData.inventory = values[index];
              if (normalizedHeader.includes('accountsreceivable')) newFormData.accountsReceivable = values[index];
              if (normalizedHeader.includes('accountspayable')) newFormData.accountsPayable = values[index];
              if (normalizedHeader.includes('revenue')) newFormData.revenue = values[index];
              if (normalizedHeader.includes('cogs')) newFormData.cogs = values[index];
            });
            
            setFormData(newFormData);
          }
        },
        header: false,
        skipEmptyLines: true
      });
    }
  }, [formData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  // Download CSV Template
  const downloadTemplate = () => {
    const template = `Current Assets,Current Liabilities,Inventory,Accounts Receivable,Accounts Payable,Cash & Equivalents,Annual Revenue,Cost of Goods Sold,Target Growth %
400000,200000,150000,100000,80000,50000,1200000,800000,15`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'working-capital-template.csv');
  };

  // Calculate Working Capital Metrics
  const calculateMetrics = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const currentAssets = parseFloat(formData.currentAssets) || 0;
      const currentLiabilities = parseFloat(formData.currentLiabilities) || 0;
      const inventory = parseFloat(formData.inventory) || 0;
      const accountsReceivable = parseFloat(formData.accountsReceivable) || 0;
      const accountsPayable = parseFloat(formData.accountsPayable) || 0;
      const revenue = parseFloat(formData.revenue) || 0;
      const cogs = parseFloat(formData.cogs) || 0;
      const targetGrowth = parseFloat(formData.targetGrowth) || 0;

      // Core Calculations
      const workingCapital = currentAssets - currentLiabilities;
      const workingCapitalRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
      
      // Days calculations
      const dso = revenue > 0 ? (accountsReceivable * 365) / revenue : 0;
      const dio = cogs > 0 ? (inventory * 365) / cogs : 0;
      const dpo = cogs > 0 ? (accountsPayable * 365) / cogs : 0;
      const cashConversionCycle = dso + dio - dpo;

      // Optimization calculations
      const industryBenchmarks = {
        dso: 35,
        dio: 28,
        dpo: 18,
        workingCapitalRatio: 1.5
      };

      const optimizedDSO = Math.min(dso, industryBenchmarks.dso);
      const optimizedDIO = Math.min(dio, industryBenchmarks.dio);
      const optimizedDPO = Math.max(dpo, industryBenchmarks.dpo);
      const optimizedCCC = optimizedDSO + optimizedDIO - optimizedDPO;

      // Cash impact calculations
      const dsoImprovement = (dso - optimizedDSO) * (revenue / 365);
      const dioImprovement = (dio - optimizedDIO) * (cogs / 365);
      const dpoImprovement = (optimizedDPO - dpo) * (cogs / 365);
      const totalCashUnlock = dsoImprovement + dioImprovement + dpoImprovement;

      // Growth funding requirements
      const growthFunding = targetGrowth > 0 ? (workingCapital * targetGrowth) / 100 : 0;

      // Generate projections
      const projections = [];
      for (let i = 1; i <= 12; i++) {
        projections.push({
          month: `Month ${i}`,
          current: workingCapital + (i * 1000),
          optimized: workingCapital + totalCashUnlock + (i * 800),
          target: workingCapital + (totalCashUnlock * 0.8) + (i * 900)
        });
      }

      setResults({
        workingCapital,
        workingCapitalRatio,
        dso,
        dio,
        dpo,
        cashConversionCycle,
        optimizedCCC,
        totalCashUnlock,
        dsoImprovement,
        dioImprovement,
        dpoImprovement,
        growthFunding,
        projections,
        benchmarks: industryBenchmarks
      });
      
      setIsCalculating(false);
    }, 2000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mr-4">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold">Working Capital Calculator</h1>
              <p className="text-blue-200">AI-Powered Financial Optimization</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm border-white/20 mb-8">
            <TabsTrigger value="calculator" className="data-[state=active]:bg-white/20">Calculator</TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-white/20">Data Upload</TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-white/20">Results</TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-white/20">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Form */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Financial Data Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentAssets">Current Assets (£)</Label>
                      <Input
                        id="currentAssets"
                        type="number"
                        value={formData.currentAssets}
                        onChange={(e) => handleInputChange('currentAssets', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="400,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentLiabilities">Current Liabilities (£)</Label>
                      <Input
                        id="currentLiabilities"
                        type="number"
                        value={formData.currentLiabilities}
                        onChange={(e) => handleInputChange('currentLiabilities', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="200,000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inventory">Inventory (£)</Label>
                      <Input
                        id="inventory"
                        type="number"
                        value={formData.inventory}
                        onChange={(e) => handleInputChange('inventory', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="150,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountsReceivable">Accounts Receivable (£)</Label>
                      <Input
                        id="accountsReceivable"
                        type="number"
                        value={formData.accountsReceivable}
                        onChange={(e) => handleInputChange('accountsReceivable', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="100,000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountsPayable">Accounts Payable (£)</Label>
                      <Input
                        id="accountsPayable"
                        type="number"
                        value={formData.accountsPayable}
                        onChange={(e) => handleInputChange('accountsPayable', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="80,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="revenue">Annual Revenue (£)</Label>
                      <Input
                        id="revenue"
                        type="number"
                        value={formData.revenue}
                        onChange={(e) => handleInputChange('revenue', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="1,200,000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cogs">Cost of Goods Sold (£)</Label>
                      <Input
                        id="cogs"
                        type="number"
                        value={formData.cogs}
                        onChange={(e) => handleInputChange('cogs', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="800,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetGrowth">Target Growth (%)</Label>
                      <Input
                        id="targetGrowth"
                        type="number"
                        value={formData.targetGrowth}
                        onChange={(e) => handleInputChange('targetGrowth', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="15"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={calculateMetrics}
                    disabled={isCalculating}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isCalculating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate Working Capital
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Metrics Preview */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Quick Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-600/20 rounded-lg">
                          <p className="text-2xl font-bold text-green-400">
                            £{Math.round(results.totalCashUnlock).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-300">Cash Unlock Potential</p>
                        </div>
                        <div className="text-center p-4 bg-blue-600/20 rounded-lg">
                          <p className="text-2xl font-bold text-blue-400">
                            {Math.round(results.cashConversionCycle)} → {Math.round(results.optimizedCCC)}
                          </p>
                          <p className="text-sm text-gray-300">Cash Conversion (Days)</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Working Capital Ratio</span>
                          <Badge variant="secondary" className={
                            results.workingCapitalRatio >= 1.5 
                              ? "bg-green-600/20 text-green-200 border-green-400/30"
                              : "bg-orange-600/20 text-orange-200 border-orange-400/30"
                          }>
                            {results.workingCapitalRatio.toFixed(2)}
                          </Badge>
                        </div>
                        <Progress 
                          value={Math.min((results.workingCapitalRatio / 2) * 100, 100)} 
                          className="h-2 bg-white/10" 
                        />
                      </div>

                      <Button 
                        onClick={() => setActiveTab('results')}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        View Detailed Results
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">Enter your financial data to see metrics</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* CSV Upload */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Financial Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive 
                        ? 'border-blue-400 bg-blue-600/20' 
                        : 'border-white/30 hover:border-white/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <FileSpreadsheet className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    {isDragActive ? (
                      <p>Drop your CSV file here...</p>
                    ) : (
                      <div>
                        <p className="mb-2">Drag & drop your CSV file here, or click to select</p>
                        <p className="text-sm text-gray-400">Supports CSV, XLS, XLSX files</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-4">
                    <Button 
                      onClick={downloadTemplate}
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download CSV Template
                    </Button>

                    {csvData && (
                      <div className="p-4 bg-green-600/20 rounded-lg">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                          <span className="font-semibold">File uploaded successfully!</span>
                        </div>
                        <p className="text-sm text-gray-300">
                          Loaded {csvData.length - 1} rows of data. Form has been auto-populated.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upload Instructions */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileSpreadsheet className="w-5 h-5 mr-2" />
                    CSV Format Guide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Required Columns:</h4>
                      <ul className="space-y-1 text-sm text-gray-300">
                        <li>• Current Assets</li>
                        <li>• Current Liabilities</li>
                        <li>• Inventory</li>
                        <li>• Accounts Receivable</li>
                        <li>• Accounts Payable</li>
                        <li>• Annual Revenue</li>
                        <li>• Cost of Goods Sold</li>
                        <li>• Target Growth %</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Data Format:</h4>
                      <ul className="space-y-1 text-sm text-gray-300">
                        <li>• Use numerical values only</li>
                        <li>• No currency symbols or commas</li>
                        <li>• First row should contain headers</li>
                        <li>• Second row should contain your data</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-blue-600/20 rounded-lg">
                      <h4 className="font-semibold mb-1 text-blue-200">Pro Tip:</h4>
                      <p className="text-sm text-gray-300">
                        Download our template for the exact format and example data.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {results ? (
              <div className="space-y-6">
                {/* Key Results Cards */}
                <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <CardContent className="p-6 text-center">
                      <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-400">
                        £{Math.round(results.totalCashUnlock).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-300">Total Cash Unlock</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <CardContent className="p-6 text-center">
                      <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-400">
                        {Math.round(results.cashConversionCycle - results.optimizedCCC)}
                      </p>
                      <p className="text-sm text-gray-300">Days Improvement</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <CardContent className="p-6 text-center">
                      <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-400">
                        {results.workingCapitalRatio.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-300">WC Ratio</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-orange-400">
                        £{Math.round(results.growthFunding).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-300">Growth Funding</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Projections Chart */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardHeader>
                    <CardTitle>12-Month Working Capital Projection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={results.projections}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                        <YAxis stroke="rgba(255,255,255,0.7)" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px'
                          }} 
                        />
                        <Line type="monotone" dataKey="current" stroke="#ef4444" strokeWidth={2} name="Current" />
                        <Line type="monotone" dataKey="optimized" stroke="#10b981" strokeWidth={3} name="Optimized" />
                        <Line type="monotone" dataKey="target" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardContent className="p-12 text-center">
                  <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Results Yet</h3>
                  <p className="text-gray-300 mb-4">
                    Please complete the calculator or upload your data to see detailed results.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('calculator')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Calculator
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-12 text-center">
                <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
                <p className="text-gray-300 mb-6">
                  Our AI engine analyzes your working capital data to provide personalized recommendations and industry benchmarks.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-600/20 rounded-lg">
                    <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Optimization</h4>
                    <p className="text-sm text-gray-300">Identify improvement opportunities</p>
                  </div>
                  <div className="p-4 bg-green-600/20 rounded-lg">
                    <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Benchmarking</h4>
                    <p className="text-sm text-gray-300">Compare against industry standards</p>
                  </div>
                  <div className="p-4 bg-purple-600/20 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Forecasting</h4>
                    <p className="text-sm text-gray-300">Predict future performance</p>
                  </div>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Brain className="w-4 h-4 mr-2" />
                  Generate AI Insights
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WorkingCapitalCalculator;
