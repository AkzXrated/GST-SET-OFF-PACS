/**
 * GST SET-OFF VOUCHER STUDIO — UNIT TESTS
 * Pure Node.js runner: node Software/tests/core.test.js
 * Covers §9 testing requirements from blueprint.
 */

const assert = require('assert');
const path = require('path');
const core = require('../core.js');

let totalTests = 0;
let passedTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

console.log('\n--- 1. Testing evalMoney (Math Expression Parser) ---');

it('evaluates addition "186+11010+11196" to 2239200 paise (₹22,392.00)', () => {
  const r = core.evalMoney('186+11010+11196');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.paise, 2239200);
});

it('handles commas, spaces, and decimals: "1,000 + 2,500.50" to 350050 paise', () => {
  const r = core.evalMoney('1,000 + 2,500.50');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.paise, 350050);
});

it('handles parentheses and multiplication: "(100+50)*2" to 30000 paise', () => {
  const r = core.evalMoney('(100+50)*2');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.paise, 30000);
});

it('handles empty string and whitespace as 0 paise', () => {
  assert.strictEqual(core.evalMoney('').ok, true);
  assert.strictEqual(core.evalMoney('').paise, 0);
  assert.strictEqual(core.evalMoney('   ').paise, 0);
  assert.strictEqual(core.evalMoney(null).paise, 0);
});

it('rejects alphabetic characters gracefully without throwing', () => {
  const r = core.evalMoney('abc');
  assert.strictEqual(r.ok, false);
  assert.ok(r.error.length > 0);
});

it('rejects negative results with a clear error', () => {
  const r = core.evalMoney('5 - 10');
  assert.strictEqual(r.ok, false);
  assert.ok(r.error.includes('Negative amounts'));
});

it('rejects division by zero gracefully', () => {
  const r = core.evalMoney('1 / 0');
  assert.strictEqual(r.ok, false);
  assert.ok(r.error.includes('Division by zero'));
});

it('handles rupee symbol "₹1,557 + ₹1,557"', () => {
  const r = core.evalMoney('₹1,557 + ₹1,557');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.paise, 311400);
});

console.log('\n--- 2. Period and Financial Year Helpers ---');

it('derives period labels correctly', () => {
  assert.strictEqual(core.periodLabel('2026-04'), '2026-APRIL');
  assert.strictEqual(core.periodLabel('2027-03'), '2027-MARCH');
  assert.strictEqual(core.periodLabel('2026-APRIL'), '2026-APRIL');
});

it('derives Financial Year correctly across April boundary', () => {
  assert.strictEqual(core.fyOf('2026-04'), '2026-27');
  assert.strictEqual(core.fyOf('2026-12'), '2026-27');
  assert.strictEqual(core.fyOf('2027-01'), '2026-27');
  assert.strictEqual(core.fyOf('2027-03'), '2026-27');
  assert.strictEqual(core.fyOf('2027-04'), '2027-28');
});

it('generates 12 consecutive months for a FY in April-to-March order', () => {
  const m = core.monthsInFY('2026-27');
  assert.strictEqual(m.length, 12);
  assert.strictEqual(m[0], '2026-04');
  assert.strictEqual(m[11], '2027-03');
});

console.log('\n--- 3. Golden Vouchers (SOP Profile, Payment Legs OFF) ---');

const bankEntity = core.DEFAULT_ENTITIES.find(e => e.id === 'bank');
const neethiEntity = core.DEFAULT_ENTITIES.find(e => e.id === 'neethi');
const depotEntity = core.DEFAULT_ENTITIES.find(e => e.id === 'depot');

