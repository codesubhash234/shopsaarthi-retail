// Advanced Search and Filtering System
class AdvancedSearch {
    constructor() {
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        this.filters = new Map();
        this.init();
    }

    init() {
        this.enhanceSearchInputs();
        this.setupGlobalSearch();
        this.setupSmartFilters();
    }

    enhanceSearchInputs() {
        const searchInputs = document.querySelectorAll('input[type="search"], #searchInput, .search-input');
        
        searchInputs.forEach(input => {
            this.enhanceSearchInput(input);
        });
    }

    enhanceSearchInput(input) {
        // Add search suggestions dropdown
        const wrapper = document.createElement('div');
        wrapper.className = 'search-wrapper position-relative';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const dropdown = document.createElement('div');
        dropdown.className = 'search-suggestions dropdown-menu';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 1000;
            max-height: 300px;
            overflow-y: auto;
            display: none;
        `;
        wrapper.appendChild(dropdown);

        // Enhanced search with debouncing
        const debouncedSearch = debounce((query) => {
            this.performSearch(input, query, dropdown);
        }, 300);

        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                debouncedSearch(query);
            } else {
                dropdown.style.display = 'none';
            }
        });

        input.addEventListener('focus', () => {
            if (input.value.length >= 2) {
                dropdown.style.display = 'block';
            }
        });

        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Add search shortcuts
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateSuggestions(dropdown, 'down');
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateSuggestions(dropdown, 'up');
            } else if (e.key === 'Enter') {
                const active = dropdown.querySelector('.dropdown-item.active');
                if (active) {
                    e.preventDefault();
                    active.click();
                }
            }
        });
    }

    async performSearch(input, query, dropdown) {
        try {
            // Determine search context based on current page
            const context = this.getSearchContext();
            const results = await this.searchAPI(query, context);
            
            this.displaySuggestions(dropdown, results, query, input);
            this.addToSearchHistory(query);
            
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    getSearchContext() {
        const path = window.location.pathname;
        if (path.includes('products')) return 'products';
        if (path.includes('billing')) return 'billing';
        if (path.includes('stock')) return 'stock';
        if (path.includes('analytics')) return 'analytics';
        return 'global';
    }

    async searchAPI(query, context) {
        // Mock API call - replace with actual endpoint
        const mockResults = {
            products: [
                { id: 1, name: 'Sample Product 1', barcode: '123456', category: 'Electronics' },
                { id: 2, name: 'Sample Product 2', barcode: '789012', category: 'Clothing' }
            ],
            history: this.searchHistory.filter(h => h.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockResults;
    }

    displaySuggestions(dropdown, results, query, input) {
        dropdown.innerHTML = '';

        // Search history
        if (results.history && results.history.length > 0) {
            const historyHeader = document.createElement('h6');
            historyHeader.className = 'dropdown-header';
            historyHeader.innerHTML = '<i class="bi bi-clock-history me-2"></i>Recent Searches';
            dropdown.appendChild(historyHeader);

            results.history.forEach(item => {
                const historyItem = this.createSuggestionItem(item, 'history', input);
                dropdown.appendChild(historyItem);
            });

            dropdown.appendChild(document.createElement('hr'));
        }

        // Product results
        if (results.products && results.products.length > 0) {
            const productsHeader = document.createElement('h6');
            productsHeader.className = 'dropdown-header';
            productsHeader.innerHTML = '<i class="bi bi-box me-2"></i>Products';
            dropdown.appendChild(productsHeader);

            results.products.forEach(product => {
                const productItem = this.createProductSuggestion(product, input);
                dropdown.appendChild(productItem);
            });
        }

        // Quick actions
        const actionsHeader = document.createElement('h6');
        actionsHeader.className = 'dropdown-header';
        actionsHeader.innerHTML = '<i class="bi bi-lightning me-2"></i>Quick Actions';
        dropdown.appendChild(actionsHeader);

        const addProductAction = this.createActionItem('Add New Product', 'plus-circle', () => {
            window.location.href = '/add_product';
        });
        dropdown.appendChild(addProductAction);

        dropdown.style.display = 'block';
    }

    createSuggestionItem(text, type, input) {
        const item = document.createElement('a');
        item.className = 'dropdown-item';
        item.href = '#';
        item.innerHTML = `<i class="bi bi-search me-2"></i>${text}`;
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            input.value = text;
            input.dispatchEvent(new Event('input'));
            item.closest('.search-suggestions').style.display = 'none';
        });

        return item;
    }

    createProductSuggestion(product, input) {
        const item = document.createElement('a');
        item.className = 'dropdown-item';
        item.href = '#';
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-box me-2"></i>
                <div>
                    <div class="fw-bold">${product.name}</div>
                    <small class="text-muted">${product.barcode} • ${product.category}</small>
                </div>
            </div>
        `;
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            input.value = product.name;
            input.dispatchEvent(new Event('input'));
            item.closest('.search-suggestions').style.display = 'none';
        });

        return item;
    }

    createActionItem(text, icon, action) {
        const item = document.createElement('a');
        item.className = 'dropdown-item';
        item.href = '#';
        item.innerHTML = `<i class="bi bi-${icon} me-2"></i>${text}`;
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            action();
            item.closest('.search-suggestions').style.display = 'none';
        });

        return item;
    }

    navigateSuggestions(dropdown, direction) {
        const items = dropdown.querySelectorAll('.dropdown-item');
        const current = dropdown.querySelector('.dropdown-item.active');
        
        if (items.length === 0) return;

        let index = current ? Array.from(items).indexOf(current) : -1;
        
        if (current) {
            current.classList.remove('active');
        }

        if (direction === 'down') {
            index = (index + 1) % items.length;
        } else {
            index = index <= 0 ? items.length - 1 : index - 1;
        }

        items[index].classList.add('active');
    }

    addToSearchHistory(query) {
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 10); // Keep only last 10
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        }
    }

    setupGlobalSearch() {
        // Add global search shortcut (Ctrl+K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.showGlobalSearch();
            }
        });
    }

    showGlobalSearch() {
        // Create global search modal if it doesn't exist
        let modal = document.getElementById('globalSearchModal');
        if (!modal) {
            modal = this.createGlobalSearchModal();
        }
        
        new bootstrap.Modal(modal).show();
        setTimeout(() => {
            modal.querySelector('input').focus();
        }, 300);
    }

    createGlobalSearchModal() {
        const modalHTML = `
            <div class="modal fade" id="globalSearchModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header border-0 pb-0">
                            <div class="w-100">
                                <div class="input-group input-group-lg">
                                    <span class="input-group-text bg-transparent border-0">
                                        <i class="bi bi-search"></i>
                                    </span>
                                    <input type="text" class="form-control border-0 shadow-none" 
                                           placeholder="Search products, bills, customers..." 
                                           id="globalSearchInput">
                                </div>
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="globalSearchResults">
                            <div class="text-center text-muted py-4">
                                <i class="bi bi-search display-4 d-block mb-2"></i>
                                <p>Start typing to search across all data...</p>
                                <small>Use <kbd>Ctrl+K</kbd> to open search anytime</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('globalSearchModal');
        const input = modal.querySelector('#globalSearchInput');
        const results = modal.querySelector('#globalSearchResults');
        
        const debouncedGlobalSearch = debounce(async (query) => {
            if (query.length >= 2) {
                results.innerHTML = '<div class="text-center py-3"><div class="spinner-border"></div></div>';
                
                // Simulate search
                setTimeout(() => {
                    results.innerHTML = `
                        <div class="search-category mb-3">
                            <h6 class="text-primary mb-2">Products</h6>
                            <div class="list-group list-group-flush">
                                <a href="/products" class="list-group-item list-group-item-action">
                                    <i class="bi bi-box me-2"></i>Sample Product matching "${query}"
                                </a>
                            </div>
                        </div>
                        <div class="search-category mb-3">
                            <h6 class="text-primary mb-2">Quick Actions</h6>
                            <div class="list-group list-group-flush">
                                <a href="/add_product" class="list-group-item list-group-item-action">
                                    <i class="bi bi-plus-circle me-2"></i>Add new product
                                </a>
                                <a href="/billing" class="list-group-item list-group-item-action">
                                    <i class="bi bi-receipt me-2"></i>Create new bill
                                </a>
                            </div>
                        </div>
                    `;
                }, 500);
            }
        }, 300);
        
        input.addEventListener('input', (e) => {
            debouncedGlobalSearch(e.target.value.trim());
        });
        
        return modal;
    }

    setupSmartFilters() {
        // Add smart filtering capabilities to existing filter controls
        const filterSelects = document.querySelectorAll('select[id*="Filter"], .filter-select');
        
        filterSelects.forEach(select => {
            this.enhanceFilterSelect(select);
        });
    }

    enhanceFilterSelect(select) {
        // Add "Clear All" option
        if (!select.querySelector('option[value="clear-all"]')) {
            const clearOption = document.createElement('option');
            clearOption.value = 'clear-all';
            clearOption.textContent = '🗑️ Clear All Filters';
            clearOption.style.fontStyle = 'italic';
            select.appendChild(clearOption);
        }

        select.addEventListener('change', (e) => {
            if (e.target.value === 'clear-all') {
                this.clearAllFilters();
                e.target.value = '';
            }
        });
    }

    clearAllFilters() {
        const filterControls = document.querySelectorAll('select[id*="Filter"], input[id*="Filter"]');
        filterControls.forEach(control => {
            if (control.tagName === 'SELECT') {
                control.selectedIndex = 0;
            } else {
                control.value = '';
            }
            control.dispatchEvent(new Event('change'));
        });

        if (window.notifications) {
            window.notifications.info('All filters cleared');
        }
    }
}

// Initialize advanced search
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedSearch();
});
