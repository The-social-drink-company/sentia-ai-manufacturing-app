import React, { useState, useCallback, useMemo } from 'react';
import {
  XMarkIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
}

interface Market {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
  currency: string;
  timezone: string;
  locale: string;
}

interface TransferItem {
  productId: string;
  fromMarket: string;
  toMarket: string;
  quantity: number;
  estimatedCost: number;
  estimatedDuration: string;
}

interface BulkTransferModalProps {
  selectedProducts: string[];
  products: Product[];
  markets: Market[];
  onClose: () => void;
  onTransfer: (transfers: TransferItem[]) => void;
}

export function BulkTransferModal({ 
  selectedProducts, 
  products, 
  markets, 
  onClose, 
  onTransfer 
}: BulkTransferModalProps) {
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'setup' | 'review' | 'confirm'>('setup');

  const queryClient = useQueryClient();

  // Get transfer cost estimates
  const transferCostMutation = useMutation({
    mutationFn: async (transfer: Omit<TransferItem, 'estimatedCost' | 'estimatedDuration'>) => {
      const response = await fetch('/api/inventory/transfer-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transfer),
      });
      if (!response.ok) throw new Error('Failed to get transfer cost');
      return response.json();
    },
  });

  // Execute transfers
  const executeTransfersMutation = useMutation({
    mutationFn: async (transferItems: TransferItem[]) => {
      const response = await fetch('/api/inventory/bulk-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transfers: transferItems }),
      });
      if (!response.ok) throw new Error('Failed to execute transfers');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onTransfer(transfers);
    },
  });

  const selectedProductsData = useMemo(() => {
    return products.filter(p => selectedProducts.includes(p.id));
  }, [products, selectedProducts]);

  const addTransfer = useCallback(() => {
    const newTransfer: TransferItem = {
      productId: selectedProducts[0] || '',
      fromMarket: '',
      toMarket: '',
      quantity: 0,
      estimatedCost: 0,
      estimatedDuration: '',
    };
    setTransfers(prev => [...prev, newTransfer]);
  }, [selectedProducts]);

  const updateTransfer = useCallback((index: number, field: keyof TransferItem, value: any) => {
    setTransfers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-calculate cost when key fields change
      if (['productId', 'fromMarket', 'toMarket', 'quantity'].includes(field) && 
          updated[index].productId && updated[index].fromMarket && 
          updated[index].toMarket && updated[index].quantity > 0) {
        
        transferCostMutation.mutate({
          productId: updated[index].productId,
          fromMarket: updated[index].fromMarket,
          toMarket: updated[index].toMarket,
          quantity: updated[index].quantity,
        }).then(result => {
          setTransfers(current => {
            const newest = [...current];
            newest[index] = {
              ...newest[index],
              estimatedCost: result.cost,
              estimatedDuration: result.duration,
            };
            return newest;
          });
        });
      }
      
      return updated;
    });
  }, [transferCostMutation]);

  const removeTransfer = useCallback((index: number) => {
    setTransfers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const validateTransfers = useCallback(() => {
    const errors: Record<string, string> = {};
    
    transfers.forEach((transfer, index) => {
      if (!transfer.productId) {
        errors[`${index}-product`] = 'Product is required';
      }
      if (!transfer.fromMarket) {
        errors[`${index}-from`] = 'Source market is required';
      }
      if (!transfer.toMarket) {
        errors[`${index}-to`] = 'Destination market is required';
      }
      if (transfer.fromMarket === transfer.toMarket) {
        errors[`${index}-markets`] = 'Source and destination must be different';
      }
      if (transfer.quantity <= 0) {
        errors[`${index}-quantity`] = 'Quantity must be greater than 0';
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [transfers]);

  const handleNext = useCallback(() => {
    if (step === 'setup') {
      if (validateTransfers()) {
        setStep('review');
      }
    } else if (step === 'review') {
      setStep('confirm');
    }
  }, [step, validateTransfers]);

  const handleExecute = useCallback(() => {
    executeTransfersMutation.mutate(transfers);
  }, [transfers, executeTransfersMutation]);

  const totalCost = useMemo(() => {
    return transfers.reduce((sum, transfer) => sum + transfer.estimatedCost, 0);
  }, [transfers]);

  const formatCurrency = useCallback((amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  }, []);

  const getMarketByCurrency = useCallback((currencyCode: string) => {
    return markets.find(m => m.currency === currencyCode) || markets[0];
  }, [markets]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Bulk Transfer - {selectedProducts.length} Products
                </h3>
                <p className="text-sm text-gray-500">
                  {step === 'setup' && 'Configure transfers for selected products'}
                  {step === 'review' && 'Review transfer details and costs'}
                  {step === 'confirm' && 'Confirm and execute transfers'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="mt-4 flex items-center space-x-4">
              {['setup', 'review', 'confirm'].map((stepName, index) => (
                <div key={stepName} className="flex items-center">
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                    step === stepName
                      ? 'bg-blue-600 text-white'
                      : index < ['setup', 'review', 'confirm'].indexOf(step)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  )}>
                    {index < ['setup', 'review', 'confirm'].indexOf(step) ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={cn(
                    'ml-2 text-sm font-medium',
                    step === stepName ? 'text-blue-600' : 'text-gray-500'
                  )}>
                    {stepName === 'setup' ? 'Setup' : stepName === 'review' ? 'Review' : 'Confirm'}
                  </span>
                  {index < 2 && <ArrowRightIcon className="h-4 w-4 text-gray-400 mx-4" />}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {step === 'setup' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Transfer Configuration</h4>
                  <button
                    onClick={addTransfer}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Transfer
                  </button>
                </div>

                {transfers.length === 0 ? (
                  <div className="text-center py-8">
                    <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transfers configured</p>
                    <p className="text-sm text-gray-500">Click "Add Transfer" to begin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transfers.map((transfer, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-6 gap-4">
                          {/* Product */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Product
                            </label>
                            <select
                              value={transfer.productId}
                              onChange={(e) => updateTransfer(index, 'productId', e.target.value)}
                              className={cn(
                                'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                validationErrors[`${index}-product`] ? 'border-red-300' : 'border-gray-300'
                              )}
                            >
                              <option value="">Select product</option>
                              {selectedProductsData.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                            {validationErrors[`${index}-product`] && (
                              <p className="text-xs text-red-600 mt-1">{validationErrors[`${index}-product`]}</p>
                            )}
                          </div>

                          {/* From Market */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              From
                            </label>
                            <select
                              value={transfer.fromMarket}
                              onChange={(e) => updateTransfer(index, 'fromMarket', e.target.value)}
                              className={cn(
                                'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                validationErrors[`${index}-from`] ? 'border-red-300' : 'border-gray-300'
                              )}
                            >
                              <option value="">Select source</option>
                              {markets.map(market => (
                                <option key={market.id} value={market.id}>
                                  {market.flagEmoji} {market.code}
                                </option>
                              ))}
                            </select>
                            {validationErrors[`${index}-from`] && (
                              <p className="text-xs text-red-600 mt-1">{validationErrors[`${index}-from`]}</p>
                            )}
                          </div>

                          {/* To Market */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              To
                            </label>
                            <select
                              value={transfer.toMarket}
                              onChange={(e) => updateTransfer(index, 'toMarket', e.target.value)}
                              className={cn(
                                'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                validationErrors[`${index}-to`] ? 'border-red-300' : 'border-gray-300'
                              )}
                            >
                              <option value="">Select destination</option>
                              {markets.map(market => (
                                <option key={market.id} value={market.id}>
                                  {market.flagEmoji} {market.code}
                                </option>
                              ))}
                            </select>
                            {validationErrors[`${index}-to`] && (
                              <p className="text-xs text-red-600 mt-1">{validationErrors[`${index}-to`]}</p>
                            )}
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={transfer.quantity || ''}
                              onChange={(e) => updateTransfer(index, 'quantity', parseInt(e.target.value) || 0)}
                              className={cn(
                                'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                validationErrors[`${index}-quantity`] ? 'border-red-300' : 'border-gray-300'
                              )}
                              placeholder="0"
                            />
                            {validationErrors[`${index}-quantity`] && (
                              <p className="text-xs text-red-600 mt-1">{validationErrors[`${index}-quantity`]}</p>
                            )}
                          </div>

                          {/* Estimated Cost */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Est. Cost
                            </label>
                            <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg">
                              {transfer.estimatedCost > 0 ? (
                                formatCurrency(transfer.estimatedCost, 'USD')
                              ) : (
                                <span className="text-gray-400">--</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-end">
                            <button
                              onClick={() => removeTransfer(index)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove transfer"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Duration and Errors */}
                        <div className="mt-2 flex items-center justify-between">
                          {transfer.estimatedDuration && (
                            <div className="text-xs text-gray-600">
                              Estimated duration: {transfer.estimatedDuration}
                            </div>
                          )}
                          {validationErrors[`${index}-markets`] && (
                            <div className="flex items-center text-xs text-red-600">
                              <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              {validationErrors[`${index}-markets`]}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 'review' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Transfer Summary</h4>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Total Transfers:</span>
                      <span className="ml-2">{transfers.length}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Total Items:</span>
                      <span className="ml-2">{transfers.reduce((sum, t) => sum + t.quantity, 0)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Total Cost:</span>
                      <span className="ml-2">{formatCurrency(totalCost, 'USD')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {transfers.map((transfer, index) => {
                    const product = selectedProductsData.find(p => p.id === transfer.productId);
                    const fromMarket = markets.find(m => m.id === transfer.fromMarket);
                    const toMarket = markets.find(m => m.id === transfer.toMarket);
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <div className="font-medium text-gray-900">{product?.name}</div>
                              <div className="text-sm text-gray-500">{product?.sku}</div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="flex items-center">
                                {fromMarket?.flagEmoji} {fromMarket?.code}
                              </span>
                              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                              <span className="flex items-center">
                                {toMarket?.flagEmoji} {toMarket?.code}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">{transfer.quantity}</span> units
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(transfer.estimatedCost, 'USD')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transfer.estimatedDuration}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Confirm Transfer Execution</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      This action will initiate {transfers.length} inventory transfers with a total cost of {formatCurrency(totalCost, 'USD')}. 
                      This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-800 mb-2">What happens next:</h5>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Transfer requests will be created in the system</li>
                    <li>• Inventory will be reserved at source locations</li>
                    <li>• Shipping arrangements will be initiated</li>
                    <li>• You'll receive notifications on transfer progress</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
            <div className="flex items-center space-x-4">
              {step !== 'setup' && (
                <button
                  onClick={() => setStep(step === 'confirm' ? 'review' : 'setup')}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
              )}
              {totalCost > 0 && (
                <div className="flex items-center text-sm text-gray-600">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  Total: {formatCurrency(totalCost, 'USD')}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              
              {step !== 'confirm' ? (
                <button
                  onClick={handleNext}
                  disabled={transfers.length === 0}
                  className={cn(
                    'px-4 py-2 text-sm rounded-lg transition-colors',
                    transfers.length > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {step === 'setup' ? 'Review Transfers' : 'Confirm'}
                </button>
              ) : (
                <button
                  onClick={handleExecute}
                  disabled={executeTransfersMutation.isPending}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {executeTransfersMutation.isPending ? 'Executing...' : 'Execute Transfers'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}