it('Bank HO — 2026-04 Golden Voucher', () => {
  const ret = {
    entityId: 'bank',
    period: '2026-04',
    fy: '2026-27',
    rcmPaise: 311400,
    itcPaise: 2239200,
    cashPaise: 0,
    rcmCpin: '2065126670',
    regCpin: ''
  };
  const v = core.buildVouchers(ret, bankEntity, core.DEFAULT_SETTINGS);
  assert.strictEqual(v.length, 2, 'Should generate Entry 0 and Entry 1, but NOT Entry 2');

  // E0
  const e0 = v.find(x => x.key === 'e0');
  assert.ok(e0);
  assert.strictEqual(e0.lines.length, 2);
  assert.strictEqual(e0.lines[0].side, 'DR');
  assert.strictEqual(e0.lines[0].code, '7800');
  assert.strictEqual(e0.lines[0].paise, 311400);
  assert.strictEqual(e0.lines[1].side, 'CR');
  assert.strictEqual(e0.lines[1].code, '4445');
  assert.strictEqual(e0.lines[1].paise, 311400);
  assert.strictEqual(e0.narrations[0].text, 'TO RCM CHALLAN ROUTING 2026-APRIL ADJ. CPIN 2065126670');
  assert.strictEqual(e0.balanced, true);

  // E1
  const e1 = v.find(x => x.key === 'e1');
  assert.ok(e1);
  assert.strictEqual(e1.lines.length, 2);
  assert.strictEqual(e1.lines[0].side, 'DR');
  assert.strictEqual(e1.lines[0].code, '7800');
  assert.strictEqual(e1.lines[0].paise, 2239200);
  assert.strictEqual(e1.lines[1].side, 'CR');
  assert.strictEqual(e1.lines[1].code, '0200');
  assert.strictEqual(e1.lines[1].paise, 2239200);
  assert.strictEqual(e1.narrations[0].text, 'TO GST SET OFF 2026-APRIL ADJ.');
  assert.strictEqual(e1.balanced, true);
});

it('Bank HO — 2026-06 Golden Voucher (Three entries: E0, E1, E2)', () => {
  const ret = {
    entityId: 'bank',
    period: '2026-06',
    fy: '2026-27',
    rcmPaise: 315700,
    itcPaise: 1149400,
    cashPaise: 2584200,
    rcmCpin: '2069092457',
    regCpin: '2069092457'
  };
  const v = core.buildVouchers(ret, bankEntity, core.DEFAULT_SETTINGS);
  assert.strictEqual(v.length, 3);
  assert.strictEqual(v[0].totalDrPaise, 315700);
  assert.strictEqual(v[1].totalDrPaise, 1149400);
  assert.strictEqual(v[2].totalDrPaise, 2584200);
  assert.strictEqual(v[2].narrations[0].text, 'TO GST REGULAR CASH ROUTING 2026-JUNE ADJ. CPIN 2069092457');
});

it('Neethy — 2026-07 Golden Voucher (E0 Dr 703/Cr 4445, E1 Dr 703/Cr 702, E2 Dr 703/Cr 4445)', () => {
  const ret = {
    entityId: 'neethi',
    period: '2026-07',
    fy: '2026-27',
    rcmPaise: 90000,
    itcPaise: 3617200,
    cashPaise: 235800,
    rcmCpin: '2072232736',
    regCpin: '2072232736'
  };
  const v = core.buildVouchers(ret, neethiEntity, core.DEFAULT_SETTINGS);
  assert.strictEqual(v.length, 3);
  // E0
  assert.strictEqual(v[0].lines[0].code, '703');
  assert.strictEqual(v[0].lines[1].code, '4445');
  // E1
  assert.strictEqual(v[1].lines[0].code, '703');
  assert.strictEqual(v[1].lines[1].code, '702');
  // E2
  assert.strictEqual(v[2].lines[0].code, '703');
  assert.strictEqual(v[2].lines[1].code, '4445');
});

it('Depot — 2026-04 Golden Voucher (RCM 694, ITC 0) -> Only E0 Dr 733/Cr 4445', () => {
  const ret = {
    entityId: 'depot',
    period: '2026-04',
    fy: '2026-27',
    rcmPaise: 69400,
    itcPaise: 0,
    cashPaise: 0,
    rcmCpin: '2065126672',
    regCpin: ''
  };
  const v = core.buildVouchers(ret, depotEntity, core.DEFAULT_SETTINGS);
  assert.strictEqual(v.length, 1);
  assert.strictEqual(v[0].key, 'e0');
  assert.strictEqual(v[0].lines[0].code, '733');
  assert.strictEqual(v[0].lines[1].code, '4445');
  assert.strictEqual(v[0].totalDrPaise, 69400);
});

