// Enhanced Notification System
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = this.createContainer();
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Auto remove after duration
        setTimeout(() => {
            this.remove(notification);
        }, duration);

        // Add click to dismiss
        notification.addEventListener('click', () => {
            this.remove(notification);
        });

        return notification;
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem; font-weight: bold;">${icons[type] || icons.info}</span>
                <span style="flex: 1;">${message}</span>
                <button style="background: none; border: none; font-size: 1.2rem; cursor: pointer; opacity: 0.7;" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        return notification;
    }

    remove(notification) {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 500);
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Global notification instance
window.notifications = new NotificationManager();

// Stock alert system
class StockAlertSystem {
    constructor() {
        this.checkInterval = 30000; // Check every 30 seconds
        this.lowStockThreshold = 10;
        this.init();
    }

    init() {
        this.startMonitoring();
    }

    startMonitoring() {
        setInterval(() => {
            this.checkLowStock();
        }, this.checkInterval);
    }

    async checkLowStock() {
        try {
            const response = await fetch('/api/low-stock-check');
            if (!response.ok) {
                console.warn('Low stock check endpoint not available');
                return;
            }
            
            const data = await response.json();
            
            if (data.lowStockItems && data.lowStockItems.length > 0) {
                data.lowStockItems.forEach(item => {
                    window.notifications.warning(
                        `Low stock alert: ${item.name} (${item.current_stock} remaining)`,
                        8000
                    );
                });
            }
        } catch (error) {
            console.error('Error checking stock levels:', error);
        }
    }
}

// Initialize stock alerts
document.addEventListener('DOMContentLoaded', () => {
    new StockAlertSystem();
});
