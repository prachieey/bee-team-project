// dashboard.js
// Handles all dashboard calculations and rendering for SettleUp personal finance module

// Wait for the DOM content to fully load before running dashboard calculations
document.addEventListener("DOMContentLoaded", function () {
    renderDashboard();
});

// renderDashboard() - main function that loads data and orchestrates all sub-renders
function renderDashboard() {
    // Data flow: Load transactions array from LocalStorage via helper function in storage.js
    const transactions = loadData();

    displayTotalIncome(transactions);
    displayTotalExpense(transactions);
    displayBalance(transactions);
    displayCategoryBreakdown(transactions);
    displayRecentTransactions(transactions);
}

// 1. TOTAL INCOME CALCULATION
// Uses filter() to get income entries, then reduce() to sum the amounts
function calculateTotalIncome(transactions) {
    const incomeTransactions = transactions.filter(function (txn) {
        return txn.type === "income";
    });

    const totalIncome = incomeTransactions.reduce(function (accumulator, txn) {
        // Type conversion: ensure amount is treated as a Number
        return accumulator + Number(txn.amount);
    }, 0);

    return totalIncome;
}

// 2. TOTAL EXPENSE CALCULATION
// Uses filter() to get expense entries, then reduce() to sum the amounts
function calculateTotalExpense(transactions) {
    const expenseTransactions = transactions.filter(function (txn) {
        return txn.type === "expense";
    });

    const totalExpense = expenseTransactions.reduce(function (accumulator, txn) {
        // Type conversion: ensure amount is treated as a Number
        return accumulator + Number(txn.amount);
    }, 0);

    return totalExpense;
}

// 3. BALANCE CALCULATION
// Balance = Total Income - Total Expense
function calculateBalance(transactions) {
    const income = calculateTotalIncome(transactions);
    const expense = calculateTotalExpense(transactions);
    return income - expense;
}

// displayTotalIncome() - DOM Selection & Manipulation for Total Income
function displayTotalIncome(transactions) {
    const total = calculateTotalIncome(transactions);
    const incomeElement = document.getElementById("total-income");
    if (incomeElement) {
        // Template literal to format currency string
        incomeElement.textContent = `₹${total.toFixed(2)}`;
    }
}

// displayTotalExpense() - DOM Selection & Manipulation for Total Expense
function displayTotalExpense(transactions) {
    const total = calculateTotalExpense(transactions);
    const expenseElement = document.getElementById("total-expense");
    if (expenseElement) {
        // Template literal to format currency string
        expenseElement.textContent = `₹${total.toFixed(2)}`;
    }
}

// displayBalance() - DOM Selection, Conditionals, and Styling for Balance
function displayBalance(transactions) {
    const balance = calculateBalance(transactions);
    const balanceElement = document.getElementById("balance");
    const statusElement = document.getElementById("balance-status");

    // Conditionals: check if balance is positive, negative, or zero
    let statusMessage = "";
    if (balance > 0) {
        statusMessage = "Positive Balance";
        if (balanceElement) balanceElement.style.color = "#22c55e"; // green
        if (statusElement) statusElement.style.color = "#22c55e";
    } else if (balance < 0) {
        statusMessage = "Negative Balance (Deficit)";
        if (balanceElement) balanceElement.style.color = "#ef4444"; // red
        if (statusElement) statusElement.style.color = "#ef4444";
    } else {
        statusMessage = "Zero Balance";
        if (balanceElement) balanceElement.style.color = "#f1f5f9"; // neutral white
        if (statusElement) statusElement.style.color = "#94a3b8";
    }

    if (balanceElement) {
        balanceElement.textContent = `₹${balance.toFixed(2)}`;
    }
    if (statusElement) {
        statusElement.textContent = statusMessage;
    }
}

// 4. RECENT TRANSACTIONS RENDERING
// Uses slice(-5) to get the 5 latest transactions and renders dynamically
function displayRecentTransactions(transactions) {
    const container = document.getElementById("recent-transactions");
    if (!container) return;

    // Use slice(-5) to select the last 5 transactions, and reverse() to show the newest on top
    const recentTransactions = transactions.slice(-5).reverse();

    if (recentTransactions.length === 0) {
        container.innerHTML = `<p class="empty-msg">No transactions yet. <a href="expenses.html">Add one!</a></p>`;
        return;
    }

    let htmlContent = "";
    // Array iteration using forEach()
    recentTransactions.forEach(function (txn) {
        const sign = txn.type === "income" ? "+" : "-";
        const colorClass = txn.type === "income" ? "income-text" : "expense-text";
        
        // Template literal to construct table row HTML
        htmlContent += `
            <div class="txn-row">
                <div class="txn-info">
                    <span class="txn-desc">${txn.description}</span>
                    <span class="txn-meta">${txn.category} &bull; ${txn.date}</span>
                </div>
                <span class="txn-amount ${colorClass}">${sign}₹${Number(txn.amount).toFixed(2)}</span>
            </div>
        `;
    });

    container.innerHTML = htmlContent;
}

// 5. CATEGORY BREAKDOWN CALCULATION & RENDERING
// Uses filter() to get expenses, then reduce() to calculate totals grouped by category object
function displayCategoryBreakdown(transactions) {
    // Step 1: Filter expense transactions
    const expenseTransactions = transactions.filter(function (txn) {
        return txn.type === "expense";
    });

    // Step 2: Use reduce() to build an object like { Food: 1200, Travel: 800, ... }
    const categoryTotals = expenseTransactions.reduce(function (accumulator, txn) {
        const category = txn.category;
        const amount = Number(txn.amount);

        if (accumulator[category]) {
            accumulator[category] += amount;
        } else {
            accumulator[category] = amount;
        }
        return accumulator;
    }, {});

    const container = document.getElementById("category-breakdown");
    if (!container) return;

    // Object.keys() extracts all category names into an array
    const categoryNames = Object.keys(categoryTotals);

    if (categoryNames.length === 0) {
        container.innerHTML = `<p class="empty-msg">No expense categories yet.</p>`;
        return;
    }

    let htmlContent = "";
    categoryNames.forEach(function (cat) {
        htmlContent += `
            <div class="category-row">
                <span class="category-name">${cat}</span>
                <span class="category-amount">₹${categoryTotals[cat].toFixed(2)}</span>
            </div>
        `;
    });

    container.innerHTML = htmlContent;
}