console.log('\n--- 4. Payment Leg Toggles (4-line Vouchers) ---');

it('Generates 4-line E0 voucher when entry0IncludePaymentLeg is ON', () => {
  const settings = Object.assign({}, core.DEFAULT_SETTINGS, { entry0IncludePaymentLeg: true });
  const ret = {
    entityId: 'bank',
    period: '2026-04',
    rcmPaise: 311400,
    itcPaise: 0,
    cashPaise: 0
  };
  const v = core.buildVouchers(ret, bankEntity, settings);
  assert.strictEqual(v.length, 1);
  const e0 = v[0];
  assert.strictEqual(e0.lines.length, 4);
  assert.strictEqual(e0.lines[0].side, 'DR');
  assert.strictEqual(e0.lines[0].code, '7800');
  assert.strictEqual(e0.lines[1].side, 'CR');
  assert.strictEqual(e0.lines[1].code, '4445');
  assert.strictEqual(e0.lines[2].side, 'DR');
  assert.strictEqual(e0.lines[2].code, '4445');
  assert.strictEqual(e0.lines[3].side, 'CR');
  assert.strictEqual(e0.lines[3].code, '711');
  assert.strictEqual(e0.totalDrPaise, 622800);
  assert.strictEqual(e0.totalCrPaise, 622800);
  assert.strictEqual(e0.balanced, true);
});

console.log('\n--- 5. Annual Reconcile & Reversals ---');

it('Reversal — Neethy FY 2025-26: GL 643357.74 vs Portal 619684.00 (Over by 23673.74)', () => {
  const res = core.reconcileFY(neethiEntity, '2025-26', 64335774, 61968400, core.DEFAULT_SETTINGS);
  assert.strictEqual(res.direction, 'over');
  assert.strictEqual(res.diffPaise, 2367374);
  const v = res.reversalVoucher;
  assert.ok(v);
  assert.strictEqual(v.lines[0].side, 'DR');
  assert.strictEqual(v.lines[0].code, '702'); // Dr SA
  assert.strictEqual(v.lines[1].side, 'CR');
  assert.strictEqual(v.lines[1].code, '703'); // Cr SL
  assert.strictEqual(v.narrations[0].text, 'TO REVERSAL OF EXCESS FY 2025-26 SET-OFF ADJ.');
});

it('Reversal — Bank FY 2025-26: GL 190919.02 vs Portal 188534.00 (Over by 2385.02)', () => {
  const res = core.reconcileFY(bankEntity, '2025-26', 19091902, 18853400, core.DEFAULT_SETTINGS);
  assert.strictEqual(res.direction, 'over');
  assert.strictEqual(res.diffPaise, 238502);
  const v = res.reversalVoucher;
  assert.ok(v);
  assert.strictEqual(v.lines[0].side, 'DR');
  assert.strictEqual(v.lines[0].code, '0200'); // Dr SA
  assert.strictEqual(v.lines[1].side, 'CR');
  assert.strictEqual(v.lines[1].code, '7800'); // Cr SL
});

it('Reversal — Depot FY 2025-26: Matched (diff == 0)', () => {
  const res = core.reconcileFY(depotEntity, '2025-26', 500000, 500000, core.DEFAULT_SETTINGS);
  assert.strictEqual(res.direction, 'matched');
  assert.strictEqual(res.diffPaise, 0);
  assert.strictEqual(res.reversalVoucher, null);
});

console.log('\n--- 6. Seed Data Totals Reproducibility (§10) ---');

