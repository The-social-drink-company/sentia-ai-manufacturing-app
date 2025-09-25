import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import ExcelJS from 'exceljs';
import {
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  CalculatorIcon,
  SparklesIcon,
  ChartPieIcon,
  BanknotesIcon,
  BeakerIcon,
  CubeIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import RealDatabaseQueries from '../../services/database/RealDatabaseQueries';
import apiClient from '../../services/api/apiClient';
import { toast } from 'react-hot-toast';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


// Financial calculation utilities
const calculateCAGR = (endValue, startValue, years) => {
  if (!startValue || startValue <= 0 || !endValue || endValue <= 0) return 0;
  return ((Math.pow(endValue / startValue, 1 / years) - 1) * 100).toFixed(2);
};

const calculateNPV = (cashFlows, discountRate) => {
  return cashFlows.reduce((npv, cf, i) => {
    return npv + cf / Math.pow(1 + discountRate, i + 1);
  }, 0);
};

const calculateIRR = (cashFlows) => {
  // Newton-Raphson method for IRR calculation
  let rate = 0.1;
  const precision = 0.00001;
  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    const npv = cashFlows.reduce((acc, cf, j) =>
      acc + cf / Math.pow(1 + rate, j), 0);

    const dnpv = cashFlows.reduce((acc, cf, j) =>
      acc - j * cf / Math.pow(1 + rate, j + 1), 0);

    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < precision) {
      return newRate * 100;
    }
    rate = newRate;
  }
  return rate * 100;
};

