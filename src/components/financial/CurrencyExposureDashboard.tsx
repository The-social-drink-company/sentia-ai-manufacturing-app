import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CurrencyDollarIcon,
  GlobeAltIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  LightBulbIcon,
  BanknotesIcon,
  ScaleIcon,
  ClockIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface CurrencyExposure {
  currency: string;
  baseCurrency: string;
  grossExposure: number;
  netExposure: number;
  hedgedAmount: number;
  unhedgedAmount: number;
  hedgeRatio: number;
  exposureType: 'receivable' | 'payable' | 'investment' | 'loan';
  maturityProfile: Array<{
    period: '0-30d' | '31-90d' | '91-180d' | '181-365d' | '>365d';
    amount: number;
    percentage: number;
  }>;
  currentRate: number;
  budgetRate: number;
  spotRate: number;
  forwardRate: number;
  rateVariance: number;
  unrealizedGainLoss: number;
  realizedGainLoss: number;
  volatility30d: number;
  volatility90d: number;
  beta: number;
  var95: number;
  var99: number;
}

interface HedgingStrategy {
  id: string;
  name: string;
  description: string;
  instrument: 'forward' | 'option' | 'swap' | 'ndf';
  currencies: string[];
  notionalAmount: number;
  hedgeRatio: number;
  maturity: string;
  cost: number;
  effectiveness: number;
  riskReduction: number;
  pros: string[];
  cons: string[];
  marketConditions: string[];
  implementation: {
    complexity: 'low' | 'medium' | 'high';
    timeframe: string;
    requirements: string[];
    counterpartyRisk: 'low' | 'medium' | 'high';
  };
}

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  probability: number;
  rateChanges: Array<{
    currency: string;
    changePercent: number;
    newRate: number;
  }>;
  impact: {
    totalGainLoss: number;
    hedgedGainLoss: number;
    unhedgedGainLoss: number;
    marginImpact: number;
    cashFlowImpact: number;
  };
  triggers: string[];
}

interface HistoricalData {
  date: string;
  rates: Record<string, number>;
  volatility: Record<string, number>;
  volume: Record<string, number>;
}

interface FXAlert {
  id: string;
  currency: string;
  type: 'rate_limit' | 'volatility_spike' | 'exposure_threshold' | 'hedge_expiry' | 'correlation_break';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
  actionRequired: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280', '#EC4899', '#14B8A6'];

export const CurrencyExposureDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'exposures' | 'hedging' | 'simulation' | 'historical' | 'alerts'>('overview');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [timeHorizon, setTimeHorizon] = useState<'1M' | '3M' | '6M' | '12M'>('3M');
  const [simulationMode, setSimulationMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertLevel, setAlertLevel] = useState<'all' | 'medium' | 'high' | 'critical'>('medium');

