import { loadJSON, saveJSON } from '../../js/utils/storage.js';

function setupFinancialSummary() {
    const assets = loadJSON('assets', []);
    const debts = loadJSON('debts', []);

    const totalAssets = assets.reduce((sum, a) => sum + parseFloat(a.principal || a.value || 0), 0);
    const totalDebt = debts.reduce((sum, d) => sum + parseFloat(d.principal || 0), 0);
    const netWorth = totalAssets - totalDebt;

    document.getElementById('total-assets').textContent = `Total Assets: $${totalAssets.toFixed(2)}`;
    document.getElementById('total-debt').textContent = `Total Debt: $${totalDebt.toFixed(2)}`;
    document.getElementById('net-worth').textContent = `Net Worth: $${netWorth.toFixed(2)}`;

    const currentMonth = new Date().toISOString().slice(0, 7);
    let snapshots = loadJSON('financialSnapshots', []);
    const existing = snapshots.find(s => s.month === currentMonth);
    if (existing) {
        existing.totalAssets = totalAssets;
        existing.totalDebt = totalDebt;
    } else {
        snapshots.push({ month: currentMonth, totalAssets, totalDebt });
    }
    saveJSON('financialSnapshots', snapshots);

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

    const monthSet = new Set();
    assets.forEach(a => Object.keys(a.monthlyBalances || {}).forEach(m => monthSet.add(m)));
    debts.forEach(d => Object.keys(d.monthlyBalances || {}).forEach(m => monthSet.add(m)));
    snapshots.forEach(s => monthSet.add(s.month));
    const months = Array.from(monthSet).sort();

    const table = document.getElementById('summary-table');
    table.innerHTML = '';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Account</th>' + months.map(m => `<th>${m}</th>`).join('');
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    assets.forEach(asset => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${asset.name}</td>` +
            months.map(m => {
                const val = asset.monthlyBalances && asset.monthlyBalances[m];
                return `<td>${val !== undefined ? '$' + parseFloat(val).toFixed(2) : '-'}</td>`;
            }).join('');
        tbody.appendChild(row);
    });

    const assetTotals = months.map(m => assets.reduce((sum, a) => sum + parseFloat((a.monthlyBalances && a.monthlyBalances[m]) || 0), 0));
    const assetTotalRow = document.createElement('tr');
    assetTotalRow.className = 'subtotal';
    assetTotalRow.innerHTML = '<td><strong>Total Assets</strong></td>' +
        assetTotals.map(v => `<td><strong>$${v.toFixed(2)}</strong></td>`).join('');
    tbody.appendChild(assetTotalRow);

    debts.forEach(debt => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${debt.name}</td>` +
            months.map(m => {
                const val = debt.monthlyBalances && debt.monthlyBalances[m];
                return `<td>${val !== undefined ? '$' + parseFloat(val).toFixed(2) : '-'}</td>`;
            }).join('');
        tbody.appendChild(row);
    });

    const debtTotals = months.map(m => debts.reduce((sum, d) => sum + parseFloat((d.monthlyBalances && d.monthlyBalances[m]) || 0), 0));
    const debtTotalRow = document.createElement('tr');
    debtTotalRow.className = 'subtotal';
    debtTotalRow.innerHTML = '<td><strong>Total Debt</strong></td>' +
        debtTotals.map(v => `<td><strong>$${v.toFixed(2)}</strong></td>`).join('');
    tbody.appendChild(debtTotalRow);

    const netWorthRow = document.createElement('tr');
    netWorthRow.innerHTML = '<td><strong>Net Worth</strong></td>' +
        months.map((_, i) => `<td><strong>$${(assetTotals[i] - debtTotals[i]).toFixed(2)}</strong></td>`).join('');
    tbody.appendChild(netWorthRow);

    table.appendChild(tbody);

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
