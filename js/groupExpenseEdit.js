// ==========================================
// GROUP EXPENSE — EDIT / DELETE
// Built by Rishab
// ==========================================
//
// group_expense.js (Sanchita) creates group expenses and saves
// only the CURRENT USER's own share into settleup_transactions
// (flagged groupExpense: true). This file adds the missing
// SHOULD-have: letting the user see, edit, and delete their own
// group expenses — including properly RE-SPLITTING the amount
// across members on edit, not just editing a flat number.
//
// Note: only the logged-in user's share was ever persisted, so
// original custom per-member shares aren't recoverable on edit —
// custom splits are re-entered fresh. This is called out in the
// UI itself so it isn't a silent bug.


// ==========================================
// ELEMENTS
// ==========================================

const geListContainer =
    document.getElementById("group-expense-list");

const geEditForm =
    document.getElementById("ge-edit-form");

const geEditName =
    document.getElementById("ge-edit-name");

const geEditAmount =
    document.getElementById("ge-edit-amount");

const geEditMembers =
    document.getElementById("ge-edit-members");

const geEditCustomSection =
    document.getElementById("ge-edit-custom-section");

const geEditCustomMembers =
    document.getElementById("ge-edit-custom-members");

const geEditError =
    document.getElementById("ge-edit-error");

const geEditSuccess =
    document.getElementById("ge-edit-success");

let geEditingId = null;


// ==========================================
// INIT
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    renderGroupExpenseList();

    const cancelBtn =
        document.getElementById("ge-cancel-edit-btn");

    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeEditGroupExpense);
    }

    const saveBtn =
        document.getElementById("ge-save-edit-btn");

    if (saveBtn) {
        saveBtn.addEventListener("click", saveGroupExpenseEdit);
    }

    document.querySelectorAll('input[name="ge-splitType"]')
        .forEach(function (radio) {

            radio.addEventListener("change", function () {

                if (this.value === "custom") {
                    geEditCustomSection.style.display = "block";
                    renderGeCustomInputs();
                } else {
                    geEditCustomSection.style.display = "none";
                }

            });

        });

});


// ==========================================
// GET MY GROUP EXPENSES
// ==========================================

function getMyGroupExpenses() {

    const currentUser = getCurrentUser();

    if (!currentUser) return [];

    return loadData().filter(function (txn) {

        return (
            txn.groupExpense === true &&
            String(txn.userId).toLowerCase() ===
                String(currentUser).toLowerCase()
        );

    });

}


// ==========================================
// RENDER LIST
// ==========================================

function renderGroupExpenseList() {

    if (!geListContainer) return;

    const expenses = getMyGroupExpenses();

    if (expenses.length === 0) {

        geListContainer.innerHTML =
            '<p class="empty-msg">No group expenses yet.</p>';

        return;

    }

    const sorted = expenses.slice().sort(function (a, b) {
        return Number(b.id) - Number(a.id);
    });

    let html = "";

    sorted.forEach(function (txn) {

        html += `
            <div class="result-row">
                <span>
                    ${escapeGeHtml(txn.groupName)}
                    &bull; total ₹${Number(txn.totalAmount).toFixed(2)}
                    &bull; your share ₹${Number(txn.amount).toFixed(2)}
                </span>
                <span>
                    <button class="btn-edit" onclick="openEditGroupExpense('${txn.id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteGroupExpense('${txn.id}')">Delete</button>
                </span>
            </div>
        `;

    });

    geListContainer.innerHTML = html;

}


// ==========================================
// DELETE
// ==========================================

function deleteGroupExpense(id) {

    const confirmed = confirm(
        "Delete this group expense? This only removes it from your side."
    );

    if (!confirmed) return;

    deleteData(id);

    renderGroupExpenseList();

    if (typeof renderDashboard === "function") {
        renderDashboard();
    }

}


// ==========================================
// OPEN EDIT
// ==========================================

function openEditGroupExpense(id) {

    const transactions = loadData();

    const txn = transactions.find(function (t) {
        return String(t.id) === String(id);
    });

    if (!txn) return;

    geEditingId = id;

    geEditName.value = txn.groupName || "";
    geEditAmount.value = txn.totalAmount || txn.amount;

    const savedMembers =
        JSON.parse(localStorage.getItem("settleup_group_members") || "[]");

    const activeMembers =
        savedMembers.length > 0 ? savedMembers : (txn.groupMembers || []);

    geEditMembers.innerHTML = "";

    activeMembers.forEach(function (member) {

        const wrapper = document.createElement("div");
        wrapper.className = "group-member";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = member;
        checkbox.id = "ge-member-" + member.replace(/\s+/g, "-");
        checkbox.checked =
            (txn.groupMembers || []).indexOf(member) !== -1;

        checkbox.addEventListener("change", function () {

            const isCustom =
                document.querySelector('input[name="ge-splitType"]:checked').value
                    === "custom";

            if (isCustom) renderGeCustomInputs();

        });

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = member;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        geEditMembers.appendChild(wrapper);

    });

    document.querySelectorAll('input[name="ge-splitType"]').forEach(function (radio) {
        radio.checked = (radio.value === (txn.splitType || "equal"));
    });

    if ((txn.splitType || "equal") === "custom") {
        geEditCustomSection.style.display = "block";
        renderGeCustomInputs();
    } else {
        geEditCustomSection.style.display = "none";
    }

    geEditError.textContent = "";
    geEditSuccess.textContent = "";

    geEditForm.style.display = "block";
    geEditForm.scrollIntoView({ behavior: "smooth" });

}