  // Real-time FX rates simulation
  const [realTimeRates, setRealTimeRates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setRealTimeRates(prev => {
        const currencies = ['USD', 'EUR', 'JPY', 'GBP', 'CHF', 'CAD', 'AUD'];
        const updated = { ...prev };
        
        currencies.forEach(currency => {
          if (currency === 'GBP') return; // Base currency
          
          const baseRate = currency === 'USD' ? 1.27 :
                          currency === 'EUR' ? 1.15 :
                          currency === 'JPY' ? 0.0078 :
                          currency === 'CHF' ? 1.12 :
                          currency === 'CAD' ? 0.95 :
                          currency === 'AUD' ? 0.87 : 1.0;
          
          const volatility = 0 /* REAL DATA REQUIRED */.002 - 0.001; // ±0.1%
          updated[currency] = baseRate * (1 + volatility);
        });
        
        return updated;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Fetch currency exposure data
  const { data: fxData, isLoading } = useQuery({
    queryKey: ['currency-exposure', timeHorizon],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const exposures: CurrencyExposure[] = [
        {
          currency: 'USD',
          baseCurrency: 'GBP',
          grossExposure: 2850000,
          netExposure: 2850000,
          hedgedAmount: 2137500,
          unhedgedAmount: 712500,
          hedgeRatio: 75,
          exposureType: 'receivable',
          maturityProfile: [
            { period: '0-30d', amount: 850000, percentage: 29.8 },
            { period: '31-90d', amount: 1200000, percentage: 42.1 },
            { period: '91-180d', amount: 650000, percentage: 22.8 },
            { period: '181-365d', amount: 150000, percentage: 5.3 },
            { period: '>365d', amount: 0, percentage: 0 }
          ],
          currentRate: realTimeRates.USD || 1.27,
          budgetRate: 1.25,
          spotRate: realTimeRates.USD || 1.27,
          forwardRate: 1.268,
          rateVariance: 0.016,
          unrealizedGainLoss: 45600,
          realizedGainLoss: 23400,
          volatility30d: 8.2,
          volatility90d: 12.5,
          beta: 0.85,
          var95: 142000,
          var99: 227000
        },
        {
          currency: 'EUR',
          baseCurrency: 'GBP',
          grossExposure: 1650000,
          netExposure: -1650000,
          hedgedAmount: 660000,
          unhedgedAmount: -990000,
          hedgeRatio: 40,
          exposureType: 'payable',
          maturityProfile: [
            { period: '0-30d', amount: 450000, percentage: 27.3 },
            { period: '31-90d', amount: 720000, percentage: 43.6 },
            { period: '91-180d', amount: 380000, percentage: 23.0 },
            { period: '181-365d', amount: 100000, percentage: 6.1 },
            { period: '>365d', amount: 0, percentage: 0 }
          ],
          currentRate: realTimeRates.EUR || 1.15,
          budgetRate: 1.18,
          spotRate: realTimeRates.EUR || 1.15,
          forwardRate: 1.148,
          rateVariance: -0.025,
          unrealizedGainLoss: -41250,
          realizedGainLoss: 18900,
          volatility30d: 6.8,
          volatility90d: 9.4,
          beta: 0.72,
          var95: 89000,
          var99: 142000
        },
        {
          currency: 'JPY',
          baseCurrency: 'GBP',
          grossExposure: 45000000,
          netExposure: 45000000,
          hedgedAmount: 22500000,
          unhedgedAmount: 22500000,
          hedgeRatio: 50,
          exposureType: 'receivable',
          maturityProfile: [
            { period: '0-30d', amount: 12000000, percentage: 26.7 },
            { period: '31-90d', amount: 18000000, percentage: 40.0 },
            { period: '91-180d', amount: 12000000, percentage: 26.7 },
            { period: '181-365d', amount: 3000000, percentage: 6.6 },
            { period: '>365d', amount: 0, percentage: 0 }
          ],
          currentRate: realTimeRates.JPY || 0.0078,
          budgetRate: 0.0075,
          spotRate: realTimeRates.JPY || 0.0078,
          forwardRate: 0.00782,
          rateVariance: 0.04,
          unrealizedGainLoss: 13500,
          realizedGainLoss: 8750,
          volatility30d: 11.3,
          volatility90d: 15.8,
          beta: 0.63,
          var95: 28000,
          var99: 45000
        },
        {
          currency: 'CHF',
          baseCurrency: 'GBP',
          grossExposure: 950000,
          netExposure: -950000,
          hedgedAmount: 855000,
          unhedgedAmount: -95000,
          hedgeRatio: 90,
          exposureType: 'payable',
          maturityProfile: [
            { period: '0-30d', amount: 280000, percentage: 29.5 },
            { period: '31-90d', amount: 420000, percentage: 44.2 },
            { period: '91-180d', amount: 200000, percentage: 21.1 },
            { period: '181-365d', amount: 50000, percentage: 5.2 },
            { period: '>365d', amount: 0, percentage: 0 }
          ],
          currentRate: realTimeRates.CHF || 1.12,
          budgetRate: 1.08,
          spotRate: realTimeRates.CHF || 1.12,
          forwardRate: 1.118,
          rateVariance: 0.037,
          unrealizedGainLoss: -35150,
          realizedGainLoss: 12800,
          volatility30d: 5.4,
          volatility90d: 7.9,
          beta: 0.58,
          var95: 31000,
          var99: 49000
        }
      ];

      const hedgingStrategies: HedgingStrategy[] = [
        {
          id: 'forward_hedge',
          name: 'Forward Contracts',
          description: 'Lock in exchange rates for future transactions',
          instrument: 'forward',
          currencies: ['USD', 'EUR'],
          notionalAmount: 2000000,
          hedgeRatio: 80,
          maturity: '6 months',
          cost: 15000,
          effectiveness: 95,
          riskReduction: 85,
          pros: [
            'Eliminates FX risk completely',
            'No upfront premium',
            'Customizable terms',
            'High effectiveness'
          ],
          cons: [
            'No upside participation',
            'Counterparty risk',
            'Opportunity cost',
            'Inflexible once executed'
          ],
          marketConditions: ['Stable market', 'High volatility periods', 'Predictable cash flows'],
          implementation: {
            complexity: 'low',
            timeframe: '1-2 days',
            requirements: ['ISDA agreement', 'Credit facility'],
            counterpartyRisk: 'medium'
          }
        },
        {
          id: 'option_collar',
          name: 'Option Collar Strategy',
          description: 'Buy put options and sell call options to create a range',
          instrument: 'option',
          currencies: ['USD', 'EUR', 'JPY'],
          notionalAmount: 1500000,
          hedgeRatio: 60,
          maturity: '3 months',
          cost: 8500,
          effectiveness: 75,
          riskReduction: 70,
          pros: [
            'Reduced premium cost',
            'Downside protection',
            'Some upside participation',
            'Flexible structure'
          ],
          cons: [
            'Limited upside',
            'Complex structure',
            'Premium cost',
            'Requires active management'
          ],
          marketConditions: ['Moderate volatility', 'Uncertain direction', 'Budget constraints'],
          implementation: {
            complexity: 'high',
            timeframe: '2-3 days',
            requirements: ['Options approval', 'Risk management system'],
            counterpartyRisk: 'low'
          }
        },
        {
          id: 'cross_currency_swap',
          name: 'Cross-Currency Swap',
          description: 'Exchange principal and interest payments in different currencies',
          instrument: 'swap',
          currencies: ['USD', 'EUR'],
          notionalAmount: 3000000,
          hedgeRatio: 100,
          maturity: '2 years',
          cost: 45000,
          effectiveness: 98,
          riskReduction: 95,
          pros: [
            'Long-term hedge',
            'Both principal and interest',
            'High effectiveness',
            'Customizable structure'
          ],
          cons: [
            'High complexity',
            'Significant cost',
            'Counterparty risk',
            'Regulatory requirements'
          ],
          marketConditions: ['Long-term exposures', 'Interest rate differential', 'Funding needs'],
          implementation: {
            complexity: 'high',
            timeframe: '1-2 weeks',
            requirements: ['ISDA agreement', 'Board approval', 'Risk committee approval'],
            counterpartyRisk: 'high'
          }
        }
      ];

      const simulationScenarios: SimulationScenario[] = [
        {
          id: 'base_case',
          name: 'Base Case',
          description: 'Current market conditions with normal volatility',
          probability: 60,
          rateChanges: [
            { currency: 'USD', changePercent: 0, newRate: 1.27 },
            { currency: 'EUR', changePercent: 0, newRate: 1.15 },
            { currency: 'JPY', changePercent: 0, newRate: 0.0078 },
            { currency: 'CHF', changePercent: 0, newRate: 1.12 }
          ],
          impact: {
            totalGainLoss: 0,
            hedgedGainLoss: 0,
            unhedgedGainLoss: 0,
            marginImpact: 0,
            cashFlowImpact: 0
          },
          triggers: ['Current market conditions', 'Normal volatility']
        },
        {
          id: 'usd_strength',
          name: 'USD Strengthening',
          description: 'USD appreciates 5% against GBP due to Fed policy',
          probability: 25,
          rateChanges: [
            { currency: 'USD', changePercent: 5, newRate: 1.3335 },
            { currency: 'EUR', changePercent: 2, newRate: 1.173 },
            { currency: 'JPY', changePercent: 3, newRate: 0.008034 },
            { currency: 'CHF', changePercent: 1, newRate: 1.1312 }
          ],
          impact: {
            totalGainLoss: 142500,
            hedgedGainLoss: 35625,
            unhedgedGainLoss: 106875,
            marginImpact: 2.1,
            cashFlowImpact: 142500
          },
          triggers: ['Fed rate hikes', 'Strong US economic data', 'Risk-on sentiment']
        },
        {
          id: 'eur_weakness',
          name: 'EUR Weakening',
          description: 'EUR depreciates 8% against GBP due to ECB dovishness',
          probability: 15,
          rateChanges: [
            { currency: 'USD', changePercent: -2, newRate: 1.2446 },
            { currency: 'EUR', changePercent: -8, newRate: 1.058 },
            { currency: 'JPY', changePercent: -3, newRate: 0.007566 },
            { currency: 'CHF', changePercent: -4, newRate: 1.0752 }
          ],
          impact: {
            totalGainLoss: 79200,
            hedgedGainLoss: 31680,
            unhedgedGainLoss: 47520,
            marginImpact: 1.2,
            cashFlowImpact: 79200
          },
          triggers: ['ECB dovish policy', 'Eurozone slowdown', 'Political uncertainty']
        },
        {
          id: 'volatility_spike',
          name: 'High Volatility Scenario',
          description: 'Market volatility spikes due to geopolitical tensions',
          probability: 10,
          rateChanges: [
            { currency: 'USD', changePercent: -7, newRate: 1.1811 },
            { currency: 'EUR', changePercent: -12, newRate: 1.012 },
            { currency: 'JPY', changePercent: 8, newRate: 0.008424 },
            { currency: 'CHF', changePercent: 6, newRate: 1.1872 }
          ],
          impact: {
            totalGainLoss: -285000,
            hedgedGainLoss: -71250,
            unhedgedGainLoss: -213750,
            marginImpact: -4.2,
            cashFlowImpact: -285000
          },
          triggers: ['Geopolitical tensions', 'Financial crisis', 'Central bank interventions']
        }
      ];

      const alerts: FXAlert[] = [
        {
          id: 'alert_001',
          currency: 'USD',
          type: 'rate_limit',
          severity: 'medium',
          message: 'USD/GBP rate approaching upper limit (1.30)',
          threshold: 1.30,
          currentValue: 1.27,
          timestamp: new Date().toISOString(),
          actionRequired: 'Consider increasing hedge ratio or adjusting exposure',
          status: 'active'
        },
        {
          id: 'alert_002',
          currency: 'EUR',
          type: 'volatility_spike',
          severity: 'high',
          message: 'EUR volatility exceeds 15% (30-day)',
          threshold: 15,
          currentValue: 16.2,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          actionRequired: 'Review hedge effectiveness and consider rebalancing',
          status: 'active'
        },
        {
          id: 'alert_003',
          currency: 'JPY',
          type: 'hedge_expiry',
          severity: 'critical',
          message: 'JPY forward hedge expires in 7 days',
          threshold: 7,
          currentValue: 7,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          actionRequired: 'Urgent: Roll forward or close position',
          status: 'active'
        }
      ];

      // Generate historical data
      const historicalData: HistoricalData[] = Array.from({ length: 90 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (89 - i));
        
        const usdBase = 1.25;
        const eurBase = 1.18;
        const jpyBase = 0.0075;
        const chfBase = 1.08;
        
        const trend = Math.sin(i * 0.1) * 0.05;
        const noise = (0 /* REAL DATA REQUIRED */ 0.5) * 0.04;
        
        return {
          date: date.toISOString().split('T')[0],
          rates: {
            USD: usdBase + trend + noise,
            EUR: eurBase + trend * 0.8 + noise * 0.9,
            JPY: jpyBase + trend * 0.0002 + noise * 0.0003,
            CHF: chfBase + trend * 0.6 + noise * 0.7
          },
          volatility: {
            USD: 8 + Math.abs(noise) * 20,
            EUR: 6 + Math.abs(noise) * 15,
            JPY: 10 + Math.abs(noise) * 25,
            CHF: 5 + Math.abs(noise) * 12
          },
          volume: {
            USD: 1000000 + 0 /* REAL DATA REQUIRED */ * 500000,
            EUR: 800000 + 0 /* REAL DATA REQUIRED */ * 400000,
            JPY: 600000 + 0 /* REAL DATA REQUIRED */ * 300000,
            CHF: 300000 + 0 /* REAL DATA REQUIRED */ * 150000
          }
        };
      });

      return {
        exposures,
        hedgingStrategies,
        simulationScenarios,
        alerts,
        historicalData,
        realTimeRates: realTimeRates,
        summary: {
          totalGrossExposure: exposures.reduce((sum, exp) => sum + Math.abs(exp.grossExposure * (exp.currency === 'JPY' ? exp.currentRate : 1)), 0),
          totalNetExposure: exposures.reduce((sum, exp) => sum + (exp.netExposure * (exp.currency === 'JPY' ? exp.currentRate : 1)), 0),
          totalHedgedAmount: exposures.reduce((sum, exp) => sum + Math.abs(exp.hedgedAmount * (exp.currency === 'JPY' ? exp.currentRate : 1)), 0),
          averageHedgeRatio: exposures.reduce((sum, exp) => sum + exp.hedgeRatio, 0) / exposures.length,
          totalUnrealizedGainLoss: exposures.reduce((sum, exp) => sum + exp.unrealizedGainLoss, 0),
          totalRealizedGainLoss: exposures.reduce((sum, exp) => sum + exp.realizedGainLoss, 0),
          portfolioVar95: Math.sqrt(exposures.reduce((sum, exp) => sum + Math.pow(exp.var95, 2), 0)),
          activeAlerts: alerts.filter(alert => alert.status === 'active').length
        }
      };
    }
  });

  const formatCurrency = useCallback((amount: number, currency: string = 'GBP', compact = false) => {
    if (compact && Math.abs(amount) >= 1000000) {
      return `${currency === 'JPY' ? '¥' : '£'}${(amount / 1000000).toFixed(1)}M`;
    } else if (compact && Math.abs(amount) >= 1000) {
      return `${currency === 'JPY' ? '¥' : '£'}${(amount / 1000).toFixed(0)}K`;
    }
    
    if (currency === 'JPY') {
      return `¥${amount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(1)}%`;
  }, []);

  const formatRate = useCallback((rate: number, currency: string) => {
    if (currency === 'JPY') {
      return rate.toFixed(6);
    }
    return rate.toFixed(4);
  }, []);

  const getExposureColor = useCallback((exposure: number) => {
    if (Math.abs(exposure) > 2000000) return 'text-red-600';
    if (Math.abs(exposure) > 1000000) return 'text-yellow-600';
    return 'text-green-600';
  }, []);

  const getVolatilityColor = useCallback((volatility: number) => {
    if (volatility > 15) return 'text-red-600';
    if (volatility > 10) return 'text-yellow-600';
    return 'text-green-600';
  }, []);

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const renderOverview = () => {
    if (!fxData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Gross Exposure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(fxData.summary.totalGrossExposure, 'GBP', true)}
              </div>
              <div className="text-xs text-gray-600">
                {fxData.exposures.length} currencies
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Exposure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getExposureColor(fxData.summary.totalNetExposure))}>
                {formatCurrency(fxData.summary.totalNetExposure, 'GBP', true)}
              </div>
              <div className="text-xs text-gray-600">
                After netting positions
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Hedge Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(fxData.summary.averageHedgeRatio)}
              </div>
              <div className="text-xs text-gray-600">
                Average across portfolio
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", 
                fxData.summary.totalUnrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(fxData.summary.totalUnrealizedGainLoss, 'GBP', true)}
              </div>
              <div className="text-xs text-gray-600">
                Mark-to-market
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Rates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Real-time FX Rates</CardTitle>
                <CardDescription>Live exchange rates vs GBP</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={autoRefresh ? 'default' : 'outline'}>
                  {autoRefresh ? 'Live' : 'Paused'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {fxData.exposures.map((exposure) => (
                <div key={exposure.currency} className="text-center p-4 border rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">
                    {exposure.currency}/GBP
                  </div>
                  <div className="text-xl font-bold">
                    {formatRate(exposure.currentRate, exposure.currency)}
                  </div>
                  <div className={cn("text-sm flex items-center justify-center mt-1",
                    exposure.rateVariance >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {exposure.rateVariance >= 0 ? <TrendingUpIcon className="h-3 w-3 mr-1" /> : <TrendingDownIcon className="h-3 w-3 mr-1" />}
                    {formatPercentage(Math.abs(exposure.rateVariance))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Budget: {formatRate(exposure.budgetRate, exposure.currency)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exposure Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Exposure by Currency</CardTitle>
              <CardDescription>Net exposure distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fxData.exposures.map(exp => ({
                      name: exp.currency,
                      value: Math.abs(exp.netExposure * (exp.currency === 'JPY' ? exp.currentRate : 1)),
                      exposure: exp.netExposure,
                      type: exp.exposureType
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${formatCurrency(value, 'GBP', true)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {fxData.exposures.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value, 'GBP'), 'Exposure']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hedge Effectiveness</CardTitle>
              <CardDescription>Hedged vs unhedged exposure</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={fxData.exposures.map(exp => ({
                    currency: exp.currency,
                    hedged: Math.abs(exp.hedgedAmount * (exp.currency === 'JPY' ? exp.currentRate : 1)),
                    unhedged: Math.abs(exp.unhedgedAmount * (exp.currency === 'JPY' ? exp.currentRate : 1)),
                    hedgeRatio: exp.hedgeRatio
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="currency" />
                  <YAxis tickFormatter={(value) => formatCurrency(value, 'GBP', true)} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value, 'GBP'), '']} />
                  <Legend />
                  <Bar dataKey="hedged" stackId="exposure" fill="#10B981" name="Hedged" />
                  <Bar dataKey="unhedged" stackId="exposure" fill="#EF4444" name="Unhedged" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Currency Risk Metrics</CardTitle>
            <CardDescription>Detailed risk metrics by currency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Currency</th>
                    <th className="text-right py-3">Net Exposure</th>
                    <th className="text-right py-3">Hedge Ratio</th>
                    <th className="text-right py-3">30d Volatility</th>
                    <th className="text-right py-3">VaR (95%)</th>
                    <th className="text-right py-3">Unrealized P&L</th>
                    <th className="text-right py-3">Current Rate</th>
                    <th className="text-right py-3">Budget Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {fxData.exposures.map((exposure) => (
                    <tr key={exposure.currency} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-medium">
                        <div className="flex items-center space-x-2">
                          <span>{exposure.currency}</span>
                          <Badge variant={exposure.exposureType === 'receivable' ? 'default' : 'secondary'} className="text-xs">
                            {exposure.exposureType}
                          </Badge>
                        </div>
                      </td>
                      <td className={cn("py-3 text-right font-medium", getExposureColor(exposure.netExposure))}>
                        {exposure.currency === 'JPY' ? 
                          formatCurrency(exposure.netExposure, 'JPY', true) :
                          formatCurrency(exposure.netExposure, 'GBP', true)
                        }
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${exposure.hedgeRatio}%` }}
                            ></div>
                          </div>
                          <span>{formatPercentage(exposure.hedgeRatio)}</span>
                        </div>
                      </td>
                      <td className={cn("py-3 text-right", getVolatilityColor(exposure.volatility30d))}>
                        {formatPercentage(exposure.volatility30d)}
                      </td>
                      <td className="py-3 text-right font-medium text-red-600">
                        {formatCurrency(exposure.var95, 'GBP', true)}
                      </td>
                      <td className={cn("py-3 text-right font-medium", 
                        exposure.unrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(exposure.unrealizedGainLoss, 'GBP')}
                      </td>
                      <td className="py-3 text-right">
                        {formatRate(exposure.currentRate, exposure.currency)}
                      </td>
                      <td className="py-3 text-right text-gray-600">
                        {formatRate(exposure.budgetRate, exposure.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderExposureAnalysis = () => {
    if (!fxData) return null;

    const selectedExposure = fxData.exposures.find(exp => exp.currency === selectedCurrency) || fxData.exposures[0];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Exposure Analysis</h3>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fxData.exposures.map(exp => (
                <SelectItem key={exp.currency} value={exp.currency}>
                  {exp.currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Exposure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getExposureColor(selectedExposure.netExposure))}>
                {selectedExposure.currency === 'JPY' ?
                  formatCurrency(selectedExposure.netExposure, 'JPY', true) :
                  formatCurrency(selectedExposure.netExposure, 'GBP', true)
                }
              </div>
              <div className="text-xs text-gray-600">
                {selectedExposure.exposureType}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatRate(selectedExposure.currentRate, selectedExposure.currency)}
              </div>
              <div className={cn("text-xs flex items-center", 
                selectedExposure.rateVariance >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {selectedExposure.rateVariance >= 0 ? <TrendingUpIcon className="h-3 w-3 mr-1" /> : <TrendingDownIcon className="h-3 w-3 mr-1" />}
                {formatPercentage(Math.abs(selectedExposure.rateVariance))} vs budget
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Hedge Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(selectedExposure.hedgeRatio)}
              </div>
              <div className="text-xs text-gray-600">
                {formatCurrency(selectedExposure.hedgedAmount, selectedExposure.currency === 'JPY' ? 'JPY' : 'GBP', true)} hedged
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Volatility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getVolatilityColor(selectedExposure.volatility30d))}>
                {formatPercentage(selectedExposure.volatility30d)}
              </div>
              <div className="text-xs text-gray-600">
                30-day historical
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Maturity Profile</CardTitle>
              <CardDescription>Exposure breakdown by maturity period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={selectedExposure.maturityProfile}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => formatCurrency(value, selectedExposure.currency === 'JPY' ? 'JPY' : 'GBP', true)} />
                  <Tooltip formatter={(value: number) => [
                    selectedExposure.currency === 'JPY' ? 
                      formatCurrency(value, 'JPY') : 
                      formatCurrency(value, 'GBP'), 
                    'Amount'
                  ]} />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Metrics</CardTitle>
              <CardDescription>Value at Risk and sensitivity measures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(selectedExposure.var95, 'GBP', true)}
                    </div>
                    <div className="text-sm text-gray-600">VaR (95%)</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(selectedExposure.var99, 'GBP', true)}
                    </div>
                    <div className="text-sm text-gray-600">VaR (99%)</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Beta to Portfolio:</span>
                    <span className="font-medium">{selectedExposure.beta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">30d Volatility:</span>
                    <span className="font-medium">{formatPercentage(selectedExposure.volatility30d)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">90d Volatility:</span>
                    <span className="font-medium">{formatPercentage(selectedExposure.volatility90d)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Unrealized P&L:</span>
                    <span className={cn("font-medium", 
                      selectedExposure.unrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatCurrency(selectedExposure.unrealizedGainLoss, 'GBP')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Realized P&L:</span>
                    <span className={cn("font-medium", 
                      selectedExposure.realizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatCurrency(selectedExposure.realizedGainLoss, 'GBP')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderHedgingStrategies = () => {
    if (!fxData) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Hedging Strategies</h3>
          <Button variant="outline" size="sm">
            <LightBulbIcon className="h-4 w-4 mr-2" />
            Get Recommendations
          </Button>
        </div>

        <div className="space-y-4">
          {fxData.hedgingStrategies.map((strategy) => (
            <Card key={strategy.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    <CardDescription className="mt-1">{strategy.description}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">
                      {strategy.instrument}
                    </Badge>
                    <Badge variant={strategy.implementation.complexity === 'low' ? 'default' : 
                                  strategy.implementation.complexity === 'medium' ? 'secondary' : 'destructive'}>
                      {strategy.implementation.complexity} complexity
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <h5 className="font-medium mb-3">Key Metrics</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Notional Amount:</span>
                        <span className="font-medium">{formatCurrency(strategy.notionalAmount, 'GBP', true)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hedge Ratio:</span>
                        <span className="font-medium">{formatPercentage(strategy.hedgeRatio)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maturity:</span>
                        <span className="font-medium">{strategy.maturity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost:</span>
                        <span className="font-medium text-red-600">{formatCurrency(strategy.cost, 'GBP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Effectiveness:</span>
                        <span className="font-medium text-green-600">{formatPercentage(strategy.effectiveness)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Reduction:</span>
                        <span className="font-medium text-blue-600">{formatPercentage(strategy.riskReduction)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-3">Pros & Cons</h5>
                    <div className="space-y-3">
                      <div>
                        <h6 className="text-xs font-medium text-green-700 mb-1">Advantages:</h6>
                        <div className="space-y-1">
                          {strategy.pros.slice(0, 3).map((pro, index) => (
                            <div key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                              <CheckCircleIcon className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{pro}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h6 className="text-xs font-medium text-red-700 mb-1">Disadvantages:</h6>
                        <div className="space-y-1">
                          {strategy.cons.slice(0, 3).map((con, index) => (
                            <div key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                              <ExclamationTriangleIcon className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{con}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-3">Implementation</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Timeframe:</span>
                        <span className="font-medium">{strategy.implementation.timeframe}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Counterparty Risk:</span>
                        <Badge variant={strategy.implementation.counterpartyRisk === 'low' ? 'default' : 
                                      strategy.implementation.counterpartyRisk === 'medium' ? 'secondary' : 'destructive'}
                               className="text-xs">
                          {strategy.implementation.counterpartyRisk}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h6 className="text-xs font-medium text-gray-700 mb-1">Requirements:</h6>
                      <div className="space-y-1">
                        {strategy.implementation.requirements.map((req, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" className="w-full">
                        Implement Strategy
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Strategy Comparison</CardTitle>
            <CardDescription>Cost vs effectiveness analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={fxData.hedgingStrategies.map(strategy => ({
                name: strategy.name,
                cost: strategy.cost,
                effectiveness: strategy.effectiveness,
                riskReduction: strategy.riskReduction
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cost" type="number" name="Cost" tickFormatter={(value) => formatCurrency(value, 'GBP', true)} />
                <YAxis dataKey="effectiveness" type="number" name="Effectiveness" tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value, name) => [
                  name === 'cost' ? formatCurrency(Number(value), 'GBP') : `${value}%`,
                  name === 'cost' ? 'Cost' : name === 'effectiveness' ? 'Effectiveness' : 'Risk Reduction'
                ]} />
                <Scatter dataKey="effectiveness" fill="#3B82F6" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSimulation = () => {
    if (!fxData) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">FX Impact Simulation</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSimulationMode(!simulationMode)}
            >
              <BeakerIcon className="h-4 w-4 mr-2" />
              {simulationMode ? 'Stop' : 'Run'} Simulation
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fxData.simulationScenarios.map((scenario) => (
            <Card key={scenario.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    <CardDescription className="mt-1">{scenario.description}</CardDescription>
                  </div>
                  <Badge variant="outline">
                    {formatPercentage(scenario.probability)} probability
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className={cn("text-lg font-bold", 
                        scenario.impact.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(scenario.impact.totalGainLoss, 'GBP', true)}
                      </div>
                      <div className="text-sm text-gray-600">Total Impact</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={cn("text-lg font-bold", 
                        scenario.impact.marginImpact >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {scenario.impact.marginImpact > 0 ? '+' : ''}{formatPercentage(scenario.impact.marginImpact)}
                      </div>
                      <div className="text-sm text-gray-600">Margin Impact</div>
                    </div>
                  </div>

                  <div>
                    <h6 className="text-sm font-medium mb-2">Rate Changes:</h6>
                    <div className="space-y-1">
                      {scenario.rateChanges.map((change, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{change.currency}:</span>
                          <span className={cn("font-medium",
                            change.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {change.changePercent > 0 ? '+' : ''}{formatPercentage(change.changePercent)} 
                            ({formatRate(change.newRate, change.currency)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h6 className="text-sm font-medium mb-2">Scenario Triggers:</h6>
                    <div className="space-y-1">
                      {scenario.triggers.map((trigger, index) => (
                        <div key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                          <span>{trigger}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="text-sm">
                      <span className="text-gray-600">Hedged Impact:</span>
                      <div className={cn("font-medium", 
                        scenario.impact.hedgedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(scenario.impact.hedgedGainLoss, 'GBP', true)}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Unhedged Impact:</span>
                      <div className={cn("font-medium", 
                        scenario.impact.unhedgedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(scenario.impact.unhedgedGainLoss, 'GBP', true)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scenario Impact Comparison</CardTitle>
            <CardDescription>Total P&L impact across scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={fxData.simulationScenarios}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value, 'GBP', true)} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value: number, name: string) => [
                  name === 'probability' ? `${value}%` : formatCurrency(value, 'GBP'),
                  name === 'probability' ? 'Probability' : name
                ]} />
                <Legend />
                <Bar yAxisId="left" dataKey="impact.hedgedGainLoss" fill="#10B981" name="Hedged Impact" />
                <Bar yAxisId="left" dataKey="impact.unhedgedGainLoss" fill="#EF4444" name="Unhedged Impact" />
                <Line yAxisId="right" type="monotone" dataKey="probability" stroke="#8B5CF6" strokeWidth={2} name="Probability" />
                <ReferenceLine yAxisId="left" y={0} stroke="#666" strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderHistoricalAnalysis = () => {
    if (!fxData) return null;

    const chartData = fxData.historicalData.map(data => ({
      date: data.date,
      ...data.rates,
      ...Object.fromEntries(Object.entries(data.volatility).map(([key, value]) => [`${key}_vol`, value]))
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Historical Analysis</h3>
          <Select value={timeHorizon} onValueChange={(value) => setTimeHorizon(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1M">1M</SelectItem>
              <SelectItem value="3M">3M</SelectItem>
              <SelectItem value="6M">6M</SelectItem>
              <SelectItem value="12M">12M</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historical FX Rates</CardTitle>
            <CardDescription>90-day historical exchange rates vs GBP</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-GB')}
                  formatter={(value: number, name: string) => [formatRate(value, name), `${name}/GBP`]}
                />
                <Legend />
                <Line type="monotone" dataKey="USD" stroke="#3B82F6" strokeWidth={2} name="USD" />
                <Line type="monotone" dataKey="EUR" stroke="#10B981" strokeWidth={2} name="EUR" />
                <Line type="monotone" dataKey="CHF" stroke="#8B5CF6" strokeWidth={2} name="CHF" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Historical Volatility</CardTitle>
              <CardDescription>30-day rolling volatility by currency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-GB')}
                    formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name.replace('_vol', '')]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="USD_vol" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="USD" />
                  <Area type="monotone" dataKey="EUR_vol" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="EUR" />
                  <Area type="monotone" dataKey="CHF_vol" stackId="3" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="CHF" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Correlation Matrix</CardTitle>
              <CardDescription>90-day rolling correlations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['USD', 'EUR', 'JPY', 'CHF'].map((currency1, i) => (
                  <div key={currency1} className="grid grid-cols-4 gap-2">
                    {['USD', 'EUR', 'JPY', 'CHF'].map((currency2, j) => {
                      const correlation = i === j ? 1.0 : 
                                        (i < j) ? 0 /* REAL DATA REQUIRED */.8 + 0.2 :
                                        0 /* REAL DATA REQUIRED */.8 + 0.2;
                      
                      return (
                        <div key={currency2} className="text-center p-2 border rounded">
                          <div className="text-xs text-gray-600">{currency1}-{currency2}</div>
                          <div className={cn("font-bold",
                            correlation > 0.7 ? 'text-red-600' :
                            correlation > 0.3 ? 'text-yellow-600' :
                            'text-green-600'
                          )}>
                            {correlation.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Statistical Summary</CardTitle>
            <CardDescription>90-day historical statistics by currency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Currency</th>
                    <th className="text-right py-3">Current Rate</th>
                    <th className="text-right py-3">90d High</th>
                    <th className="text-right py-3">90d Low</th>
                    <th className="text-right py-3">Average</th>
                    <th className="text-right py-3">Std Dev</th>
                    <th className="text-right py-3">Volatility</th>
                    <th className="text-right py-3">Sharpe Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {fxData.exposures.map((exposure) => {
                    const rates = fxData.historicalData.map(d => d.rates[exposure.currency]);
                    const high = Math.max(...rates);
                    const low = Math.min(...rates);
                    const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
                    const stdDev = Math.sqrt(rates.reduce((sum, rate) => sum + Math.pow(rate - average, 2), 0) / rates.length);
                    const volatility = (stdDev / average) * 100;
                    const sharpeRatio = (exposure.currentRate - exposure.budgetRate) / stdDev;

                    return (
                      <tr key={exposure.currency} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{exposure.currency}</td>
                        <td className="py-3 text-right">{formatRate(exposure.currentRate, exposure.currency)}</td>
                        <td className="py-3 text-right text-green-600">{formatRate(high, exposure.currency)}</td>
                        <td className="py-3 text-right text-red-600">{formatRate(low, exposure.currency)}</td>
                        <td className="py-3 text-right">{formatRate(average, exposure.currency)}</td>
                        <td className="py-3 text-right">{formatRate(stdDev, exposure.currency)}</td>
                        <td className={cn("py-3 text-right", getVolatilityColor(volatility))}>
                          {formatPercentage(volatility)}
                        </td>
                        <td className={cn("py-3 text-right font-medium",
                          sharpeRatio > 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {sharpeRatio.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAlerts = () => {
    if (!fxData) return null;

    const filteredAlerts = fxData.alerts.filter(alert => {
      if (alertLevel === 'all') return true;
      const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      const minLevel = severityOrder[alertLevel];
      return severityOrder[alert.severity] >= minLevel;
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">FX Risk Alerts</h3>
          <div className="flex items-center space-x-2">
            <Select value={alertLevel} onValueChange={(value) => setAlertLevel(value as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="medium">Medium+</SelectItem>
                <SelectItem value="high">High+</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="destructive">
              {fxData.summary.activeAlerts} active
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {fxData.alerts.length}
              </div>
              <div className="text-xs text-gray-600">
                {fxData.alerts.filter(a => a.status === 'active').length} active
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {fxData.alerts.filter(a => a.severity === 'critical').length}
              </div>
              <div className="text-xs text-gray-600">
                Require immediate action
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {fxData.alerts.filter(a => a.severity === 'high').length}
              </div>
              <div className="text-xs text-gray-600">
                Urgent attention needed
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {fxData.alerts.filter(a => a.severity === 'medium').length}
              </div>
              <div className="text-xs text-gray-600">
                Monitor closely
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={cn("border-l-4", getSeverityColor(alert.severity))}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 
                                   alert.severity === 'high' ? 'destructive' :
                                   alert.severity === 'medium' ? 'secondary' : 'outline'}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {alert.type.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {alert.currency}
                      </Badge>
                      <Badge variant={alert.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {alert.status}
                      </Badge>
                    </div>
                    <p className="font-medium text-gray-900 mb-2">{alert.message}</p>
                    <p className="text-sm text-gray-600 mb-3">{alert.actionRequired}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Threshold: {alert.threshold}</span>
                      <span>Current: {alert.currentValue}</span>
                      <span>{new Date(alert.timestamp).toLocaleString('en-GB')}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      Acknowledge
                    </Button>
                    <Button variant="outline" size="sm">
                      Resolve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alert Distribution</CardTitle>
            <CardDescription>Breakdown of alerts by type and severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(
                      fxData.alerts.reduce((acc, alert) => {
                        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
                        return acc;
                      }, {} as any)
                    ).map(([severity, count]) => ({ name: severity, value: count }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} (${value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.keys(
                      fxData.alerts.reduce((acc, alert) => {
                        acc[alert.severity] = true;
                        return acc;
                      }, {} as any)
                    ).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={Object.entries(
                    fxData.alerts.reduce((acc, alert) => {
                      acc[alert.type] = (acc[alert.type] || 0) + 1;
                      return acc;
                    }, {} as any)
                  ).map(([type, count]) => ({ type: type.replace('_', ' '), count }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Currency Exposure Dashboard</h2>
          <p className="text-gray-600">Real-time FX risk management with hedging recommendations and impact simulation</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={autoRefresh ? 'default' : 'outline'}>
            {autoRefresh ? 'Live Data' : 'Static'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <ArrowPathIcon className={cn("h-4 w-4 mr-2", autoRefresh && "animate-spin")} />
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exposures">Exposures</TabsTrigger>
          <TabsTrigger value="hedging">Hedging</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="historical">Historical</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="exposures" className="space-y-6">
          {renderExposureAnalysis()}
        </TabsContent>

        <TabsContent value="hedging" className="space-y-6">
          {renderHedgingStrategies()}
        </TabsContent>

        <TabsContent value="simulation" className="space-y-6">
          {renderSimulation()}
        </TabsContent>

        <TabsContent value="historical" className="space-y-6">
          {renderHistoricalAnalysis()}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {renderAlerts()}
        </TabsContent>
      </Tabs>
    </div>
  );
};