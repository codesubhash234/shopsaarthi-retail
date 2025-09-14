// Enhanced Data Validation and Security
class DataValidator {
    constructor() {
        this.rules = new Map();
        this.init();
    }

    init() {
        this.setupValidationRules();
        this.enhanceFormValidation();
        this.setupRealTimeValidation();
        this.addSecurityMeasures();
    }

    setupValidationRules() {
        // Product validation rules
        this.rules.set('productName', {
            required: true,
            minLength: 2,
            maxLength: 100,
            pattern: /^[a-zA-Z0-9\s\-_.,()]+$/,
            message: 'Product name must be 2-100 characters and contain only letters, numbers, and basic punctuation'
        });

        this.rules.set('barcode', {
            required: true,
            pattern: /^[0-9]{8,13}$/,
            message: 'Barcode must be 8-13 digits'
        });

        this.rules.set('price', {
            required: true,
            min: 0.01,
            max: 999999.99,
            pattern: /^\d+(\.\d{1,2})?$/,
            message: 'Price must be a valid amount between ₹0.01 and ₹999,999.99'
        });

        this.rules.set('stock', {
            required: true,
            min: 0,
            max: 999999,
            pattern: /^\d+$/,
            message: 'Stock must be a whole number between 0 and 999,999'
        });

        this.rules.set('category', {
            required: true,
            minLength: 2,
            maxLength: 50,
            message: 'Category is required and must be 2-50 characters'
        });

        // User validation rules
        this.rules.set('email', {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        });

        this.rules.set('phone', {
            pattern: /^[+]?[\d\s\-()]{10,15}$/,
            message: 'Please enter a valid phone number'
        });

        this.rules.set('password', {
            required: true,
            minLength: 8,
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
            message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
        });
    }

