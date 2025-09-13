// Global Error Handler and Validation Library
class ErrorHandler {
    static init() {
        // Global error handler for unhandled promises
        window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled promise rejection:', event.reason);
            ErrorHandler.showError('An unexpected error occurred. Please try again.');
            event.preventDefault();
        });

        // Global error handler for JavaScript errors
        window.addEventListener('error', function(event) {
            console.error('JavaScript error:', event.error);
            ErrorHandler.showError('A technical error occurred. Please refresh the page.');
        });

        // Network error detection
        window.addEventListener('online', function() {
            ErrorHandler.showSuccess('Connection restored');
        });

        window.addEventListener('offline', function() {
            ErrorHandler.showError('No internet connection. Some features may not work.');
        });
    }

    static showError(message, duration = 5000) {
        this.showNotification(message, 'danger', duration);
    }

    static showSuccess(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    }

    static showWarning(message, duration = 4000) {
        this.showNotification(message, 'warning', duration);
    }

    static showInfo(message, duration = 3000) {
        this.showNotification(message, 'info', duration);
    }

    static showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notifications of the same type
        const existing = document.querySelector(`.alert-${type}.floating-alert`);
        if (existing) {
            existing.remove();
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} floating-alert`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            min-width: 300px;
            max-width: 500px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: none;
            border-radius: 8px;
            animation: slideIn 0.3s ease-out;
        `;

        alert.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-${this.getIcon(type)} me-2"></i>
                <span class="flex-grow-1">${message}</span>
                <button type="button" class="btn-close ms-2" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        document.body.appendChild(alert);

        // Auto remove after duration
        setTimeout(() => {
            if (alert.parentElement) {
                alert.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => alert.remove(), 300);
            }
        }, duration);

        // Add CSS animations if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .floating-alert {
                    font-size: 0.9rem;
                }
                @media (max-width: 576px) {
                    .floating-alert {
                        right: 10px;
                        left: 10px;
                        min-width: auto;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    static getIcon(type) {
        const icons = {
            'success': 'check-circle-fill',
            'danger': 'exclamation-triangle-fill',
            'warning': 'exclamation-circle-fill',
            'info': 'info-circle-fill'
        };
        return icons[type] || 'info-circle-fill';
    }

    // Form validation helpers
    static validateForm(formElement) {
        const errors = [];
        const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                errors.push(`${this.getFieldLabel(input)} is required`);
                this.highlightField(input, true);
            } else {
                this.highlightField(input, false);
            }

            // Specific validations
            if (input.type === 'email' && input.value && !this.isValidEmail(input.value)) {
                errors.push(`Please enter a valid email address`);
                this.highlightField(input, true);
            }

            if (input.type === 'number' && input.value) {
                const min = parseFloat(input.min);
                const max = parseFloat(input.max);
                const value = parseFloat(input.value);

                if (!isNaN(min) && value < min) {
                    errors.push(`${this.getFieldLabel(input)} must be at least ${min}`);
                    this.highlightField(input, true);
                }

                if (!isNaN(max) && value > max) {
                    errors.push(`${this.getFieldLabel(input)} must be at most ${max}`);
                    this.highlightField(input, true);
                }
            }
        });

        return errors;
    }

    static getFieldLabel(input) {
        const label = input.closest('.form-group')?.querySelector('label') || 
                     document.querySelector(`label[for="${input.id}"]`);
        return label?.textContent?.replace('*', '').trim() || input.name || 'Field';
    }

    static highlightField(input, hasError) {
        input.classList.toggle('is-invalid', hasError);
        input.classList.toggle('is-valid', !hasError && input.value.trim());
    }

    static isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // API call wrapper with error handling
    static async apiCall(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success === false) {
                throw new Error(data.message || 'Operation failed');
            }

            return data;
        } catch (error) {
            console.error('API call failed:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showError('Network error. Please check your connection.');
            } else {
                this.showError(error.message || 'An error occurred');
            }
            
            throw error;
        }
    }

    // Loading state management
    static showLoading(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;

        element.disabled = true;
        element.dataset.originalText = element.textContent;
        element.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            ${text}
        `;
    }

    static hideLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;

        element.disabled = false;
        element.textContent = element.dataset.originalText || 'Submit';
        delete element.dataset.originalText;
    }

    // Confirmation dialogs
    static async confirm(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger confirm-btn">Confirm</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            
            modal.querySelector('.confirm-btn').onclick = () => {
                bsModal.hide();
                resolve(true);
            };

            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                resolve(false);
            });

            bsModal.show();
        });
    }
}

// Initialize error handler when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    ErrorHandler.init();
});

// Export for global use
window.ErrorHandler = ErrorHandler;
