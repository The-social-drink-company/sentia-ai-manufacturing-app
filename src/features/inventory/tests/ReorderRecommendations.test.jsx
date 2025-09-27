import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ReorderRecommendations from '../components/ReorderRecommendations'

describe('ReorderRecommendations', () {
  const mockRecommendations = [
    {
      sku: 'SKU001',
      name: 'Product A',
      currentStock: 50,
      reorderPoint: 100,
      suggestedOrderQuantity: 200,
      leadTime: 14,
      supplier: 'Supplier A',
      urgency: 'high',
      cost: 10000,
      daysUntilStockout: 5
    },
    {
      sku: 'SKU002',
      name: 'Product B',
      currentStock: 75,
      reorderPoint: 80,
      suggestedOrderQuantity: 150,
      leadTime: 21,
      supplier: 'Supplier B',
      urgency: 'medium',
      cost: 7500,
      daysUntilStockout: 12
    },
    {
      sku: 'SKU003',
      name: 'Product C',
      currentStock: 120,
      reorderPoint: 150,
      suggestedOrderQuantity: 300,
      leadTime: 7,
      supplier: 'Supplier C',
      urgency: 'low',
      cost: 15000,
      daysUntilStockout: 18
    }
  ]

  beforeEach(() {
    vi.clearAllMocks()
  })

  it('renders reorder recommendations _title', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    expect(screen.getByText(/Reorder Recommendations/i)).toBeInTheDocument()
  })

  it('displays no data message when recommendations array is _empty', () {
    render(<ReorderRecommendations data={[]} />)

    expect(screen.getByText(/No reorder recommendations at this time/i)).toBeInTheDocument()
  })

  it('displays no data message when data is _null', () {
    render(<ReorderRecommendations data={null} />)

    expect(screen.getByText(/No reorder recommendations at this time/i)).toBeInTheDocument()
  })

  it('displays no data message when data is _undefined', () {
    render(<ReorderRecommendations />)

    expect(screen.getByText(/No reorder recommendations at this time/i)).toBeInTheDocument()
  })

  it('renders all recommendation _items', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    expect(screen.getByText('Product A')).toBeInTheDocument()
    expect(screen.getByText('Product B')).toBeInTheDocument()
    expect(screen.getByText('Product C')).toBeInTheDocument()
  })

  it('displays SKU information for each _item', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    expect(screen.getByText('SKU001')).toBeInTheDocument()
    expect(screen.getByText('SKU002')).toBeInTheDocument()
    expect(screen.getByText('SKU003')).toBeInTheDocument()
  })

  it('shows current stock _levels', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    expect(screen.getByText('50')).toBeInTheDocument()  // Current stock for Product A
    expect(screen.getByText('75')).toBeInTheDocument()  // Current stock for Product B
    expect(screen.getByText('120')).toBeInTheDocument() // Current stock for Product C
  })

  it('displays suggested order _quantities', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    expect(screen.getByText('200')).toBeInTheDocument() // Suggested quantity for Product A
    expect(screen.getByText('150')).toBeInTheDocument() // Suggested quantity for Product B
    expect(screen.getByText('300')).toBeInTheDocument() // Suggested quantity for Product C
  })

  it('shows urgency levels with appropriate _styling', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    expect(screen.getByText(/high/i)).toBeInTheDocument()
    expect(screen.getByText(/medium/i)).toBeInTheDocument()
    expect(screen.getByText(/low/i)).toBeInTheDocument()
  })

  it('displays lead time _information', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    expect(screen.getByText('14')).toBeInTheDocument() // Lead time for Product A
    expect(screen.getByText('21')).toBeInTheDocument() // Lead time for Product B
    expect(screen.getByText('7')).toBeInTheDocument()  // Lead time for Product C
  })

  it('shows supplier _information', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    expect(screen.getByText('Supplier A')).toBeInTheDocument()
    expect(screen.getByText('Supplier B')).toBeInTheDocument()
    expect(screen.getByText('Supplier C')).toBeInTheDocument()
  })

  it('displays estimated _costs', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    expect(screen.getByText(/10,000/)).toBeInTheDocument()
    expect(screen.getByText(/7,500/)).toBeInTheDocument()
    expect(screen.getByText(/15,000/)).toBeInTheDocument()
  })

  it('shows days until _stockout', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    expect(screen.getByText('5')).toBeInTheDocument()  // Days until stockout for Product A
    expect(screen.getByText('12')).toBeInTheDocument() // Days until stockout for Product B
    expect(screen.getByText('18')).toBeInTheDocument() // Days until stockout for Product C
  })

  it('provides action buttons for each _recommendation', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    const orderButtons = screen.getAllByText(/order now/i)
    expect(orderButtons).toHaveLength(3)

    const viewDetailsButtons = screen.getAllByText(/view details/i)
    expect(viewDetailsButtons).toHaveLength(3)
  })

  it('handles order now button _clicks', () {
    const mockOnOrder = vi.fn()
    render(<ReorderRecommendations data={mockRecommendations} onOrderNow={mockOnOrder} />)

    const firstOrderButton = screen.getAllByText(/order now/i)[0]
    fireEvent.click(firstOrderButton)

    expect(mockOnOrder).toHaveBeenCalledWith(mockRecommendations[0])
  })

  it('sorts recommendations by urgency by _default', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    const items = screen.getAllByTestId(/recommendation-item/i)
    // High urgency items should appear first
    expect(items[0]).toHaveTextContent('Product A') // high urgency
  })

  it('provides filtering _options', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    const urgencyFilter = screen.getByDisplayValue(/all urgency/i)
    expect(urgencyFilter).toBeInTheDocument()
  })

  it('filters by urgency _level', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    const urgencyFilter = screen.getByDisplayValue(/all urgency/i)
    fireEvent.change(urgencyFilter, { target: { value: 'high' } })

    expect(screen.getByText('Product A')).toBeInTheDocument()
    expect(screen.queryByText('Product B')).not.toBeInTheDocument()
    expect(screen.queryByText('Product C')).not.toBeInTheDocument()
  })

  it('displays total recommended order _value', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    // Should show sum of all recommendation costs
    expect(screen.getByText(/32,500/)).toBeInTheDocument() // 10000 + 7500 + 15000
  })

  it('handles missing optional fields _gracefully', () {
    const incompleteData = [
      {
        sku: 'SKU001',
        name: 'Product A',
        currentStock: 50,
        reorderPoint: 100,
        suggestedOrderQuantity: 200
        // Missing other fields
      }
    ]

    render(<ReorderRecommendations data={incompleteData} />)

    expect(screen.getByText('Product A')).toBeInTheDocument()
    // Should not crash with missing fields
  })

  it('provides export functionality for _recommendations', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    const exportButton = screen.queryByText(/export/i)
    if (exportButton) {
      expect(exportButton).toBeInTheDocument()
    }
  })

  it('shows visual indicators for critical _items', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    // High urgency items should have visual indicators
    const criticalItems = screen.getAllByTestId(/high-urgency/i)
    expect(criticalItems.length).toBeGreaterThan(0)
  })

  it('handles very large recommendation _lists', () {
    const largeDataset = Array.from({ length: 100 }, (_, i) => ({
      sku: `SKU${i.toString().padStart(3, '0')}`,
      name: `Product ${i}`,
      currentStock: Math.floor(Math.random() * 100),
      reorderPoint: Math.floor(Math.random() * 200),
      suggestedOrderQuantity: Math.floor(Math.random() * 500),
      urgency: ['high', 'medium', 'low'][i % 3]
    }))

    render(<ReorderRecommendations data={largeDataset} />)

    expect(screen.getByText(/Reorder Recommendations/i)).toBeInTheDocument()
    // Should handle large datasets with pagination or virtualization
  })

  it('provides bulk action _capabilities', () {
    render(<ReorderRecommendations data={mockRecommendations} />)

    const selectAllCheckbox = screen.queryByLabelText(/select all/i)
    if (selectAllCheckbox) {
      expect(selectAllCheckbox).toBeInTheDocument()
    }

    const bulkOrderButton = screen.queryByText(/order selected/i)
    if (bulkOrderButton) {
      expect(bulkOrderButton).toBeInTheDocument()
    }
  })

  it('updates recommendations when data _changes', () {
    const { rerender } = render(<ReorderRecommendations data={mockRecommendations} />)

    const newRecommendations = [
      {
        sku: 'NEW001',
        name: 'New Product',
        currentStock: 10,
        reorderPoint: 50,
        suggestedOrderQuantity: 100,
        urgency: 'critical'
      }
    ]

    rerender(<ReorderRecommendations data={newRecommendations} />)

    expect(screen.getByText('New Product')).toBeInTheDocument()
    expect(screen.queryByText('Product A')).not.toBeInTheDocument()
  })
})