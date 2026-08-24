// ==========================================
// GROUP EXPENSE UI - SANCHITA
// ==========================================


// Get elements from HTML
const amountInput = document.getElementById("amount");

const calculateButton =
    document.getElementById("calculateButton");

const resultContent =
    document.getElementById("resultContent");

const errorMessage =
    document.getElementById("errorMessage");

const customSection =
    document.getElementById("customSection");

const customMembers =
    document.getElementById("customMembers");


// ==========================================
// GET SELECTED MEMBERS
// ==========================================

function getSelectedMembers() {

    const checkboxes =
        document.querySelectorAll(
            ".member-checkbox:checked"
        );

    return Array.from(checkboxes)
        .map(checkbox => checkbox.value);
}


// ==========================================
// CHANGE BETWEEN EQUAL AND CUSTOM
// ==========================================

const splitTypeInputs =
    document.querySelectorAll(
        'input[name="splitType"]'
    );


splitTypeInputs.forEach(input => {

    input.addEventListener("change", function () {

        if (this.value === "custom") {

            customSection.style.display = "block";

            createCustomInputs();

        } else {

            customSection.style.display = "none";

        }

    });

});


// ==========================================
// CREATE CUSTOM SHARE INPUTS
// ==========================================

function createCustomInputs() {

    const members = getSelectedMembers();

    customMembers.innerHTML = "";

    members.forEach(member => {

        const div = document.createElement("div");

        div.className = "custom-member";

        div.innerHTML = `
            <label>
                ${member}
            </label>

            <input
                type="number"
                class="custom-share"
                data-member="${member}"
                min="0"
                placeholder="Enter share"
            >
        `;

        customMembers.appendChild(div);

    });

}


// ==========================================
// UPDATE CUSTOM INPUTS WHEN MEMBERS CHANGE
// ==========================================

document
    .querySelectorAll(".member-checkbox")
    .forEach(checkbox => {

        checkbox.addEventListener(
            "change",
            function () {

                const customSelected =
                    document.querySelector(
                        'input[name="splitType"]:checked'
                    ).value === "custom";

                if (customSelected) {
                    createCustomInputs();
                }

            }
        );

    });


// ==========================================
// CALCULATE SPLIT
// ==========================================

calculateButton.addEventListener(
    "click",
    function () {

        // Clear previous messages
        errorMessage.textContent = "";

        resultContent.innerHTML = "";


        // Get amount
        const amount =
            Number(amountInput.value);


        // Get selected members
        const members =
            getSelectedMembers();


        // Basic validation
        if (!amount || amount <= 0) {

            errorMessage.textContent =
                "Please enter a valid amount.";

            return;
        }


        if (members.length === 0) {

            errorMessage.textContent =
                "Please select at least one member.";

            return;
        }


        // Get split type
        const splitType =
            document.querySelector(
                'input[name="splitType"]:checked'
            ).value;


        try {

            let result;


            // ==================================
            // EQUAL SPLIT
            // ==================================

            if (splitType === "equal") {

                result =
                    splitEqually(
                        amount,
                        members
                    );

            }


            // ==================================
            // CUSTOM SPLIT
            // ==================================

            else {

                const shareInputs =
                    document.querySelectorAll(
                        ".custom-share"
                    );


                const shareMap = {};


                shareInputs.forEach(input => {

                    const member =
                        input.dataset.member;

                    const share =
                        Number(input.value);

                    shareMap[member] = share;

                });


                result =
                    splitCustom(
                        amount,
                        shareMap
                    );

            }


            // ==================================
            // DISPLAY RESULT
            // ==================================

            result.forEach(item => {

                const row =
                    document.createElement("div");

                row.className =
                    "result-row";

                row.innerHTML = `
                    <span>${item.member}</span>
                    <strong>₹${item.share.toFixed(2)}</strong>
                `;

                resultContent.appendChild(row);

            });


        } catch (error) {

            errorMessage.textContent =
                error.message;

        }

    }
);