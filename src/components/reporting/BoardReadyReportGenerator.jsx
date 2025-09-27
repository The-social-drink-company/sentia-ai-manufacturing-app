import React, { useState } from 'react';
import {
  DocumentTextIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PrinterIcon,
  ShareIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';

export default function BoardReadyReportGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState('executive');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedSections, setSelectedSections] = useState([
    'executive_summary',
    'financial_performance',
    'operational_metrics',
    'quality_overview'
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTemplates = [
    {
      id: 'executive',
      name: 'Executive Summary',
      description: 'High-level overview for board meetings',
      sections: ['Executive Summary', 'KPIs', 'Financial Highlights', 'Strategic Initiatives'],
      estimatedTime: '2-3 minutes'
    },
    {
      id: 'operational',
      name: 'Operational Report',
      description: 'Detailed operational performance analysis',
      sections: ['Production Metrics', 'Quality Control', 'Efficiency Analysis', 'Resource Utilization'],
      estimatedTime: '5-7 minutes'
    },
    {
      id: 'financial',
      name: 'Financial Analysis',
      description: 'Comprehensive financial performance report',
      sections: ['P&L Summary', 'Cash Flow', 'Working Capital', 'ROI Analysis'],
      estimatedTime: '3-5 minutes'
    },
    {
      id: 'quarterly',
      name: 'Quarterly Review',
      description: 'Complete quarterly business review',
      sections: ['All Metrics', 'Trend Analysis', 'Forecasts', 'Action Plans'],
      estimatedTime: '10-15 minutes'
    }
  ];

  const availableSections = [
    { id: 'executive_summary', name: 'Executive Summary', description: 'Key highlights and insights' },
    { id: 'financial_performance', name: 'Financial Performance', description: 'Revenue, profit, cash flow metrics' },
    { id: 'operational_metrics', name: 'Operational Metrics', description: 'Production, efficiency, quality data' },
    { id: 'quality_overview', name: 'Quality Overview', description: 'Quality control and defect analysis' },
    { id: 'workforce_analytics', name: 'Workforce Analytics', description: 'Productivity and safety metrics' },
    { id: 'ai_insights', name: 'AI Insights', description: 'AI-generated recommendations and predictions' },
    { id: 'risk_assessment', name: 'Risk Assessment', description: 'Identified risks and mitigation strategies' },
    { id: 'market_analysis', name: 'Market Analysis', description: 'Market trends and competitive position' }
  ];

  const recentReports = [
    {
      id: 'RPT-001',
      name: 'Q3 2024 Executive Summary',
      type: 'Executive Summary',
      createdBy: 'Sarah Johnson',
      createdAt: '2024-09-15',
      status: 'completed',
      downloads: 23
    },
    {
      id: 'RPT-002',
      name: 'September Operational Review',
      type: 'Operational Report',
      createdBy: 'Mike Chen',
      createdAt: '2024-09-01',
      status: 'completed',
      downloads: 15
    },
    {
      id: 'RPT-003',
      name: 'Weekly Financial Summary',
      type: 'Financial Analysis',
      createdBy: 'Emma Davis',
      createdAt: '2024-09-22',
      status: 'generating',
      downloads: 0
    }
  ];

  const handleSectionToggle = (sectionId) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      // Here you would typically trigger the actual report generation
      alert('Report generated successfully! It would normally download automatically.');
    }, 3000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'generating': return <ClockIcon className="w-4 h-4 text-blue-500" />;
      case 'error': return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default: return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'generating': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Board-Ready Report Generator
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generate professional reports for executive presentations
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
              <Cog6ToothIcon className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Report Template
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                        <div className="mt-2">
                          <p className="text-xs text-gray-400">Includes:</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {template.sections.join(', ')}
                          </p>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          Est. generation time: {template.estimatedTime}
                        </p>
                      </div>
                      {selectedTemplate === template.id && (
                        <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Period */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Report Period
              </h3>
              <div className="flex space-x-3">
                {[
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'quarter', label: 'This Quarter' },
                  { value: 'year', label: 'This Year' },
                  { value: 'custom', label: 'Custom Range' }
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === period.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Report Sections
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableSections.map((section) => (
                  <div
                    key={section.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSections.includes(section.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                    onClick={() => handleSectionToggle(section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {section.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                      </div>
                      {selectedSections.includes(section.id) && (
                        <CheckCircleIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || selectedSections.length === 0}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <ClockIcon className="w-5 h-5 animate-spin" />
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>Generate Report</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Report will be generated as PDF and automatically downloaded
              </p>
            </div>
          </div>

          {/* Recent Reports & Preview */}
          <div className="space-y-6">
            {/* Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Report Preview
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                <PresentationChartLineIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {reportTemplates.find(t => t.id === selectedTemplate)?.name} Preview
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  {selectedSections.length} sections selected for {selectedPeriod}
                </p>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  {selectedSections.map(sectionId => {
                    const section = availableSections.find(s => s.id === sectionId);
                    return <p key={sectionId}>• {section?.name}</p>;
                  })}
                </div>
              </div>
            </div>

            {/* Recent Reports */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Reports
              </h3>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div key={report.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {report.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {report.type} • Created by {report.createdBy}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{report.createdAt}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full flex items-center space-x-1 ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          <span className="text-xs font-medium capitalize">{report.status}</span>
                        </div>
                      </div>
                    </div>

                    {report.status === 'completed' && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-xs text-gray-500">{report.downloads} downloads</span>
                        <div className="flex space-x-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <ShareIcon className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <PrinterIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}