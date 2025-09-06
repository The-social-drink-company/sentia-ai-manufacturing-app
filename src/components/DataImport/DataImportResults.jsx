<<<<<<< HEAD
import { devLog } from '../lib/devLog.js';\nimport React, { useState, useEffect, useMemo } from 'react';
=======
import { devLog } from '../../lib/devLog.js';
import React, { useState, useEffect, useMemo } from 'react';
>>>>>>> 320fc348c3f5d778596ec72fe2dbced535701ad7
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Download, 
  RefreshCw, 
  Eye, 
  Filter,
  FileText,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const DataImportResults = ({ importJobId, onRetry, onNewImport }) => {
  const [loading, setLoading] = useState(true);
  const [importJob, setImportJob] = useState(null);
  const [validationResults, setValidationResults] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (importJobId) {
      fetchImportResults();
      // Set up auto-refresh if job is still processing
      const interval = setInterval(() => {
        if (importJob?.status === 'processing' || importJob?.status === 'validating') {
          fetchImportResults(true);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [importJobId, importJob?.status]);

  const fetchImportResults = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [jobResponse, resultsResponse] = await Promise.all([
        fetch(`/api/import/status/${importJobId}`),
        fetch(`/api/import/results/${importJobId}`)
      ]);

      const jobData = await jobResponse.json();
      const resultsData = await resultsResponse.json();

      if (jobData.success && resultsData.success) {
        setImportJob(jobData.importJob);
        setValidationResults(resultsData.validationResults || []);
      } else {
        setError(jobData.error || resultsData.error || 'Failed to load import results');
      }
    } catch (error) {
      devLog.error('Failed to fetch import results:', error);
      setError('Failed to fetch import results');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredResults = useMemo(() => {
    if (!validationResults) return [];
    
    switch (selectedFilter) {
      case 'valid':
        return validationResults.filter(r => r.status === 'valid');
      case 'error':
        return validationResults.filter(r => r.status === 'error');
      case 'warning':
        return validationResults.filter(r => r.warnings && r.warnings.length > 0);
      default:
        return validationResults;
    }
  }, [validationResults, selectedFilter]);

  const summary = useMemo(() => {
    if (!importJob) return null;

    const completionPercentage = importJob.totalRows > 0 
      ? Math.round((importJob.processedRows / importJob.totalRows) * 100) 
      : 0;

    const errorRate = importJob.totalRows > 0 
      ? Math.round((importJob.errorRows / importJob.totalRows) * 100) 
      : 0;

    const warningCount = validationResults.filter(r => r.warnings && r.warnings.length > 0).length;

    return {
      completionPercentage,
      errorRate,
      warningCount,
      successRate: 100 - errorRate
    };
  }, [importJob, validationResults]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className=\"h-5 w-5 text-green-500\" />;
      case 'completed_with_errors':
        return <AlertTriangle className=\"h-5 w-5 text-yellow-500\" />;
      case 'failed':
        return <XCircle className=\"h-5 w-5 text-red-500\" />;
      case 'processing':
      case 'validating':
        return <RefreshCw className=\"h-5 w-5 text-blue-500 animate-spin\" />;
      default:
        return <AlertCircle className=\"h-5 w-5 text-gray-500\" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed_with_errors':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
      case 'validating':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportResults = () => {
    const exportData = {
      importJob,
      validationResults: filteredResults,
      summary,
      exportTimestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-results-${importJobId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    const errorResults = validationResults.filter(r => r.status === 'error');
    
    if (errorResults.length === 0) {
      alert('No errors to export');
      return;
    }

    const csvHeader = 'Row Number,Field,Error Code,Error Message,Original Data\\n';
    const csvContent = errorResults.map(result => {
      return result.errors.map(error => {
        const originalDataStr = JSON.stringify(result.originalData).replace(/\"/g, '\"\"');
        return `${result.rowNumber},\"${error.field}\",\"${error.code}\",\"${error.message}\",\"${originalDataStr}\"`;
      }).join('\\n');
    }).join('\\n');

    const blob = new Blob([csvHeader + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${importJobId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className=\"w-full\">
        <CardContent className=\"flex items-center justify-center p-8\">
          <div className=\"text-center\">
            <RefreshCw className=\"h-8 w-8 animate-spin mx-auto mb-4\" />
            <p>Loading import results...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant=\"destructive\">
        <AlertCircle className=\"h-4 w-4\" />
        <AlertDescription>
          {error}
          <Button variant=\"outline\" size=\"sm\" className=\"ml-4\" onClick={() => fetchImportResults()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!importJob) {
    return (
      <Alert>
        <AlertCircle className=\"h-4 w-4\" />
        <AlertDescription>Import job not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header with Status */}
      <Card>
        <CardHeader>
          <div className=\"flex items-center justify-between\">
            <div className=\"flex items-center gap-3\">
              {getStatusIcon(importJob.status)}
              <div>
                <CardTitle className=\"flex items-center gap-2\">
                  Import Results
                  {refreshing && <RefreshCw className=\"h-4 w-4 animate-spin\" />}
                </CardTitle>
                <p className=\"text-sm text-gray-600 mt-1\">
                  File: {importJob.filename} • Job ID: {importJob.id}
                </p>
              </div>
            </div>
            
            <div className=\"flex items-center gap-2\">
              <Badge className={getStatusColor(importJob.status)}>
                {importJob.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Button variant=\"outline\" size=\"sm\" onClick={() => fetchImportResults()}>
                <RefreshCw className=\"h-4 w-4 mr-2\" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Progress Bar for Processing Jobs */}
          {(importJob.status === 'processing' || importJob.status === 'validating') && (
            <div className=\"mt-4\">
              <div className=\"flex justify-between items-center mb-2\">
                <span className=\"text-sm font-medium\">
                  {importJob.status === 'processing' ? 'Processing...' : 'Validating...'}
                </span>
                <span className=\"text-sm text-gray-500\">
                  {summary?.completionPercentage || 0}%
                </span>
              </div>
              <Progress value={summary?.completionPercentage || 0} className=\"w-full\" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4\">
          <Card>
            <CardContent className=\"p-4 text-center\">
              <div className=\"text-2xl font-bold text-blue-600\">{importJob.totalRows}</div>
              <div className=\"text-sm text-gray-600\">Total Rows</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className=\"p-4 text-center\">
              <div className=\"text-2xl font-bold text-green-600\">{importJob.processedRows}</div>
              <div className=\"text-sm text-gray-600\">Valid Rows</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className=\"p-4 text-center\">
              <div className=\"text-2xl font-bold text-red-600\">{importJob.errorRows}</div>
              <div className=\"text-sm text-gray-600\">Error Rows</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className=\"p-4 text-center\">
              <div className=\"text-2xl font-bold text-yellow-600\">{summary.warningCount}</div>
              <div className=\"text-sm text-gray-600\">Warnings</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success/Error Rate */}
      {summary && importJob.status !== 'processing' && importJob.status !== 'validating' && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center gap-2\">
              <BarChart3 className=\"h-5 w-5\" />
              Data Quality Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-4\">
              <div>
                <div className=\"flex justify-between items-center mb-2\">
                  <span className=\"text-sm font-medium\">Success Rate</span>
                  <span className=\"text-sm text-gray-600\">{summary.successRate}%</span>
                </div>
                <Progress value={summary.successRate} className=\"w-full\" />
              </div>
              
              {summary.errorRate > 0 && (
                <Alert variant={summary.errorRate > 20 ? \"destructive\" : \"default\"}>
                  <AlertTriangle className=\"h-4 w-4\" />
                  <AlertDescription>
                    {summary.errorRate}% of rows have validation errors. 
                    {summary.errorRate > 20 && ' Consider reviewing your data before importing.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <div className=\"flex items-center justify-between\">
            <CardTitle className=\"flex items-center gap-2\">
              <FileText className=\"h-5 w-5\" />
              Validation Results
            </CardTitle>
            <div className=\"flex items-center gap-2\">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className=\"w-40\">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"all\">All Results</SelectItem>
                  <SelectItem value=\"valid\">Valid Only</SelectItem>
                  <SelectItem value=\"error\">Errors Only</SelectItem>
                  <SelectItem value=\"warning\">Warnings Only</SelectItem>
                </SelectContent>
              </Select>
              <Button variant=\"outline\" size=\"sm\" onClick={exportResults}>
                <Download className=\"h-4 w-4 mr-2\" />
                Export
              </Button>
              {importJob.errorRows > 0 && (
                <Button variant=\"outline\" size=\"sm\" onClick={downloadErrorReport}>
                  <Download className=\"h-4 w-4 mr-2\" />
                  Error Report
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className=\"text-center py-8 text-gray-500\">
              <Eye className=\"h-8 w-8 mx-auto mb-2 opacity-50\" />
              <p>No results to display</p>
            </div>
          ) : (
            <ScrollArea className=\"h-96 w-full\">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className=\"w-20\">Row</TableHead>
                    <TableHead className=\"w-20\">Status</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead className=\"w-32\">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className=\"font-mono\">{result.rowNumber}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={result.status === 'valid' ? 'default' : 'destructive'}
                          className=\"text-xs\"
                        >
                          {result.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className=\"space-y-1\">
                          {result.errors && result.errors.map((error, index) => (
                            <div key={index} className=\"text-sm text-red-600 bg-red-50 px-2 py-1 rounded\">
                              <strong>{error.field}:</strong> {error.message}
                            </div>
                          ))}
                          {result.warnings && result.warnings.map((warning, index) => (
                            <div key={index} className=\"text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded\">
                              <strong>{warning.field}:</strong> {warning.message}
                            </div>
                          ))}
                          {result.status === 'valid' && (
                            <div className=\"text-sm text-green-600\">✓ All validations passed</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant=\"outline\" 
                          size=\"sm\"
                          onClick={() => {
                            // Show row details modal (implement as needed)
                            devLog.log('Show row details:', result);
                          }}
                        >
                          <Eye className=\"h-3 w-3 mr-1\" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className=\"flex justify-between\">
        <div className=\"flex gap-2\">
          {onRetry && (
            <Button variant=\"outline\" onClick={() => onRetry(importJob)}>
              <RefreshCw className=\"h-4 w-4 mr-2\" />
              Retry Import
            </Button>
          )}
          {onNewImport && (
            <Button variant=\"outline\" onClick={onNewImport}>
              Upload New File
            </Button>
          )}
        </div>
        
        {importJob.status === 'completed' && importJob.errorRows === 0 && (
          <Button className=\"bg-green-600 hover:bg-green-700\">
            <CheckCircle className=\"h-4 w-4 mr-2\" />
            Finalize Import
          </Button>
        )}
      </div>
    </div>
  );
};

export default DataImportResults;"}