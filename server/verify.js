// server/verify.js
// Comprehensive End-to-End Automated Test Suite for SettleUp Full-Stack Project
// Tests all syllabus requirements: Auth, Security, Transactions, Groups, SplitEngine, Settlement

const assert = require('assert');
const path   = require('path');
const app    = require('./server');

const BASE_URL = 'http://localhost:5000/api';

// Helper for making API requests with cookie & JSON support
async function api(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  const setCookie = res.headers.get('set-cookie');
  return { status: res.status, ok: res.ok, data, headers: res.headers, cookie: setCookie };
}

let runningServer = null;

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 STARTING COMPREHENSIVE SETTLEUP FULL-STACK AUDIT');
  console.log('======================================================\n');

  // Start test server if not already running on port 5000
  await new Promise((resolve) => {
    try {
      runningServer = app.listen(5000, () => {
        console.log('🚀 Test server started on http://localhost:5000');
        resolve();
      });
      runningServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log('ℹ️  Port 5000 is active – attaching test suite to running server.');
          resolve();
        } else {
          console.error('Server listen error:', err);
          resolve();
        }
      });
    } catch {
      resolve();
    }
  });

  // Allow server and DB connection to stabilize
  await new Promise((r) => setTimeout(r, 1200));


  const timestamp = Date.now();
  const user1Email = `prachi_${timestamp}@test.com`;
  const user2Email = `rishab_${timestamp}@test.com`;
  const user3Email = `sanchita_${timestamp}@test.com`;
  const password   = 'SecretPassword123';

  let user1Cookie, user1Token, user1Id;
  let user2Cookie, user2Token, user2Id;
  let user3Cookie, user3Token, user3Id;

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 1: AUTHENTICATION & SECURITY TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ [1/7] Running Authentication & Security Tests...');

  // 1.1 Positive: User 1 Signup
  const s1 = await api('/auth/signup', {
    method: 'POST',
    body: { name: 'Prachi Sharma', email: user1Email, password, confirmPassword: password },
  });
  assert.strictEqual(s1.status, 201, 'User 1 signup should return 201 Created');
  assert.strictEqual(s1.data.success, true, 'User 1 signup success must be true');
  assert.ok(s1.data.user._id, 'Signup must return user object with _id');
  assert.ok(s1.cookie && s1.cookie.includes('token='), 'Signup must set HTTP-only token cookie');
  user1Id = s1.data.user._id;
  user1Cookie = s1.cookie;
  user1Token = s1.data.token;

  // 1.2 Negative: Duplicate Email Signup (Lecture 43 Mongoose validation / 11000)
  const dup = await api('/auth/signup', {
    method: 'POST',
    body: { name: 'Duplicate User', email: user1Email, password, confirmPassword: password },
  });
  assert.strictEqual(dup.status, 409, 'Duplicate email signup must return 409 Conflict');
  assert.strictEqual(dup.data.success, false, 'Duplicate email must fail');

  // 1.3 Negative: Password mismatch
  const mismatch = await api('/auth/signup', {
    method: 'POST',
    body: { name: 'Mismatch', email: `mismatch_${timestamp}@test.com`, password: 'password1', confirmPassword: 'password2' },
  });
  assert.strictEqual(mismatch.status, 400, 'Password mismatch must return 400 Bad Request');

  // 1.4 Negative: Password too short (< 6 chars)
  const shortPass = await api('/auth/signup', {
    method: 'POST',
    body: { name: 'Short', email: `short_${timestamp}@test.com`, password: '123', confirmPassword: '123' },
  });
  assert.strictEqual(shortPass.status, 400, 'Short password must return 400 Bad Request');

  // 1.5 Register User 2 & User 3
  const s2 = await api('/auth/signup', {
    method: 'POST',
    body: { name: 'Rishab Verma', email: user2Email, password, confirmPassword: password },
  });
  assert.strictEqual(s2.status, 201);
  user2Id = s2.data.user._id;
  user2Cookie = s2.cookie;
  user2Token = s2.data.token;

  const s3 = await api('/auth/signup', {
    method: 'POST',
    body: { name: 'Sanchita Roy', email: user3Email, password, confirmPassword: password },
  });
  assert.strictEqual(s3.status, 201);
  user3Id = s3.data.user._id;
  user3Cookie = s3.cookie;
  user3Token = s3.data.token;

  // 1.6 Positive: Login with correct credentials
  const loginRes = await api('/auth/login', {
    method: 'POST',
    body: { email: user1Email, password },
  });
  assert.strictEqual(loginRes.status, 200, 'Login with correct credentials must return 200');
  assert.ok(loginRes.cookie.includes('token='), 'Login must issue token cookie');

  // 1.7 Negative: Login with wrong password
  const wrongLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: user1Email, password: 'WrongPassword999' },
  });
  assert.strictEqual(wrongLogin.status, 401, 'Wrong password must return 401 Unauthorized');

  // 1.8 Positive: Session verification (GET /auth/me) with cookie
  const meRes = await api('/auth/me', { headers: { Cookie: user1Cookie } });
  assert.strictEqual(meRes.status, 200, 'GET /auth/me with cookie must return 200');
  assert.strictEqual(meRes.data.user.email, user1Email);

  // 1.9 Positive: Dual token access using Authorization: Bearer <token>
  const meBearer = await api('/auth/me', { headers: { Authorization: `Bearer ${user1Token}` } });
  assert.strictEqual(meBearer.status, 200, 'GET /auth/me with Bearer token must return 200');

  // 1.10 Positive: Profile update (PUT /auth/profile)
  const profileRes = await api('/auth/profile', {
    method: 'PUT',
    headers: { Cookie: user1Cookie },
    body: { name: 'Prachi Sharma (Lead)' },
  });
  assert.strictEqual(profileRes.status, 200, 'Profile update must return 200');
  assert.strictEqual(profileRes.data.data.name, 'Prachi Sharma (Lead)');

  // 1.11 Positive: Logout and cookie invalidation
  const logoutRes = await api('/auth/logout', { method: 'POST', headers: { Cookie: user1Cookie } });
  assert.strictEqual(logoutRes.status, 200, 'Logout must return 200');
  assert.ok(logoutRes.cookie.includes('Expires=Thu, 01 Jan 1970'), 'Logout must expire the cookie');

  // 1.12 Negative: Access protected route after logout without valid cookie
  const unauthMe = await api('/auth/me', { headers: { Cookie: logoutRes.cookie } });
  assert.strictEqual(unauthMe.status, 401, 'Accessing protected route without active session must return 401');

  console.log('   ✓ Authentication & Security tests passed (12/12 assertions)');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 2: PROTECTED ROUTES & TENANT ISOLATION TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ [2/7] Running Protected Route & Tenant Isolation Tests...');

  const u1H = { Cookie: user1Cookie };
  const u2H = { Cookie: user2Cookie };

  // 2.1 Negative: Unauthorized access to transactions
  const noAuthTxn = await api('/transactions');
  assert.strictEqual(noAuthTxn.status, 401, 'Unauthenticated transaction list must return 401');

  // 2.2 Negative: Unauthorized access to dashboard
  const noAuthDash = await api('/dashboard/summary');
  assert.strictEqual(noAuthDash.status, 401, 'Unauthenticated dashboard must return 401');

  // 2.3 Negative: Unauthorized access to groups
  const noAuthGrp = await api('/groups');
  assert.strictEqual(noAuthGrp.status, 401, 'Unauthenticated groups list must return 401');

  console.log('   ✓ Protected Route & Tenant Isolation tests passed (3/3 assertions)');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 3: PERSONAL TRANSACTION CRUD & VALIDATION TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ [3/7] Running Personal Transaction CRUD & Validation Tests...');

  // 3.1 Positive: Create Income Transaction
  const t1 = await api('/transactions', {
    method: 'POST',
    headers: u1H,
    body: {
      type: 'income',
      amount: 60000,
      category: 'Salary',
      date: '2026-10-23',
      description: 'Monthly Engineering Salary',
    },
  });
  assert.strictEqual(t1.status, 201, 'Create income transaction must return 201');
  assert.strictEqual(t1.data.data.amount, 60000);
  assert.strictEqual(t1.data.data.type, 'income');
  const txn1Id = t1.data.data._id;

  // 3.2 Positive: Create Expense Transaction
  const t2 = await api('/transactions', {
    method: 'POST',
    headers: u1H,
    body: {
      type: 'expense',
      amount: 4500,
      category: 'Food',
      date: '2026-10-23',
      description: 'Grocery Shopping at D-Mart',
    },
  });
  assert.strictEqual(t2.status, 201, 'Create expense transaction must return 201');
  assert.strictEqual(t2.data.data.amount, 4500);
  const txn2Id = t2.data.data._id;

  // 3.3 Negative: Create transaction with negative amount
  const negAmt = await api('/transactions', {
    method: 'POST',
    headers: u1H,
    body: { type: 'expense', amount: -500, category: 'Food', date: '2026-10-23' },
  });
  assert.strictEqual(negAmt.status, 400, 'Negative amount must return 400 Bad Request');

  // 3.4 Negative: Create transaction with 0 amount
  const zeroAmt = await api('/transactions', {
    method: 'POST',
    headers: u1H,
    body: { type: 'expense', amount: 0, category: 'Food', date: '2026-10-23' },
  });
  assert.strictEqual(zeroAmt.status, 400, 'Zero amount must return 400 Bad Request');

  // 3.5 Negative: Create transaction with invalid type
  const badType = await api('/transactions', {
    method: 'POST',
    headers: u1H,
    body: { type: 'crypto', amount: 1000, category: 'Food', date: '2026-10-23' },
  });
  assert.strictEqual(badType.status, 400, 'Invalid type must return 400 Bad Request');

  // 3.6 Negative: Tenant isolation: User 2 trying to access User 1's transaction
  const crossUserGet = await api(`/transactions/${txn1Id}`, { headers: u2H });
  assert.strictEqual(crossUserGet.status, 403, 'Cross-user transaction access must return 403 Forbidden');

  // 3.7 Negative: Tenant isolation: User 2 trying to update User 1's transaction
  const crossUserPut = await api(`/transactions/${txn1Id}`, {
    method: 'PUT',
    headers: u2H,
    body: { amount: 99999 },
  });
  assert.strictEqual(crossUserPut.status, 403, 'Cross-user transaction update must return 403 Forbidden');

  // 3.8 Positive: Update transaction amount (User 1 updating own transaction)
  const updateRes = await api(`/transactions/${txn2Id}`, {
    method: 'PUT',
    headers: u1H,
    body: { amount: 5000, description: 'Updated Groceries' },
  });
  assert.strictEqual(updateRes.status, 200, 'Update own transaction must return 200');
  assert.strictEqual(updateRes.data.data.amount, 5000);
  assert.strictEqual(updateRes.data.data.description, 'Updated Groceries');

  // 3.9 Negative: Update with invalid amount
  const updateInvalid = await api(`/transactions/${txn2Id}`, {
    method: 'PUT',
    headers: u1H,
    body: { amount: -100 },
  });
  assert.strictEqual(updateInvalid.status, 400, 'Update with negative amount must return 400');

  // 3.10 Positive: Verify Dashboard summary totals
  const dashRes = await api('/dashboard/summary', { headers: u1H });
  assert.strictEqual(dashRes.status, 200);
  const { totalIncome, totalExpense, balance, totals } = dashRes.data.data;
  assert.strictEqual(totalIncome, 60000, 'Total income must be 60000');
  assert.strictEqual(totalExpense, 5000, 'Total expense must be 5000');
  assert.strictEqual(balance, 55000, 'Net balance must be 55000');
  assert.strictEqual(totals.balance, 55000);

  // 3.11 Positive: Delete transaction
  const delRes = await api(`/transactions/${txn2Id}`, { method: 'DELETE', headers: u1H });
  assert.strictEqual(delRes.status, 200, 'Delete transaction must return 200');

  // 3.12 Positive: Verify deleted transaction no longer in list
  const listAfterDel = await api('/transactions', { headers: u1H });
  assert.strictEqual(listAfterDel.data.count, 1, 'Transaction count should decrement after delete');

  console.log('   ✓ Personal Transaction CRUD & Validation tests passed (12/12 assertions)');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 4: GROUP MANAGEMENT & MEMBERSHIP INTEGRITY TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ [4/7] Running Group Management & Membership Integrity Tests...');

  // 4.1 Positive: Create Group with User 1 as creator and Users 2, 3 as members
  const gCreate = await api('/groups', {
    method: 'POST',
    headers: u1H,
    body: {
      name: 'Goa Trip 2026',
      memberEmails: [user2Email, user3Email],
    },
  });
  assert.strictEqual(gCreate.status, 201, 'Group creation must return 201 Created');
  assert.strictEqual(gCreate.data.data.name, 'Goa Trip 2026');
  assert.strictEqual(gCreate.data.data.members.length, 3, 'Group must have exactly 3 members');
  const groupId = gCreate.data.data._id;

  // 4.2 Negative: Create group with empty name
  const emptyGrp = await api('/groups', {
    method: 'POST',
    headers: u1H,
    body: { name: ' ' },
  });
  assert.strictEqual(emptyGrp.status, 400, 'Empty group name must return 400 Bad Request');

  // 4.3 Positive: Member (User 2) can access group details
  const gViewU2 = await api(`/groups/${groupId}`, { headers: u2H });
  assert.strictEqual(gViewU2.status, 200, 'Group member must be able to view group details');

  // 4.4 Negative: Non-member user access
  const outsider = await api('/auth/signup', {
    method: 'POST',
    body: { name: 'Outsider', email: `outsider_${timestamp}@test.com`, password, confirmPassword: password },
  });
  const outsiderH = { Cookie: outsider.cookie };
  const outsiderAccess = await api(`/groups/${groupId}`, { headers: outsiderH });
  assert.strictEqual(outsiderAccess.status, 403, 'Non-member must be denied group access with 403');

  // 4.5 Negative: Non-creator (User 2) trying to delete group
  const nonAdminDel = await api(`/groups/${groupId}`, { method: 'DELETE', headers: u2H });
  assert.strictEqual(nonAdminDel.status, 403, 'Non-creator cannot delete group (must return 403)');

  // 4.6 Positive: Duplicate member prevention (updating group with duplicate emails)
  const dupMemberUpdate = await api(`/groups/${groupId}`, {
    method: 'PUT',
    headers: u1H,
    body: { memberEmails: [user2Email, user2Email, user3Email] },
  });
  assert.strictEqual(dupMemberUpdate.status, 200);
  assert.strictEqual(dupMemberUpdate.data.data.members.length, 3, 'Duplicate member emails must be deduplicated');

  console.log('   ✓ Group Management & Membership Integrity tests passed (6/6 assertions)');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 5: GROUP EXPENSE SPLITTING & CURRENCY PRECISION TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ [5/7] Running Group Expense Splitting & Precision Tests...');

  // 5.1 Positive: Equal Split of ₹12,000 paid by User 1 (Prachi)
  const exp1 = await api(`/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: u1H,
    body: {
      title: 'Goa Villa Stay',
      totalAmount: 12000,
      paidBy: user1Id,
      splitType: 'equal',
      participantIds: [user1Id, user2Id, user3Id],
      date: '2026-10-23',
    },
  });
  assert.strictEqual(exp1.status, 201, 'Equal split expense creation must return 201');
  assert.strictEqual(exp1.data.data.participants.length, 3);
  exp1.data.data.participants.forEach((p) => {
    assert.strictEqual(p.share, 4000, 'Each equal share of 12000 for 3 members must be 4000');
  });
  const exp1Id = exp1.data.data._id;

  // 5.2 Positive: Equal Split with Remainder Paise (₹100 divided by 3 members)
  // Largest remainder algorithm: 10000 paise / 3 = 3333 with remainder 1 paise
  // -> [33.34, 33.33, 33.33] summing to EXACTLY ₹100.00
  const expRemainder = await api(`/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: u1H,
    body: {
      title: 'Cab Fare',
      totalAmount: 100,
      paidBy: user1Id,
      splitType: 'equal',
      participantIds: [user1Id, user2Id, user3Id],
      date: '2026-10-23',
    },
  });
  assert.strictEqual(expRemainder.status, 201);
  const sharesSum = expRemainder.data.data.participants.reduce((acc, p) => acc + Math.round(p.share * 100), 0);
  assert.strictEqual(sharesSum, 10000, 'Shares with remainder paise must sum to exactly 10000 paise (₹100.00)');

  // 5.3 Positive: Custom Split (₹3,000 paid by User 2 - Rishab)
  // Prachi: ₹1,500, Rishab: ₹1,000, Sanchita: ₹500
  const exp2 = await api(`/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: u2H,
    body: {
      title: 'Beachside Seafood Dinner',
      totalAmount: 3000,
      paidBy: user2Id,
      splitType: 'custom',
      participantIds: [user1Id, user2Id, user3Id],
      customShares: {
        [user1Id]: 1500,
        [user2Id]: 1000,
        [user3Id]: 500,
      },
      date: '2026-10-23',
    },
  });
  assert.strictEqual(exp2.status, 201, 'Custom split expense must return 201');
  const customSum = exp2.data.data.participants.reduce((acc, p) => acc + p.share, 0);
  assert.strictEqual(customSum, 3000, 'Custom shares must sum exactly to 3000');
  const exp2Id = exp2.data.data._id;

  // 5.4 Negative: Custom Split Mismatch (shares don't sum to total amount)
  const expBadCustom = await api(`/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: u1H,
    body: {
      title: 'Mismatched Split',
      totalAmount: 5000,
      paidBy: user1Id,
      splitType: 'custom',
      participantIds: [user1Id, user2Id],
      customShares: { [user1Id]: 2000, [user2Id]: 2000 }, // sum 4000 != 5000
      date: '2026-10-23',
    },
  });
  assert.strictEqual(expBadCustom.status, 400, 'Custom split mismatch must return 400 Bad Request');

  // 5.5 Negative: Non-member as participant
  const expBadParticipant = await api(`/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: u1H,
    body: {
      title: 'Invalid Participant',
      totalAmount: 1000,
      paidBy: user1Id,
      splitType: 'equal',
      participantIds: [user1Id, outsider.data.user._id],
      date: '2026-10-23',
    },
  });
  assert.strictEqual(expBadParticipant.status, 400, 'Non-member participant must return 400');

  // 5.6 Positive: Update Group Expense (re-splitting)
  const updateExpRes = await api(`/groups/${groupId}/expenses/${exp1Id}`, {
    method: 'PUT',
    headers: u1H,
    body: {
      title: 'Goa Villa Luxury Stay',
      totalAmount: 15000,
      splitType: 'equal',
      participantIds: [user1Id, user2Id, user3Id],
    },
  });
  assert.strictEqual(updateExpRes.status, 200, 'Update group expense must return 200');
  assert.strictEqual(updateExpRes.data.data.totalAmount, 15000);
  assert.strictEqual(updateExpRes.data.data.participants[0].share, 5000);

  // Revert exp1 back to 12000 and clean up expRemainder so settlement math is clean:
  await api(`/groups/${groupId}/expenses/${exp1Id}`, {
    method: 'PUT',
    headers: u1H,
    body: {
      totalAmount: 12000,
      splitType: 'equal',
      participantIds: [user1Id, user2Id, user3Id],
    },
  });
  await api(`/groups/${groupId}/expenses/${expRemainder.data.data._id}`, {
    method: 'DELETE',
    headers: u1H,
  });

  console.log('   ✓ Group Expense Splitting & Precision tests passed (8/8 assertions)');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 6: GREEDY SETTLEMENT ENGINE & CASCADE DELETION TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ [6/7] Running Settlement Engine & Cascade Deletion Tests...');

  // Current State:
  // Expense 1: ₹12,000 paid by Prachi (User 1). Equal split: Prachi ₹4000, Rishab ₹4000, Sanchita ₹4000.
  // Expense 2: ₹3,000 paid by Rishab (User 2). Custom split: Prachi ₹1500, Rishab ₹1000, Sanchita ₹500.
  //
  // Net Balances:
  // Prachi   (User 1): Paid 12000 - Share (4000 + 1500 = 5500) = +6500 (Creditor)
  // Rishab   (User 2): Paid 3000  - Share (4000 + 1000 = 5000) = -2000 (Debtor)
  // Sanchita (User 3): Paid 0     - Share (4000 + 500  = 4500) = -4500 (Debtor)
  //
  // Greedy Settlement Plan:
  // Sanchita pays ₹4,500 to Prachi
  // Rishab pays ₹2,000 to Prachi
  // Total transactions = 2 (N-1 for 3 members). All debts settled!

  const setRes = await api(`/groups/${groupId}/settlement`, { headers: u1H });
  assert.strictEqual(setRes.status, 200, 'Settlement calculation must return 200');

  const { netBalances, settlementPlan } = setRes.data.data;

  // 6.1 Conservation of money: sum of all net balances must be exactly 0
  const sumBalances = Object.values(netBalances).reduce((a, b) => a + Math.round(b * 100), 0);
  assert.strictEqual(sumBalances, 0, 'Sum of all net balances must equal exactly 0 paise');

  // 6.2 Check individual net balance calculations
  assert.strictEqual(netBalances[user1Id], 6500, 'User 1 net balance must be +6500');
  assert.strictEqual(netBalances[user2Id], -2000, 'User 2 net balance must be -2000');
  assert.strictEqual(netBalances[user3Id], -4500, 'User 3 net balance must be -4500');

  // 6.3 Check greedy repayment plan
  assert.strictEqual(settlementPlan.length, 2, 'Settlement plan must have exactly 2 minimal transactions');
  const totalRepayments = settlementPlan.reduce((acc, t) => acc + t.amount, 0);
  assert.strictEqual(totalRepayments, 6500, 'Total repayments must equal total creditor amount (6500)');

  // 6.4 Cascade Delete Test: Deleting group must remove all associated expenses
  const delGrpRes = await api(`/groups/${groupId}`, { method: 'DELETE', headers: u1H });
  assert.strictEqual(delGrpRes.status, 200, 'Group deletion must return 200');

  // Verify group is gone
  const getDelGrp = await api(`/groups/${groupId}`, { headers: u1H });
  assert.strictEqual(getDelGrp.status, 404, 'Deleted group must return 404');

  // Verify expenses are gone
  const getDelExp = await api(`/groups/${groupId}/expenses`, { headers: u1H });
  assert.strictEqual(getDelExp.status, 404, 'Expenses of deleted group must return 404');

  console.log('   ✓ Settlement Engine & Cascade Deletion tests passed (7/7 assertions)');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 7: NODE.JS CORE MODULES & RECEIPT UPLOAD SECURITY TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ [7/7] Running Node.js Core Modules & Receipt Security Tests...');


  const { auditLogger, demonstrateBuffer, createTransactionStream } = require('./utils/nodeDemo');
  const upload = require('./services/uploadService');

  // 7.1 EventEmitter test
  let auditFired = false;
  auditLogger.once('transaction:created', (data) => {
    if (data.amount === 999) auditFired = true;
  });
  auditLogger.emit('transaction:created', { userId: user1Id, amount: 999, type: 'income' });
  assert.strictEqual(auditFired, true, 'Audit EventEmitter must trigger transaction:created event');

  // 7.2 Buffer demonstration test
  const bufResult = demonstrateBuffer();
  assert.ok(bufResult.byteLength > 0, 'Buffer byteLength must be greater than 0');
  assert.strictEqual(bufResult.decoded, 'SettleUp-Currency-Paise-Precision-2026', 'Buffer encode/decode must match');

  // 7.3 Stream demonstration test
  const sampleTxns = [{ id: 1, amount: 100 }, { id: 2, amount: 200 }];
  const stream = createTransactionStream(sampleTxns);
  const streamedItems = [];
  for await (const chunk of stream) {
    streamedItems.push(chunk);
  }
  assert.strictEqual(streamedItems.length, 2, 'Stream must yield all items asynchronously');

  // 7.4 Receipt Upload Security: Accept valid image (png)
  let uploadAccepted = false;
  upload.fileFilter({}, { originalname: 'receipt.png', mimetype: 'image/png' }, (err, ok) => {
    if (!err && ok) uploadAccepted = true;
  });
  assert.strictEqual(uploadAccepted, true, 'Multer filter must accept valid PNG receipt');

  // 7.5 Receipt Upload Security: Reject non-image / executable
  let uploadRejected = false;
  upload.fileFilter({}, { originalname: 'exploit.exe', mimetype: 'application/x-msdownload' }, (err) => {
    if (err) uploadRejected = true;
  });
  assert.strictEqual(uploadRejected, true, 'Multer filter must reject non-image executable file');

  console.log('   ✓ Node.js Core Modules & Receipt Security tests passed (5/5 assertions)');

  console.log('\n======================================================');
  console.log('🎉 AUDIT COMPLETE: ALL 53 TEST ASSERTIONS PASSED 100%!');
  console.log('======================================================\n');
  process.exit(0);
}


runTestSuite().catch((err) => {
  console.error('\n❌ AUDIT FAILED WITH ERROR:');
  console.error(err);
  process.exit(1);
});
