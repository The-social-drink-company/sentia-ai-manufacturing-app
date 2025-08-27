// Advanced UI Features
class AdvancedFeatures {
    constructor() {
        this.tooltips = new Map();
        this.contextMenus = new Map();
        this.notifications = [];
        this.searchIndex = new Map();
        this.helpSystem = null;
        
        this.init();
    }

    init() {
        this.initTooltips();
        this.initContextMenus();
        this.initSearch();
        this.initHelp();
        this.initNotifications();
        this.initOfflineSupport();
        this.initPerformanceOptimization();
        this.buildSearchIndex();
    }

    // Tooltip System
    initTooltips() {
        // Create tooltip element
        const tooltipElement = document.createElement('div');
        tooltipElement.id = 'global-tooltip';
        tooltipElement.className = 'tooltip';
        document.body.appendChild(tooltipElement);

        // Add tooltip event listeners
        document.addEventListener('mouseenter', (e) => {
            if (e.target.hasAttribute('data-tooltip')) {
                this.showTooltip(e.target, e.target.getAttribute('data-tooltip'));
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target.hasAttribute('data-tooltip')) {
                this.hideTooltip();
            }
        }, true);

        document.addEventListener('mousemove', (e) => {
            if (document.getElementById('global-tooltip').classList.contains('show')) {
                this.positionTooltip(e.clientX, e.clientY);
            }
        });
    }

