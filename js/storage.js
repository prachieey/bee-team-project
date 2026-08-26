// storage.js
// All localStorage helper functions for SettleUp personal finance module
// Key used to store all personal transactions in localStorage
const STORAGE_KEY = "settleup_transactions";

// saveData() - saves the full array of transactions to localStorage
// Converts the JS array to a JSON string before saving
function saveData(transactions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// loadData() - loads and returns the transactions array from localStorage
// Parses the JSON string back to a JS array
// Returns an empty array if nothing is saved yet
function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
        return [];
    }
    return JSON.parse(stored);
}

// updateData() - replaces one transaction by its id with new data
// Keeps all other transactions unchanged
function updateData(updatedTransaction) {
    const transactions = loadData();
    const newList = transactions.map(function (txn) {
        if (Number(txn.id) === Number(updatedTransaction.id)) {
            return updatedTransaction; // replace the matching transaction
        }
        return txn; // keep everything else the same
    });
    saveData(newList);
}

// deleteData() - removes a transaction from localStorage by its id
function deleteData(id) {
    const transactions = loadData();
    const filtered = transactions.filter(function (txn) {
        return Number(txn.id) !== Number(id);
    });
    saveData(filtered);
}
