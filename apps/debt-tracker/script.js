import { loadJSON, saveJSON } from '../../js/utils/storage.js';

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
            if (!addDebtFormContainer) {
                return;
            }
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
            const currentMonth = now.slice(0, 7);
            const newDebt = {
                id: Date.now(),
                name: document.getElementById('debt-name').value,
                principal: principal,
                payment: parseFloat(document.getElementById('debt-payment').value),
                rate: parseFloat(document.getElementById('debt-rate').value),
                lastUpdated: now,
                monthlyBalances: { [currentMonth]: principal },
                history: [{ date: now, principal: principal, event: 'Account Created' }]
            };
            debts.push(newDebt);
            saveDebts(debts);
            renderDebtAccounts();
            debtForm.reset();
            if (addDebtFormContainer) {
                addDebtFormContainer.style.display = 'none'; // Hide form after adding
            }
            if (toggleAddFormBtn) {
                toggleAddFormBtn.textContent = '+ Add New Account';
            }
        });
    }

    // Function to load debts from localStorage
    function loadDebts() {
        return loadJSON('debts', []);
    }

    // Function to save debts to localStorage
    function saveDebts(debtsToSave) {
        saveJSON('debts', debtsToSave);
    }

    // Function to calculate debt metrics
    function calculateMetrics(debt) {
        const monthlyInterestRate = (debt.rate / 100) / 12;
        const dailyInterest = (debt.principal * (debt.rate / 100)) / 365;

        if (monthlyInterestRate === 0) {
            const paymentsLeft = Math.ceil(debt.principal / debt.payment);
            const payoffDate = new Date();
            payoffDate.setMonth(payoffDate.getMonth() + paymentsLeft);
            return {
                dailyCarryingCost: dailyInterest.toFixed(2),
                paymentsLeft: paymentsLeft,
                payoffDate: payoffDate.toLocaleDateString(),
                yearlyInterest: (dailyInterest * 365).toFixed(2)
            };
        }

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

    function getYearMonths(year) {
        const result = [];
        for (let i = 0; i < 12; i++) {
            const date = new Date(Date.UTC(year, i, 1));
            result.push(date.toISOString().slice(0, 7));
        }
        return result;
    }

    // Function to render the debt accounts
    function renderDebtAccounts() {
        if (!debtAccountsContainer) return;
        debtAccountsContainer.innerHTML = '';
        debts.forEach(debt => {
            const metrics = calculateMetrics(debt);
            const accountYear = debt.lastUpdated
                ? new Date(debt.lastUpdated).getFullYear()
                : new Date().getFullYear();
            const monthRange = getYearMonths(accountYear);
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
                    <div class="debt-account__header-actions">
                        <button class="edit-debt-btn">Edit</button>
                        <button class="delete-debt-btn">×</button>
                    </div>
                </div>
                <p><strong>Principal:</strong> $${debt.principal.toFixed(2)}</p>
                <div class="debt-account__metrics">
                    <div class="debt-account__metric">Daily Cost: $${metrics.dailyCarryingCost}</div>
                    <div class="debt-account__metric">Payments Left: ${metrics.paymentsLeft}</div>
                    <div class="debt-account__metric">Yearly Interest: $${metrics.yearlyInterest}</div>
                    <div class="debt-account__metric">Payoff Date: ${metrics.payoffDate}</div>
                </div>
                <div class="debt-account__monthly-balances">
                    <h4>Monthly Balances</h4>
                    <table class="debt-account__monthly-table">
                        <tr>
                            ${monthRange.map(m => `<th>${m}</th>`).join('')}
                        </tr>
                        <tr>
                            ${monthRange.map(m => `<td>$${(debt.monthlyBalances && debt.monthlyBalances[m] ? debt.monthlyBalances[m] : 0).toFixed(2)}</td>`).join('')}
                        </tr>
                    </table>
                </div>
                <form class="debt-account__edit-form" style="display:none">
                    <input class="form-input edit-debt-name" type="text" value="${debt.name}" required>
                    <input class="form-input edit-debt-principal" type="number" value="${debt.principal}" step="0.01" required>
                    <input class="form-input edit-debt-month" type="month" value="${new Date().toISOString().slice(0,7)}" required>
                    <input class="form-input edit-debt-payment" type="number" value="${debt.payment}" step="0.01" required>
                    <input class="form-input edit-debt-rate" type="number" value="${debt.rate}" step="0.01" required>
                    <button class="button primary-button save-debt-btn" type="submit">Save</button>
                    <button class="button secondary-button cancel-edit-btn" type="button">Cancel</button>
                </form>
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

            const debtId = parseInt(card.dataset.id, 10);


            // Ignore clicks inside the inline edit form so the history doesn't toggle
            if (e.target.closest('.debt-account__edit-form')) {
                return;
            }


            // Handle delete button clicks
            if (e.target.classList.contains('delete-debt-btn')) {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this account?')) {
                    debts = debts.filter(d => d.id !== debtId);
                    saveDebts(debts);
                    renderDebtAccounts();
                }
                return;
            }

            // Toggle edit form
            if (e.target.classList.contains('edit-debt-btn')) {
                e.stopPropagation();
                const form = card.querySelector('.debt-account__edit-form');
                if (form) {
                    form.style.display = form.style.display === 'block' ? 'none' : 'block';
                }
                return;
            }

            // Cancel edit
            if (e.target.classList.contains('cancel-edit-btn')) {
                e.preventDefault();
                const form = card.querySelector('.debt-account__edit-form');

                if (form) {
                    const debt = debts.find(d => d.id === debtId);
                    if (debt) {
                        form.querySelector('.edit-debt-name').value = debt.name;
                        form.querySelector('.edit-debt-principal').value = debt.principal;
                        form.querySelector('.edit-debt-payment').value = debt.payment;
                        form.querySelector('.edit-debt-rate').value = debt.rate;
                        form.querySelector('.edit-debt-month').value = new Date().toISOString().slice(0, 7);
                    }
                    form.style.display = 'none';
                }

                return;
            }

            // Handle toggling the history view for the whole card
            const historyView = card.querySelector('.debt-account__history');
            if (historyView) {
                const isVisible = historyView.style.display === 'block';
                historyView.style.display = isVisible ? 'none' : 'block';
            }
        });

        // Handle save on edit form submission
        debtAccountsContainer.addEventListener('submit', (e) => {
            if (e.target.classList.contains('debt-account__edit-form')) {
                e.preventDefault();
                const card = e.target.closest('.debt-account');
                const debtId = parseInt(card.dataset.id, 10);
                const debt = debts.find(d => d.id === debtId);
                if (!debt) return;
                const newPrincipal = parseFloat(e.target.querySelector('.edit-debt-principal').value);
                const monthInput = e.target.querySelector('.edit-debt-month').value;
                const month = monthInput || new Date().toISOString().slice(0, 7);
                const updateDate = new Date(month + '-01').toISOString();
                debt.name = e.target.querySelector('.edit-debt-name').value;
                debt.principal = newPrincipal;
                debt.payment = parseFloat(e.target.querySelector('.edit-debt-payment').value);
                debt.rate = parseFloat(e.target.querySelector('.edit-debt-rate').value);
                debt.lastUpdated = updateDate;
                debt.monthlyBalances = debt.monthlyBalances || {};
                debt.monthlyBalances[month] = newPrincipal;
                debt.history.push({ date: updateDate, principal: newPrincipal, event: 'Account Updated' });
                saveDebts(debts);
                renderDebtAccounts();
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

