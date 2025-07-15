// --- DEBT TRACKER LOGIC ---
function setupDebtTracker(sharedData) {
    console.log('Setting up Debt Tracker...');
    const debtForm = document.getElementById('debt-form');
    const debtAccountsContainer = document.getElementById('debt-accounts-container');
    const toggleAddFormBtn = document.getElementById('toggle-add-form-btn');
    const addDebtFormContainer = document.getElementById('add-debt-form-container');

    let debts = loadDebts();

    // Toggle the "Add New Account" form
    if (toggleAddFormBtn) {
        toggleAddFormBtn.addEventListener('click', () => {
            const isVisible = addDebtFormContainer.style.display === 'block';
            addDebtFormContainer.style.display = isVisible ? 'none' : 'block';
            toggleAddFormBtn.textContent = isVisible ? '+ Add New Account' : '− Close Form';
        });
    }

    // Handle form submission for adding a new debt
    if (debtForm) {
        debtForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const now = new Date().toISOString();
            const principal = parseFloat(document.getElementById('debt-principal').value);
            const newDebt = {
                id: Date.now(),
                name: document.getElementById('debt-name').value,
                principal: principal,
                payment: parseFloat(document.getElementById('debt-payment').value),
                rate: parseFloat(document.getElementById('debt-rate').value),
                lastUpdated: now,
                history: [{ date: now, principal: principal, event: 'Account Created' }]
            };
            debts.push(newDebt);
            saveDebts(debts);
            renderDebtAccounts();
            debtForm.reset();
            addDebtFormContainer.style.display = 'none'; // Hide form after adding
            toggleAddFormBtn.textContent = '+ Add New Account';
        });
    }

    // Function to load debts from localStorage
    function loadDebts() {
        return JSON.parse(localStorage.getItem('debts')) || [];
    }

    // Function to save debts to localStorage
    function saveDebts(debtsToSave) {
        localStorage.setItem('debts', JSON.stringify(debtsToSave));
    }

    // Function to calculate debt metrics
    function calculateMetrics(debt) {
        const monthlyInterestRate = (debt.rate / 100) / 12;
        const dailyInterest = (debt.principal * (debt.rate / 100)) / 365;

        if (debt.payment <= debt.principal * monthlyInterestRate) {
            return {
                dailyCarryingCost: dailyInterest.toFixed(2),
                paymentsLeft: 'Infinite',
                payoffDate: 'Never',
                yearlyInterest: (dailyInterest * 365).toFixed(2)
            };
        }

        const n = -Math.log(1 - (debt.principal * monthlyInterestRate) / debt.payment) / Math.log(1 + monthlyInterestRate);
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

    // Function to render the debt accounts
    function renderDebtAccounts() {
        if (!debtAccountsContainer) return;
        debtAccountsContainer.innerHTML = '';
        debts.forEach(debt => {
            const metrics = calculateMetrics(debt);
            const accountCard = document.createElement('div');
            accountCard.className = 'debt-account';
            accountCard.dataset.id = debt.id;

            // Check if the account is stale (not updated in over a month)
            const lastUpdated = new Date(debt.lastUpdated);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            if (lastUpdated < oneMonthAgo) {
                accountCard.classList.add('debt-account--stale');
            }

            accountCard.innerHTML = `
                <div class="debt-account__header">
                    <h3>${debt.name}</h3>
                    <button class="delete-debt-btn">×</button>
                </div>
                <p><strong>Principal:</strong> $${debt.principal.toFixed(2)}</p>
                <div class="debt-account__metrics">
                    <div class="debt-account__metric">Daily Cost: $${metrics.dailyCarryingCost}</div>
                    <div class="debt-account__metric">Payments Left: ${metrics.paymentsLeft}</div>
                    <div class="debt-account__metric">Yearly Interest: $${metrics.yearlyInterest}</div>
                    <div class="debt-account__metric">Payoff Date: ${metrics.payoffDate}</div>
                </div>
                <div class="debt-account__footer">
                    Last updated: ${new Date(debt.lastUpdated).toLocaleDateString()}
                </div>
                <div class="debt-account__history">
                    <h4>Update History</h4>
                    <ul class="debt-account__history-list">
                        ${debt.history.map(entry => `
                            <li class="debt-account__history-item">
                                ${new Date(entry.date).toLocaleDateString()}: ${entry.event} - $${entry.principal.toFixed(2)}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            debtAccountsContainer.appendChild(accountCard);
        });
    }

    // Event delegation for handling clicks within the accounts container
    if (debtAccountsContainer) {
        debtAccountsContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.debt-account');
            if (!card) return;

            // Handle delete button clicks
            if (e.target.classList.contains('delete-debt-btn')) {
                e.stopPropagation(); // Prevent the card's main click event
                const debtId = parseInt(card.dataset.id, 10);
                if (confirm('Are you sure you want to delete this account?')) {
                    debts = debts.filter(d => d.id !== debtId);
                    saveDebts(debts);
                    renderDebtAccounts();
                }
                return; // Stop further processing
            }

            // Handle toggling the history view for the whole card
            const historyView = card.querySelector('.debt-account__history');
            if (historyView) {
                const isVisible = historyView.style.display === 'block';
                historyView.style.display = isVisible ? 'none' : 'block';
            }
        });
    }

    // Initial render
    renderDebtAccounts();
}

// Check if the function is already defined to avoid re-running on script load
if (typeof window.setupDebtTracker !== 'function') {
    window.setupDebtTracker = setupDebtTracker;
}

