import { devLog } from '../lib/devLog.js';\nimport React, { useState, useEffect, useMemo } from 'react';
import { Eye, ArrowRight, Settings, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const DataPreviewMapper = ({ 
  importJobId, 
  previewData = null,
  onMappingComplete,
  onError 
}) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(previewData);
  const [mapping, setMapping] = useState({});
  const [validationSummary, setValidationSummary] = useState(null);
  const [error, setError] = useState(null);

  // Predefined field mappings for different data types
  const fieldMappings = {
    products: [
      { field: 'sku', label: 'SKU/Product Code', required: true },
      { field: 'name', label: 'Product Name', required: true },
      { field: 'category', label: 'Category', required: false },
      { field: 'weight_kg', label: 'Weight (kg)', required: false },
      { field: 'dimensions_cm', label: 'Dimensions (cm)', required: false },
      { field: 'unit_cost', label: 'Unit Cost', required: false },
      { field: 'selling_price', label: 'Selling Price', required: false },
      { field: 'production_time_hours', label: 'Production Time (hours)', required: false },
      { field: 'batch_size_min', label: 'Min Batch Size', required: false },
      { field: 'batch_size_max', label: 'Max Batch Size', required: false }
    ],
    historical_sales: [
      { field: 'sku', label: 'Product SKU', required: true },
      { field: 'sale_date', label: 'Sale Date', required: true },
      { field: 'quantity_sold', label: 'Quantity Sold', required: true },
      { field: 'unit_price', label: 'Unit Price', required: true },
      { field: 'currency', label: 'Currency', required: true },
      { field: 'sales_channel', label: 'Sales Channel', required: false },
      { field: 'shipping_country', label: 'Shipping Country', required: false },
      { field: 'gross_revenue', label: 'Gross Revenue', required: false },
      { field: 'discounts', label: 'Discounts', required: false },
      { field: 'net_revenue', label: 'Net Revenue', required: false }
    ],
    inventory_levels: [
      { field: 'sku', label: 'Product SKU', required: true },
      { field: 'warehouse_location', label: 'Warehouse Location', required: true },
      { field: 'quantity_on_hand', label: 'Quantity on Hand', required: true },
      { field: 'reserved_quantity', label: 'Reserved Quantity', required: false },
      { field: 'available_quantity', label: 'Available Quantity', required: false },
      { field: 'reorder_point', label: 'Reorder Point', required: false },
      { field: 'max_stock_level', label: 'Max Stock Level', required: false },
      { field: 'last_updated', label: 'Last Updated', required: false }
    ],
    manufacturing_data: [
      { field: 'job_number', label: 'Job Number', required: true },
      { field: 'product_sku', label: 'Product SKU', required: true },
      { field: 'batch_number', label: 'Batch Number', required: true },
      { field: 'quantity_produced', label: 'Quantity Produced', required: true },
      { field: 'production_date', label: 'Production Date', required: true },
      { field: 'quality_score', label: 'Quality Score', required: false },
      { field: 'defect_rate', label: 'Defect Rate (%)', required: false },
      { field: 'production_cost', label: 'Production Cost', required: false },
      { field: 'yield_percentage', label: 'Yield Percentage', required: false }
    ],
    financial_data: [
      { field: 'transaction_date', label: 'Transaction Date', required: true },
      { field: 'transaction_type', label: 'Transaction Type', required: true },
      { field: 'amount', label: 'Amount', required: true },
      { field: 'currency', label: 'Currency', required: true },
      { field: 'account_code', label: 'Account Code', required: false },
      { field: 'description', label: 'Description', required: false },
      { field: 'reference_number', label: 'Reference Number', required: false }
    ]
  };

  useEffect(() => {
    if (importJobId && !preview) {
      fetchPreview();
    }
  }, [importJobId]);

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/import/preview/${importJobId}`);
      const data = await response.json();

      if (data.success) {
        setPreview(data);
        // Auto-map fields if possible
        autoMapFields(data.headers, data.dataType);
      } else {
        setError(data.error || 'Failed to load preview');
        onError && onError(data);
      }
    } catch (error) {
      devLog.error('Preview fetch error:', error);
      setError('Failed to load preview');
      onError && onError(error);
    } finally {
      setLoading(false);
    }
  };

  const autoMapFields = (headers, dataType) => {
    if (!headers || !dataType || !fieldMappings[dataType]) return;

    const newMapping = {};
    const targetFields = fieldMappings[dataType];

    targetFields.forEach(targetField => {
      // Try to find matching headers (case-insensitive, with fuzzy matching)
      const matchedHeader = headers.find(header => {
        const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
        const normalizedTarget = targetField.field.toLowerCase().replace(/[_\s-]/g, '');
        
        return normalizedHeader === normalizedTarget || 
               normalizedHeader.includes(normalizedTarget) ||
               normalizedTarget.includes(normalizedHeader);
      });

      if (matchedHeader) {
        newMapping[targetField.field] = matchedHeader;
      }
    });

    setMapping(newMapping);
  };

  const updateMapping = (targetField, sourceHeader) => {
    setMapping(prev => ({
      ...prev,
      [targetField]: sourceHeader === 'unmapped' ? undefined : sourceHeader
    }));
  };

  const validateMapping = () => {
    if (!preview?.dataType || !fieldMappings[preview.dataType]) return null;

    const targetFields = fieldMappings[preview.dataType];
    const requiredFields = targetFields.filter(f => f.required);
    const mappedRequiredFields = requiredFields.filter(f => mapping[f.field]);
    const unmappedRequired = requiredFields.filter(f => !mapping[f.field]);
    
    return {
      totalRequired: requiredFields.length,
      mappedRequired: mappedRequiredFields.length,
      unmappedRequired: unmappedRequired,
      isValid: unmappedRequired.length === 0
    };
  };

  const validation = useMemo(() => validateMapping(), [mapping, preview]);

  const handleProceed = () => {
    if (validation?.isValid) {
      onMappingComplete && onMappingComplete({
        importJobId,
        mapping,
        validation
      });
    }
  };

  const exportMapping = () => {
    const mappingData = {
      importJobId,
      dataType: preview?.dataType,
      mapping,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(mappingData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapping-config-${importJobId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading preview...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!preview) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No preview data available</AlertDescription>
      </Alert>
    );
  }

  const targetFields = fieldMappings[preview.dataType] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Data Preview & Field Mapping
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>File: {preview.filename}</span>
            <span>•</span>
            <span>Rows: {preview.totalRows}</span>
            <span>•</span>
            <span>Type: {preview.dataType?.replace('_', ' ').toUpperCase()}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {preview.headers?.map((header, index) => (
                    <TableHead key={index} className="min-w-[120px]">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.preview?.map((row, index) => (
                  <TableRow key={index}>
                    {preview.headers?.map((header, colIndex) => (
                      <TableCell key={colIndex} className="max-w-[200px] truncate">
                        {row[header] || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Field Mapping */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Field Mapping</CardTitle>
            <Button variant="outline" size="sm" onClick={exportMapping}>
              <Download className="h-4 w-4 mr-2" />
              Export Mapping
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {targetFields.map((field) => (
              <div key={field.field} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="font-medium">{field.label}</label>
                    {field.required && (
                      <Badge variant="destructive" size="sm">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Target field: {field.field}
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 text-gray-400" />

                <div className="flex-1">
                  <Select 
                    value={mapping[field.field] || 'unmapped'} 
                    onValueChange={(value) => updateMapping(field.field, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unmapped">
                        <span className="text-gray-500">— Not mapped —</span>
                      </SelectItem>
                      {preview.headers?.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-6">
                  {mapping[field.field] ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : field.required ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <div className="h-5 w-5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mapping Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Required Fields Mapped:</span>
                <Badge variant={validation.isValid ? "default" : "destructive"}>
                  {validation.mappedRequired} of {validation.totalRequired}
                </Badge>
              </div>

              {validation.unmappedRequired.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="mb-2">
                      <strong>Missing required field mappings:</strong>
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.unmappedRequired.map((field) => (
                        <li key={field.field}>{field.label}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validation.isValid && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    All required fields are mapped! You can proceed to validation.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Upload
        </Button>
        <Button 
          onClick={handleProceed} 
          disabled={!validation?.isValid}
          className="min-w-[150px]"
        >
          <Settings className="h-4 w-4 mr-2" />
          Proceed to Validation
        </Button>
      </div>
    </div>
  );
};

export default DataPreviewMapper;