    enhanceFormValidation() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.enhanceForm(form);
        });
    }

    enhanceForm(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            this.enhanceInput(input);
        });

        form.addEventListener('submit', (e) => {
            if (!this.validateForm(form)) {
                e.preventDefault();
                this.showValidationSummary(form);
            }
        });
    }

    enhanceInput(input) {
        const fieldName = this.getFieldName(input);
        const rule = this.rules.get(fieldName);
        
        if (!rule) return;

        // Add validation attributes
        if (rule.required) input.required = true;
        if (rule.minLength) input.minLength = rule.minLength;
        if (rule.maxLength) input.maxLength = rule.maxLength;
        if (rule.min !== undefined) input.min = rule.min;
        if (rule.max !== undefined) input.max = rule.max;
        if (rule.pattern) input.pattern = rule.pattern.source;

        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.style.display = 'none';
        input.parentNode.appendChild(feedback);

        // Add validation indicator
        const indicator = document.createElement('div');
        indicator.className = 'validation-indicator';
        indicator.innerHTML = '<i class="bi bi-check-circle text-success" style="display: none;"></i><i class="bi bi-x-circle text-danger" style="display: none;"></i>';
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(indicator);

        // Real-time validation
        const validateInput = debounce(() => {
            this.validateInput(input, rule, feedback, indicator);
        }, 300);

        input.addEventListener('input', validateInput);
        input.addEventListener('blur', () => this.validateInput(input, rule, feedback, indicator));
    }

    getFieldName(input) {
        // Map input names/ids to validation rules
        const name = input.name || input.id || '';
        
        if (name.includes('name') && !name.includes('user')) return 'productName';
        if (name.includes('barcode')) return 'barcode';
        if (name.includes('price') || name.includes('cost')) return 'price';
        if (name.includes('stock') || name.includes('quantity')) return 'stock';
        if (name.includes('category')) return 'category';
        if (name.includes('email')) return 'email';
        if (name.includes('phone')) return 'phone';
        if (name.includes('password')) return 'password';
        
        return name;
    }

    validateInput(input, rule, feedback, indicator) {
        const value = input.value.trim();
        const errors = [];

        // Required validation
        if (rule.required && !value) {
            errors.push('This field is required');
        }

        if (value) {
            // Length validation
            if (rule.minLength && value.length < rule.minLength) {
                errors.push(`Minimum ${rule.minLength} characters required`);
            }
            if (rule.maxLength && value.length > rule.maxLength) {
                errors.push(`Maximum ${rule.maxLength} characters allowed`);
            }

            // Numeric validation
            if (rule.min !== undefined || rule.max !== undefined) {
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                    errors.push('Must be a valid number');
                } else {
                    if (rule.min !== undefined && numValue < rule.min) {
                        errors.push(`Minimum value is ${rule.min}`);
                    }
                    if (rule.max !== undefined && numValue > rule.max) {
                        errors.push(`Maximum value is ${rule.max}`);
                    }
                }
            }

            // Pattern validation
            if (rule.pattern && !rule.pattern.test(value)) {
                errors.push(rule.message || 'Invalid format');
            }
        }

        // Update UI
        if (errors.length > 0) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            feedback.textContent = errors[0];
            feedback.style.display = 'block';
            indicator.querySelector('.bi-check-circle').style.display = 'none';
            indicator.querySelector('.bi-x-circle').style.display = 'inline';
        } else if (value) {
            input.classList.add('is-valid');
            input.classList.remove('is-invalid');
            feedback.style.display = 'none';
            indicator.querySelector('.bi-check-circle').style.display = 'inline';
            indicator.querySelector('.bi-x-circle').style.display = 'none';
        } else {
            input.classList.remove('is-valid', 'is-invalid');
            feedback.style.display = 'none';
            indicator.querySelector('.bi-check-circle').style.display = 'none';
            indicator.querySelector('.bi-x-circle').style.display = 'none';
        }

        return errors.length === 0;
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            const fieldName = this.getFieldName(input);
            const rule = this.rules.get(fieldName);
            
            if (rule) {
                const feedback = input.parentNode.querySelector('.invalid-feedback');
                const indicator = input.parentNode.querySelector('.validation-indicator');
                
                if (!this.validateInput(input, rule, feedback, indicator)) {
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    showValidationSummary(form) {
        const errors = [];
        const invalidInputs = form.querySelectorAll('.is-invalid');
        
        invalidInputs.forEach(input => {
            const label = form.querySelector(`label[for="${input.id}"]`)?.textContent || input.name || 'Field';
            const feedback = input.parentNode.querySelector('.invalid-feedback');
            if (feedback) {
                errors.push(`${label}: ${feedback.textContent}`);
            }
        });

        if (errors.length > 0 && window.notifications) {
            window.notifications.error(`Please fix the following errors:\n${errors.join('\n')}`);
        }
    }

    setupRealTimeValidation() {
        // Add duplicate barcode checking
        document.addEventListener('input', (e) => {
            if (e.target.name === 'barcode' || e.target.id === 'barcode') {
                this.checkDuplicateBarcode(e.target);
            }
        });
    }

    async checkDuplicateBarcode(input) {
        const barcode = input.value.trim();
        if (barcode.length < 8) return;

        try {
            const response = await fetch(`/api/check-barcode/${barcode}`);
            const result = await response.json();
            
            if (result.exists) {
                input.classList.add('is-invalid');
                let feedback = input.parentNode.querySelector('.invalid-feedback');
                if (!feedback) {
                    feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    input.parentNode.appendChild(feedback);
                }
                feedback.textContent = 'This barcode already exists';
                feedback.style.display = 'block';
            }
        } catch (error) {
            console.error('Barcode check error:', error);
        }
    }

    addSecurityMeasures() {
        // Prevent XSS in form inputs
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.sanitizeInput(e.target);
            }
        });

        // Rate limiting for form submissions
        this.setupRateLimiting();
        
        // CSRF protection reminder
        this.ensureCSRFTokens();
    }

    sanitizeInput(input) {
        // Basic XSS prevention
        const value = input.value;
        const sanitized = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        
        if (value !== sanitized) {
            input.value = sanitized;
            if (window.notifications) {
                window.notifications.warning('Potentially harmful content was removed from your input');
            }
        }
    }

    setupRateLimiting() {
        this.submissionTimes = new Map();
        
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const now = Date.now();
            const lastSubmission = this.submissionTimes.get(form) || 0;
            
            if (now - lastSubmission < 1000) { // 1 second rate limit
                e.preventDefault();
                if (window.notifications) {
                    window.notifications.warning('Please wait before submitting again');
                }
                return;
            }
            
            this.submissionTimes.set(form, now);
        });
    }

    ensureCSRFTokens() {
        const forms = document.querySelectorAll('form[method="post"], form[method="POST"]');
        forms.forEach(form => {
            if (!form.querySelector('input[name="csrf_token"]')) {
                console.warn('Form missing CSRF token:', form);
            }
        });
    }

    // Public method to validate specific field
    validateField(fieldName, value) {
        const rule = this.rules.get(fieldName);
        if (!rule) return { valid: true };

        const errors = [];
        
        if (rule.required && !value.trim()) {
            errors.push('This field is required');
        }

        if (value.trim()) {
            if (rule.pattern && !rule.pattern.test(value)) {
                errors.push(rule.message || 'Invalid format');
            }
            
            if (rule.minLength && value.length < rule.minLength) {
                errors.push(`Minimum ${rule.minLength} characters required`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Utility function for input formatting
class InputFormatter {
    static formatCurrency(input) {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^\d.]/g, '');
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            if (parts[1] && parts[1].length > 2) {
                value = parts[0] + '.' + parts[1].substring(0, 2);
            }
            e.target.value = value;
        });
    }

    static formatPhone(input) {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 10) {
                value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
            }
            e.target.value = value;
        });
    }

    static formatBarcode(input) {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

// Initialize validation system
document.addEventListener('DOMContentLoaded', () => {
    window.dataValidator = new DataValidator();
    
    // Apply formatters to specific inputs
    document.querySelectorAll('input[name*="price"], input[name*="cost"]').forEach(input => {
        InputFormatter.formatCurrency(input);
    });
    
    document.querySelectorAll('input[name*="phone"]').forEach(input => {
        InputFormatter.formatPhone(input);
    });
    
    document.querySelectorAll('input[name*="barcode"]').forEach(input => {
        InputFormatter.formatBarcode(input);
    });
});
