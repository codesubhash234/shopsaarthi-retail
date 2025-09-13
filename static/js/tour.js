// Simple Tour Library for User Onboarding
class SimpleTour {
    constructor(steps) {
        this.steps = steps;
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.tooltip = null;
        this.init();
    }

    init() {
        this.createOverlay();
        this.createTooltip();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            display: none;
        `;
        document.body.appendChild(this.overlay);
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tour-tooltip';
        this.tooltip.style.cssText = `
            position: fixed;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            max-width: 300px;
            display: none;
        `;
        document.body.appendChild(this.tooltip);
    }

    start() {
        if (this.steps.length === 0) return;
        
        this.isActive = true;
        this.currentStep = 0;
        this.showStep();
    }

    showStep() {
        if (this.currentStep >= this.steps.length) {
            this.end();
            return;
        }

        const step = this.steps[this.currentStep];
        const element = document.querySelector(step.element);

        if (!element) {
            this.nextStep();
            return;
        }

        // Show overlay
        this.overlay.style.display = 'block';

        // Highlight element
        this.highlightElement(element);

        // Position and show tooltip
        this.showTooltip(step, element);

        // Handle clicks outside
        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) {
                this.nextStep();
            }
        };
    }

    highlightElement(element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // Create highlight
        const highlight = document.createElement('div');
        highlight.className = 'tour-highlight';
        highlight.style.cssText = `
            position: absolute;
            top: ${rect.top + scrollTop - 4}px;
            left: ${rect.left + scrollLeft - 4}px;
            width: ${rect.width + 8}px;
            height: ${rect.height + 8}px;
            border: 2px solid #007bff;
            border-radius: 4px;
            z-index: 9999;
            pointer-events: none;
            box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.3);
        `;

        // Remove previous highlight
        const existingHighlight = document.querySelector('.tour-highlight');
        if (existingHighlight) {
            existingHighlight.remove();
        }

        document.body.appendChild(highlight);

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showTooltip(step, element) {
        const rect = element.getBoundingClientRect();
        
        this.tooltip.innerHTML = `
            <div class="tour-content">
                <h6 class="tour-title">${step.title}</h6>
                <p class="tour-description">${step.content}</p>
                <div class="tour-actions mt-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${this.currentStep + 1} of ${this.steps.length}</small>
                        <div>
                            ${this.currentStep > 0 ? '<button class="btn btn-sm btn-outline-secondary me-2" onclick="tour.prevStep()">Previous</button>' : ''}
                            <button class="btn btn-sm btn-secondary me-2" onclick="tour.end()">Skip Tour</button>
                            <button class="btn btn-sm btn-primary" onclick="tour.nextStep()">
                                ${this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Position tooltip
        let top = rect.bottom + 10;
        let left = rect.left;

        // Adjust if tooltip goes off screen
        if (left + 300 > window.innerWidth) {
            left = window.innerWidth - 320;
        }
        if (top + 200 > window.innerHeight) {
            top = rect.top - 210;
        }

        this.tooltip.style.top = top + 'px';
        this.tooltip.style.left = left + 'px';
        this.tooltip.style.display = 'block';
    }

    nextStep() {
        this.currentStep++;
        this.showStep();
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep();
        }
    }

    end() {
        this.isActive = false;
        this.overlay.style.display = 'none';
        this.tooltip.style.display = 'none';
        
        // Remove highlight
        const highlight = document.querySelector('.tour-highlight');
        if (highlight) {
            highlight.remove();
        }

        // Mark tour as completed
        localStorage.setItem('tour_completed', 'true');
    }

    static shouldShowTour() {
        return !localStorage.getItem('tour_completed');
    }
}

// Dashboard Tour Steps
const dashboardTourSteps = [
    {
        element: '.navbar-brand',
        title: 'Welcome to Your Retail Manager!',
        content: 'This is your complete retail management system. Let\'s take a quick tour to get you started.'
    },
    {
        element: '[href="/dashboard"]',
        title: 'Dashboard',
        content: 'Your main dashboard shows today\'s sales, profit, and key metrics at a glance.'
    },
    {
        element: '[href="/products"]',
        title: 'Product Management',
        content: 'Manage your inventory, add new products, and track stock levels here.'
    },
    {
        element: '[href="/billing"]',
        title: 'Billing System',
        content: 'Create bills, scan barcodes, and process payments for your customers.'
    },
    {
        element: '[href="/analytics"]',
        title: 'Analytics & Reports',
        content: 'View detailed analytics, charts, and reports about your business performance.'
    },
    {
        element: '[href="/stock"]',
        title: 'Stock Management',
        content: 'Monitor inventory levels, adjust stock, and track stock movements.'
    },
    {
        element: '.quick-actions',
        title: 'Quick Actions',
        content: 'Use these quick action buttons to scan barcodes and access frequently used features.'
    },
    {
        element: '.kpi-cards',
        title: 'Key Performance Indicators',
        content: 'Monitor your daily sales, profit, bills, and low stock items in real-time.'
    }
];

// Initialize tour
let tour = null;

// Auto-start tour for new users
document.addEventListener('DOMContentLoaded', function() {
    // Only show tour on dashboard and if not completed
    if (window.location.pathname === '/dashboard' && SimpleTour.shouldShowTour()) {
        setTimeout(() => {
            if (confirm('Welcome! Would you like to take a quick tour of your retail management system?')) {
                tour = new SimpleTour(dashboardTourSteps);
                tour.start();
            } else {
                localStorage.setItem('tour_completed', 'true');
            }
        }, 1000);
    }
});

// Function to manually start tour
function startTour() {
    tour = new SimpleTour(dashboardTourSteps);
    tour.start();
}

// Function to reset tour
function resetTour() {
    localStorage.removeItem('tour_completed');
    location.reload();
}
