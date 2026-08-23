// expenses.js
// Handles add / edit / delete transactions and form validation on expenses.html

// Categories available for selection
const EXPENSE_CATEGORIES = ["Food", "Travel", "Shopping", "Health", "Education", "Entertainment", "Utilities", "Other"];
const INCOME_CATEGORIES  = ["Salary", "Freelance", "Gift", "Investment", "Other"];

// Holds the id of the transaction being edited (null means we are adding a new one)
let editingId = null;

// Run setup after the page loads
document.addEventListener("DOMContentLoaded", function () {
    populateCategoryDropdown("income"); // default type is income
    renderTransactionList();

    // Listen for form submission
    const form = document.getElementById("txn-form");
    form.addEventListener("submit", function (event) {
        event.preventDefault(); // stop page from refreshing
        handleFormSubmit();
    });

    // When the type (income/expense) changes, update the category dropdown
    const typeSelect = document.getElementById("txn-type");
    typeSelect.addEventListener("change", function () {
        populateCategoryDropdown(typeSelect.value);
    });

    // Cancel edit button
    const cancelBtn = document.getElementById("cancel-edit-btn");
    cancelBtn.addEventListener("click", function () {
        resetForm();
    });
});

// populateCategoryDropdown() - fills the category <select> based on type
function populateCategoryDropdown(type) {
    const categorySelect = document.getElementById("txn-category");
    const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    categorySelect.innerHTML = ""; // clear existing options

    categories.forEach(function (cat) {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// validateForm() - checks inputs and displays clear error messages beside/under fields
function validateForm(type, amountString, category, description, date) {
    let isValid = true;

    // Clear previous error messages
    clearFieldErrors();

    // Convert amount from string to number
    const amount = parseFloat(amountString);

    // 1. Validate Type
    if (!type) {
        showFieldError("error-type", "Please select a transaction type.");
        isValid = false;
    }

    // 2. Validate Amount: empty amount or amount <= 0 or isNaN
    if (!amountString || isNaN(amount) || amount <= 0) {
        showFieldError("error-amount", "Please enter a valid amount greater than 0.");
        isValid = false;
    }

    // 3. Validate Category
    if (!category) {
        showFieldError("error-category", "Please select a category.");
        isValid = false;
    }

    // 4. Validate Date
    if (!date) {
        showFieldError("error-date", "Please select a date.");
        isValid = false;
    }

    // 5. Validate Description
    if (!description || description.trim() === "") {
        showFieldError("error-description", "Please enter a description.");
        isValid = false;
    }

    return isValid;
}

// showFieldError() - displays an error message under a specific field
function showFieldError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = "block";
    }
}

// clearFieldErrors() - hides and clears all field error messages
function clearFieldErrors() {
    const fieldErrors = document.querySelectorAll(".field-error");
    fieldErrors.forEach(function (el) {
        el.textContent = "";
        el.style.display = "none";
    });
    showValidationError("");
}

// showValidationError() - displays main banner error message
function showValidationError(message) {
    const errorEl = document.getElementById("form-error");
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = message ? "block" : "none";
    }
}

// handleFormSubmit() - called when the form is submitted
function handleFormSubmit() {
    // Read form values
    const type         = document.getElementById("txn-type").value;
    const amountString = document.getElementById("txn-amount").value;
    const amount       = parseFloat(amountString);
    const category     = document.getElementById("txn-category").value;
    const description  = document.getElementById("txn-description").value;
    const date         = document.getElementById("txn-date").value;

    // Validate input values
    const isValid = validateForm(type, amountString, category, description, date);
    if (!isValid) {
        showValidationError("Please fix the validation errors above before submitting.");
        return;
    }

    if (editingId !== null) {
        // We are editing an existing transaction
        const updatedTxn = {
            id: editingId,
            userId: "prachi",
            type: type,
            amount: amount,
            category: category,
            description: description,
            date: date
        };
        updateData(updatedTxn);
        editingId = null; // exit edit mode
    } else {
        // We are adding a new transaction
        const newTxn = {
            id: Date.now(), // unique timestamp ID
            userId: "prachi",
            type: type,
            amount: amount,
            category: category,
            description: description,
            date: date
        };
        const transactions = loadData();
        transactions.push(newTxn);
        saveData(transactions);
    }

    resetForm();
    renderTransactionList();
}

// resetForm() - clears the form and exits edit mode
function resetForm() {
    document.getElementById("txn-form").reset();
    populateCategoryDropdown("income"); // reset to default dropdown
    editingId = null;

    // Reset button labels and title back to "Add" mode
    document.getElementById("submit-btn").textContent = "Add Transaction";
    document.getElementById("cancel-edit-btn").style.display = "none";
    document.getElementById("form-title").textContent = "Add Transaction";
    clearFieldErrors();
}

// renderTransactionList() - reads localStorage and builds the transaction table
function renderTransactionList() {
    const transactions = loadData();
    const container    = document.getElementById("transaction-list");

    if (transactions.length === 0) {
        container.innerHTML = `<p class="empty-msg">No transactions found. Add one above!</p>`;
        return;
    }

    // Show newest first
    const sorted = transactions.slice().reverse();

    let html = `
        <table class="txn-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    sorted.forEach(function (txn) {
        const sign       = txn.type === "income" ? "+" : "-";
        const colorClass = txn.type === "income" ? "income-text" : "expense-text";
        html += `
            <tr>
                <td>${txn.date}</td>
                <td><span class="badge badge-${txn.type}">${txn.type}</span></td>
                <td>${txn.category}</td>
                <td>${txn.description}</td>
                <td class="${colorClass}">${sign}₹${txn.amount.toFixed(2)}</td>
                <td>
                    <button class="btn-edit" onclick="startEdit(${txn.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteTxn(${txn.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// startEdit() - fills the form with existing data so the user can modify it
function startEdit(id) {
    const transactions = loadData();
    const txn = transactions.find(function (t) {
        return Number(t.id) === Number(id);
    });

    if (!txn) return;

    editingId = id; // remember which transaction we are editing

    // Fill in form fields
    document.getElementById("txn-type").value        = txn.type;
    populateCategoryDropdown(txn.type);
    document.getElementById("txn-category").value    = txn.category;
    document.getElementById("txn-amount").value      = txn.amount;
    document.getElementById("txn-description").value = txn.description;
    document.getElementById("txn-date").value        = txn.date;

    // Switch to "Update" mode
    document.getElementById("submit-btn").textContent            = "Update Transaction";
    document.getElementById("cancel-edit-btn").style.display     = "inline-block";
    document.getElementById("form-title").textContent            = "Edit Transaction";

    // Scroll to form so the user sees it
    document.getElementById("txn-form").scrollIntoView({ behavior: "smooth" });
}

// deleteTxn() - removes a transaction after user confirms
function deleteTxn(id) {
    const confirmed = confirm("Are you sure you want to delete this transaction?");
    if (!confirmed) return;

    deleteData(id);
    renderTransactionList();
}
