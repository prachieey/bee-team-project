// ==========================================
// SETTLEUP - GROUP EXPENSE MODULE
// ==========================================

// ---------- DOM ELEMENTS ----------
const $ = id => document.getElementById(id);

const amountInput = $("amount");                 // Total expense
const expenseNameInput = $("expenseName");       // Expense name
const calculateButton = $("calculateButton");    // Calculate button
const resultContent = $("resultContent");        // Shows split result
const errorMessage = $("errorMessage");          // Shows errors
const successMessage = $("successMessage");      // Shows success
const customSection = $("customSection");        // Custom split section
const customMembers = $("customMembers");        // Custom share inputs
const newMemberInput = $("new-member");           // New member input
const addMemberButton = $("add-member-btn");      // Add member button
const memberList = $("member-list");              // Member list
const groupMembers = $("group-members");          // Selectable members


// ---------- GROUP MEMBERS STORAGE ----------
const GROUP_MEMBERS_KEY = "settleup_group_members";

// Get members saved in localStorage
function getGroupMembers() {
    const stored = localStorage.getItem(GROUP_MEMBERS_KEY);

    if (!stored) return [];

    try {
        return JSON.parse(stored);       // Convert stored JSON back to array
    } catch {
        return [];                       // Return empty array if data is invalid
    }
}

// Save members in localStorage
function saveGroupMembers(members) {
    localStorage.setItem(
        GROUP_MEMBERS_KEY,
        JSON.stringify(members)
    );
}


// ---------- CURRENT USER ----------
function getLoggedInUser() {
    return getCurrentUser();             // Gets user from existing profile system
}


// ---------- INITIALIZE ----------
document.addEventListener("DOMContentLoaded", () => {
    renderMemberList();                  // Display saved members
    renderGroupMembers();                // Display selectable members
});


// ---------- ADD MEMBER ----------
if (addMemberButton) {
    addMemberButton.addEventListener("click", addMember);
}

if (newMemberInput) {
    newMemberInput.addEventListener("keydown", event => {

        if (event.key === "Enter") {     // Allow Enter key to add member
            event.preventDefault();
            addMember();
        }

    });
}


function addMember() {

    const name = newMemberInput.value.trim();

    // Member name cannot be empty
    if (!name) {
        return showGroupError("Enter a member name.");
    }

    const currentUser = getLoggedInUser();

    // User must have a saved profile
    if (!currentUser) {
        return showGroupError(
            "Save your name in My Profile first."
        );
    }

    const members = getGroupMembers();

    // Check for duplicate names, ignoring uppercase/lowercase
    const exists = members.some(
        member => member.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
        return showGroupError(
            "That member already exists."
        );
    }

    // Add and save the new member
    members.push(name);
    saveGroupMembers(members);

    newMemberInput.value = "";            // Clear input
    clearGroupMessages();

    renderMemberList();                   // Refresh member list
    renderGroupMembers();                 // Refresh selectable members
}


// ---------- REMOVE MEMBER ----------
function removeMember(name) {

    // Keep every member except the one being removed
    const members = getGroupMembers()
        .filter(member => member !== name);

    saveGroupMembers(members);

    renderMemberList();
    renderGroupMembers();
    createCustomInputs();                 // Refresh custom inputs
}


// ---------- DISPLAY MEMBER LIST ----------
function renderMemberList() {

    if (!memberList) return;

    const members = getGroupMembers();
    memberList.innerHTML = "";

    if (!members.length) {
        memberList.innerHTML =
            "<p>No members added yet.</p>";
        return;
    }

    members.forEach(member => {

        const tag = document.createElement("div");
        tag.className = "member-tag";

        // Create member name + remove button
        tag.innerHTML = `
            <span>${member}</span>
            <button type="button"
                onclick="removeMember('${escapeHtml(member)}')">
                ×
            </button>
        `;

        memberList.appendChild(tag);
    });
}


// ---------- DISPLAY SELECTABLE GROUP MEMBERS ----------
function renderGroupMembers() {

    if (!groupMembers) return;

    const members = getGroupMembers();
    const currentUser = getLoggedInUser();

    groupMembers.innerHTML = "";

    if (!members.length) {
        groupMembers.innerHTML =
            "<p>Add members above.</p>";
        return;
    }

    members.forEach(member => {

        const wrapper = document.createElement("div");
        wrapper.className = "group-member";

        // Create checkbox for each member
        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.className = "member-checkbox";
        checkbox.value = member;

        checkbox.id =
            "member-" + member.replace(/\s+/g, "-");


        // Automatically select logged-in user
        if (
            currentUser &&
            member.toLowerCase() === currentUser.toLowerCase()
        ) {
            checkbox.checked = true;
        }


        // When selection changes, update custom inputs
        checkbox.addEventListener("change", () => {

            const splitType = document.querySelector(
                'input[name="splitType"]:checked'
            ).value;

            if (splitType === "custom") {
                createCustomInputs();
            }

        });


        // Create label
        const label = document.createElement("label");

        label.htmlFor = checkbox.id;
        label.textContent = member;

        wrapper.append(checkbox, label);
        groupMembers.appendChild(wrapper);
    });
}


// ---------- GET SELECTED MEMBERS ----------
function getSelectedMembers() {

    // Get only checked member checkboxes
    return Array.from(
        document.querySelectorAll(
            ".member-checkbox:checked"
        )
    ).map(checkbox => checkbox.value);
}


// ---------- SPLIT TYPE ----------
document
    .querySelectorAll('input[name="splitType"]')
    .forEach(input => {

        input.addEventListener("change", function () {

            const isCustom = this.value === "custom";

            // Show custom section only for custom split
            customSection.style.display =
                isCustom ? "block" : "none";

            if (isCustom) {
                createCustomInputs();
            }

        });

    });


