/**
 * Sentia Help Widget - Contextual help and support system
 * Provides tooltips, contextual help, and support features
 */

class SentiaHelpWidget {
    constructor(options = {}) {
        this.options = {
            apiBaseUrl: '/help/api',
            tooltipDelay: 500,
            tooltipPosition: 'top',
            enableContextualHelp: true,
            enableTooltips: true,
            enableFeedback: true,
            ...options
        };
        
        this.tooltips = new Map();
        this.currentPage = window.location.pathname;
        this.feedbackShown = new Set();
        
        this.init();
    }
    
    init() {
        this.loadContextualHelp();
        this.setupTooltips();
        this.createHelpButton();
        this.createFeedbackModal();
        this.bindEvents();
    }
    
    /**
     * Load contextual help for the current page
     */
    async loadContextualHelp() {
        if (!this.options.enableContextualHelp) return;
        
        try {
            const response = await fetch(`${this.options.apiBaseUrl}/contextual${this.currentPage}`);
            const data = await response.json();
            
            if (data.success && data.data.tooltips) {
                this.setupPageTooltips(data.data.tooltips);
            }
        } catch (error) {
            console.warn('Failed to load contextual help:', error);
        }
    }
    
    /**
     * Setup tooltips for the current page
     */
    setupPageTooltips(tooltips) {
        tooltips.forEach(tooltip => {
            const element = document.querySelector(`[data-help-id="${tooltip.element_id}"]`) || 
                           document.getElementById(tooltip.element_id);
            
            if (element) {
                this.addTooltip(element, tooltip);
            }
        });
    }
    
