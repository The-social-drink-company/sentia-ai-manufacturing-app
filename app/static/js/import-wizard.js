// Import Wizard JavaScript
class ImportWizard {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.uploadedFiles = [];
        this.mappingData = {};
        this.importSettings = {
            skipFirstRow: true,
            dateFormat: 'YYYY-MM-DD',
            delimiter: 'auto',
            encoding: 'utf-8'
        };
        
        this.init();
    }

    init() {
        this.createWizardModal();
        this.bindEvents();
    }

    createWizardModal() {
        const modalHTML = `
            <div id="import-wizard-overlay" class="wizard-overlay" style="display: none;">
                <div class="wizard-modal">
                    <div class="wizard-header">
                        <h2>Data Import Wizard</h2>
                        <button class="wizard-close" onclick="importWizard.close()">&times;</button>
                    </div>
                    
                    <div class="wizard-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 25%"></div>
                        </div>
                        <div class="step-indicators">
                            <div class="step-indicator active" data-step="1">
                                <div class="step-number">1</div>
                                <div class="step-label">Upload</div>
                            </div>
                            <div class="step-indicator" data-step="2">
                                <div class="step-number">2</div>
                                <div class="step-label">Configure</div>
                            </div>
                            <div class="step-indicator" data-step="3">
                                <div class="step-number">3</div>
                                <div class="step-label">Map Fields</div>
                            </div>
                            <div class="step-indicator" data-step="4">
                                <div class="step-number">4</div>
                                <div class="step-label">Import</div>
                            </div>
                        </div>
                    </div>

                    <div class="wizard-content">
                        <!-- Step 1: File Upload -->
                        <div class="wizard-step" data-step="1">
                            <h3>Upload Data Files</h3>
                            <p>Select CSV, Excel, or JSON files containing your manufacturing data.</p>
                            
                            <div class="file-upload-area" id="file-drop-zone">
                                <div class="upload-icon">📁</div>
                                <p>Drag and drop files here, or <button class="link-button">browse files</button></p>
                                <input type="file" id="file-input" multiple accept=".csv,.xlsx,.xls,.json" style="display: none;">
                                <div class="supported-formats">
                                    Supported formats: CSV, Excel (.xlsx, .xls), JSON
                                </div>
                            </div>
                            
                            <div id="uploaded-files-list" class="uploaded-files" style="display: none;">
                                <h4>Uploaded Files</h4>
                                <div class="files-container"></div>
                            </div>
                        </div>

                        <!-- Step 2: Import Configuration -->
                        <div class="wizard-step" data-step="2" style="display: none;">
                            <h3>Configure Import Settings</h3>
                            <p>Adjust settings to match your data format.</p>
                            
                            <div class="config-grid">
                                <div class="config-group">
                                    <label for="data-type-select">Data Type</label>
                                    <select id="data-type-select" class="form-control">
                                        <option value="sales">Sales Data</option>
                                        <option value="inventory">Inventory Levels</option>
                                        <option value="production">Production Records</option>
                                        <option value="forecast">Demand Forecast</option>
                                        <option value="suppliers">Supplier Data</option>
                                    </select>
                                </div>
                                
                                <div class="config-group">
                                    <label for="delimiter-select">Field Delimiter</label>
                                    <select id="delimiter-select" class="form-control">
                                        <option value="auto">Auto-detect</option>
                                        <option value=",">Comma (,)</option>
                                        <option value=";">Semicolon (;)</option>
                                        <option value="\\t">Tab</option>
                                        <option value="|">Pipe (|)</option>
                                    </select>
                                </div>
                                
                                <div class="config-group">
                                    <label for="date-format-select">Date Format</label>
                                    <select id="date-format-select" class="form-control">
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss</option>
                                    </select>
                                </div>
                                
                                <div class="config-group">
                                    <label for="encoding-select">Character Encoding</label>
                                    <select id="encoding-select" class="form-control">
                                        <option value="utf-8">UTF-8</option>
                                        <option value="iso-8859-1">ISO-8859-1</option>
                                        <option value="windows-1252">Windows-1252</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="config-options">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="skip-first-row" checked>
                                    Skip first row (headers)
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="validate-data">
                                    Validate data during import
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="create-backup">
                                    Create backup before import
                                </label>
                            </div>
                        </div>

                        <!-- Step 3: Field Mapping -->
                        <div class="wizard-step" data-step="3" style="display: none;">
                            <h3>Map Data Fields</h3>
                            <p>Match your data columns to system fields.</p>
                            
                            <div class="mapping-container">
                                <div class="preview-data">
                                    <h4>Data Preview</h4>
                                    <div class="table-container">
                                        <table class="preview-table" id="preview-table">
                                            <thead></thead>
                                            <tbody></tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                <div class="field-mapping">
                                    <h4>Field Mapping</h4>
                                    <div id="mapping-rules" class="mapping-rules">
                                        <!-- Mapping rules will be populated dynamically -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Step 4: Import Execution -->
                        <div class="wizard-step" data-step="4" style="display: none;">
                            <h3>Import Progress</h3>
                            <p>Your data is being imported. Please wait...</p>
                            
                            <div class="import-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="import-progress-fill" style="width: 0%"></div>
                                </div>
                                <div class="progress-text">
                                    <span id="import-status">Preparing import...</span>
                                    <span id="import-percentage">0%</span>
                                </div>
                            </div>
                            
                            <div class="import-log">
                                <h4>Import Log</h4>
                                <div class="log-container" id="import-log">
                                    <div class="log-entry">Starting import process...</div>
                                </div>
                            </div>
                            
                            <div class="import-summary" id="import-summary" style="display: none;">
                                <h4>Import Summary</h4>
                                <div class="summary-stats">
                                    <div class="stat-item">
                                        <div class="stat-label">Records Processed</div>
                                        <div class="stat-value" id="records-processed">0</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-label">Successfully Imported</div>
                                        <div class="stat-value" id="records-imported">0</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-label">Errors</div>
                                        <div class="stat-value" id="import-errors">0</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-label">Warnings</div>
                                        <div class="stat-value" id="import-warnings">0</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="wizard-footer">
                        <button class="btn btn-secondary" id="wizard-back" onclick="importWizard.previousStep()" style="display: none;">Back</button>
                        <div class="footer-spacer"></div>
                        <button class="btn btn-secondary" id="wizard-cancel" onclick="importWizard.close()">Cancel</button>
                        <button class="btn btn-primary" id="wizard-next" onclick="importWizard.nextStep()">Next</button>
                        <button class="btn btn-primary" id="wizard-import" onclick="importWizard.startImport()" style="display: none;">Start Import</button>
                        <button class="btn btn-success" id="wizard-finish" onclick="importWizard.finish()" style="display: none;">Finish</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addWizardStyles();
    }

    addWizardStyles() {
        const styles = `
            <style id="import-wizard-styles">
                .wizard-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                }

                .wizard-modal {
                    background: white;
                    border-radius: 12px;
                    width: 90vw;
                    max-width: 900px;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }

                .wizard-header {
                    padding: 20px 30px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f9fafb;
                }

                .wizard-header h2 {
                    margin: 0;
                    color: #1f2937;
                    font-size: 1.5rem;
                    font-weight: 600;
                }

                .wizard-close {
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

                .wizard-close:hover {
                    background: #e5e7eb;
                    color: #374151;
                }

                .wizard-progress {
                    padding: 20px 30px;
                    background: #f9fafb;
                }

                .wizard-progress .progress-bar {
                    height: 4px;
                    background: #e5e7eb;
                    border-radius: 2px;
                    margin-bottom: 20px;
                }

                .wizard-progress .progress-fill {
                    height: 100%;
                    background: #6366f1;
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }

                .step-indicators {
                    display: flex;
                    justify-content: space-between;
                }

                .step-indicator {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    opacity: 0.5;
                    transition: opacity 0.3s;
                }

                .step-indicator.active,
                .step-indicator.completed {
                    opacity: 1;
                }

                .step-number {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #e5e7eb;
                    color: #6b7280;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 8px;
                    transition: all 0.3s;
                }

                .step-indicator.active .step-number {
                    background: #6366f1;
                    color: white;
                }

                .step-indicator.completed .step-number {
                    background: #10b981;
                    color: white;
                }

                .step-label {
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 500;
                }

                .wizard-content {
                    padding: 30px;
                    max-height: 60vh;
                    overflow-y: auto;
                }

                .wizard-step h3 {
                    margin: 0 0 8px 0;
                    color: #1f2937;
                    font-size: 1.25rem;
                    font-weight: 600;
                }

                .wizard-step p {
                    margin: 0 0 24px 0;
                    color: #6b7280;
                }

                .file-upload-area {
                    border: 2px dashed #d1d5db;
                    border-radius: 8px;
                    padding: 40px 20px;
                    text-align: center;
                    background: #fafafa;
                    transition: all 0.3s;
                    cursor: pointer;
                }

                .file-upload-area:hover,
                .file-upload-area.dragover {
                    border-color: #6366f1;
                    background: #f0f0ff;
                }

                .upload-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .link-button {
                    background: none;
                    border: none;
                    color: #6366f1;
                    text-decoration: underline;
                    cursor: pointer;
                    padding: 0;
                }

                .supported-formats {
                    margin-top: 16px;
                    font-size: 12px;
                    color: #6b7280;
                }

                .uploaded-files {
                    margin-top: 24px;
                }

                .files-container {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .file-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: #f9fafb;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                }

                .file-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .file-icon {
                    font-size: 20px;
                }

                .file-details h5 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 500;
                    color: #1f2937;
                }

                .file-details p {
                    margin: 4px 0 0 0;
                    font-size: 12px;
                    color: #6b7280;
                }

                .file-actions {
                    display: flex;
                    gap: 8px;
                }

                .file-action {
                    padding: 4px 8px;
                    font-size: 12px;
                    border: 1px solid #d1d5db;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .file-action:hover {
                    background: #f3f4f6;
                }

                .file-action.remove {
                    color: #dc2626;
                    border-color: #fecaca;
                }

                .file-action.remove:hover {
                    background: #fef2f2;
                }

                .config-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .config-group label {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 6px;
                }

                .form-control {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: all 0.2s;
                }

                .form-control:focus {
                    outline: none;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }

                .config-options {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: #374151;
                    cursor: pointer;
                }

                .mapping-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }

                .preview-data,
                .field-mapping {
                    background: #f9fafb;
                    padding: 16px;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                }

                .preview-data h4,
                .field-mapping h4 {
                    margin: 0 0 16px 0;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1f2937;
                }

                .table-container {
                    max-height: 300px;
                    overflow: auto;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    background: white;
                }

                .preview-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }

                .preview-table th,
                .preview-table td {
                    padding: 8px 12px;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                }

                .preview-table th {
                    background: #f3f4f6;
                    font-weight: 600;
                    color: #374151;
                    position: sticky;
                    top: 0;
                }

                .mapping-rules {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .mapping-rule {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                }

                .mapping-rule label {
                    font-size: 12px;
                    font-weight: 500;
                    color: #6b7280;
                    min-width: 80px;
                }

                .mapping-rule select {
                    flex: 1;
                    padding: 6px 8px;
                    border: 1px solid #d1d5db;
                    border-radius: 4px;
                    font-size: 12px;
                }

                .import-progress {
                    margin: 24px 0;
                }

                .import-progress .progress-bar {
                    height: 8px;
                    background: #e5e7eb;
                    border-radius: 4px;
                    margin-bottom: 12px;
                }

                .progress-text {
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                    color: #6b7280;
                }

                .import-log {
                    margin: 24px 0;
                }

                .log-container {
                    max-height: 200px;
                    overflow-y: auto;
                    background: #1f2937;
                    color: #f9fafb;
                    padding: 16px;
                    border-radius: 6px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.4;
                }

                .log-entry {
                    margin-bottom: 4px;
                }

                .log-entry.success {
                    color: #10b981;
                }

                .log-entry.warning {
                    color: #f59e0b;
                }

                .log-entry.error {
                    color: #ef4444;
                }

                .import-summary {
                    margin: 24px 0;
                    background: #f0f9ff;
                    border: 1px solid #bae6fd;
                    border-radius: 8px;
                    padding: 20px;
                }

                .summary-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 16px;
                }

                .stat-item {
                    text-align: center;
                }

                .stat-label {
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 500;
                    margin-bottom: 4px;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .wizard-footer {
                    padding: 20px 30px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    align-items: center;
                    background: #f9fafb;
                }

                .footer-spacer {
                    flex: 1;
                }

                .wizard-footer .btn {
                    margin-left: 12px;
                }

                @media (max-width: 768px) {
                    .wizard-modal {
                        width: 95vw;
                        max-height: 95vh;
                    }

                    .wizard-content {
                        padding: 20px;
                    }

                    .mapping-container {
                        grid-template-columns: 1fr;
                    }

                    .config-grid {
                        grid-template-columns: 1fr;
                    }

                    .summary-stats {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    bindEvents() {
        // File input events
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Drag and drop events
        const dropZone = document.getElementById('file-drop-zone');
        
        dropZone.addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            this.handleFileSelection(e.dataTransfer.files);
        });

        // Configuration change events
        document.getElementById('data-type-select').addEventListener('change', (e) => {
            this.updateFieldMappingOptions(e.target.value);
        });
    }

    show() {
        document.getElementById('import-wizard-overlay').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.currentStep = 1;
        this.updateStepDisplay();
    }

    close() {
        document.getElementById('import-wizard-overlay').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.reset();
    }

    reset() {
        this.currentStep = 1;
        this.uploadedFiles = [];
        this.mappingData = {};
        
        // Clear uploaded files
        const filesContainer = document.querySelector('.files-container');
        if (filesContainer) {
            filesContainer.innerHTML = '';
        }
        
        document.getElementById('uploaded-files-list').style.display = 'none';
        
        // Reset form values
        document.getElementById('data-type-select').value = 'sales';
        document.getElementById('skip-first-row').checked = true;
        
        this.updateStepDisplay();
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            this.currentStep++;
            this.updateStepDisplay();
            
            if (this.currentStep === 3) {
                this.generateFieldMapping();
            }
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                if (this.uploadedFiles.length === 0) {
                    this.showError('Please upload at least one file.');
                    return false;
                }
                return true;
            
            case 2:
                return this.validateConfiguration();
            
            case 3:
                return this.validateFieldMapping();
            
            default:
                return true;
        }
    }

    validateConfiguration() {
        // Validate import settings
        const dataType = document.getElementById('data-type-select').value;
        const delimiter = document.getElementById('delimiter-select').value;
        const dateFormat = document.getElementById('date-format-select').value;
        
        this.importSettings = {
            dataType,
            delimiter,
            dateFormat,
            skipFirstRow: document.getElementById('skip-first-row').checked,
            validateData: document.getElementById('validate-data').checked,
            createBackup: document.getElementById('create-backup').checked,
            encoding: document.getElementById('encoding-select').value
        };
        
        return true;
    }

    validateFieldMapping() {
        // Ensure required fields are mapped
        const mappingRules = document.querySelectorAll('#mapping-rules select');
        const mappedFields = new Set();
        
        let hasRequiredMappings = true;
        
        mappingRules.forEach(select => {
            const value = select.value;
            if (value && value !== 'ignore') {
                if (mappedFields.has(value)) {
                    this.showError('Each system field can only be mapped once.');
                    hasRequiredMappings = false;
                    return;
                }
                mappedFields.add(value);
            }
        });
        
        return hasRequiredMappings;
    }

    updateStepDisplay() {
        // Update progress bar
        const progressFill = document.querySelector('.wizard-progress .progress-fill');
        const percentage = (this.currentStep / this.totalSteps) * 100;
        progressFill.style.width = `${percentage}%`;
        
        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
            const stepNumber = index + 1;
            indicator.classList.remove('active', 'completed');
            
            if (stepNumber < this.currentStep) {
                indicator.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                indicator.classList.add('active');
            }
        });
        
        // Show/hide steps
        document.querySelectorAll('.wizard-step').forEach(step => {
            step.style.display = 'none';
        });
        
        const currentStepElement = document.querySelector(`.wizard-step[data-step="${this.currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.style.display = 'block';
        }
        
        // Update footer buttons
        this.updateFooterButtons();
    }

    updateFooterButtons() {
        const backBtn = document.getElementById('wizard-back');
        const nextBtn = document.getElementById('wizard-next');
        const importBtn = document.getElementById('wizard-import');
        const finishBtn = document.getElementById('wizard-finish');
        
        // Hide all buttons first
        [backBtn, nextBtn, importBtn, finishBtn].forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Show appropriate buttons
        if (this.currentStep > 1) {
            backBtn.style.display = 'inline-block';
        }
        
        if (this.currentStep < 3) {
            nextBtn.style.display = 'inline-block';
        } else if (this.currentStep === 3) {
            importBtn.style.display = 'inline-block';
        } else if (this.currentStep === 4) {
            finishBtn.style.display = 'inline-block';
        }
    }

    handleFileSelection(files) {
        Array.from(files).forEach(file => {
            if (this.isValidFile(file)) {
                this.uploadedFiles.push(file);
                this.addFileToList(file);
            }
        });
        
        if (this.uploadedFiles.length > 0) {
            document.getElementById('uploaded-files-list').style.display = 'block';
        }
    }

    isValidFile(file) {
        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/json'
        ];
        
        const validExtensions = ['.csv', '.xls', '.xlsx', '.json'];
        const hasValidType = validTypes.includes(file.type);
        const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!hasValidType && !hasValidExtension) {
            this.showError(`Invalid file type: ${file.name}. Please upload CSV, Excel, or JSON files.`);
            return false;
        }
        
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            this.showError(`File too large: ${file.name}. Maximum size is 50MB.`);
            return false;
        }
        
        return true;
    }

    addFileToList(file) {
        const container = document.querySelector('.files-container');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">${this.getFileIcon(file)}</div>
                <div class="file-details">
                    <h5>${file.name}</h5>
                    <p>${this.formatFileSize(file.size)} • ${file.type || 'Unknown type'}</p>
                </div>
            </div>
            <div class="file-actions">
                <button class="file-action preview" onclick="importWizard.previewFile('${file.name}')">Preview</button>
                <button class="file-action remove" onclick="importWizard.removeFile('${file.name}')">Remove</button>
            </div>
        `;
        
        container.appendChild(fileItem);
    }

    getFileIcon(file) {
        if (file.type.includes('csv') || file.name.endsWith('.csv')) {
            return '📊';
        } else if (file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            return '📈';
        } else if (file.type.includes('json') || file.name.endsWith('.json')) {
            return '📄';
        }
        return '📁';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(fileName) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
        
        // Remove from UI
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            const nameElement = item.querySelector('h5');
            if (nameElement && nameElement.textContent === fileName) {
                item.remove();
            }
        });
        
        if (this.uploadedFiles.length === 0) {
            document.getElementById('uploaded-files-list').style.display = 'none';
        }
    }

    generateFieldMapping() {
        // Mock field mapping generation
        const mappingContainer = document.getElementById('mapping-rules');
        const dataType = document.getElementById('data-type-select').value;
        
        // Generate preview data
        this.generatePreviewData();
        
        // Generate mapping rules based on data type
        const fieldMappings = this.getFieldMappingsForDataType(dataType);
        
        mappingContainer.innerHTML = '';
        
        fieldMappings.forEach(mapping => {
            const rule = document.createElement('div');
            rule.className = 'mapping-rule';
            rule.innerHTML = `
                <label>${mapping.systemField}:</label>
                <select data-field="${mapping.systemField}">
                    <option value="">-- Select Column --</option>
                    <option value="ignore">Ignore</option>
                    ${this.generateColumnOptions()}
                </select>
            `;
            mappingContainer.appendChild(rule);
        });
    }

    generatePreviewData() {
        // Mock preview data
        const previewTable = document.getElementById('preview-table');
        const thead = previewTable.querySelector('thead');
        const tbody = previewTable.querySelector('tbody');
        
        // Mock headers
        const headers = ['Date', 'Product_ID', 'Product_Name', 'Quantity', 'Price', 'Channel', 'Region'];
        thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        
        // Mock data rows
        const rows = [
            ['2024-01-15', 'GABA-R-001', 'GABA Red', '150', '29.99', 'Amazon UK', 'UK'],
            ['2024-01-15', 'GABA-B-001', 'GABA Black', '89', '49.99', 'Shopify UK', 'UK'],
            ['2024-01-15', 'GABA-G-001', 'GABA Gold', '45', '79.99', 'Amazon USA', 'USA'],
            ['2024-01-16', 'GABA-R-001', 'GABA Red', '167', '29.99', 'Shopify EU', 'EU'],
            ['2024-01-16', 'GABA-B-001', 'GABA Black', '92', '49.99', 'Amazon EU', 'EU']
        ];
        
        tbody.innerHTML = rows.map(row => 
            `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
        ).join('');
    }

    generateColumnOptions() {
        const headers = ['Date', 'Product_ID', 'Product_Name', 'Quantity', 'Price', 'Channel', 'Region'];
        return headers.map(header => `<option value="${header}">${header}</option>`).join('');
    }

    getFieldMappingsForDataType(dataType) {
        const mappings = {
            sales: [
                { systemField: 'Date', required: true },
                { systemField: 'Product ID', required: true },
                { systemField: 'Product Name', required: false },
                { systemField: 'Quantity', required: true },
                { systemField: 'Price', required: true },
                { systemField: 'Sales Channel', required: false },
                { systemField: 'Region', required: false }
            ],
            inventory: [
                { systemField: 'Product ID', required: true },
                { systemField: 'Product Name', required: false },
                { systemField: 'Current Stock', required: true },
                { systemField: 'Location', required: false },
                { systemField: 'Last Updated', required: false }
            ],
            production: [
                { systemField: 'Job ID', required: true },
                { systemField: 'Product ID', required: true },
                { systemField: 'Quantity Produced', required: true },
                { systemField: 'Start Date', required: true },
                { systemField: 'End Date', required: false },
                { systemField: 'Resource Used', required: false }
            ]
        };
        
        return mappings[dataType] || mappings.sales;
    }

    startImport() {
        this.currentStep = 4;
        this.updateStepDisplay();
        
        // Simulate import process
        this.simulateImport();
    }

    simulateImport() {
        const progressFill = document.getElementById('import-progress-fill');
        const statusText = document.getElementById('import-status');
        const percentageText = document.getElementById('import-percentage');
        const logContainer = document.getElementById('import-log');
        
        let progress = 0;
        const steps = [
            'Validating files...',
            'Processing data...',
            'Mapping fields...',
            'Importing records...',
            'Validating imported data...',
            'Import completed successfully!'
        ];
        
        const interval = setInterval(() => {
            progress += 16.67;
            const stepIndex = Math.floor(progress / 16.67) - 1;
            
            if (stepIndex >= 0 && stepIndex < steps.length) {
                statusText.textContent = steps[stepIndex];
                
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry success';
                logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${steps[stepIndex]}`;
                logContainer.appendChild(logEntry);
                logContainer.scrollTop = logContainer.scrollHeight;
            }
            
            progressFill.style.width = `${Math.min(progress, 100)}%`;
            percentageText.textContent = `${Math.round(Math.min(progress, 100))}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                this.completeImport();
            }
        }, 800);
    }

    completeImport() {
        const summaryDiv = document.getElementById('import-summary');
        summaryDiv.style.display = 'block';
        
        // Mock import results
        document.getElementById('records-processed').textContent = '1,247';
        document.getElementById('records-imported').textContent = '1,245';
        document.getElementById('import-errors').textContent = '2';
        document.getElementById('import-warnings').textContent = '5';
        
        this.updateFooterButtons();
    }

    finish() {
        this.close();
        
        // Show success message and refresh dashboard
        if (window.sentiaDashboard) {
            window.sentiaDashboard.showToast('Data imported successfully!', 'success');
            window.sentiaDashboard.refreshAllWidgets();
        }
    }

    showError(message) {
        if (window.sentiaDashboard) {
            window.sentiaDashboard.showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    previewFile(fileName) {
        // Mock file preview
        if (window.sentiaDashboard) {
            window.sentiaDashboard.showToast(`Preview for ${fileName} - Feature coming soon`, 'info');
        }
    }

    updateFieldMappingOptions(dataType) {
        // This would update the field mapping options based on selected data type
        console.log(`Updating field mapping options for ${dataType}`);
    }
}

// Initialize import wizard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.importWizard = new ImportWizard();
});

// Global function to show import wizard
function showImportWizard() {
    if (window.importWizard) {
        window.importWizard.show();
    } else {
        if (window.sentiaDashboard) {
            window.sentiaDashboard.showToast('Import wizard is loading...', 'info');
        }
    }
}