import React, { useState, useEffect, useMemo } from 'react';
import {
  GlobeAltIcon,
  ShieldCheckIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  ScaleIcon,
  ClipboardDocumentCheckIcon,
  MapPinIcon,
  LanguageIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../theming';

export const GlobalComplianceSystem = ({
  className = '',
  selectedRegion = 'global',
  autoValidate = true,
  ...props
}) => {
  const { resolvedTheme } = useTheme();

  // Compliance states
  const [complianceStatus, setComplianceStatus] = useState({});
  const [certifications, setCertifications] = useState([]);
  const [auditSchedule, setAuditSchedule] = useState([]);
  const [violations, setViolations] = useState([]);
  const [regulatoryUpdates, setRegulatoryUpdates] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [isValidating, setIsValidating] = useState(false);

  // Manufacturing standards by region
  const MANUFACTURING_STANDARDS = {
    global: {
      ISO9001: { name: 'ISO 9001:2015', category: 'Quality Management', mandatory: true },
      ISO14001: { name: 'ISO 14001:2015', category: 'Environmental', mandatory: false },
      ISO45001: { name: 'ISO 45001:2018', category: 'OH&S', mandatory: true },
      IATF16949: { name: 'IATF 16949:2016', category: 'Automotive', mandatory: false }
    },
    usa: {
      FDA21CFR: { name: 'FDA 21 CFR Part 820', category: 'Medical Devices', mandatory: true },
      OSHA: { name: 'OSHA Standards', category: 'Safety', mandatory: true },
      EPA: { name: 'EPA Regulations', category: 'Environmental', mandatory: true },
      UL: { name: 'UL Certification', category: 'Product Safety', mandatory: false }
    },
    eu: {
      CE: { name: 'CE Marking', category: 'Product Conformity', mandatory: true },
      REACH: { name: 'REACH Regulation', category: 'Chemical Safety', mandatory: true },
      RoHS: { name: 'RoHS Directive', category: 'Hazardous Substances', mandatory: true },
      MDR: { name: 'MDR 2017/745', category: 'Medical Devices', mandatory: false }
    },
    asia: {
      CCC: { name: 'CCC (China)', category: 'Product Certification', mandatory: true },
      JIS: { name: 'JIS (Japan)', category: 'Industrial Standards', mandatory: false },
      BIS: { name: 'BIS (India)', category: 'Bureau Standards', mandatory: true },
      KS: { name: 'KS (Korea)', category: 'Korean Standards', mandatory: false }
    }
  };

  // Compliance metrics by standard
  const COMPLIANCE_METRICS = {
    ISO9001: {
      documentControl: 98,
      processAudits: 95,
      customerSatisfaction: 92,
      continuousImprovement: 88,
      managementReview: 100
    },
    ISO14001: {
      wasteReduction: 85,
      energyEfficiency: 78,
      emissionsControl: 92,
      resourceUsage: 81,
      environmentalTraining: 95
    },
    ISO45001: {
      incidentRate: 0.5,
      hazardIdentification: 96,
      riskAssessment: 93,
      emergencyPreparedness: 98,
      workerConsultation: 89
    }
  };

  // Initialize compliance data
  useEffect(() => {
    initializeComplianceData();
    loadCertifications();
    loadAuditSchedule();
    loadRegulatoryUpdates();
  }, [selectedRegion]);

  // Initialize compliance status
  const initializeComplianceData = () => {
    const standards = MANUFACTURING_STANDARDS[selectedRegion] || MANUFACTURING_STANDARDS.global;
    const status = {};
    
    Object.keys(standards).forEach(key => {
      const standard = standards[key];
      status[key] = {
        ...standard,
        complianceLevel: Math.floor(Math.random() * 100) + 80, // 80-100%
        lastAudit: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        nextAudit: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000),
        status: Math.random() > 0.2 ? 'compliant' : 'at-risk',
        issues: Math.floor(Math.random() * 100)
      };
    });
    
    setComplianceStatus(status);
  };

  // Load certifications
  const loadCertifications = () => {
    const certs = [
      {
        id: 'cert-001',
        standard: 'ISO 9001:2015',
        issuer: 'BSI Group',
        issueDate: '2023-03-15',
        expiryDate: '2026-03-14',
        status: 'active',
        scope: 'Manufacturing and Distribution'
      },
      {
        id: 'cert-002',
        standard: 'ISO 14001:2015',
        issuer: 'DNV GL',
        issueDate: '2023-06-20',
        expiryDate: '2026-06-19',
        status: 'active',
        scope: 'Environmental Management System'
      },
      {
        id: 'cert-003',
        standard: 'ISO 45001:2018',
        issuer: 'SGS',
        issueDate: '2023-09-10',
        expiryDate: '2026-09-09',
        status: 'active',
        scope: 'Occupational Health & Safety'
      },
      {
        id: 'cert-004',
        standard: 'CE Marking',
        issuer: 'TÜV Rheinland',
        issueDate: '2024-01-15',
        expiryDate: '2027-01-14',
        status: 'active',
        scope: 'Product Conformity Assessment'
      }
    ];
    
    setCertifications(certs);
  };

  // Load audit schedule
  const loadAuditSchedule = () => {
    const schedule = [
      {
        id: 'audit-001',
        type: 'Internal Audit',
        standard: 'ISO 9001',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        auditor: 'Internal Team',
        scope: 'Quality Management System',
        status: 'scheduled'
      },
      {
        id: 'audit-002',
        type: 'Surveillance Audit',
        standard: 'ISO 14001',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        auditor: 'DNV GL',
        scope: 'Environmental Compliance',
        status: 'scheduled'
      },
      {
        id: 'audit-003',
        type: 'Certification Audit',
        standard: 'IATF 16949',
        date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        auditor: 'BSI Group',
        scope: 'Automotive Quality',
        status: 'planned'
      },
      {
        id: 'audit-004',
        type: 'Regulatory Inspection',
        standard: 'FDA 21 CFR',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        auditor: 'FDA Inspector',
        scope: 'Medical Device Manufacturing',
        status: 'planned'
      }
    ];
    
    setAuditSchedule(schedule);
  };

  // Load regulatory updates
  const loadRegulatoryUpdates = () => {
    const updates = [
      {
        id: 'update-001',
        region: 'EU',
        regulation: 'MDR 2017/745',
        title: 'New Clinical Evaluation Requirements',
        effectiveDate: '2025-05-26',
        impact: 'high',
        description: 'Enhanced clinical evaluation documentation required for Class IIa devices'
      },
      {
        id: 'update-002',
        region: 'USA',
        regulation: 'FDA UDI',
        title: 'Unique Device Identification Update',
        effectiveDate: '2025-09-24',
        impact: 'medium',
        description: 'Extended UDI requirements for Class II medical devices'
      },
      {
        id: 'update-003',
        region: 'Global',
        regulation: 'ISO 9001',
        title: 'Draft Amendment Published',
        effectiveDate: '2026-01-01',
        impact: 'low',
        description: 'Minor updates to risk-based thinking requirements'
      }
    ];
    
    setRegulatoryUpdates(updates);
  };

  // Validate compliance
  const validateCompliance = async () => {
    setIsValidating(true);
    
    try {
      // Simulate validation process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for violations
      const newViolations = [];
      Object.entries(complianceStatus).forEach(([key, standard]) => {
        if (standard.complianceLevel < 85) {
          newViolations.push({
            id: `violation-${key}`,
            standard: standard.name,
            severity: standard.mandatory ? 'critical' : 'warning',
            description: `Compliance level below threshold: ${standard.complianceLevel}%`,
            actionRequired: true
          });
        }
      });
      
      setViolations(newViolations);
      
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // Calculate overall compliance score
  const calculateComplianceScore = () => {
    const standards = Object.values(complianceStatus);
    if (standards.length === 0) return 0;
    
    const totalScore = standards.reduce((sum, standard) => {
      const weight = standard.mandatory ? 2 : 1;
      return sum + (standard.complianceLevel * weight);
    }, 0);
    
    const totalWeight = standards.reduce((sum, standard) => {
      return sum + (standard.mandatory ? 2 : 1);
    }, 0);
    
    return Math.round(totalScore / totalWeight);
  };

  // Get compliance status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'at-risk':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'non-compliant':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  // Get impact color
  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const cardClasses = `
    rounded-lg border shadow-sm
    ${resolvedTheme === 'dark'
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-200'
    }
  `;

  const textPrimaryClasses = resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClasses = resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const textMutedClasses = resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`space-y-6 ${className}`} {...props}>
      {/* Header */}
      <div className={cardClasses}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <GlobeAltIcon className="w-6 h-6 mr-3 text-indigo-600" />
              <h2 className={`text-xl font-semibold ${textPrimaryClasses}`}>
                Global Compliance & Standards Management
              </h2>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  calculateComplianceScore() >= 90 ? 'text-green-600' :
                  calculateComplianceScore() >= 80 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {calculateComplianceScore()}%
                </div>
                <div className={`text-sm ${textMutedClasses}`}>
                  Compliance Score
                </div>
              </div>
              
              <button
                onClick={validateCompliance}
                disabled={isValidating}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${isValidating
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                  }
                `}
              >
                {isValidating ? 'Validating...' : 'Validate Compliance'}
              </button>
            </div>
          </div>

          {/* Region Selector */}
          <div className="flex space-x-2 mb-4">
            {Object.keys(MANUFACTURING_STANDARDS).map(region => (
              <button
                key={region}
                onClick={() => setViewMode('overview')}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedRegion === region
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }
                `}
              >
                {region.toUpperCase()}
              </button>
            ))}
          </div>

          {/* View Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['overview', 'certifications', 'audits', 'updates', 'metrics'].map(view => (
              <button
                key={view}
                onClick={() => setViewMode(view)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${viewMode === view
                    ? 'bg-white shadow text-indigo-600 dark:bg-gray-800 dark:text-indigo-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                  }
                `}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Standards Compliance */}
          <div className={`lg:col-span-2 ${cardClasses}`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${textPrimaryClasses}`}>
                Standards Compliance Status
              </h3>
              
              <div className="space-y-4">
                {Object.entries(complianceStatus).map(([key, standard]) => (
                  <div key={key} className={`
                    p-4 rounded-lg border
                    ${resolvedTheme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}
                  `}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className={`font-medium ${textPrimaryClasses}`}>
                          {standard.name}
                        </h4>
                        <p className={`text-sm ${textSecondaryClasses}`}>
                          {standard.category}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${getStatusColor(standard.status)}
                        `}>
                          {standard.status.replace('-', ' ').toUpperCase()}
                        </div>
                        {standard.mandatory && (
                          <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">
                            Mandatory
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className={textSecondaryClasses}>Compliance Level</span>
                        <span className={`font-medium ${
                          standard.complianceLevel >= 90 ? 'text-green-600' :
                          standard.complianceLevel >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {standard.complianceLevel}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className={`h-2 rounded-full ${
                            standard.complianceLevel >= 90 ? 'bg-green-600' :
                            standard.complianceLevel >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${standard.complianceLevel}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className={textMutedClasses}>
                        Last Audit: {standard.lastAudit.toLocaleDateString()}
                      </span>
                      <span className={textMutedClasses}>
                        Next Audit: {standard.nextAudit.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Active Certifications */}
            <div className={cardClasses}>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <CheckBadgeIcon className="w-5 h-5 mr-2 text-green-600" />
                  <h3 className={`font-semibold ${textPrimaryClasses}`}>
                    Active Certifications
                  </h3>
                </div>
                
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {certifications.filter(c => c.status === 'active').length}
                </div>
                
                <div className="space-y-2">
                  {certifications.slice(0, 3).map(cert => (
                    <div key={cert.id} className="flex justify-between text-sm">
                      <span className={textSecondaryClasses}>{cert.standard}</span>
                      <span className={textMutedClasses}>
                        {new Date(cert.expiryDate).getFullYear()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Audits */}
            <div className={cardClasses}>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <CalendarDaysIcon className="w-5 h-5 mr-2 text-blue-600" />
                  <h3 className={`font-semibold ${textPrimaryClasses}`}>
                    Upcoming Audits
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {auditSchedule.slice(0, 3).map(audit => (
                    <div key={audit.id} className="border-l-4 border-blue-500 pl-3">
                      <p className={`font-medium ${textPrimaryClasses}`}>
                        {audit.standard}
                      </p>
                      <p className={`text-sm ${textSecondaryClasses}`}>
                        {audit.type}
                      </p>
                      <p className={`text-xs ${textMutedClasses}`}>
                        {audit.date.toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other views would be implemented here */}
    </div>
  );
};

export default GlobalComplianceSystem;