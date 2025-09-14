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
            z-index: 999999;
            max-width: 400px;
            pointer-events: none;
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
                <button style="background: none; border: none; font-size: 1.2rem; cursor: pointer; opacity: 0.7; pointer-events: auto;" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Make individual notifications clickable
        notification.style.pointerEvents = 'auto';

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

// Show success notification for product operations
window.showProductSuccess = function(message) {
    window.notifications.success(message, 5000);
};

// Stock alert system
class StockAlertSystem {
    constructor() {
        this.checkInterval = 1800000; // Check every 30 minutes (much less frequent)
        this.lowStockThreshold = 10;
        this.notifiedItems = new Set(); // Track already notified items
        this.lastNotificationTime = new Map(); // Track last notification time per item
        this.notificationCooldown = 3600000; // 1 hour cooldown per item
        this.init();
    }

    init() {
        // Only start monitoring if user has enabled stock alerts
        if (this.shouldMonitor()) {
            this.startMonitoring();
        }
    }

    shouldMonitor() {
        // Check if we're on a page where stock monitoring makes sense
        const currentPath = window.location.pathname;
        const monitoringPages = ['/dashboard', '/products', '/stock', '/billing'];
        return monitoringPages.some(page => currentPath.includes(page));
    }

    startMonitoring() {
        // Initial check after 2 minutes to avoid immediate popups
        setTimeout(() => {
            this.checkLowStock();
        }, 120000);

        // Then check every 30 minutes
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
                const currentTime = Date.now();
                
                data.lowStockItems.forEach(item => {
                    const itemKey = `${item.id}-${item.current_stock}`;
                    const lastNotified = this.lastNotificationTime.get(item.id);
                    
                    // Only show notification if:
                    // 1. Item hasn't been notified before, OR
                    // 2. Cooldown period has passed, OR
                    // 3. Stock level has decreased since last notification
                    if (!lastNotified || 
                        (currentTime - lastNotified > this.notificationCooldown) ||
                        !this.notifiedItems.has(itemKey)) {
                        
                        window.notifications.warning(
                            `Low stock alert: ${item.name} (${item.current_stock} remaining)`,
                            8000
                        );
                        
                        // Update tracking
                        this.notifiedItems.add(itemKey);
                        this.lastNotificationTime.set(item.id, currentTime);
                        
                        // Clean up old notifications for this item
                        this.cleanupOldNotifications(item.id);
                    }
                });
            }
        } catch (error) {
            console.error('Error checking stock levels:', error);
        }
    }

    cleanupOldNotifications(itemId) {
        // Remove old notification keys for this item to prevent memory bloat
        const keysToRemove = [];
        this.notifiedItems.forEach(key => {
            if (key.startsWith(`${itemId}-`)) {
                keysToRemove.push(key);
            }
        });
        
        // Keep only the most recent notification key
        if (keysToRemove.length > 1) {
            keysToRemove.slice(0, -1).forEach(key => {
                this.notifiedItems.delete(key);
            });
        }
    }
}

// Initialize stock alerts
document.addEventListener('DOMContentLoaded', () => {
    new StockAlertSystem();
});
