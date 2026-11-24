'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Stored order lines currently have price, qty, and HSN but no GST rate.
// Keep gstRate explicitly null here to pin invoice.js's fallback behaviour.
function line(name, price, qty, hsn) {
  return { name, price, qty, hsn, gstRate: null };
}

function figures(items, coupon) {
  const order = { items, coupon };
  return {
    invoice: invoice.computeInvoiceFigures(order),
    checkout: pricing.computeTotals(items, coupon)
  };
}

test('FIXED BEHAVIOUR: #1001 invoice uses the 18% and 5% HSN slabs', () => {
  const items = [
    line('Assam CTC Masala Chai 250g', 140, 2, '0902'),
    line('Unpolished Toor Dal 1kg', 165, 2, '0713')
  ];
  const result = figures(items, '');

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, cgst: result.invoice.cgst, sgst: result.invoice.sgst, total: result.invoice.total, gst: result.invoice.rows.map(row => row.gstPercent) },
    { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9, gst: [18, 5] }
  );
  assert.deepEqual(
    { subtotal: result.checkout.subtotal, discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 }
  );
});

test('FIXED BEHAVIOUR: #1002 invoice applies SAVE10 before HSN GST', () => {
  const items = [
    line('Indrayani Basmati Rice 5kg', 640, 1, '1006'),
    line('Cold-Pressed Sunflower Oil 1L', 190, 2, '1512')
  ];
  const result = figures(items, 'SAVE10');

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total, gst: result.invoice.rows.map(row => row.gstPercent) },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9, gst: [5, 5] }
  );
  assert.deepEqual(
    { subtotal: result.checkout.subtotal, discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('FIXED BEHAVIOUR: #1004 invoice applies the SAVE10 maximum discount', () => {
  const items = [line('Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508')];
  const result = figures(items, 'SAVE10');

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total, gst: result.invoice.rows.map(row => row.gstPercent) },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5, gst: [5] }
  );
  assert.deepEqual(
    { subtotal: result.checkout.subtotal, discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: #1008 invoice and checkout match for 18% items without a coupon', () => {
  const items = [
    line('Assam CTC Masala Chai 250g', 140, 1, '0902'),
    line('Kokum Sherbet Concentrate 750ml', 180, 2, '2106')
  ];
  const result = figures(items, '');

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, cgst: result.invoice.cgst, sgst: result.invoice.sgst, total: result.invoice.total, gst: result.invoice.rows.map(row => row.gstPercent) },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, gst: [18, 18] }
  );
  assert.deepEqual(
    { subtotal: result.checkout.subtotal, discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 }
  );
});

test('Invoice figures match checkout HSN slabs, capped discounts, and totals', () => {
  const cases = [
    { id: 1001, coupon: '', items: [line('Assam CTC Masala Chai 250g', 140, 2, '0902'), line('Unpolished Toor Dal 1kg', 165, 2, '0713')] },
    { id: 1002, coupon: 'SAVE10', items: [line('Indrayani Basmati Rice 5kg', 640, 1, '1006'), line('Cold-Pressed Sunflower Oil 1L', 190, 2, '1512')] },
    { id: 1004, coupon: 'SAVE10', items: [line('Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508')] },
    { id: 1008, coupon: '', items: [line('Assam CTC Masala Chai 250g', 140, 1, '0902'), line('Kokum Sherbet Concentrate 750ml', 180, 2, '2106')] }
  ];

  for (const example of cases) {
    const result = figures(example.items, example.coupon);
    assert.deepEqual({
      subtotal: result.invoice.subtotal,
      discount: result.invoice.discount,
      tax: result.invoice.tax,
      cgst: result.invoice.cgst,
      sgst: result.invoice.sgst,
      total: result.invoice.total,
      lines: result.invoice.rows.map(row => ({ gstPercent: row.gstPercent, gross: row.line, tax: row.lineTax }))
    }, {
      subtotal: result.checkout.subtotal,
      discount: result.checkout.discount,
      tax: result.checkout.tax,
      cgst: result.checkout.cgst,
      sgst: result.checkout.sgst,
      total: result.checkout.total,
      lines: result.checkout.lines.map(row => ({ gstPercent: row.gstPercent, gross: row.gross, tax: row.tax }))
    }, `Order #${example.id}`);
  }
});