// ---------- CUSTOM SHARE INPUTS ----------
function createCustomInputs() {

    if (!customMembers) return;

    const members = getSelectedMembers();

    customMembers.innerHTML = "";

    members.forEach(member => {

        const div = document.createElement("div");
        div.className = "custom-member";

        // Create an input for each selected member's share
        div.innerHTML = `
            <label>${escapeHtml(member)}</label>

            <input
                type="number"
                class="custom-share"
                data-member="${escapeHtml(member)}"
                min="0"
                step="0.01"
                placeholder="Enter share"
            >
        `;

        customMembers.appendChild(div);
    });
}


// ---------- CALCULATE GROUP EXPENSE ----------
if (calculateButton) {
    calculateButton.addEventListener(
        "click",
        calculateGroupExpense
    );
}


function calculateGroupExpense() {

    clearGroupMessages();
    resultContent.innerHTML = "";


    // ---------- 1. USER VALIDATION ----------
    const currentUser = getLoggedInUser();

    if (!currentUser) {
        return showGroupError(
            "Please save your name in My Profile first."
        );
    }


    // ---------- 2. AMOUNT VALIDATION ----------
    const amount = Number(amountInput.value);

    if (!amount || amount <= 0) {
        return showGroupError(
            "Enter a valid amount."
        );
    }


    // ---------- 3. EXPENSE NAME ----------
    const expenseName =
        expenseNameInput.value.trim() ||
        "Group Expense";


    // ---------- 4. GET MEMBERS ----------
    const members = getSelectedMembers();

    if (!members.length) {
        return showGroupError(
            "Select at least one member."
        );
    }


    // ---------- 5. USER MUST BE INCLUDED ----------
    const userIncluded = members.some(
        member =>
            member.toLowerCase() ===
            currentUser.toLowerCase()
    );

    if (!userIncluded) {
        return showGroupError(
            "You must include yourself in the group expense."
        );
    }


    // ---------- 6. GET SPLIT TYPE ----------
    const splitType = document.querySelector(
        'input[name="splitType"]:checked'
    ).value;


    try {

        let result;


        // ---------- EQUAL SPLIT ----------
        if (splitType === "equal") {

            // Divide amount equally between selected members
            result = splitEqually(
                amount,
                members
            );

        }


        // ---------- CUSTOM SPLIT ----------
        else {

            const shareMap = {};

            // Read each member's custom share
            document
                .querySelectorAll(".custom-share")
                .forEach(input => {

                    const member =
                        input.dataset.member;

                    const value =
                        input.value.trim();


                    // Share cannot be empty
                    if (value === "") {
                        throw new Error(
                            `Enter a share for ${member}.`
                        );
                    }


                    const share = Number(value);


                    // Share must be a valid non-negative number
                    if (
                        isNaN(share) ||
                        share < 0
                    ) {
                        throw new Error(
                            `Invalid share for ${member}.`
                        );
                    }


                    shareMap[member] = share;

                });


            // Calculate using custom shares
            result = splitCustom(
                amount,
                shareMap
            );
        }


        // ---------- 7. FIND MY SHARE ----------
        const myResult = result.find(
            item =>
                item.member.toLowerCase() ===
                currentUser.toLowerCase()
        );


        if (!myResult) {
            throw new Error(
                "Your share could not be calculated."
            );
        }


        // ---------- 8. SAVE MY SHARE ----------
        const transactions = loadData();


        const transaction = {

            id: Date.now(),                       // Unique ID

            userId: currentUser,                  // Current user

            type: "expense",

            amount: Number(myResult.share),       // User's share

            category: "Group Expense",

            description:
                `${expenseName} - Group of ${members.length}`,

            date:
                new Date()
                    .toISOString()
                    .split("T")[0],

            groupExpense: true,

            groupName: expenseName,

            groupMembers: members,

            splitType: splitType,

            totalAmount: amount
        };


        // Add transaction and save it
        transactions.push(transaction);
        saveData(transactions);


        // ---------- 9. DISPLAY RESULT ----------
        result.forEach(item => {

            const row =
                document.createElement("div");

            row.className = "result-row";


            // Check whether this result belongs to current user
            const isMe =
                item.member.toLowerCase() ===
                currentUser.toLowerCase();


            row.innerHTML = `
                <span>
                    ${escapeHtml(item.member)}
                    ${isMe ? " (You)" : ""}
                </span>

                <strong>
                    ₹${Number(item.share).toFixed(2)}
                </strong>
            `;


            resultContent.appendChild(row);
        });


        // ---------- 10. SUCCESS MESSAGE ----------
        successMessage.textContent =
            `Group expense saved. Your share is ₹${
                Number(myResult.share).toFixed(2)
            }.`;



        // ---------- 11. REFRESH DASHBOARD ----------
        if (
            typeof renderDashboard === "function"
        ) {
            renderDashboard();
        }


        // ---------- 12. CLEAR INPUTS ----------
        amountInput.value = "";
        expenseNameInput.value = "";


    } catch (error) {

        // Display any validation/calculation error
        showGroupError(error.message);
    }
}


// ---------- MESSAGE HELPERS ----------

function showGroupError(message) {
    errorMessage.textContent = message;
}


function clearGroupMessages() {

    errorMessage.textContent = "";
    successMessage.textContent = "";
}


// ---------- HTML ESCAPING ----------
// Prevents user-entered names from being treated as HTML
function escapeHtml(value) {

    return String(value)

        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}