    showTooltip(element, text) {
        const tooltip = document.getElementById('global-tooltip');
        tooltip.textContent = text;
        tooltip.classList.add('show');
        
        // Position tooltip
        this.positionTooltip(event.clientX, event.clientY);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (tooltip.classList.contains('show')) {
                this.hideTooltip();
            }
        }, 5000);
    }

    hideTooltip() {
        const tooltip = document.getElementById('global-tooltip');
        tooltip.classList.remove('show');
    }

    positionTooltip(x, y) {
        const tooltip = document.getElementById('global-tooltip');
        const rect = tooltip.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let left = x + 10;
        let top = y - 10;
        
        // Adjust for screen edges
        if (left + rect.width > windowWidth) {
            left = x - rect.width - 10;
        }
        
        if (top < 0) {
            top = y + 20;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    // Context Menu System
    initContextMenus() {
        document.addEventListener('contextmenu', (e) => {
            const contextElement = e.target.closest('[data-context-menu]');
            if (contextElement) {
                e.preventDefault();
                this.showContextMenu(e, contextElement.getAttribute('data-context-menu'));
            }
        });

        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    }

    showContextMenu(event, menuType) {
        this.hideContextMenu();
        
        const menuItems = this.getContextMenuItems(menuType, event.target);
        if (!menuItems.length) return;

        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.className = 'context-menu';
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = `context-menu-item ${item.disabled ? 'disabled' : ''}`;
            menuItem.innerHTML = `
                <span class="menu-icon">${item.icon || ''}</span>
                <span class="menu-text">${item.text}</span>
                ${item.shortcut ? `<span class="menu-shortcut">${item.shortcut}</span>` : ''}
            `;
            
            if (!item.disabled) {
                menuItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.action();
                    this.hideContextMenu();
                });
            }
            
            menu.appendChild(menuItem);
        });

        document.body.appendChild(menu);
        this.positionContextMenu(menu, event.clientX, event.clientY);
    }

    hideContextMenu() {
        const existingMenu = document.getElementById('context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    positionContextMenu(menu, x, y) {
        const rect = menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let left = x;
        let top = y;
        
        if (left + rect.width > windowWidth) {
            left = windowWidth - rect.width - 10;
        }
        
        if (top + rect.height > windowHeight) {
            top = windowHeight - rect.height - 10;
        }
        
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        menu.style.display = 'block';
    }

    getContextMenuItems(menuType, target) {
        const menus = {
            widget: [
                {
                    icon: '🔄',
                    text: 'Refresh Widget',
                    action: () => this.refreshWidget(target.closest('.widget-card'))
                },
                {
                    icon: '📊',
                    text: 'Export Data',
                    action: () => this.exportWidgetData(target.closest('.widget-card'))
                },
                {
                    icon: '⚙️',
                    text: 'Configure',
                    action: () => this.configureWidget(target.closest('.widget-card'))
                },
                {
                    icon: '👁️',
                    text: 'Hide Widget',
                    action: () => this.hideWidget(target.closest('.widget-card'))
                }
            ],
            chart: [
                {
                    icon: '🔍',
                    text: 'View Fullscreen',
                    shortcut: 'F11',
                    action: () => this.toggleFullscreen(target.closest('.widget-card'))
                },
                {
                    icon: '📷',
                    text: 'Save as Image',
                    shortcut: 'Ctrl+S',
                    action: () => this.saveChartAsImage(target)
                },
                {
                    icon: '📋',
                    text: 'Copy Chart Data',
                    action: () => this.copyChartData(target)
                }
            ]
        };

        return menus[menuType] || [];
    }

    // Search System
    initSearch() {
        this.createSearchInterface();
        this.bindSearchEvents();
    }

    createSearchInterface() {
        const searchHTML = `
            <div id="search-overlay" class="search-overlay" style="display: none;">
                <div class="search-container">
                    <div class="search-input-container">
                        <input type="text" id="global-search" placeholder="Search dashboard, widgets, or data..." autocomplete="off">
                        <span class="search-shortcut">Ctrl+K</span>
                    </div>
                    <div class="search-results" id="search-results"></div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', searchHTML);
    }

    bindSearchEvents() {
        const searchInput = document.getElementById('global-search');
        const searchOverlay = document.getElementById('search-overlay');
        
        // Keyboard shortcut to open search
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.showSearch();
            } else if (e.key === 'Escape') {
                this.hideSearch();
            }
        });

        // Search input events
        searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            this.handleSearchNavigation(e);
        });

        // Click outside to close
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                this.hideSearch();
            }
        });
    }

    showSearch() {
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('global-search');
        
        searchOverlay.style.display = 'flex';
        searchInput.focus();
        document.body.style.overflow = 'hidden';
    }

    hideSearch() {
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('global-search');
        
        searchOverlay.style.display = 'none';
        searchInput.value = '';
        document.getElementById('search-results').innerHTML = '';
        document.body.style.overflow = 'auto';
    }

    performSearch(query) {
        if (!query || query.length < 2) {
            document.getElementById('search-results').innerHTML = '';
            return;
        }

        const results = this.searchContent(query);
        this.displaySearchResults(results);
    }

    searchContent(query) {
        const results = [];
        const queryLower = query.toLowerCase();

        // Search widgets
        document.querySelectorAll('.widget-card').forEach(widget => {
            const title = widget.querySelector('.widget-title')?.textContent || '';
            const content = widget.textContent.toLowerCase();
            
            if (title.toLowerCase().includes(queryLower) || content.includes(queryLower)) {
                results.push({
                    type: 'widget',
                    title: title,
                    description: 'Dashboard Widget',
                    element: widget,
                    score: title.toLowerCase().includes(queryLower) ? 100 : 50
                });
            }
        });

        // Search navigation items
        document.querySelectorAll('nav a').forEach(link => {
            const text = link.textContent.toLowerCase();
            if (text.includes(queryLower)) {
                results.push({
                    type: 'navigation',
                    title: link.textContent,
                    description: 'Navigation',
                    element: link,
                    score: 75
                });
            }
        });

        // Sort by score
        return results.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    displaySearchResults(results) {
        const container = document.getElementById('search-results');
        
        if (!results.length) {
            container.innerHTML = '<div class="search-no-results">No results found</div>';
            return;
        }

        container.innerHTML = results.map((result, index) => `
            <div class="search-result ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="result-icon">${this.getSearchResultIcon(result.type)}</div>
                <div class="result-content">
                    <div class="result-title">${result.title}</div>
                    <div class="result-description">${result.description}</div>
                </div>
                <div class="result-type">${result.type}</div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.search-result').forEach((result, index) => {
            result.addEventListener('click', () => {
                this.selectSearchResult(results[index]);
            });
        });
    }

    getSearchResultIcon(type) {
        const icons = {
            widget: '📊',
            navigation: '🧭',
            data: '📄',
            action: '⚡'
        };
        return icons[type] || '🔍';
    }

    selectSearchResult(result) {
        this.hideSearch();
        
        if (result.element) {
            result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            result.element.classList.add('highlight');
            
            setTimeout(() => {
                result.element.classList.remove('highlight');
            }, 2000);
        }
    }

    handleSearchNavigation(e) {
        const results = document.querySelectorAll('.search-result');
        const active = document.querySelector('.search-result.active');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = active?.nextElementSibling || results[0];
            if (next) {
                active?.classList.remove('active');
                next.classList.add('active');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = active?.previousElementSibling || results[results.length - 1];
            if (prev) {
                active?.classList.remove('active');
                prev.classList.add('active');
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const activeIndex = parseInt(active?.getAttribute('data-index') || '0');
            const searchResults = this.currentSearchResults;
            if (searchResults && searchResults[activeIndex]) {
                this.selectSearchResult(searchResults[activeIndex]);
            }
        }
    }

    buildSearchIndex() {
        // Build a searchable index of all content
        this.searchIndex.clear();
        
        document.querySelectorAll('.widget-card').forEach(widget => {
            const id = widget.id;
            const title = widget.querySelector('.widget-title')?.textContent || '';
            const content = Array.from(widget.querySelectorAll('*'))
                .map(el => el.textContent)
                .join(' ')
                .toLowerCase();
            
            this.searchIndex.set(id, {
                title,
                content,
                element: widget,
                type: 'widget'
            });
        });
    }

    // Help System
    initHelp() {
        this.createHelpInterface();
        this.loadHelpContent();
    }

    createHelpInterface() {
        const helpHTML = `
            <div id="help-overlay" class="help-overlay" style="display: none;">
                <div class="help-panel">
                    <div class="help-header">
                        <h3>Dashboard Help</h3>
                        <button class="help-close" onclick="advancedFeatures.hideHelp()">&times;</button>
                    </div>
                    <div class="help-content">
                        <div class="help-tabs">
                            <button class="help-tab active" data-tab="shortcuts">Shortcuts</button>
                            <button class="help-tab" data-tab="features">Features</button>
                            <button class="help-tab" data-tab="troubleshooting">Help</button>
                        </div>
                        <div class="help-tab-content" id="help-tab-content"></div>
                    </div>
                </div>
            </div>
            
            <button id="help-button" class="help-button" onclick="advancedFeatures.showHelp()" title="Help & Shortcuts" data-tooltip="Help & Keyboard Shortcuts (F1)">
                ?
            </button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', helpHTML);
        
        // Help keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelp();
            }
        });

        // Tab switching
        document.querySelectorAll('.help-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchHelpTab(e.target.getAttribute('data-tab'));
            });
        });
    }

    showHelp() {
        document.getElementById('help-overlay').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.switchHelpTab('shortcuts');
    }

    hideHelp() {
        document.getElementById('help-overlay').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    switchHelpTab(tabName) {
        // Update active tab
        document.querySelectorAll('.help-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Load content
        const content = this.getHelpContent(tabName);
        document.getElementById('help-tab-content').innerHTML = content;
    }

    loadHelpContent() {
        // Pre-load help content
        this.helpContent = {
            shortcuts: `
                <div class="shortcuts-list">
                    <h4>Keyboard Shortcuts</h4>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>K</kbd>
                        <span>Open search</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>R</kbd>
                        <span>Refresh dashboard</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>F1</kbd>
                        <span>Show help</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>F11</kbd>
                        <span>Toggle widget fullscreen</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>1-4</kbd>
                        <span>Jump to widget</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Esc</kbd>
                        <span>Close modals/panels</span>
                    </div>
                </div>
            `,
            features: `
                <div class="features-list">
                    <h4>Dashboard Features</h4>
                    <div class="feature-item">
                        <h5>Interactive Widgets</h5>
                        <p>Click and drag to rearrange widgets. Right-click for options.</p>
                    </div>
                    <div class="feature-item">
                        <h5>Data Export</h5>
                        <p>Export widget data as CSV, PNG, or PDF using widget actions.</p>
                    </div>
                    <div class="feature-item">
                        <h5>Customization</h5>
                        <p>Click the settings gear to customize themes, colors, and layout.</p>
                    </div>
                    <div class="feature-item">
                        <h5>Import Wizard</h5>
                        <p>Use the Import Data button to add your own data files.</p>
                    </div>
                    <div class="feature-item">
                        <h5>Real-time Updates</h5>
                        <p>Dashboard automatically refreshes data every 30 seconds.</p>
                    </div>
                </div>
            `,
            troubleshooting: `
                <div class="troubleshooting-list">
                    <h4>Troubleshooting</h4>
                    <div class="faq-item">
                        <h5>Charts not loading?</h5>
                        <p>Try refreshing the individual widget or the entire dashboard.</p>
                    </div>
                    <div class="faq-item">
                        <h5>Import failed?</h5>
                        <p>Check your file format and ensure all required fields are mapped.</p>
                    </div>
                    <div class="faq-item">
                        <h5>Slow performance?</h5>
                        <p>Disable animations in customization settings or try compact mode.</p>
                    </div>
                    <div class="faq-item">
                        <h5>Lost customization?</h5>
                        <p>Settings are saved locally. Clear browser data may reset them.</p>
                    </div>
                </div>
            `
        };
    }

    getHelpContent(tabName) {
        return this.helpContent[tabName] || '<p>Content not available</p>';
    }

    // Notification System
    initNotifications() {
        this.createNotificationCenter();
        this.scheduleNotificationCleanup();
    }

    createNotificationCenter() {
        const notificationHTML = `
            <div id="notification-center" class="notification-center">
                <div class="notification-header">
                    <h4>Notifications</h4>
                    <button class="clear-all-btn" onclick="advancedFeatures.clearAllNotifications()">Clear All</button>
                </div>
                <div class="notification-list" id="notification-list">
                    <div class="no-notifications">No notifications</div>
                </div>
            </div>
            
            <button id="notification-toggle" class="notification-toggle" onclick="advancedFeatures.toggleNotifications()">
                🔔
                <span class="notification-badge" id="notification-badge" style="display: none;">0</span>
            </button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', notificationHTML);
    }

    addNotification(notification) {
        const id = Date.now().toString();
        const notificationData = {
            id,
            ...notification,
            timestamp: new Date(),
            read: false
        };
        
        this.notifications.unshift(notificationData);
        this.updateNotificationDisplay();
        this.updateNotificationBadge();
        
        // Auto-remove after timeout
        if (notification.timeout) {
            setTimeout(() => {
                this.removeNotification(id);
            }, notification.timeout);
        }
        
        return id;
    }

    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.updateNotificationDisplay();
        this.updateNotificationBadge();
    }

    updateNotificationDisplay() {
        const container = document.getElementById('notification-list');
        
        if (!this.notifications.length) {
            container.innerHTML = '<div class="no-notifications">No notifications</div>';
            return;
        }
        
        container.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon">${this.getNotificationIcon(notification.type)}</div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title || notification.message}</div>
                    ${notification.description ? `<div class="notification-description">${notification.description}</div>` : ''}
                    <div class="notification-time">${this.formatNotificationTime(notification.timestamp)}</div>
                </div>
                <button class="notification-remove" onclick="advancedFeatures.removeNotification('${notification.id}')">&times;</button>
            </div>
        `).join('');
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    toggleNotifications() {
        const center = document.getElementById('notification-center');
        const isVisible = center.style.display === 'block';
        
        center.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // Mark all as read when opened
            this.notifications.forEach(n => n.read = true);
            this.updateNotificationDisplay();
            this.updateNotificationBadge();
        }
    }

    clearAllNotifications() {
        this.notifications = [];
        this.updateNotificationDisplay();
        this.updateNotificationBadge();
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            alert: '🚨'
        };
        return icons[type] || 'ℹ️';
    }

    formatNotificationTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    scheduleNotificationCleanup() {
        // Clean up old notifications every hour
        setInterval(() => {
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            this.notifications = this.notifications.filter(n => n.timestamp > oneWeekAgo);
            this.updateNotificationDisplay();
            this.updateNotificationBadge();
        }, 3600000);
    }

    // Offline Support
    initOfflineSupport() {
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }
        
        this.monitorConnectionStatus();
        this.setupOfflineStorage();
    }

    async registerServiceWorker() {
        try {
            await navigator.serviceWorker.register('/static/js/sw.js');
            console.log('Service worker registered successfully');
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    }

    monitorConnectionStatus() {
        const updateOnlineStatus = () => {
            const isOnline = navigator.onLine;
            document.body.classList.toggle('offline', !isOnline);
            
            if (!isOnline) {
                this.addNotification({
                    type: 'warning',
                    message: 'You are offline',
                    description: 'Some features may be limited',
                    timeout: 5000
                });
            } else if (document.body.classList.contains('was-offline')) {
                this.addNotification({
                    type: 'success',
                    message: 'Back online',
                    description: 'All features restored',
                    timeout: 3000
                });
            }
            
            document.body.classList.toggle('was-offline', !isOnline);
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    }

    setupOfflineStorage() {
        // Cache essential data for offline access
        this.offlineCache = {
            dashboardState: null,
            lastSync: null
        };
        
        // Save state periodically
        setInterval(() => {
            this.saveOfflineState();
        }, 30000);
    }

    saveOfflineState() {
        if (!navigator.onLine) return;
        
        const state = {
            timestamp: Date.now(),
            widgets: Array.from(document.querySelectorAll('.widget-card')).map(widget => ({
                id: widget.id,
                visible: widget.style.display !== 'none'
            })),
            filters: window.sentiaDashboard?.filters || {}
        };
        
        localStorage.setItem('offline-dashboard-state', JSON.stringify(state));
        this.offlineCache.lastSync = Date.now();
    }

    loadOfflineState() {
        const saved = localStorage.getItem('offline-dashboard-state');
        if (!saved) return;
        
        try {
            const state = JSON.parse(saved);
            this.offlineCache.dashboardState = state;
            
            // Restore widget visibility
            state.widgets?.forEach(widget => {
                const element = document.getElementById(widget.id);
                if (element) {
                    element.style.display = widget.visible ? 'block' : 'none';
                }
            });
        } catch (error) {
            console.error('Error loading offline state:', error);
        }
    }

    // Performance Optimization
    initPerformanceOptimization() {
        this.setupIntersectionObserver();
        this.enableVirtualScrolling();
        this.optimizeAnimations();
        this.setupPerformanceMonitoring();
    }

    setupIntersectionObserver() {
        // Lazy load widgets that are not visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-viewport');
                    this.loadWidgetData(entry.target);
                } else {
                    entry.target.classList.remove('in-viewport');
                }
            });
        });

        document.querySelectorAll('.widget-card').forEach(widget => {
            observer.observe(widget);
        });
    }

    loadWidgetData(widget) {
        // Only load data for visible widgets
        if (!widget.classList.contains('data-loaded')) {
            widget.classList.add('data-loaded');
            // Trigger widget refresh
            const refreshBtn = widget.querySelector('.widget-refresh');
            if (refreshBtn) {
                refreshBtn.click();
            }
        }
    }

    enableVirtualScrolling() {
        // Implement virtual scrolling for large data tables
        const dataTables = document.querySelectorAll('.data-table');
        dataTables.forEach(table => {
            if (table.rows.length > 100) {
                this.virtualizeTable(table);
            }
        });
    }

    virtualizeTable(table) {
        // Simple virtualization implementation
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        const rows = Array.from(tbody.rows);
        const visibleRows = 50;
        let startIndex = 0;
        
        const renderRows = () => {
            tbody.innerHTML = '';
            const endIndex = Math.min(startIndex + visibleRows, rows.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                tbody.appendChild(rows[i].cloneNode(true));
            }
        };
        
        // Add scroll listener for pagination
        const container = table.closest('.table-container');
        if (container) {
            container.addEventListener('scroll', () => {
                const scrollPercentage = container.scrollTop / (container.scrollHeight - container.clientHeight);
                const newStartIndex = Math.floor(scrollPercentage * (rows.length - visibleRows));
                
                if (newStartIndex !== startIndex) {
                    startIndex = Math.max(0, newStartIndex);
                    renderRows();
                }
            });
        }
        
        renderRows();
    }

    optimizeAnimations() {
        // Reduce animations on low-end devices
        if (navigator.hardwareConcurrency <= 2) {
            document.body.classList.add('reduced-animations');
        }
        
        // Pause animations when not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.body.classList.add('animations-paused');
            } else {
                document.body.classList.remove('animations-paused');
            }
        });
    }

    setupPerformanceMonitoring() {
        // Monitor performance and adjust accordingly
        setInterval(() => {
            const memoryInfo = performance.memory;
            if (memoryInfo && memoryInfo.usedJSHeapSize > 50000000) { // 50MB
                this.enablePerformanceMode();
            }
        }, 60000);
    }

    enablePerformanceMode() {
        document.body.classList.add('performance-mode');
        this.addNotification({
            type: 'info',
            message: 'Performance mode enabled',
            description: 'Some visual effects disabled to improve performance',
            timeout: 5000
        });
    }

    // Utility Methods
    refreshWidget(widget) {
        if (window.sentiaDashboard) {
            window.sentiaDashboard.refreshWidget(widget);
        }
    }

    exportWidgetData(widget) {
        if (window.sentiaDashboard) {
            window.sentiaDashboard.exportWidget(widget);
        }
    }

    configureWidget(widget) {
        this.addNotification({
            type: 'info',
            message: 'Widget configuration coming soon',
            timeout: 3000
        });
    }

    hideWidget(widget) {
        widget.style.display = 'none';
        if (window.dashboardCustomization) {
            window.dashboardCustomization.widgetSettings[widget.id] = { visible: false };
            window.dashboardCustomization.saveSettings();
        }
    }

    toggleFullscreen(widget) {
        if (window.sentiaDashboard) {
            window.sentiaDashboard.toggleFullscreen(widget);
        }
    }

    saveChartAsImage(chartElement) {
        const canvas = chartElement.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `chart-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    }

    copyChartData(chartElement) {
        // Mock implementation - would extract actual chart data
        navigator.clipboard.writeText('Chart data copied to clipboard');
        this.addNotification({
            type: 'success',
            message: 'Chart data copied to clipboard',
            timeout: 3000
        });
    }
}

// Initialize advanced features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.advancedFeatures = new AdvancedFeatures();
});