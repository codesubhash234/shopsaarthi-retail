// Export Functionality for Reports and Data
class ExportManager {
    constructor() {
        this.init();
    }

    init() {
        this.addExportButtons();
        this.bindEvents();
    }

    addExportButtons() {
        // Add floating export button
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn-floating';
        exportBtn.innerHTML = '📊';
        exportBtn.title = 'Export Data';
        exportBtn.style.bottom = '8rem'; // Position above other floating buttons
        exportBtn.id = 'export-btn';
        
        document.body.appendChild(exportBtn);
        this.exportButton = exportBtn;
    }

    bindEvents() {
        this.exportButton.addEventListener('click', () => {
            this.showExportModal();
        });
    }

    showExportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Export Data</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <button class="btn btn-gradient w-100" onclick="exportManager.exportProducts()">
                                    <i class="bi bi-box"></i> Export Products
                                </button>
                            </div>
                            <div class="col-md-6 mb-3">
                                <button class="btn btn-success-gradient w-100" onclick="exportManager.exportSales()">
                                    <i class="bi bi-graph-up"></i> Export Sales
                                </button>
                            </div>
                            <div class="col-md-6 mb-3">
                                <button class="btn btn-warning-gradient w-100" onclick="exportManager.exportInventory()">
                                    <i class="bi bi-clipboard-data"></i> Export Inventory
                                </button>
                            </div>
                            <div class="col-md-6 mb-3">
                                <button class="btn btn-danger-gradient w-100" onclick="exportManager.exportAIInsights()">
                                    <i class="bi bi-robot"></i> Export AI Insights
                                </button>
                            </div>
                        </div>
                        <hr>
                        <div class="form-floating-enhanced">
                            <select id="exportFormat" class="form-control">
                                <option value="csv">CSV</option>
                                <option value="excel">Excel</option>
                                <option value="pdf">PDF</option>
                                <option value="json">JSON</option>
                            </select>
                            <label for="exportFormat">Export Format</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Clean up modal after hiding
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    async exportProducts() {
        try {
            const format = document.getElementById('exportFormat').value;
            const response = await fetch(`/api/export/products?format=${format}`);
            
            if (response.ok) {
                this.downloadFile(response, `products.${format}`);
                window.notifications.success('Products exported successfully!');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            window.notifications.error('Failed to export products');
        }
    }

    async exportSales() {
        try {
            const format = document.getElementById('exportFormat').value;
            const response = await fetch(`/api/export/sales?format=${format}`);
            
            if (response.ok) {
                this.downloadFile(response, `sales.${format}`);
                window.notifications.success('Sales data exported successfully!');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            window.notifications.error('Failed to export sales data');
        }
    }

    async exportInventory() {
        try {
            const format = document.getElementById('exportFormat').value;
            const response = await fetch(`/api/export/inventory?format=${format}`);
            
            if (response.ok) {
                this.downloadFile(response, `inventory.${format}`);
                window.notifications.success('Inventory exported successfully!');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            window.notifications.error('Failed to export inventory');
        }
    }

    async exportAIInsights() {
        try {
            const format = document.getElementById('exportFormat').value;
            const response = await fetch(`/api/export/ai-insights?format=${format}`);
            
            if (response.ok) {
                this.downloadFile(response, `ai-insights.${format}`);
                window.notifications.success('AI Insights exported successfully!');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            window.notifications.error('Failed to export AI insights');
        }
    }

    async downloadFile(response, filename) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Client-side CSV export for tables
    exportTableToCSV(tableId, filename = 'data.csv') {
        const table = document.getElementById(tableId);
        if (!table) return;

        const rows = Array.from(table.querySelectorAll('tr'));
        const csv = rows.map(row => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            return cells.map(cell => {
                const text = cell.textContent.trim();
                return `"${text.replace(/"/g, '""')}"`;
            }).join(',');
        }).join('\n');

        this.downloadCSV(csv, filename);
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize export manager
window.exportManager = new ExportManager();

// Add export buttons to existing tables
document.addEventListener('DOMContentLoaded', () => {
    const tables = document.querySelectorAll('table');
    tables.forEach((table, index) => {
        if (table.id) {
            const exportBtn = document.createElement('button');
            exportBtn.className = 'btn btn-sm btn-outline-primary ms-2';
            exportBtn.innerHTML = '<i class="bi bi-download"></i> Export';
            exportBtn.onclick = () => {
                window.exportManager.exportTableToCSV(table.id, `${table.id}-data.csv`);
            };
            
            // Add button near table
            const tableContainer = table.closest('.card, .container, .row') || table.parentElement;
            if (tableContainer) {
                const header = tableContainer.querySelector('h1, h2, h3, h4, h5, h6, .card-header');
                if (header) {
                    header.appendChild(exportBtn);
                }
            }
        }
    });
});
