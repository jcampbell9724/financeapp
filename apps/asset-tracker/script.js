import { ensureAssetsHavePrincipal, loadJSON, saveJSON } from '../../js/utils/storage.js';

// --- ASSET TRACKER LOGIC ---
export function setupAssetTracker(sharedData) {
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
                category: document.getElementById('asset-category').value,
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
        const storedAssets = loadJSON('assets', []);
        const { assets: normalizedAssets, migrated } = ensureAssetsHavePrincipal(storedAssets);
        if (migrated) {
            saveJSON('assets', normalizedAssets);
        }
        return normalizedAssets;
    }

    // Function to save assets to localStorage
    function saveAssets(assetsToSave) {
        const { assets: normalizedAssets } = ensureAssetsHavePrincipal(assetsToSave);
        assets = normalizedAssets;
        saveJSON('assets', normalizedAssets);
    }

    // Function to render the asset accounts
    function renderAssetAccounts() {
        if (!assetAccountsContainer) return;
        assetAccountsContainer.innerHTML = '';
        assets.forEach(asset => {
            const accountCard = document.createElement('div');
            accountCard.className = 'asset-account';
            accountCard.dataset.id = asset.id;

            const monthlyBalanceEntries = Object.entries(asset.monthlyBalances || {}).sort(
                ([a], [b]) => a.localeCompare(b)
            );

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
                <p><strong>Category:</strong> ${asset.category}</p>
                <div class="asset-account__monthly-balances">
                    <h4>Monthly Balances</h4>
                    <ul class="asset-account__monthly-list">
                        ${monthlyBalanceEntries.map(([m, v]) => `
                            <li class="asset-account__monthly-item">${m}: $${v.toFixed(2)}</li>
                        `).join('')}
                    </ul>
                </div>
                <form class="asset-account__edit-form" style="display:none">
                    <input class="form-input edit-asset-name" type="text" value="${asset.name}" required>
                    <input class="form-input edit-asset-principal" type="number" value="${asset.principal}" step="0.01" required>
                    <input class="form-input edit-asset-month" type="month" value="${new Date().toISOString().slice(0,7)}" required>
                    <select class="form-input edit-asset-category">
                        <option value="Cash" ${asset.category === 'Cash' ? 'selected' : ''}>Cash</option>
                        <option value="Investment" ${asset.category === 'Investment' ? 'selected' : ''}>Investment</option>
                        <option value="Retirement" ${asset.category === 'Retirement' ? 'selected' : ''}>Retirement</option>
                        <option value="Other" ${asset.category === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                    <button class="button primary-button save-asset-btn" type="submit">Save</button>
                    <button class="button secondary-button cancel-edit-btn" type="button">Cancel</button>
                </form>
                <div class="asset-account__history">
                    <h4>Update History</h4>
                    <table class="asset-account__history-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Event</th>
                                <th>Principal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${asset.history.map(entry => `
                                <tr>
                                    <td>${new Date(entry.date).toLocaleDateString()}</td>
                                    <td>${entry.event}</td>
                                    <td>$${entry.principal.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
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
                        form.querySelector('.edit-asset-category').value = asset.category;
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
                asset.category = e.target.querySelector('.edit-asset-category').value;
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
    assets = loadAssets();
    renderAssetAccounts();
}

