/**
 * GST SET-OFF VOUCHER STUDIO — PERSISTENCE & MEMORY ENGINE (store.js)
 * Manages localStorage persistence, transactions, audit logs, UI state memory,
 * migrations, diff-based import/export, and backup tracking.
 * 
 * Works in both Browser and Node.js test environments.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    var core = require('./core.js');
    module.exports = factory(core);
  } else {
    root.GSTStore = factory(root.GSTCore);
  }
}(typeof self !== 'undefined' ? self : this, function (core) {
  'use strict';

  var DB_KEY = 'gstvs.v1.db';
  var UI_KEY = 'gstvs.v1.ui';
  var CURRENT_SCHEMA_VERSION = 2;
  var MAX_AUDIT_LOGS = 2000;

  // In-memory fallback if localStorage is unavailable
  var memoryStorage = {};

  function getStorageItem(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage read error:', e);
    }
    return memoryStorage[key] || null;
  }

  function setStorageItem(key, value) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (e) {
      console.warn('localStorage write error:', e);
      throw e;
    }
    memoryStorage[key] = value;
    return true;
  }

  function removeStorageItem(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {}
    delete memoryStorage[key];
  }

  // --------------------------------------------------------------------------
  // FACTORY AUDITED SEED DATA (APR-JUL 2026 + FY 25-26 REVERSALS)
  // --------------------------------------------------------------------------

  function createAuditedSeedReturns() {
    var now = new Date().toISOString();
    return [
      // Bank HO
      {
        id: 'bank_2026-04',
        entityId: 'bank',
        period: '2026-04',
        fy: '2026-27',
        itcPaise: 2239200,
        cashPaise: 0,
        rcmPaise: 311400,
        rcmCpin: '2065126670',
        regCpin: '',
        e0Slip: '68',
        e1Slip: '67',
        e2Slip: '',
        pmt06Filed: true,
        arn: 'AA320426310313V',
        filedOn: '2026-05-18',
        verified: true,
        outputTaxLiabilityPaise: 2239200,
        glStatus: 'posted',
        glPostedOn: '2026-07-22',
        rawInputs: { itc: '186+11010+11196', cash: '0', rcm: '3114' },
        notes: 'Audited & posted. Rent RCM paid mid-month (Slip 68). Set-off SA 0200 Slip 67.',
        createdAt: '2026-07-22T10:00:00.000Z',
        updatedAt: '2026-07-22T10:00:00.000Z'
      },
      {
        id: 'bank_2026-05',
        entityId: 'bank',
        period: '2026-05',
        fy: '2026-27',
        itcPaise: 2880300,
        cashPaise: 319900,
        rcmPaise: 311400,
        rcmCpin: '2067109044',
        regCpin: '2067109044',
        e0Slip: '71',
        e1Slip: '68',
        e2Slip: '72',
        pmt06Filed: true,
        arn: 'AA320526427896V',
        filedOn: '2026-06-19',
        verified: true,
        outputTaxLiabilityPaise: 3200200,
        glStatus: 'posted',
        glPostedOn: '2026-07-22',
        rawInputs: { itc: '541+14224+14038', cash: '1236+1963', rcm: '3114' },
        notes: 'Regular cash challan paid (4445 Slip 72). Set-off SA 0200 Slip 68.',
        createdAt: '2026-07-22T10:00:00.000Z',
        updatedAt: '2026-07-22T10:00:00.000Z'
      },
      {
        id: 'bank_2026-06',
        entityId: 'bank',
        period: '2026-06',
        fy: '2026-27',
        itcPaise: 1149400,
        cashPaise: 2584200,
        rcmPaise: 315700,
        rcmCpin: '2069092457',
        regCpin: '2069092457',
        e0Slip: '76',
        e1Slip: '70',
        e2Slip: '77',
        pmt06Filed: true,
        arn: 'AA320626396230B',
        filedOn: '2026-07-17',
        verified: true,
        outputTaxLiabilityPaise: 3733600,
        glStatus: 'posted',
        glPostedOn: '2026-07-22',
        rawInputs: { itc: '1842+4826+4826', cash: '12000+13842', rcm: '3157' },
        notes: 'Audited & posted. Rent RCM slight increment (Slip 76). 4445 Slip 77.',
        createdAt: '2026-07-22T10:00:00.000Z',
        updatedAt: '2026-07-22T10:00:00.000Z'
      },
      {
        id: 'bank_2026-07',
        entityId: 'bank',
        period: '2026-07',
        fy: '2026-27',
        itcPaise: 613600,
        cashPaise: 3966400,
        rcmPaise: 311400,
        rcmCpin: '2072232735',
        regCpin: '2072232735',
        e0Slip: '197',
        e1Slip: '195',
        e2Slip: '199',
        pmt06Filed: true,
        arn: 'AA320726385096Y',
        filedOn: '2026-08-18',
        verified: true,
        outputTaxLiabilityPaise: 4580000,
        glStatus: 'posted',
        glPostedOn: '2026-08-22',
        rawInputs: { itc: '274+2931+2931', cash: '19695+19969', rcm: '3114' },
        notes: 'Audited & posted on 22-Aug-2026 (SA 0200 Slip 195; 4445 Slips 197/199).',
        createdAt: '2026-08-22T10:00:00.000Z',
        updatedAt: '2026-08-22T10:00:00.000Z'
      },
      {
        id: 'bank_2026-08',
        entityId: 'bank',
        period: '2026-08',
        fy: '2026-27',
        itcPaise: 1269200,
        cashPaise: 1948800,
        rcmPaise: 314100,
        rcmCpin: '',
        regCpin: '',
        e0Slip: '273',
        e1Slip: '275',
        e2Slip: '279',
        pmt06Filed: true,
        arn: 'AA320826319650A',
        filedOn: '2026-09-17',
        verified: true,
        outputTaxLiabilityPaise: 3218000,
        glStatus: 'posted',
        glPostedOn: '2026-10-06',
        rawInputs: { itc: '1200+5746+5746', cash: '9144+10344', rcm: '27+1557+1557' },
        notes: 'Audited from GSTR-3B & GL. Posted 06-Oct-2026 (SA 0200 Slip 275 Cr ₹12,692; 4445 Slip 273/279 Cr ₹22,629).',
        createdAt: '2026-10-06T10:00:00.000Z',
        updatedAt: '2026-10-06T10:00:00.000Z'
      },
      {
        id: 'bank_2026-09',
        entityId: 'bank',
        period: '2026-09',
        fy: '2026-27',
        itcPaise: 431200,
        cashPaise: 2577000,
        rcmPaise: 311400,
        rcmCpin: '',
        regCpin: '',
        e0Slip: '611',
        e1Slip: '613',
        e2Slip: '615/617',
        pmt06Filed: true,
        arn: 'AA320926391808L',
        filedOn: '2026-10-17',
        verified: true,
        outputTaxLiabilityPaise: 3008200,
        glStatus: 'posted',
        glPostedOn: '2026-10-31',
        rawInputs: { itc: '1090+1611+1611', cash: '12340+13430', rcm: '1557+1557' },
        notes: 'Audited from GSTR-3B & GL. Posted 31-Oct-2026 (SA 0200 Slip 613 Cr ₹4,312; 4445 Slips 611/615/617 Net Clearing ₹28,884).',
        createdAt: '2026-10-31T10:00:00.000Z',
        updatedAt: '2026-10-31T10:00:00.000Z'
      },

      // Neethy Medical Store
      {
        id: 'neethi_2026-04',
        entityId: 'neethi',
        period: '2026-04',
        fy: '2026-27',
        itcPaise: 3355200,
        cashPaise: 0,
        rcmPaise: 90000,
        rcmCpin: '2065126671',
        regCpin: '',
        e0Slip: '89',
        e1Slip: '69',
        e2Slip: '',
        pmt06Filed: true,
        arn: 'AA320426310082W',
        filedOn: '2026-05-18',
        verified: true,
        outputTaxLiabilityPaise: 3355200,
        glStatus: 'posted',
        glPostedOn: '2026-07-25',
        rawInputs: { itc: '16776+16776', cash: '0', rcm: '900' },
        notes: 'Posted 25-Jul-2026 (SL 703 Slip 69 Dr ₹33,552; SA 702 Slip 78 Cr ₹33,552; 4445 Slip 89 Cr ₹900). 100% ITC absorption.',
        createdAt: '2026-07-22T10:00:00.000Z',
        updatedAt: '2026-07-25T10:00:00.000Z'
      },
      {
        id: 'neethi_2026-05',
        entityId: 'neethi',
        period: '2026-05',
        fy: '2026-27',
        itcPaise: 3424400,
        cashPaise: 0,
        rcmPaise: 90000,
        rcmCpin: '2067109045',
        regCpin: '',
        e0Slip: '91',
        e1Slip: '73',
        e2Slip: '',
        pmt06Filed: true,
        arn: 'AA3205264276448',
        filedOn: '2026-06-19',
        verified: true,
        outputTaxLiabilityPaise: 3424400,
        glStatus: 'reconciled',
        glPostedOn: '2026-07-25',
        rawInputs: { itc: '17122+17122', cash: '0', rcm: '900' },
        notes: 'Partial GL posting on 25-Jul-2026 (Slip 73/75 posted ₹17,122 CGST; SGST ₹17,122 pending posting in GL).',
        createdAt: '2026-07-22T10:00:00.000Z',
        updatedAt: '2026-07-25T10:00:00.000Z'
      },
      {
        id: 'neethi_2026-06',
        entityId: 'neethi',
        period: '2026-06',
        fy: '2026-27',
        itcPaise: 3734400,
        cashPaise: 0,
        rcmPaise: 90000,
        rcmCpin: '2069092458',
        regCpin: '',
        e0Slip: '93',
        e1Slip: '86',
        e2Slip: '',
        pmt06Filed: true,
        arn: 'AA3206263963820',
        filedOn: '2026-07-17',
        verified: true,
        outputTaxLiabilityPaise: 3734400,
        glStatus: 'posted',
        glPostedOn: '2026-07-25',
        rawInputs: { itc: '18672+18672', cash: '0', rcm: '900' },
        notes: 'Posted 25-Jul-2026 (SL 703 Slip 86 Dr ₹37,344; SA 702 Slip 88 Cr ₹37,344; 4445 Slip 93 Cr ₹900).',
        createdAt: '2026-07-22T10:00:00.000Z',
        updatedAt: '2026-07-25T10:00:00.000Z'
      },
      {
        id: 'neethi_2026-07',
        entityId: 'neethi',
        period: '2026-07',
        fy: '2026-27',
        itcPaise: 3617200,
        cashPaise: 235800,
        rcmPaise: 90000,
        rcmCpin: '2072232736',
        regCpin: '2072232736',
        e0Slip: '187',
        e1Slip: '158',
        e2Slip: '188',
        pmt06Filed: true,
        arn: 'AA320726384813X',
        filedOn: '2026-08-18',
        verified: true,
        outputTaxLiabilityPaise: 3853000,
        glStatus: 'posted',
        glPostedOn: '2026-08-22',
        rawInputs: { itc: '18086+18086', cash: '1179+1179', rcm: '900' },
        notes: 'Cash payment passed and posted in PacScore (SA 702 Slip 158 Cr ₹36,172; 4445 Slip 188 Cr ₹2,358).',
        createdAt: '2026-08-22T10:00:00.000Z',
        updatedAt: '2026-08-22T10:00:00.000Z'
      },
      {
        id: 'neethi_2026-08',
        entityId: 'neethi',
        period: '2026-08',
        fy: '2026-27',
        itcPaise: 3432600,
        cashPaise: 380800,
        rcmPaise: 90000,
        rcmCpin: '',
        regCpin: '',
        e0Slip: '286',
        e1Slip: '288',
        e2Slip: '290',
        pmt06Filed: true,
        arn: 'AA3208263194463',
        filedOn: '2026-09-17',
        verified: true,
        outputTaxLiabilityPaise: 3813400,
        glStatus: 'posted',
        glPostedOn: '2026-10-06',
        rawInputs: { itc: '17163+17163', cash: '1904+1904', rcm: '450+450' },
        notes: 'Audited & posted 06-Oct-2026 (SL 703 Slips 286/288/290; SA 702 Slip 289 Cr ₹34,326; 4445 Slips 287/291).',
        createdAt: '2026-10-06T10:00:00.000Z',
        updatedAt: '2026-10-06T10:00:00.000Z'
      },
      {
        id: 'neethi_2026-09',
        entityId: 'neethi',
        period: '2026-09',
        fy: '2026-27',
        itcPaise: 3770600,
        cashPaise: 294600,
        rcmPaise: 90000,
        rcmCpin: '',
        regCpin: '',
        e0Slip: '629',
        e1Slip: '632',
        e2Slip: '635',
        pmt06Filed: true,
        arn: 'AA3209263914900',
        filedOn: '2026-10-17',
        verified: true,
        outputTaxLiabilityPaise: 4065200,
        glStatus: 'posted',
        glPostedOn: '2026-10-31',
        rawInputs: { itc: '18853+18853', cash: '1473+1473', rcm: '450+450' },
        notes: 'Audited & posted 31-Oct-2026 (SL 703 Slips 629/632/635; SA 702 Slip 633 Cr ₹37,706; 4445 Slips 631/636).',
        createdAt: '2026-10-31T10:00:00.000Z',
        updatedAt: '2026-10-31T10:00:00.000Z'
      },

      // Fertilizer / Manure Depot
      {
        id: 'depot_2026-04',
        entityId: 'depot',
        period: '2026-04',
        fy: '2026-27',
        itcPaise: 0,
        cashPaise: 0,
        rcmPaise: 69400,
        rcmCpin: '2065126672',
        regCpin: '',
        e0Slip: '99',
        e1Slip: '',
        e2Slip: '',
        pmt06Filed: true,
        arn: 'AA320426310188I',
        filedOn: '2026-05-18',
        verified: true,
        outputTaxLiabilityPaise: 0,
        glStatus: 'posted',
        glPostedOn: '2026-07-25',
        rawInputs: { itc: '0', cash: '0', rcm: '694' },
        notes: 'No sales this month. RCM rent challan posted (SL 733 Slip 99 Dr ₹694; 4445 Slip 90 Cr ₹694).',
        createdAt: '2026-07-22T10:00:00.000Z',
        updatedAt: '2026-07-25T10:00:00.000Z'
      },
      {
        id: 'depot_2026-05',
        entityId: 'depot',
        period: '2026-05',
        fy: '2026-27',
        itcPaise: 30600,
        cashPaise: 0,
        rcmPaise: 69400,
        rcmCpin: '2067109046',
        regCpin: '',
        e0Slip: '100',
        e1Slip: '97',
        e2Slip: '',
        pmt06Filed: true,
        arn: 'AA3205264277537',
        filedOn: '2026-06-19',
        verified: true,
        outputTaxLiabilityPaise: 30600,
        glStatus: 'posted',
        glPostedOn: '2026-07-25',
        rawInputs: { itc: '153+153', cash: '0', rcm: '694' },
        notes: 'Posted 25-Jul-2026 (SL 733 Slip 97 Dr ₹306; SA 732 Slip 98 Cr ₹306; RCM Slip 100 Dr ₹694).',
        createdAt: '2026-07-22T10:00:00.000Z',
        updatedAt: '2026-07-25T10:00:00.000Z'
      },
      {
        id: 'depot_2026-06',
        entityId: 'depot',
        period: '2026-06',
        fy: '2026-27',
        itcPaise: 9200,
        cashPaise: 0,
        rcmPaise: 69400,
        rcmCpin: '2069092459',
        regCpin: '',
        e0Slip: '105',
        e1Slip: '109',
        e2Slip: '',
        pmt06Filed: true,
        arn: 'AA320626403088E',
        filedOn: '2026-07-17',
        verified: true,
        outputTaxLiabilityPaise: 9200,
        glStatus: 'posted',
        glPostedOn: '2026-07-25',
        rawInputs: { itc: '46+46', cash: '0', rcm: '694' },
        notes: 'Posted 25-Jul-2026 (SL 733 Slip 109 Dr ₹92; SA 732 Slip 107 Cr ₹92; RCM Slip 105 Dr ₹694).',
        createdAt: '2026-07-22T10:00:00.000Z',
        updatedAt: '2026-07-25T10:00:00.000Z'
      },
      {
        id: 'depot_2026-07',
        entityId: 'depot',
        period: '2026-07',
        fy: '2026-27',
        itcPaise: 171000,
        cashPaise: 0,
        rcmPaise: 69400,
        rcmCpin: '2072232737',
        regCpin: '',
        e0Slip: '189',
        e1Slip: '193',
        e2Slip: '',
        pmt06Filed: true,
        arn: 'AA320726384930Z',
        filedOn: '2026-08-18',
        verified: true,
        outputTaxLiabilityPaise: 171000,
        glStatus: 'posted',
        glPostedOn: '2026-08-22',
        rawInputs: { itc: '855+855', cash: '0', rcm: '694' },
        notes: 'Posted 22-Aug-2026 (SL 733 Slip 193 Dr ₹1,710; SA 732 Slip 194 Cr ₹1,710; RCM Slip 189 Dr ₹694).',
        createdAt: '2026-08-22T10:00:00.000Z',
        updatedAt: '2026-08-22T10:00:00.000Z'
      },
      {
        id: 'depot_2026-08',
        entityId: 'depot',
        period: '2026-08',
        fy: '2026-27',
        itcPaise: 446600,
        cashPaise: 0,
        rcmPaise: 69400,
        rcmCpin: '',
        regCpin: '',
        e0Slip: '280',
        e1Slip: '284',
        e2Slip: '',
        pmt06Filed: true,
        arn: 'AA3208263195619',
        filedOn: '2026-09-17',
        verified: true,
        outputTaxLiabilityPaise: 446600,
        glStatus: 'posted',
        glPostedOn: '2026-10-06',
        rawInputs: { itc: '2233+2233', cash: '0', rcm: '347+347' },
        notes: 'Audited & posted 06-Oct-2026 (SL 733 Slips 280/284; SA 732 Slip 285 Cr ₹4,466; 4445 Slip 281).',
        createdAt: '2026-10-06T10:00:00.000Z',
        updatedAt: '2026-10-06T10:00:00.000Z'
      },
      {
        id: 'depot_2026-09',
        entityId: 'depot',
        period: '2026-09',
        fy: '2026-27',
        itcPaise: 197600,
        cashPaise: 0,
        rcmPaise: 69400,
        rcmCpin: '',
        regCpin: '',
        e0Slip: '625',
        e1Slip: '627',
        e2Slip: '',
        pmt06Filed: true,
        arn: 'AA320926391668J',
        filedOn: '2026-10-17',
        verified: true,
        outputTaxLiabilityPaise: 197600,
        glStatus: 'posted',
        glPostedOn: '2026-10-31',
        rawInputs: { itc: '988+988', cash: '0', rcm: '347+347' },
        notes: 'Audited & posted 31-Oct-2026 (SL 733 Slips 625/627; SA 732 Slip 628 Cr ₹1,976; 4445 Slip 619/626).',
        createdAt: '2026-10-31T10:00:00.000Z',
        updatedAt: '2026-10-31T10:00:00.000Z'
      }
    ];
  }

  function createAuditedSeedReversals() {
    return [
      {
        id: 'rev_neethi_2025-26',
        entityId: 'neethi',
        fy: '2025-26',
        glPostedPaise: 64335774,
        portalPaise: 61968400,
        diffPaise: 2367374,
        direction: 'over',
        status: 'cleared',
        clearedOn: '2026-07-28',
        narration: 'TO REVERSAL OF EXCESS FY 2025-26 SET-OFF ADJ.',
        notes: 'Mathematically verified: GL posted ₹6,43,357.74 vs Portal ₹6,19,684.00 (over-credited by ₹23,673.74). Cleared & verified 28-Jul-2026.',
        createdAt: '2026-07-28T10:00:00.000Z',
        updatedAt: '2026-07-28T10:00:00.000Z'
      },
      {
        id: 'rev_bank_2025-26',
        entityId: 'bank',
        fy: '2025-26',
        glPostedPaise: 19091902,
        portalPaise: 18853400,
        diffPaise: 238502,
        direction: 'over',
        status: 'cleared',
        clearedOn: '2026-07-28',
        narration: 'TO REVERSAL OF EXCESS FY 2025-26 SET-OFF ADJ.',
        notes: 'Mathematically verified: GL posted ₹1,90,919.02 vs Portal ₹1,88,534.00 (over-credited by ₹2,385.02). Cleared & verified 28-Jul-2026.',
        createdAt: '2026-07-28T10:00:00.000Z',
        updatedAt: '2026-07-28T10:00:00.000Z'
      }
    ];
  }

  function createDefaultDatabase() {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      settings: JSON.parse(JSON.stringify(core.DEFAULT_SETTINGS)),
      entities: JSON.parse(JSON.stringify(core.DEFAULT_ENTITIES)),
      returns: createAuditedSeedReturns(),
      reversals: createAuditedSeedReversals(),
      audit: [
        {
          at: new Date().toISOString(),
          action: 'init-seed',
          detail: 'Initialized database with audited September 2026 records'
        }
      ],
      lastBackupExportAt: null,
      changeCountSinceBackup: 0
    };
  }

  // --------------------------------------------------------------------------
  // MIGRATIONS
  // --------------------------------------------------------------------------

  function migrateDatabase(db) {
    if (!db || typeof db !== 'object') {
      return createDefaultDatabase();
    }
    if (!Array.isArray(db.entities)) {
      db.entities = JSON.parse(JSON.stringify(core.DEFAULT_ENTITIES));
    }
    if (!Array.isArray(db.returns)) {
      db.returns = [];
    }
    if (!Array.isArray(db.reversals)) {
      db.reversals = [];
    }
    if (!Array.isArray(db.audit)) {
      db.audit = [];
    }
    if (!db.settings) {
      db.settings = JSON.parse(JSON.stringify(core.DEFAULT_SETTINGS));
    }
    // Migration from v1 to v2: Auto-populate newly audited Aug & Sep 2026 returns & slips
    var seedReturns = createAuditedSeedReturns();
    var seedMap = {};
    seedReturns.forEach(function (sr) { seedMap[sr.id] = sr; });

    if (!db.schemaVersion || db.schemaVersion < 2) {
      db.schemaVersion = 2;
      var existingMap = {};
      db.returns.forEach(function (r) { existingMap[r.id] = true; });
      seedReturns.forEach(function (sr) {
        if (!existingMap[sr.id]) {
          db.returns.push(sr);
        }
      });
    }

    // Ensure granular slip tracking and PMT-06 filed status on all returns
    db.returns.forEach(function (r) {
      var seed = seedMap[r.id];
      if (r.e0Slip === undefined) r.e0Slip = (seed && seed.e0Slip) || '';
      if (r.e1Slip === undefined) r.e1Slip = (seed && seed.e1Slip) || '';
      if (r.e2Slip === undefined) r.e2Slip = (seed && seed.e2Slip) || '';
      if (r.pmt06Filed === undefined) r.pmt06Filed = (seed && typeof seed.pmt06Filed === 'boolean') ? seed.pmt06Filed : !!r.verified;
      if (r.arn === undefined && seed && seed.arn) r.arn = seed.arn;
      if (r.filedOn === undefined && seed && seed.filedOn) r.filedOn = seed.filedOn;
    });
    return db;
  }

  // --------------------------------------------------------------------------
  // STORE CLASS
  // --------------------------------------------------------------------------

  var Store = {
    listeners: [],

    init: function () {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(function () {});
      }
      var existing = this.loadDB();
      if (!existing) {
        var initial = createDefaultDatabase();
        this.saveDB(initial);
      }
    },

    subscribe: function (fn) {
      if (typeof fn === 'function') {
        this.listeners.push(fn);
      }
    },

    notify: function (action, data) {
      this.listeners.forEach(function (fn) {
        try {
          fn(action, data);
        } catch (e) {
          console.error('Store listener error:', e);
        }
      });
    },

    loadDB: function () {
      var raw = getStorageItem(DB_KEY);
      if (!raw) return null;
      try {
        var parsed = JSON.parse(raw);
        return migrateDatabase(parsed);
      } catch (err) {
        console.error('Failed to parse database from storage:', err);
        return null;
      }
    },

    saveDB: function (db) {
      if (!db) return false;
      var str = JSON.stringify(db);
      setStorageItem(DB_KEY, str);
      return true;
    },

    getDB: function () {
      var db = this.loadDB();
      if (!db) {
        db = createDefaultDatabase();
        this.saveDB(db);
      }
      return db;
    },

    /**
     * Single atomic commit function:
     * deep-clone -> mutate -> validate -> save -> emit event
     */
    commit: function (mutator, auditAction, auditDetail) {
      var db = this.getDB();
      var clone = JSON.parse(JSON.stringify(db));

      var result = mutator(clone);

      // Validate returns array
      if (!Array.isArray(clone.returns)) {
        throw new Error('Database corruption: returns must be an array');
      }

      // Maintain audit log
      if (auditAction) {
        var auditEntry = {
          at: new Date().toISOString(),
          action: auditAction,
          detail: auditDetail || ''
        };
        clone.audit.unshift(auditEntry);
        if (clone.audit.length > MAX_AUDIT_LOGS) {
          clone.audit.length = MAX_AUDIT_LOGS;
        }
      }

      clone.changeCountSinceBackup = (clone.changeCountSinceBackup || 0) + 1;

      this.saveDB(clone);
      this.notify(auditAction || 'change', clone);
      return result !== undefined ? result : clone;
    },

    // ------------------------------------------------------------------------
    // RETURNS CRUD
    // ------------------------------------------------------------------------

    getReturn: function (entityId, period) {
      var db = this.getDB();
      return db.returns.find(function (r) {
        return r.entityId === entityId && r.period === period;
      }) || null;
    },

    getReturnById: function (id) {
      var db = this.getDB();
      return db.returns.find(function (r) { return r.id === id; }) || null;
    },

    saveReturn: function (returnRec) {
      if (!returnRec.entityId || !returnRec.period) {
        throw new Error('Return must have entityId and period');
      }
      if (!returnRec.fy && returnRec.period) {
        returnRec.fy = core.fyOf(returnRec.period);
      }

      var now = new Date().toISOString();
      returnRec.updatedAt = now;
      if (!returnRec.createdAt) returnRec.createdAt = now;
      if (!returnRec.id) returnRec.id = returnRec.entityId + '_' + returnRec.period;

      return this.commit(function (db) {
        var idx = db.returns.findIndex(function (r) {
          return r.entityId === returnRec.entityId && r.period === returnRec.period;
        });
        if (idx >= 0) {
          db.returns[idx] = Object.assign({}, db.returns[idx], returnRec);
        } else {
          db.returns.unshift(returnRec);
        }
      }, 'save-return', returnRec.entityId + ' ' + returnRec.period);
    },

    deleteReturn: function (id) {
      return this.commit(function (db) {
        db.returns = db.returns.filter(function (r) { return r.id !== id; });
      }, 'delete-return', id);
    },

    // ------------------------------------------------------------------------
    // REVERSALS CRUD
    // ------------------------------------------------------------------------

    saveReversal: function (reversalRec) {
      if (!reversalRec.id) reversalRec.id = core.uuid();
      var now = new Date().toISOString();
      reversalRec.updatedAt = now;
      if (!reversalRec.createdAt) reversalRec.createdAt = now;

      return this.commit(function (db) {
        var idx = db.reversals.findIndex(function (r) { return r.id === reversalRec.id; });
        if (idx >= 0) {
          db.reversals[idx] = Object.assign({}, db.reversals[idx], reversalRec);
        } else {
          db.reversals.unshift(reversalRec);
        }
      }, 'save-reversal', reversalRec.entityId + ' FY ' + reversalRec.fy);
    },

    deleteReversal: function (id) {
      return this.commit(function (db) {
        db.reversals = db.reversals.filter(function (r) { return r.id !== id; });
      }, 'delete-reversal', id);
    },

    // ------------------------------------------------------------------------
    // SETTINGS & ENTITIES
    // ------------------------------------------------------------------------

    updateSettings: function (newSettings) {
      return this.commit(function (db) {
        db.settings = Object.assign({}, db.settings, newSettings);
      }, 'update-settings');
    },

    updateEntity: function (entityId, fields) {
      return this.commit(function (db) {
        var ent = db.entities.find(function (e) { return e.id === entityId; });
        if (ent) {
          Object.assign(ent, fields);
        }
      }, 'update-entity', entityId);
    },

    // ------------------------------------------------------------------------
    // UI MEMORY (DRAFTS, LAST SELECTION, TABS)
    // ------------------------------------------------------------------------

    getUIState: function () {
      var raw = getStorageItem(UI_KEY);
      if (!raw) {
        return {
          activeTab: 'generator',
          lastEntityId: 'bank',
          lastPeriod: '2026-04',
          theme: 'dark',
          draft: null
        };
      }
      try {
        return JSON.parse(raw);
      } catch (e) {
        return { activeTab: 'generator', lastEntityId: 'bank', lastPeriod: '2026-04', theme: 'dark', draft: null };
      }
    },

    saveUIState: function (state) {
      var current = this.getUIState();
      var merged = Object.assign({}, current, state);
      setStorageItem(UI_KEY, JSON.stringify(merged));
    },

    saveDraft: function (draftData) {
      this.saveUIState({ draft: draftData });
    },

    getDraft: function () {
      return this.getUIState().draft;
    },

    clearDraft: function () {
      this.saveUIState({ draft: null });
    },

    // ------------------------------------------------------------------------
    // BACKUP, AUDIT & RESTORE
    // ------------------------------------------------------------------------

    markBackupExported: function () {
      this.commit(function (db) {
        db.lastBackupExportAt = new Date().toISOString();
        db.changeCountSinceBackup = 0;
      }, 'export-backup');
    },

    isBackupOverdue: function () {
      var db = this.getDB();
      if ((db.changeCountSinceBackup || 0) >= 10) return true;
      if (!db.lastBackupExportAt) return db.returns.length > 0;
      var last = new Date(db.lastBackupExportAt).getTime();
      var now = Date.now();
      var days = (now - last) / (1000 * 60 * 60 * 24);
      return days >= 30;
    },

    exportJSONString: function () {
      var db = this.getDB();
      var exportObj = {
        app: 'GST Set-Off Voucher Studio',
        schemaVersion: db.schemaVersion,
        exportedAt: new Date().toISOString(),
        bank: 'Vadakkumbad Service Co-operative Bank Ltd.',
        db: db
      };
      return JSON.stringify(exportObj, null, 2);
    },

    previewImport: function (jsonStr) {
      try {
        var parsed = JSON.parse(jsonStr);
        var sourceDb = parsed.db || parsed;
        if (!sourceDb || typeof sourceDb !== 'object') {
          return { valid: false, error: 'Invalid backup file structure' };
        }
        if (sourceDb.schemaVersion && sourceDb.schemaVersion > CURRENT_SCHEMA_VERSION) {
          return {
            valid: false,
            error: 'Backup has newer schema version ' + sourceDb.schemaVersion + '. Please update the software first.'
          };
        }

        var incomingReturns = Array.isArray(sourceDb.returns) ? sourceDb.returns : [];
        var incomingReversals = Array.isArray(sourceDb.reversals) ? sourceDb.reversals : [];

        var currentDb = this.getDB();
        var currentMap = {};
        currentDb.returns.forEach(function (r) {
          currentMap[r.entityId + '_' + r.period] = r;
        });

        var newCount = 0;
        var updatedCount = 0;
        var unchangedCount = 0;

        incomingReturns.forEach(function (r) {
          var key = r.entityId + '_' + r.period;
          var cur = currentMap[key];
          if (!cur) {
            newCount++;
          } else {
            var curUp = new Date(cur.updatedAt || 0).getTime();
            var incUp = new Date(r.updatedAt || 0).getTime();
            if (incUp > curUp) {
              updatedCount++;
            } else {
              unchangedCount++;
            }
          }
        });

        return {
          valid: true,
          schemaVersion: sourceDb.schemaVersion || 1,
          totalIncomingReturns: incomingReturns.length,
          newReturnsCount: newCount,
          updatedReturnsCount: updatedCount,
          unchangedReturnsCount: unchangedCount,
          reversalsCount: incomingReversals.length,
          incomingDb: sourceDb
        };
      } catch (err) {
        return { valid: false, error: 'Malformed JSON: ' + err.message };
      }
    },

    applyImport: function (previewResult, mode) {
      if (!previewResult || !previewResult.valid || !previewResult.incomingDb) {
        throw new Error('Invalid import data');
      }

      var incoming = previewResult.incomingDb;
      var self = this;

      return this.commit(function (db) {
        if (mode === 'replace') {
          db.entities = incoming.entities || db.entities;
          db.settings = incoming.settings || db.settings;
          db.returns = incoming.returns || [];
          db.reversals = incoming.reversals || [];
        } else {
          // MERGE MODE (newer updatedAt wins)
          var retMap = {};
          db.returns.forEach(function (r) { retMap[r.entityId + '_' + r.period] = r; });

          (incoming.returns || []).forEach(function (inc) {
            var key = inc.entityId + '_' + inc.period;
            var cur = retMap[key];
            if (!cur) {
              retMap[key] = inc;
            } else {
              var curTime = new Date(cur.updatedAt || 0).getTime();
              var incTime = new Date(inc.updatedAt || 0).getTime();
              if (incTime >= curTime) {
                retMap[key] = inc;
              }
            }
          });

          db.returns = Object.keys(retMap).map(function (k) { return retMap[k]; });

          // Merge reversals by id
          var revMap = {};
          db.reversals.forEach(function (rev) { revMap[rev.id] = rev; });
          (incoming.reversals || []).forEach(function (rev) {
            if (!revMap[rev.id] || new Date(rev.updatedAt || 0) > new Date(revMap[rev.id].updatedAt || 0)) {
              revMap[rev.id] = rev;
            }
          });
          db.reversals = Object.keys(revMap).map(function (k) { return revMap[k]; });
        }
      }, 'import-backup', 'Mode: ' + mode);
    },

    resetToAuditedSeed: function () {
      var seed = createDefaultDatabase();
      this.saveDB(seed);
      this.clearDraft();
      this.notify('reset-seed', seed);
      return seed;
    },

    wipeAllData: function () {
      removeStorageItem(DB_KEY);
      removeStorageItem(UI_KEY);
      this.notify('wipe-data');
    }
  };

  return Store;
}));
