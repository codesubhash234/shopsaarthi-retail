// Dark Mode Theme Toggle
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.createToggleButton();
        this.applyTheme(this.currentTheme);
        this.bindEvents();
    }

    createToggleButton() {
        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.innerHTML = this.currentTheme === 'dark' ? '☀️' : '🌙';
        button.title = 'Toggle theme';
        button.setAttribute('aria-label', 'Toggle dark/light theme');
        
        document.body.appendChild(button);
        this.toggleButton = button;
    }

    bindEvents() {
        this.toggleButton.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Keyboard accessibility
        this.toggleButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        
        // Update button icon
        this.toggleButton.innerHTML = this.currentTheme === 'dark' ? '☀️' : '🌙';
        
        // Show notification
        if (window.notifications) {
            window.notifications.info(
                `Switched to ${this.currentTheme} mode`,
                2000
            );
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'dark') {
            this.applyDarkTheme();
        } else {
            this.applyLightTheme();
        }
    }

    applyDarkTheme() {
        const style = document.createElement('style');
        style.id = 'dark-theme-styles';
        style.textContent = `
            body {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: #f0f0f0;
            }
            
            .card, .card-enhanced {
                background: rgba(30, 30, 30, 0.9) !important;
                color: #f0f0f0 !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            
            .table-enhanced {
                background: rgba(30, 30, 30, 0.9) !important;
                color: #f0f0f0 !important;
            }
            
            .table-enhanced tbody tr:hover {
                background-color: rgba(106, 17, 203, 0.2) !important;
            }
            
            .form-floating-enhanced input,
            .form-floating-enhanced textarea,
            .form-floating-enhanced select {
                background: rgba(40, 40, 40, 0.9) !important;
                color: #f0f0f0 !important;
                border-color: rgba(255, 255, 255, 0.2) !important;
            }
            
            .chart-container-enhanced {
                background: rgba(30, 30, 30, 0.9) !important;
            }
            
            .notification {
                background: rgba(40, 40, 40, 0.95) !important;
                color: #f0f0f0 !important;
            }
            
            .navbar {
                background: rgba(20, 20, 20, 0.9) !important;
            }
            
            .sidebar {
                background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%) !important;
            }
        `;
        
        // Remove existing dark theme styles
        const existing = document.getElementById('dark-theme-styles');
        if (existing) {
            existing.remove();
        }
        
        document.head.appendChild(style);
    }

    applyLightTheme() {
        const existing = document.getElementById('dark-theme-styles');
        if (existing) {
            existing.remove();
        }
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});
