// Keyboard Shortcuts for Power Users
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.init();
    }

    init() {
        this.registerShortcuts();
        this.setupEventListeners();
        this.createHelpModal();
    }

    registerShortcuts() {
        // Navigation shortcuts
        this.shortcuts.set('Alt+D', () => this.navigateTo('/dashboard'));
        this.shortcuts.set('Alt+P', () => this.navigateTo('/products'));
        this.shortcuts.set('Alt+B', () => this.navigateTo('/billing'));
        this.shortcuts.set('Alt+S', () => this.navigateTo('/stock'));
        this.shortcuts.set('Alt+A', () => this.navigateTo('/analytics'));
        
        // Action shortcuts
        this.shortcuts.set('Ctrl+N', () => this.newProduct());
        this.shortcuts.set('Ctrl+F', () => this.focusSearch());
        this.shortcuts.set('Ctrl+E', () => this.exportData());
        this.shortcuts.set('Escape', () => this.closeModals());
        this.shortcuts.set('F1', () => this.showHelp());
        
        // Billing shortcuts
        this.shortcuts.set('F2', () => this.focusBarcodeInput());
        this.shortcuts.set('F3', () => this.completeBill());
        this.shortcuts.set('F4', () => this.holdBill());
        
        // Quick amounts
        this.shortcuts.set('Ctrl+1', () => this.addQuickAmount(10));
        this.shortcuts.set('Ctrl+2', () => this.addQuickAmount(20));
        this.shortcuts.set('Ctrl+3', () => this.addQuickAmount(50));
        this.shortcuts.set('Ctrl+4', () => this.addQuickAmount(100));
        this.shortcuts.set('Ctrl+5', () => this.addQuickAmount(500));
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                // Exception for Escape key
                if (e.key === 'Escape') {
                    this.closeModals();
                }
                return;
            }

            const shortcut = this.getShortcutString(e);
            const action = this.shortcuts.get(shortcut);
            
            if (action) {
                e.preventDefault();
                action();
                this.showShortcutFeedback(shortcut);
            }
        });
    }

    getShortcutString(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        
        if (e.key === 'Escape') return 'Escape';
        if (e.key === 'F1') return 'F1';
        if (e.key === 'F2') return 'F2';
        if (e.key === 'F3') return 'F3';
        if (e.key === 'F4') return 'F4';
        
        parts.push(e.key.toUpperCase());
        return parts.join('+');
    }

    navigateTo(path) {
        window.location.href = path;
    }

    newProduct() {
        if (window.location.pathname === '/products') {
            window.location.href = '/add_product';
        } else {
            this.navigateTo('/add_product');
        }
    }

    focusSearch() {
        const searchInput = document.querySelector('#searchInput, input[type="search"], input[placeholder*="search" i]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    exportData() {
        const exportBtn = document.querySelector('button[onclick*="export"], .btn:contains("Export")');
        if (exportBtn) {
            exportBtn.click();
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }

    focusBarcodeInput() {
        const barcodeInput = document.querySelector('#barcodeInput, input[placeholder*="barcode" i]');
        if (barcodeInput) {
            barcodeInput.focus();
            barcodeInput.select();
        }
    }

    completeBill() {
        const completeBtn = document.querySelector('#completeBillBtn, button[onclick*="completeBill"]');
        if (completeBtn && !completeBtn.disabled) {
            completeBtn.click();
        }
    }

    holdBill() {
        const holdBtn = document.querySelector('#holdBillBtn, button[onclick*="holdBill"]');
        if (holdBtn && !holdBtn.disabled) {
            holdBtn.click();
        }
    }

    addQuickAmount(amount) {
        const amountInput = document.querySelector('#amountPaid, input[name="amount_paid"]');
        if (amountInput) {
            const currentValue = parseFloat(amountInput.value) || 0;
            amountInput.value = currentValue + amount;
            amountInput.dispatchEvent(new Event('input'));
        }
    }

    showShortcutFeedback(shortcut) {
        const feedback = document.createElement('div');
        feedback.className = 'shortcut-feedback';
        feedback.textContent = shortcut;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 9999;
            animation: fadeInOut 1s ease;
        `;
        
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1000);
    }

    showHelp() {
        const modal = document.getElementById('shortcutsHelpModal');
        if (modal) {
            new bootstrap.Modal(modal).show();
        }
    }

    createHelpModal() {
        const modalHTML = `
            <div class="modal fade" id="shortcutsHelpModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-keyboard"></i> Keyboard Shortcuts
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="text-primary">Navigation</h6>
                                    <div class="shortcut-item">
                                        <kbd>Alt + D</kbd> Dashboard
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>Alt + P</kbd> Products
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>Alt + B</kbd> Billing
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>Alt + S</kbd> Stock
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>Alt + A</kbd> Analytics
                                    </div>
                                    
                                    <h6 class="text-primary mt-3">Actions</h6>
                                    <div class="shortcut-item">
                                        <kbd>Ctrl + N</kbd> New Product
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>Ctrl + F</kbd> Focus Search
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>Ctrl + E</kbd> Export Data
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>Esc</kbd> Close Modals
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>F1</kbd> Show Help
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-primary">Billing</h6>
                                    <div class="shortcut-item">
                                        <kbd>F2</kbd> Focus Barcode
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>F3</kbd> Complete Bill
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>F4</kbd> Hold Bill
                                    </div>
                                    
                                    <h6 class="text-primary mt-3">Quick Amounts</h6>
                                    <div class="shortcut-item">
                                        <kbd>Ctrl + 1</kbd> Add ₹10
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>Ctrl + 2</kbd> Add ₹20
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>Ctrl + 3</kbd> Add ₹50
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>Ctrl + 4</kbd> Add ₹100
                                    </div>
                                    <div class="shortcut-item">
                                        <kbd>Ctrl + 5</kbd> Add ₹500
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add CSS for shortcuts
        const style = document.createElement('style');
        style.textContent = `
            .shortcut-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 0;
                border-bottom: 1px solid #eee;
            }
            
            kbd {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 3px;
                padding: 2px 6px;
                font-size: 11px;
                font-family: monospace;
            }
            
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-10px); }
                50% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize keyboard shortcuts
document.addEventListener('DOMContentLoaded', () => {
    new KeyboardShortcuts();
});