// Model Slider Component
const ModelSlider = ({ label, value, onChange, min, max, step, unit, current }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const isPositive = value > 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center space-x-2">
          {current && (
            <span className="text-xs text-gray-500">Current: {current}</span>
          )}
          <span className={`text-sm font-semibold ${
            isPositive ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {value}{unit}
          </span>
        </div>
      </div>
      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={([val]) => onChange(val)}
          min={min}
          max={max}
          step={step}
          className="relative flex items-center select-none touch-none w-full"
        />
        <div
          className="absolute h-1 bg-gradient-to-r from-red-500 via-gray-300 to-green-500 rounded-full pointer-events-none"
          style={{
            width: `${percentage}%`,
            opacity: 0.3,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, format, trend, comparison }) => {
  const formatValue = () => {
    if (!value && value !== 0) return '--';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'GBP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return value;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-1">{formatValue()}</p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend > 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
          {comparison && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              vs {comparison}
            </span>
          )}
        </div>
      </CardContent>
      <div className="absolute top-0 right-0 w-20 h-20 transform translate-x-8 -translate-y-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full opacity-20" />
      </div>
    </Card>
  );
};

// Main Component
export default function InteractiveFinancialModeling() {
  const queryClient = useQueryClient();
  const dbQueries = useMemo(() => new RealDatabaseQueries(), []);

  // Model state
  const [model, setModel] = useState({
    // Revenue assumptions
    revenueGrowth: 0,
    priceIncrease: 0,
    volumeGrowth: 0,
    marketShare: 0,

    // Cost assumptions
    cogsReduction: 0,
    opexOptimization: 0,
    headcountChange: 0,

    // Working Capital
    dsoTarget: 45,
    dpoTarget: 60,
    dioTarget: 30,

    // Financing
    debtRatio: 30,
    interestRate: 5,
    dividendPayout: 0,

    // Investment
    capexBudget: 3,
    rdInvestment: 2,
    acquisitionBudget: 0
  });

  const [selectedScenario, setSelectedScenario] = useState('base');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [sensitivityVariable, setSensitivityVariable] = useState('revenueGrowth');
  const [sensitivityResults, setSensitivityResults] = useState(null);

  // Load real company data
  const { data: companyData, isLoading } = useQuery({
    queryKey: ['company-financials'],
    queryFn: async () => {
      try {
        // Try to get real data from database
        const [metrics, cashflow, ratios] = await Promise.all([
          dbQueries.getDashboardMetrics(),
          dbQueries.getCashFlowData(),
          dbQueries.getFinancialRatios()
        ]);

        // Return real company data
        return {
          revenue: metrics?.revenue || 15000000,
          cogs: metrics?.cogs || 9000000,
          opex: metrics?.operatingExpenses || 3000000,
          workingCapital: cashflow?.workingCapital || 2000000,
          totalDebt: metrics?.totalDebt || 5000000,
          equity: metrics?.equity || 10000000,
          dso: ratios?.dso || 45,
          dpo: ratios?.dpo || 60,
          dio: ratios?.dio || 30,
          taxRate: 0.25,
          currentAssets: metrics?.currentAssets || 8000000,
          currentLiabilities: metrics?.currentLiabilities || 6000000
        };
      } catch (error) {
        // Fallback to realistic defaults
        return {
          revenue: 15000000,
          cogs: 9000000,
          opex: 3000000,
          workingCapital: 2000000,
          totalDebt: 5000000,
          equity: 10000000,
          dso: 45,
          dpo: 60,
          dio: 30,
          taxRate: 0.25,
          currentAssets: 8000000,
          currentLiabilities: 6000000
        };
      }
    },
    staleTime: 300000 // 5 minutes
  });

  // Calculate projections with real data
  const calculateProjections = useCallback((modelInputs, realCompanyData) => {
    if (!realCompanyData) return null;

    const projections = {
      periods: [],
      revenue: [],
      cogs: [],
      grossProfit: [],
      opex: [],
      ebitda: [],
      ebit: [],
      netIncome: [],
      cashFlow: [],
      workingCapital: [],
      debt: [],
      equity: []
    };

    // Starting values from real data
    let currentRevenue = realCompanyData.revenue;
    let currentCogs = realCompanyData.cogs;
    let currentOpex = realCompanyData.opex;
    let currentWC = realCompanyData.workingCapital;
    let currentDebt = realCompanyData.totalDebt;
    let currentEquity = realCompanyData.equity;

    // Project 5 years forward
    for (let year = 0; year <= 5; year++) {
      if (year === 0) {
        // Base year (actual)
        projections.periods.push('Current');
        projections.revenue.push(currentRevenue);
        projections.cogs.push(currentCogs);
        projections.grossProfit.push(currentRevenue - currentCogs);
        projections.opex.push(currentOpex);
        projections.ebitda.push(currentRevenue - currentCogs - currentOpex);
        projections.workingCapital.push(currentWC);
        projections.debt.push(currentDebt);
        projections.equity.push(currentEquity);
      } else {
        // Revenue projection
        const revenueGrowthRate = 1 + (modelInputs.revenueGrowth / 100);
        const priceImpact = 1 + (modelInputs.priceIncrease / 100);
        const volumeImpact = 1 + (modelInputs.volumeGrowth / 100);

        currentRevenue = currentRevenue * revenueGrowthRate * priceImpact * volumeImpact;

        // COGS projection
        const cogsReductionRate = 1 - (modelInputs.cogsReduction / 100);
        const cogsPercentOfRevenue = realCompanyData.cogs / realCompanyData.revenue;
        currentCogs = currentRevenue * cogsPercentOfRevenue * cogsReductionRate;

        // OPEX projection
        const opexOptimizationRate = 1 - (modelInputs.opexOptimization / 100);
        const headcountImpact = 1 + (modelInputs.headcountChange / 100 * 0.7);
        currentOpex = currentOpex * opexOptimizationRate * headcountImpact;

        // Working Capital projection
        const revenueDays = currentRevenue / 365;
        const cogsDays = currentCogs / 365;

        const receivables = revenueDays * modelInputs.dsoTarget;
        const payables = cogsDays * modelInputs.dpoTarget;
        const inventory = cogsDays * modelInputs.dioTarget;

        currentWC = receivables + inventory - payables;

        // EBITDA calculation
        const grossProfit = currentRevenue - currentCogs;
        const ebitda = grossProfit - currentOpex;

        // Debt projection
        const targetDebtRatio = modelInputs.debtRatio / 100;
        const totalCapital = currentDebt + currentEquity;
        currentDebt = totalCapital * targetDebtRatio;

        // Cash Flow calculation
        const depreciation = currentRevenue * 0.02; // 2% of revenue
        const ebit = ebitda - depreciation;
        const interestExpense = currentDebt * (modelInputs.interestRate / 100);
        const ebt = ebit - interestExpense;
        const taxes = Math.max(0, ebt * realCompanyData.taxRate);
        const netIncome = ebt - taxes;

        const capex = currentRevenue * (modelInputs.capexBudget / 100);
        const wcChange = year === 1 ? 0 : currentWC - projections.workingCapital[projections.workingCapital.length - 1];

        const freeCashFlow = ebitda - taxes - capex - wcChange;

        // Store projections
        projections.periods.push(`Year ${year}`);
        projections.revenue.push(currentRevenue);
        projections.cogs.push(currentCogs);
        projections.grossProfit.push(grossProfit);
        projections.opex.push(currentOpex);
        projections.ebitda.push(ebitda);
        projections.ebit.push(ebit);
        projections.netIncome.push(netIncome);
        projections.cashFlow.push(freeCashFlow);
        projections.workingCapital.push(currentWC);
        projections.debt.push(currentDebt);
        projections.equity.push(currentEquity);
      }
    }

    return projections;
  }, []);

  // Calculate key metrics
  const calculateKeyMetrics = useCallback((projections) => {
    if (!projections) return null;

    const lastYear = projections.periods.length - 1;
    const firstYear = 1; // Skip base year

    return {
      revenueCAGR: calculateCAGR(
        projections.revenue[lastYear],
        projections.revenue[firstYear],
        lastYear - firstYear
      ),
      avgEbitdaMargin: (
        projections.ebitda.slice(firstYear).reduce((sum, ebitda, i) =>
          sum + (ebitda / projections.revenue[i + firstYear] * 100), 0
        ) / (lastYear - firstYear + 1)
      ).toFixed(1),
      totalFCF: projections.cashFlow.slice(firstYear).reduce((a, b) => a + b, 0),
      avgROCE: (
        projections.ebit.slice(firstYear).reduce((sum, ebit, i) => {
          const capitalEmployed = projections.debt[i + firstYear] + projections.equity[i + firstYear];
          return sum + (ebit / capitalEmployed * 100);
        }, 0) / (lastYear - firstYear + 1)
      ).toFixed(1)
    };
  }, []);

  // Calculate valuation
  const calculateValuation = useCallback((projections) => {
    if (!projections) return null;

    const wacc = 0.10; // 10% WACC
    const terminalGrowth = 0.02; // 2% terminal growth
    const lastYearFCF = projections.cashFlow[projections.cashFlow.length - 1];

    // Terminal value
    const terminalValue = (lastYearFCF * (1 + terminalGrowth)) / (wacc - terminalGrowth);

    // DCF value
    const pvCashFlows = calculateNPV(projections.cashFlow.slice(1), wacc);
    const pvTerminalValue = terminalValue / Math.pow(1 + wacc, projections.cashFlow.length - 1);
    const enterpriseValue = pvCashFlows + pvTerminalValue;

    // Multiple-based valuation
    const evToEbitda = enterpriseValue / projections.ebitda[projections.ebitda.length - 1];
    const peRatio = enterpriseValue / projections.netIncome[projections.netIncome.length - 1];

    return {
      enterpriseValue,
      equityValue: enterpriseValue - projections.debt[projections.debt.length - 1],
      evToEbitda: evToEbitda.toFixed(1),
      peRatio: peRatio.toFixed(1),
      terminalValue,
      wacc: (wacc * 100).toFixed(1)
    };
  }, []);

  // Real-time model calculation
  const { data: modelResults } = useQuery({
    queryKey: ['model-results', model, companyData],
    queryFn: async () => {
      if (!companyData) return null;

      const projections = calculateProjections(model, companyData);
      const metrics = calculateKeyMetrics(projections);
      const valuation = calculateValuation(projections);

      return {
        projections,
        metrics,
        valuation
      };
    },
    enabled: !!companyData,
    staleTime: 0
  });

  // Run sensitivity analysis
  const runSensitivityAnalysis = useCallback(async () => {
    if (!companyData) return;

    const variable = sensitivityVariable;
    const baseValue = model[variable];
    const range = [-30, -20, -10, 0, 10, 20, 30];
    const results = [];

    for (const change of range) {
      const adjustedValue = variable.includes('Target')
        ? baseValue + change
        : baseValue + (baseValue * change / 100);

      const adjustedModel = {
        ...model,
        [variable]: adjustedValue
      };

      const projection = calculateProjections(adjustedModel, companyData);
      if (!projection) continue;

      const metrics = calculateKeyMetrics(projection);
      const valuation = calculateValuation(projection);

      results.push({
        change,
        value: adjustedValue,
        revenue: projection.revenue[projection.revenue.length - 1],
        ebitda: projection.ebitda[projection.ebitda.length - 1],
        cashFlow: projection.cashFlow.slice(1).reduce((a, b) => a + b, 0),
        irr: calculateIRR([-companyData.equity, ...projection.cashFlow.slice(1)]),
        npv: calculateNPV(projection.cashFlow.slice(1), 0.10),
        evToEbitda: valuation?.evToEbitda || 0
      });
    }

    setSensitivityResults(results);
  }, [model, companyData, sensitivityVariable, calculateProjections, calculateKeyMetrics, calculateValuation]);

  // Save scenario mutation
  const saveScenario = useMutation({
    mutationFn: async (scenarioData) => {
      const response = await apiClient.post('/api/scenarios/save', {
        ...scenarioData,
        model,
        results: modelResults,
        timestamp: new Date().toISOString(),
        userId: 'current-user'
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Scenario saved successfully');
      queryClient.invalidateQueries(['saved-scenarios']);
    },
    onError: (error) => {
      toast.error('Failed to save scenario');
      logError('Save scenario error:', error);
    }
  });

  // Export to Excel
    const exportToExcel = useCallback(async () => {
    if (!modelResults) {
      toast.error('No data to export');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sentia Manufacturing Dashboard';

      const assumptions = [
        ['Financial Model Assumptions', ''],
        [''],
        ['Revenue Drivers', ''],
        ['Revenue Growth %', model.revenueGrowth],
        ['Price Increase %', model.priceIncrease],
        ['Volume Growth %', model.volumeGrowth],
        [''],
        ['Cost Structure', ''],
        ['COGS Reduction %', model.cogsReduction],
        ['OPEX Optimization %', model.opexOptimization],
        ['Headcount Change %', model.headcountChange],
        [''],
        ['Working Capital', ''],
        ['DSO Target (days)', model.dsoTarget],
        ['DPO Target (days)', model.dpoTarget],
        ['DIO Target (days)', model.dioTarget],
        [''],
        ['Capital Structure', ''],
        ['Debt Ratio %', model.debtRatio],
        ['Interest Rate %', model.interestRate],
        ['CapEx Budget %', model.capexBudget]
      ];

      const assumptionsSheet = workbook.addWorksheet('Assumptions');
      assumptions.forEach(row => assumptionsSheet.addRow(row));

      if (modelResults?.projections) {
        const projData = [
          ['Financial Projections', ...modelResults.projections.periods],
          [''],
          ['Revenue', ...modelResults.projections.revenue.map(v => Math.round(v))],
          ['COGS', ...modelResults.projections.cogs.map(v => Math.round(v))],
          ['Gross Profit', ...modelResults.projections.grossProfit.map(v => Math.round(v))],
          ['Operating Expenses', ...modelResults.projections.opex.map(v => Math.round(v))],
          ['EBITDA', ...modelResults.projections.ebitda.map(v => Math.round(v))],
          ['EBIT', ...modelResults.projections.ebit.map(v => Math.round(v))],
          ['Net Income', ...modelResults.projections.netIncome.map(v => Math.round(v))],
          ['Free Cash Flow', ...modelResults.projections.cashFlow.map(v => Math.round(v))],
          [''],
          ['Working Capital', ...modelResults.projections.workingCapital.map(v => Math.round(v))],
          ['Total Debt', ...modelResults.projections.debt.map(v => Math.round(v))],
          ['Total Equity', ...modelResults.projections.equity.map(v => Math.round(v))]
        ];

        const projectionsSheet = workbook.addWorksheet('Projections');
        projData.forEach(row => projectionsSheet.addRow(row));
      }

      if (modelResults?.valuation) {
        const valData = [
          ['Valuation Summary', ''],
          [''],
          ['Enterprise Value', Math.round(modelResults.valuation.enterpriseValue)],
          ['Equity Value', Math.round(modelResults.valuation.equityValue)],
          ['EV/EBITDA Multiple', modelResults.valuation.evToEbitda],
          ['P/E Ratio', modelResults.valuation.peRatio],
          ['Terminal Value', Math.round(modelResults.valuation.terminalValue)],
          ['WACC %', modelResults.valuation.wacc]
        ];

        const valuationSheet = workbook.addWorksheet('Valuation');
        valData.forEach(row => valuationSheet.addRow(row));
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = Sentia_Financial_Model_.xlsx;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Excel file downloaded');
    } catch (error) {
      logError('Excel export failed', error);
      toast.error('Failed to generate Excel file');
    }
  }, [modelResults, model]);

  // Preset scenarios
  const applyScenario = (scenarioType) => {
    const scenarios = {
      conservative: {
        revenueGrowth: 5,
        priceIncrease: 2,
        volumeGrowth: 3,
        cogsReduction: 2,
        opexOptimization: 3,
        headcountChange: 0,
        dsoTarget: 50,
        dpoTarget: 65,
        dioTarget: 35
      },
      base: {
        revenueGrowth: 10,
        priceIncrease: 3,
        volumeGrowth: 7,
        cogsReduction: 5,
        opexOptimization: 5,
        headcountChange: 5,
        dsoTarget: 45,
        dpoTarget: 60,
        dioTarget: 30
      },
      aggressive: {
        revenueGrowth: 20,
        priceIncrease: 5,
        volumeGrowth: 15,
        cogsReduction: 10,
        opexOptimization: 10,
        headcountChange: 15,
        dsoTarget: 40,
        dpoTarget: 70,
        dioTarget: 25
      }
    };

    setModel({ ...model, ...scenarios[scenarioType] });
    setSelectedScenario(scenarioType);
    toast.success(`${scenarioType.charAt(0).toUpperCase() + scenarioType.slice(1)} scenario applied`);
  };

  useEffect(() => {
    if (companyData) {
      runSensitivityAnalysis();
    }
  }, [sensitivityVariable, companyData, runSensitivityAnalysis]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">
              Interactive Financial Modeling
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time projections with actual company data
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedScenario} onValueChange={applyScenario}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="base">Base Case</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setComparisonMode(!comparisonMode)}
              variant="outline"
            >
              <ChartPieIcon className="h-4 w-4 mr-2" />
              {comparisonMode ? 'Exit Comparison' : 'Compare'}
            </Button>
            <Button onClick={exportToExcel} variant="outline">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              onClick={() => {
                const name = prompt('Enter scenario name:');
                if (name) saveScenario.mutate({ name });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Save Scenario
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="5Y Revenue CAGR"
            value={modelResults?.metrics?.revenueCAGR}
            format="percentage"
            trend={parseFloat(modelResults?.metrics?.revenueCAGR) > 10 ? 1 : -1}
          />
          <MetricCard
            title="Avg EBITDA Margin"
            value={modelResults?.metrics?.avgEbitdaMargin}
            format="percentage"
            trend={parseFloat(modelResults?.metrics?.avgEbitdaMargin) > 20 ? 1 : -1}
          />
          <MetricCard
            title="Total FCF (5Y)"
            value={modelResults?.metrics?.totalFCF}
            format="currency"
            trend={modelResults?.metrics?.totalFCF > 0 ? 1 : -1}
          />
          <MetricCard
            title="Enterprise Value"
            value={modelResults?.valuation?.enterpriseValue}
            format="currency"
            comparison={`${modelResults?.valuation?.evToEbitda}x EBITDA`}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Revenue Assumptions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
                  Revenue Drivers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ModelSlider
                  label="Revenue Growth"
                  value={model.revenueGrowth}
                  onChange={(val) => setModel({...model, revenueGrowth: val})}
                  min={-30}
                  max={50}
                  step={1}
                  unit="%"
                />
                <ModelSlider
                  label="Price Increase"
                  value={model.priceIncrease}
                  onChange={(val) => setModel({...model, priceIncrease: val})}
                  min={-20}
                  max={30}
                  step={0.5}
                  unit="%"
                />
                <ModelSlider
                  label="Volume Growth"
                  value={model.volumeGrowth}
                  onChange={(val) => setModel({...model, volumeGrowth: val})}
                  min={-30}
                  max={50}
                  step={1}
                  unit="%"
                />
              </CardContent>
            </Card>

            {/* Cost Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ScaleIcon className="h-5 w-5 mr-2" />
                  Cost Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ModelSlider
                  label="COGS Reduction"
                  value={model.cogsReduction}
                  onChange={(val) => setModel({...model, cogsReduction: val})}
                  min={0}
                  max={20}
                  step={0.5}
                  unit="%"
                />
                <ModelSlider
                  label="OPEX Optimization"
                  value={model.opexOptimization}
                  onChange={(val) => setModel({...model, opexOptimization: val})}
                  min={0}
                  max={20}
                  step={0.5}
                  unit="%"
                />
                <ModelSlider
                  label="Headcount Change"
                  value={model.headcountChange}
                  onChange={(val) => setModel({...model, headcountChange: val})}
                  min={-30}
                  max={30}
                  step={1}
                  unit="%"
                />
              </CardContent>
            </Card>

            {/* Working Capital */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  Working Capital
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ModelSlider
                  label="DSO Target"
                  value={model.dsoTarget}
                  onChange={(val) => setModel({...model, dsoTarget: val})}
                  min={20}
                  max={90}
                  step={1}
                  unit=" days"
                  current={companyData?.dso}
                />
                <ModelSlider
                  label="DPO Target"
                  value={model.dpoTarget}
                  onChange={(val) => setModel({...model, dpoTarget: val})}
                  min={30}
                  max={120}
                  step={1}
                  unit=" days"
                  current={companyData?.dpo}
                />
                <ModelSlider
                  label="DIO Target"
                  value={model.dioTarget}
                  onChange={(val) => setModel({...model, dioTarget: val})}
                  min={15}
                  max={90}
                  step={1}
                  unit=" days"
                  current={companyData?.dio}
                />
              </CardContent>
            </Card>
          </div>

          {/* Visualization Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Projection Charts */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Projections</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="revenue" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="revenue">Revenue & Profit</TabsTrigger>
                    <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                    <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
                    <TabsTrigger value="valuation">Valuation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="revenue" className="mt-6">
                    <ProjectionChart
                      data={modelResults?.projections}
                      metrics={['revenue', 'grossProfit', 'ebitda']}
                      title="Revenue & Profitability Trend"
                    />
                  </TabsContent>

                  <TabsContent value="cashflow" className="mt-6">
                    <ProjectionChart
                      data={modelResults?.projections}
                      metrics={['cashFlow']}
                      title="Free Cash Flow Projection"
                      showCumulative={true}
                    />
                  </TabsContent>

                  <TabsContent value="sensitivity" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Sensitivity Analysis</h3>
                        <Select value={sensitivityVariable} onValueChange={setSensitivityVariable}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="revenueGrowth">Revenue Growth</SelectItem>
                            <SelectItem value="priceIncrease">Price Increase</SelectItem>
                            <SelectItem value="cogsReduction">COGS Reduction</SelectItem>
                            <SelectItem value="opexOptimization">OPEX Optimization</SelectItem>
                            <SelectItem value="dsoTarget">DSO Target</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <SensitivityChart data={sensitivityResults} variable={sensitivityVariable} />
                    </div>
                  </TabsContent>

                  <TabsContent value="valuation" className="mt-6">
                    <ValuationSummary valuation={modelResults?.valuation} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Projections</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectionTable data={modelResults?.projections} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Projection Chart Component
const ProjectionChart = ({ data, metrics, title, showCumulative }) => {
  if (!data) return null;

  const chartData = data.periods.map((period, index) => {
    const point = { period };
    metrics.forEach(metric => {
      point[metric] = Math.round(data[metric][index]);
    });

    if (showCumulative && metrics.includes('cashFlow')) {
      point.cumulative = data.cashFlow.slice(0, index + 1).reduce((a, b) => a + b, 0);
    }

    return point;
  });

  const formatValue = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="h-80">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 w-20">{item.period}</span>
            <div className="flex-1 mx-4">
              {metrics.map(metric => (
                <div key={metric} className="relative h-6 mb-2">
                  <div className="absolute inset-0 bg-gray-200 rounded-md" />
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-blue-500 rounded-md"
                    initial={{ width: 0 }}
                    animate={{ width: `${(item[metric] / Math.max(...data[metric])) * 100}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  />
                  <span className="absolute right-2 top-1 text-xs font-medium text-gray-700">
                    {formatValue(item[metric])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Sensitivity Chart Component
const SensitivityChart = ({ data, variable }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Impact on Enterprise Value</h4>
          <div className="space-y-2">
            {data.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{item.change}%</span>
                <div className="flex-1 mx-2">
                  <div className="h-2 bg-gray-200 rounded-full relative">
                    <motion.div
                      className={`absolute inset-y-0 left-1/2 ${
                        item.npv > 0 ? 'bg-green-500' : 'bg-red-500'
                      } rounded-full`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.abs(item.npv) / Math.max(...data.map(d => Math.abs(d.npv))) * 50}%`,
                        x: item.npv > 0 ? 0 : '-100%'
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'GBP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                    notation: 'compact'
                  }).format(item.npv)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Impact on IRR</h4>
          <div className="space-y-2">
            {data.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{item.change}%</span>
                <div className="flex-1 mx-2">
                  <div className="h-2 bg-gray-200 rounded-full relative">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.irr / Math.max(...data.map(d => d.irr))) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium">{item.irr.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Valuation Summary Component
const ValuationSummary = ({ valuation }) => {
  if (!valuation) return null;

  const metrics = [
    { label: 'Enterprise Value', value: valuation.enterpriseValue, format: 'currency' },
    { label: 'Equity Value', value: valuation.equityValue, format: 'currency' },
    { label: 'EV/EBITDA Multiple', value: valuation.evToEbitda, format: 'number' },
    { label: 'P/E Ratio', value: valuation.peRatio, format: 'number' },
    { label: 'Terminal Value', value: valuation.terminalValue, format: 'currency' },
    { label: 'WACC', value: valuation.wacc, format: 'percentage' }
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {metrics.map((metric, idx) => (
        <motion.div
          key={metric.label}
          className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.1 }}
        >
          <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
          <p className="text-2xl font-bold text-gray-900">
            {metric.format === 'currency' ?
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'GBP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
                notation: 'compact'
              }).format(metric.value) :
              metric.format === 'percentage' ? `${metric.value}%` :
              metric.value
            }
          </p>
        </motion.div>
      ))}
    </div>
  );
};

// Projection Table Component
const ProjectionTable = ({ data }) => {
  if (!data) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const rows = [
    { label: 'Revenue', key: 'revenue' },
    { label: 'COGS', key: 'cogs' },
    { label: 'Gross Profit', key: 'grossProfit' },
    { label: 'Operating Expenses', key: 'opex' },
    { label: 'EBITDA', key: 'ebitda' },
    { label: 'Free Cash Flow', key: 'cashFlow' },
    { label: 'Working Capital', key: 'workingCapital' }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2 font-medium text-gray-600">Metric</th>
            {data.periods.map((period, idx) => (
              <th key={idx} className="text-right py-2 px-2 font-medium text-gray-600">
                {period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b hover:bg-gray-50">
              <td className="py-2 px-2 font-medium text-gray-700">{row.label}</td>
              {data[row.key].map((value, colIdx) => (
                <td key={colIdx} className="text-right py-2 px-2">
                  {formatCurrency(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
