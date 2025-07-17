// --- ASSET TRACKER LOGIC ---
function setupAssetTracker(sharedData) {
    console.log('Setting up Asset Tracker...');
    const assetForm = document.getElementById('asset-form');
    const assetAccountsContainer = document.getElementById('asset-accounts-container');
    const toggleAddFormBtn = document.getElementById('toggle-add-form-btn');
    const addAssetFormContainer = document.getElementById('add-asset-form-container');

    let assets = loadAssets();

    // Toggle the "Add New Account" form
    if (toggleAddFormBtn) {
        toggleAddFormBtn.addEventListener('click', () => {
            if (!addAssetFormContainer) {
                return;
            }
            const isVisible = addAssetFormContainer.style.display === 'block';
            addAssetFormContainer.style.display = isVisible ? 'none' : 'block';
            toggleAddFormBtn.textContent = isVisible ? '+ Add New Account' : '− Close Form';
        });
    }

    // Handle form submission for adding a new asset
    if (assetForm) {
        assetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const now = new Date().toISOString();
            const principal = parseFloat(document.getElementById('asset-principal').value);
            const currentMonth = now.slice(0, 7);
            const newAsset = {
                id: Date.now(),
                name: document.getElementById('asset-name').value,
                principal: principal,
                payment: parseFloat(document.getElementById('asset-payment').value),
                rate: parseFloat(document.getElementById('asset-rate').value),
                lastUpdated: now,
                monthlyBalances: { [currentMonth]: principal },
                history: [{ date: now, principal: principal, event: 'Account Created' }]
            };
            assets.push(newAsset);
            saveAssets(assets);
            renderAssetAccounts();
            assetForm.reset();
            if (addAssetFormContainer) {
                addAssetFormContainer.style.display = 'none'; // Hide form after adding
            }
            if (toggleAddFormBtn) {
                toggleAddFormBtn.textContent = '+ Add New Account';
            }
        });
    }

    // Function to load assets from localStorage
    function loadAssets() {
        const stored = localStorage.getItem('assets');
        if (!stored) {
            return [];
        }
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing assets from localStorage', e);
            return [];
        }
    }

    // Function to save assets to localStorage
    function saveAssets(assetsToSave) {
        localStorage.setItem('assets', JSON.stringify(assetsToSave));
    }

    // Function to calculate asset metrics
    function calculateMetrics(asset) {
        const monthlyInterestRate = (asset.rate / 100) / 12;
        const dailyInterest = (asset.principal * (asset.rate / 100)) / 365;

        if (monthlyInterestRate === 0) {
            const paymentsLeft = Math.ceil(asset.principal / asset.payment);
            const payoffDate = new Date();
            payoffDate.setMonth(payoffDate.getMonth() + paymentsLeft);
            return {
                dailyCarryingCost: dailyInterest.toFixed(2),
                paymentsLeft: paymentsLeft,
                payoffDate: payoffDate.toLocaleDateString(),
                yearlyInterest: (dailyInterest * 365).toFixed(2)
            };
        }

        if (asset.payment <= asset.principal * monthlyInterestRate) {
            return {
                dailyCarryingCost: dailyInterest.toFixed(2),
                paymentsLeft: 'Infinite',
                payoffDate: 'Never',
                yearlyInterest: (dailyInterest * 365).toFixed(2)
            };
        }

        const n = -Math.log(1 - (asset.principal * monthlyInterestRate) / asset.payment) / Math.log(1 + monthlyInterestRate);
        const paymentsLeft = Math.ceil(n);
        const payoffDate = new Date();
        payoffDate.setMonth(payoffDate.getMonth() + paymentsLeft);

        return {
            dailyCarryingCost: dailyInterest.toFixed(2),
            paymentsLeft: paymentsLeft,
            payoffDate: payoffDate.toLocaleDateString(),
            yearlyInterest: (dailyInterest * 365).toFixed(2)
        };
    }

    // Function to render the asset accounts
    function renderAssetAccounts() {
        if (!assetAccountsContainer) return;
        assetAccountsContainer.innerHTML = '';
        assets.forEach(asset => {
            const metrics = calculateMetrics(asset);
            const accountCard = document.createElement('div');
            accountCard.className = 'asset-account';
            accountCard.dataset.id = asset.id;

            // Check if the account is stale (not updated in over a month)
            const lastUpdated = new Date(asset.lastUpdated);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            if (lastUpdated < oneMonthAgo) {
                accountCard.classList.add('asset-account--stale');
            }

            accountCard.innerHTML = `
                <div class="asset-account__header">
                    <h3>${asset.name}</h3>
                    <div class="asset-account__header-actions">
                        <button class="edit-asset-btn">Edit</button>
                        <button class="delete-asset-btn">×</button>
                    </div>
                </div>
                <p><strong>Principal:</strong> $${asset.principal.toFixed(2)}</p>
                <div class="asset-account__metrics">
                    <div class="asset-account__metric">Daily Cost: $${metrics.dailyCarryingCost}</div>
                    <div class="asset-account__metric">Payments Left: ${metrics.paymentsLeft}</div>
                    <div class="asset-account__metric">Yearly Interest: $${metrics.yearlyInterest}</div>
                    <div class="asset-account__metric">Payoff Date: ${metrics.payoffDate}</div>
                </div>
                <div class="asset-account__monthly-balances">
                    <h4>Monthly Balances</h4>
                    <ul class="asset-account__monthly-list">
                        ${Object.entries(asset.monthlyBalances || {}).map(([m, v]) => `
                            <li class="asset-account__monthly-item">${m}: $${v.toFixed(2)}</li>
                        `).join('')}
                    </ul>
                </div>
                <form class="asset-account__edit-form" style="display:none">
                    <input type="text" class="edit-asset-name" value="${asset.name}" required>
                    <input type="number" class="edit-asset-principal" value="${asset.principal}" step="0.01" required>
                    <input type="month" class="edit-asset-month" value="${new Date().toISOString().slice(0,7)}" required>
                    <input type="number" class="edit-asset-payment" value="${asset.payment}" step="0.01" required>
                    <input type="number" class="edit-asset-rate" value="${asset.rate}" step="0.01" required>
                    <button type="submit" class="save-asset-btn">Save</button>
                    <button type="button" class="cancel-edit-btn">Cancel</button>
                </form>
                <div class="asset-account__history">
                    <h4>Update History</h4>
                    <ul class="asset-account__history-list">
                        ${asset.history.map(entry => `
                            <li class="asset-account__history-item">
                                ${new Date(entry.date).toLocaleDateString()}: ${entry.event} - $${entry.principal.toFixed(2)}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            assetAccountsContainer.appendChild(accountCard);
        });
    }

    // Event delegation for handling clicks within the accounts container
    if (assetAccountsContainer) {
        assetAccountsContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.asset-account');
            if (!card) return;

            const assetId = parseInt(card.dataset.id, 10);


            // Ignore clicks inside the inline edit form so the history doesn't toggle
            if (e.target.closest('.asset-account__edit-form')) {
                return;
            }


            // Handle delete button clicks
            if (e.target.classList.contains('delete-asset-btn')) {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this account?')) {
                    assets = assets.filter(d => d.id !== assetId);
                    saveAssets(assets);
                    renderAssetAccounts();
                }
                return;
            }

            // Toggle edit form
            if (e.target.classList.contains('edit-asset-btn')) {
                e.stopPropagation();
                const form = card.querySelector('.asset-account__edit-form');
                if (form) {
                    form.style.display = form.style.display === 'block' ? 'none' : 'block';
                }
                return;
            }

            // Cancel edit
            if (e.target.classList.contains('cancel-edit-btn')) {
                e.preventDefault();
                const form = card.querySelector('.asset-account__edit-form');

                if (form) {
                    const asset = assets.find(d => d.id === assetId);
                    if (asset) {
                        form.querySelector('.edit-asset-name').value = asset.name;
                        form.querySelector('.edit-asset-principal').value = asset.principal;
                        form.querySelector('.edit-asset-payment').value = asset.payment;
                        form.querySelector('.edit-asset-rate').value = asset.rate;
                        form.querySelector('.edit-asset-month').value = new Date().toISOString().slice(0, 7);
                    }
                    form.style.display = 'none';
                }

                return;
            }

            // Handle toggling the history view for the whole card
            const historyView = card.querySelector('.asset-account__history');
            if (historyView) {
                const isVisible = historyView.style.display === 'block';
                historyView.style.display = isVisible ? 'none' : 'block';
            }
        });

        // Handle save on edit form submission
        assetAccountsContainer.addEventListener('submit', (e) => {
            if (e.target.classList.contains('asset-account__edit-form')) {
                e.preventDefault();
                const card = e.target.closest('.asset-account');
                const assetId = parseInt(card.dataset.id, 10);
                const asset = assets.find(d => d.id === assetId);
                if (!asset) return;
                const now = new Date().toISOString();
                const newPrincipal = parseFloat(e.target.querySelector('.edit-asset-principal').value);
                const month = e.target.querySelector('.edit-asset-month').value || now.slice(0, 7);
                asset.name = e.target.querySelector('.edit-asset-name').value;
                asset.principal = newPrincipal;
                asset.payment = parseFloat(e.target.querySelector('.edit-asset-payment').value);
                asset.rate = parseFloat(e.target.querySelector('.edit-asset-rate').value);
                asset.lastUpdated = now;
                asset.monthlyBalances = asset.monthlyBalances || {};
                asset.monthlyBalances[month] = newPrincipal;
                asset.history.push({ date: now, principal: newPrincipal, event: 'Account Updated' });
                saveAssets(assets);
                renderAssetAccounts();
            }
        });
    }

    // Initial render
    renderAssetAccounts();
}

// Check if the function is already defined to avoid re-running on script load
if (typeof window.setupAssetTracker !== 'function') {
    window.setupAssetTracker = setupAssetTracker;
}

