// Dashboard Customization Features
class DashboardCustomization {
    constructor() {
        this.customizationMode = false;
        this.widgetSettings = {};
        this.layoutSettings = {
            theme: 'default',
            compactMode: false,
            showTitles: true,
            animationsEnabled: true
        };
        
        this.init();
    }

    init() {
        this.loadSavedSettings();
        this.createCustomizationPanel();
        this.bindEvents();
        this.applySettings();
    }

    loadSavedSettings() {
        const saved = localStorage.getItem('dashboard-customization');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.layoutSettings = { ...this.layoutSettings, ...settings.layout };
                this.widgetSettings = settings.widgets || {};
            } catch (e) {
                console.error('Error loading customization settings:', e);
            }
        }
    }

    saveSettings() {
        const settings = {
            layout: this.layoutSettings,
            widgets: this.widgetSettings,
            timestamp: Date.now()
        };
        
        localStorage.setItem('dashboard-customization', JSON.stringify(settings));
    }

    createCustomizationPanel() {
        const panelHTML = `
            <div id="customization-panel" class="customization-panel" style="display: none;">
                <div class="panel-header">
                    <h3>Customize Dashboard</h3>
                    <button class="panel-close" onclick="dashboardCustomization.closePanel()">&times;</button>
                </div>
                
                <div class="panel-content">
                    <div class="customization-section">
                        <h4>Theme</h4>
                        <div class="theme-options">
                            <label class="theme-option">
                                <input type="radio" name="theme" value="default" checked>
                                <div class="theme-preview default">
                                    <div class="theme-colors">
                                        <span class="color primary"></span>
                                        <span class="color secondary"></span>
                                        <span class="color accent"></span>
                                    </div>
                                    <span class="theme-name">Default</span>
                                </div>
                            </label>
                            
                            <label class="theme-option">
                                <input type="radio" name="theme" value="dark">
                                <div class="theme-preview dark">
                                    <div class="theme-colors">
                                        <span class="color primary"></span>
                                        <span class="color secondary"></span>
                                        <span class="color accent"></span>
                                    </div>
                                    <span class="theme-name">Dark</span>
                                </div>
                            </label>
                            
                            <label class="theme-option">
                                <input type="radio" name="theme" value="blue">
                                <div class="theme-preview blue">
                                    <div class="theme-colors">
                                        <span class="color primary"></span>
                                        <span class="color secondary"></span>
                                        <span class="color accent"></span>
                                    </div>
                                    <span class="theme-name">Blue</span>
                                </div>
                            </label>
                            
                            <label class="theme-option">
                                <input type="radio" name="theme" value="green">
                                <div class="theme-preview green">
                                    <div class="theme-colors">
                                        <span class="color primary"></span>
                                        <span class="color secondary"></span>
                                        <span class="color accent"></span>
                                    </div>
                                    <span class="theme-name">Green</span>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="customization-section">
                        <h4>Layout Options</h4>
                        <div class="layout-options">
                            <label class="checkbox-option">
                                <input type="checkbox" id="compact-mode">
                                <span class="checkmark"></span>
                                Compact Mode
                                <small>Reduce spacing between widgets</small>
                            </label>
                            
                            <label class="checkbox-option">
                                <input type="checkbox" id="show-titles" checked>
                                <span class="checkmark"></span>
                                Show Widget Titles
                                <small>Display titles on all widgets</small>
                            </label>
                            
                            <label class="checkbox-option">
                                <input type="checkbox" id="animations-enabled" checked>
                                <span class="checkmark"></span>
                                Enable Animations
                                <small>Smooth transitions and animations</small>
                            </label>
                        </div>
                    </div>
                    
                    <div class="customization-section">
                        <h4>Widget Visibility</h4>
                        <div class="widget-toggles">
                            <!-- Widget toggles will be populated dynamically -->
                        </div>
                    </div>
                    
                    <div class="customization-section">
                        <h4>Color Customization</h4>
                        <div class="color-customization">
                            <div class="color-input-group">
                                <label for="primary-color">Primary Color</label>
                                <input type="color" id="primary-color" value="#6366f1">
                            </div>
                            
                            <div class="color-input-group">
                                <label for="success-color">Success Color</label>
                                <input type="color" id="success-color" value="#10b981">
                            </div>
                            
                            <div class="color-input-group">
                                <label for="warning-color">Warning Color</label>
                                <input type="color" id="warning-color" value="#f59e0b">
                            </div>
                            
                            <div class="color-input-group">
                                <label for="error-color">Error Color</label>
                                <input type="color" id="error-color" value="#ef4444">
                            </div>
                        </div>
                    </div>
                    
                    <div class="customization-section">
                        <h4>Export/Import Settings</h4>
                        <div class="settings-io">
                            <button class="btn btn-secondary" onclick="dashboardCustomization.exportSettings()">
                                Export Settings
                            </button>
                            <button class="btn btn-secondary" onclick="dashboardCustomization.importSettings()">
                                Import Settings
                            </button>
                            <input type="file" id="settings-import" accept=".json" style="display: none;">
                        </div>
                    </div>
                </div>
                
                <div class="panel-footer">
                    <button class="btn btn-secondary" onclick="dashboardCustomization.resetToDefaults()">
                        Reset to Defaults
                    </button>
                    <button class="btn btn-primary" onclick="dashboardCustomization.applyAndSave()">
                        Apply Changes
                    </button>
                </div>
            </div>
            
            <div id="customization-overlay" class="customization-overlay" style="display: none;" onclick="dashboardCustomization.closePanel()"></div>
            
            <button id="customize-btn" class="customize-button" onclick="dashboardCustomization.openPanel()" title="Customize Dashboard">
                ⚙️
            </button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', panelHTML);
        this.addCustomizationStyles();
        this.populateWidgetToggles();
    }

    addCustomizationStyles() {
        const styles = `
            <style id="customization-styles">
                .customize-button {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: var(--primary-color, #6366f1);
                    color: white;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transition: all 0.3s ease;
                    z-index: 1000;
                }

                .customize-button:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                }

                .customization-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 9998;
                }

                .customization-panel {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 400px;
                    height: 100vh;
                    background: white;
                    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                }

                .customization-panel.open {
                    transform: translateX(0);
                }

                .panel-header {
                    padding: 20px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f9fafb;
                }

                .panel-header h3 {
                    margin: 0;
                    color: #1f2937;
                    font-size: 1.25rem;
                    font-weight: 600;
                }

                .panel-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                }

                .panel-close:hover {
                    background: #e5e7eb;
                    color: #374151;
                }

                .panel-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }

                .customization-section {
                    margin-bottom: 32px;
                }

                .customization-section h4 {
                    margin: 0 0 16px 0;
                    color: #1f2937;
                    font-size: 1rem;
                    font-weight: 600;
                }

                .theme-options {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }

                .theme-option {
                    cursor: pointer;
                }

                .theme-option input[type="radio"] {
                    display: none;
                }

                .theme-preview {
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                    transition: all 0.2s;
                }

                .theme-option input[type="radio"]:checked + .theme-preview {
                    border-color: #6366f1;
                    background: rgba(99, 102, 241, 0.05);
                }

                .theme-colors {
                    display: flex;
                    justify-content: center;
                    gap: 4px;
                    margin-bottom: 8px;
                }

                .theme-colors .color {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                }

                .theme-preview.default .color.primary { background: #6366f1; }
                .theme-preview.default .color.secondary { background: #64748b; }
                .theme-preview.default .color.accent { background: #10b981; }

                .theme-preview.dark .color.primary { background: #8b5cf6; }
                .theme-preview.dark .color.secondary { background: #374151; }
                .theme-preview.dark .color.accent { background: #06b6d4; }

                .theme-preview.blue .color.primary { background: #3b82f6; }
                .theme-preview.blue .color.secondary { background: #1e40af; }
                .theme-preview.blue .color.accent { background: #0ea5e9; }

                .theme-preview.green .color.primary { background: #059669; }
                .theme-preview.green .color.secondary { background: #047857; }
                .theme-preview.green .color.accent { background: #10b981; }

                .theme-name {
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 500;
                }

                .layout-options {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .checkbox-option {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    cursor: pointer;
                }

                .checkbox-option input[type="checkbox"] {
                    display: none;
                }

                .checkmark {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #d1d5db;
                    border-radius: 4px;
                    position: relative;
                    transition: all 0.2s;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .checkbox-option input[type="checkbox"]:checked + .checkmark {
                    background: #6366f1;
                    border-color: #6366f1;
                }

                .checkbox-option input[type="checkbox"]:checked + .checkmark::after {
                    content: '✓';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                }

                .checkbox-option small {
                    display: block;
                    color: #6b7280;
                    font-size: 12px;
                    margin-top: 2px;
                }

                .widget-toggles {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .widget-toggle {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px;
                    background: #f9fafb;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                }

                .widget-toggle-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .widget-icon {
                    font-size: 16px;
                }

                .widget-toggle-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: #1f2937;
                }

                .toggle-switch {
                    position: relative;
                    width: 40px;
                    height: 20px;
                    background: #d1d5db;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .toggle-switch.active {
                    background: #6366f1;
                }

                .toggle-switch::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 16px;
                    height: 16px;
                    background: white;
                    border-radius: 50%;
                    transition: transform 0.2s;
                }

                .toggle-switch.active::after {
                    transform: translateX(20px);
                }

                .color-customization {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .color-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .color-input-group label {
                    font-size: 12px;
                    font-weight: 500;
                    color: #374151;
                }

                .color-input-group input[type="color"] {
                    width: 100%;
                    height: 40px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    cursor: pointer;
                    background: none;
                }

                .settings-io {
                    display: flex;
                    gap: 12px;
                }

                .settings-io .btn {
                    flex: 1;
                    font-size: 12px;
                    padding: 8px 12px;
                }

                .panel-footer {
                    padding: 20px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 12px;
                    background: #f9fafb;
                }

                .panel-footer .btn {
                    flex: 1;
                }

                /* Theme Styles */
                .dashboard-container.theme-dark {
                    --primary-color: #8b5cf6;
                    --background-color: #1f2937;
                    --card-background: #374151;
                    --text-primary: #f9fafb;
                    --text-secondary: #d1d5db;
                    --border-color: #4b5563;
                }

                .dashboard-container.theme-blue {
                    --primary-color: #3b82f6;
                    --success-color: #0ea5e9;
                    --warning-color: #f59e0b;
                    --error-color: #ef4444;
                }

                .dashboard-container.theme-green {
                    --primary-color: #059669;
                    --success-color: #10b981;
                    --info-color: #047857;
                }

                .dashboard-container.compact-mode {
                    padding: 1rem 0.75rem;
                }

                .dashboard-container.compact-mode .dashboard-grid,
                .dashboard-container.compact-mode .widget-row {
                    gap: 0.75rem;
                }

                .dashboard-container.compact-mode .widget-card {
                    padding: 0.75rem;
                }

                .dashboard-container.compact-mode .widget-body {
                    padding: 0.75rem;
                }

                .dashboard-container.hide-titles .widget-title {
                    display: none;
                }

                .dashboard-container.hide-titles .widget-header {
                    padding-bottom: 0;
                    border-bottom: none;
                }

                .dashboard-container.animations-disabled * {
                    transition: none !important;
                    animation: none !important;
                }

                @media (max-width: 768px) {
                    .customization-panel {
                        width: 100vw;
                    }
                    
                    .color-customization {
                        grid-template-columns: 1fr;
                    }
                    
                    .theme-options {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    populateWidgetToggles() {
        const widgets = document.querySelectorAll('.widget-card');
        const togglesContainer = document.querySelector('.widget-toggles');
        
        widgets.forEach(widget => {
            const id = widget.id;
            const title = widget.querySelector('.widget-title')?.textContent || 'Widget';
            const icon = this.getWidgetIcon(title);
            const isVisible = widget.style.display !== 'none';
            
            const toggleHTML = `
                <div class="widget-toggle">
                    <div class="widget-toggle-info">
                        <span class="widget-icon">${icon}</span>
                        <span class="widget-toggle-name">${title}</span>
                    </div>
                    <div class="toggle-switch ${isVisible ? 'active' : ''}" 
                         onclick="dashboardCustomization.toggleWidget('${id}', this)">
                    </div>
                </div>
            `;
            
            togglesContainer.insertAdjacentHTML('beforeend', toggleHTML);
        });
    }

    getWidgetIcon(title) {
        const icons = {
            'Active Jobs': '🔄',
            'Pending Jobs': '⏳',
            'Completed Today': '✅',
            'Resource Utilization': '📊',
            'Demand Forecast': '📈',
            'Stock Levels': '📦',
            'Working Capital': '💰',
            'Production Capacity': '🏭',
            'Recent Jobs': '📋'
        };
        
        return icons[title] || '📊';
    }

    bindEvents() {
        // Theme selection
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.layoutSettings.theme = e.target.value;
            });
        });

        // Layout options
        document.getElementById('compact-mode').addEventListener('change', (e) => {
            this.layoutSettings.compactMode = e.target.checked;
        });

        document.getElementById('show-titles').addEventListener('change', (e) => {
            this.layoutSettings.showTitles = e.target.checked;
        });

        document.getElementById('animations-enabled').addEventListener('change', (e) => {
            this.layoutSettings.animationsEnabled = e.target.checked;
        });

        // Color inputs
        document.querySelectorAll('input[type="color"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateCustomColor(e.target.id, e.target.value);
            });
        });

        // Settings import
        document.getElementById('settings-import').addEventListener('change', (e) => {
            this.handleSettingsImport(e.target.files[0]);
        });
    }

    openPanel() {
        document.getElementById('customization-overlay').style.display = 'block';
        document.getElementById('customization-panel').style.display = 'flex';
        
        setTimeout(() => {
            document.getElementById('customization-panel').classList.add('open');
        }, 10);
        
        document.body.style.overflow = 'hidden';
        this.loadCurrentSettings();
    }

    closePanel() {
        document.getElementById('customization-panel').classList.remove('open');
        
        setTimeout(() => {
            document.getElementById('customization-overlay').style.display = 'none';
            document.getElementById('customization-panel').style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }

    loadCurrentSettings() {
        // Update theme selection
        document.querySelector(`input[name="theme"][value="${this.layoutSettings.theme}"]`).checked = true;
        
        // Update checkboxes
        document.getElementById('compact-mode').checked = this.layoutSettings.compactMode;
        document.getElementById('show-titles').checked = this.layoutSettings.showTitles;
        document.getElementById('animations-enabled').checked = this.layoutSettings.animationsEnabled;
        
        // Update color inputs
        if (this.layoutSettings.customColors) {
            Object.entries(this.layoutSettings.customColors).forEach(([key, value]) => {
                const input = document.getElementById(key);
                if (input) input.value = value;
            });
        }
    }

    toggleWidget(widgetId, toggleElement) {
        const widget = document.getElementById(widgetId);
        const isVisible = !toggleElement.classList.contains('active');
        
        if (isVisible) {
            widget.style.display = 'block';
            toggleElement.classList.add('active');
        } else {
            widget.style.display = 'none';
            toggleElement.classList.remove('active');
        }
        
        this.widgetSettings[widgetId] = { visible: isVisible };
    }

    updateCustomColor(colorId, value) {
        if (!this.layoutSettings.customColors) {
            this.layoutSettings.customColors = {};
        }
        
        this.layoutSettings.customColors[colorId] = value;
        
        // Apply color immediately
        const colorMap = {
            'primary-color': '--primary-color',
            'success-color': '--success-color',
            'warning-color': '--warning-color',
            'error-color': '--error-color'
        };
        
        const cssVar = colorMap[colorId];
        if (cssVar) {
            document.documentElement.style.setProperty(cssVar, value);
        }
    }

    applySettings() {
        const container = document.querySelector('.dashboard-container');
        
        // Apply theme
        container.className = container.className.replace(/theme-\w+/g, '');
        if (this.layoutSettings.theme !== 'default') {
            container.classList.add(`theme-${this.layoutSettings.theme}`);
        }
        
        // Apply layout options
        container.classList.toggle('compact-mode', this.layoutSettings.compactMode);
        container.classList.toggle('hide-titles', !this.layoutSettings.showTitles);
        container.classList.toggle('animations-disabled', !this.layoutSettings.animationsEnabled);
        
        // Apply custom colors
        if (this.layoutSettings.customColors) {
            Object.entries(this.layoutSettings.customColors).forEach(([colorId, value]) => {
                const colorMap = {
                    'primary-color': '--primary-color',
                    'success-color': '--success-color',
                    'warning-color': '--warning-color',
                    'error-color': '--error-color'
                };
                
                const cssVar = colorMap[colorId];
                if (cssVar) {
                    document.documentElement.style.setProperty(cssVar, value);
                }
            });
        }
        
        // Apply widget visibility
        Object.entries(this.widgetSettings).forEach(([widgetId, settings]) => {
            const widget = document.getElementById(widgetId);
            if (widget) {
                widget.style.display = settings.visible ? 'block' : 'none';
            }
        });
    }

    applyAndSave() {
        this.applySettings();
        this.saveSettings();
        this.closePanel();
        
        if (window.sentiaDashboard) {
            window.sentiaDashboard.showToast('Dashboard customization applied!', 'success');
        }
    }

    resetToDefaults() {
        this.layoutSettings = {
            theme: 'default',
            compactMode: false,
            showTitles: true,
            animationsEnabled: true
        };
        this.widgetSettings = {};
        
        // Reset all widgets to visible
        document.querySelectorAll('.widget-card').forEach(widget => {
            widget.style.display = 'block';
        });
        
        // Reset custom colors
        document.documentElement.style.removeProperty('--primary-color');
        document.documentElement.style.removeProperty('--success-color');
        document.documentElement.style.removeProperty('--warning-color');
        document.documentElement.style.removeProperty('--error-color');
        
        this.applySettings();
        this.loadCurrentSettings();
        
        // Update widget toggles
        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.classList.add('active');
        });
        
        if (window.sentiaDashboard) {
            window.sentiaDashboard.showToast('Settings reset to defaults', 'info');
        }
    }

    exportSettings() {
        const settings = {
            layout: this.layoutSettings,
            widgets: this.widgetSettings,
            version: '1.0',
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `dashboard-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        if (window.sentiaDashboard) {
            window.sentiaDashboard.showToast('Settings exported successfully!', 'success');
        }
    }

    importSettings() {
        document.getElementById('settings-import').click();
    }

    handleSettingsImport(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                
                if (settings.layout) {
                    this.layoutSettings = { ...this.layoutSettings, ...settings.layout };
                }
                
                if (settings.widgets) {
                    this.widgetSettings = settings.widgets;
                }
                
                this.applySettings();
                this.loadCurrentSettings();
                
                // Update widget toggles
                Object.entries(this.widgetSettings).forEach(([widgetId, widgetSettings]) => {
                    const toggle = document.querySelector(`.widget-toggle [onclick*="${widgetId}"]`);
                    if (toggle) {
                        toggle.classList.toggle('active', widgetSettings.visible);
                    }
                });
                
                if (window.sentiaDashboard) {
                    window.sentiaDashboard.showToast('Settings imported successfully!', 'success');
                }
            } catch (error) {
                console.error('Error importing settings:', error);
                if (window.sentiaDashboard) {
                    window.sentiaDashboard.showToast('Error importing settings file', 'error');
                }
            }
        };
        
        reader.readAsText(file);
    }
}

// Initialize dashboard customization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardCustomization = new DashboardCustomization();
});