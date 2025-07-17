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
            id: 'asset-entry',
            title: 'Asset Entry',
            icon: '&#128200;',
            path: 'apps/asset-entry/',
            setupFunction: 'setupAssetEntry'
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
        // {
        //     id: 'app2',
        //     title: 'App Two',
        //     icon: '&#128202;',
        //     path: 'apps/app2/' // Example for a future app
        // },
        // {
        //     id: 'settings',
        //     title: 'Settings',
        //     icon: '&#9881;',
        //     path: 'apps/settings/' // Example for a future app
        // }
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
            const script = document.createElement('script');
            script.id = `script-${app.id}`;
            script.defer = true;

            // IMPORTANT: Set onload BEFORE src to prevent race conditions.
            script.onload = () => {
                if (app.setupFunction && typeof window[app.setupFunction] === 'function') {
                    window[app.setupFunction]();
                } else {
                    console.error(`Setup function '${app.setupFunction}' not found on window object.`);
                }
            };

            script.onerror = () => {
                console.error(`Failed to load script: ${app.path}script.js`);
            };

            script.src = `${app.path}script.js`;
            document.body.appendChild(script);

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

    // Generate app tiles from the manifest
    apps.forEach(app => {
        const tile = document.createElement('div');
        tile.className = 'app-tile';
        tile.innerHTML = `
            <div class="app-tile__icon">${app.icon}</div>
            <div class="app-tile__title">${app.title}</div>
        `;
        tile.addEventListener('click', () => openModal(app));
        appContainer.appendChild(tile);
    });

    // Event listeners for closing the modal
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeModal();
        }
    });
});
