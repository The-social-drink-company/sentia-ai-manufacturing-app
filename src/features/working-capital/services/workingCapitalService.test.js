import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchWorkingCapitalMetrics, exportWorkingCapitalData } from './workingCapitalService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock DOM methods
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();

Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: mockClick,
    style: {}
  })),
  writable: true
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn()
};
global.localStorage = mockLocalStorage;

describe('workingCapitalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchWorkingCapitalMetrics', () => {
    const mockMCPResponse = {
      cashPosition: 1500000,
      cashTrend: 5.2,
      dso: 35,
      arAging: {
        current: 450000,
        '1-30': 125000,
        '31-60': 65000,
        '61-90': 25000,
        '90+': 15000,
        total: 680000
      },
      source: 'mcp'
    };

    const mockAPIResponse = {
      cashPosition: 1600000,
      cashTrend: 6.1,
      dso: 33,
      arAging: {
        current: 500000,
        '1-30': 120000,
        '31-60': 60000,
        '61-90': 20000,
        '90+': 10000,
        total: 710000
      },
      source: 'api'
    };

    it('returns MCP data when MCP server is available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMCPResponse)
      });

      const result = await fetchWorkingCapitalMetrics('month');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://mcp-server-tkyu.onrender.com/v1/financial/working-capital?period=month',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      expect(result).toEqual({
        ...mockMCPResponse,
        source: 'mcp'
      });
    });

    it('falls back to API when MCP server fails', async () => {
      // MCP server fails
      mockFetch.mockRejectedValueOnce(new Error('MCP server unavailable'));

      // API succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAPIResponse)
      });

      const result = await fetchWorkingCapitalMetrics('quarter');

      expect(mockFetch).toHaveBeenCalledTimes(2);

      // First call to MCP server
      expect(mockFetch).toHaveBeenNthCalledWith(1,
        'https://mcp-server-tkyu.onrender.com/v1/financial/working-capital?period=quarter',
        expect.anything()
      );

      // Second call to API
      expect(mockFetch).toHaveBeenNthCalledWith(2,
        '/api/working-capital/metrics?period=quarter',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }
        })
      );

      expect(result).toEqual({
        ...mockAPIResponse,
        source: 'api'
      });
    });

    it('falls back to mock data when both MCP and API fail', async () => {
      // Both MCP and API fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await fetchWorkingCapitalMetrics('week');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.source).toBe('mock');
      expect(result.cashPosition).toBeGreaterThan(0);
      expect(result.arAging).toBeDefined();
      expect(result.apAging).toBeDefined();
      expect(result.inventory).toBeDefined();
      expect(result.alerts).toBeDefined();
    });

    it('handles MCP server returning non-ok response', async () => {
      // MCP server returns 500
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // API succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAPIResponse)
      });

      const result = await fetchWorkingCapitalMetrics();

      expect(result).toEqual({
        ...mockAPIResponse,
        source: 'api'
      });
    });

    it('includes authorization token in API requests', async () => {
      mockFetch.mockRejectedValueOnce(new Error('MCP unavailable'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAPIResponse)
      });

      await fetchWorkingCapitalMetrics();

      expect(mockFetch).toHaveBeenNthCalledWith(2,
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });

    it('generates mock data with proper structure', async () => {
      mockFetch.mockRejectedValue(new Error('All services down'));

      const result = await fetchWorkingCapitalMetrics('year');

      expect(result).toMatchObject({
        cashPosition: expect.any(Number),
        cashTrend: expect.any(Number),
        dso: expect.any(Number),
        dpo: expect.any(Number),
        dio: expect.any(Number),
        cashConversionCycle: expect.any(Number),
        arAging: {
          current: expect.any(Number),
          '1-30': expect.any(Number),
          '31-60': expect.any(Number),
          '61-90': expect.any(Number),
          '90+': expect.any(Number),
          total: expect.any(Number)
        },
        apAging: {
          current: expect.any(Number),
          '1-30': expect.any(Number),
          '31-60': expect.any(Number),
          '61-90': expect.any(Number),
          '90+': expect.any(Number),
          total: expect.any(Number)
        },
        inventory: {
          totalValue: expect.any(Number),
          turnoverRatio: expect.any(Number),
          daysOnHand: expect.any(Number)
        },
        cashFlow: expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(String),
            inflows: expect.any(Number),
            outflows: expect.any(Number),
            net: expect.any(Number)
          })
        ]),
        alerts: expect.arrayContaining([
          expect.objectContaining({
            severity: expect.any(String),
            message: expect.any(String)
          })
        ]),
        source: 'mock'
      });
    });
  });

  describe('exportWorkingCapitalData', () => {
    const mockData = {
      cashPosition: 1500000,
      cashTrend: 5.2,
      dso: 35,
      dpo: 45,
      cashConversionCycle: 18,
      cccTrend: -2.1,
      arAging: {
        current: 450000,
        '1-30': 125000,
        '31-60': 65000,
        '61-90': 25000,
        '90+': 15000
      }
    };

    beforeEach(() => {
      // Mock fetchWorkingCapitalMetrics for export tests
      mockFetch.mockResolvedValue({
        ok: false  // Force fallback to mock data
      });
    });

    it('exports CSV format correctly', async () => {
      await exportWorkingCapitalData('csv', 'month');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('exports JSON format correctly', async () => {
      await exportWorkingCapitalData('json', 'quarter');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('generates CSV with correct structure', async () => {
      global.Blob = vi.fn().mockImplementation((content, options) => ({
        content: content[0],
        type: options.type
      }));

      await exportWorkingCapitalData('csv', 'month');

      expect(global.Blob).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('Metric,Value,Trend')
        ]),
        { type: 'text/csv' }
      );
    });

    it('uses correct filename format', async () => {
      const mockElement = {
        href: '',
        download: '',
        click: mockClick,
        style: {}
      };

      document.createElement = vi.fn(() => mockElement);

      await exportWorkingCapitalData('csv', 'month');

      expect(mockElement.download).toMatch(/working-capital-month-\d{4}-\d{2}-\d{2}\.csv/);
    });
  });

  describe('convertToCSV', () => {
    // This function is not exported, so we can't test it directly
    // But its functionality is tested through the export tests above
  });

  describe('downloadFile', () => {
    // This function is not exported, so we can't test it directly
    // But its functionality is tested through the export tests above
  });
});