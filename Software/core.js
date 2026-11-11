/**
 * GST SET-OFF VOUCHER STUDIO — CORE DOMAIN & CALCULATION ENGINE
 * Pure business logic: integer paise arithmetic, safe recursive-descent math parser,
 * journal voucher builders, annual reconciler, and verification rules.
 * 
 * Works in both Browser (window.GSTCore) and Node.js (module.exports).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GSTCore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --------------------------------------------------------------------------
  // CONSTANTS & DEFAULT CONFIGURATION
  // --------------------------------------------------------------------------

  var MONTH_NAMES = [
    'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER',
    'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH'
  ];

  var DEFAULT_ENTITIES = [
    {
      id: 'bank',
      name: 'Bank HO / Branches',
      gstin: '32AABAV5891L1Z1',
      sa: { code: '0200', name: 'SA GST INPUT TAX (Bank)' },
      sl: { code: '7800', name: 'SL GST OUTPUT TAX - 18% (Bank)' },
      prefix: 'BANK',
      color: '#60a5fa',
      badgeClass: 'je-bank',
      defaultRcmPaise: 311400,
      note: '50% ITC discarded upfront at purchase entry (Rule 38 treatment).'
    },
    {
      id: 'neethi',
      name: 'Neethy Medical Store',
      gstin: '32AABAV5891L2Z0',
      sa: { code: '702', name: 'SA GST INPUT TAX - NEETHI STORE' },
      sl: { code: '703', name: 'SL GST OUTPUT TAX - NEETHI STORE' },
      prefix: 'NEETHI',
      color: '#34d399',
      badgeClass: 'je-neethi',
      defaultRcmPaise: 90000,
      note: '100% eligible ITC.'
    },
    {
      id: 'depot',
      name: 'Fertilizer / Manure Depot',
      gstin: '32AABAV5891L3ZZ',
      sa: { code: '732', name: 'SA GST INPUT TAX - MANURE' },
      sl: { code: '733', name: 'SL GST OUTPUT TAX - MANURE' },
      prefix: 'MANURE',
      color: '#fb923c',
      badgeClass: 'je-depot',
      defaultRcmPaise: 69400,
      note: '100% eligible ITC.'
    }
  ];

  var DEFAULT_ACCOUNTS = {
    clearing: { code: '4445', name: 'GST Paid to Govt (Clearing)' },
    bank: { code: '711', name: 'Bank Account A/c' }
  };

  var DEFAULT_SETTINGS = {
    narrationProfile: 'sop', // 'sop' | 'legacy' | 'custom'
    narrationTemplates: {
      sop: {
        e0route: 'TO RCM CHALLAN ROUTING {period} ADJ.{cpin}',
        e0pay: 'TO RCM CHALLAN PAYMENT {period} ADJ.{cpin}',
        e1: 'TO GST SET OFF {period} ADJ.',
        e2: 'TO GST REGULAR CASH ROUTING {period} ADJ.{cpin}',
        revOver: 'TO REVERSAL OF EXCESS FY {fy} SET-OFF ADJ.',
        revUnder: 'TO ADDITIONAL SET-OFF FY {fy} ADJ.'
      },
      legacy: {
        e0route: '{prefix}-GST-RCM-CASH-PAID-{period}{cpin}',
        e0pay: '{prefix}-GST-RCM-CHALLAN-{period}{cpin}',
        e1: '{prefix}-GST SET OFF {period} ADJ.',
        e2: '{prefix}-GST-CASH-PAID-{period}{cpin}',
        revOver: 'TO REVERSAL OF EXCESS FY {fy} SET-OFF ADJ.',
        revUnder: 'TO ADDITIONAL SET-OFF FY {fy} ADJ.'
      },
      custom: {
        e0route: 'TO RCM CHALLAN ROUTING {period} ADJ.{cpin}',
        e0pay: 'TO RCM CHALLAN PAYMENT {period} ADJ.{cpin}',
        e1: 'TO GST SET OFF {period} ADJ.',
        e2: 'TO GST REGULAR CASH ROUTING {period} ADJ.{cpin}',
        revOver: 'TO REVERSAL OF EXCESS FY {fy} SET-OFF ADJ.',
        revUnder: 'TO ADDITIONAL SET-OFF FY {fy} ADJ.'
      }
    },
    entry0IncludePaymentLeg: false,
    entry2IncludePaymentLeg: false,
    narrationMaxLen: 60,
    copyFormat: 'tsv', // 'tsv' | 'text' | 'json'
    accounts: DEFAULT_ACCOUNTS
  };

  // --------------------------------------------------------------------------
  // MONEY & PARSING HELPERS (INTEGER PAISE INTERNALS)
  // --------------------------------------------------------------------------

  /**
   * Safe recursive-descent math parser.
   * Handles: numbers, decimals, + - * /, parentheses, unary minus.
   * Strips: commas, spaces, '₹', 'Rs', 'rs'.
   * Blank string -> 0 paise.
   * Rejects negative results and invalid syntax.
   * Returns: { paise: number, ok: boolean, error?: string }
   */
  function evalMoney(str) {
    if (str === null || str === undefined) {
      return { paise: 0, ok: true };
    }

    var clean = String(str)
      .replace(/[₹\s,]/g, '')
      .replace(/Rs\.?/gi, '');

    if (clean === '') {
      return { paise: 0, ok: true };
    }

    if (clean.length > 200) {
      return { paise: 0, ok: false, error: 'Expression too long (max 200 characters)' };
    }

    // Tokenize
    var tokens = [];
    var i = 0;
    while (i < clean.length) {
      var ch = clean.charAt(i);
      if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '(' || ch === ')') {
        tokens.push({ type: ch, val: ch });
        i++;
      } else if ((ch >= '0' && ch <= '9') || ch === '.') {
        var numStr = '';
        var dotCount = 0;
        while (i < clean.length) {
          var c = clean.charAt(i);
          if (c >= '0' && c <= '9') {
            numStr += c;
            i++;
          } else if (c === '.') {
            dotCount++;
            if (dotCount > 1) {
              return { paise: 0, ok: false, error: 'Multiple decimal points in number' };
            }
            numStr += c;
            i++;
          } else {
            break;
          }
        }
        tokens.push({ type: 'NUM', val: parseFloat(numStr) });
      } else {
        return { paise: 0, ok: false, error: 'Invalid character in expression: "' + ch + '"' };
      }
    }

    var pos = 0;

    function peek() {
      return pos < tokens.length ? tokens[pos] : null;
    }

    function consume(expectedType) {
      var tok = peek();
      if (!tok || (expectedType && tok.type !== expectedType)) {
        throw new Error('Unexpected token: ' + (tok ? tok.val : 'end of input'));
      }
      pos++;
      return tok;
    }

    // Grammar:
    // Expr   := Term (( '+' | '-' ) Term)*
    // Term   := Factor (( '*' | '/' ) Factor)*
    // Factor := ('+' | '-') Factor | Primary
    // Primary:= NUM | '(' Expr ')'

    function parseExpr() {
      var left = parseTerm();
      while (true) {
        var tok = peek();
        if (tok && (tok.type === '+' || tok.type === '-')) {
          consume();
          var right = parseTerm();
          if (tok.type === '+') left += right;
          else left -= right;
        } else {
          break;
        }
      }
      return left;
    }

    function parseTerm() {
      var left = parseFactor();
      while (true) {
        var tok = peek();
        if (tok && (tok.type === '*' || tok.type === '/')) {
          consume();
          var right = parseFactor();
          if (tok.type === '*') {
            left *= right;
          } else {
            if (right === 0) {
              throw new Error('Division by zero');
            }
            left /= right;
          }
        } else {
          break;
        }
      }
      return left;
    }

    function parseFactor() {
      var tok = peek();
      if (tok && tok.type === '+') {
        consume('+');
        return parseFactor();
      }
      if (tok && tok.type === '-') {
        consume('-');
        return -parseFactor();
      }
      return parsePrimary();
    }

    function parsePrimary() {
      var tok = peek();
      if (!tok) {
        throw new Error('Unexpected end of expression');
      }
      if (tok.type === 'NUM') {
        consume('NUM');
        return tok.val;
      }
      if (tok.type === '(') {
        consume('(');
        var res = parseExpr();
        consume(')');
        return res;
      }
      throw new Error('Unexpected symbol: ' + tok.val);
    }

    try {
      var value = parseExpr();
      if (pos < tokens.length) {
        return { paise: 0, ok: false, error: 'Unexpected extra input: "' + tokens[pos].val + '"' };
      }
      if (isNaN(value) || !isFinite(value)) {
        return { paise: 0, ok: false, error: 'Calculation resulted in NaN or Infinity' };
      }
      if (value < -0.00001) {
        return { paise: 0, ok: false, error: 'Negative amounts are not permitted in GST returns' };
      }
      // Round half-up to integer paise
      var paise = Math.round(value * 100);
      if (paise < 0) paise = 0;
      return { paise: paise, ok: true };
    } catch (err) {
      return { paise: 0, ok: false, error: err.message || 'Syntax error' };
    }
  }

  /**
   * Convert paise to Indian Rupees formatted string: e.g. 2239200 -> "22,392.00"
   */
  function fmtINR(paise, includeSymbol) {
    var p = typeof paise === 'number' ? paise : 0;
    var rupees = p / 100;
    var formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(rupees);
    return includeSymbol ? '₹' + formatted : formatted;
  }

  /**
   * Convert paise to plain numeric string without grouping (for TSV/safe copy): e.g. 2239200 -> "22392.00"
   */
  function fmtPlain(paise) {
    var p = typeof paise === 'number' ? paise : 0;
    return (p / 100).toFixed(2);
  }

  // --------------------------------------------------------------------------
  // PERIOD & FINANCIAL YEAR HELPERS
  // --------------------------------------------------------------------------

  /**
   * Normalize period input to YYYY-MM and derive period label.
   * e.g., '2026-04' -> '2026-APRIL'
   */
  function periodLabel(periodStr) {
    if (!periodStr) return '';
    var parts = String(periodStr).trim().split('-');
    if (parts.length === 2) {
      var yr = parts[0];
      var m = parseInt(parts[1], 10);
      if (m >= 1 && m <= 12) {
        var names = [
          'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
          'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ];
        return yr + '-' + names[m - 1];
      }
      // If already month name like 2026-APRIL
      return (yr + '-' + parts[1]).toUpperCase();
    }
    return String(periodStr).toUpperCase();
  }

  /**
   * Compute Financial Year from YYYY-MM.
   * April to December -> YYYY-(YY+1), January to March -> (YYYY-1)-YY
   * e.g. '2026-04' -> '2026-27', '2027-02' -> '2026-27'
   */
  function fyOf(periodStr) {
    if (!periodStr) return '';
    var parts = String(periodStr).trim().split('-');
    if (parts.length < 2) return '';
    var yr = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    // If second part is month name
    if (isNaN(m)) {
      var upper = parts[1].toUpperCase();
      var monthMap = {
        'APRIL': 4, 'MAY': 5, 'JUNE': 6, 'JULY': 7, 'AUGUST': 8, 'SEPTEMBER': 9,
        'OCTOBER': 10, 'NOVEMBER': 11, 'DECEMBER': 12, 'JANUARY': 1, 'FEBRUARY': 2, 'MARCH': 3
      };
      m = monthMap[upper] || 4;
    }
    if (m >= 4) {
      var nextYr = (yr + 1) % 100;
      return yr + '-' + (nextYr < 10 ? '0' + nextYr : nextYr);
    } else {
      var prevYr = yr - 1;
      var curYr = yr % 100;
      return prevYr + '-' + (curYr < 10 ? '0' + curYr : curYr);
    }
  }

  /**
   * List 12 months for a financial year in order: April to March.
   * e.g. '2026-27' -> ['2026-04', '2026-05', ..., '2027-03']
   */
  function monthsInFY(fyStr) {
    var parts = String(fyStr).split('-');
    var startYear = parseInt(parts[0], 10) || 2026;
    var list = [];
    for (var m = 4; m <= 12; m++) {
      list.push(startYear + '-' + (m < 10 ? '0' + m : m));
    }
    for (var m2 = 1; m2 <= 3; m2++) {
      list.push((startYear + 1) + '-' + (m2 < 10 ? '0' + m2 : m2));
    }
    return list;
  }

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // --------------------------------------------------------------------------
  // NARRATION BUILDER
  // --------------------------------------------------------------------------

  function buildNarration(template, vars) {
    if (!template) return '';
    var text = template;
    var cpinText = vars.cpin ? ' CPIN ' + vars.cpin : '';
    text = text.replace(/\{prefix\}/g, vars.prefix || '');
    text = text.replace(/\{period\}/g, vars.period || '');
    text = text.replace(/\{cpin\}/g, cpinText);
    text = text.replace(/\{fy\}/g, vars.fy || '');
    return text.replace(/\s+/g, ' ').trim();
  }

  // --------------------------------------------------------------------------
  // VOUCHER GENERATOR
  // --------------------------------------------------------------------------

  /**
   * Builds the PacScore journal vouchers for a return record.
   *
   * @param {Object} returnRec - Return record with paise amounts, period, CPINs.
   * @param {Object} entity - Entity configuration (sa, sl, prefix, etc.).
   * @param {Object} settings - Application settings (narration templates, payment leg toggles).
   * @returns {Array} Array of voucher objects.
   */
  function buildVouchers(returnRec, entity, settings) {
    if (!returnRec || !entity) return [];

    settings = settings || DEFAULT_SETTINGS;
    var profile = settings.narrationProfile || 'sop';
    var templates = (settings.narrationTemplates && settings.narrationTemplates[profile])
      ? settings.narrationTemplates[profile]
      : DEFAULT_SETTINGS.narrationTemplates.sop;

    var accounts = settings.accounts || DEFAULT_ACCOUNTS;
    var clearingAcc = accounts.clearing || DEFAULT_ACCOUNTS.clearing;
    var bankAcc = accounts.bank || DEFAULT_ACCOUNTS.bank;

    var period = periodLabel(returnRec.period);
    var fy = returnRec.fy || fyOf(returnRec.period);

    var rcmPaise = returnRec.rcmPaise || 0;
    var itcPaise = returnRec.itcPaise || 0;
    var cashPaise = returnRec.cashPaise || 0;

    var rcmCpin = (returnRec.rcmCpin || '').trim();
    var regCpin = (returnRec.regCpin || '').trim();

    var vars = {
      prefix: entity.prefix,
      period: period,
      fy: fy
    };

    var vouchers = [];

    // ENTRY 0: RCM ROUTING (Mid-month, ~18th)
    if (rcmPaise > 0) {
      var e0Vars = Object.assign({}, vars, { cpin: rcmCpin });
      var e0RouteNarr = buildNarration(templates.e0route, e0Vars);
      var e0PayNarr = buildNarration(templates.e0pay, e0Vars);

      var lines = [
        {
          side: 'DR',
          code: entity.sl.code,
          name: entity.sl.name,
          paise: rcmPaise,
          purpose: 'Routing leg: clears RCM output liability from SL'
        },
        {
          side: 'CR',
          code: clearingAcc.code,
          name: clearingAcc.name,
          paise: rcmPaise,
          purpose: 'Routing credit leg'
        }
      ];

      var narrations = [
        { label: 'Routing Leg Narration', text: e0RouteNarr }
      ];

      if (settings.entry0IncludePaymentLeg) {
        lines.push({
          side: 'DR',
          code: clearingAcc.code,
          name: clearingAcc.name,
          paise: rcmPaise,
          purpose: 'Payment leg: challan deposit to Govt'
        });
        lines.push({
          side: 'CR',
          code: bankAcc.code,
          name: bankAcc.name,
          paise: rcmPaise,
          purpose: 'Money paid out from Bank Operating A/c'
        });
        narrations.push({ label: 'Payment Leg Narration', text: e0PayNarr });
      }

      var drTotal = lines.filter(function (l) { return l.side === 'DR'; }).reduce(function (s, l) { return s + l.paise; }, 0);
      var crTotal = lines.filter(function (l) { return l.side === 'CR'; }).reduce(function (s, l) { return s + l.paise; }, 0);

      vouchers.push({
        key: 'e0',
        entryNum: 0,
        title: 'Entry 0 — RCM Rent Challan Routing' + (settings.entry0IncludePaymentLeg ? ' & Payment' : ''),
        subTitle: entity.name + ' · Mid-Month / ~18th · RCM Cash Challan',
        whenHint: 'Mid-month, ~18th (challan paid before filing)',
        lines: lines,
        narrations: narrations,
        totalDrPaise: drTotal,
        totalCrPaise: crTotal,
        balanced: drTotal === crTotal,
        infoNote: !settings.entry0IncludePaymentLeg
          ? 'Challan payment Dr 4445 / Cr 711 was passed on the challan date' + (rcmCpin ? ' (CPIN ' + rcmCpin + ')' : '') + '.'
          : null
      });
    }

    // ENTRY 1: ITC SET-OFF ① (By 25th after GSTR-3B filing)
    if (itcPaise > 0) {
      var e1Vars = Object.assign({}, vars, { cpin: '' });
      var e1Narr = buildNarration(templates.e1, e1Vars);

      var e1Lines = [
        {
          side: 'DR',
          code: entity.sl.code,
          name: entity.sl.name,
          paise: itcPaise,
          purpose: 'Debits SL Output Tax to absorb liability'
        },
        {
          side: 'CR',
          code: entity.sa.code,
          name: entity.sa.name,
          paise: itcPaise,
          purpose: 'Credits SA Input Tax to consume eligible credit'
        }
      ];

      vouchers.push({
        key: 'e1',
        entryNum: 1,
        title: 'Entry 1 — Monthly GST Set-Off (ITC Absorption ①)',
        subTitle: entity.name + ' · Pass by 25th · Table 6.1 Sec (A) Paid via Credit',
        whenHint: 'By 25th, after GSTR-3B filing',
        lines: e1Lines,
        narrations: [{ label: 'Entry 1 Narration', text: e1Narr }],
        totalDrPaise: itcPaise,
        totalCrPaise: itcPaise,
        balanced: true,
        infoNote: null
      });
    }

    // ENTRY 2: REGULAR CASH ROUTING ② (By 25th, only if cash > 0)
    if (cashPaise > 0) {
      var e2Vars = Object.assign({}, vars, { cpin: regCpin });
      var e2RouteNarr = buildNarration(templates.e2, e2Vars);
      var e2PayNarr = buildNarration(templates.e0pay, e2Vars); // Payment leg

      var e2Lines = [
        {
          side: 'DR',
          code: entity.sl.code,
          name: entity.sl.name,
          paise: cashPaise,
          purpose: 'Debits remaining SL Output Tax liability'
        },
        {
          side: 'CR',
          code: clearingAcc.code,
          name: clearingAcc.name,
          paise: cashPaise,
          purpose: 'Credits 4445 to clear the regular cash challan deposit'
        }
      ];

      var e2Narrations = [
        { label: 'Entry 2 Narration', text: e2RouteNarr }
      ];

      if (settings.entry2IncludePaymentLeg) {
        e2Lines.push({
          side: 'DR',
          code: clearingAcc.code,
          name: clearingAcc.name,
          paise: cashPaise,
          purpose: 'Challan payment leg'
        });
        e2Lines.push({
          side: 'CR',
          code: bankAcc.code,
          name: bankAcc.name,
          paise: cashPaise,
          purpose: 'Paid from bank operating account'
        });
        e2Narrations.push({ label: 'Payment Leg Narration', text: e2PayNarr });
      }

      var drTotal2 = e2Lines.filter(function (l) { return l.side === 'DR'; }).reduce(function (s, l) { return s + l.paise; }, 0);
      var crTotal2 = e2Lines.filter(function (l) { return l.side === 'CR'; }).reduce(function (s, l) { return s + l.paise; }, 0);

      vouchers.push({
        key: 'e2',
        entryNum: 2,
        title: 'Entry 2 — Regular Cash Challan Routing ②',
        subTitle: entity.name + ' · Pass by 25th · Output exceeded available ITC',
        whenHint: 'By 25th, only if cash > 0',
        lines: e2Lines,
        narrations: e2Narrations,
        totalDrPaise: drTotal2,
        totalCrPaise: crTotal2,
        balanced: drTotal2 === crTotal2,
        infoNote: !settings.entry2IncludePaymentLeg
          ? 'Bank leg Dr 4445 / Cr 711 was passed on the challan payment date' + (regCpin ? ' (CPIN ' + regCpin + ')' : '') + '.'
          : null
      });
    }

    return vouchers;
  }

  // --------------------------------------------------------------------------
  // RETURN INTEGRITY & COMPLIANCE CHECKS
  // --------------------------------------------------------------------------

  function checkReturn(returnRec) {
    var warnings = [];
    if (!returnRec) return warnings;

    // Golden rule verification
    if (!returnRec.verified) {
      warnings.push({
        type: 'amber',
        code: 'UNVERIFIED',
        message: 'Not marked verified against filed GSTR-3B PDF Table 6.1'
      });
    }

    // Check CPIN format (must be 10 digits if present)
    if (returnRec.rcmCpin && !/^\d{10}$/.test(returnRec.rcmCpin.trim())) {
      warnings.push({
        type: 'warn',
        code: 'BAD_RCM_CPIN',
        message: 'RCM CPIN should be a 10-digit numeric challan number (got "' + returnRec.rcmCpin + '")'
      });
    }
    if (returnRec.regCpin && !/^\d{10}$/.test(returnRec.regCpin.trim())) {
      warnings.push({
        type: 'warn',
        code: 'BAD_REG_CPIN',
        message: 'Regular CPIN should be a 10-digit numeric challan number (got "' + returnRec.regCpin + '")'
      });
    }

    // Non-whole rupee check (portal typically files in whole rupees)
    var itc = returnRec.itcPaise || 0;
    var cash = returnRec.cashPaise || 0;
    var rcm = returnRec.rcmPaise || 0;
    if ((itc % 100 !== 0) || (cash % 100 !== 0) || (rcm % 100 !== 0)) {
      warnings.push({
        type: 'info',
        code: 'PAISE_FRACTION',
        message: 'One or more figures contain paise fractions. GSTR-3B filed tables normally round to whole rupees.'
      });
    }

    // Output tax tie-out (if entered)
    if (returnRec.outputTaxLiabilityPaise !== null && returnRec.outputTaxLiabilityPaise !== undefined) {
      var computedOutput = itc + cash; // Excludes RCM as RCM is reverse charge
      var expected = returnRec.outputTaxLiabilityPaise;
      var diff = computedOutput - expected;
      if (diff !== 0) {
        warnings.push({
          type: 'warn',
          code: 'OUTPUT_TAX_MISMATCH',
          message: 'Output Tax tie-out mismatch: Section (A) ITC (' + fmtINR(itc, true) + ') + Cash (' + fmtINR(cash, true) + ') = ' + fmtINR(computedOutput, true) + ' vs entered liability ' + fmtINR(expected, true) + ' (Variance: ' + fmtINR(Math.abs(diff), true) + ')'
        });
      }
    }

    // RCM = 0 advisory (the bank almost always has rent RCM monthly)
    if (rcm === 0 && returnRec.entityId === 'bank') {
      warnings.push({
        type: 'info',
        code: 'ZERO_RCM',
        message: 'RCM is ₹0.00 this month. Confirm if Bank HO rent challan was paid.'
      });
    }

    return warnings;
  }

  // --------------------------------------------------------------------------
  // ANNUAL RECONCILIATION & REVERSAL GENERATOR
  // --------------------------------------------------------------------------

  /**
   * Reconciles GL posted set-off against GST Portal Electronic Credit Ledger.
   *
   * diff = glPosted - portal
   * diff > 0 ("over-credited"): Dr SA / Cr SL for diff (restores ITC pool, reverses excess liability absorption)
   * diff < 0 ("under-credited"): Dr SL / Cr SA for |diff|
   * diff == 0: matched, no reversal required.
   */
  function reconcileFY(entity, fy, glPostedPaise, portalPaise, settings) {
    if (!entity) return null;

    settings = settings || DEFAULT_SETTINGS;
    var profile = settings.narrationProfile || 'sop';
    var templates = (settings.narrationTemplates && settings.narrationTemplates[profile])
      ? settings.narrationTemplates[profile]
      : DEFAULT_SETTINGS.narrationTemplates.sop;

    var gl = typeof glPostedPaise === 'number' ? glPostedPaise : 0;
    var portal = typeof portalPaise === 'number' ? portalPaise : 0;
    var diff = gl - portal;

    var vars = {
      prefix: entity.prefix,
      fy: fy,
      period: fy
    };

    if (diff === 0) {
      return {
        entityId: entity.id,
        fy: fy,
        glPostedPaise: gl,
        portalPaise: portal,
        diffPaise: 0,
        direction: 'matched',
        reversalVoucher: null,
        message: 'Matched — Set-Off in books matches the Portal Electronic Credit Ledger exactly. No reversal required.'
      };
    }

    var isOver = diff > 0;
    var absDiff = Math.abs(diff);
    var narrTemplate = isOver ? (templates.revOver || templates.rev) : (templates.revUnder || templates.rev);
    var narration = buildNarration(narrTemplate, vars);

    var lines;
    if (isOver) {
      // Over-credited in books: Dr SA (restore asset) / Cr SL (restore output liability)
      lines = [
        {
          side: 'DR',
          code: entity.sa.code,
          name: entity.sa.name,
          paise: absDiff,
          purpose: 'Restores over-credited ITC back into SA asset'
        },
        {
          side: 'CR',
          code: entity.sl.code,
          name: entity.sl.name,
          paise: absDiff,
          purpose: 'Restores SL output liability previously over-absorbed'
        }
      ];
    } else {
      // Under-credited: Dr SL / Cr SA
      lines = [
        {
          side: 'DR',
          code: entity.sl.code,
          name: entity.sl.name,
          paise: absDiff,
          purpose: 'Absorbs additional output liability'
        },
        {
          side: 'CR',
          code: entity.sa.code,
          name: entity.sa.name,
          paise: absDiff,
          purpose: 'Consumes remaining portal ITC credit'
        }
      ];
    }

    var voucher = {
      key: 'rev',
      entryNum: 99,
      title: 'Prior-Period Set-Off Reversal Voucher — FY ' + fy,
      subTitle: entity.name + ' · FY ' + fy + ' Year-End Close-Out (' + (isOver ? 'Over-Credited' : 'Under-Credited') + ')',
      whenHint: 'Post during FY close-out / audit reconciliation',
      lines: lines,
      narrations: [{ label: 'Reversal Narration', text: narration }],
      totalDrPaise: absDiff,
      totalCrPaise: absDiff,
      balanced: true,
      infoNote: 'GL posted ' + fmtINR(gl, true) + ' vs Portal ' + fmtINR(portal, true) + ' → ' + (isOver ? 'over-credited by ' : 'under-credited by ') + fmtINR(absDiff, true) + '.'
    };

    return {
      entityId: entity.id,
      fy: fy,
      glPostedPaise: gl,
      portalPaise: portal,
      diffPaise: absDiff,
      direction: isOver ? 'over' : 'under',
      reversalVoucher: voucher,
      narration: narration,
      message: (isOver ? 'Over-credited by ' : 'Under-credited by ') + fmtINR(absDiff, true) + ' in GL. Post reversal voucher to align books.'
    };
  }

  // --------------------------------------------------------------------------
  // EXPORT FORMATTERS (TEXT / TSV / JSON FOR PACSCORE)
  // --------------------------------------------------------------------------

  function formatVoucherAsText(voucher) {
    if (!voucher) return '';
    var out = '[' + voucher.title + ']\n';
    if (voucher.subTitle) out += voucher.subTitle + '\n';
    out += '--------------------------------------------------\n';
    voucher.lines.forEach(function (l) {
      var side = l.side === 'DR' ? 'Dr. ' : 'Cr. ';
      out += side + l.name + ' (' + l.code + ') : ₹' + fmtPlain(l.paise) + '\n';
    });
    out += 'TOTAL: ₹' + fmtPlain(voucher.totalDrPaise) + ' (Balanced ✓)\n';
    voucher.narrations.forEach(function (n) {
      out += n.label + ': ' + n.text + '\n';
    });
    if (voucher.infoNote) {
      out += 'Note: ' + voucher.infoNote + '\n';
    }
    return out.trim();
  }

  function formatVouchersAsText(vouchers) {
    return vouchers.map(formatVoucherAsText).join('\n\n');
  }

  function formatVoucherAsTSV(voucher) {
    if (!voucher) return '';
    var lines = ['Side\tCode\tAccount Name\tDebit\tCredit\tPurpose\tNarration'];
    var primaryNarr = voucher.narrations && voucher.narrations.length > 0 ? voucher.narrations[0].text : '';
    voucher.lines.forEach(function (l) {
      var dr = l.side === 'DR' ? fmtPlain(l.paise) : '';
      var cr = l.side === 'CR' ? fmtPlain(l.paise) : '';
      lines.push(l.side + '\t' + l.code + '\t' + l.name + '\t' + dr + '\t' + cr + '\t' + (l.purpose || '') + '\t' + primaryNarr);
    });
    return lines.join('\n');
  }

  function formatVouchersAsTSV(vouchers) {
    var allRows = ['Voucher\tSide\tCode\tAccount Name\tDebit\tCredit\tPurpose\tNarration'];
    vouchers.forEach(function (v) {
      var primaryNarr = v.narrations && v.narrations.length > 0 ? v.narrations[0].text : '';
      v.lines.forEach(function (l) {
        var dr = l.side === 'DR' ? fmtPlain(l.paise) : '';
        var cr = l.side === 'CR' ? fmtPlain(l.paise) : '';
        allRows.push(v.title + '\t' + l.side + '\t' + l.code + '\t' + l.name + '\t' + dr + '\t' + cr + '\t' + (l.purpose || '') + '\t' + primaryNarr);
      });
    });
    return allRows.join('\n');
  }

  // --------------------------------------------------------------------------
  // RULE 38 & GST CALCULATOR HELPER (FROM BLUEPRINT B)
  // --------------------------------------------------------------------------

  function calculateRule38GST(entityId, amountPaise, ratePercent, isInclusive) {
    var p = amountPaise || 0;
    var r = ratePercent || 18;
    var taxablePaise = 0;
    var totalGstPaise = 0;

    if (isInclusive) {
      taxablePaise = Math.round(p / (1 + (r / 100)));
      totalGstPaise = p - taxablePaise;
    } else {
      taxablePaise = p;
      totalGstPaise = Math.round(p * (r / 100));
    }

    var halfGstPaise = Math.round(totalGstPaise / 2);
    var isBank = entityId === 'bank';
    var eligiblePaise = isBank ? Math.round(totalGstPaise / 2) : totalGstPaise;
    var expenseAbsorptionPaise = isBank ? (totalGstPaise - eligiblePaise) : 0;
    var invoiceTotalPaise = taxablePaise + totalGstPaise;

    return {
      taxablePaise: taxablePaise,
      totalGstPaise: totalGstPaise,
      cgstPaise: halfGstPaise,
      sgstPaise: totalGstPaise - halfGstPaise,
      eligiblePaise: eligiblePaise,
      expenseAbsorptionPaise: expenseAbsorptionPaise,
      invoiceTotalPaise: invoiceTotalPaise
    };
  }

  // --------------------------------------------------------------------------
  // GSTR-3B TEXT & JSON PARSER (TABLE 6.1, 3.1d, ITC, CASH & RCM)
  // --------------------------------------------------------------------------

  function parseGSTR3B(raw) {
    if (!raw || typeof raw !== 'string') {
      return { ok: false, error: 'Empty or invalid input' };
    }

    var text = raw.trim();
    var result = {
      ok: true,
      entityId: null,
      period: null,
      arn: null,
      filedOn: null,
      itc: { igst: 0, cgst: 0, sgst: 0, total: 0, expr: '0' },
      cash: { igst: 0, cgst: 0, sgst: 0, total: 0, expr: '0' },
      rcm: { igst: 0, cgst: 0, sgst: 0, total: 0, expr: '0' },
      notes: []
    };

    // 1. Try parsing as JSON first
    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        var data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) data = data[0];

        // GSTIN to entity
        var gstin = data.gstin || '';
        if (gstin.includes('L1Z1')) result.entityId = 'bank';
        else if (gstin.includes('L2Z0')) result.entityId = 'neethi';
        else if (gstin.includes('L3ZZ')) result.entityId = 'depot';

        // Period
        if (data.ret_period) {
          var rp = String(data.ret_period);
          if (rp.length === 6) {
            result.period = rp.slice(2, 6) + '-' + rp.slice(0, 2);
          } else if (rp.includes('-')) {
            result.period = rp;
          }
        }

        if (data.arn) result.arn = data.arn;
        if (data.filing_date || data.filedOn || data.dateOfFiling) {
          result.filedOn = data.filing_date || data.filedOn || data.dateOfFiling;
        }

        // Table 6.1 ITC and Cash
        var itcPd = (data.tx_pmt && data.tx_pmt.itc_pd) || data.itc_pd || {};
        var pdCash = (data.tx_pmt && data.tx_pmt.pdcash) || data.pdcash || {};

        var itcI = Number(itcPd.i_pdi || itcPd.iamt || 0);
        var itcC = Number(itcPd.c_pdc || itcPd.camt || 0);
        var itcS = Number(itcPd.s_pds || itcPd.samt || 0);
        result.itc.igst = itcI;
        result.itc.cgst = itcC;
        result.itc.sgst = itcS;
        result.itc.total = itcI + itcC + itcS;
        var itcParts = [itcI, itcC, itcS].filter(function (n) { return n > 0; });
        result.itc.expr = itcParts.length > 0 ? itcParts.join('+') : '0';

        var cashI = Number(pdCash.iamt || pdCash.i_pd || 0);
        var cashC = Number(pdCash.camt || pdCash.c_pd || 0);
        var cashS = Number(pdCash.samt || pdCash.s_pd || 0);
        result.cash.igst = cashI;
        result.cash.cgst = cashC;
        result.cash.sgst = cashS;
        result.cash.total = cashI + cashC + cashS;
        var cashParts = [cashI, cashC, cashS].filter(function (n) { return n > 0; });
        result.cash.expr = cashParts.length > 0 ? cashParts.join('+') : '0';

        // RCM
        var rcmData = data.inward_sup || (data.tx_pmt && data.tx_pmt.rcm) || {};
        var isup = Array.isArray(rcmData.isup_details) ? rcmData.isup_details[0] : rcmData;
        if (isup) {
          var rcmI = Number(isup.iamt || 0);
          var rcmC = Number(isup.camt || 0);
          var rcmS = Number(isup.samt || 0);
          result.rcm.igst = rcmI;
          result.rcm.cgst = rcmC;
          result.rcm.sgst = rcmS;
          result.rcm.total = rcmI + rcmC + rcmS;
          var rcmParts = [rcmI, rcmC, rcmS].filter(function (n) { return n > 0; });
          result.rcm.expr = rcmParts.length > 0 ? rcmParts.join('+') : '0';
        }

        result.notes.push('Successfully parsed GSTR-3B JSON data.');
        return result;
      } catch (e) {
        // Fallback to text parsing
      }
    }

    // 2. Parse PDF or tabular text
    var gstinMatch = text.match(/\b32AABAV5891(L1Z1|L2Z0|L3ZZ)\b/i);
    if (gstinMatch) {
      var suffix = gstinMatch[1].toUpperCase();
      if (suffix === 'L1Z1') result.entityId = 'bank';
      else if (suffix === 'L2Z0') result.entityId = 'neethi';
      else if (suffix === 'L3ZZ') result.entityId = 'depot';
    }

    // Extract ARN (15-character alphanumeric starting with 2 letters + 2 digits, e.g. AA320926391808L)
    var arnMatch = text.match(/\b([A-Z]{2}[0-9]{2}[0-9A-Z]{11})\b/);
    if (arnMatch) {
      result.arn = arnMatch[1];
    }
    // Extract Date of Filing (DD/MM/YYYY or DD-MM-YYYY -> YYYY-MM-DD)
    var dateMatch = text.match(/(?:Date\s*of\s*Filing|Filed\s*on)[:\s]*([0-3][0-9])[\/\-]([0-1][0-9])[\/\-](202[4-9])/i);
    if (dateMatch) {
      result.filedOn = dateMatch[3] + '-' + dateMatch[2] + '-' + dateMatch[1];
    }

    var monthNames = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12'
    };
    var monthRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s*(?:20)?(2[4-9])\b/i;
    var periodMatch = text.match(monthRegex);
    if (periodMatch) {
      var mNum = monthNames[periodMatch[1].toLowerCase()];
      result.period = '20' + periodMatch[2] + '-' + mNum;
    } else {
      var yyyyMm = text.match(/\b(202[4-9])[-/](0[1-9]|1[0-2])\b/);
      if (yyyyMm) {
        result.period = yyyyMm[1] + '-' + yyyyMm[2];
      }
    }

    function extractAmounts(line) {
      if (!line) return [];
      // Strip section prefixes like "3.1 (d)", "3.1(d)", "6.1" so table numbering isn't parsed as currency
      var clean = line.replace(/(?:^|\s)[0-9]{1,2}\.[0-9](?![0-9])(?:\s*\([a-z]\))?/gi, ' ');
      var matches = clean.match(/(?:₹\s*)?[0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})|\b[0-9]+(?:\.[0-9]{2})\b/g) || [];
      return matches.map(function (m) {
        return parseFloat(m.replace(/₹|,|\s/g, '')) || 0;
      });
    }

    var lines = text.split(/\r?\n/);
    var inTable61 = false;
    var table61Lines = [];
    var rcmLines = [];

    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (/6\.1\b|Payment of tax/i.test(l)) {
        inTable61 = true;
      }
      if (inTable61) {
        table61Lines.push(l);
        if (/^7\b|Verification|Signature/i.test(l) && table61Lines.length > 5) {
          inTable61 = false;
        }
      }
      if (/reverse charge|3\.1\s*\(d\)|3\.1\(d\)/i.test(l)) {
        rcmLines.push(l);
        if (lines[i + 1]) rcmLines.push(lines[i + 1]);
        if (lines[i + 2]) rcmLines.push(lines[i + 2]);
      }
    }

    var t6Source = table61Lines.length > 3 ? table61Lines.join('\n') : text;

    var igstLine = (t6Source.match(/Integrated tax[^\n]*/i) || [])[0] || '';
    var cgstLine = (t6Source.match(/Central tax[^\n]*/i) || [])[0] || '';
    var sgstLine = (t6Source.match(/(?:State\/UT tax|State tax)[^\n]*/i) || [])[0] || '';

    function parseTaxRow(rowStr) {
      var nums = extractAmounts(rowStr);
      if (nums.length >= 3) {
        return { itc: nums[1], cash: nums[2] };
      } else if (nums.length === 2) {
        return { itc: nums[1], cash: 0 };
      } else if (nums.length === 1) {
        return { itc: nums[0], cash: 0 };
      }
      return { itc: 0, cash: 0 };
    }

    if (igstLine || cgstLine || sgstLine) {
      var rI = parseTaxRow(igstLine);
      var rC = parseTaxRow(cgstLine);
      var rS = parseTaxRow(sgstLine);

      result.itc.igst = rI.itc;
      result.itc.cgst = rC.itc;
      result.itc.sgst = rS.itc;
      result.itc.total = rI.itc + rC.itc + rS.itc;
      var itcP = [rI.itc, rC.itc, rS.itc].filter(function (n) { return n > 0; });
      result.itc.expr = itcP.length > 0 ? itcP.join('+') : '0';

      result.cash.igst = rI.cash;
      result.cash.cgst = rC.cash;
      result.cash.sgst = rS.cash;
      result.cash.total = rI.cash + rC.cash + rS.cash;
      var cashP = [rI.cash, rC.cash, rS.cash].filter(function (n) { return n > 0; });
      result.cash.expr = cashP.length > 0 ? cashP.join('+') : '0';
    }

    if (rcmLines.length > 0) {
      var rcmTxt = rcmLines.join(' ');
      var rcmNums = extractAmounts(rcmTxt);
      if (rcmNums.length >= 4) {
        result.rcm.igst = rcmNums[1];
        result.rcm.cgst = rcmNums[2];
        result.rcm.sgst = rcmNums[3];
        result.rcm.total = rcmNums[1] + rcmNums[2] + rcmNums[3];
        var rcmP = [rcmNums[1], rcmNums[2], rcmNums[3]].filter(function (n) { return n > 0; });
        result.rcm.expr = rcmP.length > 0 ? rcmP.join('+') : '0';
      } else if (rcmNums.length >= 2) {
        result.rcm.cgst = rcmNums[0];
        result.rcm.sgst = rcmNums[1];
        result.rcm.total = rcmNums[0] + rcmNums[1];
        result.rcm.expr = rcmNums[0] + '+' + rcmNums[1];
      }
    }

    result.notes.push('Parsed GSTR-3B text content.');
    return result;
  }

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------

  return {
    DEFAULT_ENTITIES: DEFAULT_ENTITIES,
    DEFAULT_ACCOUNTS: DEFAULT_ACCOUNTS,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    MONTH_NAMES: MONTH_NAMES,
    evalMoney: evalMoney,
    fmtINR: fmtINR,
    fmtPlain: fmtPlain,
    periodLabel: periodLabel,
    fyOf: fyOf,
    monthsInFY: monthsInFY,
    uuid: uuid,
    buildNarration: buildNarration,
    buildVouchers: buildVouchers,
    checkReturn: checkReturn,
    reconcileFY: reconcileFY,
    formatVoucherAsText: formatVoucherAsText,
    formatVouchersAsText: formatVouchersAsText,
    formatVoucherAsTSV: formatVoucherAsTSV,
    formatVouchersAsTSV: formatVouchersAsTSV,
    calculateRule38GST: calculateRule38GST,
    parseGSTR3B: parseGSTR3B
  };
}));
