import React, { useState, useEffect, useMemo } from 'react';
import { Settings, AlertTriangle, CheckCircle, Info, Play, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ValidationConfig = ({ 
  importJobId, 
  dataType, 
  mappingConfig = {},
  onValidationStart,
  onError 
}) => {
  const [validationRules, setValidationRules] = useState({});
  const [customRules, setCustomRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewResults, setPreviewResults] = useState(null);

  // Default validation rule configurations based on data type
  const defaultRuleConfigs = {
    products: {
      sku: {
        label: 'Product SKU',
        description: 'Unique product identifier',
        rules: [
          { type: 'required', enabled: true, configurable: false },
          { type: 'format', enabled: true, pattern: '^[A-Z0-9\\-_]{3,50}$', configurable: true },
          { type: 'unique', enabled: true, configurable: false }
        ]
      },
      selling_price: {
        label: 'Selling Price',
        description: 'Product selling price',
        rules: [
          { type: 'required', enabled: true, configurable: false },
          { type: 'min', enabled: true, value: 0.01, configurable: true },
          { type: 'max', enabled: true, value: 10000, configurable: true },
          { type: 'business_rule', enabled: true, rule: 'selling_price > unit_cost', configurable: false }
        ]
      },
      weight_kg: {
        label: 'Weight (kg)',
        description: 'Product weight in kilograms',
        rules: [
          { type: 'required', enabled: true, configurable: false },
          { type: 'min', enabled: true, value: 0.001, configurable: true },
          { type: 'max', enabled: true, value: 50, configurable: true },
          { type: 'precision', enabled: true, value: 3, configurable: true }
        ]
      }
    },
    historical_sales: {
      sku: {
        label: 'Product SKU',
        description: 'Product identifier',
        rules: [
          { type: 'required', enabled: true, configurable: false },
          { type: 'foreign_key', enabled: true, table: 'products', configurable: false }
        ]
      },
      quantity_sold: {
        label: 'Quantity Sold',
        description: 'Number of units sold',
        rules: [
          { type: 'required', enabled: true, configurable: false },
          { type: 'min', enabled: true, value: 1, configurable: true },
          { type: 'max', enabled: true, value: 10000, configurable: true },
          { type: 'type', enabled: true, value: 'integer', configurable: false }
        ]
      },
      unit_price: {
        label: 'Unit Price',
        description: 'Price per unit',
        rules: [
          { type: 'required', enabled: true, configurable: false },
          { type: 'min', enabled: true, value: 0.01, configurable: true },
          { type: 'max', enabled: true, value: 1000, configurable: true },
          { type: 'precision', enabled: true, value: 2, configurable: true }
        ]
      },
      currency: {
        label: 'Currency',
        description: 'Transaction currency',
        rules: [
          { type: 'required', enabled: true, configurable: false },
          { type: 'enum', enabled: true, values: ['GBP', 'EUR', 'USD'], configurable: true }
        ]
      }
    },
    inventory_levels: {
      sku: {
        label: 'Product SKU',
        description: 'Product identifier',
        rules: [
          { type: 'required', enabled: true, configurable: false },
          { type: 'foreign_key', enabled: true, table: 'products', configurable: false }
        ]
      },
      quantity_on_hand: {
        label: 'Quantity on Hand',
        description: 'Current stock quantity',
        rules: [
          { type: 'required', enabled: true, configurable: false },
          { type: 'min', enabled: true, value: 0, configurable: false },
          { type: 'type', enabled: true, value: 'integer', configurable: false }
        ]
      }
    },
    manufacturing_data: {
      job_number: {
        label: 'Job Number',
        description: 'Unique job identifier',
        rules: [
          { type: 'required', enabled: true, configurable: false },
          { type: 'unique', enabled: true, configurable: false },
          { type: 'min_length', enabled: true, value: 3, configurable: true }
        ]
      },
      defect_rate: {
        label: 'Defect Rate (%)',
        description: 'Percentage of defective units',
        rules: [
          { type: 'min', enabled: true, value: 0, configurable: false },
          { type: 'max', enabled: true, value: 100, configurable: false },
          { type: 'warning_threshold', enabled: true, value: 10, message: 'High defect rate', configurable: true }
        ]
      }
    },
    financial_data: {
      transaction_date: {
        label: 'Transaction Date',
        description: 'Date of transaction',
        rules: [
          { type: 'required', enabled: true, configurable: false },
          { type: 'date_format', enabled: true, format: 'YYYY-MM-DD', configurable: true },
          { type: 'date_range', enabled: true, min: '2020-01-01', maxDaysFromNow: 0, configurable: true }
        ]
      },
      currency: {
        label: 'Currency',
        description: 'Transaction currency',
        rules: [
          { type: 'required', enabled: true, configurable: false },
          { type: 'enum', enabled: true, values: ['GBP', 'EUR', 'USD'], configurable: true }
        ]
      }
    }
  };

  useEffect(() => {
    initializeValidationRules();
  }, [dataType, mappingConfig]);

  const initializeValidationRules = () => {
    const defaultConfig = defaultRuleConfigs[dataType] || {};\n    const initialRules = {};\n\n    // Initialize rules for mapped fields only\n    Object.entries(mappingConfig).forEach(([targetField, sourceField]) => {\n      if (sourceField && defaultConfig[targetField]) {\n        initialRules[targetField] = {\n          ...defaultConfig[targetField],\n          sourceField,\n          enabled: true\n        };\n      }\n    });\n\n    setValidationRules(initialRules);\n  };\n\n  const updateRuleConfig = (fieldName, ruleType, property, value) => {\n    setValidationRules(prev => ({\n      ...prev,\n      [fieldName]: {\n        ...prev[fieldName],\n        rules: prev[fieldName].rules.map(rule => \n          rule.type === ruleType \n            ? { ...rule, [property]: value }\n            : rule\n        )\n      }\n    }));\n  };\n\n  const toggleRule = (fieldName, ruleType, enabled) => {\n    updateRuleConfig(fieldName, ruleType, 'enabled', enabled);\n  };\n\n  const addCustomRule = () => {\n    const newRule = {\n      id: Date.now(),\n      name: '',\n      description: '',\n      expression: '',\n      severity: 'error', // error, warning, info\n      enabled: true\n    };\n    setCustomRules(prev => [...prev, newRule]);\n  };\n\n  const updateCustomRule = (id, property, value) => {\n    setCustomRules(prev => \n      prev.map(rule => \n        rule.id === id \n          ? { ...rule, [property]: value }\n          : rule\n      )\n    );\n  };\n\n  const removeCustomRule = (id) => {\n    setCustomRules(prev => prev.filter(rule => rule.id !== id));\n  };\n\n  const runValidationPreview = async () => {\n    setLoading(true);\n    try {\n      const response = await fetch('/api/import/validate-preview', {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json'\n        },\n        body: JSON.stringify({\n          importJobId,\n          validationRules,\n          customRules: customRules.filter(rule => rule.enabled && rule.expression),\n          sampleSize: 10\n        })\n      });\n      \n      const data = await response.json();\n      if (data.success) {\n        setPreviewResults(data.results);\n      } else {\n        onError && onError(data.error);\n      }\n    } catch (error) {\n      console.error('Validation preview failed:', error);\n      onError && onError('Validation preview failed');\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  const startFullValidation = () => {\n    const config = {\n      validationRules,\n      customRules: customRules.filter(rule => rule.enabled && rule.expression)\n    };\n    \n    onValidationStart && onValidationStart({\n      importJobId,\n      validationConfig: config\n    });\n  };\n\n  const exportConfig = () => {\n    const config = {\n      importJobId,\n      dataType,\n      mappingConfig,\n      validationRules,\n      customRules,\n      timestamp: new Date().toISOString()\n    };\n    \n    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });\n    const url = URL.createObjectURL(blob);\n    const a = document.createElement('a');\n    a.href = url;\n    a.download = `validation-config-${importJobId}.json`;\n    document.body.appendChild(a);\n    a.click();\n    document.body.removeChild(a);\n    URL.revokeObjectURL(url);\n  };\n\n  const validationSummary = useMemo(() => {\n    const totalFields = Object.keys(validationRules).length;\n    const enabledFields = Object.values(validationRules).filter(field => field.enabled).length;\n    const totalRules = Object.values(validationRules).reduce(\n      (acc, field) => acc + field.rules.filter(rule => rule.enabled).length, 0\n    );\n    const customRulesCount = customRules.filter(rule => rule.enabled).length;\n    \n    return {\n      totalFields,\n      enabledFields,\n      totalRules: totalRules + customRulesCount,\n      customRulesCount\n    };\n  }, [validationRules, customRules]);\n\n  return (\n    <div className=\"space-y-6\">\n      {/* Header */}\n      <Card>\n        <CardHeader>\n          <div className=\"flex items-center justify-between\">\n            <CardTitle className=\"flex items-center gap-2\">\n              <Settings className=\"h-5 w-5\" />\n              Validation Configuration\n            </CardTitle>\n            <div className=\"flex gap-2\">\n              <Button variant=\"outline\" size=\"sm\" onClick={exportConfig}>\n                <Download className=\"h-4 w-4 mr-2\" />\n                Export Config\n              </Button>\n              <Button \n                variant=\"outline\" \n                size=\"sm\" \n                onClick={runValidationPreview}\n                disabled={loading}\n              >\n                <Info className=\"h-4 w-4 mr-2\" />\n                Preview (10 rows)\n              </Button>\n            </div>\n          </div>\n          <div className=\"flex items-center gap-4 text-sm text-gray-600\">\n            <span>Data Type: {dataType?.replace('_', ' ').toUpperCase()}</span>\n            <span>•</span>\n            <span>Fields: {validationSummary.enabledFields} of {validationSummary.totalFields}</span>\n            <span>•</span>\n            <span>Rules: {validationSummary.totalRules}</span>\n          </div>\n        </CardHeader>\n      </Card>\n\n      <Tabs defaultValue=\"field-rules\" className=\"w-full\">\n        <TabsList className=\"grid w-full grid-cols-3\">\n          <TabsTrigger value=\"field-rules\">Field Rules</TabsTrigger>\n          <TabsTrigger value=\"custom-rules\">Custom Rules</TabsTrigger>\n          <TabsTrigger value=\"preview\">Preview Results</TabsTrigger>\n        </TabsList>\n\n        {/* Field Rules Tab */}\n        <TabsContent value=\"field-rules\" className=\"space-y-4\">\n          {Object.entries(validationRules).map(([fieldName, fieldConfig]) => (\n            <Card key={fieldName}>\n              <CardHeader className=\"pb-3\">\n                <div className=\"flex items-center justify-between\">\n                  <div>\n                    <h4 className=\"font-medium\">{fieldConfig.label}</h4>\n                    <p className=\"text-sm text-gray-500\">\n                      {fieldConfig.description} • Source: {fieldConfig.sourceField}\n                    </p>\n                  </div>\n                  <Switch\n                    checked={fieldConfig.enabled}\n                    onCheckedChange={(enabled) => \n                      setValidationRules(prev => ({\n                        ...prev,\n                        [fieldName]: { ...prev[fieldName], enabled }\n                      }))\n                    }\n                  />\n                </div>\n              </CardHeader>\n              <CardContent className=\"space-y-3\">\n                {fieldConfig.rules.map((rule, index) => (\n                  <div key={index} className=\"flex items-center justify-between p-3 bg-gray-50 rounded-lg\">\n                    <div className=\"flex items-center gap-3\">\n                      <Switch\n                        checked={rule.enabled}\n                        onCheckedChange={(enabled) => toggleRule(fieldName, rule.type, enabled)}\n                        disabled={!rule.configurable}\n                      />\n                      <div>\n                        <span className=\"font-medium text-sm\">\n                          {rule.type.replace('_', ' ').toUpperCase()}\n                        </span>\n                        {rule.description && (\n                          <p className=\"text-xs text-gray-500\">{rule.description}</p>\n                        )}\n                      </div>\n                    </div>\n                    \n                    <div className=\"flex items-center gap-2\">\n                      {rule.configurable && rule.enabled && (\n                        <>\n                          {(rule.type === 'min' || rule.type === 'max') && (\n                            <Input\n                              type=\"number\"\n                              value={rule.value || ''}\n                              onChange={(e) => updateRuleConfig(fieldName, rule.type, 'value', parseFloat(e.target.value))}\n                              className=\"w-20 h-8\"\n                              step=\"0.01\"\n                            />\n                          )}\n                          {rule.type === 'enum' && (\n                            <Input\n                              value={rule.values?.join(', ') || ''}\n                              onChange={(e) => updateRuleConfig(fieldName, rule.type, 'values', e.target.value.split(',').map(v => v.trim()))}\n                              className=\"w-32 h-8\"\n                              placeholder=\"val1, val2\"\n                            />\n                          )}\n                          {rule.type === 'format' && (\n                            <Input\n                              value={rule.pattern || ''}\n                              onChange={(e) => updateRuleConfig(fieldName, rule.type, 'pattern', e.target.value)}\n                              className=\"w-40 h-8\"\n                              placeholder=\"regex pattern\"\n                            />\n                          )}\n                        </>\n                      )}\n                      \n                      {!rule.configurable && (\n                        <Badge variant=\"secondary\" className=\"text-xs\">\n                          System Rule\n                        </Badge>\n                      )}\n                    </div>\n                  </div>\n                ))}\n              </CardContent>\n            </Card>\n          ))}\n        </TabsContent>\n\n        {/* Custom Rules Tab */}\n        <TabsContent value=\"custom-rules\" className=\"space-y-4\">\n          <Card>\n            <CardHeader>\n              <div className=\"flex items-center justify-between\">\n                <CardTitle className=\"text-lg\">Custom Validation Rules</CardTitle>\n                <Button onClick={addCustomRule} size=\"sm\">\n                  Add Custom Rule\n                </Button>\n              </div>\n            </CardHeader>\n            <CardContent className=\"space-y-4\">\n              {customRules.length === 0 ? (\n                <div className=\"text-center py-8 text-gray-500\">\n                  <AlertTriangle className=\"h-8 w-8 mx-auto mb-2 opacity-50\" />\n                  <p>No custom rules defined</p>\n                  <p className=\"text-sm\">Add custom rules to implement business-specific validations</p>\n                </div>\n              ) : (\n                customRules.map((rule) => (\n                  <Card key={rule.id} className=\"p-4\">\n                    <div className=\"space-y-3\">\n                      <div className=\"flex items-center justify-between\">\n                        <div className=\"flex items-center gap-2\">\n                          <Switch\n                            checked={rule.enabled}\n                            onCheckedChange={(enabled) => updateCustomRule(rule.id, 'enabled', enabled)}\n                          />\n                          <Input\n                            value={rule.name}\n                            onChange={(e) => updateCustomRule(rule.id, 'name', e.target.value)}\n                            placeholder=\"Rule name\"\n                            className=\"font-medium\"\n                          />\n                        </div>\n                        <Button\n                          variant=\"outline\"\n                          size=\"sm\"\n                          onClick={() => removeCustomRule(rule.id)}\n                        >\n                          Remove\n                        </Button>\n                      </div>\n                      \n                      <Input\n                        value={rule.description}\n                        onChange={(e) => updateCustomRule(rule.id, 'description', e.target.value)}\n                        placeholder=\"Rule description\"\n                      />\n                      \n                      <div className=\"grid grid-cols-4 gap-2\">\n                        <div className=\"col-span-3\">\n                          <Input\n                            value={rule.expression}\n                            onChange={(e) => updateCustomRule(rule.id, 'expression', e.target.value)}\n                            placeholder=\"e.g., selling_price > unit_cost * 1.1\"\n                          />\n                        </div>\n                        <select\n                          value={rule.severity}\n                          onChange={(e) => updateCustomRule(rule.id, 'severity', e.target.value)}\n                          className=\"px-3 py-2 border border-gray-300 rounded-md text-sm\"\n                        >\n                          <option value=\"error\">Error</option>\n                          <option value=\"warning\">Warning</option>\n                          <option value=\"info\">Info</option>\n                        </select>\n                      </div>\n                    </div>\n                  </Card>\n                ))\n              )}\n            </CardContent>\n          </Card>\n        </TabsContent>\n\n        {/* Preview Results Tab */}\n        <TabsContent value=\"preview\" className=\"space-y-4\">\n          <Card>\n            <CardHeader>\n              <CardTitle className=\"text-lg\">Validation Preview</CardTitle>\n            </CardHeader>\n            <CardContent>\n              {!previewResults ? (\n                <div className=\"text-center py-8\">\n                  <Info className=\"h-8 w-8 mx-auto mb-2 text-gray-400\" />\n                  <p className=\"text-gray-500\">Run a validation preview to see how your rules perform</p>\n                  <Button \n                    className=\"mt-4\" \n                    onClick={runValidationPreview}\n                    disabled={loading}\n                  >\n                    {loading ? 'Running Preview...' : 'Run Preview'}\n                  </Button>\n                </div>\n              ) : (\n                <div className=\"space-y-4\">\n                  <div className=\"grid grid-cols-3 gap-4\">\n                    <div className=\"bg-green-50 p-4 rounded-lg text-center\">\n                      <div className=\"text-2xl font-bold text-green-600\">\n                        {previewResults.validRows}\n                      </div>\n                      <div className=\"text-sm text-green-700\">Valid Rows</div>\n                    </div>\n                    <div className=\"bg-red-50 p-4 rounded-lg text-center\">\n                      <div className=\"text-2xl font-bold text-red-600\">\n                        {previewResults.errorRows}\n                      </div>\n                      <div className=\"text-sm text-red-700\">Error Rows</div>\n                    </div>\n                    <div className=\"bg-yellow-50 p-4 rounded-lg text-center\">\n                      <div className=\"text-2xl font-bold text-yellow-600\">\n                        {previewResults.warningRows}\n                      </div>\n                      <div className=\"text-sm text-yellow-700\">Warning Rows</div>\n                    </div>\n                  </div>\n                  \n                  {previewResults.summary?.errors?.length > 0 && (\n                    <Alert variant=\"destructive\">\n                      <AlertTriangle className=\"h-4 w-4\" />\n                      <AlertDescription>\n                        <strong>{previewResults.summary.errors.length} validation errors found</strong>\n                        <ScrollArea className=\"h-32 mt-2\">\n                          <ul className=\"space-y-1 text-sm\">\n                            {previewResults.summary.errors.slice(0, 10).map((error, index) => (\n                              <li key={index}>Row {error.rowNumber}: {error.message}</li>\n                            ))}\n                          </ul>\n                        </ScrollArea>\n                      </AlertDescription>\n                    </Alert>\n                  )}\n                </div>\n              )}\n            </CardContent>\n          </Card>\n        </TabsContent>\n      </Tabs>\n\n      {/* Action Buttons */}\n      <div className=\"flex justify-between\">\n        <Button variant=\"outline\" onClick={() => window.history.back()}>\n          Back to Mapping\n        </Button>\n        <Button \n          onClick={startFullValidation}\n          disabled={validationSummary.totalRules === 0}\n          className=\"min-w-[150px]\"\n        >\n          <Play className=\"h-4 w-4 mr-2\" />\n          Start Validation\n        </Button>\n      </div>\n    </div>\n  );\n};\n\nexport default ValidationConfig;"}