// ==========================================
// CUSTOM SHARE INPUTS (re-entered fresh)
// ==========================================

function renderGeCustomInputs() {

    const checked = geEditMembers.querySelectorAll(
        'input[type="checkbox"]:checked'
    );

    geEditCustomMembers.innerHTML = "";

    checked.forEach(function (checkbox) {

        const member = checkbox.value;

        const div = document.createElement("div");
        div.className = "custom-member";

        div.innerHTML = `
            <label>${escapeGeHtml(member)}</label>
            <input type="number" class="ge-custom-share"
                data-member="${escapeGeHtml(member)}"
                min="0" step="0.01" placeholder="Enter share">
        `;

        geEditCustomMembers.appendChild(div);

    });

}


// ==========================================
// CLOSE EDIT
// ==========================================

function closeEditGroupExpense() {

    geEditingId = null;
    geEditForm.style.display = "none";

}


// ==========================================
// SAVE EDIT (re-splits the expense)
// ==========================================

function saveGroupExpenseEdit() {

    geEditError.textContent = "";
    geEditSuccess.textContent = "";

    const currentUser = getCurrentUser();

    if (!currentUser) {
        geEditError.textContent = "Please save your name in My Profile first.";
        return;
    }

    const name = geEditName.value.trim() || "Group Expense";
    const amount = Number(geEditAmount.value);

    if (!amount || amount <= 0) {
        geEditError.textContent = "Enter a valid amount.";
        return;
    }

    const selectedMembers = Array.from(
        geEditMembers.querySelectorAll('input[type="checkbox"]:checked')
    ).map(function (checkbox) { return checkbox.value; });

    if (selectedMembers.length === 0) {
        geEditError.textContent = "Select at least one member.";
        return;
    }

    if (selectedMembers.map(function (m) { return m.toLowerCase(); })
        .indexOf(currentUser.toLowerCase()) === -1) {
        geEditError.textContent = "You must include yourself.";
        return;
    }

    const splitType = document.querySelector(
        'input[name="ge-splitType"]:checked'
    ).value;

    try {

        let result;

        if (splitType === "equal") {

            result = splitEqually(amount, selectedMembers);

        } else {

            const shareInputs =
                geEditCustomMembers.querySelectorAll(".ge-custom-share");

            const shareMap = {};

            shareInputs.forEach(function (input) {

                const member = input.dataset.member;
                const value = input.value.trim();

                if (value === "") {
                    throw new Error(`Enter a share for ${member}.`);
                }

                const share = Number(value);

                if (isNaN(share) || share < 0) {
                    throw new Error(`Invalid share for ${member}.`);
                }

                shareMap[member] = share;

            });

            result = splitCustom(amount, shareMap);

        }

        const myResult = result.find(function (item) {
            return item.member.toLowerCase() === currentUser.toLowerCase();
        });

        if (!myResult) {
            throw new Error("Your share could not be calculated.");
        }

        const transactions = loadData();

        const original = transactions.find(function (t) {
            return String(t.id) === String(geEditingId);
        });

        const updatedTxn = {
            id: geEditingId,
            userId: currentUser,
            type: "expense",
            amount: Number(myResult.share),
            category: "Group Expense",
            description: `${name} - Group of ${selectedMembers.length}`,
            date: original ? original.date : new Date().toISOString().split("T")[0],
            groupExpense: true,
            groupName: name,
            groupMembers: selectedMembers,
            splitType: splitType,
            totalAmount: amount
        };

        updateData(updatedTxn);

        geEditSuccess.textContent =
            `Updated. Your new share is ₹${Number(myResult.share).toFixed(2)}.`;

        renderGroupExpenseList();

        if (typeof renderDashboard === "function") {
            renderDashboard();
        }

        setTimeout(closeEditGroupExpense, 900);

    } catch (error) {

        geEditError.textContent = error.message;

    }

}


// ==========================================
// ESCAPE
// ==========================================

function escapeGeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}