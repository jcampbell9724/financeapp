export function loadJSON(key, fallback = null) {
    if (typeof localStorage === 'undefined') {
        return fallback;
    }

    const stored = localStorage.getItem(key);
    if (stored === null) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(stored);
        return parsed ?? fallback;
    } catch (error) {
        console.error(`Failed to parse JSON from localStorage for key "${key}"`, error);
        return fallback;
    }
}

export function saveJSON(key, value) {
    if (typeof localStorage === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to save JSON to localStorage for key "${key}"`, error);
    }
}

export function ensureAssetsHavePrincipal(records) {
    if (!Array.isArray(records)) {
        return { assets: [], migrated: false };
    }

    let migrated = false;

    const normalizedAssets = records.map(asset => {
        if (!asset || typeof asset !== 'object') {
            return asset;
        }

        const normalizedAsset = { ...asset };
        let assetChanged = false;

        const rawPrincipal = normalizedAsset.principal !== undefined ? normalizedAsset.principal : normalizedAsset.value;
        const parsedPrincipal = typeof rawPrincipal === 'number' ? rawPrincipal : parseFloat(rawPrincipal);
        const normalizedPrincipal = Number.isFinite(parsedPrincipal) ? parsedPrincipal : 0;

        if (normalizedAsset.principal !== normalizedPrincipal) {
            normalizedAsset.principal = normalizedPrincipal;
            assetChanged = true;
        }

        if ('value' in normalizedAsset) {
            delete normalizedAsset.value;
            assetChanged = true;
        }

        if (Array.isArray(normalizedAsset.history)) {
            let historyChanged = false;
            const normalizedHistory = normalizedAsset.history.map(entry => {
                if (!entry || typeof entry !== 'object') {
                    return entry;
                }

                const normalizedEntry = { ...entry };
                let entryChanged = false;

                const entryRawPrincipal = normalizedEntry.principal !== undefined ? normalizedEntry.principal : normalizedEntry.value;
                const entryParsedPrincipal = typeof entryRawPrincipal === 'number' ? entryRawPrincipal : parseFloat(entryRawPrincipal);
                const entryPrincipal = Number.isFinite(entryParsedPrincipal) ? entryParsedPrincipal : 0;

                if (normalizedEntry.principal !== entryPrincipal) {
                    normalizedEntry.principal = entryPrincipal;
                    entryChanged = true;
                }

                if ('value' in normalizedEntry) {
                    delete normalizedEntry.value;
                    entryChanged = true;
                }

                if (entryChanged) {
                    historyChanged = true;
                }

                return entryChanged ? normalizedEntry : entry;
            });

            if (historyChanged) {
                normalizedAsset.history = normalizedHistory;
                assetChanged = true;
            }
        }

        if (normalizedAsset.monthlyBalances && typeof normalizedAsset.monthlyBalances === 'object' && !Array.isArray(normalizedAsset.monthlyBalances)) {
            const normalizedBalances = {};
            let balancesChanged = false;
            for (const [month, value] of Object.entries(normalizedAsset.monthlyBalances)) {
                const parsedBalance = typeof value === 'number' ? value : parseFloat(value);
                const numericBalance = Number.isFinite(parsedBalance) ? parsedBalance : 0;
                normalizedBalances[month] = numericBalance;
                if (numericBalance !== value) {
                    balancesChanged = true;
                }
            }

            if (balancesChanged) {
                normalizedAsset.monthlyBalances = normalizedBalances;
                assetChanged = true;
            }
        }

        if (assetChanged) {
            migrated = true;
        }

        return normalizedAsset;
    });

    return { assets: normalizedAssets, migrated };
}
