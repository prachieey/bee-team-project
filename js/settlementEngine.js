// ==========================================
// SETTLEUP SETTLEMENT ENGINE
// Built by Rishab
// ==========================================
//
// This section demonstrates the settlement algorithm on a
// seeded demo group ("Goa Trip") so the greedy minimal-
// transaction logic can be shown end-to-end for the eval,
// independent of whatever is in a single browser's
// personal transaction history.
//
// Data shape matches the roadmap's Expense model:
// { paidBy, amount, participants: [{ userId, share }] }


// ==========================================
// 1. SEED DATA
// ==========================================

const DEMO_MEMBERS = [
    "Prachi",
    "Rishab",
    "Sanchita",
    "Piyanshi"
];

const DEMO_EXPENSES = [

    {
        title: "Hotel booking",
        paidBy: "Prachi",
        amount: 4000,
        participants: [
            { userId: "Prachi", share: 1000 },
            { userId: "Rishab", share: 1000 },
            { userId: "Sanchita", share: 1000 },
            { userId: "Piyanshi", share: 1000 }
        ]
    },

    {
        title: "Dinner",
        paidBy: "Rishab",
        amount: 1600,
        participants: [
            { userId: "Prachi", share: 400 },
            { userId: "Rishab", share: 400 },
            { userId: "Sanchita", share: 400 },
            { userId: "Piyanshi", share: 400 }
        ]
    },

    {
        title: "Cab fare",
        paidBy: "Sanchita",
        amount: 800,
        participants: [
            { userId: "Prachi", share: 200 },
            { userId: "Rishab", share: 200 },
            { userId: "Sanchita", share: 200 },
            { userId: "Piyanshi", share: 200 }
        ]
    }

];


// ==========================================
// 2. NET BALANCES
// ==========================================
// Positive balance = paid more than their share -> gets money back
// Negative balance = paid less than their share -> owes money

function calculateNetBalances(expenses, members) {

    const balances = {};

    members.forEach(function (member) {
        balances[member] = 0;
    });

    expenses.forEach(function (expense) {

        if (!balances.hasOwnProperty(expense.paidBy)) {
            balances[expense.paidBy] = 0;
        }

        balances[expense.paidBy] += Number(expense.amount);

        expense.participants.forEach(function (participant) {

            if (!balances.hasOwnProperty(participant.userId)) {
                balances[participant.userId] = 0;
            }

            balances[participant.userId] -= Number(participant.share);

        });

    });

    return balances;

}


// ==========================================
// 3. GREEDY MINIMAL SETTLEMENT
// ==========================================
// Matches at most every debtor to a creditor once each round,
// so an N-person group settles in at most N-1 transactions.

function computeSettlement(balances) {

    const creditors = Object.entries(balances)
        .filter(function (entry) { return entry[1] > 0.01; })
        .sort(function (a, b) { return b[1] - a[1]; });

    const debtors = Object.entries(balances)
        .filter(function (entry) { return entry[1] < -0.01; })
        .sort(function (a, b) { return a[1] - b[1]; });

    const transactions = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {

        const debtor = debtors[i];
        const creditor = creditors[j];

        const amount = Math.min(-debtor[1], creditor[1]);

        transactions.push({
            from: debtor[0],
            to: creditor[0],
            amount: Number(amount.toFixed(2))
        });

        debtor[1] += amount;
        creditor[1] -= amount;

        if (Math.abs(debtor[1]) < 0.01) i++;
        if (Math.abs(creditor[1]) < 0.01) j++;

    }

    return transactions;

}


// ==========================================
// 4. RENDER
// ==========================================

function renderBalances(balances) {

    const container = document.getElementById("balances-list");

    if (!container) return;

    container.innerHTML = "";

    Object.entries(balances).forEach(function (entry) {

        const name = entry[0];
        const amount = entry[1];

        const row = document.createElement("div");
        row.className = "result-row";

        let statusLabel;

        if (amount > 0.01) {
            statusLabel = "gets back ₹" + amount.toFixed(2);
        } else if (amount < -0.01) {
            statusLabel = "owes ₹" + Math.abs(amount).toFixed(2);
        } else {
            statusLabel = "settled";
        }

        row.innerHTML =
            "<span>" + name + "</span><strong>" + statusLabel + "</strong>";

        container.appendChild(row);

    });

}


function renderSettlement(transactions) {

    const container = document.getElementById("settlement-result");

    if (!container) return;

    container.innerHTML = "";

    if (transactions.length === 0) {

        container.innerHTML = "<p>Everyone is already settled up.</p>";
        return;

    }

    transactions.forEach(function (txn) {

        const row = document.createElement("div");
        row.className = "result-row";

        row.innerHTML =
            "<span>" + txn.from + " pays " + txn.to + "</span>" +
            "<strong>₹" + txn.amount.toFixed(2) + "</strong>";

        container.appendChild(row);

    });

}


// ==========================================
// 5. RUN
// ==========================================

function runSettlement() {

    const balances = calculateNetBalances(DEMO_EXPENSES, DEMO_MEMBERS);
    const transactions = computeSettlement(balances);

    renderBalances(balances);
    renderSettlement(transactions);

}


document.addEventListener("DOMContentLoaded", function () {

    const button = document.getElementById("runSettlementButton");

    if (button) {
        button.addEventListener("click", runSettlement);
    }

    // Show balances immediately on load so the section isn't empty
    renderBalances(calculateNetBalances(DEMO_EXPENSES, DEMO_MEMBERS));

});