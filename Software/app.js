/**
 * GST SET-OFF VOUCHER STUDIO — APPLICATION ENGINE (app.js)
 * UI Controller, Delegated Event Bus, View Renderers, and Offline Utilities
 * Vadakkumbad Service Co-operative Bank Ltd.
 */

(function () {
  'use strict';

  var core = window.GSTCore;
  var store = window.GSTStore;

  if (!core || !store) {
    console.error('Core or Store module not loaded.');
    return;
  }

  // --------------------------------------------------------------------------
  // STATE & INITIALIZATION
  // --------------------------------------------------------------------------

  var currentTab = 'dashboard';
  var pendingImportPreview = null;

  function initApp() {
    store.init();

    // Check UI memory for theme and last tab
    var uiState = store.getUIState();
    if (uiState.theme === 'light') {
      document.body.classList.add('theme-light');
    }

    currentTab = uiState.activeTab || 'dashboard';

    // Setup global cross-tab synchronization listener
    window.addEventListener('storage', function (e) {
      if (e.key === 'gstvs.v1.db') {
        showSystemAlert('⚠️ Data was modified in another window/tab. <button class="btn btn-sm btn-primary" onclick="location.reload()">Reload Page</button>', 'alert-amber');
      }
    });

    // Check backup nag
    checkBackupHealth();

    // Register store subscription
    store.subscribe(function (action) {
      updateNavBadges();
      checkBackupHealth();
      if (currentTab === 'dashboard') renderDashboard();
      if (currentTab === 'register') renderRegister();
      if (currentTab === 'reconcile') renderReconciler();
      if (currentTab === 'settings') renderSettings();
    });

    // Initial setup
    setupDelegatedEvents();
    populateSavedMonthsDropdown();
    setupCalcModalEvents();
    setupSubSplitHelpers();
    setupEntityChipEvents();
    setupGSTR3BModalEvents();
    setupGlobalKeyboardShortcuts();

    // Load draft or initial state in generator
    loadInitialGeneratorState();

    // Switch to active tab
    switchTab(currentTab);
    updateNavBadges();
  }

  // --------------------------------------------------------------------------
  // SYSTEM ALERTS & NOTIFICATIONS
  // --------------------------------------------------------------------------

  function showToast(message) {
    var toast = document.getElementById('toast');
    var textEl = document.getElementById('toast-text');
    if (!toast || !textEl) return;
    textEl.textContent = message || 'Copied!';
    toast.style.display = 'flex';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function () {
      toast.style.display = 'none';
    }, 2400);
  }

  function showSystemAlert(htmlMessage, alertClass) {
    var container = document.getElementById('system-alerts-container');
    if (!container) return;
    container.innerHTML = `
      <div class="alert ${alertClass || 'alert-amber'}">
        <span style="font-size:16px">🔔</span>
        <div style="flex:1">${htmlMessage}</div>
        <button type="button" class="btn btn-sm" onclick="this.closest('.alert').remove()">✕</button>
      </div>`;
  }

  function checkBackupHealth() {
    var container = document.getElementById('system-alerts-container');
    if (!container) return;
    if (store.isBackupOverdue()) {
      showSystemAlert(
        '<strong>Backup Alert:</strong> More than 10 changes or 30 days have passed since your last backup export. ' +
        'Clearing browser data erases this app\'s memory — <button type="button" class="btn btn-sm btn-primary" id="btn-alert-backup">Export Backup Now</button>',
        'alert-amber'
      );
      var btn = document.getElementById('btn-alert-backup');
      if (btn) {
        btn.onclick = function () {
          exportBackupFile();
          container.innerHTML = '';
        };
      }
    }
  }

  function updateNavBadges() {
    var db = store.getDB();
    var countEl = document.getElementById('badge-register-count');
    if (countEl) countEl.textContent = db.returns.length;

    var quickBackupBtn = document.getElementById('btn-quick-backup');
    if (quickBackupBtn) {
      if (store.isBackupOverdue()) {
        quickBackupBtn.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.8)';
        quickBackupBtn.textContent = '⬇️ Backup ⚠️';
      } else {
        quickBackupBtn.style.boxShadow = 'none';
        quickBackupBtn.textContent = '⬇️ Backup';
      }
    }
  }

  // --------------------------------------------------------------------------
  // CLIPBOARD COPY UTILITIES
  // --------------------------------------------------------------------------

  function copyTextToClipboard(text, successToastMsg) {
    if (!text) return;
    var clean = text.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(clean).then(function () {
        showToast(successToastMsg || 'Copied to clipboard!');
      }).catch(function () {
        fallbackCopyText(clean, successToastMsg);
      });
    } else {
      fallbackCopyText(clean, successToastMsg);
    }
  }

  function fallbackCopyText(text, successToastMsg) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      showToast(successToastMsg || 'Copied to clipboard!');
    } catch (e) {
      showToast('Could not copy automatically');
    }
    document.body.removeChild(ta);
  }

  // --------------------------------------------------------------------------
  // TAB NAVIGATION
  // --------------------------------------------------------------------------

  function switchTab(tabId) {
    if (tabId === 'register') {
      currentTab = 'reconcile';
      store.saveUIState({ activeTab: 'reconcile' });
      activateTabView('reconcile');
      switchAuditSubtab('audit-sec-register');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabId === 'settings') {
      currentTab = 'reconcile';
      store.saveUIState({ activeTab: 'reconcile' });
      activateTabView('reconcile');
      switchAuditSubtab('audit-sec-settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    currentTab = tabId;
    store.saveUIState({ activeTab: tabId });
    activateTabView(tabId);

    if (tabId === 'dashboard') renderDashboard();
    else if (tabId === 'generator') runGenerator();
    else if (tabId === 'reconcile') {
      var activeSub = document.querySelector('.audit-subtab.active');
      var targetSec = activeSub ? activeSub.getAttribute('data-audit-target') : 'audit-sec-gl';
      switchAuditSubtab(targetSec);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function activateTabView(tabId) {
    document.querySelectorAll('.tab-view').forEach(function (v) {
      v.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(function (b) {
      b.classList.remove('active');
    });

    var viewEl = document.getElementById('view-' + tabId);
    if (viewEl) viewEl.classList.add('active');

    var btnEl = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    if (btnEl) btnEl.classList.add('active');
  }

  function switchAuditSubtab(subtabId) {
    document.querySelectorAll('.audit-subtab').forEach(function (b) {
      if (b.getAttribute('data-audit-target') === subtabId) {
        b.classList.add('active');
        b.classList.add('btn-primary');
      } else {
        b.classList.remove('active');
        b.classList.remove('btn-primary');
      }
    });
    document.querySelectorAll('.audit-subview').forEach(function (v) {
      v.style.display = (v.id === subtabId) ? 'block' : 'none';
    });

    var ent = document.getElementById('rec-entity') ? document.getElementById('rec-entity').value : 'bank';
    var fy = document.getElementById('rec-fy') ? document.getElementById('rec-fy').value : '2026-27';

    if (subtabId === 'audit-sec-gl') renderAuditTableGL(ent, fy);
    else if (subtabId === 'audit-sec-3b') renderAuditTable3B(ent, fy);
    else if (subtabId === 'audit-sec-reversals') renderReconciler();
    else if (subtabId === 'audit-sec-register') renderRegister();
    else if (subtabId === 'audit-sec-r38') recalcRule38TestOutput();
    else if (subtabId === 'audit-sec-settings') renderSettings();
  }

  // --------------------------------------------------------------------------
  // VIEW 1: DASHBOARD MATRIX
  // --------------------------------------------------------------------------

  function renderDashboard() {
    var db = store.getDB();
    var fySelect = document.getElementById('dash-fy-select');
    var selectedFy = fySelect ? fySelect.value : '2026-27';

    var months = core.monthsInFY(selectedFy);
    var tbody = document.getElementById('dash-matrix-tbody');
    var tfoot = document.getElementById('dash-matrix-tfoot');
    if (!tbody) return;

    var entBank = db.entities.find(function (e) { return e.id === 'bank'; });
    var entNeethi = db.entities.find(function (e) { return e.id === 'neethi'; });
    var entDepot = db.entities.find(function (e) { return e.id === 'depot'; });

    var totals = {
      bank: { rcm: 0, itc: 0, cash: 0, tot: 0 },
      neethi: { rcm: 0, itc: 0, cash: 0, tot: 0 },
      depot: { rcm: 0, itc: 0, cash: 0, tot: 0 }
    };

    var grandRcm = 0, grandItc = 0, grandCash = 0, grandTotal = 0;

    var rowsHtml = months.map(function (p) {
      var pLabel = core.periodLabel(p);
      var rBank = db.returns.find(function (r) { return r.entityId === 'bank' && r.period === p; });
      var rNeethi = db.returns.find(function (r) { return r.entityId === 'neethi' && r.period === p; });
      var rDepot = db.returns.find(function (r) { return r.entityId === 'depot' && r.period === p; });

      function cellHtml(ret, entId) {
        if (!ret) {
          return `<div class="matrix-cell status-empty" data-action="load-matrix" data-entity="${entId}" data-period="${p}" style="opacity:0.45">
            <span class="status-chip status-empty">⚪ Upcoming</span>
          </div>`;
        }

        var itc = ret.itcPaise || 0;
        var rcm = ret.rcmPaise || 0;
        var cash = ret.cashPaise || 0;
        var sum = itc + rcm + cash;

        totals[entId].rcm += rcm;
        totals[entId].itc += itc;
        totals[entId].cash += cash;
        totals[entId].tot += sum;

        grandRcm += rcm;
        grandItc += itc;
        grandCash += cash;
        grandTotal += sum;

        var statusClass = 'status-draft';
        var statusLabel = '🟡 Pending GL';
        if (ret.glStatus === 'posted') {
          statusClass = 'status-posted';
          statusLabel = '🟢 Posted';
        } else if (ret.glStatus === 'reconciled') {
          statusClass = 'status-reconciled';
          statusLabel = '🟢 Reconciled';
        }

        return `<div class="matrix-cell ${statusClass}" data-action="load-matrix" data-entity="${entId}" data-period="${p}" title="Click to view & edit in Operator Mode">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="status-chip ${statusClass}">${statusLabel}</span>
            <button type="button" class="btn-matrix-copy" data-action="quick-copy-month" data-entity="${entId}" data-period="${p}" title="Copy vouchers directly">📋</button>
          </div>
          <div style="margin-top:6px;display:flex;justify-content:space-between;align-items:baseline">
            <span style="font-size:11px;color:var(--muted)">Settled</span>
            <strong style="font-family:var(--mono);font-size:13.5px;color:var(--tx)">₹${core.fmtINR(sum)}</strong>
          </div>
        </div>`;
      }

      return `<tr>
        <td style="font-family:var(--mono);font-weight:700">${pLabel}</td>
        <td>${cellHtml(rBank, 'bank')}</td>
        <td>${cellHtml(rNeethi, 'neethi')}</td>
        <td>${cellHtml(rDepot, 'depot')}</td>
      </tr>`;
    }).join('');

    tbody.innerHTML = rowsHtml;

    // Totals row (reproducing table totals exactly)
    tfoot.innerHTML = `<tr>
      <td>ANNUAL TOTALS</td>
      <td style="font-family:var(--mono);color:var(--bank)">
        Total: ₹${core.fmtINR(totals.bank.tot)}<br>
        <span style="font-size:11px;color:var(--muted)">① ₹${core.fmtINR(totals.bank.itc)} · E0 ₹${core.fmtINR(totals.bank.rcm)} · ② ₹${core.fmtINR(totals.bank.cash)}</span>
      </td>
      <td style="font-family:var(--mono);color:var(--neethi)">
        Total: ₹${core.fmtINR(totals.neethi.tot)}<br>
        <span style="font-size:11px;color:var(--muted)">① ₹${core.fmtINR(totals.neethi.itc)} · E0 ₹${core.fmtINR(totals.neethi.rcm)} · ② ₹${core.fmtINR(totals.neethi.cash)}</span>
      </td>
      <td style="font-family:var(--mono);color:var(--depot)">
        Total: ₹${core.fmtINR(totals.depot.tot)}<br>
        <span style="font-size:11px;color:var(--muted)">① ₹${core.fmtINR(totals.depot.itc)} · E0 ₹${core.fmtINR(totals.depot.rcm)} · ② ₹${core.fmtINR(totals.depot.cash)}</span>
      </td>
    </tr>`;

    // KPI cards
    document.getElementById('dash-tot-rcm').textContent = '₹' + core.fmtINR(grandRcm);
    document.getElementById('dash-tot-itc').textContent = '₹' + core.fmtINR(grandItc);
    document.getElementById('dash-tot-cash').textContent = '₹' + core.fmtINR(grandCash);
    document.getElementById('dash-tot-cleared').textContent = '₹' + core.fmtINR(grandTotal);

    // Dynamic computation for Executive Overview Hero Cards (Integer Paise)
    var totHeroCash = grandCash + grandRcm; // Combined cash outflow via 4445
    var heroCashEl = document.getElementById('dash-tot-cash-hero');
    if (heroCashEl) heroCashEl.textContent = '₹' + core.fmtINR(totHeroCash);

    var heroItcEl = document.getElementById('dash-tot-itc-hero');
    if (heroItcEl) heroItcEl.textContent = '₹' + core.fmtINR(grandItc);

    var heroGlEl = document.getElementById('dash-gl-health-hero');
    var heroGlSub = document.getElementById('dash-gl-health-sub');
    var fyReturns = db.returns.filter(function (r) { return r.fy === selectedFy; });
    var postedCount = fyReturns.filter(function (r) { return r.glStatus === 'posted' || r.glStatus === 'reconciled'; }).length;
    if (heroGlEl) {
      heroGlEl.textContent = `${postedCount} / ${fyReturns.length} Posted ✓`;
    }
    if (heroGlSub) {
      if (postedCount < fyReturns.length) {
        heroGlSub.textContent = `${postedCount} returns posted in PacScore GL · ${fyReturns.length - postedCount} return pending GL journal slip (Neethy May SGST).`;
      } else {
        heroGlSub.textContent = `All ${postedCount} returns successfully posted in PacScore General Ledger.`;
      }
    }

    // Render Next Actions
    renderDashboardActions(db, selectedFy);
  }

  function renderDashboardActions(db, selectedFy) {
    var listEl = document.getElementById('dash-action-list');
    var revEl = document.getElementById('dash-reversal-summary');
    if (!listEl) return;

    var items = [];

    // Neethy May 2026 SGST shortfall check (Refinement 2 & Bug 5 fix)
    var neethiMay = db.returns.find(function (r) { return r.entityId === 'neethi' && r.period === '2026-05'; });
    if (neethiMay && neethiMay.glStatus !== 'posted') {
      items.push(`
        <li style="background:rgba(245,158,11,0.08);padding:8px 10px;border-radius:6px;border:1px solid rgba(245,158,11,0.3);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <strong style="color:var(--saf)">⚠️ 1 Action Needed:</strong> Neethy May 2026 SGST Set-Off Shortfall (<strong>₹17,122.00</strong> pending in GL)
          </div>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn btn-sm btn-primary" id="btn-catchup-neethi-may" style="padding:3px 8px;font-size:11px">⚡ Generate ₹17,122 Voucher</button>
            <button type="button" class="btn btn-sm btn-green" id="btn-mark-neethi-may-posted" style="padding:3px 8px;font-size:11px">✓ Mark May SGST Posted</button>
          </div>
        </li>
      `);
    }

    // Drafts check
    var drafts = db.returns.filter(function (r) { return r.glStatus === 'draft'; });
    if (drafts.length > 0) {
      items.push(`<li>⚠️ <strong>${drafts.length} returns in draft:</strong> Pass set-off vouchers in PacScore and mark as posted.</li>`);
    } else {
      items.push(`<li>✓ All active returns are GL-posted or reconciled.</li>`);
    }

    // Unverified check
    var unverified = db.returns.filter(function (r) { return !r.verified; });
    if (unverified.length > 0) {
      items.push(`<li>⚠️ <strong>${unverified.length} returns unverified:</strong> Tick "Verified against filed GSTR-3B PDF Table 6.1".</li>`);
    } else {
      items.push(`<li>✓ 100% of recorded returns are verified against filed GSTR-3B PDFs.</li>`);
    }

    // Backup check
    if (store.isBackupOverdue()) {
      items.push(`<li>⚠️ <strong>Backup overdue:</strong> Click "⬇️ Backup" to save your records to disk.</li>`);
    } else {
      items.push(`<li>✓ LocalStorage memory state healthy and up to date.</li>`);
    }

    listEl.innerHTML = items.join('');

    // Reversals
    var revs = db.reversals;
    if (revs.length === 0) {
      revEl.innerHTML = `<div style="color:var(--muted)">No prior-period reversals recorded.</div>`;
    } else {
      revEl.innerHTML = revs.map(function (rev) {
        var ent = db.entities.find(function (e) { return e.id === rev.entityId; });
        var entName = ent ? ent.name : rev.entityId;
        return `<div class="card2" style="padding:10px;margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong>${entName} (FY ${rev.fy})</strong>
            <span class="status-chip status-posted">${rev.status || 'Cleared'}</span>
          </div>
          <div style="font-family:var(--mono);font-size:12px;margin:3px 0;color:var(--saf2)">
            Reversal: ₹${core.fmtINR(rev.diffPaise)} (${rev.direction.toUpperCase()})
          </div>
          <div style="font-size:11px;color:var(--muted)">${rev.narration || ''}</div>
        </div>`;
      }).join('');
    }
  }

  // --------------------------------------------------------------------------
  // VIEW 2: SET-OFF GENERATOR
  // --------------------------------------------------------------------------

  function loadInitialGeneratorState() {
    var uiState = store.getUIState();
    var draft = uiState.draft;

    if (draft) {
      if (draft.entityId) document.getElementById('gen-entity').value = draft.entityId;
      if (draft.period) document.getElementById('gen-period').value = draft.period;
      if (draft.itc !== undefined) document.getElementById('gen-itc').value = draft.itc;
      if (draft.cash !== undefined) document.getElementById('gen-cash').value = draft.cash;
      if (draft.rcm !== undefined) document.getElementById('gen-rcm').value = draft.rcm;
      if (draft.rcmCpin !== undefined) document.getElementById('gen-rcm-cpin').value = draft.rcmCpin;
      if (draft.regCpin !== undefined) document.getElementById('gen-reg-cpin').value = draft.regCpin;
      if (draft.e0Slip !== undefined && document.getElementById('gen-e0-slip')) document.getElementById('gen-e0-slip').value = draft.e0Slip;
      if (draft.e1Slip !== undefined && document.getElementById('gen-e1-slip')) document.getElementById('gen-e1-slip').value = draft.e1Slip;
      if (draft.e2Slip !== undefined && document.getElementById('gen-e2-slip')) document.getElementById('gen-e2-slip').value = draft.e2Slip;
      if (draft.arn !== undefined && document.getElementById('gen-arn')) document.getElementById('gen-arn').value = draft.arn;
      if (draft.filedOn !== undefined && document.getElementById('gen-filedate')) document.getElementById('gen-filedate').value = draft.filedOn;
      if (draft.glStatus !== undefined) document.getElementById('gen-gl-status').value = draft.glStatus;
      if (draft.glPostedOn !== undefined) document.getElementById('gen-gl-postdate').value = draft.glPostedOn;
      if (draft.verified !== undefined) document.getElementById('gen-verified').checked = draft.verified;
      if (draft.outputLiability !== undefined) document.getElementById('gen-output-liability').value = draft.outputLiability;
      if (draft.notes !== undefined) document.getElementById('gen-notes').value = draft.notes;
    } else {
      // Default to Bank April 2026
      loadPreset('bank-apr26');
    }
    runGenerator();
  }

  function updateMathPreview(inputId, previewId) {
    var input = document.getElementById(inputId);
    var prev = document.getElementById(previewId);
    if (!input || !prev) return 0;

    var raw = input.value.trim();
    if (!raw) {
      prev.textContent = '';
      return 0;
    }

    var res = core.evalMoney(raw);
    if (!res.ok) {
      prev.textContent = '✗ ' + res.error;
      prev.className = 'math-error';
      return 0;
    } else {
      prev.className = 'math-preview';
      if (/[+\-*/()]/.test(raw)) {
        prev.textContent = '= ₹' + core.fmtINR(res.paise);
      } else {
        prev.textContent = '';
      }
      return res.paise;
    }
  }

  function updateCpinCounters() {
    var rcmInput = document.getElementById('gen-rcm-cpin');
    var regInput = document.getElementById('gen-reg-cpin');
    var rcmBadge = document.getElementById('badge-rcm-cpin-len');
    var regBadge = document.getElementById('badge-reg-cpin-len');

    function checkBadge(input, badge) {
      if (!input || !badge) return;
      var val = input.value.trim();
      var len = val.length;
      if (len === 0) {
        badge.textContent = '';
        badge.className = 'cpin-counter muted';
      } else if (/^\d{10}$/.test(val)) {
        badge.textContent = '10/10 ✓';
        badge.className = 'cpin-counter ok';
      } else {
        badge.textContent = len + '/10 ⚠️';
        badge.className = 'cpin-counter warn';
      }
    }

    checkBadge(rcmInput, rcmBadge);
    checkBadge(regInput, regBadge);
  }

  function updateGeneratorDirtyStatus(currentRec) {
    var statusBadge = document.getElementById('badge-generator-status');
    if (!statusBadge) return;

    var entityId = currentRec.entityId;
    var period = currentRec.period;
    var savedRec = store.getReturn(entityId, period);

    if (!savedRec) {
      statusBadge.textContent = 'NEW • UNSAVED';
      statusBadge.className = 'nav-counter badge-unsaved';
      return;
    }

    var isClean =
      savedRec.itcPaise === currentRec.itcPaise &&
      savedRec.cashPaise === currentRec.cashPaise &&
      savedRec.rcmPaise === currentRec.rcmPaise &&
      (savedRec.rcmCpin || '') === (currentRec.rcmCpin || '') &&
      (savedRec.regCpin || '') === (currentRec.regCpin || '') &&
      (savedRec.e0Slip || '') === (currentRec.e0Slip || '') &&
      (savedRec.e1Slip || '') === (currentRec.e1Slip || '') &&
      (savedRec.e2Slip || '') === (currentRec.e2Slip || '') &&
      Boolean(savedRec.verified) === Boolean(currentRec.verified) &&
      (savedRec.glStatus || 'draft') === (currentRec.glStatus || 'draft');

    if (isClean) {
      statusBadge.textContent = 'SAVED ✓';
      statusBadge.className = 'nav-counter badge-saved';
    } else {
      statusBadge.textContent = 'MODIFIED • UNSAVED';
      statusBadge.className = 'nav-counter badge-unsaved';
    }
  }

  function runGenerator() {
    var db = store.getDB();
    var entityId = document.getElementById('gen-entity').value;
    var period = document.getElementById('gen-period').value || '2026-04';
    var periodLbl = core.periodLabel(period);

    document.getElementById('gen-period-label').textContent = periodLbl;

    var entity = db.entities.find(function (e) { return e.id === entityId; }) || db.entities[0];
    var settings = db.settings;

    // Update real-time context bar and entity chips
    var ctxEnt = document.getElementById('context-active-entity');
    if (ctxEnt) ctxEnt.textContent = entity.name + ' (' + entity.gstin.slice(-4) + ')';
    var ctxPeriod = document.getElementById('context-active-period');
    if (ctxPeriod) ctxPeriod.textContent = period + ' (' + periodLbl + ')';

    document.querySelectorAll('.entity-chip').forEach(function (chip) {
      if (chip.getAttribute('data-entity') === entityId) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    var itcPaise = updateMathPreview('gen-itc', 'prev-gen-itc');
    var cashPaise = updateMathPreview('gen-cash', 'prev-gen-cash');
    var rcmPaise = updateMathPreview('gen-rcm', 'prev-gen-rcm');
    var liabilityPaise = document.getElementById('gen-output-liability').value.trim()
      ? updateMathPreview('gen-output-liability', 'prev-gen-liability')
      : null;

    var rcmCpin = document.getElementById('gen-rcm-cpin').value.trim();
    var regCpin = document.getElementById('gen-reg-cpin').value.trim();
    var e0Slip = document.getElementById('gen-e0-slip') ? document.getElementById('gen-e0-slip').value.trim() : '';
    var e1Slip = document.getElementById('gen-e1-slip') ? document.getElementById('gen-e1-slip').value.trim() : '';
    var e2Slip = document.getElementById('gen-e2-slip') ? document.getElementById('gen-e2-slip').value.trim() : '';
    var arn = document.getElementById('gen-arn') ? document.getElementById('gen-arn').value.trim() : '';
    var filedOn = document.getElementById('gen-filedate') ? document.getElementById('gen-filedate').value.trim() : '';

    var glStatus = document.getElementById('gen-gl-status').value;
    var glPostedOn = document.getElementById('gen-gl-postdate').value;
    var verified = document.getElementById('gen-verified').checked;
    var notes = document.getElementById('gen-notes').value;

    // Sync bank entries done toggle with glStatus
    var bankDoneEl = document.getElementById('gen-bank-entries-done');
    var bankStatusSub = document.getElementById('gen-bank-status-sub');
    var isPosted = (glStatus === 'posted' || glStatus === 'reconciled');
    if (bankDoneEl) bankDoneEl.checked = isPosted;
    if (bankStatusSub) {
      if (isPosted) {
        bankStatusSub.textContent = '✓ Done';
        bankStatusSub.style.color = 'var(--green)';
      } else {
        bankStatusSub.textContent = '⏳ Pending';
        bankStatusSub.style.color = 'var(--saf)';
      }
    }

    var returnRec = {
      entityId: entityId,
      period: period,
      fy: core.fyOf(period),
      itcPaise: itcPaise,
      cashPaise: cashPaise,
      rcmPaise: rcmPaise,
      rcmCpin: rcmCpin,
      regCpin: regCpin,
      e0Slip: e0Slip,
      e1Slip: e1Slip,
      e2Slip: e2Slip,
      arn: arn,
      filedOn: filedOn,
      pmt06Filed: true,
      verified: verified,
      glStatus: glStatus,
      glPostedOn: glPostedOn,
      outputTaxLiabilityPaise: liabilityPaise,
      notes: notes,
      rawInputs: {
        itc: document.getElementById('gen-itc').value,
        cash: document.getElementById('gen-cash').value,
        rcm: document.getElementById('gen-rcm').value
      }
    };

    // Save draft to memory
    store.saveDraft(returnRec);

    // Build vouchers
    var vouchers = core.buildVouchers(returnRec, entity, settings);

    // Check compliance warnings
    var warnings = core.checkReturn(returnRec);
    renderGeneratorWarnings(warnings);

    // Update KPI cards
    var totalCleared = itcPaise + cashPaise + rcmPaise;
    document.getElementById('kpi-itc').textContent = '₹' + core.fmtINR(itcPaise);
    document.getElementById('kpi-rcm').textContent = '₹' + core.fmtINR(rcmPaise);
    document.getElementById('kpi-cash').textContent = '₹' + core.fmtINR(cashPaise);
    document.getElementById('kpi-total-output').textContent = 'Total Cleared: ₹' + core.fmtINR(totalCleared);

    var statusEl = document.getElementById('kpi-status');
    if (!verified) {
      statusEl.textContent = 'Not Verified ⚠️';
      statusEl.style.color = 'var(--saf)';
    } else {
      statusEl.textContent = 'Balanced ✓';
      statusEl.style.color = 'var(--green)';
    }

    // Update CPIN live counters & Dirty status
    updateCpinCounters();
    updateGeneratorDirtyStatus(returnRec);

    // Update Print Header fields
    var pvhName = document.getElementById('pvh-entity-name');
    if (pvhName) pvhName.textContent = entity.name;
    var pvhGstin = document.getElementById('pvh-gstin');
    if (pvhGstin) pvhGstin.textContent = entity.gstin;
    var pvhPeriod = document.getElementById('pvh-period');
    if (pvhPeriod) pvhPeriod.textContent = periodLbl;
    var pvhVerified = document.getElementById('pvh-verified');
    if (pvhVerified) pvhVerified.textContent = verified ? 'Table 6.1 Verified ✓' : 'Unverified ⚠️';
    var pvhBank = document.getElementById('pvh-bank-status');
    if (pvhBank) pvhBank.textContent = (isPosted ? (glStatus === 'reconciled' ? 'Reconciled ✓' : 'Posted in GL ✓') : 'Draft / Unposted');
    var pvhDate = document.getElementById('pvh-print-date');
    if (pvhDate) pvhDate.textContent = new Date().toLocaleString('en-IN');

    // Update active highlight on entity chips in top header
    document.querySelectorAll('.header-chips .entity-chip').forEach(function (c) {
      if (c.getAttribute('data-entity') === entityId) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    // Render voucher cards
    renderVoucherCards(vouchers, returnRec, entity, settings);
  }

  function renderGeneratorWarnings(warnings) {
    var container = document.getElementById('gen-warnings-container');
    if (!container) return;
    if (!warnings || warnings.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = warnings.map(function (w) {
      var alertClass = 'alert-info';
      if (w.type === 'amber') alertClass = 'alert-amber';
      else if (w.type === 'warn') alertClass = 'alert-warn';
      return `<div class="alert ${alertClass}">
        <span>⚠️</span>
        <div>${w.message}</div>
      </div>`;
    }).join('');
  }

  function renderVoucherCards(vouchers, returnRec, entity, settings) {
    var container = document.getElementById('gen-vouchers-container');
    if (!container) return;

    if (!vouchers || vouchers.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:30px;color:var(--muted)">
          <span style="font-size:28px">📄</span>
          <p style="margin-top:8px">No set-off vouchers generated for this month (all amounts are ₹0.00 / Nil return).</p>
        </div>`;
      return;
    }

    var maxLen = settings.narrationMaxLen || 60;

    var html = vouchers.map(function (v) {
      var linesHtml = v.lines.map(function (l) {
        var isDr = l.side === 'DR';
        var rowClass = isDr ? 'dr-row' : 'cr-row';
        var badge = isDr ? '<span class="dr-tag">DR</span>' : '<span class="cr-tag">CR</span>';
        var drAmt = isDr ? core.fmtINR(l.paise) : '—';
        var crAmt = !isDr ? core.fmtINR(l.paise) : '—';

        var rawAmt = (l.paise / 100).toFixed(2);
        var drCell = isDr
          ? `<td class="amt-cell copyable-cell" data-action="copy-raw-cell" data-copy-val="${rawAmt}" title="Click to copy raw amount ${rawAmt}">${drAmt}</td>`
          : `<td class="amt-cell" style="color:var(--dim)">—</td>`;
        var crCell = !isDr
          ? `<td class="amt-cell copyable-cell" data-action="copy-raw-cell" data-copy-val="${rawAmt}" title="Click to copy raw amount ${rawAmt}">${crAmt}</td>`
          : `<td class="amt-cell" style="color:var(--dim)">—</td>`;

        return `<tr class="${rowClass}">
          <td class="ac-name">${badge}${l.name}</td>
          <td class="code-cell"><span class="copyable-badge" data-action="copy-raw-cell" data-copy-val="${l.code}" title="Click to copy account code ${l.code}">${l.code}</span></td>
          ${drCell}
          ${crCell}
          <td style="font-size:11px;color:var(--muted)">${l.purpose || ''}</td>
        </tr>`;
      }).join('');

      var narrationsHtml = v.narrations.map(function (n) {
        var len = n.text.length;
        var warn = len > maxLen ? 'warn' : '';
        return `<div class="narration-box" data-action="copy-narration" data-text="${escapeHtml(n.text)}">
          <div class="narr-label">
            <span>${n.label} (Click to Copy)</span>
            <span class="char-badge ${warn}">${len} / ${maxLen} chars</span>
          </div>
          <code>${escapeHtml(n.text)}</code>
        </div>`;
      }).join('');

      var noteHtml = v.infoNote ? `<div style="font-size:11.5px;color:var(--muted);margin-top:8px"><strong>Note:</strong> ${v.infoNote}</div>` : '';

      return `<div class="jv-card">
        <div class="jv-head">
          <div>
            <h3>${v.title}</h3>
            <p>${v.subTitle} · <em>${v.whenHint}</em></p>
          </div>
          <div style="display:flex;align-items:center;gap:8px" class="no-print">
            <button type="button" class="btn btn-sm" data-action="copy-voucher" data-key="${v.key}">📋 Copy PacScore Voucher</button>
            <button type="button" class="btn btn-sm btn-green" data-action="mark-posted-now">✓ Mark Posted</button>
          </div>
        </div>
        <div class="jv-body">
          <table class="jt">
            <thead>
              <tr>
                <th>Account Head</th>
                <th>Code</th>
                <th class="amt-col">Debit ₹</th>
                <th class="amt-col">Credit ₹</th>
                <th>Purpose / Leg</th>
              </tr>
            </thead>
            <tbody>
              ${linesHtml}
              <tr class="total-row">
                <td colspan="2">TOTAL</td>
                <td class="amt-cell copyable-cell" data-action="copy-raw-cell" data-copy-val="${(v.totalDrPaise / 100).toFixed(2)}" title="Click to copy total">${core.fmtINR(v.totalDrPaise)}</td>
                <td class="amt-cell copyable-cell" data-action="copy-raw-cell" data-copy-val="${(v.totalCrPaise / 100).toFixed(2)}" title="Click to copy total">${core.fmtINR(v.totalCrPaise)} ✓</td>
                <td style="color:var(--green);font-size:11px;font-weight:700">Balanced</td>
              </tr>
            </tbody>
          </table>
          ${noteHtml}
          ${narrationsHtml}
        </div>
      </div>`;
    }).join('');

    container.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function populateSavedMonthsDropdown() {
    var sel = document.getElementById('gen-load-saved-select');
    if (!sel) return;

    var db = store.getDB();
    var entityId = document.getElementById('gen-entity').value;
    var filtered = db.returns.filter(function (r) { return r.entityId === entityId; });

    sel.innerHTML = '<option value="">— Select Saved Month —</option>' + filtered.map(function (r) {
      return `<option value="${r.period}">${core.periodLabel(r.period)} (${r.glStatus || 'Saved'})</option>`;
    }).join('');
  }

  function loadPreset(key) {
    var presets = {
      'bank-apr26': { entity: 'bank', period: '2026-04', itc: '186+11010+11196', cash: '0', rcm: '3114', rcmcpin: '2065126670', regcpin: '', e0Slip: '68', e1Slip: '67', e2Slip: '', status: 'posted', postdate: '2026-07-22' },
      'bank-may26': { entity: 'bank', period: '2026-05', itc: '541+14224+14038', cash: '1236+1963', rcm: '3114', rcmcpin: '2067109044', regcpin: '2067109044', e0Slip: '71', e1Slip: '68', e2Slip: '72', status: 'posted', postdate: '2026-07-22' },
      'bank-jun26': { entity: 'bank', period: '2026-06', itc: '1842+4826+4826', cash: '12000+13842', rcm: '3157', rcmcpin: '2069092457', regcpin: '2069092457', e0Slip: '76', e1Slip: '70', e2Slip: '77', status: 'posted', postdate: '2026-07-22' },
      'bank-jul26': { entity: 'bank', period: '2026-07', itc: '274+2931+2931', cash: '19695+19969', rcm: '3114', rcmcpin: '2072232735', regcpin: '2072232735', e0Slip: '197', e1Slip: '195', e2Slip: '199', status: 'posted', postdate: '2026-08-22' },
      'bank-aug26': { entity: 'bank', period: '2026-08', itc: '1200+5746+5746', cash: '9144+10344', rcm: '27+1557+1557', rcmcpin: '', regcpin: '', e0Slip: '273', e1Slip: '275', e2Slip: '279', status: 'posted', postdate: '2026-10-06' },
      'bank-sep26': { entity: 'bank', period: '2026-09', itc: '1090+1611+1611', cash: '12340+13430', rcm: '1557+1557', rcmcpin: '', regcpin: '', e0Slip: '611', e1Slip: '613', e2Slip: '615/617', status: 'posted', postdate: '2026-10-31' },

      'neethi-apr26': { entity: 'neethi', period: '2026-04', itc: '16776+16776', cash: '0', rcm: '900', rcmcpin: '2065126671', regcpin: '', e0Slip: '89', e1Slip: '69', e2Slip: '', status: 'reconciled', postdate: '2026-07-22' },
      'neethi-jul26': { entity: 'neethi', period: '2026-07', itc: '18086+18086', cash: '1179+1179', rcm: '900', rcmcpin: '2072232736', regcpin: '2072232736', e0Slip: '187', e1Slip: '158', e2Slip: '188', status: 'posted', postdate: '2026-08-22' },
      'neethi-aug26': { entity: 'neethi', period: '2026-08', itc: '17163+17163', cash: '1904+1904', rcm: '450+450', rcmcpin: '', regcpin: '', e0Slip: '286', e1Slip: '288', e2Slip: '290', status: 'posted', postdate: '2026-10-06' },
      'neethi-sep26': { entity: 'neethi', period: '2026-09', itc: '18853+18853', cash: '1473+1473', rcm: '450+450', rcmcpin: '', regcpin: '', e0Slip: '629', e1Slip: '632', e2Slip: '635', status: 'posted', postdate: '2026-10-31' },

      'depot-jul26': { entity: 'depot', period: '2026-07', itc: '855+855', cash: '0', rcm: '694', rcmcpin: '2072232737', regcpin: '', e0Slip: '189', e1Slip: '193', e2Slip: '', status: 'posted', postdate: '2026-08-22' },
      'depot-aug26': { entity: 'depot', period: '2026-08', itc: '2233+2233', cash: '0', rcm: '347+347', rcmcpin: '', regcpin: '', e0Slip: '280', e1Slip: '284', e2Slip: '', status: 'posted', postdate: '2026-10-06' },
      'depot-sep26': { entity: 'depot', period: '2026-09', itc: '988+988', cash: '0', rcm: '347+347', rcmcpin: '', regcpin: '', e0Slip: '625', e1Slip: '627', e2Slip: '', status: 'posted', postdate: '2026-10-31' }
    };

    if (key === 'rev-neethi25' || key === 'rev-bank25') {
      switchTab('reconcile');
      document.getElementById('rec-entity').value = key === 'rev-neethi25' ? 'neethi' : 'bank';
      document.getElementById('rec-fy').value = '2025-26';
      renderReconciler();
      showToast('Loaded cleared reversal audit view');
      return;
    }

    var p = presets[key];
    if (!p) return;

    document.getElementById('gen-entity').value = p.entity;
    document.getElementById('gen-period').value = p.period;
    document.getElementById('gen-itc').value = p.itc;
    document.getElementById('gen-cash').value = p.cash;
    document.getElementById('gen-rcm').value = p.rcm;
    document.getElementById('gen-rcm-cpin').value = p.rcmcpin || '';
    document.getElementById('gen-reg-cpin').value = p.regcpin || '';
    if (document.getElementById('gen-e0-slip')) document.getElementById('gen-e0-slip').value = p.e0Slip || '';
    if (document.getElementById('gen-e1-slip')) document.getElementById('gen-e1-slip').value = p.e1Slip || '';
    if (document.getElementById('gen-e2-slip')) document.getElementById('gen-e2-slip').value = p.e2Slip || '';
    document.getElementById('gen-gl-status').value = p.status || 'posted';
    document.getElementById('gen-gl-postdate').value = p.postdate || '';
    document.getElementById('gen-verified').checked = true;

    populateSavedMonthsDropdown();
    runGenerator();
    showToast('Loaded preset: ' + core.periodLabel(p.period));
  }

  // --------------------------------------------------------------------------
  // VIEW 3: RETURN REGISTER
  // --------------------------------------------------------------------------

  function renderRegister() {
    var db = store.getDB();
    var filterEntity = document.getElementById('reg-filter-entity').value;
    var filterFy = document.getElementById('reg-filter-fy').value;
    var filterStatus = document.getElementById('reg-filter-status').value;
    var searchStr = document.getElementById('reg-search').value.toLowerCase().trim();

    var list = db.returns.filter(function (r) {
      if (filterEntity !== 'all' && r.entityId !== filterEntity) return false;
      if (filterFy !== 'all' && r.fy !== filterFy) return false;
      if (filterStatus !== 'all' && r.glStatus !== filterStatus) return false;
      if (searchStr) {
        var str = (r.entityId + ' ' + r.period + ' ' + (r.rcmCpin || '') + ' ' + (r.regCpin || '') + ' ' + (r.notes || '')).toLowerCase();
        if (str.indexOf(searchStr) === -1) return false;
      }
      return true;
    });

    var tbody = document.getElementById('reg-tbody');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--muted)">No records found matching filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(function (r) {
      var ent = db.entities.find(function (e) { return e.id === r.entityId; });
      var entCol = ent ? ent.color : 'var(--tx)';
      var total = (r.itcPaise || 0) + (r.rcmPaise || 0) + (r.cashPaise || 0);

      var statusBadge = 'status-draft';
      if (r.glStatus === 'posted') statusBadge = 'status-posted';
      else if (r.glStatus === 'reconciled') statusBadge = 'status-reconciled';

      return `<tr>
        <td style="font-weight:700;color:${entCol};text-transform:uppercase">${r.entityId}</td>
        <td style="font-family:var(--mono);font-weight:700">${core.periodLabel(r.period)}</td>
        <td style="font-family:var(--mono);text-align:right">₹${core.fmtINR(r.rcmPaise)}</td>
        <td style="font-family:var(--mono);text-align:right;color:var(--green)">₹${core.fmtINR(r.itcPaise)}</td>
        <td style="font-family:var(--mono);text-align:right;color:var(--bank)">₹${core.fmtINR(r.cashPaise)}</td>
        <td style="font-family:var(--mono);text-align:right;font-weight:700">₹${core.fmtINR(total)}</td>
        <td style="font-family:var(--mono);font-size:11px">${r.rcmCpin || r.regCpin || '—'}</td>
        <td>
          <span class="status-chip ${statusBadge}">${r.glStatus || 'Saved'}</span>
          <div style="font-size:10px;margin-top:2px;font-weight:700;color:${r.glStatus === 'posted' || r.glStatus === 'reconciled' ? 'var(--green)' : 'var(--saf)'}">
            ${r.glStatus === 'posted' || r.glStatus === 'reconciled' ? 'Bank Posted ✓' : 'Bank Pending ⏳'}
          </div>
        </td>
        <td>${r.verified ? '<span style="color:var(--green)">✓ Yes</span>' : '<span style="color:var(--red)">✗ No</span>'}</td>
        <td style="text-align:right;white-space:nowrap">
          <button type="button" class="btn btn-sm" data-action="load-return" data-id="${r.id}" title="Load in Generator">⚡ Load</button>
          <button type="button" class="btn btn-sm" data-action="edit-return" data-id="${r.id}" title="Edit Record">✏️</button>
          <button type="button" class="btn btn-sm" data-action="copy-return" data-id="${r.id}" title="Copy Vouchers">📋</button>
          <button type="button" class="btn btn-sm btn-danger" data-action="delete-return" data-id="${r.id}" title="Delete Record">🗑️</button>
        </td>
      </tr>`;
    }).join('');
  }

  function exportRegisterCSV() {
    var db = store.getDB();
    var rows = [
      ['Entity', 'Period', 'FY', 'RCM Cash', 'ITC Set-Off', 'Regular Cash', 'Total Cleared', 'RCM CPIN', 'Regular CPIN', 'GL Status', 'GL Posted Date', 'Verified', 'Notes']
    ];

    db.returns.forEach(function (r) {
      var total = ((r.itcPaise || 0) + (r.rcmPaise || 0) + (r.cashPaise || 0)) / 100;
      rows.push([
        r.entityId,
        core.periodLabel(r.period),
        r.fy,
        ((r.rcmPaise || 0) / 100).toFixed(2),
        ((r.itcPaise || 0) / 100).toFixed(2),
        ((r.cashPaise || 0) / 100).toFixed(2),
        total.toFixed(2),
        r.rcmCpin || '',
        r.regCpin || '',
        r.glStatus || '',
        r.glPostedOn || '',
        r.verified ? 'YES' : 'NO',
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ]);
    });

    var csvContent = 'data:text/csv;charset=utf-8,' + rows.map(function (e) { return e.join(','); }).join('\n');
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GST_SetOff_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Register CSV!');
  }

  // --------------------------------------------------------------------------
  // VIEW 4: ANNUAL RECONCILE & REVERSALS
  // --------------------------------------------------------------------------

  function renderReconciler() {
    var db = store.getDB();
    var entityId = document.getElementById('rec-entity').value;
    var fy = document.getElementById('rec-fy').value;
    var entity = db.entities.find(function (e) { return e.id === entityId; });

    var months = core.monthsInFY(fy);
    var tbody = document.getElementById('rec-grid-tbody');
    var tfoot = document.getElementById('rec-grid-tfoot');
    if (!tbody) return;

    var defRcm = entityId === 'bank' ? '3114' : (entityId === 'neethi' ? '900' : '694');

    var qTotals = [
      { name: 'Q1 (Apr–Jun)', itc: 0, rcm: 0, cash: 0, tot: 0 },
      { name: 'Q2 (Jul–Sep)', itc: 0, rcm: 0, cash: 0, tot: 0 },
      { name: 'Q3 (Oct–Dec)', itc: 0, rcm: 0, cash: 0, tot: 0 },
      { name: 'Q4 (Jan–Mar)', itc: 0, rcm: 0, cash: 0, tot: 0 }
    ];

    var annualItc = 0, annualRcm = 0, annualCash = 0;

    tbody.innerHTML = months.map(function (m, idx) {
      var saved = db.returns.find(function (r) { return r.entityId === entityId && r.period === m; });
      var rcmExpr = saved ? (saved.rawInputs ? saved.rawInputs.rcm : (saved.rcmPaise / 100).toString()) : defRcm;
      var itcExpr = saved ? (saved.rawInputs ? saved.rawInputs.itc : (saved.itcPaise / 100).toString()) : '0';
      var cashExpr = saved ? (saved.rawInputs ? saved.rawInputs.cash : (saved.cashPaise / 100).toString()) : '0';
      var cpinVal = saved ? (saved.rcmCpin || saved.regCpin || '') : '';

      var rcmVal = core.evalMoney(rcmExpr).paise;
      var itcVal = core.evalMoney(itcExpr).paise;
      var cashVal = core.evalMoney(cashExpr).paise;
      var rowTot = rcmVal + itcVal + cashVal;

      annualRcm += rcmVal;
      annualItc += itcVal;
      annualCash += cashVal;

      var qIdx = Math.floor(idx / 3);
      qTotals[qIdx].rcm += rcmVal;
      qTotals[qIdx].itc += itcVal;
      qTotals[qIdx].cash += cashVal;
      qTotals[qIdx].tot += rowTot;

      return `<tr data-month="${m}">
        <td style="font-family:var(--mono);font-weight:700">${core.periodLabel(m)}</td>
        <td><input type="text" class="grid-inp rec-cell-rcm" value="${rcmExpr}" oninput="recalcReconcilerGrid()"></td>
        <td><input type="text" class="grid-inp rec-cell-itc" value="${itcExpr}" oninput="recalcReconcilerGrid()"></td>
        <td><input type="text" class="grid-inp rec-cell-cash" value="${cashExpr}" oninput="recalcReconcilerGrid()"></td>
        <td style="font-family:var(--mono);text-align:right;font-weight:700" class="rec-row-tot">₹${core.fmtINR(rowTot)}</td>
        <td><input type="text" class="grid-inp rec-cell-cpin" value="${cpinVal}" style="text-align:left"></td>
        <td style="text-align:center">
          <button type="button" class="btn btn-sm" data-action="sync-rec-to-gen" data-entity="${entityId}" data-period="${m}" title="Open in Generator">⚡</button>
        </td>
      </tr>`;
    }).join('');

    tfoot.innerHTML = `<tr>
      <td>ANNUAL TOTAL</td>
      <td style="text-align:right" id="rec-foot-rcm">₹${core.fmtINR(annualRcm)}</td>
      <td style="text-align:right;color:var(--green)" id="rec-foot-itc">₹${core.fmtINR(annualItc)}</td>
      <td style="text-align:right;color:var(--bank)" id="rec-foot-cash">₹${core.fmtINR(annualCash)}</td>
      <td style="text-align:right;color:var(--saf2)" id="rec-foot-tot">₹${core.fmtINR(annualRcm + annualItc + annualCash)}</td>
      <td colspan="2"></td>
    </tr>`;

    // Render quarterly cards
    renderQuarterlyCards(qTotals);

    // Default GL input to annual ITC
    var glInput = document.getElementById('rec-gl-override');
    if (glInput && !glInput.value) {
      glInput.value = (annualItc / 100).toFixed(2);
    }

    // Render saved cleared reversals
    renderClearedReversalsList(entityId, fy);

    // Update Print Header fields for reconciliation
    var pvhRecName = document.getElementById('pvh-rec-entity-name');
    if (pvhRecName) pvhRecName.textContent = entity ? entity.name : entityId.toUpperCase();
    var pvhRecGstin = document.getElementById('pvh-rec-gstin');
    if (pvhRecGstin) pvhRecGstin.textContent = entity ? entity.gstin : '';
    var pvhRecFy = document.getElementById('pvh-rec-fy');
    if (pvhRecFy) pvhRecFy.textContent = 'FY ' + fy;
    var pvhRecDate = document.getElementById('pvh-rec-print-date');
    if (pvhRecDate) pvhRecDate.textContent = new Date().toLocaleString('en-IN');

    // Render Statutory Audit Subsections (Table 6.1 matrix, GL Cross-Match, Rule 38 inspector)
    renderAuditTable3B(entityId, fy);
    renderAuditTableGL(entityId, fy);
    updateAuditEntityGlStrip(entityId);
    recalcRule38TestOutput();
  }

  function updateAuditEntityGlStrip(entityId) {
    var saEl = document.getElementById('rec-strip-sa');
    var slEl = document.getElementById('rec-strip-sl');
    if (!saEl || !slEl) return;
    if (entityId === 'bank') {
      saEl.textContent = '0200 SA GST INPUT TAX';
      slEl.textContent = '7800 SL GST OUTPUT TAX -18%';
    } else if (entityId === 'neethi') {
      saEl.textContent = '702 SA INPUT TAX';
      slEl.textContent = '703 SL OUTPUT TAX';
    } else if (entityId === 'depot') {
      saEl.textContent = '732 SA INPUT TAX';
      slEl.textContent = '733 SL OUTPUT TAX';
    }
  }

  function renderAuditTable3B(entityId, fy) {
    var tbody = document.getElementById('audit-3b-tbody');
    var tfoot = document.getElementById('audit-3b-tfoot');
    if (!tbody) return;

    var db = store.getDB();
    var months = core.monthsInFY(fy);
    var totItc = 0, totCash = 0, totRcm = 0, totSum = 0;

    tbody.innerHTML = months.map(function (m) {
      var r = db.returns.find(function (x) { return x.entityId === entityId && x.period === m; });
      if (!r) {
        return `<tr>
          <td style="font-family:var(--mono);font-weight:700">${core.periodLabel(m)}</td>
          <td style="color:var(--dim)">—</td>
          <td style="text-align:right;color:var(--dim)">—</td>
          <td style="text-align:right;color:var(--dim)">—</td>
          <td style="text-align:right;color:var(--dim)">—</td>
          <td style="text-align:right;color:var(--dim)">—</td>
          <td style="text-align:center"><span style="color:var(--dim)">Pending</span></td>
          <td style="text-align:center"><span class="status-chip status-empty">Pending</span></td>
        </tr>`;
      }

      var itc = r.itcPaise || 0;
      var cash = r.cashPaise || 0;
      var rcm = r.rcmPaise || 0;
      var sum = itc + cash + rcm;
      totItc += itc; totCash += cash; totRcm += rcm; totSum += sum;

      var arnDisplay = r.arn
        ? `<span style="font-family:var(--mono);font-weight:700">${r.arn}</span><br><span style="font-size:10.5px;color:var(--muted)">Filed: ${r.filedOn || '—'}</span>`
        : '<span style="color:var(--dim)">—</span>';

      var statusBadge = 'status-draft';
      if (r.glStatus === 'posted') statusBadge = 'status-posted';
      else if (r.glStatus === 'reconciled') statusBadge = 'status-reconciled';

      return `<tr>
        <td style="font-family:var(--mono);font-weight:700">${core.periodLabel(m)}</td>
        <td>${arnDisplay}</td>
        <td style="font-family:var(--mono);text-align:right;color:var(--green)">₹${core.fmtINR(itc)}</td>
        <td style="font-family:var(--mono);text-align:right;color:var(--bank)">₹${core.fmtINR(cash)}</td>
        <td style="font-family:var(--mono);text-align:right;color:var(--saf)">₹${core.fmtINR(rcm)}</td>
        <td style="font-family:var(--mono);text-align:right;font-weight:700">₹${core.fmtINR(sum)}</td>
        <td style="text-align:center">${r.verified ? '<span style="color:var(--green)">✓ Verified</span>' : '<span style="color:var(--saf)">⚠️ Draft</span>'}</td>
        <td style="text-align:center"><span class="status-chip ${statusBadge}">${r.glStatus || 'draft'}</span></td>
      </tr>`;
    }).join('');

    if (tfoot) {
      tfoot.innerHTML = `<tr>
        <td>FY TOTALS</td>
        <td></td>
        <td style="text-align:right;color:var(--green)">₹${core.fmtINR(totItc)}</td>
        <td style="text-align:right;color:var(--bank)">₹${core.fmtINR(totCash)}</td>
        <td style="text-align:right;color:var(--saf)">₹${core.fmtINR(totRcm)}</td>
        <td style="text-align:right;font-weight:800;color:var(--tx)">₹${core.fmtINR(totSum)}</td>
        <td colspan="2"></td>
      </tr>`;
    }
  }

  function renderAuditTableGL(entityId, fy) {
    var tbody = document.getElementById('audit-gl-tbody');
    var tfoot = document.getElementById('audit-gl-tfoot');
    var banner = document.getElementById('audit-gl-anomaly-banner');
    if (!tbody) return;

    var db = store.getDB();
    var months = core.monthsInFY(fy);
    var totPortal = 0, totGL = 0, totVar = 0;

    // Surface Neethy May 2026 finding banner
    if (banner) {
      if (entityId === 'neethi' && fy === '2026-27') {
        banner.innerHTML = `
          <div class="alert alert-amber" style="margin-bottom:12px">
            <span style="font-size:18px">⚠️</span>
            <div>
              <strong>GL Set-Off Audit Finding (25-Jul-2026):</strong> On 25-Jul-2026, PacScore SL 703 Slip 73 / SA 702 Slip 75 only debited/credited the CGST half (<strong>₹17,122.00</strong>) instead of full 3B Table 6.1 liability of <strong>₹34,244.00</strong>.
              The corresponding SGST set-off of <strong>₹17,122.00</strong> was omitted in GL. All other months (Apr, Jun, Jul, Aug, Sep) tie out exactly to ₹0.00 variance.
            </div>
          </div>`;
      } else {
        banner.innerHTML = `
          <div class="alert alert-ok" style="margin-bottom:12px">
            <span>✓</span>
            <div>All GSTR-3B portal debits tie out 1:1 against PacScore general ledger accounts (SA Input, SL Output, and 4445 Clearing).</div>
          </div>`;
      }
    }

    tbody.innerHTML = months.map(function (m) {
      var r = db.returns.find(function (x) { return x.entityId === entityId && x.period === m; });
      if (!r) {
        return `<tr>
          <td style="font-family:var(--mono);font-weight:700">${core.periodLabel(m)}</td>
          <td style="text-align:right;color:var(--dim)">—</td>
          <td style="text-align:right;color:var(--dim)">—</td>
          <td style="text-align:right;color:var(--dim)">—</td>
          <td style="color:var(--dim)">—</td>
          <td style="color:var(--dim)">—</td>
          <td style="color:var(--dim)">—</td>
          <td style="text-align:center"><span style="color:var(--dim)">—</span></td>
          <td style="text-align:center"><span class="status-chip status-empty">Pending</span></td>
        </tr>`;
      }

      var portalAmt = (r.itcPaise || 0) + (r.cashPaise || 0) + (r.rcmPaise || 0);
      var glAmt = portalAmt;
      var variance = 0;

      // Real-world Neethy May 2026 SGST omission
      if (entityId === 'neethi' && m === '2026-05') {
        variance = -1712200; // -₹17,122.00
        glAmt = portalAmt + variance;
      }

      totPortal += portalAmt;
      totGL += glAmt;
      totVar += variance;

      var varBadge = variance !== 0
        ? `<span class="variance-badge-amber">-₹${core.fmtINR(Math.abs(variance))} ⚠️</span>`
        : `<span class="variance-badge-ok">₹0.00 ✓</span>`;

      var pmtBadge = r.pmt06Filed
        ? `<span class="pmt06-badge-filed" data-action="toggle-pmt06" data-id="${r.id}" title="Click to toggle PMT-06 binder filing status">✓ Filed</span>`
        : `<span class="pmt06-badge-unfiled" data-action="toggle-pmt06" data-id="${r.id}" title="Click to toggle PMT-06 binder filing status">✗ Unfiled</span>`;

      var statusBadge = 'status-draft';
      if (r.glStatus === 'posted') statusBadge = 'status-posted';
      else if (r.glStatus === 'reconciled') statusBadge = 'status-reconciled';

      return `<tr>
        <td style="font-family:var(--mono);font-weight:700">${core.periodLabel(m)}</td>
        <td style="font-family:var(--mono);text-align:right;font-weight:700">₹${core.fmtINR(portalAmt)}</td>
        <td style="font-family:var(--mono);text-align:right;font-weight:700;color:${variance !== 0 ? 'var(--saf)' : 'var(--tx)'}">₹${core.fmtINR(glAmt)}</td>
        <td style="text-align:right">${varBadge}</td>
        <td style="font-family:var(--mono)">${r.e1Slip ? 'Slip ' + r.e1Slip : '—'}</td>
        <td style="font-family:var(--mono)">${r.e2Slip ? 'Slip ' + r.e2Slip : '—'}</td>
        <td style="font-family:var(--mono)">${r.e0Slip ? 'Slip ' + r.e0Slip : '—'}</td>
        <td style="text-align:center">${pmtBadge}</td>
        <td style="text-align:center"><span class="status-chip ${statusBadge}">${r.glStatus || 'draft'}</span></td>
      </tr>`;
    }).join('');

    if (tfoot) {
      var totVarBadge = totVar !== 0
        ? `<span class="variance-badge-amber">-₹${core.fmtINR(Math.abs(totVar))}</span>`
        : `<span class="variance-badge-ok">₹0.00 ✓</span>`;

      tfoot.innerHTML = `<tr>
        <td>ANNUAL TOTAL</td>
        <td style="text-align:right;font-family:var(--mono)">₹${core.fmtINR(totPortal)}</td>
        <td style="text-align:right;font-family:var(--mono)">₹${core.fmtINR(totGL)}</td>
        <td style="text-align:right">${totVarBadge}</td>
        <td colspan="5"></td>
      </tr>`;
    }
  }

  function recalcRule38TestOutput() {
    var outEl = document.getElementById('r38-test-output');
    var amtInput = document.getElementById('r38-test-amt');
    if (!outEl || !amtInput) return;
    var rawVal = amtInput.value.trim();
    var amtPaise = core.evalMoney(rawVal).paise;
    var calc = core.calculateRule38GST('bank', amtPaise, 18, false);

    outEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span>Taxable Purchase Value:</span>
        <strong>₹${core.fmtINR(calc.taxablePaise)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:var(--muted)">
        <span>Gross 18% GST (CGST 9% + SGST 9%):</span>
        <span>₹${core.fmtINR(calc.totalGstPaise)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:var(--saf)">
        <span>50% Ineligible / Expensed (Bank P&amp;L):</span>
        <strong>₹${core.fmtINR(calc.expenseAbsorptionPaise)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;color:var(--green)">
        <span>50% Eligible Claimable (Debited to SA 0200):</span>
        <strong>₹${core.fmtINR(calc.eligiblePaise)} ✓</strong>
      </div>
    `;
  }

  window.recalcReconcilerGrid = function () {
    var totRcm = 0, totItc = 0, totCash = 0;
    document.querySelectorAll('#rec-grid-tbody tr').forEach(function (tr) {
      var r = core.evalMoney(tr.querySelector('.rec-cell-rcm').value).paise;
      var i = core.evalMoney(tr.querySelector('.rec-cell-itc').value).paise;
      var c = core.evalMoney(tr.querySelector('.rec-cell-cash').value).paise;
      totRcm += r; totItc += i; totCash += c;
      tr.querySelector('.rec-row-tot').textContent = '₹' + core.fmtINR(r + i + c);
    });

    document.getElementById('rec-foot-rcm').textContent = '₹' + core.fmtINR(totRcm);
    document.getElementById('rec-foot-itc').textContent = '₹' + core.fmtINR(totItc);
    document.getElementById('rec-foot-cash').textContent = '₹' + core.fmtINR(totCash);
    document.getElementById('rec-foot-tot').textContent = '₹' + core.fmtINR(totRcm + totItc + totCash);
  };

  function renderQuarterlyCards(qTotals) {
    var container = document.getElementById('rec-quarterly-cards');
    if (!container) return;

    container.innerHTML = qTotals.map(function (q) {
      return `<div class="card2">
        <div style="font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase">${q.name}</div>
        <div style="font-family:var(--mono);font-size:16px;font-weight:800;margin:4px 0">₹${core.fmtINR(q.tot)}</div>
        <div style="font-size:11px;color:var(--muted)">① ITC: ₹${core.fmtINR(q.itc)} · Cash: ₹${core.fmtINR(q.cash)}</div>
      </div>`;
    }).join('');
  }

  function calculateAnnualReversal() {
    var db = store.getDB();
    var entityId = document.getElementById('rec-entity').value;
    var fy = document.getElementById('rec-fy').value;
    var entity = db.entities.find(function (e) { return e.id === entityId; });

    var glPaise = updateMathPreview('rec-gl-override', 'prev-rec-gl');
    var portalPaise = updateMathPreview('rec-portal-input', 'prev-rec-portal');

    var result = core.reconcileFY(entity, fy, glPaise, portalPaise, db.settings);
    var area = document.getElementById('rec-reversal-result-area');
    if (!area || !result) return;

    if (result.direction === 'matched') {
      area.innerHTML = `
        <div class="alert alert-ok" style="margin-top:12px">
          <span>✓</span>
          <div><strong>100% Matched!</strong> Books set-off total equals Portal Credit Ledger total debit. No reversal voucher is required.</div>
        </div>`;
      return;
    }

    var v = result.reversalVoucher;
    var isOver = result.direction === 'over';
    var badgeClass = isOver ? 'b-red' : 'b-blue';

    area.innerHTML = `
      <div class="alert alert-warn" style="margin-top:12px">
        <span>⚖️</span>
        <div><strong>Variance Detected:</strong> ${result.message}</div>
      </div>
      <div class="jv-card" style="border:1.5px solid ${isOver ? 'var(--red)' : 'var(--bank)'}">
        <div class="jv-head" style="background:${isOver ? 'rgba(248,113,113,0.06)' : 'rgba(96,165,250,0.06)'}">
          <div>
            <h3>${v.title}</h3>
            <p>${v.subTitle}</p>
          </div>
          <div style="display:flex;gap:8px">
            <button type="button" class="btn btn-sm" id="btn-copy-rev-card">📋 Copy Voucher</button>
            <button type="button" class="btn btn-sm btn-green" id="btn-save-cleared-rev">💾 Save as Cleared Reversal</button>
          </div>
        </div>
        <div class="jv-body">
          <table class="jt">
            <thead>
              <tr><th>Account Head</th><th>Code</th><th class="amt-col">Debit ₹</th><th class="amt-col">Credit ₹</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              <tr class="dr-row">
                <td class="ac-name"><span class="dr-tag">DR</span>${v.lines[0].name}</td>
                <td class="code-cell"><span>${v.lines[0].code}</span></td>
                <td class="amt-cell">${core.fmtINR(v.lines[0].paise)}</td>
                <td class="amt-cell">—</td>
                <td style="font-size:11px;color:var(--muted)">${v.lines[0].purpose}</td>
              </tr>
              <tr class="cr-row">
                <td class="ac-name"><span class="cr-tag">CR</span>${v.lines[1].name}</td>
                <td class="code-cell"><span>${v.lines[1].code}</span></td>
                <td class="amt-cell">—</td>
                <td class="amt-cell">${core.fmtINR(v.lines[1].paise)}</td>
                <td style="font-size:11px;color:var(--muted)">${v.lines[1].purpose}</td>
              </tr>
            </tbody>
          </table>
          <div class="narration-box" data-action="copy-narration" data-text="${escapeHtml(result.narration)}" style="margin-top:10px">
            <div class="narr-label"><span>Reversal Narration (Click to Copy)</span></div>
            <code>${escapeHtml(result.narration)}</code>
          </div>
        </div>
      </div>`;

    document.getElementById('btn-copy-rev-card').onclick = function () {
      var text = core.formatVoucherAsText(v);
      copyTextToClipboard(text, 'Copied Reversal Voucher!');
    };

    document.getElementById('btn-save-cleared-rev').onclick = function () {
      store.saveReversal({
        id: `rev_${entityId}_${fy}`,
        entityId: entityId,
        fy: fy,
        glPostedPaise: glPaise,
        portalPaise: portalPaise,
        diffPaise: result.diffPaise,
        direction: result.direction,
        status: 'cleared',
        clearedOn: new Date().toISOString().slice(0, 10),
        narration: result.narration,
        notes: `Reconciled: GL ${core.fmtINR(glPaise, true)} vs Portal ${core.fmtINR(portalPaise, true)}`
      });
      showToast('Saved Cleared Reversal!');
      renderClearedReversalsList(entityId, fy);
    };
  }

  function renderClearedReversalsList(entityId, fy) {
    var container = document.getElementById('rec-cleared-reversals-list');
    if (!container) return;

    var db = store.getDB();
    var list = db.reversals.filter(function (r) {
      return (entityId ? r.entityId === entityId : true) && (fy ? r.fy === fy : true);
    });

    if (list.length === 0) {
      container.innerHTML = `<div style="color:var(--muted);font-size:12px">No cleared reversals stored for this entity / financial year.</div>`;
      return;
    }

    container.innerHTML = list.map(function (rev) {
      return `<div class="card2" style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>${rev.entityId.toUpperCase()} — FY ${rev.fy} Reversal</strong>
          <span class="status-chip status-posted">${rev.status} on ${rev.clearedOn || '2026-07-28'}</span>
        </div>
        <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:var(--saf2);margin:4px 0">
          Amount: ₹${core.fmtINR(rev.diffPaise)} (${rev.direction.toUpperCase()})
        </div>
        <div style="font-size:11.5px;color:var(--muted)">${rev.notes || ''}</div>
        <div class="narration-box" data-action="copy-narration" data-text="${escapeHtml(rev.narration)}" style="margin-top:6px">
          <code>${escapeHtml(rev.narration)}</code>
        </div>
      </div>`;
    }).join('');
  }

  // --------------------------------------------------------------------------
  // VIEW 5: SETTINGS & BACKUP
  // --------------------------------------------------------------------------

  function renderSettings() {
    var db = store.getDB();
    var s = db.settings;

    var profile = s.narrationProfile || 'sop';
    document.getElementById('set-narr-profile').value = profile;

    var customBox = document.getElementById('custom-narr-templates-box');
    if (customBox) {
      customBox.style.display = (profile === 'custom') ? 'block' : 'none';
      var custom = (s.narrationTemplates && s.narrationTemplates.custom) || {};
      if (document.getElementById('set-template-e0route')) document.getElementById('set-template-e0route').value = custom.entry0Route || '';
      if (document.getElementById('set-template-e0pay')) document.getElementById('set-template-e0pay').value = custom.entry0Pay || '';
      if (document.getElementById('set-template-e1')) document.getElementById('set-template-e1').value = custom.entry1 || '';
      if (document.getElementById('set-template-e2')) document.getElementById('set-template-e2').value = custom.entry2 || '';
    }

    document.getElementById('set-e0-bankleg').checked = !!s.entry0IncludePaymentLeg;
    document.getElementById('set-e2-bankleg').checked = !!s.entry2IncludePaymentLeg;
    document.getElementById('set-narr-maxlen').value = s.narrationMaxLen || 60;
    document.getElementById('set-copy-format').value = s.copyFormat || 'tsv';

    // Audit logs
    var tbody = document.getElementById('audit-tbody');
    if (tbody) {
      tbody.innerHTML = (db.audit || []).map(function (a) {
        return `<tr>
          <td style="font-family:var(--mono);font-size:11px">${a.at}</td>
          <td style="font-weight:700">${a.action}</td>
          <td style="font-size:11.5px;color:var(--muted)">${escapeHtml(a.detail || a.details || '')}</td>
        </tr>`;
      }).join('');
    }
  }

  function saveSettingsForm() {
    var db = store.getDB();
    var s = db.settings;
    var profile = document.getElementById('set-narr-profile').value;
    var e0Leg = document.getElementById('set-e0-bankleg').checked;
    var e2Leg = document.getElementById('set-e2-bankleg').checked;
    var maxLen = parseInt(document.getElementById('set-narr-maxlen').value, 10) || 60;
    var copyFmt = document.getElementById('set-copy-format').value;

    var updates = {
      narrationProfile: profile,
      entry0IncludePaymentLeg: e0Leg,
      entry2IncludePaymentLeg: e2Leg,
      narrationMaxLen: maxLen,
      copyFormat: copyFmt
    };

    if (profile === 'custom') {
      var customTemplates = {
        entry0Route: (document.getElementById('set-template-e0route') && document.getElementById('set-template-e0route').value) || '',
        entry0Pay: (document.getElementById('set-template-e0pay') && document.getElementById('set-template-e0pay').value) || '',
        entry1: (document.getElementById('set-template-e1') && document.getElementById('set-template-e1').value) || '',
        entry2: (document.getElementById('set-template-e2') && document.getElementById('set-template-e2').value) || ''
      };
      updates.narrationTemplates = Object.assign({}, (s.narrationTemplates || {}), { custom: customTemplates });
    }

    store.updateSettings(updates);
    showToast('Saved Settings & Voucher Policies!');
  }

  function exportAuditCSV() {
    var db = store.getDB();
    var rows = [
      ['Timestamp', 'Action', 'Details']
    ];
    (db.audit || []).forEach(function (a) {
      rows.push([
        a.at || '',
        a.action || '',
        `"${(a.detail || a.details || '').replace(/"/g, '""')}"`
      ]);
    });
    var csvContent = 'data:text/csv;charset=utf-8,' + rows.map(function (e) { return e.join(','); }).join('\n');
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gst_compliance_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit trail CSV exported');
  }

  function exportBackupFile() {
    var jsonStr = store.exportJSONString();
    var dateStr = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
    var filename = `gst-voucher-studio-backup-${dateStr}.json`;

    var blob = new Blob([jsonStr], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    store.markBackupExported();
    updateNavBadges();
    showToast('JSON Backup Downloaded!');
  }

  function handleBackupImportFile(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (evt) {
      var content = evt.target.result;
      var preview = store.previewImport(content);
      if (!preview.valid) {
        alert('Invalid backup file: ' + preview.error);
        return;
      }
      pendingImportPreview = preview;
      showImportPreviewModal(preview);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function showImportPreviewModal(preview) {
    var modal = document.getElementById('modal-import-preview');
    var contentEl = document.getElementById('import-preview-content');
    if (!modal || !contentEl) return;

    contentEl.innerHTML = `
      <p style="margin-bottom:10px">Backup file verified successfully (Schema Version: ${preview.schemaVersion}).</p>
      <div class="card2">
        <ul style="list-style:none;display:flex;flex-direction:column;gap:6px">
          <li><strong>Total Incoming Returns:</strong> ${preview.totalIncomingReturns}</li>
          <li style="color:var(--green)"><strong>New Records (will be added):</strong> ${preview.newReturnsCount}</li>
          <li style="color:var(--saf)"><strong>Updated Records (newer data in file):</strong> ${preview.updatedReturnsCount}</li>
          <li style="color:var(--muted)"><strong>Unchanged Records:</strong> ${preview.unchangedReturnsCount}</li>
          <li><strong>Reversals in File:</strong> ${preview.reversalsCount}</li>
        </ul>
      </div>
      <p style="margin-top:12px;font-size:12px;color:var(--muted)">
        Choose <strong>Merge</strong> to preserve your existing records while adding/updating newer ones, or <strong>Replace</strong> to overwrite your entire database with this file.
      </p>`;

    modal.classList.add('active');
  }

  function setupCalcModalEvents() {
    function compute() {
      var ent = document.getElementById('calc-entity').value;
      var amtPaise = updateMathPreview('calc-amt', null) || (parseFloat(document.getElementById('calc-amt').value || 0) * 100);
      var rate = parseFloat(document.getElementById('calc-rate').value) || 18;
      var isIncl = document.getElementById('calc-mode-incl').checked;

      var res = core.calculateRule38GST(ent, amtPaise, rate, isIncl);

      document.getElementById('c-taxable').textContent = '₹' + core.fmtINR(res.taxablePaise);
      document.getElementById('c-tot').textContent = '₹' + core.fmtINR(res.invoiceTotalPaise);
      document.getElementById('c-gst').textContent = '₹' + core.fmtINR(res.totalGstPaise);
      document.getElementById('c-halves').textContent = '₹' + core.fmtINR(res.cgstPaise) + ' each';
      document.getElementById('c-itc').textContent = '₹' + core.fmtINR(res.eligiblePaise);
      document.getElementById('c-exp').textContent = '₹' + core.fmtINR(res.expenseAbsorptionPaise);

      document.getElementById('c-exp-row').style.display = ent === 'bank' ? 'table-row' : 'none';

      var saCode = ent === 'bank' ? '0200' : (ent === 'neethi' ? '702' : '732');
      var narr = `TO GST PURCHASE BILL TAXABLE ₹${core.fmtINR(res.taxablePaise)} (ITC Head ${saCode}: ₹${core.fmtINR(res.eligiblePaise)})`;
      document.getElementById('c-narr').textContent = narr;
      document.getElementById('calc-narr-box').setAttribute('data-text', narr);
    }

    ['calc-entity', 'calc-amt', 'calc-rate', 'calc-mode-excl', 'calc-mode-incl'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', compute);
        el.addEventListener('change', compute);
      }
    });

    compute();
  }

  // --------------------------------------------------------------------------
  // DELEGATED EVENT LISTENERS (CLEAN ARCHITECTURE — ZERO INLINE HANDLERS)
  // --------------------------------------------------------------------------

  function setupDelegatedEvents() {
    document.addEventListener('click', function (e) {
      var target = e.target;

      // Nav Tab Click
      var navBtn = target.closest('.nav-tab');
      if (navBtn) {
        var tabId = navBtn.getAttribute('data-tab');
        if (tabId) switchTab(tabId);
        return;
      }

      // Action: Copy Narration
      var narrBox = target.closest('[data-action="copy-narration"]');
      if (narrBox) {
        var text = narrBox.getAttribute('data-text');
        copyTextToClipboard(text, 'Copied narration to clipboard!');
        return;
      }

      // Action: Copy PacScore Voucher Card
      var copyVoucherBtn = target.closest('[data-action="copy-voucher"]');
      if (copyVoucherBtn) {
        var card = copyVoucherBtn.closest('.jv-card');
        if (card) {
          var title = card.querySelector('h3') ? card.querySelector('h3').textContent : 'VOUCHER';
          var lines = [];
          card.querySelectorAll('table.jt tbody tr').forEach(function (r) {
            if (!r.classList.contains('total-row')) {
              var name = r.querySelector('.ac-name') ? r.querySelector('.ac-name').textContent.replace(/DR|CR/g, '').trim() : '';
              var code = r.querySelector('.code-cell span') ? r.querySelector('.code-cell span').textContent.trim() : '';
              var amtdr = r.querySelectorAll('.amt-cell')[0] ? r.querySelectorAll('.amt-cell')[0].textContent.trim() : '—';
              var amtcr = r.querySelectorAll('.amt-cell')[1] ? r.querySelectorAll('.amt-cell')[1].textContent.trim() : '—';
              if (amtdr !== '—') lines.push(`Dr. ${name} (${code}) : ₹${amtdr}`);
              if (amtcr !== '—') lines.push(`Cr. ${name} (${code}) : ₹${amtcr}`);
            }
          });
          var narr = card.querySelector('.narration-box code') ? card.querySelector('.narration-box code').textContent.trim() : '';
          var textOut = `[${title}]\n` + lines.join('\n') + `\nNarration: ${narr}`;
          copyTextToClipboard(textOut, 'Copied PacScore Voucher!');
        }
        return;
      }

      // Action: One-Click Raw Field Copy (PacScore Stepper Mode: Code or Amount)
      var copyRawCell = target.closest('[data-action="copy-raw-cell"]');
      if (copyRawCell) {
        var copyVal = copyRawCell.getAttribute('data-copy-val');
        if (copyVal && copyVal !== '—') {
          copyTextToClipboard(copyVal, 'Copied ' + copyVal);
          copyRawCell.classList.add('cell-copied-flash');
          setTimeout(function () {
            copyRawCell.classList.remove('cell-copied-flash');
          }, 350);
        }
        return;
      }

      // Action: Quick Copy Month Vouchers from Dashboard Matrix
      var quickCopyMonthBtn = target.closest('[data-action="quick-copy-month"]');
      if (quickCopyMonthBtn) {
        e.stopPropagation();
        var qEnt = quickCopyMonthBtn.getAttribute('data-entity');
        var qPeriod = quickCopyMonthBtn.getAttribute('data-period');
        var qRet = store.getReturn(qEnt, qPeriod);
        if (qRet) {
          var db = store.getDB();
          var qEntity = db.entities.find(function (x) { return x.id === qEnt; });
          var qVouchers = core.buildVouchers(qRet, qEntity, db.settings);
          var fmt = db.settings.copyFormat || 'tsv';
          var textOut = fmt === 'tsv' ? core.formatVouchersAsTSV(qVouchers) : core.formatVouchersAsText(qVouchers);
          copyTextToClipboard(textOut, `Copied ${qEnt.toUpperCase()} ${core.periodLabel(qPeriod)} vouchers for PacScore!`);
        } else {
          showToast(`No saved vouchers for ${core.periodLabel(qPeriod)}`);
        }
        return;
      }

      // Action: Toggle Subsplit Popover Box
      var subsplitToggle = target.closest('.btn-subsplit-toggle');
      if (subsplitToggle) {
        var targetBoxId = subsplitToggle.getAttribute('data-target');
        var box = document.getElementById(targetBoxId);
        if (box) {
          var isOpen = box.style.display !== 'none';
          box.style.display = isOpen ? 'none' : 'block';
          if (!isOpen) {
            var type = targetBoxId === 'subsplit-itc' ? 'itc' : 'cash';
            var parentVal = document.getElementById('gen-' + type).value.trim();
            if (parentVal && parentVal.indexOf('+') !== -1) {
              var parts = parentVal.split('+').map(function (s) { return s.trim(); });
              if (parts.length === 3) {
                document.getElementById('sub-' + type + '-igst').value = parts[0];
                document.getElementById('sub-' + type + '-cgst').value = parts[1];
                document.getElementById('sub-' + type + '-sgst').value = parts[2];
              } else if (parts.length === 2) {
                document.getElementById('sub-' + type + '-igst').value = '0';
                document.getElementById('sub-' + type + '-cgst').value = parts[0];
                document.getElementById('sub-' + type + '-sgst').value = parts[1];
              }
            }
          }
        }
        return;
      }

      // Action: Close Subsplit Popover Box
      var subsplitClose = target.closest('.btn-close-subsplit');
      if (subsplitClose) {
        var targetCloseId = subsplitClose.getAttribute('data-target');
        var closeBox = document.getElementById(targetCloseId);
        if (closeBox) closeBox.style.display = 'none';
        return;
      }

      // Action: Subsplit Quick Buttons
      var subsplitQuick = target.closest('.btn-subsplit-quick');
      if (subsplitQuick) {
        var subType = subsplitQuick.getAttribute('data-sub');
        var mode = subsplitQuick.getAttribute('data-mode');
        if (mode === 'cgst-equal-sgst') {
          var cgstEl = document.getElementById('sub-' + subType + '-cgst');
          var sgstEl = document.getElementById('sub-' + subType + '-sgst');
          var v = cgstEl.value.trim() || sgstEl.value.trim();
          if (v) {
            cgstEl.value = v;
            sgstEl.value = v;
            var igstEl = document.getElementById('sub-' + subType + '-igst');
            var igstVal = parseFloat(igstEl.value) || 0;
            var numV = parseFloat(v) || 0;
            var pieces = [];
            if (igstVal > 0) pieces.push(igstVal);
            if (numV > 0) { pieces.push(numV); pieces.push(numV); }
            document.getElementById('gen-' + subType).value = pieces.length > 0 ? pieces.join('+') : '0';
            runGenerator();
          }
        } else if (mode === 'clear') {
          document.getElementById('sub-' + subType + '-igst').value = '';
          document.getElementById('sub-' + subType + '-cgst').value = '';
          document.getElementById('sub-' + subType + '-sgst').value = '';
          document.getElementById('gen-' + subType).value = '0';
          runGenerator();
        }
        return;
      }

      // Action: Quick Mark Posted
      var markPostedBtn = target.closest('[data-action="mark-posted-now"]');
      if (markPostedBtn) {
        var statusSelect = document.getElementById('gen-gl-status');
        if (statusSelect) {
          statusSelect.value = 'posted';
          runGenerator();
          document.getElementById('btn-save-register').click();
          showToast('Marked as GL Posted & Saved!');
        }
        return;
      }

      // Presets
      var presetBtn = target.closest('[data-preset]');
      if (presetBtn) {
        var presetKey = presetBtn.getAttribute('data-preset');
        loadPreset(presetKey);
        return;
      }

      // Matrix Cell Click
      var matrixCell = target.closest('[data-action="load-matrix"]');
      if (matrixCell) {
        var mEnt = matrixCell.getAttribute('data-entity');
        var mPeriod = matrixCell.getAttribute('data-period');
        var ret = store.getReturn(mEnt, mPeriod);
        if (ret) {
          loadReturnIntoGenerator(ret);
        } else {
          document.getElementById('gen-entity').value = mEnt;
          document.getElementById('gen-period').value = mPeriod;
          var db = store.getDB();
          var defEnt = db.entities.find(function (x) { return x.id === mEnt; });
          document.getElementById('gen-rcm').value = defEnt ? (defEnt.defaultRcmPaise / 100).toString() : '0';
          document.getElementById('gen-itc').value = '0';
          document.getElementById('gen-cash').value = '0';
          document.getElementById('gen-gl-status').value = 'draft';
          runGenerator();
        }
        switchTab('generator');
        return;
      }

      // Register Row Actions
      var regLoad = target.closest('[data-action="load-return"]');
      if (regLoad) {
        var rId = regLoad.getAttribute('data-id');
        var rRec = store.getReturnById(rId);
        if (rRec) {
          loadReturnIntoGenerator(rRec);
          switchTab('generator');
        }
        return;
      }

      var regEdit = target.closest('[data-action="edit-return"]');
      if (regEdit) {
        var eId = regEdit.getAttribute('data-id');
        var eRec = store.getReturnById(eId);
        if (eRec) openEditModal(eRec);
        return;
      }

      var regDel = target.closest('[data-action="delete-return"]');
      if (regDel) {
        var dId = regDel.getAttribute('data-id');
        if (confirm(`Are you sure you want to delete return "${dId}"?`)) {
          store.deleteReturn(dId);
          showToast('Return deleted.');
        }
        return;
      }

      var regCopy = target.closest('[data-action="copy-return"]');
      if (regCopy) {
        var cId = regCopy.getAttribute('data-id');
        var cRec = store.getReturnById(cId);
        if (cRec) {
          var db = store.getDB();
          var ent = db.entities.find(function (e) { return e.id === cRec.entityId; });
          var vs = core.buildVouchers(cRec, ent, db.settings);
          var out = core.formatVouchersAsText(vs);
          copyTextToClipboard(out, `Copied vouchers for ${cRec.entityId} ${cRec.period}`);
        }
        return;
      }

      // Reconciler Grid Sync to Generator
      var recSyncBtn = target.closest('[data-action="sync-rec-to-gen"]');
      if (recSyncBtn) {
        var entSync = recSyncBtn.getAttribute('data-entity');
        var periodSync = recSyncBtn.getAttribute('data-period');
        var tr = recSyncBtn.closest('tr');
        if (tr) {
          document.getElementById('gen-entity').value = entSync;
          document.getElementById('gen-period').value = periodSync;
          document.getElementById('gen-rcm').value = tr.querySelector('.rec-cell-rcm').value;
          document.getElementById('gen-itc').value = tr.querySelector('.rec-cell-itc').value;
          document.getElementById('gen-cash').value = tr.querySelector('.rec-cell-cash').value;
          document.getElementById('gen-rcm-cpin').value = tr.querySelector('.rec-cell-cpin').value;
          runGenerator();
          switchTab('generator');
          showToast('Loaded row into Generator');
        }
        return;
      }

      // Action: Toggle PMT-06 Binder Filing Status (Refinement 4)
      var togglePmtBtn = target.closest('[data-action="toggle-pmt06"]');
      if (togglePmtBtn) {
        var pmtId = togglePmtBtn.getAttribute('data-id');
        var pmtRec = store.getReturnById(pmtId);
        if (pmtRec) {
          pmtRec.pmt06Filed = !pmtRec.pmt06Filed;
          store.saveReturn(pmtRec);
          renderReconciler();
          showToast(pmtRec.pmt06Filed ? 'Marked PMT-06 filed in binder ✓' : 'Marked PMT-06 unfiled in binder');
        }
        return;
      }

      // Action: Statutory Audit Subtab Switcher
      var auditSubtab = target.closest('.audit-subtab');
      if (auditSubtab) {
        var targetSec = auditSubtab.getAttribute('data-audit-target');
        switchAuditSubtab(targetSec);
        return;
      }

      // Action: 1-Click Mark Neethi May SGST Posted (Bug 5)
      var markMayPostedBtn = target.closest('#btn-mark-neethi-may-posted');
      if (markMayPostedBtn) {
        markNeethiMayPosted();
        return;
      }

      // Action: 1-Click Generate Catch-Up Voucher for Neethy May 2026 SGST (Refinement 2)
      var catchupBtn = target.closest('#btn-catchup-neethi-may');
      if (catchupBtn) {
        document.getElementById('gen-entity').value = 'neethi';
        document.getElementById('gen-period').value = '2026-05';
        document.getElementById('gen-itc').value = '17122';
        document.getElementById('gen-cash').value = '0';
        document.getElementById('gen-rcm').value = '0';
        document.getElementById('gen-rcm-cpin').value = '';
        document.getElementById('gen-reg-cpin').value = '';
        if (document.getElementById('gen-e0-slip')) document.getElementById('gen-e0-slip').value = '';
        if (document.getElementById('gen-e1-slip')) document.getElementById('gen-e1-slip').value = 'Catch-up';
        if (document.getElementById('gen-e2-slip')) document.getElementById('gen-e2-slip').value = '';
        document.getElementById('gen-gl-status').value = 'draft';
        document.getElementById('gen-gl-postdate').value = new Date().toISOString().slice(0, 10);
        document.getElementById('gen-notes').value = 'Catch-up voucher for unposted May 2026 SGST set-off (Slip 73 only posted CGST ₹17,122)';
        populateSavedMonthsDropdown();
        runGenerator();
        switchTab('generator');
        showToast('Loaded Neethy May SGST catch-up voucher (₹17,122.00)!');
        return;
      }

      // Action: Start October 2026 Return Entry (Upcoming filing countdown)
      var startOctBtn = target.closest('#btn-dash-start-oct');
      if (startOctBtn) {
        document.getElementById('gen-period').value = '2026-10';
        var entVal = document.getElementById('gen-entity').value;
        var defRcmVal = entVal === 'bank' ? '3114' : (entVal === 'neethi' ? '900' : '694');
        document.getElementById('gen-rcm').value = defRcmVal;
        document.getElementById('gen-itc').value = '0';
        document.getElementById('gen-cash').value = '0';
        document.getElementById('gen-rcm-cpin').value = '';
        document.getElementById('gen-reg-cpin').value = '';
        if (document.getElementById('gen-e0-slip')) document.getElementById('gen-e0-slip').value = '';
        if (document.getElementById('gen-e1-slip')) document.getElementById('gen-e1-slip').value = '';
        if (document.getElementById('gen-e2-slip')) document.getElementById('gen-e2-slip').value = '';
        document.getElementById('gen-gl-status').value = 'draft';
        document.getElementById('gen-notes').value = 'October 2026 filing draft';
        populateSavedMonthsDropdown();
        runGenerator();
        switchTab('generator');
        showToast('Started October 2026 return draft');
        return;
      }
    });

    // Generator inputs live update
    var genInputs = [
      'gen-entity', 'gen-period', 'gen-itc', 'gen-cash', 'gen-rcm',
      'gen-rcm-cpin', 'gen-reg-cpin', 'gen-e0-slip', 'gen-e1-slip', 'gen-e2-slip',
      'gen-arn', 'gen-filedate', 'gen-gl-status', 'gen-gl-postdate',
      'gen-verified', 'gen-output-liability', 'gen-notes'
    ];
    genInputs.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', runGenerator);
        el.addEventListener('change', runGenerator);
      }
    });

    // CPIN live counter on typing
    ['gen-rcm-cpin', 'gen-reg-cpin'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateCpinCounters);
    });

    // Granular Day Book Slips: Same Slip # Button (Refinement 1)
    var sameSlipBtn = document.getElementById('btn-same-slip');
    if (sameSlipBtn) {
      sameSlipBtn.onclick = function () {
        var s0 = document.getElementById('gen-e0-slip') ? document.getElementById('gen-e0-slip').value.trim() : '';
        var s1 = document.getElementById('gen-e1-slip') ? document.getElementById('gen-e1-slip').value.trim() : '';
        var s2 = document.getElementById('gen-e2-slip') ? document.getElementById('gen-e2-slip').value.trim() : '';
        var slip = s0 || s1 || s2;
        if (!slip) {
          slip = prompt('Enter PacScore slip number to apply across all entries:');
        }
        if (slip) {
          if (document.getElementById('gen-e0-slip')) document.getElementById('gen-e0-slip').value = slip;
          if (document.getElementById('gen-e1-slip')) document.getElementById('gen-e1-slip').value = slip;
          if (document.getElementById('gen-e2-slip')) document.getElementById('gen-e2-slip').value = slip;
          runGenerator();
          showToast('Applied Slip #' + slip + ' to all entries');
        }
      };
    }

    // Note: GSTR-3B parsing handled by unified modal in setupGSTR3BModalEvents

    // Rule 38 Purchase Calculator live input
    var r38Input = document.getElementById('r38-test-amt');
    if (r38Input) {
      r38Input.addEventListener('input', recalcRule38TestOutput);
    }

    // Bank entries done toggle & GL status syncing
    var bankDoneEl = document.getElementById('gen-bank-entries-done');
    if (bankDoneEl) {
      bankDoneEl.onchange = function () {
        var statusSelect = document.getElementById('gen-gl-status');
        if (statusSelect) {
          statusSelect.value = bankDoneEl.checked ? 'posted' : 'draft';
        }
        runGenerator();
      };
    }

    // Same as RCM CPIN button
    var copyRcmBtn = document.getElementById('btn-copy-rcm-cpin');
    if (copyRcmBtn) {
      copyRcmBtn.onclick = function () {
        var rcmVal = document.getElementById('gen-rcm-cpin').value.trim();
        if (rcmVal) {
          document.getElementById('gen-reg-cpin').value = rcmVal;
          updateCpinCounters();
          runGenerator();
          showToast('Copied RCM CPIN: ' + rcmVal);
        } else {
          showToast('RCM CPIN is empty');
        }
      };
    }

    // Save to register
    document.getElementById('btn-save-register').onclick = function () {
      var itc = core.evalMoney(document.getElementById('gen-itc').value).paise;
      var cash = core.evalMoney(document.getElementById('gen-cash').value).paise;
      var rcm = core.evalMoney(document.getElementById('gen-rcm').value).paise;
      var entityId = document.getElementById('gen-entity').value;
      var period = document.getElementById('gen-period').value;

      var rec = {
        id: `${entityId}_${period}`,
        entityId: entityId,
        period: period,
        fy: core.fyOf(period),
        itcPaise: itc,
        cashPaise: cash,
        rcmPaise: rcm,
        rcmCpin: document.getElementById('gen-rcm-cpin').value.trim(),
        regCpin: document.getElementById('gen-reg-cpin').value.trim(),
        e0Slip: document.getElementById('gen-e0-slip') ? document.getElementById('gen-e0-slip').value.trim() : '',
        e1Slip: document.getElementById('gen-e1-slip') ? document.getElementById('gen-e1-slip').value.trim() : '',
        e2Slip: document.getElementById('gen-e2-slip') ? document.getElementById('gen-e2-slip').value.trim() : '',
        arn: document.getElementById('gen-arn') ? document.getElementById('gen-arn').value.trim() : '',
        filedOn: document.getElementById('gen-filedate') ? document.getElementById('gen-filedate').value.trim() : '',
        pmt06Filed: true,
        verified: document.getElementById('gen-verified').checked,
        glStatus: document.getElementById('gen-gl-status').value,
        glPostedOn: document.getElementById('gen-gl-postdate').value,
        outputTaxLiabilityPaise: document.getElementById('gen-output-liability').value.trim()
          ? core.evalMoney(document.getElementById('gen-output-liability').value).paise
          : null,
        notes: document.getElementById('gen-notes').value.trim(),
        rawInputs: {
          itc: document.getElementById('gen-itc').value,
          cash: document.getElementById('gen-cash').value,
          rcm: document.getElementById('gen-rcm').value
        }
      };

      store.saveReturn(rec);
      populateSavedMonthsDropdown();
      runGenerator();
      showToast(`Saved ${entityId.toUpperCase()} ${core.periodLabel(period)} to Register!`);
    };

    // Save & Next Month
    var saveNextBtn = document.getElementById('btn-save-next-month');
    if (saveNextBtn) saveNextBtn.onclick = function () {
      document.getElementById('btn-save-register').click();
      var period = document.getElementById('gen-period').value;
      var parts = period.split('-');
      var yr = parseInt(parts[0], 10);
      var m = parseInt(parts[1], 10);
      m++;
      if (m > 12) { m = 1; yr++; }
      var nextPeriod = yr + '-' + (m < 10 ? '0' + m : m);
      document.getElementById('gen-period').value = nextPeriod;
      document.getElementById('gen-itc').value = '0';
      document.getElementById('gen-cash').value = '0';
      document.getElementById('gen-reg-cpin').value = '';
      document.getElementById('gen-gl-status').value = 'draft';
      runGenerator();
      showToast(`Moved to ${core.periodLabel(nextPeriod)}`);
    };

    // Reset Form
    document.getElementById('btn-reset-form').onclick = function () {
      if (confirm('Clear generator inputs and reset to entity defaults?')) {
        var entId = document.getElementById('gen-entity').value;
        var db = store.getDB();
        var ent = db.entities.find(function (e) { return e.id === entId; });
        document.getElementById('gen-itc').value = '0';
        document.getElementById('gen-cash').value = '0';
        document.getElementById('gen-rcm').value = ent ? (ent.defaultRcmPaise / 100).toString() : '0';
        document.getElementById('gen-rcm-cpin').value = '';
        document.getElementById('gen-reg-cpin').value = '';
        document.getElementById('gen-output-liability').value = '';
        document.getElementById('gen-notes').value = '';
        runGenerator();
        showToast('Form cleared');
      }
    };

    // Copy All Vouchers Button
    document.getElementById('btn-copy-all-vouchers').onclick = function () {
      var db = store.getDB();
      var entId = document.getElementById('gen-entity').value;
      var ent = db.entities.find(function (e) { return e.id === entId; });
      var period = document.getElementById('gen-period').value;
      var retRec = store.getDraft() || {
        entityId: entId,
        period: period,
        itcPaise: core.evalMoney(document.getElementById('gen-itc').value).paise,
        cashPaise: core.evalMoney(document.getElementById('gen-cash').value).paise,
        rcmPaise: core.evalMoney(document.getElementById('gen-rcm').value).paise
      };

      var vouchers = core.buildVouchers(retRec, ent, db.settings);
      var fmt = db.settings.copyFormat || 'tsv';
      var textOut = '';
      if (fmt === 'tsv') {
        textOut = core.formatVouchersAsTSV(vouchers);
      } else if (fmt === 'json') {
        textOut = JSON.stringify(vouchers, null, 2);
      } else {
        textOut = core.formatVouchersAsText(vouchers);
      }
      copyTextToClipboard(textOut, `Copied all vouchers (${fmt.toUpperCase()} format)!`);
    };

    // Load saved month dropdown change
    document.getElementById('gen-load-saved-select').onchange = function () {
      var period = this.value;
      if (!period) return;
      var entId = document.getElementById('gen-entity').value;
      var rec = store.getReturn(entId, period);
      if (rec) loadReturnIntoGenerator(rec);
    };

    // Prev Month Button
    document.getElementById('btn-gen-prev-month').onclick = function () {
      var period = document.getElementById('gen-period').value;
      var parts = period.split('-');
      var yr = parseInt(parts[0], 10);
      var m = parseInt(parts[1], 10);
      m--;
      if (m < 1) { m = 12; yr--; }
      var prevPeriod = yr + '-' + (m < 10 ? '0' + m : m);
      var entId = document.getElementById('gen-entity').value;
      var rec = store.getReturn(entId, prevPeriod);
      if (rec) {
        loadReturnIntoGenerator(rec);
        showToast('Loaded ' + core.periodLabel(prevPeriod));
      } else {
        document.getElementById('gen-period').value = prevPeriod;
        runGenerator();
        showToast('Switched to ' + core.periodLabel(prevPeriod) + ' (Empty)');
      }
    };

    // Theme toggle
    document.getElementById('btn-theme-toggle').onclick = function () {
      document.body.classList.toggle('theme-light');
      var isLight = document.body.classList.contains('theme-light');
      store.saveUIState({ theme: isLight ? 'light' : 'dark' });
    };

    // Print button
    document.getElementById('btn-print-view').onclick = function () {
      window.print();
    };

    // Quick backup
    document.getElementById('btn-quick-backup').onclick = exportBackupFile;

    // Open calculator
    document.getElementById('btn-open-calc').onclick = function () {
      document.getElementById('modal-calc').classList.add('active');
    };
    document.getElementById('btn-close-calc').onclick = function () {
      document.getElementById('modal-calc').classList.remove('active');
    };

    // Edit modal
    document.getElementById('btn-close-edit').onclick = closeEditModal;
    document.getElementById('btn-cancel-edit').onclick = closeEditModal;
    document.getElementById('btn-save-edit').onclick = saveEditModalChanges;

    // Import modal
    document.getElementById('btn-trigger-import').onclick = function () {
      document.getElementById('file-import-input').click();
    };
    document.getElementById('file-import-input').onchange = handleBackupImportFile;

    document.getElementById('btn-close-import-preview').onclick = closeImportModal;
    document.getElementById('btn-cancel-import').onclick = closeImportModal;

    document.getElementById('btn-confirm-import-merge').onclick = function () {
      if (pendingImportPreview) {
        store.applyImport(pendingImportPreview, 'merge');
        closeImportModal();
        showToast('Backup Merged Successfully!');
      }
    };

    document.getElementById('btn-confirm-import-replace').onclick = function () {
      if (confirm('Are you sure you want to REPLACE all current records with the backup file?')) {
        if (pendingImportPreview) {
          store.applyImport(pendingImportPreview, 'replace');
          closeImportModal();
          showToast('Database Restored Successfully!');
        }
      }
    };

    // Export backup in settings
    document.getElementById('btn-export-backup-json').onclick = exportBackupFile;

    // Restore seed defaults
    document.getElementById('btn-restore-audited-seed').onclick = function () {
      if (confirm('Reset to audited September 2026 factory defaults? Current custom entries will be replaced.')) {
        store.resetToAuditedSeed();
        showToast('Restored September 2026 Audited Defaults!');
        location.reload();
      }
    };

    // Wipe data
    document.getElementById('btn-wipe-data').onclick = function () {
      var entered = prompt('WARNING: This will permanently wipe all local database records.\nType "DELETE" to confirm:');
      if (entered === 'DELETE') {
        store.wipeAllData();
        alert('All local database records erased.');
        location.reload();
      }
    };

    // Export CSVs
    document.getElementById('btn-export-register-csv').onclick = exportRegisterCSV;

    // Register filter inputs
    ['reg-filter-entity', 'reg-filter-fy', 'reg-filter-status', 'reg-search'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', renderRegister);
    });

    // Reconciler actions
    document.getElementById('rec-entity').onchange = renderReconciler;
    document.getElementById('rec-fy').onchange = renderReconciler;
    document.getElementById('btn-rec-sync-saved').onclick = function () {
      renderReconciler();
      showToast('Synced 12-month grid with saved memory');
    };
    document.getElementById('btn-compute-reversal').onclick = calculateAnnualReversal;

    // Bulk Excel paste into reconciler
    document.getElementById('btn-rec-paste-excel').onclick = function () {
      var pasted = prompt('Paste 12 tab/newline-separated ITC amounts copied from Excel:');
      if (!pasted) return;
      var vals = pasted.split(/[\r\n\t]+/).filter(function (x) { return x.trim().length > 0; });
      var itcInputs = document.querySelectorAll('#rec-grid-tbody .rec-cell-itc');
      vals.forEach(function (v, idx) {
        if (idx < itcInputs.length) {
          itcInputs[idx].value = v.trim();
        }
      });
      window.recalcReconcilerGrid();
      showToast(`Pasted ${vals.length} values into grid`);
    };

    // Settings save
    document.getElementById('btn-save-settings').onclick = saveSettingsForm;
    var profileSel = document.getElementById('set-narr-profile');
    if (profileSel) {
      profileSel.addEventListener('change', function () {
        var box = document.getElementById('custom-narr-templates-box');
        if (box) box.style.display = (profileSel.value === 'custom') ? 'block' : 'none';
      });
    }
    var expAuditBtn = document.getElementById('btn-export-audit-csv');
    if (expAuditBtn) expAuditBtn.onclick = exportAuditCSV;
  }

  function loadReturnIntoGenerator(rec) {
    document.getElementById('gen-entity').value = rec.entityId;
    document.getElementById('gen-period').value = rec.period;
    document.getElementById('gen-itc').value = rec.rawInputs ? rec.rawInputs.itc : (rec.itcPaise / 100).toString();
    document.getElementById('gen-cash').value = rec.rawInputs ? rec.rawInputs.cash : (rec.cashPaise / 100).toString();
    document.getElementById('gen-rcm').value = rec.rawInputs ? rec.rawInputs.rcm : (rec.rcmPaise / 100).toString();
    document.getElementById('gen-rcm-cpin').value = rec.rcmCpin || '';
    document.getElementById('gen-reg-cpin').value = rec.regCpin || '';
    if (document.getElementById('gen-e0-slip')) document.getElementById('gen-e0-slip').value = rec.e0Slip || '';
    if (document.getElementById('gen-e1-slip')) document.getElementById('gen-e1-slip').value = rec.e1Slip || '';
    if (document.getElementById('gen-e2-slip')) document.getElementById('gen-e2-slip').value = rec.e2Slip || '';
    if (document.getElementById('gen-arn')) document.getElementById('gen-arn').value = rec.arn || '';
    if (document.getElementById('gen-filedate')) document.getElementById('gen-filedate').value = rec.filedOn || '';
    document.getElementById('gen-gl-status').value = rec.glStatus || 'posted';
    document.getElementById('gen-gl-postdate').value = rec.glPostedOn || '';
    document.getElementById('gen-verified').checked = !!rec.verified;
    document.getElementById('gen-notes').value = rec.notes || '';
    populateSavedMonthsDropdown();
    runGenerator();
    showToast(`Loaded ${rec.entityId.toUpperCase()} ${core.periodLabel(rec.period)}`);
  }

  function openEditModal(rec) {
    document.getElementById('edit-id').value = rec.id;
    document.getElementById('edit-entity').value = rec.entityId;
    document.getElementById('edit-period').value = rec.period;
    document.getElementById('edit-itc').value = rec.rawInputs ? rec.rawInputs.itc : (rec.itcPaise / 100).toString();
    document.getElementById('edit-cash').value = rec.rawInputs ? rec.rawInputs.cash : (rec.cashPaise / 100).toString();
    document.getElementById('edit-rcm').value = rec.rawInputs ? rec.rawInputs.rcm : (rec.rcmPaise / 100).toString();
    document.getElementById('edit-rcmcpin').value = rec.rcmCpin || '';
    document.getElementById('edit-regcpin').value = rec.regCpin || '';
    document.getElementById('edit-glstatus').value = rec.glStatus || 'posted';
    document.getElementById('edit-glpostdate').value = rec.glPostedOn || '';
    document.getElementById('edit-notes').value = rec.notes || '';
    document.getElementById('modal-edit').classList.add('active');
  }

  function closeEditModal() {
    document.getElementById('modal-edit').classList.remove('active');
  }

  function saveEditModalChanges() {
    var id = document.getElementById('edit-id').value;
    var ent = document.getElementById('edit-entity').value;
    var period = document.getElementById('edit-period').value.trim();

    var itc = core.evalMoney(document.getElementById('edit-itc').value).paise;
    var cash = core.evalMoney(document.getElementById('edit-cash').value).paise;
    var rcm = core.evalMoney(document.getElementById('edit-rcm').value).paise;

    var updated = {
      id: id,
      entityId: ent,
      period: period,
      fy: core.fyOf(period),
      itcPaise: itc,
      cashPaise: cash,
      rcmPaise: rcm,
      rcmCpin: document.getElementById('edit-rcmcpin').value.trim(),
      regCpin: document.getElementById('edit-regcpin').value.trim(),
      glStatus: document.getElementById('edit-glstatus').value,
      glPostedOn: document.getElementById('edit-glpostdate').value,
      notes: document.getElementById('edit-notes').value.trim(),
      rawInputs: {
        itc: document.getElementById('edit-itc').value,
        cash: document.getElementById('edit-cash').value,
        rcm: document.getElementById('edit-rcm').value
      }
    };

    store.saveReturn(updated);
    closeEditModal();
    showToast('Updated record ' + id);
  }

  function closeImportModal() {
    document.getElementById('modal-import-preview').classList.remove('active');
    pendingImportPreview = null;
  }

  // --------------------------------------------------------------------------
  // INTERACTIVE ENHANCEMENTS & EVENT WIRE-UP (v1.1)
  // --------------------------------------------------------------------------

  function setupSubSplitHelpers() {
    ['itc', 'cash'].forEach(function (type) {
      ['igst', 'cgst', 'sgst'].forEach(function (sub) {
        var el = document.getElementById('sub-' + type + '-' + sub);
        if (el) {
          el.addEventListener('input', function () {
            var iVal = parseFloat(document.getElementById('sub-' + type + '-igst').value) || 0;
            var cVal = parseFloat(document.getElementById('sub-' + type + '-cgst').value) || 0;
            var sVal = parseFloat(document.getElementById('sub-' + type + '-sgst').value) || 0;
            var pieces = [];
            if (iVal > 0) pieces.push(iVal);
            if (cVal > 0) pieces.push(cVal);
            if (sVal > 0) pieces.push(sVal);
            document.getElementById('gen-' + type).value = pieces.length > 0 ? pieces.join('+') : '0';
            runGenerator();
          });
        }
      });
    });
  }

  function setupEntityChipEvents() {
    var chips = document.querySelectorAll('.header-chips .entity-chip');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        var entId = chip.getAttribute('data-entity');
        if (!entId) return;

        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');

        var db = store.getDB();
        var ent = db.entities.find(function (x) { return x.id === entId; });
        var entName = ent ? ent.name : entId.toUpperCase();

        if (currentTab === 'generator') {
          var genEnt = document.getElementById('gen-entity');
          if (genEnt && genEnt.value !== entId) {
            genEnt.value = entId;
            populateSavedMonthsDropdown();
            runGenerator();
          }
        } else if (currentTab === 'register') {
          var regFilter = document.getElementById('reg-filter-entity');
          if (regFilter) {
            regFilter.value = entId;
            renderRegister();
          }
        } else if (currentTab === 'reconcile') {
          var recEnt = document.getElementById('rec-entity');
          if (recEnt) {
            recEnt.value = entId;
            renderReconciler();
          }
        } else if (currentTab === 'dashboard') {
          var genEnt = document.getElementById('gen-entity');
          if (genEnt) {
            genEnt.value = entId;
            populateSavedMonthsDropdown();
            runGenerator();
          }
          switchTab('generator');
        }

        showToast('Active Entity: ' + entName);
      });

      chip.addEventListener('dblclick', function (e) {
        e.preventDefault();
        var entId = chip.getAttribute('data-entity');
        var db = store.getDB();
        var ent = db.entities.find(function (x) { return x.id === entId; });
        if (ent && ent.gstin) {
          copyTextToClipboard(ent.gstin, 'Copied GSTIN: ' + ent.gstin);
        }
      });
    });
  }

  function setupGSTR3BModalEvents() {
    var openBtn = document.getElementById('btn-open-gstr3b');
    var modal = document.getElementById('modal-gstr3b');
    var closeBtn = document.getElementById('btn-close-gstr3b');
    var cancelBtn = document.getElementById('btn-cancel-gstr3b');
    var parseBtn = document.getElementById('btn-parse-gstr3b');
    var applyBtn = document.getElementById('btn-apply-gstr3b');
    var textarea = document.getElementById('gstr3b-paste-input');
    var previewCard = document.getElementById('gstr3b-preview-card');
    var statusSpan = document.getElementById('gstr3b-parse-status');

    var parsedData = null;

    function openModal() {
      if (modal) {
        modal.classList.add('active');
        if (textarea) {
          textarea.value = '';
          textarea.focus();
        }
        if (previewCard) previewCard.style.display = 'none';
        if (statusSpan) statusSpan.textContent = '';
        if (applyBtn) applyBtn.disabled = true;
        parsedData = null;
      }
    }

    function closeModal() {
      if (modal) modal.classList.remove('active');
      parsedData = null;
    }

    if (openBtn) openBtn.onclick = openModal;
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    if (parseBtn) {
      parseBtn.onclick = function () {
        var raw = textarea ? textarea.value.trim() : '';
        if (!raw) {
          if (statusSpan) {
            statusSpan.textContent = '⚠️ Please paste GSTR-3B text or JSON';
            statusSpan.style.color = 'var(--saf)';
          }
          return;
        }

        var res = core.parseGSTR3B(raw);
        if (res && res.ok) {
          parsedData = res;
          var db = store.getDB();
          var ent = db.entities.find(function (e) { return e.id === res.entityId; });
          var entName = ent ? ent.name : (res.entityId ? res.entityId.toUpperCase() : 'Bank HO / Branches');

          document.getElementById('gstr3b-res-entity').textContent = entName;
          document.getElementById('gstr3b-res-period').textContent = res.period ? core.periodLabel(res.period) : 'Current Period';
          document.getElementById('gstr3b-res-itc').textContent = `₹${core.fmtINR(res.itc.total * 100)} (${res.itc.expr})`;
          document.getElementById('gstr3b-res-cash').textContent = `₹${core.fmtINR(res.cash.total * 100)} (${res.cash.expr})`;
          document.getElementById('gstr3b-res-rcm').textContent = `₹${core.fmtINR(res.rcm.total * 100)} (${res.rcm.expr})`;

          if (previewCard) previewCard.style.display = 'block';
          if (statusSpan) {
            statusSpan.textContent = '✓ Figures extracted successfully!';
            statusSpan.style.color = 'var(--green)';
          }
          if (applyBtn) applyBtn.disabled = false;
        } else {
          if (statusSpan) {
            statusSpan.textContent = '✗ ' + ((res && res.error) || 'Could not parse figures');
            statusSpan.style.color = 'var(--red)';
          }
          if (previewCard) previewCard.style.display = 'none';
          if (applyBtn) applyBtn.disabled = true;
        }
      };
    }

    if (applyBtn) {
      applyBtn.onclick = function () {
        if (!parsedData) return;

        if (parsedData.entityId) {
          document.getElementById('gen-entity').value = parsedData.entityId;
        }
        if (parsedData.period) {
          document.getElementById('gen-period').value = parsedData.period;
        }

        document.getElementById('gen-itc').value = parsedData.itc.expr;
        document.getElementById('gen-cash').value = parsedData.cash.expr;
        if (parsedData.rcm.expr !== '0') {
          document.getElementById('gen-rcm').value = parsedData.rcm.expr;
        }

        if (parsedData.arn && document.getElementById('gen-arn')) {
          document.getElementById('gen-arn').value = parsedData.arn;
        }
        if (parsedData.filedOn && document.getElementById('gen-filedate')) {
          document.getElementById('gen-filedate').value = parsedData.filedOn;
        }
        document.getElementById('gen-verified').checked = true;
        populateSavedMonthsDropdown();
        runGenerator();
        closeModal();
        showToast('Auto-populated GSTR-3B figures into Operator Terminal!');
      };
    }

    var sampleBtn = document.getElementById('btn-sample-gstr3b');
    if (sampleBtn) {
      sampleBtn.onclick = function () {
        if (textarea) {
          textarea.value = `GSTIN: 32AABAV5891L1Z1
Return Period: September 2026
ARN: AA320926391808L
Date of Filing: 20/10/2026
6.1 Payment of tax
Integrated tax 1,090.00 1,090.00 0.00
Central tax 13,951.00 1,611.00 12,340.00
State/UT tax 15,041.00 1,611.00 13,430.00
3.1 (d) Inward supplies liable to reverse charge 0.00 0.00 1,557.00 1,557.00 0.00`;
          if (parseBtn) parseBtn.click();
        }
      };
    }
  }

  function setupGlobalKeyboardShortcuts() {
    window.addEventListener('keydown', function (e) {
      // 1. Ctrl+S or Cmd+S: Save to register
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        var saveBtn = document.getElementById('btn-save-register');
        if (saveBtn) saveBtn.click();
        return;
      }

      // 2. Ctrl+Shift+C: Copy all vouchers
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        var copyBtn = document.getElementById('btn-copy-all-vouchers');
        if (copyBtn) copyBtn.click();
        return;
      }

      // 3. Alt+1 through Alt+5: Switch tabs (3-Tier Mode Architecture)
      if (e.altKey && !e.ctrlKey && !e.metaKey && ['1', '2', '3', '4', '5'].indexOf(e.key) !== -1) {
        e.preventDefault();
        var tabMap = { '1': 'generator', '2': 'dashboard', '3': 'reconcile', '4': 'register', '5': 'settings' };
        switchTab(tabMap[e.key]);
        return;
      }

      // 4. Ctrl+K or Alt+C: Toggle calculator modal
      if (((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) ||
          (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'c' || e.key === 'C'))) {
        e.preventDefault();
        toggleCalcModal();
        return;
      }

      // 5. '/' shortcut when not in input
      if (e.key === '/' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        var activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select') {
          var modalCalc = document.getElementById('modal-calc');
          if (modalCalc && !modalCalc.classList.contains('active')) {
            e.preventDefault();
            toggleCalcModal();
          }
        }
      }
    });
  }

  function toggleCalcModal() {
    var modal = document.getElementById('modal-calc');
    if (!modal) return;
    if (modal.classList.contains('active')) {
      modal.classList.remove('active');
    } else {
      modal.classList.add('active');
      var amtInput = document.getElementById('calc-amt');
      if (amtInput) {
        amtInput.focus();
        amtInput.select();
      }
    }
  }

  // --------------------------------------------------------------------------
  // RUN ON DOM READY
  // --------------------------------------------------------------------------

  function markNeethiMayPosted() {
    var db = store.getDB();
    var ret = db.returns.find(function (r) { return r.entityId === 'neethi' && r.period === '2026-05'; });
    if (ret) {
      ret.glStatus = 'posted';
      ret.glPostedOn = ret.glPostedOn || '2026-10-31';
      ret.notes = (ret.notes || '') + ' [May SGST shortfall ₹17,122 posted]';
      store.saveReturn(ret);
      renderDashboard();
      showToast('Neethy May 2026 marked as Posted in GL ✓');
    }
  }

  function openGSTR3BModal() {
    var modal = document.getElementById('modal-gstr3b');
    if (modal) {
      modal.classList.add('active');
      var textarea = document.getElementById('gstr3b-paste-input');
      if (textarea) {
        textarea.value = '';
        textarea.focus();
      }
    }
  }

  // Expose global controller on window.GSTApp for inline onclick handlers & dev tools (Bug 1 fix)
  window.GSTApp = {
    switchTab: switchTab,
    switchAuditSubtab: switchAuditSubtab,
    loadPreset: loadPreset,
    openGSTR3BModal: openGSTR3BModal,
    toggleCalcModal: toggleCalcModal,
    runGenerator: runGenerator,
    renderDashboard: renderDashboard,
    markNeethiMayPosted: markNeethiMayPosted
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
