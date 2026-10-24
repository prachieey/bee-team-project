// utils/splitEngine.js
// Server-side split calculation engine
// Ported from legacy/js/splitEngine.js (originally built by Sanchita)
//
// Uses integer-paise arithmetic to avoid floating-point rounding errors:
//   ₹1200.00 → 120000 paise → split → convert back to rupees
// This guarantees that all shares always sum exactly to the total.
//
// Demonstrates: pure functions, higher-order functions, array methods (Lecture 9-14)

function createValidationError(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

/**
 * splitEqually – divides amount equally among members
 * Uses the "largest remainder" method so shares always sum exactly to total.
 *
 * @param {number} amount  – total in rupees
 * @param {string[]} members – array of user ID strings
 * @returns {{ userId: string, share: number }[]}
 */
function splitEqually(amount, members) {
  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw createValidationError('Amount must be greater than 0');
  }
  if (!members || members.length === 0) {
    throw createValidationError('At least one member is required');
  }

  // Work in paise (integer) to avoid floating-point errors
  const totalPaise = Math.round(parsedAmount * 100);
  const n          = members.length;
  const basePaise  = Math.floor(totalPaise / n);   // floor share for everyone
  let   remainder  = totalPaise - basePaise * n;   // leftover paise

  // Distribute remainder one paise at a time to first members
  return members.map((userId) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder  -= extra;
    return {
      userId: userId.toString(),
      share: Math.round(basePaise + extra) / 100,
    };
  });
}

/**
 * splitCustom – validates and normalises custom per-member shares
 *
 * @param {number} amount  – expected total in rupees
 * @param {{ [userId: string]: number }} shareMap – per-member share in rupees
 * @returns {{ userId: string, share: number }[]}
 */
function splitCustom(amount, shareMap) {
  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw createValidationError('Amount must be greater than 0');
  }

  const entries = Object.entries(shareMap);
  if (entries.length === 0) {
    throw createValidationError('At least one member is required');
  }

  // Validate individual shares and convert to paise
  const sharesInPaise = [];
  let sumPaise = 0;

  for (const [userId, share] of entries) {
    const numShare = Number(share);
    if (isNaN(numShare) || numShare < 0) {
      throw createValidationError(`Invalid share for ${userId}`);
    }
    const paise = Math.round(numShare * 100);
    sharesInPaise.push({ userId: userId.toString(), paise });
    sumPaise += paise;
  }

  const totalPaise = Math.round(parsedAmount * 100);
  const diffPaise  = totalPaise - sumPaise;

  // Validate sum (allow ±1 paise tolerance for UI decimal rounding, then auto-balance)
  if (Math.abs(diffPaise) > 1) {
    throw createValidationError(
      `Custom shares (₹${(sumPaise / 100).toFixed(2)}) must sum to total amount (₹${parsedAmount.toFixed(2)})`
    );
  }

  // If 1 paise difference exists due to rounding, adjust the first non-zero share
  if (diffPaise !== 0 && sharesInPaise.length > 0) {
    sharesInPaise[0].paise += diffPaise;
  }

  return sharesInPaise.map(({ userId, paise }) => ({
    userId,
    share: Math.round(paise) / 100,
  }));
}

module.exports = { splitEqually, splitCustom };
