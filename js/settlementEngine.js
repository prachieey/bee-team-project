// ==========================================
// SETTLEMENT ENGINE
// ==========================================


// ==========================================
// 1. CALCULATE NET BALANCES
// ==========================================

function calculateNetBalances(expenses, members) {

    const balances = {};

    // Start every member with balance 0
    members.forEach(member => {
        balances[member] = 0;
    });

    // Process every expense
    expenses.forEach(expense => {

        // Person who paid gets credit
        if (!balances.hasOwnProperty(expense.paidBy)) {
            balances[expense.paidBy] = 0;
        }

        balances[expense.paidBy] += Number(expense.amount);

        // Each participant owes their share
        if (Array.isArray(expense.participants)) {

            expense.participants.forEach(participant => {

                if (!balances.hasOwnProperty(participant.userId)) {
                    balances[participant.userId] = 0;
                }

                balances[participant.userId] -= Number(
                    participant.share
                );

            });
        }
    });

    return balances;
}


// ==========================================
// 2. COMPUTE SETTLEMENT
// ==========================================

function computeSettlement(balances) {

    const creditors = Object.entries(balances)
        .filter(([, balance]) => balance > 0);

    const debtors = Object.entries(balances)
        .filter(([, balance]) => balance < 0);

    // Largest creditors first
    creditors.sort((a, b) => b[1] - a[1]);

    // Largest debtors first
    debtors.sort((a, b) => a[1] - b[1]);

    const transactions = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {

        const [debtor, debtAmount] = debtors[i];
        const [creditor, creditAmount] = creditors[j];

        const amount = Math.min(
            -debtAmount,
            creditAmount
        );

        transactions.push({
            from: debtor,
            to: creditor,
            amount: amount
        });

        debtors[i][1] += amount;
        creditors[j][1] -= amount;

        if (debtors[i][1] === 0) {
            i++;
        }

        if (creditors[j][1] === 0) {
            j++;
        }
    }

    return transactions;
}


// ==========================================
// 3. DISPLAY SETTLEMENTS
// ==========================================

function displaySettlements(transactions) {

    const container = document.getElementById(
        "settlement-list"
    );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (transactions.length === 0) {

        container.innerHTML =
            "<p>Everyone is settled!</p>";

        return;
    }

    transactions.forEach(transaction => {

        const item = document.createElement("div");

        item.className = "settlement-item";

        item.innerHTML = `
            <strong>${transaction.from}</strong>
            pays
            <strong>${transaction.to}</strong>
            ₹${transaction.amount}
        `;

        container.appendChild(item);
    });
}


// ==========================================
// 4. LOAD REAL EXPENSE DATA
// ==========================================

function loadExpenses() {

    const storedExpenses =
        localStorage.getItem("settleup_expenses");

    if (!storedExpenses) {
        return [];
    }

    try {

        const expenses = JSON.parse(storedExpenses);

        return Array.isArray(expenses)
            ? expenses
            : [];

    } catch (error) {

        console.error(
            "Unable to read expenses:",
            error
        );

        return [];
    }
}


// ==========================================
// 5. GET MEMBERS FROM EXPENSE DATA
// ==========================================

function getMembers(expenses) {

    const members = new Set();

    expenses.forEach(expense => {

        if (expense.paidBy) {
            members.add(expense.paidBy);
        }

        if (Array.isArray(expense.participants)) {

            expense.participants.forEach(participant => {

                if (participant.userId) {
                    members.add(participant.userId);
                }

            });
        }
    });

    return [...members];
}


// ==========================================
// 6. RUN SETTLEMENT
// ==========================================

function runSettlement() {

    const expenses = loadExpenses();

    // No expenses yet
// No expenses yet
if (expenses.length === 0) {

    const container = document.getElementById(
        "settlement-list"
    );

    if (container) {
        container.innerHTML =
            "<p>No expenses available yet.</p>";
    }

    console.log("No expenses found.");

    return;
}

    const members = getMembers(expenses);

    const netBalances =
        calculateNetBalances(
            expenses,
            members
        );

    const transactions =
        computeSettlement(netBalances);

    console.log("Expenses:");
    console.log(expenses);

    console.log("Members:");
    console.log(members);

    console.log("Net Balances:");
    console.log(netBalances);

    console.log("Settlement:");
    console.log(transactions);

    displaySettlements(transactions);
}


// ==========================================
// 7. START
// ==========================================

runSettlement();