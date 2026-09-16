// ==========================================
// SETTLEUP — USER PROFILE
// Built by Rishab
// ==========================================
//
// group_expense.js already calls getCurrentUser() and shows
// "Save your name in My Profile first" on failure — this file
// implements that missing piece as a new, standalone module so
// it doesn't touch anyone else's existing files.

const CURRENT_USER_KEY = "settleup_current_user";


function getCurrentUser() {

    return localStorage.getItem(CURRENT_USER_KEY);

}


function setCurrentUser(name) {

    localStorage.setItem(CURRENT_USER_KEY, name);

}


document.addEventListener("DOMContentLoaded", function () {

    const nameInput = document.getElementById("profile-name");
    const saveButton = document.getElementById("profile-save-btn");
    const statusMsg = document.getElementById("profile-status");

    if (!nameInput || !saveButton) return;

    const savedName = getCurrentUser();

    if (savedName) {
        nameInput.value = savedName;
    }

    saveButton.addEventListener("click", function () {

        const name = nameInput.value.trim();

        if (!name) {
            if (statusMsg) statusMsg.textContent = "Enter a name first.";
            return;
        }

        setCurrentUser(name);

        if (statusMsg) {
            statusMsg.textContent = `Saved. You're set as "${name}".`;
        }

    });

});