const SEED_RETURNS = [
  // Bank HO
  { entityId: 'bank', period: '2026-04', rcmPaise: 311400, itcPaise: 2239200, cashPaise: 0 },
  { entityId: 'bank', period: '2026-05', rcmPaise: 311400, itcPaise: 2880300, cashPaise: 319900 },
  { entityId: 'bank', period: '2026-06', rcmPaise: 315700, itcPaise: 1149400, cashPaise: 2584200 },
  { entityId: 'bank', period: '2026-07', rcmPaise: 311400, itcPaise: 613600, cashPaise: 3966400 },
  // Neethy
  { entityId: 'neethi', period: '2026-04', rcmPaise: 90000, itcPaise: 3355200, cashPaise: 0 },
  { entityId: 'neethi', period: '2026-05', rcmPaise: 90000, itcPaise: 3424400, cashPaise: 0 },
  { entityId: 'neethi', period: '2026-06', rcmPaise: 90000, itcPaise: 3734400, cashPaise: 0 },
  { entityId: 'neethi', period: '2026-07', rcmPaise: 90000, itcPaise: 3617200, cashPaise: 235800 },
  // Depot
  { entityId: 'depot', period: '2026-04', rcmPaise: 69400, itcPaise: 0, cashPaise: 0 },
  { entityId: 'depot', period: '2026-05', rcmPaise: 69400, itcPaise: 30600, cashPaise: 0 },
  { entityId: 'depot', period: '2026-06', rcmPaise: 69400, itcPaise: 9200, cashPaise: 0 },
  { entityId: 'depot', period: '2026-07', rcmPaise: 69400, itcPaise: 171000, cashPaise: 0 }
];

it('Bank HO Apr-Jul totals match §10 exactly: RCM 12,499 · ① 68,825 · ② 68,705', () => {
  const bankRecs = SEED_RETURNS.filter(r => r.entityId === 'bank');
  const totRcm = bankRecs.reduce((s, r) => s + r.rcmPaise, 0);
  const totItc = bankRecs.reduce((s, r) => s + r.itcPaise, 0);
  const totCash = bankRecs.reduce((s, r) => s + r.cashPaise, 0);

  assert.strictEqual(totRcm, 1249900, 'Bank RCM should be 12,499.00');
  assert.strictEqual(totItc, 6882500, 'Bank ITC should be 68,825.00');
  assert.strictEqual(totCash, 6870500, 'Bank Cash should be 68,705.00');
});

it('Neethy Apr-Jul totals match §10 exactly: RCM 3,600 · ① 141,312 · ② 2,358', () => {
  const neethiRecs = SEED_RETURNS.filter(r => r.entityId === 'neethi');
  const totRcm = neethiRecs.reduce((s, r) => s + r.rcmPaise, 0);
  const totItc = neethiRecs.reduce((s, r) => s + r.itcPaise, 0);
  const totCash = neethiRecs.reduce((s, r) => s + r.cashPaise, 0);

  assert.strictEqual(totRcm, 360000, 'Neethy RCM should be 3,600.00');
  assert.strictEqual(totItc, 14131200, 'Neethy ITC should be 141,312.00');
  assert.strictEqual(totCash, 235800, 'Neethy Cash should be 2,358.00');
});

it('Depot Apr-Jul totals match §10 exactly: RCM 2,776 · ① 2,108 · ② 0', () => {
  const depotRecs = SEED_RETURNS.filter(r => r.entityId === 'depot');
  const totRcm = depotRecs.reduce((s, r) => s + r.rcmPaise, 0);
  const totItc = depotRecs.reduce((s, r) => s + r.itcPaise, 0);
  const totCash = depotRecs.reduce((s, r) => s + r.cashPaise, 0);

  assert.strictEqual(totRcm, 277600, 'Depot RCM should be 2,776.00');
  assert.strictEqual(totItc, 210800, 'Depot ITC should be 2,108.00');
  assert.strictEqual(totCash, 0, 'Depot Cash should be 0.00');
});

console.log('\n--- 7. Rule 38 & GST Calculator ---');

it('calculates Bank HO 50% Rule 38 invoice correctly (Exclusive ₹10,000 @ 18%)', () => {
  const res = core.calculateRule38GST('bank', 1000000, 18, false);
  assert.strictEqual(res.taxablePaise, 1000000);
  assert.strictEqual(res.totalGstPaise, 180000);
  assert.strictEqual(res.cgstPaise, 90000);
  assert.strictEqual(res.sgstPaise, 90000);
  assert.strictEqual(res.eligiblePaise, 90000); // 50% Rule 38
  assert.strictEqual(res.expenseAbsorptionPaise, 90000);
  assert.strictEqual(res.invoiceTotalPaise, 1180000);
});

