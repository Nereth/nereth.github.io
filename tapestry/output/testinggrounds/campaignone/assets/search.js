
// Tapestry Static Site Search
(function() {
    'use strict';

    let searchIndex = [];
    let searchInput = null;
    let resultsContainer = null;
    let indexBasePath = '';

    // Initialize search when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        searchInput = document.getElementById('search-input');
        resultsContainer = document.getElementById('search-results');

        if (!searchInput || !resultsContainer) return;

        // Get the base path from the data attribute (handles different page depths)
        indexBasePath = searchInput.dataset.basePath || '';

        // Use embedded index if available (works with file:// and http://)
        // Falls back to fetch for remote hosting without embedded index
        if (typeof TAPESTRY_SEARCH_INDEX !== 'undefined') {
            searchIndex = TAPESTRY_SEARCH_INDEX;
        } else {
            // Fallback: try to fetch (only works with http://, not file://)
            const indexPath = indexBasePath + 'assets/search-index.json';
            fetch(indexPath)
                .then(response => response.json())
                .then(data => { searchIndex = data; })
                .catch(() => { console.log('Search index not available'); });
        }

        // Add event listeners
        searchInput.addEventListener('input', debounce(performSearch, 200));
        searchInput.addEventListener('keydown', handleKeyDown);
    });

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();

        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            return;
        }

        const results = searchIndex.filter(item => {
            return item.title.toLowerCase().includes(query) ||
                   (item.content && item.content.toLowerCase().includes(query));
        }).slice(0, 10);

        displayResults(results, query);
    }

    function displayResults(results, query) {
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="search-no-results">No results found</div>';
            resultsContainer.style.display = 'block';
            return;
        }

        const html = results.map(item => {
            const highlight = highlightMatch(item.title, query);
            // Prepend base path for correct relative URLs from any page depth
            const url = indexBasePath + item.url;
            return `
                <a href="${url}" class="search-result-item">
                    <div class="search-result-type">${item.type}</div>
                    <div class="search-result-title">${highlight}</div>
                </a>
            `;
        }).join('');

        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';
    }

    function highlightMatch(text, query) {
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            searchInput.value = '';
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
})();
