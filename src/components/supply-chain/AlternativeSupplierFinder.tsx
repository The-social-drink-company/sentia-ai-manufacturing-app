import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  StarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  UserPlusIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  TruckIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

interface SupplierCapability {
  category: string;
  subcategories: string[];
  certifications: string[];
  capacity: {
    daily: number;
    monthly: number;
    unit: string;
  };
  leadTime: {
    min: number;
    max: number;
    average: number;
    unit: string;
  };
  qualityScore: number;
}

interface CostBreakdown {
  unitPrice: number;
  toolingCost: number;
  setupCost: number;
  shippingCost: number;
  totalCostPerUnit: number;
  currency: string;
  minimumOrderQuantity: number;
  priceBreaks: Array<{
    quantity: number;
    unitPrice: number;
    discount: number;
  }>;
}

interface QualityPrediction {
  overallScore: number;
  confidence: number;
  factors: {
    historicalPerformance: { score: number; weight: number; };
    certificationLevel: { score: number; weight: number; };
    industryReputation: { score: number; weight: number; };
    technicalCapability: { score: number; weight: number; };
    financialStability: { score: number; weight: number; };
    geographicRisk: { score: number; weight: number; };
  };
  predictedMetrics: {
    defectRate: number;
    onTimeDelivery: number;
    responsiveness: number;
    flexibility: number;
  };
  riskFactors: Array<{
    factor: string;
    impact: number;
    probability: number;
    mitigation: string;
  }>;
}

interface OnboardingWorkflow {
  stage: 'discovery' | 'evaluation' | 'qualification' | 'negotiation' | 'contract' | 'onboarded';
  progress: number;
  estimatedCompletion: string;
  nextSteps: Array<{
    step: string;
    owner: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    dependencies: string[];
  }>;
  documents: Array<{
    name: string;
    type: string;
    status: 'required' | 'submitted' | 'approved' | 'rejected';
    uploadedDate?: string;
    reviewedBy?: string;
  }>;
  approvals: Array<{
    approver: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    date?: string;
    comments?: string;
  }>;
}

interface AlternativeSupplier {
  id: string;
  name: string;
  location: {
    country: string;
    region: string;
    city: string;
    coordinates: { lat: number; lng: number; };
  };
  capabilities: SupplierCapability[];
  costAnalysis: CostBreakdown;
  qualityPrediction: QualityPrediction;
  matchScore: number;
  discoverySource: 'database' | 'web_scraping' | 'api' | 'recommendation' | 'manual';
  onboardingWorkflow: OnboardingWorkflow;
  contactInfo: {
    primaryContact: string;
    email: string;
    phone: string;
    website: string;
  };
  companyInfo: {
    founded: number;
    employees: string;
    annualRevenue: string;
    certifications: string[];
    majorClients: string[];
  };
  riskProfile: {
    overallRisk: 'low' | 'medium' | 'high';
    factors: string[];
    mitigationStrategies: string[];
  };
  lastUpdated: string;
}

interface SearchCriteria {
  productCategory: string;
  specifications: string[];
  quantity: number;
  targetPrice: number;
  maxLeadTime: number;
  qualityRequirements: string[];
  certificationRequirements: string[];
  geographicPreferences: string[];
  excludedRegions: string[];
  priorityFactors: Array<{
    factor: 'cost' | 'quality' | 'leadTime' | 'location' | 'capacity';
    weight: number;
  }>;
}

