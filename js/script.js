import { loadJSON, saveJSON } from './utils/storage.js';

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const modalClose = document.getElementById('modal-close');
    let currentApp = {};

    // App Manifest: Defines all available applications
    const apps = [
        {
            id: 'debt-tracker',
            title: 'Debt Tracker',
            icon: '&#128187;',
            path: 'apps/debt-tracker/',
            setupFunction: 'setupDebtTracker'
        },
        {
            id: 'asset-tracker',
            title: 'Asset Tracker',
            icon: '&#128200;',
            path: 'apps/asset-tracker/',
            setupFunction: 'setupAssetTracker'
        },
        {
            id: 'financial-summary',
            title: 'Financial Summary',
            icon: '&#128201;',
            path: 'apps/financial-summary/',
            setupFunction: 'setupFinancialSummary'
        },
        {
            id: 'budget-planner',
            title: 'Budget Planner',
            icon: '&#128176;',
            path: 'apps/budget-planner/',
            setupFunction: 'setupBudgetPlanner'
        },
        {
            id: 'savings-goal',
            title: 'Savings Goal',
            icon: '&#128181;',
            path: 'apps/savings-goal/',
            setupFunction: 'setupSavingsGoal'
        },
        {
            id: 'expense-tracker',
            title: 'Expense Tracker',
            icon: '&#128184;',
            path: 'apps/expense-tracker/',
            setupFunction: 'setupExpenseTracker'
        },
        {
            id: 'covered-call-tracker',
            title: 'Covered Calls',
            icon: '&#128188;',
            path: 'apps/covered-call-tracker/',
            setupFunction: 'setupCoveredCallTracker'
        },
    ];

    // Dynamically loads all app resources
    const openModal = async (app) => {
        currentApp = app;
        try {
            // 1. Fetch and load HTML
            const response = await fetch(`${app.path}index.html`);
            if (!response.ok) throw new Error(`Failed to load HTML: ${response.statusText}`);
            modalBody.innerHTML = await response.text();

            // 2. Load CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = `${app.path}style.css`;
            cssLink.id = `css-${app.id}`;
            document.head.appendChild(cssLink);

            // 3. Load and initialize JavaScript
            const moduleUrl = new URL(`../${app.path}script.js`, import.meta.url);
            const module = await import(moduleUrl);

            let setupFn = null;
            if (app.setupFunction && typeof module[app.setupFunction] === 'function') {
                setupFn = module[app.setupFunction];
            } else if (typeof module.default === 'function') {
                setupFn = module.default;
            } else if (app.setupFunction && typeof window[app.setupFunction] === 'function') {
                setupFn = window[app.setupFunction];
            }

            if (typeof setupFn === 'function') {
                setupFn();
            } else if (app.setupFunction) {
                console.error(`Setup function '${app.setupFunction}' not found in module ${app.path}script.js.`);
            }

            modalOverlay.style.display = 'flex';
        } catch (error) {
            modalBody.innerHTML = `<p>Error loading app: ${error.message}</p>`;
            modalOverlay.style.display = 'flex';
        }
    };

    // Cleans up app-specific resources
    const closeModal = () => {
        modalOverlay.style.display = 'none';
        modalBody.innerHTML = '';

        // Remove app-specific CSS and JS
        const css = document.getElementById(`css-${currentApp.id}`);
        const script = document.getElementById(`script-${currentApp.id}`);
        if (css) css.remove();
        if (script) script.remove();
        
        currentApp = {};
    };

    // Helper functions for drag and drop ordering
    const saveTileOrder = () => {
        const ids = Array.from(appContainer.querySelectorAll('.app-tile'))
            .map(tile => tile.dataset.id);
        saveJSON('appOrder', ids);
    };

    const loadTileOrder = () => {
        const ids = loadJSON('appOrder', []);
        if (!Array.isArray(ids)) {
            return;
        }
        ids.forEach(id => {
            const tile = appContainer.querySelector(`[data-id="${id}"]`);
            if (tile) appContainer.appendChild(tile);
        });
    };

    const getDragAfterElement = (container, y) => {
        const draggables = [...container.querySelectorAll('.app-tile:not(.dragging)')];
        return draggables.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    };

    // Generate app tiles from the manifest
    apps.forEach(app => {
        const tile = document.createElement('div');
        tile.className = 'app-tile';
        tile.draggable = true;
        tile.dataset.id = app.id;
        tile.innerHTML = `
            <div class="app-tile__icon">${app.icon}</div>
            <div class="app-tile__title">${app.title}</div>
        `;
        tile.addEventListener('click', () => openModal(app));
        tile.addEventListener('dragstart', () => {
            tile.classList.add('dragging');
        });
        tile.addEventListener('dragend', () => {
            tile.classList.remove('dragging');
            saveTileOrder();
        });
        appContainer.appendChild(tile);
    });

    appContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(appContainer, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (!dragging) return;
        if (afterElement == null) {
            appContainer.appendChild(dragging);
        } else {
            appContainer.insertBefore(dragging, afterElement);
        }
    });

    // Load any saved order on startup
    loadTileOrder();

    // Event listeners for closing the modal
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeModal();
        }
    });

    const themeStorageKey = 'preferredTheme';
    const themeToggle = document.getElementById('theme-toggle');
    const validTheme = (theme) => theme === 'light' || theme === 'dark';

    const applyTheme = (theme) => {
        document.body.classList.remove('theme-light', 'theme-dark');
        if (validTheme(theme)) {
            document.body.classList.add(`theme-${theme}`);
        }
    };

    const systemPrefersDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const getActiveTheme = () => {
        if (document.body.classList.contains('theme-dark')) {
            return 'dark';
        }
        if (document.body.classList.contains('theme-light')) {
            return 'light';
        }
        return systemPrefersDark() ? 'dark' : 'light';
    };

    const updateToggleLabel = () => {
        if (!themeToggle) {
            return;
        }
        const activeTheme = getActiveTheme();
        const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
        themeToggle.textContent = nextTheme === 'dark' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
        themeToggle.setAttribute('aria-pressed', activeTheme === 'dark' ? 'true' : 'false');
    };

    const storedTheme = loadJSON(themeStorageKey, null);
    if (validTheme(storedTheme)) {
        applyTheme(storedTheme);
    }

    if (themeToggle) {
        updateToggleLabel();
        themeToggle.addEventListener('click', () => {
            const activeTheme = getActiveTheme();
            const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
            saveJSON(themeStorageKey, nextTheme);
            updateToggleLabel();
        });
    }

    if (!validTheme(storedTheme) && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            updateToggleLabel();
        };
        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', handleChange);
        } else if (typeof mediaQuery.addListener === 'function') {
            mediaQuery.addListener(handleChange);
        }
    }
});
