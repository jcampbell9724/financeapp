function setupBudgetPlanner() {
    const budgetForm = document.getElementById('budget-form');
    const budgetList = document.getElementById('budget-list');
    let budgets = loadBudgets();

    function loadBudgets() {
        return JSON.parse(localStorage.getItem('budgets')) || [];
    }

    function saveBudgets(newBudgets) {
        localStorage.setItem('budgets', JSON.stringify(newBudgets));
    }

    function renderBudgets() {
        if (!budgetList) return;
        budgetList.innerHTML = '';
        budgets.forEach(b => {
            const item = document.createElement('div');
            item.className = 'budget-item';
            item.dataset.id = b.id;
            item.innerHTML = `
                <span>${b.category}: $${b.amount.toFixed(2)}</span>
                <button class="delete-budget-btn">Delete</button>
            `;
            budgetList.appendChild(item);
        });
    }

    if (budgetForm) {
        budgetForm.addEventListener('submit', e => {
            e.preventDefault();
            const category = document.getElementById('budget-category').value;
            const amount = parseFloat(document.getElementById('budget-amount').value);
            const newBudget = {
                id: Date.now(),
                category: category,
                amount: amount
            };
            budgets.push(newBudget);
            saveBudgets(budgets);
            renderBudgets();
            budgetForm.reset();
        });
    }

    if (budgetList) {
        budgetList.addEventListener('click', e => {
            if (e.target.classList.contains('delete-budget-btn')) {
                const id = parseInt(e.target.parentElement.dataset.id, 10);
                budgets = budgets.filter(b => b.id !== id);
                saveBudgets(budgets);
                renderBudgets();
            }
        });
    }

    renderBudgets();
}

if (typeof window.setupBudgetPlanner !== 'function') {
    window.setupBudgetPlanner = setupBudgetPlanner;
}