it('calculates 100% eligible entity invoice (Neethy, Inclusive ₹11,800 @ 18%)', () => {
  const res = core.calculateRule38GST('neethi', 1180000, 18, true);
  assert.strictEqual(res.taxablePaise, 1000000);
  assert.strictEqual(res.totalGstPaise, 180000);
  assert.strictEqual(res.eligiblePaise, 180000); // 100%
  assert.strictEqual(res.expenseAbsorptionPaise, 0);
});

console.log('\n--- 8. Store Memory, Commit, Migration & Import/Export ---');

const store = require('../store.js');

it('Store initializes with 18 audited seed returns and 2 reversals', () => {
  store.resetToAuditedSeed();
  const db = store.getDB();
  assert.strictEqual(db.returns.length, 18);
  assert.strictEqual(db.reversals.length, 2);
  assert.strictEqual(db.schemaVersion, 2);
});

it('Verifies Audited August & September 2026 seed returns match GL & GSTR-3B filings', () => {
  store.resetToAuditedSeed();
  // Bank Aug 2026
  const bankAug = store.getReturn('bank', '2026-08');
  assert.strictEqual(bankAug.itcPaise, 1269200);
  assert.strictEqual(bankAug.cashPaise, 1948800);
  assert.strictEqual(bankAug.rcmPaise, 314100);
  assert.strictEqual(bankAug.glStatus, 'posted');

  // Bank Sep 2026
  const bankSep = store.getReturn('bank', '2026-09');
  assert.strictEqual(bankSep.itcPaise, 431200);
  assert.strictEqual(bankSep.cashPaise, 2577000);
  assert.strictEqual(bankSep.rcmPaise, 311400);
  assert.strictEqual(bankSep.glStatus, 'posted');

  // Neethi Aug & Sep 2026
  const neethiAug = store.getReturn('neethi', '2026-08');
  assert.strictEqual(neethiAug.itcPaise, 3432600);
  assert.strictEqual(neethiAug.cashPaise, 380800);
  assert.strictEqual(neethiAug.glStatus, 'posted');

  const neethiSep = store.getReturn('neethi', '2026-09');
  assert.strictEqual(neethiSep.itcPaise, 3770600);
  assert.strictEqual(neethiSep.cashPaise, 294600);
  assert.strictEqual(neethiSep.glStatus, 'posted');

  // Depot Aug & Sep 2026
  const depotAug = store.getReturn('depot', '2026-08');
  assert.strictEqual(depotAug.itcPaise, 446600);
  assert.strictEqual(depotAug.rcmPaise, 69400);
  assert.strictEqual(depotAug.glStatus, 'posted');

  const depotSep = store.getReturn('depot', '2026-09');
  assert.strictEqual(depotSep.itcPaise, 197600);
  assert.strictEqual(depotSep.rcmPaise, 69400);
  assert.strictEqual(depotSep.glStatus, 'posted');
});

it('Store migrates v1 database to v2 by populating missing audited Aug & Sep returns', () => {
  const legacyV1Payload = {
    schemaVersion: 1,
    returns: [
      { id: 'bank_2026-04', entityId: 'bank', period: '2026-04', itcPaise: 2239200, cashPaise: 0, rcmPaise: 311400 }
    ],
    reversals: []
  };
  const preview = store.previewImport(JSON.stringify(legacyV1Payload));
  assert.strictEqual(preview.valid, true);
});

