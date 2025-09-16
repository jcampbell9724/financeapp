import { loadJSON, saveJSON } from '../../js/utils/storage.js';

function setupSavingsGoal() {
    const goalForm = document.getElementById('goal-form');
    const contributionForm = document.getElementById('contribution-form');
    const goalProgress = document.getElementById('goal-progress');
    let goalData = loadGoal();

    function loadGoal() {
        return loadJSON('savingsGoal', { goal: 0, saved: 0 });
    }

    function saveGoal(data) {
        saveJSON('savingsGoal', data);
    }

    function renderProgress() {
        if (!goalProgress) return;
        if (goalData.goal === 0) {
            goalProgress.textContent = 'No goal set.';
            contributionForm.style.display = 'none';
            return;
        }
        const percent = ((goalData.saved / goalData.goal) * 100).toFixed(2);
        goalProgress.textContent = `Saved $${goalData.saved.toFixed(2)} of $${goalData.goal.toFixed(2)} (${percent}%)`;
        contributionForm.style.display = 'block';
    }

    if (goalForm) {
        goalForm.addEventListener('submit', e => {
            e.preventDefault();
            goalData.goal = parseFloat(document.getElementById('goal-amount').value);
            goalData.saved = 0;
            saveGoal(goalData);
            renderProgress();
            goalForm.reset();
        });
    }

    if (contributionForm) {
        contributionForm.addEventListener('submit', e => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('contribution-amount').value);
            goalData.saved += amount;
            saveGoal(goalData);
            renderProgress();
            contributionForm.reset();
        });
    }

    renderProgress();
}

if (typeof window.setupSavingsGoal !== 'function') {
    window.setupSavingsGoal = setupSavingsGoal;
}
