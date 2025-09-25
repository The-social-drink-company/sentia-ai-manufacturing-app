// CFO Global Dashboard Preset Component
// Provides a board-grade financial dashboard with regional consolidation

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  DollarSign, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  getGlobalConfig, 
  getCurrency, 
  getLocale, 
  formatCurrency,
  isFeatureEnabled 
} from '@/config/global';

// Mock data for CFO metrics - replace with real data integration
const mockCFOMetrics = {
  UK: {
    forecastAccuracy: 87.5,
    cccTrend: -2.3,
    minCash90d: 1200000,
    facilityUtilization: 78.2,
    wcUnlockedQTD: 450000,
    currency: 'GBP'
  },
  EU: {
    forecastAccuracy: 82.1,
    cccTrend: 1.8,
    minCash90d: 1800000,
    facilityUtilization: 71.4,
    wcUnlockedQTD: 320000,
    currency: 'EUR'
  },
  USA: {
    forecastAccuracy: 91.2,
    cccTrend: -4.1,
    minCash90d: 2100000,
    facilityUtilization: 85.1,
    wcUnlockedQTD: 780000,
    currency: 'USD'
  }
};

const KPICard = ({ title, value, trend, format = 'number', currency, alert = null }) => {
  const formatValue = () => {
    if (format === 'currency') {
      return formatCurrency(value, currency);
    }
    if (format === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    if (format === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className=\"w-4 h-4 text-green-500\" />;
    if (trend < 0) return <TrendingDown className=\"w-4 h-4 text-red-500\" />;
    return null;
  };

  const getAlertIcon = () => {
    if (alert === 'warning') return <AlertTriangle className=\"w-4 h-4 text-yellow-500\" />;
    if (alert === 'success') return <CheckCircle className=\"w-4 h-4 text-green-500\" />;
    if (alert === 'info') return <Clock className=\"w-4 h-4 text-blue-500\" />;
    return null;
  };

  return (
    <Card>
      <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
        <CardTitle className=\"text-sm font-medium\">{title}</CardTitle>
        <div className=\"flex items-center space-x-1\">
          {getAlertIcon()}
          {getTrendIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className=\"text-2xl font-bold\">{formatValue()}</div>
        {trend !== undefined && (
          <p className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const RegionalView = ({ region, data, consolidatedMode = false }) => {
  const currency = getCurrency(region);
  const locale = getLocale(region);

  return (
    <div className=\"space-y-6\">
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <Globe className=\"w-5 h-5\" />
          <h3 className=\"text-lg font-semibold\">{region} Region</h3>
          <Badge variant=\"outline\">{currency}</Badge>
        </div>
        {!consolidatedMode && (
          <Badge variant=\"secondary\">{locale}</Badge>
        )}
      </div>

      <div className=\"grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4\">
        <KPICard
          title=\"Forecast Accuracy\"
          value={data.forecastAccuracy}
          format=\"percentage\"
          trend={2.1}
          alert={data.forecastAccuracy < 85 ? 'warning' : 'success'}
        />
        <KPICard
          title=\"CCC Trend\"
          value={Math.abs(data.cccTrend)}
          format=\"number\"
          trend={data.cccTrend}
          alert={Math.abs(data.cccTrend) > 3 ? 'warning' : 'info'}
        />
        <KPICard
          title=\"Min Cash (90d)\"
          value={data.minCash90d}
          format=\"currency\"
          currency={currency}
          trend={-1.2}
          alert={data.minCash90d < 1000000 ? 'warning' : 'success'}
        />
        <KPICard
          title=\"Facility Utilization\"
          value={data.facilityUtilization}
          format=\"percentage\"
          trend={3.4}
          alert={data.facilityUtilization < 75 ? 'warning' : 'success'}
        />
        <KPICard
          title=\"WC Unlocked (QTD)\"
          value={data.wcUnlockedQTD}
          format=\"currency\"
          currency={currency}
          trend={12.8}
          alert=\"success\"
        />
      </div>

      {consolidatedMode && (
        <div className=\"mt-6\">
          <Card>
            <CardHeader>
              <CardTitle>Regional Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-2 text-sm\">
                <div className=\"flex justify-between\">
                  <span>Cash Conversion Cycle:</span>
                  <span className={data.cccTrend < 0 ? 'text-green-600' : 'text-red-600'}>
                    {data.cccTrend > 0 ? '+' : ''}{data.cccTrend.toFixed(1)} days
                  </span>
                </div>
                <div className=\"flex justify-between\">
                  <span>Working Capital Efficiency:</span>
                  <span className=\"text-green-600\">
                    {((data.wcUnlockedQTD / data.minCash90d) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className=\"flex justify-between\">
                  <span>Operational Risk:</span>
                  <Badge variant={data.facilityUtilization > 80 ? 'destructive' : 'default'}>
                    {data.facilityUtilization > 80 ? 'High' : 'Moderate'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const ConsolidatedView = ({ data }) => {
  const globalConfig = getGlobalConfig();
  const baseCurrency = globalConfig.DEFAULT_BASE_CURRENCY;

  // Calculate consolidated metrics (mock conversion rates)
  const conversionRates = { GBP: 1, EUR: 0.85, USD: 0.79 };
  
  const consolidatedMetrics = useMemo(() => {
    const regions = Object.keys(data);
    const totalMinCash = regions.reduce((sum, region) => {
      const rate = conversionRates[data[region].currency] || 1;
      return sum + (data[region].minCash90d * rate);
    }, 0);
    
    const totalWCUnlocked = regions.reduce((sum, region) => {
      const rate = conversionRates[data[region].currency] || 1;
      return sum + (data[region].wcUnlockedQTD * rate);
    }, 0);
    
    const avgForecastAccuracy = regions.reduce((sum, region) => {
      return sum + data[region].forecastAccuracy;
    }, 0) / regions.length;
    
    const avgFacilityUtilization = regions.reduce((sum, region) => {
      return sum + data[region].facilityUtilization;
    }, 0) / regions.length;
    
    const avgCCCTrend = regions.reduce((sum, region) => {
      return sum + data[region].cccTrend;
    }, 0) / regions.length;

    return {
      totalMinCash,
      totalWCUnlocked,
      avgForecastAccuracy,
      avgFacilityUtilization,
      avgCCCTrend,
      currency: baseCurrency
    };
  }, [data, baseCurrency]);

  return (
    <div className=\"space-y-6\">
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <BarChart3 className=\"w-5 h-5\" />
          <h3 className=\"text-lg font-semibold\">Global Consolidated View</h3>
          <Badge variant=\"outline\">{baseCurrency}</Badge>
        </div>
        <Badge variant=\"secondary\">
          {Object.keys(data).length} Regions
        </Badge>
      </div>

      <div className=\"grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4\">
        <KPICard
          title=\"Avg Forecast Accuracy\"
          value={consolidatedMetrics.avgForecastAccuracy}
          format=\"percentage\"
          trend={1.8}
          alert={consolidatedMetrics.avgForecastAccuracy < 85 ? 'warning' : 'success'}
        />
        <KPICard
          title=\"Global CCC Trend\"
          value={Math.abs(consolidatedMetrics.avgCCCTrend)}
          format=\"number\"
          trend={consolidatedMetrics.avgCCCTrend}
          alert={Math.abs(consolidatedMetrics.avgCCCTrend) > 2 ? 'warning' : 'info'}
        />
        <KPICard
          title=\"Total Min Cash (90d)\"
          value={consolidatedMetrics.totalMinCash}
          format=\"currency\"
          currency={baseCurrency}
          trend={-0.5}
          alert=\"success\"
        />
        <KPICard
          title=\"Avg Facility Utilization\"
          value={consolidatedMetrics.avgFacilityUtilization}
          format=\"percentage\"
          trend={2.9}
          alert={consolidatedMetrics.avgFacilityUtilization < 75 ? 'warning' : 'success'}
        />
        <KPICard
          title=\"Total WC Unlocked (QTD)\"
          value={consolidatedMetrics.totalWCUnlocked}
          format=\"currency\"
          currency={baseCurrency}
          trend={15.2}
          alert=\"success\"
        />
      </div>

      <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
        <Card>
          <CardHeader>
            <CardTitle>Regional Performance Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-3\">
              {Object.entries(data)
                .sort(([,a], [,b]) => b.forecastAccuracy - a.forecastAccuracy)
                .map(([region, metrics], index) => (
                  <div key={region} className=\"flex items-center justify-between p-2 rounded bg-muted/50\">
                    <div className=\"flex items-center space-x-2\">
                      <Badge variant=\"outline\">{index + 1}</Badge>
                      <span className=\"font-medium\">{region}</span>
                    </div>
                    <div className=\"text-sm text-muted-foreground\">
                      {metrics.forecastAccuracy.toFixed(1)}% accuracy
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-3\">
              {Object.entries(data).map(([region, metrics]) => {
                const riskLevel = metrics.facilityUtilization > 85 || 
                                 metrics.minCash90d < 1000000 || 
                                 metrics.forecastAccuracy < 80 ? 'High' : 
                                 metrics.facilityUtilization > 75 || 
                                 metrics.forecastAccuracy < 90 ? 'Medium' : 'Low';
                
                const riskColor = riskLevel === 'High' ? 'destructive' : 
                                 riskLevel === 'Medium' ? 'default' : 'secondary';

                return (
                  <div key={region} className=\"flex items-center justify-between p-2 rounded bg-muted/50\">
                    <span className=\"font-medium\">{region}</span>
                    <Badge variant={riskColor}>{riskLevel} Risk</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const CFOGlobalPreset = () => {
  const [consolidatedView, setConsolidatedView] = useState(true);
  const [baseCurrency, setBaseCurrency] = useState('GBP');
  const globalConfig = getGlobalConfig();
  
  // Check if feature is enabled
  if (!isFeatureEnabled('GLOBAL_CFO_PRESET')) {
    return (
      <div className=\"flex items-center justify-center h-64\">
        <Card>
          <CardContent className=\"p-6 text-center\">
            <h3 className=\"text-lg font-semibold mb-2\">CFO Global Dashboard</h3>
            <p className=\"text-muted-foreground mb-4\">
              This feature is currently disabled. Contact your administrator to enable global CFO dashboard preset.
            </p>
            <Badge variant=\"outline\">Feature Flag: GLOBAL_CFO_PRESET</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header Controls */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <DollarSign className=\"w-6 h-6\" />
          <h2 className=\"text-xl font-semibold\">CFO Global Dashboard</h2>
          <Badge variant=\"secondary\">Board Grade</Badge>
        </div>
        
        <div className=\"flex items-center space-x-4\">
          <div className=\"flex items-center space-x-2\">
            <label htmlFor=\"consolidated-toggle\" className=\"text-sm font-medium\">
              Consolidated View
            </label>
            <Switch
              id=\"consolidated-toggle\"
              checked={consolidatedView}
              onCheckedChange={setConsolidatedView}
            />
          </div>
          
          <Select value={baseCurrency} onValueChange={setBaseCurrency}>
            <SelectTrigger className=\"w-24\">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {globalConfig.SUPPORTED_CURRENCIES.map(currency => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      {consolidatedView ? (
        <ConsolidatedView data={mockCFOMetrics} />
      ) : (
        <Tabs defaultValue={globalConfig.SUPPORTED_REGIONS[0]} className=\"w-full\">
          <TabsList className=\"grid w-full grid-cols-3\">
            {globalConfig.SUPPORTED_REGIONS.map(region => (
              <TabsTrigger key={region} value={region}>
                {region}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {globalConfig.SUPPORTED_REGIONS.map(region => (
            <TabsContent key={region} value={region}>
              <RegionalView 
                region={region} 
                data={mockCFOMetrics[region] || {}}
                consolidatedMode={false}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Footer Info */}
      <div className=\"text-xs text-muted-foreground text-center pt-4 border-t\">
        Last updated: {new Date().toLocaleString()} | 
        Base currency: {baseCurrency} | 
        Regions: {globalConfig.SUPPORTED_REGIONS.join(', ')}
      </div>
    </div>
  );
};

export default CFOGlobalPreset;
