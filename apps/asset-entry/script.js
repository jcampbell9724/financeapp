function setupAssetEntry() {
    const assetForm = document.getElementById('asset-form');
    const assetList = document.getElementById('asset-list');
    const toggleAddAssetFormBtn = document.getElementById('toggle-add-asset-form-btn');
    const addAssetFormContainer = document.getElementById('add-asset-form-container');
    const categories = ['Cash', 'Investment', 'Retirement'];
    let assets = loadAssets();

    if (toggleAddAssetFormBtn) {
        toggleAddAssetFormBtn.addEventListener('click', () => {
            const isVisible = addAssetFormContainer.style.display === 'block';
            addAssetFormContainer.style.display = isVisible ? 'none' : 'block';
            toggleAddAssetFormBtn.textContent = isVisible ? '+ Add New Asset' : '− Close Form';
        });
    }

    function loadAssets() {
        return JSON.parse(localStorage.getItem('assets')) || [];
    }

    function saveAssets(newAssets) {
        localStorage.setItem('assets', JSON.stringify(newAssets));
    }

    function renderAssets() {
        if (!assetList) return;
        assetList.innerHTML = '';
        assets.forEach(asset => {
            const item = document.createElement('div');
            item.className = 'asset-item';
            item.dataset.id = asset.id;
            item.innerHTML = `
                <div class="asset-item__header">
                    <span>${asset.name} (${asset.category})</span>
                    <div class="asset-item__header-actions">
                        <button class="edit-asset-btn">Edit</button>
                        <button class="delete-asset-btn">Delete</button>
                    </div>
                </div>
                <p><strong>Value:</strong> $${asset.value.toFixed(2)}</p>
                <form class="asset-item__edit-form" style="display:none">
                    <input type="text" class="edit-asset-name" value="${asset.name}" required>
                    <input type="number" class="edit-asset-value" value="${asset.value}" step="0.01" required>
                    <select class="edit-asset-category">
                        ${categories.map(c => `<option value="${c}" ${asset.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                    <button type="submit" class="save-asset-btn">Save</button>
                    <button type="button" class="cancel-edit-btn">Cancel</button>
                </form>
                <div class="asset-history">
                    <h4>Update History</h4>
                    <ul class="asset-history-list">
                        ${asset.history.map(entry => `
                            <li class="asset-history-item">
                                ${new Date(entry.date).toLocaleDateString()}: ${entry.event} - $${entry.value.toFixed(2)}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            assetList.appendChild(item);
        });
    }

    if (assetForm) {
        assetForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('asset-name').value;
            const value = parseFloat(document.getElementById('asset-value').value);
            const category = document.getElementById('asset-category').value;
            const now = new Date().toISOString();
            const newAsset = {
                id: Date.now(),
                name: name,
                value: value,
                category: category,
                lastUpdated: now,
                history: [{ date: now, value: value, event: 'Asset Created' }]
            };
            assets.push(newAsset);
            saveAssets(assets);
            renderAssets();
            assetForm.reset();
        });
    }

    if (assetList) {
        assetList.addEventListener('click', e => {
            const item = e.target.closest('.asset-item');
            if (!item) return;
            const assetId = parseInt(item.dataset.id, 10);

            if (e.target.classList.contains('delete-asset-btn')) {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this asset?')) {
                    assets = assets.filter(a => a.id !== assetId);
                    saveAssets(assets);
                    renderAssets();
                }
                return;
            }

            if (e.target.classList.contains('edit-asset-btn')) {
                e.stopPropagation();
                const form = item.querySelector('.asset-item__edit-form');
                if (form) {
                    form.style.display = form.style.display === 'block' ? 'none' : 'block';
                }
                return;
            }

            if (e.target.classList.contains('cancel-edit-btn')) {
                e.preventDefault();
                const form = item.querySelector('.asset-item__edit-form');
                if (form) {
                    const asset = assets.find(a => a.id === assetId);
                    if (asset) {
                        form.querySelector('.edit-asset-name').value = asset.name;
                        form.querySelector('.edit-asset-value').value = asset.value;
                        form.querySelector('.edit-asset-category').value = asset.category;
                    }
                    form.style.display = 'none';
                }
                return;
            }

            const historyView = item.querySelector('.asset-history');
            if (historyView) {
                const isVisible = historyView.style.display === 'block';
                historyView.style.display = isVisible ? 'none' : 'block';
            }
        });

        assetList.addEventListener('submit', e => {
            if (e.target.classList.contains('asset-item__edit-form')) {
                e.preventDefault();
                const item = e.target.closest('.asset-item');
                const assetId = parseInt(item.dataset.id, 10);
                const asset = assets.find(a => a.id === assetId);
                if (!asset) return;
                const now = new Date().toISOString();
                const newValue = parseFloat(e.target.querySelector('.edit-asset-value').value);
                asset.name = e.target.querySelector('.edit-asset-name').value;
                asset.value = newValue;
                asset.category = e.target.querySelector('.edit-asset-category').value;
                asset.lastUpdated = now;
                asset.history.push({ date: now, value: newValue, event: 'Asset Updated' });
                saveAssets(assets);
                renderAssets();
            }
        });
    }

    renderAssets();
}

if (typeof window.setupAssetEntry !== 'function') {
    window.setupAssetEntry = setupAssetEntry;
}
