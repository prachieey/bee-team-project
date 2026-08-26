// ==========================================
// EXPENSE SPLITTING ENGINE - SANCHITA
// ==========================================

// Equal Split
function splitEqually(amount, members) {

    if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
    }

    if (members.length === 0) {
        throw new Error("At least one member is required");
    }

    const share = amount / members.length;

    return members.map(member => ({
        member,
        share
    }));
}


// Custom Split
function splitCustom(amount, shareMap) {

    if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
    }

    const shares = Object.values(shareMap);

    if (shares.length === 0) {
        throw new Error("At least one member is required");
    }

    if (shares.some(share => share < 0)) {
        throw new Error("Share cannot be negative");
    }

    const total = shares.reduce(
        (sum, share) => sum + share,
        0
    );

    if (total !== amount) {
        throw new Error(
            "Custom shares must sum to total amount"
        );
    }

    return Object.entries(shareMap).map(
        ([member, share]) => ({
            member,
            share
        })
    );
}
window.splitEqually = splitEqually;
window.splitCustom = splitCustom;