it('Store handles unique (entityId, period) upsert', () => {
  store.saveReturn({
    entityId: 'bank',
    period: '2026-08',
    rcmPaise: 311400,
    itcPaise: 500000,
    cashPaise: 0,
    verified: true
  });
  let ret = store.getReturn('bank', '2026-08');
  assert.ok(ret);
  assert.strictEqual(ret.itcPaise, 500000);

  // Update same month
  store.saveReturn({
    entityId: 'bank',
    period: '2026-08',
    rcmPaise: 311400,
    itcPaise: 600000,
    cashPaise: 0,
    verified: true
  });
  ret = store.getReturn('bank', '2026-08');
  assert.strictEqual(ret.itcPaise, 600000);
});

it('Store exports JSON and previews import with diff calculation', () => {
  const jsonStr = store.exportJSONString();
  const preview = store.previewImport(jsonStr);
  assert.strictEqual(preview.valid, true);
  assert.strictEqual(preview.unchangedReturnsCount >= 12, true);
  assert.strictEqual(preview.newReturnsCount, 0);
});

it('Store merge mode preserves newer updatedAt records', () => {
  const importPayload = {
    schemaVersion: 1,
    returns: [
      {
        id: 'bank_2026-04',
        entityId: 'bank',
        period: '2026-04',
        rcmPaise: 311400,
        itcPaise: 9999900,
        cashPaise: 0,
        updatedAt: '2099-01-01T00:00:00.000Z'
      }
    ],
    reversals: []
  };
  const preview = store.previewImport(JSON.stringify(importPayload));
  assert.strictEqual(preview.valid, true);
  assert.strictEqual(preview.updatedReturnsCount, 1);

  store.applyImport(preview, 'merge');
  const updated = store.getReturn('bank', '2026-04');
  assert.strictEqual(updated.itcPaise, 9999900);
});

console.log('\n--- 9. GSTR-3B Text & JSON Parser ---');

it('parses GSTR-3B JSON with Table 6.1 ITC, cash, and RCM', () => {
  const jsonInput = JSON.stringify({
    gstin: '32AABAV5891L1Z1',
    ret_period: '042026',
    tx_pmt: {
      itc_pd: { i_pdi: 186, c_pdc: 11010, s_pds: 11196 },
      pdcash: { iamt: 0, camt: 0, samt: 0 }
    },
    inward_sup: {
      isup_details: [{ iamt: 0, camt: 1557, samt: 1557 }]
    }
  });
  const res = core.parseGSTR3B(jsonInput);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.entityId, 'bank');
  assert.strictEqual(res.period, '2026-04');
  assert.strictEqual(res.itc.expr, '186+11010+11196');
  assert.strictEqual(res.itc.total, 22392);
  assert.strictEqual(res.rcm.total, 3114);
  assert.strictEqual(res.rcm.expr, '1557+1557');
});

it('parses GSTR-3B plain text from Table 6.1 and Reverse Charge', () => {
  const textInput = `
    GSTIN: 32AABAV5891L1Z1
    Return Period: April 2026
    ARN: AA320926391808L
    Date of Filing: 20/05/2026
    6.1 Payment of tax
    Integrated tax 186.00 186.00 0.00
    Central tax 11,010.00 11,010.00 0.00
    State/UT tax 11,196.00 11,196.00 0.00
    3.1 (d) Inward supplies liable to reverse charge 0.00 0.00 1,557.00 1,557.00 0.00
  `;
  const res = core.parseGSTR3B(textInput);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.entityId, 'bank');
  assert.strictEqual(res.period, '2026-04');
  assert.strictEqual(res.arn, 'AA320926391808L');
  assert.strictEqual(res.filedOn, '2026-05-20');
  assert.strictEqual(res.itc.expr, '186+11010+11196');
  assert.strictEqual(res.rcm.total, 3114);
});

console.log('\n--- 10. Audited FY 2026-27 Integer-Paise Cumulative Math & Slips ---');

