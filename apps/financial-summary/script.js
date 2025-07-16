function setupFinancialSummary() {
    const assets = JSON.parse(localStorage.getItem('assets')) || [];
    const debts = JSON.parse(localStorage.getItem('debts')) || [];

    const totalAssets = assets.reduce((sum, a) => sum + parseFloat(a.value || 0), 0);
    const totalDebt = debts.reduce((sum, d) => sum + parseFloat(d.principal || 0), 0);
    const netWorth = totalAssets - totalDebt;

    document.getElementById('total-assets').textContent = `Total Assets: $${totalAssets.toFixed(2)}`;
    document.getElementById('total-debt').textContent = `Total Debt: $${totalDebt.toFixed(2)}`;
    document.getElementById('net-worth').textContent = `Net Worth: $${netWorth.toFixed(2)}`;

    const currentMonth = new Date().toISOString().slice(0, 7);
    let snapshots = JSON.parse(localStorage.getItem('financialSnapshots')) || [];
    const existing = snapshots.find(s => s.month === currentMonth);
    if (existing) {
        existing.totalAssets = totalAssets;
        existing.totalDebt = totalDebt;
    } else {
        snapshots.push({ month: currentMonth, totalAssets, totalDebt });
    }
    localStorage.setItem('financialSnapshots', JSON.stringify(snapshots));

    let assetChange = 'N/A';
    let debtChange = 'N/A';
    if (snapshots.length > 1) {
        const prev = snapshots[snapshots.length - 2];
        if (prev.totalAssets) {
            assetChange = (((totalAssets - prev.totalAssets) / prev.totalAssets) * 100).toFixed(2) + '%';
        }
        if (prev.totalDebt) {
            debtChange = (((totalDebt - prev.totalDebt) / prev.totalDebt) * 100).toFixed(2) + '%';
        }
    }
    document.getElementById('asset-change').textContent = `Assets MoM: ${assetChange}`;
    document.getElementById('debt-change').textContent = `Debt MoM: ${debtChange}`;

    const ctx = document.getElementById('summary-chart');
    const labels = snapshots.map(s => s.month);
    const assetData = snapshots.map(s => s.totalAssets);
    const debtData = snapshots.map(s => s.totalDebt);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Assets',
                    data: assetData,
                    borderColor: 'green',
                    fill: false
                },
                {
                    label: 'Debt',
                    data: debtData,
                    borderColor: 'red',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

if (typeof window.setupFinancialSummary !== 'function') {
    window.setupFinancialSummary = setupFinancialSummary;
}