    /**
     * Add tooltip to an element
     */
    addTooltip(element, tooltipData) {
        if (!this.options.enableTooltips) return;
        
        // Create tooltip element
        const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
        const tooltipElement = document.createElement('div');
        tooltipElement.id = tooltipId;
        tooltipElement.className = 'sentia-tooltip';
        tooltipElement.innerHTML = `
            <div class="sentia-tooltip-content">
                ${tooltipData.title ? `<h6 class="sentia-tooltip-title">${tooltipData.title}</h6>` : ''}
                <div class="sentia-tooltip-body">${tooltipData.content}</div>
                ${this.options.enableFeedback ? `
                    <div class="sentia-tooltip-actions">
                        <button class="btn btn-sm btn-link" onclick="helpWidget.showFeedback('tooltip', '${tooltipData.id}')">
                            Was this helpful?
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="sentia-tooltip-arrow"></div>
        `;
        
        document.body.appendChild(tooltipElement);
        
        // Store tooltip reference
        this.tooltips.set(element, {
            element: tooltipElement,
            data: tooltipData,
            visible: false
        });
        
        // Add event listeners based on trigger type
        this.bindTooltipEvents(element, tooltipData.trigger || 'hover');
    }
    
    /**
     * Bind tooltip events
     */
    bindTooltipEvents(element, trigger) {
        const tooltip = this.tooltips.get(element);
        
        if (trigger === 'hover') {
            element.addEventListener('mouseenter', () => {
                clearTimeout(tooltip.hideTimeout);
                tooltip.showTimeout = setTimeout(() => {
                    this.showTooltip(element);
                }, this.options.tooltipDelay);
            });
            
            element.addEventListener('mouseleave', () => {
                clearTimeout(tooltip.showTimeout);
                tooltip.hideTimeout = setTimeout(() => {
                    this.hideTooltip(element);
                }, 100);
            });
            
            tooltip.element.addEventListener('mouseenter', () => {
                clearTimeout(tooltip.hideTimeout);
            });
            
            tooltip.element.addEventListener('mouseleave', () => {
                tooltip.hideTimeout = setTimeout(() => {
                    this.hideTooltip(element);
                }, 100);
            });
        } else if (trigger === 'click') {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTooltip(element);
            });
        } else if (trigger === 'focus') {
            element.addEventListener('focus', () => {
                this.showTooltip(element);
            });
            
            element.addEventListener('blur', () => {
                this.hideTooltip(element);
            });
        }
    }
    
    /**
     * Show tooltip
     */
    showTooltip(element) {
        const tooltip = this.tooltips.get(element);
        if (!tooltip || tooltip.visible) return;
        
        // Hide other tooltips
        this.hideAllTooltips();
        
        // Position and show tooltip
        this.positionTooltip(element, tooltip.element, tooltip.data.position);
        tooltip.element.classList.add('sentia-tooltip-visible');
        tooltip.visible = true;
    }
    
    /**
     * Hide tooltip
     */
    hideTooltip(element) {
        const tooltip = this.tooltips.get(element);
        if (!tooltip || !tooltip.visible) return;
        
        tooltip.element.classList.remove('sentia-tooltip-visible');
        tooltip.visible = false;
    }
    
    /**
     * Toggle tooltip visibility
     */
    toggleTooltip(element) {
        const tooltip = this.tooltips.get(element);
        if (!tooltip) return;
        
        if (tooltip.visible) {
            this.hideTooltip(element);
        } else {
            this.showTooltip(element);
        }
    }
    
    /**
     * Hide all tooltips
     */
    hideAllTooltips() {
        this.tooltips.forEach((tooltip, element) => {
            if (tooltip.visible) {
                this.hideTooltip(element);
            }
        });
    }
    
    /**
     * Position tooltip relative to target element
     */
    positionTooltip(targetElement, tooltipElement, position = 'top') {
        const targetRect = targetElement.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - 10;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                tooltipElement.className = 'sentia-tooltip sentia-tooltip-top';
                break;
            case 'bottom':
                top = targetRect.bottom + 10;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                tooltipElement.className = 'sentia-tooltip sentia-tooltip-bottom';
                break;
            case 'left':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.left - tooltipRect.width - 10;
                tooltipElement.className = 'sentia-tooltip sentia-tooltip-left';
                break;
            case 'right':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.right + 10;
                tooltipElement.className = 'sentia-tooltip sentia-tooltip-right';
                break;
        }
        
        // Ensure tooltip stays within viewport
        const padding = 10;
        top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
        left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
        
        tooltipElement.style.top = `${top + window.scrollY}px`;
        tooltipElement.style.left = `${left + window.scrollX}px`;
    }
    
    /**
     * Setup general tooltips using data attributes
     */
    setupTooltips() {
        // Find all elements with data-help attribute
        const helpElements = document.querySelectorAll('[data-help]');
        
        helpElements.forEach(element => {
            const helpText = element.getAttribute('data-help');
            const helpTitle = element.getAttribute('data-help-title');
            const helpPosition = element.getAttribute('data-help-position') || this.options.tooltipPosition;
            const helpTrigger = element.getAttribute('data-help-trigger') || 'hover';
            
            this.addTooltip(element, {
                id: `manual-${Math.random().toString(36).substr(2, 9)}`,
                title: helpTitle,
                content: helpText,
                position: helpPosition,
                trigger: helpTrigger
            });
        });
    }
    
    /**
     * Create floating help button
     */
    createHelpButton() {
        const helpButton = document.createElement('div');
        helpButton.id = 'sentia-help-button';
        helpButton.className = 'sentia-help-button';
        helpButton.innerHTML = `
            <button class="btn btn-primary rounded-circle" title="Get Help">
                <i class="fas fa-question"></i>
            </button>
        `;
        
        helpButton.addEventListener('click', () => {
            this.showHelpMenu();
        });
        
        document.body.appendChild(helpButton);
    }
    
    /**
     * Show help menu
     */
    showHelpMenu() {
        const existingMenu = document.getElementById('sentia-help-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }
        
        const helpMenu = document.createElement('div');
        helpMenu.id = 'sentia-help-menu';
        helpMenu.className = 'sentia-help-menu';
        helpMenu.innerHTML = `
            <div class="sentia-help-menu-content">
                <div class="sentia-help-menu-header">
                    <h6>Quick Help</h6>
                    <button class="btn btn-sm btn-link" onclick="this.closest('.sentia-help-menu').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="sentia-help-menu-body">
                    <a href="/help" class="sentia-help-menu-item">
                        <i class="fas fa-home"></i> Help Center
                    </a>
                    <a href="/help/tutorials" class="sentia-help-menu-item">
                        <i class="fas fa-graduation-cap"></i> Tutorials
                    </a>
                    <a href="/help/search" class="sentia-help-menu-item">
                        <i class="fas fa-search"></i> Search Help
                    </a>
                    <a href="/help/support" class="sentia-help-menu-item">
                        <i class="fas fa-life-ring"></i> Contact Support
                    </a>
                    <div class="sentia-help-menu-divider"></div>
                    <a href="#" class="sentia-help-menu-item" onclick="helpWidget.showFeedback('page', '${this.currentPage}')">
                        <i class="fas fa-comment"></i> Feedback on this page
                    </a>
                    <a href="#" class="sentia-help-menu-item" onclick="helpWidget.toggleTutorialMode()">
                        <i class="fas fa-magic"></i> Tutorial Mode
                    </a>
                </div>
            </div>
        `;
        
        // Position near help button
        const helpButton = document.getElementById('sentia-help-button');
        const buttonRect = helpButton.getBoundingClientRect();
        
        document.body.appendChild(helpMenu);
        
        helpMenu.style.position = 'fixed';
        helpMenu.style.bottom = '80px';
        helpMenu.style.right = '20px';
        helpMenu.style.zIndex = '10000';
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!helpMenu.contains(e.target) && !helpButton.contains(e.target)) {
                    helpMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
    
    /**
     * Create feedback modal
     */
    createFeedbackModal() {
        if (!this.options.enableFeedback) return;
        
        const modal = document.createElement('div');
        modal.id = 'sentia-feedback-modal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Feedback</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="sentia-feedback-form">
                            <input type="hidden" id="feedback-type" name="type">
                            <input type="hidden" id="feedback-reference" name="reference">
                            
                            <div class="mb-3">
                                <label class="form-label">Was this helpful?</label>
                                <div class="btn-group w-100" role="group">
                                    <input type="radio" class="btn-check" name="helpful" id="helpful-yes" value="yes">
                                    <label class="btn btn-outline-success" for="helpful-yes">
                                        <i class="fas fa-thumbs-up"></i> Yes
                                    </label>
                                    <input type="radio" class="btn-check" name="helpful" id="helpful-no" value="no">
                                    <label class="btn btn-outline-danger" for="helpful-no">
                                        <i class="fas fa-thumbs-down"></i> No
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="feedback-rating" class="form-label">Rating (1-5 stars)</label>
                                <div class="rating-stars">
                                    <input type="radio" name="rating" value="1" id="star1">
                                    <label for="star1"><i class="fas fa-star"></i></label>
                                    <input type="radio" name="rating" value="2" id="star2">
                                    <label for="star2"><i class="fas fa-star"></i></label>
                                    <input type="radio" name="rating" value="3" id="star3">
                                    <label for="star3"><i class="fas fa-star"></i></label>
                                    <input type="radio" name="rating" value="4" id="star4">
                                    <label for="star4"><i class="fas fa-star"></i></label>
                                    <input type="radio" name="rating" value="5" id="star5">
                                    <label for="star5"><i class="fas fa-star"></i></label>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="feedback-comment" class="form-label">Additional Comments</label>
                                <textarea class="form-control" id="feedback-comment" name="comment" 
                                         rows="3" placeholder="How can we improve this?"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="helpWidget.submitFeedback()">
                            Submit Feedback
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Show feedback modal
     */
    showFeedback(type, reference) {
        const modal = document.getElementById('sentia-feedback-modal');
        if (!modal) return;
        
        document.getElementById('feedback-type').value = type;
        document.getElementById('feedback-reference').value = reference;
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
    
    /**
     * Submit feedback
     */
    async submitFeedback() {
        const form = document.getElementById('sentia-feedback-form');
        const formData = new FormData(form);
        
        const feedbackData = {
            article_id: formData.get('reference'),
            feedback_type: formData.get('helpful') === 'yes' ? 'helpful' : 'not_helpful',
            rating: parseInt(formData.get('rating')) || null,
            comment: formData.get('comment')
        };
        
        try {
            const response = await fetch(`${this.options.apiBaseUrl}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Thank you for your feedback!', 'success');
            } else {
                this.showNotification('Failed to submit feedback. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
            this.showNotification('Failed to submit feedback. Please try again.', 'error');
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('sentia-feedback-modal'));
        modal.hide();
        
        // Reset form
        document.getElementById('sentia-feedback-form').reset();
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} sentia-notification`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    /**
     * Toggle tutorial mode
     */
    toggleTutorialMode() {
        // This would integrate with the tutorial system
        console.log('Tutorial mode toggled');
    }
    
    /**
     * Bind global events
     */
    bindEvents() {
        // Close tooltips on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllTooltips();
            }
        });
        
        // Reposition tooltips on window resize
        window.addEventListener('resize', () => {
            this.tooltips.forEach((tooltip, element) => {
                if (tooltip.visible) {
                    this.positionTooltip(element, tooltip.element, tooltip.data.position);
                }
            });
        });
        
        // Hide tooltips on scroll
        window.addEventListener('scroll', () => {
            this.hideAllTooltips();
        });
    }
    
    /**
     * Cleanup tooltips
     */
    destroy() {
        this.tooltips.forEach((tooltip) => {
            tooltip.element.remove();
        });
        
        const helpButton = document.getElementById('sentia-help-button');
        if (helpButton) helpButton.remove();
        
        const feedbackModal = document.getElementById('sentia-feedback-modal');
        if (feedbackModal) feedbackModal.remove();
    }
}

// Initialize help widget when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.helpWidget = new SentiaHelpWidget();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SentiaHelpWidget;
}