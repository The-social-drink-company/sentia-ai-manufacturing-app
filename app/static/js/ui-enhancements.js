/**
 * UI Enhancement JavaScript
 * Modern interactions, accessibility features, and error handling
 */

class UIEnhancements {
    constructor() {
        this.initializeComponents();
        this.setupEventListeners();
        this.setupAccessibility();
        this.setupErrorHandling();
        this.toastContainer = this.createToastContainer();
    }

    initializeComponents() {
        this.setupLoadingStates();
        this.setupFormEnhancements();
        this.setupTableEnhancements();
        this.setupTooltips();
        this.setupModals();
    }

    setupEventListeners() {
        // Global loading state for AJAX requests
        $(document).ajaxStart(() => this.showGlobalLoading());
        $(document).ajaxStop(() => this.hideGlobalLoading());

        // Form submission with loading states
        $('form[data-async="true"]').on('submit', this.handleAsyncFormSubmit.bind(this));

        // Retry buttons
        $(document).on('click', '.retry-button', this.handleRetryClick.bind(this));

        // Auto-save forms
        $('form[data-autosave="true"]').on('input change', this.debounce(this.handleAutoSave.bind(this), 1000));

        // Infinite scroll
        this.setupInfiniteScroll();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupAccessibility() {
        // Add skip links
        this.addSkipLinks();

        // Enhance focus management
        this.setupFocusManagement();

        // ARIA live regions
        this.setupLiveRegions();

        // Keyboard navigation
        this.setupKeyboardNavigation();

        // Screen reader announcements
        this.setupScreenReaderAnnouncements();
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

        // Network error detection
        this.setupNetworkErrorDetection();

        // Form validation errors
        this.setupFormValidationErrors();
    }

    // ============================================
    // LOADING STATES
    // ============================================

    showLoading(element, options = {}) {
        const target = $(element);
        if (target.length === 0) return;

        const overlay = $(`
            <div class="loading-overlay" role="status" aria-label="Loading">
                <div class="loading-spinner"></div>
                ${options.message ? `<div class="mt-2">${options.message}</div>` : ''}
                <span class="sr-only">Loading...</span>
            </div>
        `);

        target.css('position', 'relative').append(overlay);
        
        // Animate in
        setTimeout(() => overlay.addClass('show'), 10);

        // Auto-hide after timeout
        if (options.timeout) {
            setTimeout(() => this.hideLoading(element), options.timeout);
        }
    }

    hideLoading(element) {
        const target = $(element);
        const overlay = target.find('.loading-overlay');
        
        overlay.removeClass('show');
        setTimeout(() => overlay.remove(), 300);
    }

    showGlobalLoading() {
        if ($('#global-loading').length === 0) {
            $('body').append(`
                <div id="global-loading" class="loading-overlay show" style="position: fixed; z-index: 9999;">
                    <div class="loading-spinner"></div>
                </div>
            `);
        }
    }

    hideGlobalLoading() {
        $('#global-loading').remove();
    }

    createSkeleton(element, config = {}) {
        const target = $(element);
        const skeletonHtml = this.generateSkeletonHTML(config);
        
        target.html(skeletonHtml);
    }

    generateSkeletonHTML(config) {
        const { rows = 3, hasAvatar = false, hasImage = false } = config;
        
        let html = '';
        
        for (let i = 0; i < rows; i++) {
            html += '<div class="skeleton-loader skeleton-text mb-2"></div>';
        }
        
        if (hasAvatar) {
            html = `<div class="skeleton-loader skeleton-avatar mb-3"></div>` + html;
        }
        
        if (hasImage) {
            html = `<div class="skeleton-loader skeleton-card mb-3"></div>` + html;
        }
        
        return html;
    }

    // ============================================
    // FORM ENHANCEMENTS
    // ============================================

    setupFormEnhancements() {
        // Floating labels
        $('.form-floating .form-control').on('focus blur', function() {
            const $this = $(this);
            const $label = $this.siblings('label');
            
            if ($this.val() !== '' || $this.is(':focus')) {
                $label.addClass('active');
            } else {
                $label.removeClass('active');
            }
        });

        // File upload drag and drop
        this.setupFileUpload();

        // Form validation
        this.setupFormValidation();

        // Character counters
        this.setupCharacterCounters();
    }

    setupFileUpload() {
        $('.file-upload-area').on('dragover dragenter', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass('dragover');
        });

        $('.file-upload-area').on('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('dragover');
        });

