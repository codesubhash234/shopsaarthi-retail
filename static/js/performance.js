// Performance Optimization and Loading Enhancements
class PerformanceManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupCaching();
        this.setupLoadingStates();
    }

    // Lazy loading for images and charts
    setupLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    if (element.dataset.src) {
                        element.src = element.dataset.src;
                        element.removeAttribute('data-src');
                    }
                    
                    if (element.classList.contains('lazy-chart')) {
                        this.loadChart(element);
                    }
                    
                    observer.unobserve(element);
                }
            });
        });

        // Observe all lazy elements
        document.querySelectorAll('[data-src], .lazy-chart').forEach(el => {
            observer.observe(el);
        });
    }

    loadChart(element) {
        element.classList.remove('skeleton');
        // Trigger chart initialization
        const event = new CustomEvent('chartLoad', { detail: { element } });
        document.dispatchEvent(event);
    }

    // Image optimization
    setupImageOptimization() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.loading = 'lazy';
            img.decoding = 'async';
        });
    }

    // Simple caching mechanism
    setupCaching() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async fetchWithCache(url, options = {}) {
        const cacheKey = url + JSON.stringify(options);
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    // Loading states management
    setupLoadingStates() {
        this.loadingElements = new Set();
    }

    showLoading(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;

        this.loadingElements.add(element);
        
        const loadingHTML = `
            <div class="loading-state" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                min-height: 200px;
            ">
                <div class="loading-spinner"></div>
                <p style="margin-top: 1rem; color: #666;">${text}</p>
            </div>
        `;
        
        element.innerHTML = loadingHTML;
    }

    hideLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;

        this.loadingElements.delete(element);
        
        const loadingState = element.querySelector('.loading-state');
        if (loadingState) {
            loadingState.remove();
        }
    }

    // Skeleton loading for better UX
    createSkeleton(element, type = 'card') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;

        let skeletonHTML = '';
        
        switch (type) {
            case 'card':
                skeletonHTML = `
                    <div class="skeleton skeleton-card"></div>
                `;
                break;
            case 'text':
                skeletonHTML = `
                    <div class="skeleton skeleton-text" style="width: 80%;"></div>
                    <div class="skeleton skeleton-text" style="width: 60%;"></div>
                    <div class="skeleton skeleton-text" style="width: 90%;"></div>
                `;
                break;
            case 'table':
                skeletonHTML = `
                    <div class="skeleton" style="height: 3rem; margin-bottom: 0.5rem;"></div>
                    <div class="skeleton" style="height: 2rem; margin-bottom: 0.5rem;"></div>
                    <div class="skeleton" style="height: 2rem; margin-bottom: 0.5rem;"></div>
                    <div class="skeleton" style="height: 2rem; margin-bottom: 0.5rem;"></div>
                `;
                break;
        }
        
        element.innerHTML = skeletonHTML;
    }
}

// Debounce utility for performance
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle utility for performance
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Global performance manager
window.performanceManager = new PerformanceManager();

// Enhanced form handling with loading states
class FormEnhancer {
    constructor() {
        this.init();
    }

    init() {
        this.enhanceForms();
    }

    enhanceForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.enhanceForm(form);
        });
    }

    enhanceForm(form) {
        // Skip enhancement for login and register forms to allow normal redirects
        if (form.action && (form.action.includes('/login') || form.action.includes('/register'))) {
            return;
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            const originalText = submitBtn.textContent || submitBtn.value;
            
            // Show loading state
            this.setButtonLoading(submitBtn, true);
            
            try {
                const formData = new FormData(form);
                const response = await fetch(form.action || window.location.href, {
                    method: form.method || 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    if (window.notifications) {
                        window.notifications.success('Form submitted successfully!');
                    }
                    
                    // Reset form if successful
                    form.reset();
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                if (window.notifications) {
                    window.notifications.error('Form submission failed. Please try again.');
                }
            } finally {
                this.setButtonLoading(submitBtn, false, originalText);
            }
        });
    }

    setButtonLoading(button, loading, originalText = '') {
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<span class="loading-spinner" style="width: 20px; height: 20px; margin-right: 0.5rem;"></span>Loading...';
        } else {
            button.disabled = false;
            button.textContent = originalText || 'Submit';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FormEnhancer();
    
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
