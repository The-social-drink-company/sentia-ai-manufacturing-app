// Dashboard JavaScript functionality
class SentiaDashboard {
    constructor() {
        this.charts = {};
        this.refreshInterval = 30000; // 30 seconds
        this.autoRefreshTimer = null;
        this.websocket = null;
        this.filters = {
            timeRange: '7d',
            region: 'all',
            product: 'all'
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initCharts();
        this.loadDashboardData();
        this.setupAutoRefresh();
        this.initWebSocket();
        this.initCustomization();
        this.initKeyboardShortcuts();
    }

    bindEvents() {
        // Filter changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('dashboard-filter')) {
                this.handleFilterChange(e.target);
            }
        });

        // Widget actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('widget-refresh')) {
                this.refreshWidget(e.target.closest('.widget-card'));
            } else if (e.target.classList.contains('widget-export')) {
                this.exportWidget(e.target.closest('.widget-card'));
            } else if (e.target.classList.contains('widget-fullscreen')) {
                this.toggleFullscreen(e.target.closest('.widget-card'));
            }
        });

        // Auto-refresh toggle
        const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.setupAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            });
        }

        // Time range selector
        const timeRangeSelect = document.getElementById('time-range-select');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                this.filters.timeRange = e.target.value;
                this.refreshAllWidgets();
            });
        }
    }

    initCharts() {
        // Initialize Chart.js defaults
        if (typeof Chart !== 'undefined') {
            Chart.defaults.font.family = "'Inter', sans-serif";
            Chart.defaults.color = '#64748b';
            Chart.defaults.plugins.legend.position = 'bottom';
            Chart.defaults.responsive = true;
            Chart.defaults.maintainAspectRatio = false;
        }

        // Initialize individual charts
        this.initDemandForecastChart();
        this.initStockLevelsChart();
        this.initWorkingCapitalChart();
        this.initCapacityUtilizationChart();
        this.initPerformanceMetrics();
    }

    initDemandForecastChart() {
        const ctx = document.getElementById('demand-forecast-chart');
        if (!ctx) return;

        this.charts.demandForecast = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Actual Demand',
                    data: [],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Forecast',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Demand Forecast vs Actual'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#6366f1',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Units'
                        }
                    }
                }
            }
        });
    }

    initStockLevelsChart() {
        const ctx = document.getElementById('stock-levels-chart');
        if (!ctx) return;

        this.charts.stockLevels = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Current Stock',
                    data: [],
                    backgroundColor: '#6366f1',
                    borderRadius: 4
                }, {
                    label: 'Reorder Point',
                    data: [],
                    backgroundColor: '#f59e0b',
                    borderRadius: 4
                }, {
                    label: 'Safety Stock',
                    data: [],
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Stock Levels by Product'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Units'
                        }
                    }
                }
            }
        });
    }

    initWorkingCapitalChart() {
        const ctx = document.getElementById('working-capital-chart');
        if (!ctx) return;

        this.charts.workingCapital = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Inventory', 'Accounts Receivable', 'Cash', 'Accounts Payable'],
                datasets: [{
                    data: [],
                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Working Capital Breakdown'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initCapacityUtilizationChart() {
        const ctx = document.getElementById('capacity-utilization-chart');
        if (!ctx) return;

        this.charts.capacityUtilization = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Utilization %',
                    data: [],
                    backgroundColor: (ctx) => {
                        const value = ctx.parsed.y;
                        if (value >= 90) return '#ef4444';
                        if (value >= 75) return '#f59e0b';
                        return '#10b981';
                    },
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Production Capacity Utilization'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Utilization %'
                        }
                    }
                }
            }
        });
    }

    initPerformanceMetrics() {
        // Initialize performance gauge charts
        const gauges = document.querySelectorAll('.performance-gauge');
        gauges.forEach(gauge => {
            const ctx = gauge.getContext('2d');
            const value = parseFloat(gauge.dataset.value) || 0;
            const max = parseFloat(gauge.dataset.max) || 100;
            
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [value, max - value],
                        backgroundColor: ['#6366f1', '#e5e7eb'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    }
                }
            });
        });
    }

    loadDashboardData() {
        this.showLoadingState();
        
        Promise.all([
            this.fetchKPIData(),
            this.fetchForecastData(),
            this.fetchStockData(),
            this.fetchWorkingCapitalData(),
            this.fetchCapacityData()
        ])
        .then(([kpiData, forecastData, stockData, capitalData, capacityData]) => {
            this.updateKPIs(kpiData);
            this.updateForecastChart(forecastData);
            this.updateStockChart(stockData);
            this.updateWorkingCapitalChart(capitalData);
            this.updateCapacityChart(capacityData);
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
            this.showErrorState(error.message);
        })
        .finally(() => {
            this.hideLoadingState();
        });
    }

    async fetchKPIData() {
        const response = await fetch('/api/dashboard/kpis?' + new URLSearchParams(this.filters));
        if (!response.ok) throw new Error('Failed to fetch KPI data');
        return response.json();
    }

    async fetchForecastData() {
        const response = await fetch('/api/dashboard/forecast?' + new URLSearchParams(this.filters));
        if (!response.ok) throw new Error('Failed to fetch forecast data');
        return response.json();
    }

    async fetchStockData() {
        const response = await fetch('/api/dashboard/stock-levels?' + new URLSearchParams(this.filters));
        if (!response.ok) throw new Error('Failed to fetch stock data');
        return response.json();
    }

    async fetchWorkingCapitalData() {
        const response = await fetch('/api/dashboard/working-capital?' + new URLSearchParams(this.filters));
        if (!response.ok) throw new Error('Failed to fetch working capital data');
        return response.json();
    }

    async fetchCapacityData() {
        const response = await fetch('/api/dashboard/capacity?' + new URLSearchParams(this.filters));
        if (!response.ok) throw new Error('Failed to fetch capacity data');
        return response.json();
    }

    updateKPIs(data) {
        Object.entries(data).forEach(([key, value]) => {
            const element = document.getElementById(`kpi-${key}`);
            if (element) {
                this.animateNumber(element, value.current);
                
                const changeElement = element.parentNode.querySelector('.kpi-change');
                if (changeElement && value.change !== undefined) {
                    changeElement.textContent = `${value.change > 0 ? '+' : ''}${value.change.toFixed(1)}%`;
                    changeElement.className = `kpi-change ${value.change > 0 ? 'positive' : value.change < 0 ? 'negative' : 'neutral'}`;
                }
            }
        });
    }

    animateNumber(element, target) {
        const start = parseFloat(element.textContent) || 0;
        const increment = (target - start) / 30;
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
                current = target;
                clearInterval(timer);
            }
            
            if (Number.isInteger(target)) {
                element.textContent = Math.round(current);
            } else {
                element.textContent = current.toFixed(1);
            }
        }, 16);
    }

    updateForecastChart(data) {
        if (this.charts.demandForecast && data) {
            this.charts.demandForecast.data.labels = data.labels;
            this.charts.demandForecast.data.datasets[0].data = data.actual;
            this.charts.demandForecast.data.datasets[1].data = data.forecast;
            this.charts.demandForecast.update('none');
        }
    }

    updateStockChart(data) {
        if (this.charts.stockLevels && data) {
            this.charts.stockLevels.data.labels = data.products;
            this.charts.stockLevels.data.datasets[0].data = data.current;
            this.charts.stockLevels.data.datasets[1].data = data.reorderPoint;
            this.charts.stockLevels.data.datasets[2].data = data.safetyStock;
            this.charts.stockLevels.update('none');
        }
    }

    updateWorkingCapitalChart(data) {
        if (this.charts.workingCapital && data) {
            this.charts.workingCapital.data.datasets[0].data = [
                data.inventory,
                data.receivables,
                data.cash,
                data.payables
            ];
            this.charts.workingCapital.update('none');
        }
    }

    updateCapacityChart(data) {
        if (this.charts.capacityUtilization && data) {
            this.charts.capacityUtilization.data.labels = data.resources;
            this.charts.capacityUtilization.data.datasets[0].data = data.utilization;
            this.charts.capacityUtilization.update('none');
        }
    }

    refreshWidget(widget) {
        const widgetId = widget.id;
        widget.classList.add('loading');
        
        // Simulate API call based on widget type
        setTimeout(() => {
            widget.classList.remove('loading');
            this.showToast('Widget refreshed successfully', 'success');
        }, 1000);
    }

    exportWidget(widget) {
        const widgetTitle = widget.querySelector('.widget-title').textContent;
        const chartCanvas = widget.querySelector('canvas');
        
        if (chartCanvas) {
            // Export chart as image
            const link = document.createElement('a');
            link.download = `${widgetTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
            link.href = chartCanvas.toDataURL();
            link.click();
        } else {
            // Export data as CSV
            this.exportWidgetDataAsCSV(widget, widgetTitle);
        }
        
        this.showToast('Widget exported successfully', 'success');
    }

    exportWidgetDataAsCSV(widget, title) {
        // Mock CSV export - in real implementation, fetch actual data
        const csvContent = "data:text/csv;charset=utf-8,Date,Value\n2024-01-01,100\n2024-01-02,120";
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}.csv`);
        link.click();
    }

    toggleFullscreen(widget) {
        if (widget.classList.contains('fullscreen')) {
            widget.classList.remove('fullscreen');
            document.body.classList.remove('widget-fullscreen');
        } else {
            widget.classList.add('fullscreen');
            document.body.classList.add('widget-fullscreen');
        }
    }

    handleFilterChange(filterElement) {
        const filterName = filterElement.name;
        const filterValue = filterElement.value;
        
        this.filters[filterName] = filterValue;
        this.refreshAllWidgets();
    }

    refreshAllWidgets() {
        this.loadDashboardData();
    }

    setupAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
        }
        
        this.autoRefreshTimer = setInterval(() => {
            this.loadDashboardData();
        }, this.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
            this.autoRefreshTimer = null;
        }
    }

    initWebSocket() {
        // WebSocket for real-time updates
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/dashboard`;
        
        try {
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealtimeUpdate(data);
            };
            
            this.websocket.onclose = () => {
                // Reconnect after 5 seconds
                setTimeout(() => this.initWebSocket(), 5000);
            };
        } catch (error) {
            console.log('WebSocket not available, using polling instead');
        }
    }

    handleRealtimeUpdate(data) {
        switch (data.type) {
            case 'kpi_update':
                this.updateKPIs(data.data);
                break;
            case 'stock_alert':
                this.showAlert(data.message, 'warning');
                break;
            case 'forecast_update':
                this.updateForecastChart(data.data);
                break;
        }
    }

    initCustomization() {
        // Drag and drop for widget arrangement
        this.initDragAndDrop();
        
        // Widget visibility toggles
        this.initWidgetToggles();
        
        // Theme customization
        this.initThemeCustomization();
    }

    initDragAndDrop() {
        const widgets = document.querySelectorAll('.widget-card');
        widgets.forEach(widget => {
            widget.draggable = true;
            
            widget.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', widget.id);
                widget.classList.add('dragging');
            });
            
            widget.addEventListener('dragend', () => {
                widget.classList.remove('dragging');
            });
            
            widget.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            widget.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                const draggedElement = document.getElementById(draggedId);
                
                if (draggedElement !== widget) {
                    const container = widget.parentNode;
                    const afterElement = this.getDragAfterElement(container, e.clientY);
                    
                    if (afterElement == null) {
                        container.appendChild(draggedElement);
                    } else {
                        container.insertBefore(draggedElement, afterElement);
                    }
                    
                    this.saveLayoutPreferences();
                }
            });
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.widget-card:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    initWidgetToggles() {
        const toggles = document.querySelectorAll('.widget-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const widgetId = e.target.dataset.widgetId;
                const widget = document.getElementById(widgetId);
                
                if (widget) {
                    widget.style.display = e.target.checked ? 'block' : 'none';
                    this.saveLayoutPreferences();
                }
            });
        });
    }

    initThemeCustomization() {
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.addEventListener('change', (e) => {
                document.body.className = `theme-${e.target.value}`;
                localStorage.setItem('dashboard-theme', e.target.value);
            });
            
            // Load saved theme
            const savedTheme = localStorage.getItem('dashboard-theme');
            if (savedTheme) {
                themeSelector.value = savedTheme;
                document.body.className = `theme-${savedTheme}`;
            }
        }
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'r':
                        e.preventDefault();
                        this.refreshAllWidgets();
                        this.showToast('Dashboard refreshed', 'info');
                        break;
                    case 'f':
                        e.preventDefault();
                        document.getElementById('search-input')?.focus();
                        break;
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                        e.preventDefault();
                        const widgetIndex = parseInt(e.key) - 1;
                        const widgets = document.querySelectorAll('.widget-card');
                        if (widgets[widgetIndex]) {
                            widgets[widgetIndex].scrollIntoView({ behavior: 'smooth' });
                        }
                        break;
                }
            }
        });
    }

    saveLayoutPreferences() {
        const layout = {
            widgetOrder: Array.from(document.querySelectorAll('.widget-card')).map(w => w.id),
            hiddenWidgets: Array.from(document.querySelectorAll('.widget-card[style*="display: none"]')).map(w => w.id),
            filters: this.filters
        };
        
        localStorage.setItem('dashboard-layout', JSON.stringify(layout));
    }

    loadLayoutPreferences() {
        const saved = localStorage.getItem('dashboard-layout');
        if (saved) {
            const layout = JSON.parse(saved);
            
            // Restore widget order
            if (layout.widgetOrder) {
                const container = document.querySelector('.dashboard-grid');
                layout.widgetOrder.forEach(id => {
                    const widget = document.getElementById(id);
                    if (widget) {
                        container.appendChild(widget);
                    }
                });
            }
            
            // Restore hidden widgets
            if (layout.hiddenWidgets) {
                layout.hiddenWidgets.forEach(id => {
                    const widget = document.getElementById(id);
                    if (widget) {
                        widget.style.display = 'none';
                    }
                });
            }
            
            // Restore filters
            if (layout.filters) {
                this.filters = { ...this.filters, ...layout.filters };
            }
        }
    }

    showLoadingState() {
        const widgets = document.querySelectorAll('.widget-card');
        widgets.forEach(widget => {
            widget.classList.add('loading');
        });
    }

    hideLoadingState() {
        const widgets = document.querySelectorAll('.widget-card');
        widgets.forEach(widget => {
            widget.classList.remove('loading');
        });
    }

    showErrorState(message) {
        this.showToast(`Error: ${message}`, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    showAlert(message, type = 'info') {
        // Implementation for in-app alerts/notifications
        const alertContainer = document.getElementById('alert-container');
        if (alertContainer) {
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `
                <span>${message}</span>
                <button class="alert-close" onclick="this.parentElement.remove()">×</button>
            `;
            alertContainer.appendChild(alert);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.remove();
                }
            }, 10000);
        }
    }

    destroy() {
        this.stopAutoRefresh();
        if (this.websocket) {
            this.websocket.close();
        }
        
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sentiaDashboard = new SentiaDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.sentiaDashboard) {
        window.sentiaDashboard.destroy();
    }
});