it('verifies exact dynamic FY 2026-27 cumulative totals (Apr-Sep 2026) across 18 returns', () => {
  store.resetToAuditedSeed();
  const db = store.getDB();
  const fy26Returns = db.returns.filter(r => r.fy === '2026-27');
  assert.strictEqual(fy26Returns.length, 18, 'Must have exactly 18 returns for Apr-Sep 2026');

  let totalItc = 0;
  let totalCash = 0;
  let totalRcm = 0;

  fy26Returns.forEach(r => {
    totalItc += r.itcPaise || 0;
    totalCash += r.cashPaise || 0;
    totalRcm += r.rcmPaise || 0;
  });

  // 1. Total ITC Set-Off: ₹3,07,723.00 (Bank 85,829 + Neethi 2,13,344 + Depot 8,550)
  assert.strictEqual(totalItc, 30772300, 'ITC Set-Off must equal 30,772,300 paise (₹3,07,723.00)');

  // 2. Total Regular Cash: ₹1,23,075.00 (Bank 1,13,963 + Neethi 9,112 + Depot 0)
  assert.strictEqual(totalCash, 12307500, 'Regular Cash must equal 12,307,500 paise (₹1,23,075.00)');

  // 3. Total RCM Cash: ₹28,318.00 (Bank 18,754 + Neethi 5,400 + Depot 4,164)
  assert.strictEqual(totalRcm, 2831800, 'RCM Cash must equal 2,831,800 paise (₹28,318.00)');

  // 4. Combined 4445 Cash Outflow: ₹1,51,393.00 (123,075 + 28,318)
  assert.strictEqual(totalCash + totalRcm, 15139300, 'Combined 4445 cash must equal 15,139,300 paise (₹1,51,393.00)');
});

it('verifies Neethy May 2026 SGST shortfall variance detection and catch-up voucher', () => {
  const neethiMay = store.getReturn('neethi', '2026-05');
  assert.ok(neethiMay);
  assert.strictEqual(neethiMay.itcPaise, 3424400, 'GSTR-3B Table 6.1 ITC is ₹34,244.00');

  // PacScore GL posted on 25-Jul-2026 only recorded CGST Slip 73 for ₹17,122.00
  const glPostedPaise = 1712200;
  const variancePaise = glPostedPaise - neethiMay.itcPaise;
  assert.strictEqual(variancePaise, -1712200, 'Variance must be exactly -₹17,122.00');

  // Verify catch-up voucher generation produces Dr SL 703 / Cr SA 702 for ₹17,122.00
  const catchupRec = {
    entityId: 'neethi',
    period: '2026-05',
    fy: '2026-27',
    itcPaise: 1712200,
    cashPaise: 0,
    rcmPaise: 0
  };
  const db = store.getDB();
  const neethiEnt = db.entities.find(e => e.id === 'neethi');
  const vouchers = core.buildVouchers(catchupRec, neethiEnt, db.settings);
  assert.strictEqual(vouchers.length, 1);
  assert.strictEqual(vouchers[0].lines[0].code, '703'); // Dr SL Output Tax
  assert.strictEqual(vouchers[0].lines[0].paise, 1712200);
  assert.strictEqual(vouchers[0].lines[1].code, '702'); // Cr SA Input Tax
  assert.strictEqual(vouchers[0].lines[1].paise, 1712200);
});

it('verifies granular PacScore slip tracking and September 2026 net clearing pattern', () => {
  const bankAug = store.getReturn('bank', '2026-08');
  assert.strictEqual(bankAug.e0Slip, '273', 'Bank Aug RCM slip 273');
  assert.strictEqual(bankAug.e1Slip, '275', 'Bank Aug ITC slip 275');
  assert.strictEqual(bankAug.e2Slip, '279', 'Bank Aug Reg Cash slip 279');
  assert.strictEqual(bankAug.pmt06Filed, true);

  const bankSep = store.getReturn('bank', '2026-09');
  assert.strictEqual(bankSep.e0Slip, '611', 'Bank Sep RCM slip 611');
  assert.strictEqual(bankSep.e1Slip, '613', 'Bank Sep ITC slip 613');
  assert.strictEqual(bankSep.e2Slip, '615/617', 'Bank Sep Reg Cash slip 615 combined in 617');
  assert.strictEqual(bankSep.pmt06Filed, true);
});

console.log(`\n========================================`);
console.log(`All ${passedTests}/${totalTests} unit tests passed successfully!`);
console.log(`========================================\n`);