const AlternativeSupplierFinder: React.FC = () => {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    productCategory: '',
    specifications: [],
    quantity: 1000,
    targetPrice: 0,
    maxLeadTime: 30,
    qualityRequirements: [],
    certificationRequirements: [],
    geographicPreferences: [],
    excludedRegions: [],
    priorityFactors: [
      { factor: 'cost', weight: 30 },
      { factor: 'quality', weight: 25 },
      { factor: 'leadTime', weight: 20 },
      { factor: 'location', weight: 15 },
      { factor: 'capacity', weight: 10 }
    ]
  });

  const [selectedSupplier, setSelectedSupplier] = useState<AlternativeSupplier | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'results' | 'comparison' | 'onboarding'>('search');
  const [searchFilters, setSearchFilters] = useState({
    minMatchScore: 70,
    maxCost: 1000,
    preferredRegions: [] as string[],
    requiredCertifications: [] as string[]
  });

  const { data: suppliers, isLoading, refetch } = useQuery<AlternativeSupplier[]>({
    queryKey: ['alternative-suppliers', searchCriteria],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return [
        {
          id: 'sup-001',
          name: 'TechFlow Manufacturing',
          location: {
            country: 'Taiwan',
            region: 'Asia Pacific',
            city: 'Taipei',
            coordinates: { lat: 25.0330, lng: 121.5654 }
          },
          capabilities: [
            {
              category: 'Electronics Assembly',
              subcategories: ['PCB Assembly', 'Component Sourcing', 'Testing'],
              certifications: ['ISO 9001', 'IPC-A-610', 'ISO 14001'],
              capacity: { daily: 5000, monthly: 150000, unit: 'units' },
              leadTime: { min: 15, max: 25, average: 20, unit: 'days' },
              qualityScore: 94
            }
          ],
          costAnalysis: {
            unitPrice: 12.50,
            toolingCost: 15000,
            setupCost: 2500,
            shippingCost: 0.85,
            totalCostPerUnit: 13.35,
            currency: 'USD',
            minimumOrderQuantity: 1000,
            priceBreaks: [
              { quantity: 1000, unitPrice: 12.50, discount: 0 },
              { quantity: 5000, unitPrice: 11.80, discount: 5.6 },
              { quantity: 10000, unitPrice: 11.20, discount: 10.4 }
            ]
          },
          qualityPrediction: {
            overallScore: 89,
            confidence: 85,
            factors: {
              historicalPerformance: { score: 92, weight: 30 },
              certificationLevel: { score: 88, weight: 20 },
              industryReputation: { score: 85, weight: 15 },
              technicalCapability: { score: 94, weight: 20 },
              financialStability: { score: 87, weight: 10 },
              geographicRisk: { score: 78, weight: 5 }
            },
            predictedMetrics: {
              defectRate: 0.8,
              onTimeDelivery: 96.5,
              responsiveness: 92,
              flexibility: 88
            },
            riskFactors: [
              {
                factor: 'Currency Fluctuation',
                impact: 15,
                probability: 40,
                mitigation: 'Hedge currency exposure with forward contracts'
              },
              {
                factor: 'Natural Disasters',
                impact: 85,
                probability: 10,
                mitigation: 'Maintain alternative production sites'
              }
            ]
          },
          matchScore: 92,
          discoverySource: 'database',
          onboardingWorkflow: {
            stage: 'evaluation',
            progress: 35,
            estimatedCompletion: '2024-02-15',
            nextSteps: [
              {
                step: 'Technical capability assessment',
                owner: 'Quality Team',
                dueDate: '2024-01-20',
                status: 'in_progress',
                dependencies: ['Sample evaluation']
              },
              {
                step: 'Financial qualification review',
                owner: 'Procurement',
                dueDate: '2024-01-25',
                status: 'pending',
                dependencies: ['Credit report', 'Financial statements']
              }
            ],
            documents: [
              { name: 'Quality Certificate', type: 'Certification', status: 'approved', uploadedDate: '2024-01-10', reviewedBy: 'Quality Manager' },
              { name: 'Financial Statements', type: 'Financial', status: 'required' },
              { name: 'Sample Products', type: 'Technical', status: 'submitted', uploadedDate: '2024-01-12' }
            ],
            approvals: [
              { approver: 'Technical Lead', role: 'Technical Review', status: 'approved', date: '2024-01-15', comments: 'Excellent technical capabilities' },
              { approver: 'Procurement Manager', role: 'Commercial Review', status: 'pending' }
            ]
          },
          contactInfo: {
            primaryContact: 'David Chen',
            email: 'david.chen@techflow.com.tw',
            phone: '+886-2-2345-6789',
            website: 'www.techflow.com.tw'
          },
          companyInfo: {
            founded: 2008,
            employees: '500-1000',
            annualRevenue: '$50-100M',
            certifications: ['ISO 9001', 'ISO 14001', 'OHSAS 18001'],
            majorClients: ['Apple', 'Samsung', 'ASUS']
          },
          riskProfile: {
            overallRisk: 'low',
            factors: ['Political stability', 'Strong quality systems'],
            mitigationStrategies: ['Dual sourcing strategy', 'Quality audits']
          },
          lastUpdated: '2024-01-16T10:30:00Z'
        },
        {
          id: 'sup-002',
          name: 'Precision Dynamics Ltd',
          location: {
            country: 'Germany',
            region: 'Europe',
            city: 'Munich',
            coordinates: { lat: 48.1351, lng: 11.5820 }
          },
          capabilities: [
            {
              category: 'Precision Machining',
              subcategories: ['CNC Machining', 'Swiss Turning', 'Quality Control'],
              certifications: ['ISO 9001', 'AS9100', 'ISO/TS 16949'],
              capacity: { daily: 2000, monthly: 60000, unit: 'components' },
              leadTime: { min: 20, max: 35, average: 28, unit: 'days' },
              qualityScore: 97
            }
          ],
          costAnalysis: {
            unitPrice: 18.75,
            toolingCost: 25000,
            setupCost: 5000,
            shippingCost: 1.20,
            totalCostPerUnit: 19.95,
            currency: 'EUR',
            minimumOrderQuantity: 500,
            priceBreaks: [
              { quantity: 500, unitPrice: 18.75, discount: 0 },
              { quantity: 2000, unitPrice: 17.50, discount: 6.7 },
              { quantity: 5000, unitPrice: 16.80, discount: 10.4 }
            ]
          },
          qualityPrediction: {
            overallScore: 96,
            confidence: 92,
            factors: {
              historicalPerformance: { score: 98, weight: 30 },
              certificationLevel: { score: 96, weight: 20 },
              industryReputation: { score: 94, weight: 15 },
              technicalCapability: { score: 97, weight: 20 },
              financialStability: { score: 95, weight: 10 },
              geographicRisk: { score: 92, weight: 5 }
            },
            predictedMetrics: {
              defectRate: 0.2,
              onTimeDelivery: 98.5,
              responsiveness: 95,
              flexibility: 85
            },
            riskFactors: [
              {
                factor: 'Higher Labor Costs',
                impact: 25,
                probability: 80,
                mitigation: 'Value engineering and automation investments'
              }
            ]
          },
          matchScore: 88,
          discoverySource: 'api',
          onboardingWorkflow: {
            stage: 'qualification',
            progress: 65,
            estimatedCompletion: '2024-02-01',
            nextSteps: [
              {
                step: 'Final quality audit',
                owner: 'Quality Team',
                dueDate: '2024-01-22',
                status: 'pending',
                dependencies: ['Site visit scheduling']
              }
            ],
            documents: [
              { name: 'ISO Certificates', type: 'Certification', status: 'approved' },
              { name: 'Capability Study', type: 'Technical', status: 'approved' }
            ],
            approvals: [
              { approver: 'Technical Lead', role: 'Technical Review', status: 'approved' },
              { approver: 'Quality Director', role: 'Quality Review', status: 'pending' }
            ]
          },
          contactInfo: {
            primaryContact: 'Klaus Mueller',
            email: 'k.mueller@precisiondynamics.de',
            phone: '+49-89-1234-5678',
            website: 'www.precisiondynamics.de'
          },
          companyInfo: {
            founded: 1985,
            employees: '200-500',
            annualRevenue: '$25-50M',
            certifications: ['ISO 9001', 'AS9100', 'ISO 14001'],
            majorClients: ['BMW', 'Siemens', 'Bosch']
          },
          riskProfile: {
            overallRisk: 'low',
            factors: ['High quality standards', 'Stable economy'],
            mitigationStrategies: ['Long-term contracts', 'Performance monitoring']
          },
          lastUpdated: '2024-01-16T08:15:00Z'
        }
      ];
    },
    enabled: searchCriteria.productCategory.length > 0
  });

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    
    return suppliers.filter(supplier => 
      supplier.matchScore >= searchFilters.minMatchScore &&
      supplier.costAnalysis.totalCostPerUnit <= searchFilters.maxCost &&
      (searchFilters.preferredRegions.length === 0 || searchFilters.preferredRegions.includes(supplier.location.region)) &&
      (searchFilters.requiredCertifications.length === 0 || 
       searchFilters.requiredCertifications.every(cert => 
         supplier.capabilities.some(cap => cap.certifications.includes(cert))))
    );
  }, [suppliers, searchFilters]);

  const handleSearch = useCallback(() => {
    setActiveTab('results');
    refetch();
  }, [refetch]);

  const handleSupplierSelect = useCallback((supplier: AlternativeSupplier) => {
    setSelectedSupplier(supplier);
  }, []);

  const startOnboarding = useCallback((supplier: AlternativeSupplier) => {
    setSelectedSupplier(supplier);
    setActiveTab('onboarding');
  }, []);

  const renderSearchTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Product Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Category</label>
            <select
              value={searchCriteria.productCategory}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, productCategory: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              <option value="electronics">Electronics Assembly</option>
              <option value="machining">Precision Machining</option>
              <option value="injection">Injection Molding</option>
              <option value="sheet-metal">Sheet Metal Fabrication</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Required</label>
            <input
              type="number"
              value={searchCriteria.quantity}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Price (USD)</label>
            <input
              type="number"
              step="0.01"
              value={searchCriteria.targetPrice}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, targetPrice: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Lead Time (days)</label>
            <input
              type="number"
              value={searchCriteria.maxLeadTime}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, maxLeadTime: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Priority Factors</h3>
        <div className="space-y-3">
          {searchCriteria.priorityFactors.map((factor, index) => (
            <div key={factor.factor} className="flex items-center space-x-4">
              <span className="w-20 text-sm font-medium text-gray-700 capitalize">{factor.factor}</span>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={factor.weight}
                  onChange={(e) => {
                    const newFactors = [...searchCriteria.priorityFactors];
                    newFactors[index].weight = parseInt(e.target.value);
                    setSearchCriteria(prev => ({ ...prev, priorityFactors: newFactors }));
                  }}
                  className="w-full"
                />
              </div>
              <span className="w-12 text-sm text-gray-600">{factor.weight}%</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSearch}
        disabled={!searchCriteria.productCategory}
        className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <MagnifyingGlassIcon className="h-5 w-5" />
        <span>Find Alternative Suppliers</span>
      </button>
    </div>
  );

  const renderResultsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Search Results</h3>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {filteredSuppliers.length} suppliers found
          </span>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          <FunnelIcon className="h-4 w-4" />
          <span>Filter</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Discovering suppliers...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{supplier.name}</h4>
                    <div className="flex items-center space-x-1">
                      <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{supplier.matchScore}% match</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      supplier.riskProfile.overallRisk === 'low' ? 'bg-green-100 text-green-800' :
                      supplier.riskProfile.overallRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {supplier.riskProfile.overallRisk} risk
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <MapPinIcon className="h-4 w-4" />
                      <span>{supplier.location.city}, {supplier.location.country}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      <span>${supplier.costAnalysis.totalCostPerUnit}/unit</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>{supplier.capabilities[0]?.leadTime.average} days</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {supplier.capabilities[0]?.certifications.map((cert) => (
                      <span key={cert} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {cert}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <span className="text-gray-600">Quality Score:</span>
                      <span className="ml-1 font-medium">{supplier.qualityPrediction.overallScore}%</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="ml-1 font-medium">{supplier.capabilities[0]?.capacity.monthly.toLocaleString()}/month</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleSupplierSelect(supplier)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => startOnboarding(supplier)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Start Onboarding
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderComparisonTab = () => {
    if (!suppliers || suppliers.length === 0) {
      return <div className="text-center py-12 text-gray-600">No suppliers to compare</div>;
    }

    const comparisonData = suppliers.map(supplier => ({
      name: supplier.name,
      cost: supplier.costAnalysis.totalCostPerUnit,
      quality: supplier.qualityPrediction.overallScore,
      leadTime: supplier.capabilities[0]?.leadTime.average || 0,
      matchScore: supplier.matchScore
    }));

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Supplier Comparison</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-base font-medium text-gray-900 mb-4">Cost vs Quality</h4>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cost" name="Cost per Unit" type="number" domain={['dataMin - 1', 'dataMax + 1']} />
                <YAxis dataKey="quality" name="Quality Score" type="number" domain={[80, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter dataKey="quality" fill="#3B82F6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-base font-medium text-gray-900 mb-4">Lead Time Comparison</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leadTime" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      <div className="text-sm text-gray-500">{supplier.location.city}, {supplier.location.country}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{supplier.matchScore}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">${supplier.costAnalysis.totalCostPerUnit}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{supplier.qualityPrediction.overallScore}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{supplier.capabilities[0]?.leadTime.average} days</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      supplier.riskProfile.overallRisk === 'low' ? 'bg-green-100 text-green-800' :
                      supplier.riskProfile.overallRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {supplier.riskProfile.overallRisk}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => startOnboarding(supplier)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Start Onboarding
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOnboardingTab = () => {
    if (!selectedSupplier) {
      return <div className="text-center py-12 text-gray-600">Select a supplier to view onboarding workflow</div>;
    }

    const workflow = selectedSupplier.onboardingWorkflow;
    const stageProgress = {
      discovery: 0,
      evaluation: 20,
      qualification: 40,
      negotiation: 60,
      contract: 80,
      onboarded: 100
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Onboarding: {selectedSupplier.name}
            </h3>
            <span className="text-sm text-gray-600">
              Est. completion: {new Date(workflow.estimatedCompletion).toLocaleDateString()}
            </span>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 capitalize">
                Current Stage: {workflow.stage}
              </span>
              <span className="text-sm text-gray-600">{workflow.progress}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${workflow.progress}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-3">Next Steps</h4>
              <div className="space-y-3">
                {workflow.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      step.status === 'completed' ? 'bg-green-500' :
                      step.status === 'in_progress' ? 'bg-blue-500' :
                      step.status === 'blocked' ? 'bg-red-500' :
                      'bg-gray-300'
                    }`}></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{step.step}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Owner: {step.owner} | Due: {new Date(step.dueDate).toLocaleDateString()}
                      </div>
                      {step.dependencies.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Dependencies: {step.dependencies.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-base font-medium text-gray-900 mb-3">Document Status</h4>
              <div className="space-y-3">
                {workflow.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                      <div className="text-xs text-gray-600">{doc.type}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.status === 'approved' && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                      {doc.status === 'rejected' && <XCircleIcon className="h-4 w-4 text-red-500" />}
                      {doc.status === 'submitted' && <DocumentTextIcon className="h-4 w-4 text-blue-500" />}
                      {doc.status === 'required' && <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />}
                      <span className={`text-xs font-medium ${
                        doc.status === 'approved' ? 'text-green-700' :
                        doc.status === 'rejected' ? 'text-red-700' :
                        doc.status === 'submitted' ? 'text-blue-700' :
                        'text-yellow-700'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-base font-medium text-gray-900 mb-4">Approvals Required</h4>
          <div className="space-y-3">
            {workflow.approvals.map((approval, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">{approval.approver}</div>
                  <div className="text-xs text-gray-600">{approval.role}</div>
                  {approval.comments && (
                    <div className="text-xs text-gray-500 mt-1 italic">"{approval.comments}"</div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {approval.status === 'approved' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                  {approval.status === 'rejected' && <XCircleIcon className="h-5 w-5 text-red-500" />}
                  {approval.status === 'pending' && <ClockIcon className="h-5 w-5 text-yellow-500" />}
                  <span className={`text-sm font-medium ${
                    approval.status === 'approved' ? 'text-green-700' :
                    approval.status === 'rejected' ? 'text-red-700' :
                    'text-yellow-700'
                  }`}>
                    {approval.status}
                  </span>
                  {approval.date && (
                    <span className="text-xs text-gray-500">
                      {new Date(approval.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedSupplier && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-base font-medium text-gray-900 mb-4">Supplier Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Contact Details</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>{selectedSupplier.contactInfo.primaryContact}</div>
                  <div>{selectedSupplier.contactInfo.email}</div>
                  <div>{selectedSupplier.contactInfo.phone}</div>
                  <div>{selectedSupplier.contactInfo.website}</div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Company Details</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Founded: {selectedSupplier.companyInfo.founded}</div>
                  <div>Employees: {selectedSupplier.companyInfo.employees}</div>
                  <div>Revenue: {selectedSupplier.companyInfo.annualRevenue}</div>
                  <div>Major Clients: {selectedSupplier.companyInfo.majorClients.join(', ')}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Alternative Supplier Finder</h1>
        <p className="text-gray-600">Discover, evaluate, and onboard new suppliers with AI-powered matching</p>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {[
            { key: 'search', label: 'Search Criteria', icon: MagnifyingGlassIcon },
            { key: 'results', label: 'Results', icon: GlobeAltIcon },
            { key: 'comparison', label: 'Comparison', icon: ChartBarIcon },
            { key: 'onboarding', label: 'Onboarding', icon: UserPlusIcon }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'results' && renderResultsTab()}
        {activeTab === 'comparison' && renderComparisonTab()}
        {activeTab === 'onboarding' && renderOnboardingTab()}
      </div>
    </div>
  );
};

export default AlternativeSupplierFinder;