        $('.file-upload-area').on('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('dragover');

            const files = e.originalEvent.dataTransfer.files;
            const input = $(this).find('input[type="file"]')[0];
            input.files = files;
            
            // Trigger change event
            $(input).trigger('change');
        });
    }

    setupFormValidation() {
        $('form[data-validate="true"]').on('submit', function(e) {
            const form = this;
            let isValid = true;

            // Clear previous errors
            $(form).find('.is-invalid').removeClass('is-invalid');
            $(form).find('.invalid-feedback').remove();

            // Validate required fields
            $(form).find('[required]').each(function() {
                if (!this.value.trim()) {
                    isValid = false;
                    $(this).addClass('is-invalid');
                    $(this).after(`<div class="invalid-feedback">This field is required.</div>`);
                }
            });

            // Validate email fields
            $(form).find('input[type="email"]').each(function() {
                if (this.value && !this.checkValidity()) {
                    isValid = false;
                    $(this).addClass('is-invalid');
                    $(this).after(`<div class="invalid-feedback">Please enter a valid email address.</div>`);
                }
            });

            if (!isValid) {
                e.preventDefault();
                // Focus first invalid field
                $(form).find('.is-invalid').first().focus();
            }

            return isValid;
        });
    }

    setupCharacterCounters() {
        $('textarea[data-max-length]').each(function() {
            const $textarea = $(this);
            const maxLength = parseInt($textarea.data('max-length'));
            
            const $counter = $('<div class="character-counter text-muted small mt-1"></div>');
            $textarea.after($counter);
            
            const updateCounter = () => {
                const currentLength = $textarea.val().length;
                const remaining = maxLength - currentLength;
                
                $counter.text(`${currentLength}/${maxLength} characters`);
                
                if (remaining < 0) {
                    $counter.addClass('text-danger').removeClass('text-muted');
                    $textarea.addClass('is-invalid');
                } else {
                    $counter.removeClass('text-danger').addClass('text-muted');
                    $textarea.removeClass('is-invalid');
                }
            };
            
            $textarea.on('input', updateCounter);
            updateCounter(); // Initial update
        });
    }

    handleAsyncFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const $form = $(form);
        const submitButton = $form.find('[type="submit"]');
        
        // Show loading state
        submitButton.prop('disabled', true).addClass('loading');
        
        const formData = new FormData(form);
        
        fetch(form.action, {
            method: form.method,
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showToast('Success!', data.message || 'Operation completed successfully', 'success');
                if (data.redirect) {
                    setTimeout(() => window.location.href = data.redirect, 1500);
                }
            } else {
                this.showToast('Error', data.message || 'An error occurred', 'error');
            }
        })
        .catch(error => {
            this.showToast('Error', 'Network error occurred', 'error');
        })
        .finally(() => {
            submitButton.prop('disabled', false).removeClass('loading');
        });
    }

    handleAutoSave(e) {
        const form = e.target.closest('form');
        const formData = new FormData(form);
        
        fetch(form.dataset.autosaveUrl || form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Auto-Save': 'true'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showAutoSaveIndicator('Saved');
            }
        })
        .catch(() => {
            this.showAutoSaveIndicator('Error saving', 'error');
        });
    }

    showAutoSaveIndicator(message, type = 'success') {
        const indicator = $('#autosave-indicator');
        if (indicator.length === 0) {
            $('body').append(`
                <div id="autosave-indicator" class="position-fixed" style="top: 20px; left: 20px; z-index: 1000;">
                    <div class="badge bg-${type === 'error' ? 'danger' : 'success'}">${message}</div>
                </div>
            `);
        } else {
            indicator.find('.badge').removeClass('bg-success bg-danger')
                    .addClass(`bg-${type === 'error' ? 'danger' : 'success'}`)
                    .text(message);
        }
        
        setTimeout(() => indicator.fadeOut(), 2000);
    }

    // ============================================
    // TABLE ENHANCEMENTS
    // ============================================

    setupTableEnhancements() {
        // Sortable columns
        $('.table-sortable th[data-sort]').addClass('cursor-pointer').on('click', this.handleTableSort.bind(this));
        
        // Row selection
        $('.table-selectable').on('change', 'input[type="checkbox"]', this.handleRowSelection.bind(this));
        
        // Bulk actions
        $('.bulk-action-btn').on('click', this.handleBulkAction.bind(this));
    }

    handleTableSort(e) {
        const $th = $(e.currentTarget);
        const table = $th.closest('table');
        const sortKey = $th.data('sort');
        const currentOrder = $th.data('order') || 'asc';
        const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        
        // Update UI
        table.find('th').removeClass('sort-asc sort-desc');
        $th.addClass(`sort-${newOrder}`).data('order', newOrder);
        
        // Trigger sort event
        table.trigger('sort', { key: sortKey, order: newOrder });
    }

    handleRowSelection(e) {
        const checkbox = e.target;
        const table = $(checkbox).closest('table');
        const isHeaderCheckbox = $(checkbox).closest('thead').length > 0;
        
        if (isHeaderCheckbox) {
            // Select/deselect all rows
            table.find('tbody input[type="checkbox"]').prop('checked', checkbox.checked);
        }
        
        // Update bulk action buttons
        const selectedRows = table.find('tbody input[type="checkbox"]:checked').length;
        $('.bulk-action-controls').toggle(selectedRows > 0);
        $('.selected-count').text(selectedRows);
    }

    handleBulkAction(e) {
        const button = e.target;
        const action = $(button).data('action');
        const selectedIds = [];
        
        $('table input[type="checkbox"]:checked').each(function() {
            const id = $(this).val();
            if (id) selectedIds.push(id);
        });
        
        if (selectedIds.length === 0) {
            this.showToast('Warning', 'Please select items first', 'warning');
            return;
        }
        
        // Confirm destructive actions
        if (action === 'delete') {
            if (!confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) {
                return;
            }
        }
        
        // Execute bulk action
        fetch('/api/bulk-action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                ids: selectedIds
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showToast('Success', `${action} completed for ${selectedIds.length} items`, 'success');
                // Refresh table or remove selected rows
                location.reload();
            } else {
                this.showToast('Error', data.message || 'Bulk action failed', 'error');
            }
        });
    }

    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================

    createToastContainer() {
        if ($('#toast-container').length === 0) {
            $('body').append('<div id="toast-container" class="toast-container"></div>');
        }
        return $('#toast-container');
    }

    showToast(title, message, type = 'info', options = {}) {
        const id = 'toast-' + Date.now();
        const autoHide = options.autoHide !== false;
        const delay = options.delay || 5000;
        
        const toast = $(`
            <div id="${id}" class="toast toast-${type}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">${title}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">${message}</div>
            </div>
        `);
        
        this.toastContainer.append(toast);
        
        // Initialize Bootstrap toast
        const bsToast = new bootstrap.Toast(toast[0], {
            autohide: autoHide,
            delay: delay
        });
        
        bsToast.show();
        
        // Remove from DOM after hide
        toast.on('hidden.bs.toast', function() {
            $(this).remove();
        });
        
        return id;
    }

    hideToast(toastId) {
        const toast = $(`#${toastId}`);
        if (toast.length > 0) {
            const bsToast = bootstrap.Toast.getInstance(toast[0]);
            if (bsToast) {
                bsToast.hide();
            }
        }
    }

    // ============================================
    // ERROR HANDLING
    // ============================================

    handleGlobalError(event) {
        console.error('Global error:', event.error);
        
        // Don't show toast for every error, only critical ones
        if (event.error.name === 'ChunkLoadError' || event.message.includes('Loading chunk')) {
            this.showToast('Error', 'Failed to load application resources. Please refresh the page.', 'error', { autoHide: false });
        }
    }

    handleUnhandledRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Handle specific promise rejections
        if (event.reason && event.reason.name === 'NetworkError') {
            this.showNetworkError();
        }
    }

    setupNetworkErrorDetection() {
        let isOnline = navigator.onLine;
        
        window.addEventListener('online', () => {
            if (!isOnline) {
                this.showToast('Connection Restored', 'You are back online!', 'success');
                isOnline = true;
            }
        });
        
        window.addEventListener('offline', () => {
            this.showToast('Connection Lost', 'You are currently offline. Some features may not work.', 'warning', { autoHide: false });
            isOnline = false;
        });
    }

    showNetworkError() {
        this.showToast('Network Error', 'Unable to connect to the server. Please check your connection.', 'error', { autoHide: false });
    }

    setupFormValidationErrors() {
        $(document).on('submit', 'form', function(e) {
            const form = this;
            
            // Clear previous error states
            $(form).find('.is-invalid').removeClass('is-invalid');
            $(form).find('.invalid-feedback').remove();
        });
        
        // Handle server validation errors
        $(document).on('ajaxError', function(event, xhr, settings) {
            if (xhr.responseJSON && xhr.responseJSON.errors) {
                const errors = xhr.responseJSON.errors;
                
                Object.keys(errors).forEach(fieldName => {
                    const field = $(`[name="${fieldName}"]`);
                    if (field.length > 0) {
                        field.addClass('is-invalid');
                        field.after(`<div class="invalid-feedback">${errors[fieldName]}</div>`);
                    }
                });
            }
        });
    }

    handleRetryClick(e) {
        const button = $(e.target);
        button.addClass('retrying').prop('disabled', true);
        
        setTimeout(() => {
            location.reload();
        }, 1000);
    }

    // ============================================
    // ACCESSIBILITY FEATURES
    // ============================================

    addSkipLinks() {
        if ($('.skip-link').length === 0) {
            $('body').prepend(`
                <a href="#main-content" class="skip-link">Skip to main content</a>
                <a href="#navigation" class="skip-link">Skip to navigation</a>
            `);
        }
    }

    setupFocusManagement() {
        // Trap focus in modals
        $('.modal').on('shown.bs.modal', function() {
            const modal = this;
            const focusableElements = $(modal).find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstFocusable = focusableElements.first();
            const lastFocusable = focusableElements.last();
            
            firstFocusable.focus();
            
            $(modal).on('keydown', function(e) {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstFocusable[0]) {
                            e.preventDefault();
                            lastFocusable.focus();
                        }
                    } else {
                        if (document.activeElement === lastFocusable[0]) {
                            e.preventDefault();
                            firstFocusable.focus();
                        }
                    }
                }
            });
        });
    }

    setupLiveRegions() {
        if ($('#aria-live-region').length === 0) {
            $('body').append(`
                <div id="aria-live-region" class="sr-only" aria-live="polite" aria-atomic="true"></div>
                <div id="aria-live-region-assertive" class="sr-only" aria-live="assertive" aria-atomic="true"></div>
            `);
        }
    }

    announceToScreenReader(message, assertive = false) {
        const regionId = assertive ? '#aria-live-region-assertive' : '#aria-live-region';
        const region = $(regionId);
        
        region.text(message);
        
        // Clear after a delay
        setTimeout(() => region.text(''), 1000);
    }

    setupKeyboardNavigation() {
        // Arrow key navigation for menus
        $('.dropdown-menu').on('keydown', this.handleDropdownKeyNav.bind(this));
        
        // Tab panels
        $('[role="tabpanel"]').on('keydown', this.handleTabPanelKeyNav.bind(this));
    }

    handleDropdownKeyNav(e) {
        const items = $(e.currentTarget).find('.dropdown-item:visible');
        const currentIndex = items.index(document.activeElement);
        let nextIndex;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                items.eq(nextIndex).focus();
                break;
            case 'ArrowUp':
                e.preventDefault();
                nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                items.eq(nextIndex).focus();
                break;
            case 'Escape':
                e.preventDefault();
                $(e.currentTarget).closest('.dropdown').find('[data-bs-toggle="dropdown"]').focus();
                bootstrap.Dropdown.getInstance(e.currentTarget).hide();
                break;
        }
    }

    setupScreenReaderAnnouncements() {
        // Announce page changes
        if ('navigation' in window.performance && performance.navigation.type === 1) {
            // Page was refreshed
            this.announceToScreenReader('Page refreshed');
        }
        
        // Announce form errors
        $(document).on('invalid', 'input, select, textarea', function() {
            const field = this;
            const fieldName = field.getAttribute('aria-label') || field.name || 'Field';
            uiEnhancements.announceToScreenReader(`${fieldName} has an error: ${field.validationMessage}`, true);
        });
    }

    setupKeyboardShortcuts() {
        $(document).on('keydown', (e) => {
            // Alt + M: Main menu
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                $('.navbar-nav .nav-link').first().focus();
            }
            
            // Alt + S: Search
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                $('input[type="search"], input[name="search"], #search-input').first().focus();
            }
            
            // Alt + H: Help
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                $('#help-button, .help-button').first().click();
            }
        });
    }

    // ============================================
    // INFINITE SCROLL
    // ============================================

    setupInfiniteScroll() {
        const scrollContainers = $('[data-infinite-scroll="true"]');
        
        scrollContainers.each(function() {
            const container = $(this);
            const url = container.data('url');
            let page = 1;
            let loading = false;
            let hasMore = true;
            
            const loadMore = () => {
                if (loading || !hasMore) return;
                
                loading = true;
                container.append('<div class="text-center p-3 loading-more"><div class="loading-spinner"></div></div>');
                
                fetch(`${url}?page=${page + 1}`)
                    .then(response => response.json())
                    .then(data => {
                        $('.loading-more').remove();
                        
                        if (data.items && data.items.length > 0) {
                            container.append(data.html);
                            page++;
                            hasMore = data.has_more;
                        } else {
                            hasMore = false;
                        }
                    })
                    .catch(() => {
                        $('.loading-more').remove();
                    })
                    .finally(() => {
                        loading = false;
                    });
            };
            
            container.on('scroll', () => {
                const scrollTop = container.scrollTop();
                const scrollHeight = container[0].scrollHeight;
                const clientHeight = container[0].clientHeight;
                
                if (scrollTop + clientHeight >= scrollHeight - 100) {
                    loadMore();
                }
            });
        });
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    setupTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    setupModals() {
        // Auto-focus first input in modals
        $('.modal').on('shown.bs.modal', function() {
            $(this).find('input, select, textarea').filter(':visible').first().focus();
        });
        
        // Confirm before closing modals with unsaved changes
        $('.modal form').on('input change', function() {
            $(this).closest('.modal').addClass('has-changes');
        });
        
        $('.modal').on('hide.bs.modal', function(e) {
            if ($(this).hasClass('has-changes')) {
                if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
                    e.preventDefault();
                    return false;
                }
            }
        });
    }
}

// Initialize UI enhancements when DOM is ready
$(document).ready(function() {
    window.uiEnhancements = new UIEnhancements();
    
    // Add smooth scrolling
    $('a[href*="#"]:not([href="#"])').click(function() {
        if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {
            let target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
            if (target.length) {
                $('html, body').animate({
                    scrollTop: target.offset().top - 100
                }, 1000);
                return false;
            }
        }
    });
    
    // Add fade-in animation to elements as they come into view
    const observeElements = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.card, .alert, .table').forEach(el => {
            observer.observe(el);
        });
    };
    
    // Initialize intersection observer for animations
    if ('IntersectionObserver' in window) {
        observeElements();
    }
});