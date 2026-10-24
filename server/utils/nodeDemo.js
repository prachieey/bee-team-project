// utils/nodeDemo.js
// Node.js Core Modules Demonstration (Lectures 37–38)
// Demonstrates: EventEmitter, Buffer, Stream, fs, and path modules in Node.js

const EventEmitter = require('events');
const fs           = require('fs');
const path         = require('path');
const { Readable } = require('stream');

// ── 1. EventEmitter: Financial Audit Logger ──────────────────────────────────
class AuditEmitter extends EventEmitter {}
const auditLogger = new AuditEmitter();

// Register listener for transaction and settlement audit events
auditLogger.on('transaction:created', (data) => {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT EVENT] Transaction Created at ${timestamp}: User ${data.userId} - ₹${data.amount} (${data.type})`);
});

auditLogger.on('settlement:computed', (data) => {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT EVENT] Settlement Computed at ${timestamp}: Group ${data.groupId} - ${data.transactionsCount} payments`);
});

// ── 2. Buffer Demonstration: Currency Hash & Security Token ──────────────────
function demonstrateBuffer() {
  // Allocate buffer and write string data
  const buf = Buffer.from('SettleUp-Currency-Paise-Precision-2026', 'utf-8');
  const base64Token = buf.toString('base64');
  const decodedString = Buffer.from(base64Token, 'base64').toString('utf-8');

  return {
    byteLength: buf.length,
    hex:        buf.toString('hex').slice(0, 32),
    base64:     base64Token,
    decoded:    decodedString,
  };
}

// ── 3. Stream Demonstration: Streaming Financial Report ───────────────────────
function createTransactionStream(transactions) {
  return new Readable({
    objectMode: true,
    read() {
      for (const txn of transactions) {
        this.push(txn);
      }
      this.push(null); // End of stream
    },
  });
}

module.exports = {
  auditLogger,
  demonstrateBuffer,
  createTransactionStream,
};
