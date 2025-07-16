function setupCoveredCallTracker() {
    const positionForm = document.getElementById('cc-position-form');
    const positionList = document.getElementById('cc-position-list');
    let positions = loadPositions();

    function loadPositions() {
        return JSON.parse(localStorage.getItem('coveredCallPositions')) || [];
    }

    function savePositions(newPositions) {
        localStorage.setItem('coveredCallPositions', JSON.stringify(newPositions));
    }

    function calculateMetrics(position) {
        const totalPremium = position.calls.reduce((sum, c) => sum + parseFloat(c.premium), 0);
        const adjustedBasis = (position.basis - totalPremium) / position.shares;
        return { totalPremium, adjustedBasis };
    }

    function renderPositions() {
        if (!positionList) return;
        positionList.innerHTML = '';
        positions.forEach(p => {
            const metrics = calculateMetrics(p);
            const item = document.createElement('div');
            item.className = 'cc-position-item';
            item.dataset.id = p.id;
            item.innerHTML = `
                <div class="cc-position-header">
                    <span>${p.ticker} - ${p.shares} shares</span>
                    <div>
                        <button class="add-call-btn">Add Call</button>
                        <button class="delete-position-btn">Delete</button>
                    </div>
                </div>
                <p><strong>Basis:</strong> $${p.basis.toFixed(2)}</p>
                <p><strong>Total Premium:</strong> $${metrics.totalPremium.toFixed(2)}</p>
                <p><strong>Adjusted Cost/Share:</strong> $${metrics.adjustedBasis.toFixed(2)}</p>
                <h4>Calls</h4>
                <ul class="cc-call-list">
                    ${p.calls.map(c => `
                        <li data-call-id="${c.id}">
                            $${c.strike} @ $${c.premium} exp ${c.expiry}
                            <button class="delete-call-btn">Delete</button>
                        </li>
                    `).join('')}
                </ul>
                <form class="cc-add-call-form">
                    <input type="number" class="cc-call-strike" placeholder="Strike" step="0.01" required>
                    <input type="number" class="cc-call-premium" placeholder="Premium" step="0.01" required>
                    <input type="date" class="cc-call-expiry" required>
                    <button type="submit">Save</button>
                    <button type="button" class="cancel-add-call-btn">Cancel</button>
                </form>
            `;
            positionList.appendChild(item);
        });
    }

    if (positionForm) {
        positionForm.addEventListener('submit', e => {
            e.preventDefault();
            const ticker = document.getElementById('cc-ticker').value.trim();
            const basis = parseFloat(document.getElementById('cc-basis').value);
            const shares = parseInt(document.getElementById('cc-shares').value, 10);
            const strikeVal = document.getElementById('cc-strike').value;
            const premiumVal = document.getElementById('cc-premium').value;
            const expiryVal = document.getElementById('cc-expiry').value;
            const newPosition = {
                id: Date.now(),
                ticker: ticker,
                basis: basis,
                shares: shares,
                calls: []
            };
            if (strikeVal && premiumVal && expiryVal) {
                newPosition.calls.push({
                    id: Date.now() + 1,
                    strike: parseFloat(strikeVal),
                    premium: parseFloat(premiumVal),
                    expiry: expiryVal
                });
            }
            positions.push(newPosition);
            savePositions(positions);
            renderPositions();
            positionForm.reset();
        });
    }

    if (positionList) {
        positionList.addEventListener('click', e => {
            const item = e.target.closest('.cc-position-item');
            if (!item) return;
            const posId = parseInt(item.dataset.id, 10);
            const position = positions.find(p => p.id === posId);
            if (!position) return;

            if (e.target.classList.contains('add-call-btn')) {
                const form = item.querySelector('.cc-add-call-form');
                if (form) {
                    form.style.display = form.style.display === 'block' ? 'none' : 'block';
                }
                return;
            }

            if (e.target.classList.contains('cancel-add-call-btn')) {
                const form = e.target.closest('.cc-add-call-form');
                if (form) form.style.display = 'none';
                return;
            }

            if (e.target.classList.contains('delete-position-btn')) {
                if (confirm('Delete this position?')) {
                    positions = positions.filter(p => p.id !== posId);
                    savePositions(positions);
                    renderPositions();
                }
                return;
            }

            if (e.target.classList.contains('delete-call-btn')) {
                const callId = parseInt(e.target.parentElement.dataset.callId, 10);
                position.calls = position.calls.filter(c => c.id !== callId);
                savePositions(positions);
                renderPositions();
            }
        });

        positionList.addEventListener('submit', e => {
            if (e.target.classList.contains('cc-add-call-form')) {
                e.preventDefault();
                const item = e.target.closest('.cc-position-item');
                const posId = parseInt(item.dataset.id, 10);
                const position = positions.find(p => p.id === posId);
                if (!position) return;
                position.calls.push({
                    id: Date.now(),
                    strike: parseFloat(e.target.querySelector('.cc-call-strike').value),
                    premium: parseFloat(e.target.querySelector('.cc-call-premium').value),
                    expiry: e.target.querySelector('.cc-call-expiry').value
                });
                savePositions(positions);
                renderPositions();
            }
        });
    }

    renderPositions();
}

if (typeof window.setupCoveredCallTracker !== 'function') {
    window.setupCoveredCallTracker = setupCoveredCallTracker;
}
