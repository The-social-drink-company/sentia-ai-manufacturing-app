import React, { useState, useCallback, useMemo } from 'react';
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { BulkTransferModal } from './BulkTransferModal';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
}

interface InventoryItem {
  product_id: string;
  market_id: string;
  stock_level: number;
  optimal_level: number;
  reorder_point: number;
  max_capacity: number;
  unit_cost: number;
  last_updated: string;
  reserved: number;
  in_transit: number;
  pending_orders: number;
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

type StockStatus = 'optimal' | 'low' | 'critical' | 'excess' | 'out_of_stock';
type ViewMode = 'tabs' | 'split' | 'unified';

interface InventoryManagementGridProps {
  viewMode: ViewMode;
  activeMarket?: string;
  selectedMarkets?: string[];
  markets: Market[];
}

const PRODUCTS: Product[] = [
  { id: 'sensio-red', name: 'Sensio Red', sku: 'SEN-RED-001', category: 'Premium' },
  { id: 'sensio-black', name: 'Sensio Black', sku: 'SEN-BLK-001', category: 'Premium' },
  { id: 'sensio-gold', name: 'Sensio Gold', sku: 'SEN-GLD-001', category: 'Luxury' },
];

export function InventoryManagementGrid({ 
  viewMode, 
  activeMarket, 
  selectedMarkets, 
  markets 
}: InventoryManagementGridProps) {
  const [editingCell, setEditingCell] = useState<{productId: string, marketId: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkTransfer, setShowBulkTransfer] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  const queryClient = useQueryClient();

  // Get relevant markets based on view mode
  const relevantMarkets = useMemo(() => {
    if (viewMode === 'tabs' && activeMarket) {
      return markets.filter(m => m.id === activeMarket);
    } else if (viewMode === 'split' && selectedMarkets) {
      return markets.filter(m => selectedMarkets.includes(m.id));
    }
    return markets;
  }, [viewMode, activeMarket, selectedMarkets, markets]);

  // Fetch inventory data
  const { data: inventoryData = [], isLoading, refetch } = useQuery({
    queryKey: ['inventory', relevantMarkets.map(m => m.id)],
    queryFn: async () => {
      const marketIds = relevantMarkets.map(m => m.id).join(',');
      const response = await fetch(`/api/inventory/grid?markets=${marketIds}`);
      if (!response.ok) throw new Error('Failed to fetch inventory data');
      return response.json() as InventoryItem[];
    },
    refetchInterval: 30000,
  });

  // Real-time updates
  useWebSocket('/ws/inventory', {
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'inventory_update') {
          refetch();
        }
      } catch (error) {
        console.error('Error parsing inventory WebSocket message:', error);
      }
    },
  });

  // Update inventory mutation
  const updateInventoryMutation = useMutation({
    mutationFn: async ({ productId, marketId, field, value }: {
      productId: string;
      marketId: string;
      field: string;
      value: number;
    }) => {
      const response = await fetch(`/api/inventory/${productId}/${marketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error('Failed to update inventory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setEditingCell(null);
    },
  });

  const getStockStatus = useCallback((item: InventoryItem): StockStatus => {
    const availableStock = item.stock_level - item.reserved;
    
    if (availableStock <= 0) return 'out_of_stock';
    if (availableStock <= item.reorder_point * 0.5) return 'critical';
    if (availableStock <= item.reorder_point) return 'low';
    if (availableStock > item.optimal_level * 1.5) return 'excess';
    return 'optimal';
  }, []);

  const getStatusColor = useCallback((status: StockStatus) => {
    switch (status) {
      case 'optimal': return 'bg-green-100 text-green-800 border-green-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'excess': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'out_of_stock': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const formatCurrency = useCallback((amount: number, currency: string, locale: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  const formatNumber = useCallback((number: number, locale: string) => {
    return new Intl.NumberFormat(locale).format(number);
  }, []);

  const handleCellEdit = useCallback((productId: string, marketId: string, field: string, currentValue: string) => {
    setEditingCell({ productId, marketId, field });
    setEditValue(currentValue);
  }, []);

  const handleCellSave = useCallback(() => {
    if (!editingCell) return;
    
    const numericValue = parseFloat(editValue);
    if (isNaN(numericValue) || numericValue < 0) return;

    updateInventoryMutation.mutate({
      productId: editingCell.productId,
      marketId: editingCell.marketId,
      field: editingCell.field,
      value: numericValue,
    });
  }, [editingCell, editValue, updateInventoryMutation]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleProductSelect = useCallback((productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = PRODUCTS;
    
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortConfig.key as keyof Product];
        let bValue = b[sortConfig.key as keyof Product];
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [searchTerm, sortConfig]);

  const renderEditableCell = useCallback((
    productId: string, 
    marketId: string, 
    field: string, 
    value: number,
    market: Market
  ) => {
    const isEditing = editingCell?.productId === productId && 
                     editingCell?.marketId === marketId && 
                     editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center space-x-1">
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-20 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
          />
          <button
            onClick={handleCellSave}
            className="p-1 text-green-600 hover:text-green-800"
            disabled={updateInventoryMutation.isPending}
          >
            <CheckIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleCellCancel}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      );
    }

    const formattedValue = field === 'unit_cost' 
      ? formatCurrency(value, market.currency, market.locale)
      : formatNumber(value, market.locale);

    return (
      <div 
        className="group flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
        onClick={() => handleCellEdit(productId, marketId, field, value.toString())}
      >
        <span className="text-sm">{formattedValue}</span>
        <PencilIcon className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }, [editingCell, editValue, formatCurrency, formatNumber, handleCellEdit, handleCellSave, handleCellCancel, updateInventoryMutation.isPending]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="grid grid-cols-4 gap-4">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Inventory Management Grid</h2>
          
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Bulk Transfer */}
            <button
              onClick={() => setShowBulkTransfer(true)}
              disabled={selectedProducts.size === 0}
              className={cn(
                'px-4 py-2 text-sm rounded-lg transition-colors flex items-center space-x-2',
                selectedProducts.size > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <ArrowRightIcon className="h-4 w-4" />
              <span>Bulk Transfer ({selectedProducts.size})</span>
            </button>
          </div>
        </div>

        {/* Market Headers */}
        {viewMode !== 'tabs' && (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="font-medium">Markets:</span>
            {relevantMarkets.map((market) => (
              <div key={market.id} className="flex items-center space-x-2">
                <span className="text-lg">{market.flagEmoji}</span>
                <span>{market.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
                    } else {
                      setSelectedProducts(new Set());
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left">
                <button 
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Product</span>
                  {sortConfig?.key === 'name' && (
                    sortConfig.direction === 'asc' 
                      ? <ArrowUpIcon className="h-3 w-3" />
                      : <ArrowDownIcon className="h-3 w-3" />
                  )}
                </button>
              </th>
              {relevantMarkets.map((market) => (
                <th key={market.id} className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{market.flagEmoji}</span>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {market.code}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Stock • Cost • Status
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => handleProductSelect(product.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.sku}</div>
                    <div className="text-xs text-gray-400">{product.category}</div>
                  </div>
                </td>
                {relevantMarkets.map((market) => {
                  const inventoryItem = inventoryData.find(
                    item => item.product_id === product.id && item.market_id === market.id
                  );

                  if (!inventoryItem) {
                    return (
                      <td key={market.id} className="px-4 py-4 text-center text-gray-400">
                        <div className="text-sm">No data</div>
                      </td>
                    );
                  }

                  const status = getStockStatus(inventoryItem);
                  const availableStock = inventoryItem.stock_level - inventoryItem.reserved;

                  return (
                    <td key={market.id} className="px-4 py-4">
                      <div className="space-y-2">
                        {/* Stock Level */}
                        <div className="flex items-center justify-center">
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                            getStatusColor(status)
                          )}>
                            {formatNumber(availableStock, market.locale)} / {formatNumber(inventoryItem.optimal_level, market.locale)}
                          </span>
                        </div>

                        {/* Editable Fields */}
                        <div className="text-center space-y-1">
                          <div className="text-xs text-gray-600">
                            Cost: {renderEditableCell(product.id, market.id, 'unit_cost', inventoryItem.unit_cost, market)}
                          </div>
                          
                          {inventoryItem.in_transit > 0 && (
                            <div className="text-xs text-blue-600">
                              In Transit: {formatNumber(inventoryItem.in_transit, market.locale)}
                            </div>
                          )}
                          
                          {inventoryItem.reserved > 0 && (
                            <div className="text-xs text-amber-600">
                              Reserved: {formatNumber(inventoryItem.reserved, market.locale)}
                            </div>
                          )}
                        </div>

                        {/* Status Indicators */}
                        {status === 'critical' && (
                          <div className="flex justify-center">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Transfer Modal */}
      {showBulkTransfer && (
        <BulkTransferModal
          selectedProducts={Array.from(selectedProducts)}
          products={PRODUCTS}
          markets={markets}
          onClose={() => setShowBulkTransfer(false)}
          onTransfer={(transfers) => {
            // Handle bulk transfer
            console.log('Bulk transfers:', transfers);
            setShowBulkTransfer(false);
            setSelectedProducts(new Set());
          }}
        />
      )}
    </div>
  );
}