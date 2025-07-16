function setupAssetEntry() {
    const assetForm = document.getElementById('asset-form');
    const assetList = document.getElementById('asset-list');
    let assets = loadAssets();

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
            item.innerHTML = `
                <span>${asset.name}: $${asset.value.toFixed(2)}</span>
                <button class="delete-asset-btn" data-id="${asset.id}">Delete</button>
            `;
            assetList.appendChild(item);
        });
    }

    if (assetForm) {
        assetForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('asset-name').value;
            const value = parseFloat(document.getElementById('asset-value').value);
            const newAsset = { id: Date.now(), name: name, value: value };
            assets.push(newAsset);
            saveAssets(assets);
            renderAssets();
            assetForm.reset();
        });
    }

    if (assetList) {
        assetList.addEventListener('click', e => {
            if (e.target.classList.contains('delete-asset-btn')) {
                const id = parseInt(e.target.dataset.id, 10);
                assets = assets.filter(a => a.id !== id);
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
