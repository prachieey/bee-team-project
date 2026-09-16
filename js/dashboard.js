document.addEventListener("DOMContentLoaded", function () {
    renderDashboard();
});


function renderDashboard() {
   
    const transactions = loadData();

    displayTotalIncome(transactions);
    displayTotalExpense(transactions);
    displayBalance(transactions);
    displayCategoryBreakdown(transactions);
    displayRecentTransactions(transactions);
}


function calculateTotalIncome(transactions) {
    const incomeTransactions = transactions.filter(function (txn) {
        return txn.type === "income";
    });

    const totalIncome = incomeTransactions.reduce(function (accumulator, txn) {
        
        return accumulator + Number(txn.amount);
    }, 0);

    return totalIncome;
}


function calculateTotalExpense(transactions) {
    const expenseTransactions = transactions.filter(function (txn) {
        return txn.type === "expense";
    });

    const totalExpense = expenseTransactions.reduce(function (accumulator, txn) {
        
        return accumulator + Number(txn.amount);
    }, 0);

    return totalExpense;
}

function calculateBalance(transactions) {
    const income = calculateTotalIncome(transactions);
    const expense = calculateTotalExpense(transactions);
    return income - expense;
}


function displayTotalIncome(transactions) {
    const total = calculateTotalIncome(transactions);
    const incomeElement = document.getElementById("total-income");
    if (incomeElement) {
       
        incomeElement.textContent = `₹${total.toFixed(2)}`;
    }
}


function displayTotalExpense(transactions) {
    const total = calculateTotalExpense(transactions);
    const expenseElement = document.getElementById("total-expense");
    if (expenseElement) {
        // Template literal to format currency string
        expenseElement.textContent = `₹${total.toFixed(2)}`;
    }
}

function displayBalance(transactions) {
    const balance = calculateBalance(transactions);
    const balanceElement = document.getElementById("balance");
    const statusElement = document.getElementById("balance-status");

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

function displayRecentTransactions(transactions) {
    const container = document.getElementById("recent-transactions");
    if (!container) return;

    const recentTransactions = transactions.slice(-5).reverse();

    if (recentTransactions.length === 0) {
        container.innerHTML = `<p class="empty-msg">No transactions yet. <a href="expenses.html">Add one!</a></p>`;
        return;
    }

    let htmlContent = "";

    recentTransactions.forEach(function (txn) {
        const sign = txn.type === "income" ? "+" : "-";
        const colorClass = txn.type === "income" ? "income-text" : "expense-text";
        
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


function displayCategoryBreakdown(transactions) {
    const expenseTransactions = transactions.filter(function (txn) {
        return txn.type === "expense";
    });

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
