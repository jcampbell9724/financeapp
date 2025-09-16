import { loadJSON, saveJSON } from '../../js/utils/storage.js';

function setupExpenseTracker() {
    const expenseForm = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    let expenses = loadExpenses();

    function loadExpenses() {
        return loadJSON('expenses', []);
    }

    function saveExpenses(data) {
        saveJSON('expenses', data);
    }

    function renderExpenses() {
        if (!expenseList) return;
        expenseList.innerHTML = '';
        expenses.forEach(exp => {
            const item = document.createElement('div');
            item.className = 'expense-item';
            item.dataset.id = exp.id;
            item.innerHTML = `
                <span>${exp.category} - ${exp.description}: $${exp.amount.toFixed(2)}</span>
                <button class="delete-expense-btn">Delete</button>
            `;
            expenseList.appendChild(item);
        });
    }

    if (expenseForm) {
        expenseForm.addEventListener('submit', e => {
            e.preventDefault();
            const description = document.getElementById('expense-desc').value;
            const amount = parseFloat(document.getElementById('expense-amount').value);
            const category = document.getElementById('expense-category').value;
            const newExpense = {
                id: Date.now(),
                description: description,
                amount: amount,
                category: category
            };
            expenses.push(newExpense);
            saveExpenses(expenses);
            renderExpenses();
            expenseForm.reset();
        });
    }

    if (expenseList) {
        expenseList.addEventListener('click', e => {
            if (e.target.classList.contains('delete-expense-btn')) {
                const id = parseInt(e.target.parentElement.dataset.id, 10);
                expenses = expenses.filter(ex => ex.id !== id);
                saveExpenses(expenses);
                renderExpenses();
            }
        });
    }

    renderExpenses();
}

if (typeof window.setupExpenseTracker !== 'function') {
    window.setupExpenseTracker = setupExpenseTracker;
}
