import { logDebug, logInfo, logWarn, logError } from '../utils/logger';

/**
 * API Service
 * Central API client for all backend interactions
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  setAuthToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logError(`API Request Failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health & Status
  async getHealth() {
    return this.request('/health');
  }

  // Personnel
  async getPersonnel() {
    return this.request('/personnel');
  }

  async getPersonnelById(id) {
    return this.request(`/personnel/${id}`);
  }

  // Production
  async getProductionLines() {
    return this.request('/production/lines');
  }

  async getProductionMetrics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/production/metrics${queryString ? `?${queryString}` : ''}`);
  }

  async getProductionSchedule() {
    return this.request('/production/schedule');
  }

  async getBatchProduction(batchId) {
    return this.request(`/production/batch/${batchId}`);
  }

  // Inventory
  async getInventoryLevels() {
    return this.request('/inventory/levels');
  }

  async getInventoryMovements() {
    return this.request('/inventory/movements');
  }

  async getStockTakes() {
    return this.request('/inventory/stock-takes');
  }

  async createInventoryMovement(data) {
    return this.request('/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Quality
  async getQualityInspections() {
    return this.request('/quality/inspections');
  }

  async getQualityDefects() {
    return this.request('/quality/defects');
  }

  async getQualityMetrics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/quality/metrics${queryString ? `?${queryString}` : ''}`);
  }

  async createQualityInspection(data) {
    return this.request('/quality/inspections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Financial
  async getWorkingCapital() {
    return this.request('/financial/working-capital');
  }

  async getCashFlow(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/financial/cash-flow${queryString ? `?${queryString}` : ''}`);
  }

  async getFinancialMetrics() {
    return this.request('/financial/metrics');
  }

  async getAccounts() {
    return this.request('/financial/accounts');
  }

  // Maintenance
  async getMaintenanceSchedule() {
    return this.request('/maintenance/schedule');
  }

  async createMaintenanceTask(data) {
    return this.request('/maintenance/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Supply Chain
  async getPurchaseOrders() {
    return this.request('/supply-chain/purchase-orders');
  }

  async createPurchaseOrder(data) {
    return this.request('/supply-chain/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // AI/Analytics
  async getAIPredictions(type) {
    return this.request(`/ai/predictions/${type}`);
  }

  async getDemandForecast(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/ai/demand-forecast${queryString ? `?${queryString}` : ''}`);
  }

  // Dashboard
  async getDashboardData() {
    return this.request('/dashboard/data');
  }

  async saveDashboardLayout(layout) {
    return this.request('/dashboard/layout', {
      method: 'POST',
      body: JSON.stringify({ layout }),
    });
  }

  async getDashboardLayout() {
    return this.request('/dashboard/layout');
  }

  // Import/Export
  async importData(type, data) {
    return this.request(`/import/${type}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exportData(type, format = 'json') {
    return this.request(`/export/${type}?format=${format}`);
  }

  // Admin
  async getUsers() {
    return this.request('/admin/users');
  }

  async updateUserRole(userId, role) {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getSystemConfig() {
    return this.request('/admin/system/config');
  }

  async updateSystemConfig(config) {
    return this.request('/admin/system/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Named exports for common operations
export const {
  getHealth,
  getPersonnel,
  getProductionLines,
  getProductionMetrics,
  getInventoryLevels,
  getQualityInspections,
  getWorkingCapital,
  getCashFlow,
  getDashboardData,
} = apiService;