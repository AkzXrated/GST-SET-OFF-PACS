## Part 1: Analysis of Co-operative Bank GST Recording & DITS PacScore Accounting Methods

Based on the audited SOP (`info.md`, `0_START_HERE.md`, and `GST_Accounting_Guide_FINAL.html`), Vadakkumbad Service Co-operative Bank Ltd. operates three distinct business entities under separate GSTINs, utilizing **DITS PacScore** with a **combined-head accounting architecture** (where CGST + SGST + IGST are pooled into single entity-specific Input and Output ledgers until the planned April 1, 2027 split).

### 1. Entity Structure & Ledger Mapping

| Business Unit | GSTIN | ITC Rule | Input Tax Head (SA - Asset) | Output Tax Head (SL - Liability) | Fixed Monthly Rent & RCM (18%) |
| --- | --- | --- | --- | --- | --- |
| **Bank HO / Branches** | 32AABAV5891L1Z1

 | **Rule 38 (50%)**

 | Code 0200 (SA GST INPUT TAX)

 | Code 7800 (SL GST OUTPUT TAX - 18%)

 | Rent: ₹17,300 · RCM: **₹3,114** (Eligible ITC: ₹1,557)

 |
| **Neethi Medical Store** | 32AABAV5891L2Z0

 | **100% Eligible**

 | Code 702 (SA GST INPUT TAX - NEETHI)

 | Code 703 (SL GST OUTPUT TAX - NEETHI)

 | Rent: ₹5,000 · RCM: **₹900** (Eligible ITC: ₹900)

 |
| **Fertilizer/Manure Depot** | 32AABAV5891L3ZZ

 | **100% Eligible**

 | Code 732 (SA GST INPUT TAX - MANURE)

 | Code 733 (SL GST OUTPUT TAX - MANURE)

 | Rent: ₹3,850 · RCM: **₹694** (Eligible ITC: ₹694)

 |

* **Shared Clearing Account:** Code **4445** (*GST Paid to Govt*, classified under *Adjusting Heads — Due By*). Debited when challans are paid out of the bank operating account; credited when routed to clear SL Output Tax. Must net to **₹0** every month.


* **Shared Treasury Account:** Code **711** (*Bank Account A/c*). Credited when money leaves the bank for landlord rent or GST challan payments.



---

### 2. Core Accounting Mechanics & Golden Rules

* **Upfront Rule 38 Split (Bank Only):** Under Section 17(4) / Rule 38, banking companies can only claim 50% of Input Tax Credit. Instead of booking 100% ITC and passing a month-end reversal entry, the Bank splits GST **at the moment of bill entry**. Half of the invoice GST is permanently absorbed into the Purchase/Expense head, and only the eligible 50% is debited to **SA 0200**. Thus, **SA 0200** holds 100% eligible, ready-to-use credit.


* **Full Output Tax Consolidation:** All taxable service fees (locker rent, processing charges, etc.) across HO and all branches must credit the full **18%** (CGST 9% + SGST 9%) to **SL 7800**. Exempt income (loan/FD interest) bypasses GST heads entirely.


* **The Self-Closing 4-Step RCM Loop (By the 18th):** Because landlords are unregistered, the bank pays GST under Reverse Charge Mechanism (RCM), which **must be paid in cash** (never offset via ITC):


1. *Pay Rent:* Dr Rent Expense / Cr Bank 711.


2. *Book RCM Liability & ITC:* Cr SL Output Tax (7800/703/733) for full RCM. For Bank, Dr Rent Expense (50% ineligible) and Dr SA 0200 (50% eligible). For Neethi/Depot, Dr SA 702/732 (100%).


3. *Pay RCM Cash Challan (Entry 0 - Payment Leg):* Dr 4445 / Cr Bank 711.


4. *Route RCM Challan (Entry 0 - Routing Leg):* Dr SL Output Tax (7800/703/733) / Cr 4445.




* *Result:* RCM liability in SL Output Tax and the challan deposit in 4445 both clear to ₹0 mid-month.




* **Month-End Set-Off (By the 25th from GSTR-3B PDF Table 6.1):**
* Figures are read strictly from the **downloaded GSTR-3B PDF, Table 6.1, Section (A) (Other than reverse charge)**—never from the portal summary tile (which lumps Section A and Section B cash together).


* **Entry 1 (ITC Set-Off ①):** Total of Section (A) *"Tax paid through ITC"* (IGST + CGST + SGST). Entry: `Dr SL Output Tax / Cr SA Input Tax`.


* **Entry 2 (Regular Cash Routing ②):** Total of Section (A) *"Tax paid in cash"* (passed only when Output Tax exceeds available ITC). Entry: `Dr SL Output Tax / Cr 4445` (matching `Dr 4445 / Cr 711` passed on challan payment date).




* **Monthly 3-Point Health Check:** After posting Entry 0, Entry 1, and Entry 2, **SL Output Tax = ₹0** for the month, **Code 4445 = ₹0**, and **SA Input Tax Dr Balance = Portal Electronic Credit Ledger closing balance**.



---

## Part 2: Complete Implementation Blueprint for Antigravity CLI

Copy and forward the markdown block below directly into **Antigravity CLI** to scaffold and build the standalone `Software/` web application suite with persistent memory.

```markdown
# ANTIGRAVITY CLI SPECIFICATION: DITS PacScore GST Voucher & Reconciliation Suite

## 1. Project Overview & Target Structure
Build a zero-dependency, offline-first, standalone web application in the `Software/` directory consisting of three files:
- `Software/index.html` (Application shell, navigation, views, modals)
- `Software/styles.css` (Dark-mode financial terminal UI, responsive grids, print stylesheets)
- `Software/app.js` (State engine, inline math parser, voucher generator, 12-month bulk reconciler, LocalStorage persistence, JSON import/export)

## 2. Visual & UI Design System (`styles.css`)
Replicate the exact dark-theme design tokens from `GST_Accounting_Guide_FINAL.html`:
- **Colors:**
  - `--bg: #060E1A`, `--surf: #0D1B2E`, `--card: #132238`, `--card2: #172840`
  - `--bdr: rgba(255,255,255,0.07)`, `--bdr2: rgba(255,255,255,0.12)`
  - `--tx: #E8F0FE`, `--muted: #6B89B0`, `--dim: #3D5A80`
  - `--saf: #F59E0B`, `--saf2: #FCD34D`
  - `--bank: #60A5FA` (Bank HO), `--neethi: #34D399` (Neethi Store), `--depot: #FB923C` (Manure Depot)
  - `--red: #F87171`, `--green: #4ADE80`, `--purple: #A78BFA`, `--sky: #38BDF8`
  - `--dr-bg: rgba(248,113,113,0.1)`, `--dr-border: #F87171`, `--dr-text: #FCA5A5`
  - `--cr-bg: rgba(52,211,153,0.08)`, `--cr-border: #34D399`, `--cr-text: #6EE7B7`
- **Typography:** `Inter` for UI/tables and `JetBrains Mono` for figures, account codes, GSTINs, and narrations.
- **Print Stylesheet (`@media print`):** Hide sidebar, topbar, action buttons, and presets; render clean black-on-white PacScore voucher cards and reconciliation tables for physical voucher filing.

## 3. Core Domain Constants & Accounting Rules (`app.js`)
Define a strict `ENTITIES` configuration object:
1. `bank`:
   - Title: `Bank HO / Branches`
   - GSTIN: `32AABAV5891L1Z1`
   - Prefix: `BANK`
   - SA Input Head: Code `0200`, Name `SA GST INPUT TAX (Bank)`
   - SL Output Head: Code `7800`, Name `SL GST OUTPUT TAX — 18% (Bank)`
   - Clearing Head: Code `4445`, Name `GST Paid to Govt (Clearing)`
   - Treasury Head: Code `711`, Name `Bank Account A/c`
   - Default RCM: `3114` (Rent ₹17,300 @ 18%; Rule 38 50% split at entry)
   - Badge Class: `je-bank`
2. `neethi`:
   - Title: `Neethi Medical Store`
   - GSTIN: `32AABAV5891L2Z0`
   - Prefix: `NEETHI`
   - SA Input Head: Code `702`, Name `SA GST INPUT TAX — NEETHI STORE`
   - SL Output Head: Code `703`, Name `SL GST OUTPUT TAX — NEETHI STORE`
   - Clearing Head: Code `4445`, Treasury Head: Code `711`
   - Default RCM: `900` (Rent ₹5,000 @ 18%; 100% ITC)
   - Badge Class: `je-neethi`
3. `depot`:
   - Title: `Fertilizer/Manure Depot`
   - GSTIN: `32AABAV5891L3ZZ`
   - Prefix: `MANURE`
   - SA Input Head: Code `732`, Name `SA GST INPUT TAX - MANURE`
   - SL Output Head: Code `733`, Name `SL GST OUTPUT TAX - MANURE`
   - Clearing Head: Code `4445`, Treasury Head: Code `711`
   - Default RCM: `694` (Rent ₹3,850 @ 18%; 100% ITC)
   - Badge Class: `je-depot`

## 4. Application Modules & Functional Specifications

### Module A: Safe Inline Math Evaluator (`evaluateMathExpr`)
- Every numeric input field (`#soc-itc`, `#soc-totcash`, `#soc-rcmcash`, calculator inputs, and bulk grid cells) must accept arithmetic strings like `186+11010+11196` or `12000+13842`.
- Sanitize input via `/[^0-9.\+\-\*/\(\)\s]/g`, evaluate safely, and return a float (defaulting to `0` on invalid syntax).
- Display a live resolved preview badge next to the input when an expression contains operators (e.g., `= ₹22,392.00`).

### Module B: Interactive Monthly Set-Off Voucher Generator (View 1)
- **Inputs:**
  - `soc-entity` (Select: `bank`, `neethi`, `depot` — auto-updates `soc-rcmcash` to default RCM when changed, unless loading a saved record).
  - `soc-month` (Text: e.g., `2026-APRIL`, normalized to uppercase).
  - `soc-itc` (Text/Math: ① GSTR-3B Table 6.1 Section (A) "Tax paid through ITC").
  - `soc-totcash` (Text/Math: ② GSTR-3B Table 6.1 Section (A) "Tax paid in cash").
  - `soc-rcmcash` (Text/Math: GSTR-3B Table 6.1 Section (B) RCM cash challan amount).
  - `soc-rcmcpin` (Text: RCM Challan CPIN).
  - `soc-regcpin` (Text: Regular Cash Challan CPIN).
  - `soc-glstatus` (Select: `Draft`, `Reconciled`, `Posted in GL` + optional `soc-postdate` date input).
  - `soc-notes` (Text: Optional audit/CA note).
- **Quick Presets Bar:**
  - Include 1-click preset buttons for verified filings:
    - `bank-apr26`: `{ entity:'bank', month:'2026-APRIL', itc:'186+11010+11196', cash:'0', rcm:'3114', rcmcpin:'2065126670', regcpin:'', status:'Posted 22-Jul-2026' }`
    - `bank-may26`: `{ entity:'bank', month:'2026-MAY', itc:'541+14224+14038', cash:'1236+1963', rcm:'3114', rcmcpin:'2067109044', regcpin:'2067109044', status:'Posted 22-Jul-2026' }`
    - `bank-jun26`: `{ entity:'bank', month:'2026-JUNE', itc:'1842+4826+4826', cash:'12000+13842', rcm:'3157', rcmcpin:'2069092457', regcpin:'2069092457', status:'Posted 22-Jul-2026' }`
    - `bank-jul26`: `{ entity:'bank', month:'2026-JULY', itc:'274+2931+2931', cash:'19695+19969', rcm:'3114', rcmcpin:'2072232735', regcpin:'2072232735', status:'Posted 22-Aug-2026' }`
    - `neethi-apr26`: `{ entity:'neethi', month:'2026-APRIL', itc:'16776+16776', cash:'0', rcm:'900', rcmcpin:'2065126671', regcpin:'', status:'Reconciled' }`
    - `neethi-jul26`: `{ entity:'neethi', month:'2026-JULY', itc:'18086+18086', cash:'1179+1179', rcm:'900', rcmcpin:'2072232736', regcpin:'2072232736', status:'Posted 22-Aug-2026' }`
    - `depot-jul26`: `{ entity:'depot', month:'2026-JULY', itc:'855+855', cash:'0', rcm:'694', rcmcpin:'2072232737', regcpin:'', status:'Posted 22-Aug-2026' }`
    - `rev-neethi25`: `{ entity:'neethi', month:'FY 2025-26', isReversal:true, revAmount:23673.74, revNarration:'TO REVERSAL OF EXCESS FY 2025-26 SET-OFF ADJ.' }`
    - `rev-bank25`: `{ entity:'bank', month:'FY 2025-26', isReversal:true, revAmount:2385.02, revNarration:'TO REVERSAL OF EXCESS FY 2025-26 SET-OFF ADJ.' }`
- **Dynamic Voucher Rendering (`runSetoffGenerator`):**
  - Update 4 KPI Cards: `Entry 1 (ITC Set-Off ①)`, `Entry 0 (RCM Cash)`, `Entry 2 (Regular Cash ②)`, and `Status` (plus Total Output Tax Cleared = `① + ② + RCM`).
  - **Entry 0 Card (if `rcmcash > 0`):**
    - Leg 1 (Routing): `DR ${slName} (${slCode})` / `CR GST Paid to Govt (4445)` for `rcmcash`. Narration: `${prefix}-GST-RCM-CASH-PAID-${month}${rcmCpinSuffix}`.
    - Leg 2 (Payment): `DR GST Paid to Govt (4445)` / `CR Bank Account A/c (711)` for `rcmcash`. Narration: `${prefix}-GST-RCM-CHALLAN-${month}${rcmCpinSuffix}`.
  - **Entry 1 Card (if `itc > 0`):**
    - `DR ${slName} (${slCode})` / `CR ${saName} (${saCode})` for `itc`.
    - Balanced Total row.
    - Narration: `${prefix}-GST SET OFF ${month} ADJ.`
  - **Entry 2 Card (if `regcash > 0`):**
    - `DR ${slName} (${slCode})` / `CR GST Paid to Govt (4445)` for `regcash`.
    - Note reminder that `Dr 4445 / Cr 711` was passed on challan payment date.
    - Narration: `${prefix}-GST-CASH-PAID-${month}${regCpinSuffix}`.
  - **Prior-Period Reversal Card (when `isReversal === true`):**
    - `DR ${saName} (${saCode})` / `CR ${slName} (${slCode})` for `revAmount` (`₹23,673.74` or `₹2,385.02`).
    - Narration: `TO REVERSAL OF EXCESS FY 2025-26 SET-OFF ADJ.`
- **Clipboard Actions:**
  - Clicking any `.sn-box` copies the exact narration string and triggers a toast notification.
  - Clicking `📋 Copy PacScore Voucher` on a card copies that card's formatted Dr/Cr lines and narration.
  - Clicking `📋 Copy All Vouchers for PacScore` copies all active entries (Entry 0, 1, 2) in plain-text block format.

### Module C: Persistent Memory Engine & Saved Records Manager (View 2 / Drawer)
- **LocalStorage Keys:**
  - `pacscore_gst_draft_v1`: Auto-saves current form inputs on every `oninput` event so page reloads never lose work.
  - `pacscore_gst_records_v1`: Array of saved monthly voucher records.
  - `pacscore_gst_bulk_v1`: Object storing the 6 preloaded 12-month datasets (`bank_2526`, `neethi_2526`, `depot_2526`, `bank_2627`, `neethi_2627`, `depot_2627`).
- **Record Schema:**
  ```json
  {
    "id": "bank_2026-APRIL",
    "title": "Bank HO — 2026-APRIL",
    "entity": "bank",
    "month": "2026-APRIL",
    "itcExpr": "186+11010+11196",
    "itcVal": 22392,
    "cashExpr": "0",
    "cashVal": 0,
    "rcmExpr": "3114",
    "rcmVal": 3114,
    "rcmCpin": "2065126670",
    "regCpin": "",
    "glStatus": "Posted in GL",
    "postDate": "2026-07-22",
    "notes": "Verified against GSTR-3B Table 6.1",
    "updatedAt": "2026-09-01T10:00:00Z"
  }

```

* **Preloaded Default Memory:** On first launch (if `pacscore_gst_records_v1` is empty), automatically seed all 12 audited records from `0_START_HERE.md` (April, May, June, July 2026 for Bank, Neethi, and Depot) plus the 2 cleared FY 2025-26 reversal vouchers.
* **CRUD Operations:**
* `💾 Save to Memory` button in the generator (upserts by `entity + month` or creates custom snapshot).
* **Saved History Table:** Filterable by Entity (`All`, `Bank`, `Neethi`, `Depot`), FY (`2026-27`, `2025-26`), and GL Status.
* Actions per row: `Load into Generator`, `Edit / Rename Modal` (change title, month, CPIN, GL status, notes), `Copy Voucher`, and `Delete` (with confirmation).
* **Backup & Restore:**
* `⬇️ Export JSON Backup`: Downloads `PacScore_GST_Backup_YYYY-MM-DD.json` containing both saved records and 12-month bulk tables.
* `⬆️ Import JSON Backup`: Validates and restores state from a `.json` file.
* `🔄 Reset to Audited Defaults`: Restores the factory-verified September 2026 audit state.





### Module D: Bulk 12-Month Reconciler & Annual Master Generator (View 3)

* **Dataset Selector:** Switch between `FY 2026-27` and `FY 2025-26` for `Bank (L1Z1)`, `Neethi (L2Z0)`, and `Depot (L3ZZ)`.
* **Interactive 12-Month Grid (April to March):**
* Columns: `Month`, `① ITC Set-Off (Entry 1)`, `② Regular Cash (Entry 2)`, `RCM Cash (Entry 0)`, `Total Output Tax Cleared (Auto: ①+②+RCM)`, `CPIN`, `GL Status`, `Sync Action`.
* Support **Excel/TSV Clipboard Paste**: Pasting multi-row tab-separated numbers into the grid populates cells automatically.
* Support inline math in every grid cell.
* Include a `Sync from Saved Monthly Vouchers` button that pulls matching months from `pacscore_gst_records_v1` into the 12-month grid.


* **Quarterly & Annual Summary Cards:**
* Live auto-calculated totals for **Q1 (Apr–Jun)**, **Q2 (Jul–Sep)**, **Q3 (Oct–Dec)**, **Q4 (Jan–Mar)**, and **Full Financial Year Total**.
* **10-Minute Audit Verifier Box:** Input field for `Portal Electronic Credit Ledger Total Debit (₹)` that compares against `Annual Entry ① Total` and highlights exact match (`₹0.00 variance ✓`) or excess/shortfall reversal required.
* **Annual Consolidated Master Voucher:** Generates a full-year summary voucher card for CA/audit verification.



### Module E: Interactive GST & Rule 38 Calculator Modal + Rent RCM Reference

* Include the floating `🧮 GST Calc` modal supporting Exclusive/Inclusive GST modes, inline math, 18%/12%/5% rates, automatic Rule 38 50% split for Bank (`0200` vs Expense absorption), and 1-click narration copy.

## 5. Verification & Acceptance Criteria

1. Opening `Software/index.html` directly via `file://` or a local static server must work with zero console errors and zero external JS dependencies.
2. Typing `186+11010+11196` in `① ITC` must immediately compute `₹22,392.00` and render balanced Dr/Cr rows for `SL 7800` and `SA 0200`.
3. Refreshing the browser must preserve the current form state and all saved monthly/bulk records via `localStorage`.
4. Exporting to JSON and re-importing must restore 100% of custom vouchers, statuses, and bulk reconciliation tables.

```

---

## Part 3: Standalone Single-File Web App with Memory (`Software/index.html`)

If you want to run or test the standalone app immediately before running the multi-file Antigravity CLI build, save the following self-contained HTML file as `Software/index.html`. It embeds your exact generator code, CSS design tokens, preloaded FY 2026-27 audited records[cite: 1, 3], LocalStorage persistence (auto-save draft + saved voucher history + edit modal), 12-month bulk reconciler[cite: 3], and JSON backup/restore[cite: 1, 3].

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>PacScore GST Voucher & Reconciliation Suite | Vadakkumbad Co-op Bank</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#060E1A;--surf:#0D1B2E;--card:#132238;--card2:#172840;
  --bdr:rgba(255,255,255,0.07);--bdr2:rgba(255,255,255,0.12);
  --tx:#E8F0FE;--muted:#6B89B0;--dim:#3D5A80;
  --saf:#F59E0B;--saf2:#FCD34D;
  --bank:#60A5FA;--neethi:#34D399;--depot:#FB923C;
  --red:#F87171;--green:#4ADE80;--purple:#A78BFA;--sky:#38BDF8;
  --dr-bg:rgba(248,113,113,0.1);--dr-border:#F87171;--dr-text:#FCA5A5;
  --cr-bg:rgba(52,211,153,0.08);--cr-border:#34D399;--cr-text:#6EE7B7;
  --mono:'JetBrains Mono','Consolas','Courier New',monospace;
  --sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;font-size:15px}
body{background:var(--bg);color:var(--tx);font-family:var(--sans);min-height:100vh;line-height:1.6}
.shell{display:grid;grid-template-columns:260px 1fr;min-height:100vh}
.sidebar{background:var(--surf);border-right:1px solid var(--bdr);position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column;z-index:100}
.main{overflow-x:hidden}
.sb-logo{padding:18px 16px 14px;border-bottom:1px solid var(--bdr)}
.sb-logo h1{font-size:13.5px;font-weight:800;color:var(--saf);letter-spacing:.4px}
.sb-logo p{font-size:11px;color:var(--muted);margin-top:2px}
.nb-sec{padding:12px 12px 0;flex:1}
.nb-sec p{font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin:14px 0 6px 4px;font-weight:700}
.nb-sec p:first-child{margin-top:2px}
.nb{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:8px;cursor:pointer;font-size:12.5px;font-weight:600;color:var(--muted);background:none;border:none;width:100%;text-align:left;transition:.15s;margin-bottom:3px}
.nb:hover{background:rgba(255,255,255,.04);color:var(--tx)}
.nb.active{background:rgba(245,158,11,.12);color:var(--saf);border:1px solid rgba(245,158,11,.25)}
.nb .ic{width:18px;text-align:center;font-size:14px}
.nbadge{margin-left:auto;font-size:9.5px;font-weight:800;padding:1px 7px;border-radius:20px;background:var(--green);color:#000}
.topbar{background:rgba(6,14,26,.94);backdrop-filter:blur(16px);border-bottom:1px solid var(--bdr);padding:14px 26px;position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.topbar h2{font-size:18px;font-weight:700}
.topbar .sub{font-size:11px;color:var(--muted);margin-top:2px}
.page{display:none;padding:22px 26px;max-width:1200px}
.page.active{display:block;animation:fadeIn .2s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.card{background:var(--card);border:1px solid var(--bdr);border-radius:13px;padding:18px}
.card2{background:var(--card2);border:1px solid var(--bdr2);border-radius:11px;padding:14px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.gap{margin-bottom:20px}
.sh{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:11px;display:flex;align-items:center;gap:8px}
.sh::after{content:'';flex:1;height:1px;background:var(--bdr)}
.alert{border-radius:10px;padding:12px 15px;display:flex;gap:11px;font-size:13px;margin-bottom:14px;align-items:flex-start}
.alert .ai{font-size:17px;flex-shrink:0;margin-top:1px}
.a-ok{background:rgba(74,222,128,.09);border:1px solid rgba(74,222,128,.22);color:#86EFAC}
.a-info{background:rgba(56,189,248,.09);border:1px solid rgba(56,189,248,.22);color:#BAE6FD}
.a-warn{background:rgba(245,158,11,.09);border:1px solid rgba(245,158,11,.22);color:#FDE68A}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:20px}
.kpi{background:var(--card);border:1px solid var(--bdr);border-radius:11px;padding:13px 16px}
.kpi-l{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;font-weight:700}
.kpi-v{font-size:19px;font-weight:800;font-family:var(--mono);margin:4px 0;line-height:1.1}
.kpi-s{font-size:11px;color:var(--muted)}
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700}
.b-blue{background:rgba(96,165,250,.12);color:var(--bank)}
.b-green{background:rgba(74,222,128,.12);color:var(--green)}
.b-yellow{background:rgba(245,158,11,.12);color:var(--saf)}
.b-red{background:rgba(248,113,113,.12);color:var(--red)}
.field{margin-bottom:12px}
.field label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;font-weight:700;margin-bottom:5px}
.field input,.field select{width:100%;background:rgba(255,255,255,.06);border:1px solid var(--bdr2);border-radius:7px;padding:9px 12px;color:var(--tx);font-family:var(--mono);font-size:13.5px;font-weight:600;outline:none;transition:.2s}
.field input:focus,.field select:focus{border-color:var(--saf);box-shadow:0 0 0 2px rgba(245,158,11,.18)}
.field select{font-family:var(--sans)}
.field select option{background:var(--surf)}
.math-preview{color:var(--saf2);font-family:var(--mono);font-size:10.5px;font-weight:700}
.tab{padding:5px 12px;border-radius:6px;cursor:pointer;font-size:11.5px;font-weight:600;color:var(--muted);border:1px solid transparent;background:none;transition:.15s}
.tab:hover{color:var(--tx)}
.btn-act{background:rgba(255,255,255,0.08);border:1px solid var(--bdr2);color:var(--tx);padding:6px 12px;border-radius:7px;font-size:11.5px;font-weight:700;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:5px}
.btn-act:hover{border-color:var(--saf);color:var(--saf2);background:rgba(245,158,11,0.1)}
.jv-card{background:var(--card);border:1px solid var(--bdr);border-radius:14px;overflow:hidden;margin-bottom:16px}
.jv-head{padding:13px 17px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-bottom:1px solid var(--bdr);flex-wrap:wrap}
.jv-head h4{font-size:14px;font-weight:700;margin-bottom:2px}
.jv-head p{font-size:12px;color:var(--muted)}
.jv-body{padding:14px 17px}
.etag2{padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;flex-shrink:0;white-space:nowrap}
.je-bank{background:rgba(96,165,250,.1);color:var(--bank);border:1px solid rgba(96,165,250,.2)}
.je-neethi{background:rgba(52,211,153,.1);color:var(--neethi);border:1px solid rgba(52,211,153,.2)}
.je-depot{background:rgba(251,146,60,.1);color:var(--depot);border:1px solid rgba(251,146,60,.2)}
.je-all{background:rgba(245,158,11,.1);color:var(--saf);border:1px solid rgba(245,158,11,.2)}
table.jt{width:100%;border-collapse:collapse}
table.jt th{padding:8px 12px;background:rgba(0,0,0,.3);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);text-align:left}
table.jt th.amt-h{text-align:right;min-width:90px}
table.jt tr.dr-row{background:var(--dr-bg);border-left:3px solid var(--dr-border)}
table.jt tr.cr-row{background:var(--cr-bg);border-left:3px solid var(--cr-border)}
table.jt tr.total-row{background:rgba(0,0,0,.25);border-top:1px solid var(--bdr2)}
table.jt td{padding:8px 12px;font-size:12px;vertical-align:middle}
table.jt td.ac-name{font-weight:600}
table.jt tr.dr-row td.ac-name{color:var(--dr-text)}
table.jt tr.cr-row td.ac-name{color:var(--cr-text);padding-left:26px}
table.jt td.code-td span{font-family:var(--mono);font-size:10px;color:var(--saf2);background:rgba(245,158,11,.08);padding:2px 6px;border-radius:4px;white-space:nowrap}
table.jt td.amt{font-family:var(--mono);font-size:13px;font-weight:700;text-align:right;white-space:nowrap}
table.jt tr.dr-row td.amt{color:var(--dr-text)}
table.jt tr.cr-row td.amt{color:var(--cr-text)}
table.jt tr.total-row td{font-weight:700;color:var(--tx);font-size:12px}
table.jt tr.total-row td.amt{color:var(--green)}
table.jt td.empty-amt{color:var(--dim);text-align:right;font-size:11px}
table.jt td.note-td{font-size:11px;color:var(--muted)}
.dr-badge{background:rgba(248,113,113,.22);color:#FCA5A5;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;margin-right:5px;font-family:var(--mono)}
.cr-badge{background:rgba(52,211,153,.2);color:#6EE7B7;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;margin-right:5px;font-family:var(--mono)}
.sn-box{margin-top:8px;padding:8px 12px;background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.25);border-radius:7px;font-size:11.5px;color:var(--tx);position:relative;cursor:pointer;transition:all .2s ease}
.sn-box:hover{border-color:var(--saf);background:rgba(245,158,11,0.1)}
.sn-box .sn-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:var(--green);margin-bottom:3px}
.sn-box code{font-family:var(--mono);font-size:12px;font-weight:700;color:var(--saf2);background:rgba(0,0,0,0.3);padding:2px 7px;border-radius:4px;display:inline-block}
.sn-box::after{content:'📋 Copy';position:absolute;right:10px;top:8px;font-size:10px;font-weight:700;color:var(--muted)}
.dt{width:100%;border-collapse:collapse;font-size:12.5px}
.dt th{background:rgba(255,255,255,.05);padding:9px 11px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--muted)}
.dt td{padding:8px 11px;border-bottom:1px solid rgba(255,255,255,.05);vertical-align:middle}
.dt tr:hover td{background:rgba(255,255,255,.02)}
.dt input.grid-inp{background:rgba(0,0,0,.35);border:1px solid var(--bdr2);border-radius:5px;padding:5px 8px;color:var(--tx);font-family:var(--mono);font-size:12px;width:100%;text-align:right}
.dt input.grid-inp:focus{border-color:var(--saf);outline:none}
.mono{font-family:var(--mono);font-size:12px}
.toast{position:fixed;bottom:24px;right:24px;background:#10B981;color:#000;font-weight:800;font-size:12.5px;padding:9px 18px;border-radius:30px;box-shadow:0 10px 30px rgba(16,185,129,0.4);z-index:9999;display:none;align-items:center;gap:8px}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);z-index:9000;display:none;align-items:center;justify-content:center;padding:16px}
.modal-overlay.active{display:flex}
.modal-card{background:var(--surf);border:1px solid var(--bdr2);border-radius:16px;width:100%;max-width:520px;padding:22px;box-shadow:0 20px 50px rgba(0,0,0,0.6)}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--bdr);padding-bottom:12px}
.modal-head h3{font-size:16px;font-weight:700;color:var(--saf)}
.modal-close{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer}
@media print{
  body{background:#fff;color:#000}
  .sidebar,.topbar,.no-print{display:none!important}
  .shell{display:block}
  .page{display:none!important;padding:0}
  .page.active{display:block!important}
  .card,.jv-card{border:1px solid #ccc;background:#fff;color:#000}
}
@media(max-width:800px){
  .shell{grid-template-columns:1fr}
  .sidebar{height:auto;position:relative}
  .kpis,.grid2,.grid3,.grid4{grid-template-columns:1fr}
}
</style>
</head>
<body>

<div class="shell">
  <aside class="sidebar">
    <div class="sb-logo">
      <h1>PacScore GST Suite</h1>
      <p>Vadakkumbad Service Co-op Bank</p>
    </div>
    <div class="nb-sec">
      <p>Core Workspace</p>
      <button class="nb active" onclick="switchView('generator',this)">
        <span class="ic">⚡</span>Set-Off Generator <span class="nbadge">LIVE</span>
      </button>
      <button class="nb" onclick="switchView('memory',this)">
        <span class="ic">💾</span>Saved History <span class="nbadge" id="nav-mem-count">0</span>
      </button>
      <button class="nb" onclick="switchView('reconciler',this)">
        <span class="ic">📊</span>12-Month Reconciler
      </button>
      <p>Utilities &amp; Backup</p>
      <button class="nb" onclick="toggleCalcModal()">
        <span class="ic">🧮</span>Rule 38 &amp; GST Calc
      </button>
      <button class="nb" onclick="exportBackupJSON()">
        <span class="ic">⬇️</span>Export JSON Backup
      </button>
      <button class="nb" onclick="document.getElementById('import-file').click()">
        <span class="ic">⬆️</span>Import JSON Backup
      </button>
      <input type="file" id="import-file" accept=".json" style="display:none" onchange="importBackupJSON(event)">
      <button class="nb" onclick="resetToAuditedDefaults()" style="margin-top:12px;color:var(--red)">
        <span class="ic">🔄</span>Reset Audited Defaults
      </button>
    </div>
  </aside>

  <div class="main">
    <div class="topbar">
      <div>
        <h2 id="view-title">Interactive Monthly Set-Off Voucher Generator</h2>
        <div class="sub">3 GSTINs · Persistent LocalStorage Memory · Inline Math · PacScore Format</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center" class="no-print">
        <span class="badge b-green" id="autosave-indicator">✓ Memory Synced</span>
        <button class="btn-act" onclick="toggleCalcModal()">🧮 GST Calc</button>
        <button class="btn-act" onclick="window.print()">🖨️ Print Vouchers</button>
      </div>
    </div>

    <!-- ═══ VIEW 1: INTERACTIVE SET-OFF GENERATOR ═══ -->
    <div class="page active" id="view-generator">
      <div class="alert a-ok gap no-print">
        <span class="ai">⚡</span>
        <div><strong>Interactive Monthly Set-Off Voucher Generator with Memory.</strong> Input three figures from the downloaded GSTR-3B PDF, Table 6.1 — ① Section (A) ITC total, ② Section (A) cash total, and Section (B)’s RCM challan amount. Your draft auto-saves automatically, and you can save monthly snapshots to your local ledger database.</div>
      </div>

      <div class="card gap no-print">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <div class="sh" style="margin-bottom:0">1 · Select Business Unit &amp; Enter Portal Return Figures</div>
          <span class="badge b-blue" style="font-size:11px">💡 Inline Math Enabled (e.g. 186+11010+11196)</span>
        </div>

        <!-- Quick Presets -->
        <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:14px;background:rgba(0,0,0,0.25);padding:8px 12px;border-radius:8px;border:1px solid var(--bdr)">
          <span style="font-size:10.5px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">⚡ Audited Presets:</span>
          <button type="button" class="tab" style="background:rgba(96,165,250,0.12);color:var(--bank);border-color:rgba(96,165,250,0.25)" onclick="loadGuidePreset('bank-apr26')">Bank Apr 26</button>
          <button type="button" class="tab" style="background:rgba(96,165,250,0.12);color:var(--bank);border-color:rgba(96,165,250,0.25)" onclick="loadGuidePreset('bank-may26')">Bank May 26</button>
          <button type="button" class="tab" style="background:rgba(96,165,250,0.12);color:var(--bank);border-color:rgba(96,165,250,0.25)" onclick="loadGuidePreset('bank-jun26')">Bank Jun 26</button>
          <button type="button" class="tab" style="background:rgba(96,165,250,0.12);color:var(--bank);border-color:rgba(96,165,250,0.25)" onclick="loadGuidePreset('bank-jul26')">Bank Jul 26</button>
          <button type="button" class="tab" style="background:rgba(52,211,153,0.12);color:var(--neethi);border-color:rgba(52,211,153,0.25)" onclick="loadGuidePreset('neethi-apr26')">Neethi Apr 26</button>
          <button type="button" class="tab" style="background:rgba(52,211,153,0.12);color:var(--neethi);border-color:rgba(52,211,153,0.25)" onclick="loadGuidePreset('neethi-jul26')">Neethi Jul 26</button>
          <button type="button" class="tab" style="background:rgba(251,146,60,0.12);color:var(--depot);border-color:rgba(251,146,60,0.25)" onclick="loadGuidePreset('depot-jul26')">Depot Jul 26</button>
          <button type="button" class="tab" style="background:rgba(248,113,113,0.12);color:var(--red);border-color:rgba(248,113,113,0.25)" onclick="loadGuidePreset('rev-neethi25')">Neethi Reversal (₹23.6k)</button>
          <button type="button" class="tab" style="background:rgba(248,113,113,0.12);color:var(--red);border-color:rgba(248,113,113,0.25)" onclick="loadGuidePreset('rev-bank25')">Bank Reversal (₹2.3k)</button>
        </div>

        <div class="grid3" style="margin-bottom:12px">
          <div class="field">
            <label>Business Entity / GSTIN</label>
            <select id="soc-entity" onchange="onEntityChange()">
              <option value="bank">Bank HO / Branches (32AABAV5891L1Z1)</option>
              <option value="neethi">Neethi Medical Store (32AABAV5891L2Z0)</option>
              <option value="depot">Fertilizer/Manure Depot (32AABAV5891L3ZZ)</option>
            </select>
          </div>
          <div class="field">
            <label>Tax Period (Month &amp; Year)</label>
            <input type="text" id="soc-month" value="2026-APRIL" oninput="runSetoffGenerator()">
          </div>
          <div class="field">
            <label><span>① PDF Sec (A) — ITC Total (₹)</span><span class="math-preview" id="prev-itc"></span></label>
            <input type="text" id="soc-itc" class="calc-input" value="186+11010+11196" oninput="runSetoffGenerator()" placeholder="e.g. 186+11010+11196">
          </div>
        </div>

        <div class="grid3">
          <div class="field">
            <label><span>② PDF Sec (A) — Cash Total (₹)</span><span class="math-preview" id="prev-cash"></span></label>
            <input type="text" id="soc-totcash" class="calc-input" value="0" oninput="runSetoffGenerator()" placeholder="e.g. 12000+13842">
          </div>
          <div class="field">
            <label><span>PDF Sec (B) — RCM Cash Challan (₹)</span><span class="math-preview" id="prev-rcm"></span></label>
            <input type="text" id="soc-rcmcash" class="calc-input" value="3114" oninput="runSetoffGenerator()" placeholder="e.g. 1557+1557">
          </div>
          <div class="field">
            <label>RCM Challan CPIN</label>
            <input type="text" id="soc-rcmcpin" value="2065126670" oninput="runSetoffGenerator()">
          </div>
        </div>

        <div class="grid3" style="margin-top:4px">
          <div class="field">
            <label>Regular Cash Challan CPIN (Entry 2)</label>
            <input type="text" id="soc-regcpin" value="" oninput="runSetoffGenerator()" placeholder="Optional if cash paid">
          </div>
          <div class="field">
            <label>GL Posting Status / Date</label>
            <input type="text" id="soc-glstatus" value="Posted 22-Jul-2026" oninput="runSetoffGenerator()" placeholder="e.g. Posted 22-Aug-2026">
          </div>
          <div style="display:flex;align-items:flex-end;padding-bottom:12px;gap:8px">
            <button type="button" onclick="saveCurrentVoucherToMemory()" style="background:var(--green);color:#000;border:none;padding:10px 14px;border-radius:8px;font-weight:800;cursor:pointer;font-size:12px;flex:1">💾 Save to Memory</button>
            <button type="button" onclick="copyAllSetoffText()" style="background:var(--saf);color:#000;border:none;padding:10px 14px;border-radius:8px;font-weight:800;cursor:pointer;font-size:12px;flex:1">📋 Copy All</button>
          </div>
        </div>
      </div>

      <!-- Summary KPIs -->
      <div class="kpis gap">
        <div class="kpi"><div class="kpi-l">Entry 1 (ITC Set-Off ①)</div><div class="kpi-v" id="kpi-soc-1" style="color:var(--green)">₹22,392.00</div><div class="kpi-s">Paid through Credit</div></div>
        <div class="kpi"><div class="kpi-l">Entry 0 (RCM Cash)</div><div class="kpi-v" id="kpi-soc-rcm" style="color:var(--saf)">₹3,114.00</div><div class="kpi-s">Paid by Challan mid-month</div></div>
        <div class="kpi"><div class="kpi-l">Entry 2 (Regular Cash ②)</div><div class="kpi-v" id="kpi-soc-2" style="color:var(--bank)">₹0.00</div><div class="kpi-s">PDF Section (A) cash</div></div>
        <div class="kpi"><div class="kpi-l">Status &amp; Total Output</div><div class="kpi-v" style="color:var(--purple);font-size:15px;margin-top:6px" id="kpi-soc-status">Ready to Post</div><div class="kpi-s" id="kpi-soc-tot">Total Liability: ₹25,506.00</div></div>
      </div>

      <div class="sh" style="margin-bottom:14px">2 · Generated Journal Vouchers (PacScore Format)</div>
      <div id="soc-vouchers-container"></div>
    </div>

    <!-- ═══ VIEW 2: SAVED VOUCHER MEMORY ═══ -->
    <div class="page" id="view-memory">
      <div class="alert a-info gap">
        <span class="ai">💾</span>
        <div><strong>Local Voucher Memory Database.</strong> Every saved monthly calculation and prior-period reversal is stored in your browser's persistent `localStorage`. Click <b>Load</b> to inspect or print any month's PacScore vouchers, or <b>Edit</b> to update GL posting dates and CPINs.</div>
      </div>

      <div class="card gap">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn-act" onclick="renderMemoryTable('all')">All Entities</button>
            <button class="btn-act" style="color:var(--bank)" onclick="renderMemoryTable('bank')">🏦 Bank HO</button>
            <button class="btn-act" style="color:var(--neethi)" onclick="renderMemoryTable('neethi')">💊 Neethi Store</button>
            <button class="btn-act" style="color:var(--depot)" onclick="renderMemoryTable('depot')">🌿 Manure Depot</button>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn-act" onclick="exportBackupJSON()">⬇️ Export JSON</button>
          </div>
        </div>

        <div style="overflow-x:auto">
          <table class="dt">
            <thead>
              <tr>
                <th>Entity</th>
                <th>Tax Period</th>
                <th style="text-align:right">Entry 0 (RCM)</th>
                <th style="text-align:right">Entry 1 (ITC ①)</th>
                <th style="text-align:right">Entry 2 (Cash ②)</th>
                <th>CPIN</th>
                <th>GL Status</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody id="memory-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══ VIEW 3: 12-MONTH BULK RECONCILER ═══ -->
    <div class="page" id="view-reconciler">
      <div class="alert a-warn gap">
        <span class="ai">📊</span>
        <div><strong>12-Month Bulk Reconciler &amp; 10-Minute Credit Ledger Verifier.</strong> Select an entity below, type or paste figures (inline math supported), or sync directly from your Saved Memory. Compare the Annual Entry ① Total against your GST Portal Electronic Credit Ledger debit sum.</div>
      </div>

      <div class="card gap">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <select id="bulk-entity" onchange="renderBulkReconciler()" style="background:var(--card2);color:var(--tx);border:1px solid var(--bdr2);padding:8px 12px;border-radius:7px;font-weight:700">
              <option value="bank">🏦 Bank HO (32AABAV5891L1Z1) — FY 2026-27</option>
              <option value="neethi">💊 Neethi Store (32AABAV5891L2Z0) — FY 2026-27</option>
              <option value="depot">🌿 Manure Depot (32AABAV5891L3ZZ) — FY 2026-27</option>
            </select>
            <button class="btn-act" onclick="syncSavedToBulk()">🔄 Pull from Saved History</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--muted);font-weight:700">Portal Credit Ledger Total Debit (₹):</span>
            <input type="text" id="bulk-portal-credit" class="calc-input" placeholder="Verify Entry ① Sum" oninput="recalcBulkTotals()" style="background:rgba(0,0,0,.3);border:1px solid var(--bdr2);border-radius:6px;padding:6px 10px;color:var(--saf2);font-family:var(--mono);width:150px">
          </div>
        </div>

        <div class="kpis" style="margin-bottom:14px">
          <div class="kpi"><div class="kpi-l">Annual RCM (Entry 0)</div><div class="kpi-v" id="bk-tot-rcm" style="color:var(--saf)">₹0.00</div><div class="kpi-s">Dr SL O/P · Cr 4445</div></div>
          <div class="kpi"><div class="kpi-l">Annual ITC Set-Off (①)</div><div class="kpi-v" id="bk-tot-itc" style="color:var(--green)">₹0.00</div><div class="kpi-s">Dr SL O/P · Cr SA I/P</div></div>
          <div class="kpi"><div class="kpi-l">Annual Regular Cash (②)</div><div class="kpi-v" id="bk-tot-cash" style="color:var(--bank)">₹0.00</div><div class="kpi-s">Dr SL O/P · Cr 4445</div></div>
          <div class="kpi"><div class="kpi-l">Credit Ledger Variance</div><div class="kpi-v" id="bk-variance" style="color:var(--purple);font-size:16px">Enter Portal Sum</div><div class="kpi-s" id="bk-var-sub">10-Minute Audit Check</div></div>
        </div>

        <div style="overflow-x:auto">
          <table class="dt">
            <thead>
              <tr>
                <th>Month (FY 26-27)</th>
                <th style="text-align:right">Entry 0: RCM Cash (₹)</th>
                <th style="text-align:right">Entry 1: ITC Set-Off ① (₹)</th>
                <th style="text-align:right">Entry 2: Reg Cash ② (₹)</th>
                <th style="text-align:right">Total Output Cleared</th>
                <th>CPIN</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody id="bulk-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Edit Record Modal -->
<div id="edit-modal" class="modal-overlay" onclick="if(event.target===this)closeEditModal()">
  <div class="modal-card">
    <div class="modal-head">
      <h3>✏️ Edit Saved Voucher Record</h3>
      <button class="modal-close" onclick="closeEditModal()">✕</button>
    </div>
    <input type="hidden" id="edit-id">
    <div class="field">
      <label>Tax Period (Month &amp; Year)</label>
      <input type="text" id="edit-month">
    </div>
    <div class="grid2">
      <div class="field">
        <label>① ITC Total Expression</label>
        <input type="text" id="edit-itc">
      </div>
      <div class="field">
        <label>② Cash Total Expression</label>
        <input type="text" id="edit-cash">
      </div>
    </div>
    <div class="grid2">
      <div class="field">
        <label>RCM Cash Expression</label>
        <input type="text" id="edit-rcm">
      </div>
      <div class="field">
        <label>Challan CPIN</label>
        <input type="text" id="edit-cpin">
      </div>
    </div>
    <div class="field">
      <label>GL Posting Status</label>
      <input type="text" id="edit-status">
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
      <button class="btn-act" onclick="closeEditModal()">Cancel</button>
      <button class="btn-act" style="background:var(--saf);color:#000;border:none" onclick="saveEditedRecord()">Save Changes</button>
    </div>
  </div>
</div>

<!-- Rule 38 & GST Calculator Modal -->
<div id="calc-modal" class="modal-overlay" onclick="if(event.target===this)toggleCalcModal()">
  <div class="modal-card">
    <div class="modal-head">
      <h3>🧮 Interactive GST &amp; Rule 38 Calculator</h3>
      <button class="modal-close" onclick="toggleCalcModal()">✕</button>
    </div>
    <div class="field">
      <label>Business Unit</label>
      <select id="calc-entity" onchange="computeGST()">
        <option value="bank">Bank HO / Branches (50% Rule 38)</option>
        <option value="neethi">Neethi Medical Store (100% ITC)</option>
        <option value="depot">Fertilizer/Manure Depot (100% ITC)</option>
      </select>
    </div>
    <div style="display:flex;gap:14px;margin-bottom:12px;font-size:12px;background:rgba(0,0,0,0.25);padding:8px 12px;border-radius:7px;border:1px solid var(--bdr)">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:600">
        <input type="radio" name="calc-mode" id="calc-mode-excl" value="excl" checked onchange="computeGST()"> Exclusive of GST (Add GST)
      </label>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:600;color:var(--saf2)">
        <input type="radio" name="calc-mode" id="calc-mode-incl" value="incl" onchange="computeGST()"> Inclusive of GST (Reverse calc)
      </label>
    </div>
    <div class="grid2">
      <div class="field">
        <label>Invoice Amount (₹)</label>
        <input type="text" id="calc-amt" value="10000" oninput="computeGST()" placeholder="e.g. 10000 or 5000+2500">
      </div>
      <div class="field">
        <label>GST Rate</label>
        <select id="calc-rate" onchange="computeGST()">
          <option value="18">18% (Services/Rent)</option>
          <option value="12">12% (Medicines)</option>
          <option value="5">5% (Fertilizer)</option>
        </select>
      </div>
    </div>
    <div class="card2" style="margin-top:10px">
      <table class="dt" style="font-size:12px">
        <tr><td>Calculated Taxable Base:</td><td class="mono" id="c-taxable" style="font-weight:700">₹10,000.00</td></tr>
        <tr><td>Total Invoice Value:</td><td class="mono" id="c-tot" style="font-weight:700">₹11,800.00</td></tr>
        <tr><td>Total Combined GST:</td><td class="mono" id="c-gst" style="color:var(--saf)">₹1,800.00</td></tr>
        <tr><td>CGST (half) / SGST (half):</td><td class="mono" id="c-halves">₹900.00 each</td></tr>
        <tr style="background:rgba(74,222,128,0.08)"><td><strong>Eligible ITC Head Balance:</strong></td><td class="mono" id="c-itc" style="color:var(--green);font-weight:800">₹900.00</td></tr>
        <tr id="c-exp-row" style="background:rgba(248,113,113,0.08)"><td>Ineligible Expense Portion (Bank):</td><td class="mono" id="c-exp" style="color:var(--red);font-weight:800">₹900.00</td></tr>
      </table>
    </div>
    <div class="sn-box" style="margin-top:14px" onclick="copyText(document.getElementById('c-narr').textContent)">
      <div class="sn-label">Generated Narration Snippet</div>
      <code id="c-narr">TO GST PURCHASE BILL APR-2026 ADJ.</code>
    </div>
  </div>
</div>

<div id="toast" class="toast"><span>✓</span> <span id="toast-msg">Copied!</span></div>

<script>
const STORAGE_KEYS = {
  DRAFT: 'pacscore_gst_draft_v1',
  RECORDS: 'pacscore_gst_records_v1',
  BULK: 'pacscore_gst_bulk_v1'
};

const MONTHS_FY2627 = [
  '2026-APRIL','2026-MAY','2026-JUNE','2026-JULY','2026-AUGUST','2026-SEPTEMBER',
  '2026-OCTOBER','2026-NOVEMBER','2026-DECEMBER','2027-JANUARY','2027-FEBRUARY','2027-MARCH'
];

const GUIDE_PRESETS = {
  'bank-apr26': { entity:'bank', month:'2026-APRIL', itc:'186+11010+11196', cash:'0', rcm:'3114', rcmcpin:'2065126670', regcpin:'', status:'Posted 22-Jul-2026' },
  'bank-may26': { entity:'bank', month:'2026-MAY', itc:'541+14224+14038', cash:'1236+1963', rcm:'3114', rcmcpin:'2067109044', regcpin:'2067109044', status:'Posted 22-Jul-2026' },
  'bank-jun26': { entity:'bank', month:'2026-JUNE', itc:'1842+4826+4826', cash:'12000+13842', rcm:'3157', rcmcpin:'2069092457', regcpin:'2069092457', status:'Posted 22-Jul-2026' },
  'bank-jul26': { entity:'bank', month:'2026-JULY', itc:'274+2931+2931', cash:'19695+19969', rcm:'3114', rcmcpin:'2072232735', regcpin:'2072232735', status:'Posted 22-Aug-2026' },
  'neethi-apr26': { entity:'neethi', month:'2026-APRIL', itc:'16776+16776', cash:'0', rcm:'900', rcmcpin:'2065126671', regcpin:'', status:'Reconciled' },
  'neethi-jul26': { entity:'neethi', month:'2026-JULY', itc:'18086+18086', cash:'1179+1179', rcm:'900', rcmcpin:'2072232736', regcpin:'2072232736', status:'Posted 22-Aug-2026' },
  'depot-jul26': { entity:'depot', month:'2026-JULY', itc:'855+855', cash:'0', rcm:'694', rcmcpin:'2072232737', regcpin:'', status:'Posted 22-Aug-2026' },
  'rev-neethi25': { entity:'neethi', month:'FY 2025-26', isReversal:true, revAmount:23673.74, revNarration:'TO REVERSAL OF EXCESS FY 2025-26 SET-OFF ADJ.', status:'Cleared 28-Jul-2026' },
  'rev-bank25': { entity:'bank', month:'FY 2025-26', isReversal:true, revAmount:2385.02, revNarration:'TO REVERSAL OF EXCESS FY 2025-26 SET-OFF ADJ.', status:'Cleared 28-Jul-2026' }
};

const DEFAULT_AUDITED_RECORDS = [
  { id:'bank_2026-APRIL', entity:'bank', month:'2026-APRIL', itc:'186+11010+11196', cash:'0', rcm:'3114', rcmcpin:'2065126670', regcpin:'', status:'Posted 22-Jul-2026' },
  { id:'bank_2026-MAY', entity:'bank', month:'2026-MAY', itc:'541+14224+14038', cash:'1236+1963', rcm:'3114', rcmcpin:'2067109044', regcpin:'2067109044', status:'Posted 22-Jul-2026' },
  { id:'bank_2026-JUNE', entity:'bank', month:'2026-JUNE', itc:'1842+4826+4826', cash:'12000+13842', rcm:'3157', rcmcpin:'2069092457', regcpin:'2069092457', status:'Posted 22-Jul-2026' },
  { id:'bank_2026-JULY', entity:'bank', month:'2026-JULY', itc:'274+2931+2931', cash:'19695+19969', rcm:'3114', rcmcpin:'2072232735', regcpin:'2072232735', status:'Posted 22-Aug-2026' },
  { id:'neethi_2026-APRIL', entity:'neethi', month:'2026-APRIL', itc:'16776+16776', cash:'0', rcm:'900', rcmcpin:'2065126671', regcpin:'', status:'Reconciled' },
  { id:'neethi_2026-MAY', entity:'neethi', month:'2026-MAY', itc:'17122+17122', cash:'0', rcm:'900', rcmcpin:'2067109045', regcpin:'', status:'Reconciled' },
  { id:'neethi_2026-JUNE', entity:'neethi', month:'2026-JUNE', itc:'18672+18672', cash:'0', rcm:'900', rcmcpin:'2069092458', regcpin:'', status:'Reconciled' },
  { id:'neethi_2026-JULY', entity:'neethi', month:'2026-JULY', itc:'18086+18086', cash:'1179+1179', rcm:'900', rcmcpin:'2072232736', regcpin:'2072232736', status:'Posted 22-Aug-2026' },
  { id:'depot_2026-APRIL', entity:'depot', month:'2026-APRIL', itc:'0', cash:'0', rcm:'694', rcmcpin:'2065126672', regcpin:'', status:'Reconciled (No Sales)' },
  { id:'depot_2026-MAY', entity:'depot', month:'2026-MAY', itc:'153+153', cash:'0', rcm:'694', rcmcpin:'2067109046', regcpin:'', status:'Reconciled' },
  { id:'depot_2026-JUNE', entity:'depot', month:'2026-JUNE', itc:'46+46', cash:'0', rcm:'694', rcmcpin:'2069092459', regcpin:'', status:'Reconciled' },
  { id:'depot_2026-JULY', entity:'depot', month:'2026-JULY', itc:'855+855', cash:'0', rcm:'694', rcmcpin:'2072232737', regcpin:'', status:'Posted 22-Aug-2026' }
];

let currentFilter = 'all';

function evaluateMathExpr(expr){
  if(!expr) return 0;
  const str = expr.toString().trim();
  if(!str) return 0;
  if(!isNaN(str) && isFinite(str)) return parseFloat(str);
  const sanitized = str.replace(/[^0-9.\+\-\*/\(\)\s]/g,'');
  if(!sanitized.trim()) return 0;
  try {
    const result = new Function(`'use strict'; return (${sanitized})`)();
    return isNaN(result) || !isFinite(result) ? 0 : parseFloat(result);
  } catch(e) {
    return 0;
  }
}

function fmtINR(val){
  return Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showToast(msg){
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.style.display = 'flex';
  setTimeout(()=>{ t.style.display = 'none'; }, 2200);
}

function copyText(str){
  if(!str) return;
  const clean = str.replace(/📋 Copy/g,'').trim();
  navigator.clipboard.writeText(clean).then(()=>{
    showToast('Copied: "' + (clean.length > 42 ? clean.slice(0,42)+'...' : clean) + '"');
  });
}

function copyVoucherCard(btn){
  const card = btn.closest('.jv-card');
  if(!card) return;
  const title = card.querySelector('h4') ? card.querySelector('h4').textContent.trim() : 'JOURNAL VOUCHER';
  const rows = card.querySelectorAll('tbody tr');
  let voucherText = `[${title}]\n`;
  rows.forEach(r => {
    const cells = r.querySelectorAll('td');
    if(cells.length >= 4 && !r.classList.contains('total-row')){
      const name = cells[0].textContent.replace(/DR|CR/g,'').trim();
      const codeEl = cells[1].querySelector('span') || cells[1];
      const code = codeEl.textContent.trim();
      const dr = cells[2].textContent.trim();
      const cr = cells[3].textContent.trim();
      if(dr !== '—') voucherText += `Dr. ${name} (${code}) : ₹${dr}\n`;
      if(cr !== '—') voucherText += `Cr. ${name} (${code}) : ₹${cr}\n`;
    }
  });
  const narrBoxes = card.querySelectorAll('.sn-box code');
  narrBoxes.forEach(b => { voucherText += `Narration: ${b.textContent.trim()}\n`; });
  copyText(voucherText);
}

function getSavedRecords(){
  const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
  if(!raw){
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(DEFAULT_AUDITED_RECORDS));
    return [...DEFAULT_AUDITED_RECORDS];
  }
  try { return JSON.parse(raw); } catch(e) { return [...DEFAULT_AUDITED_RECORDS]; }
}

function setSavedRecords(list){
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(list));
  updateMemoryBadge();
}

function updateMemoryBadge(){
  const list = getSavedRecords();
  const badge = document.getElementById('nav-mem-count');
  if(badge) badge.textContent = list.length;
}

function saveDraftState(){
  const draft = {
    entity: document.getElementById('soc-entity').value,
    month: document.getElementById('soc-month').value,
    itc: document.getElementById('soc-itc').value,
    cash: document.getElementById('soc-totcash').value,
    rcm: document.getElementById('soc-rcmcash').value,
    rcmcpin: document.getElementById('soc-rcmcpin').value,
    regcpin: document.getElementById('soc-regcpin').value,
    status: document.getElementById('soc-glstatus').value
  };
  localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft));
}

function loadDraftState(){
  const raw = localStorage.getItem(STORAGE_KEYS.DRAFT);
  if(!raw) return;
  try {
    const d = JSON.parse(raw);
    if(d.entity) document.getElementById('soc-entity').value = d.entity;
    if(d.month) document.getElementById('soc-month').value = d.month;
    if(d.itc !== undefined) document.getElementById('soc-itc').value = d.itc;
    if(d.cash !== undefined) document.getElementById('soc-totcash').value = d.cash;
    if(d.rcm !== undefined) document.getElementById('soc-rcmcash').value = d.rcm;
    if(d.rcmcpin !== undefined) document.getElementById('soc-rcmcpin').value = d.rcmcpin;
    if(d.regcpin !== undefined) document.getElementById('soc-regcpin').value = d.regcpin;
    if(d.status !== undefined) document.getElementById('soc-glstatus').value = d.status;
  } catch(e){}
}

function onEntityChange(){
  const entity = document.getElementById('soc-entity').value;
  const rcmInput = document.getElementById('soc-rcmcash');
  if(entity === 'bank') rcmInput.value = '3114';
  else if(entity === 'neethi') rcmInput.value = '900';
  else if(entity === 'depot') rcmInput.value = '694';
  runSetoffGenerator();
}

function updateInlineMathPreview(inputId, previewId){
  const raw = document.getElementById(inputId).value.trim();
  const prev = document.getElementById(previewId);
  if(!prev) return;
  if(/[+\-*/]/.test(raw)){
    prev.textContent = '= ₹' + fmtINR(evaluateMathExpr(raw));
  } else {
    prev.textContent = '';
  }
}

function runSetoffGenerator(){
  const entity = document.getElementById('soc-entity').value;
  const month = (document.getElementById('soc-month').value || '2026-APRIL').toUpperCase();
  const itc = evaluateMathExpr(document.getElementById('soc-itc').value);
  const totcash = evaluateMathExpr(document.getElementById('soc-totcash').value);
  const rcmcash = evaluateMathExpr(document.getElementById('soc-rcmcash').value);
  const rcmcpin = document.getElementById('soc-rcmcpin').value.trim();
  const regcpin = document.getElementById('soc-regcpin').value.trim();
  const glstatus = document.getElementById('soc-glstatus').value.trim() || 'Ready to Post';

  updateInlineMathPreview('soc-itc', 'prev-itc');
  updateInlineMathPreview('soc-totcash', 'prev-cash');
  updateInlineMathPreview('soc-rcmcash', 'prev-rcm');
  saveDraftState();

  const regcash = totcash;

  document.getElementById('kpi-soc-1').textContent = '₹' + fmtINR(itc);
  document.getElementById('kpi-soc-rcm').textContent = '₹' + fmtINR(rcmcash);
  document.getElementById('kpi-soc-2').textContent = '₹' + fmtINR(regcash);
  document.getElementById('kpi-soc-status').textContent = glstatus;
  document.getElementById('kpi-soc-tot').textContent = 'Total Cleared: ₹' + fmtINR(itc + regcash + rcmcash);

  let saCode='0200', saName='SA GST INPUT TAX (Bank)';
  let slCode='7800', slName='SL GST OUTPUT TAX - 18% (Bank)';
  let tagClass='je-bank', entityTitle='Bank HO / Branches', prefix='BANK';

  if(entity==='neethi'){
    saCode='702'; saName='SA GST INPUT TAX - NEETHI STORE';
    slCode='703'; slName='SL GST OUTPUT TAX - NEETHI STORE';
    tagClass='je-neethi'; entityTitle='Neethi Medical Store'; prefix='NEETHI';
  } else if(entity==='depot'){
    saCode='732'; saName='SA GST INPUT TAX - MANURE';
    slCode='733'; slName='SL GST OUTPUT TAX - MANURE';
    tagClass='je-depot'; entityTitle='Fertilizer/Manure Depot'; prefix='MANURE';
  }

  const container = document.getElementById('soc-vouchers-container');
  let html = '';

  if(rcmcash > 0){
    const rcmCpinSuffix = rcmcpin ? ` CPIN ${rcmcpin}` : '';
    html += `
      <div class="jv-card">
        <div class="jv-head">
          <div>
            <h4>Entry 0 — RCM Rent Challan Routing &amp; Payment (Mid-Month / ~18th)</h4>
            <p>${entityTitle} · Challan Payment &amp; Liability Routing</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button type="button" class="btn-act no-print" onclick="copyVoucherCard(this)">📋 Copy PacScore Voucher</button>
            <span class="etag2 ${tagClass}">Mid-Month · RCM ₹${fmtINR(rcmcash)}</span>
          </div>
        </div>
        <div class="jv-body">
          <table class="jt">
            <thead><tr><th>Account Head</th><th>Code</th><th class="amt-h">Debit ₹</th><th class="amt-h">Credit ₹</th><th>Leg / Purpose</th></tr></thead>
            <tbody>
              <tr class="dr-row">
                <td class="ac-name"><span class="dr-badge">DR</span>${slName}</td>
                <td class="code-td"><span>${slCode}</span></td>
                <td class="amt">${fmtINR(rcmcash)}</td>
                <td class="empty-amt">—</td>
                <td class="note-td">Routing leg: clears RCM liability from SL O/P</td>
              </tr>
              <tr class="cr-row">
                <td class="ac-name"><span class="cr-badge">CR</span>GST Paid to Govt (Clearing)</td>
                <td class="code-td"><span>4445</span></td>
                <td class="empty-amt">—</td>
                <td class="amt">${fmtINR(rcmcash)}</td>
                <td class="note-td">Routing credit leg</td>
              </tr>
              <tr class="dr-row">
                <td class="ac-name"><span class="dr-badge">DR</span>GST Paid to Govt (Clearing)</td>
                <td class="code-td"><span>4445</span></td>
                <td class="amt">${fmtINR(rcmcash)}</td>
                <td class="empty-amt">—</td>
                <td class="note-td">Payment leg: challan deposit to Govt</td>
              </tr>
              <tr class="cr-row">
                <td class="ac-name"><span class="cr-badge">CR</span>Bank Account A/c</td>
                <td class="code-td"><span>711</span></td>
                <td class="empty-amt">—</td>
                <td class="amt">${fmtINR(rcmcash)}</td>
                <td class="note-td">Money paid out from Bank Operating A/c</td>
              </tr>
            </tbody>
          </table>
          <div class="sn-box" style="margin-top:10px" onclick="copyText('${prefix}-GST-RCM-CASH-PAID-${month}${rcmCpinSuffix}')">
            <div class="sn-label">Routing Leg Narration (Click to Copy)</div>
            <code>${prefix}-GST-RCM-CASH-PAID-${month}${rcmCpinSuffix}</code>
          </div>
          <div class="sn-box" style="margin-top:6px" onclick="copyText('${prefix}-GST-RCM-CHALLAN-${month}${rcmCpinSuffix}')">
            <div class="sn-label">Payment Leg Narration (Click to Copy)</div>
            <code>${prefix}-GST-RCM-CHALLAN-${month}${rcmCpinSuffix}</code>
          </div>
        </div>
      </div>`;
  }

  if(itc > 0){
    html += `
      <div class="jv-card">
        <div class="jv-head">
          <div>
            <h4>Entry 1 — Monthly GST Set-Off (ITC Absorbs Output Tax)</h4>
            <p>Pass by 25th after GSTR-3B filing · ① Paid through Credit</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button type="button" class="btn-act no-print" onclick="copyVoucherCard(this)">📋 Copy PacScore Voucher</button>
            <span class="etag2 je-all">By 25th · Set-Off ① ₹${fmtINR(itc)}</span>
          </div>
        </div>
        <div class="jv-body">
          <table class="jt">
            <thead><tr><th>Account Head</th><th>Code</th><th class="amt-h">Debit ₹</th><th class="amt-h">Credit ₹</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr class="dr-row">
                <td class="ac-name"><span class="dr-badge">DR</span>${slName}</td>
                <td class="code-td"><span>${slCode}</span></td>
                <td class="amt">${fmtINR(itc)}</td>
                <td class="empty-amt">—</td>
                <td class="note-td">Debits SL O/P to reduce liability</td>
              </tr>
              <tr class="cr-row">
                <td class="ac-name"><span class="cr-badge">CR</span>${saName}</td>
                <td class="code-td"><span>${saCode}</span></td>
                <td class="empty-amt">—</td>
                <td class="amt">${fmtINR(itc)}</td>
                <td class="note-td">Credits SA I/P to consume available ITC pool</td>
              </tr>
              <tr class="total-row">
                <td colspan="2">TOTAL</td>
                <td class="amt">${fmtINR(itc)}</td>
                <td class="amt">${fmtINR(itc)} ✓</td>
                <td class="note-td" style="color:var(--green)">Balanced</td>
              </tr>
            </tbody>
          </table>
          <div class="sn-box" style="margin-top:10px" onclick="copyText('${prefix}-GST SET OFF ${month} ADJ.')">
            <div class="sn-label">Entry 1 Narration (Click to Copy)</div>
            <code>${prefix}-GST SET OFF ${month} ADJ.</code>
          </div>
        </div>
      </div>`;
  }

  if(regcash > 0){
    const regCpinSuffix = regcpin ? ` CPIN ${regcpin}` : '';
    html += `
      <div class="jv-card">
        <div class="jv-head">
          <div>
            <h4>Entry 2 — Regular Cash Challan Routing</h4>
            <p>Pass by 25th · Output exceeded ITC · ② = PDF Section (A) “Tax paid in cash”</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button type="button" class="btn-act no-print" onclick="copyVoucherCard(this)">📋 Copy PacScore Voucher</button>
            <span class="etag2 ${tagClass}">By 25th · Cash ② ₹${fmtINR(regcash)}</span>
          </div>
        </div>
        <div class="jv-body">
          <table class="jt">
            <thead><tr><th>Account Head</th><th>Code</th><th class="amt-h">Debit ₹</th><th class="amt-h">Credit ₹</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr class="dr-row">
                <td class="ac-name"><span class="dr-badge">DR</span>${slName}</td>
                <td class="code-td"><span>${slCode}</span></td>
                <td class="amt">${fmtINR(regcash)}</td>
                <td class="empty-amt">—</td>
                <td class="note-td">Debits remaining SL O/P output liability</td>
              </tr>
              <tr class="cr-row">
                <td class="ac-name"><span class="cr-badge">CR</span>GST Paid to Govt (Clearing)</td>
                <td class="code-td"><span>4445</span></td>
                <td class="empty-amt">—</td>
                <td class="amt">${fmtINR(regcash)}</td>
                <td class="note-td">Credits 4445 to clear the regular cash deposit</td>
              </tr>
              <tr class="total-row">
                <td colspan="2">TOTAL</td>
                <td class="amt">${fmtINR(regcash)}</td>
                <td class="amt">${fmtINR(regcash)} ✓</td>
                <td class="note-td" style="color:var(--green)">Balanced</td>
              </tr>
            </tbody>
          </table>
          <div style="font-size:12px;color:var(--muted);margin-top:8px"><strong>Bank payment entry:</strong> Dr 4445 / Cr Bank Head 711 ₹${fmtINR(regcash)} was already passed on the regular challan payment date${regCpinSuffix}.</div>
          <div class="sn-box" style="margin-top:10px" onclick="copyText('${prefix}-GST-CASH-PAID-${month}${regCpinSuffix}')">
            <div class="sn-label">Entry 2 Narration (Click to Copy)</div>
            <code>${prefix}-GST-CASH-PAID-${month}${regCpinSuffix}</code>
          </div>
        </div>
      </div>`;
  }

  container.innerHTML = html;
}

function loadGuidePreset(key){
  const p = GUIDE_PRESETS[key];
  if(!p) return;
  if(p.isReversal){
    renderReversalVoucher(p);
    return;
  }
  document.getElementById('soc-entity').value = p.entity;
  document.getElementById('soc-month').value = p.month;
  document.getElementById('soc-itc').value = p.itc;
  document.getElementById('soc-totcash').value = p.cash;
  document.getElementById('soc-rcmcash').value = p.rcm;
  document.getElementById('soc-rcmcpin').value = p.rcmcpin || '';
  document.getElementById('soc-regcpin').value = p.regcpin || '';
  document.getElementById('soc-glstatus').value = p.status || 'Ready to Post';
  runSetoffGenerator();
  showToast('Loaded preset: ' + p.month + ' (' + p.entity.toUpperCase() + ')');
}

function renderReversalVoucher(p){
  document.getElementById('soc-entity').value = p.entity;
  document.getElementById('soc-month').value = 'FY 2025-26';
  document.getElementById('soc-itc').value = '0';
  document.getElementById('soc-totcash').value = '0';
  document.getElementById('soc-rcmcash').value = '0';
  document.getElementById('soc-glstatus').value = p.status || 'Reversal Active';

  document.getElementById('kpi-soc-1').textContent = '₹0.00';
  document.getElementById('kpi-soc-rcm').textContent = '₹0.00';
  document.getElementById('kpi-soc-2').textContent = '₹0.00';
  document.getElementById('kpi-soc-status').textContent = 'Reversal Active';

  const saCode = p.entity==='bank' ? '0200' : '702';
  const saName = p.entity==='bank' ? 'SA GST INPUT TAX (Bank)' : 'SA GST INPUT TAX — NEETHI STORE';
  const slCode = p.entity==='bank' ? '7800' : '703';
  const slName = p.entity==='bank' ? 'SL GST OUTPUT TAX — 18% (Bank)' : 'SL GST OUTPUT TAX — NEETHI STORE';
  const prefix = p.entity==='bank' ? 'BANK' : 'NEETHI';
  const amt = p.revAmount;

  document.getElementById('soc-vouchers-container').innerHTML = `
    <div class="jv-card" style="border:1.5px solid var(--red)">
      <div class="jv-head" style="background:rgba(248,113,113,0.06)">
        <div>
          <h4 style="color:var(--red)">✅ Prior-Period Reversal Voucher — FY 2025-26 Close-Out</h4>
          <p>${prefix} · Cleared and Verified for FY 2026-27 Posting</p>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button type="button" class="btn-act no-print" onclick="copyVoucherCard(this)">📋 Copy PacScore Voucher</button>
          <span class="etag2 b-red">Reversal ₹${fmtINR(amt)}</span>
        </div>
      </div>
      <div class="jv-body">
        <table class="jt">
          <thead><tr><th>Account Head</th><th>Code</th><th class="amt-h">Debit ₹</th><th class="amt-h">Credit ₹</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr class="dr-row">
              <td class="ac-name"><span class="dr-badge">DR</span>${saName}</td>
              <td class="code-td"><span>${saCode}</span></td>
              <td class="amt">${fmtINR(amt)}</td>
              <td class="empty-amt">—</td>
              <td class="note-td">Debits SA I/P to restore over-credited set-off</td>
            </tr>
            <tr class="cr-row">
              <td class="ac-name"><span class="cr-badge">CR</span>${slName}</td>
              <td class="code-td"><span>${slCode}</span></td>
              <td class="empty-amt">—</td>
              <td class="amt">${fmtINR(amt)}</td>
              <td class="note-td">Credits SL O/P to reverse excess absorption</td>
            </tr>
          </tbody>
        </table>
        <div class="sn-box" style="margin-top:10px" onclick="copyText('${p.revNarration}')">
          <div class="sn-label">Required PacScore Short Narration (Click to Copy)</div>
          <code>${p.revNarration}</code>
        </div>
      </div>
    </div>`;
}

function saveCurrentVoucherToMemory(){
  const entity = document.getElementById('soc-entity').value;
  const month = (document.getElementById('soc-month').value || '2026-APRIL').toUpperCase().trim();
  const id = `${entity}_${month}`;
  const rec = {
    id,
    entity,
    month,
    itc: document.getElementById('soc-itc').value.trim(),
    cash: document.getElementById('soc-totcash').value.trim(),
    rcm: document.getElementById('soc-rcmcash').value.trim(),
    rcmcpin: document.getElementById('soc-rcmcpin').value.trim(),
    regcpin: document.getElementById('soc-regcpin').value.trim(),
    status: document.getElementById('soc-glstatus').value.trim() || 'Saved'
  };
  const list = getSavedRecords();
  const idx = list.findIndex(r => r.id === id);
  if(idx >= 0) list[idx] = rec;
  else list.unshift(rec);
  setSavedRecords(list);
  showToast(`Saved ${entity.toUpperCase()} ${month} to Memory!`);
}

function renderMemoryTable(filter){
  if(filter) currentFilter = filter;
  const list = getSavedRecords().filter(r => currentFilter === 'all' ? true : r.entity === currentFilter);
  const tbody = document.getElementById('memory-tbody');
  if(!tbody) return;
  tbody.innerHTML = list.map(r => {
    const itcVal = evaluateMathExpr(r.itc);
    const cashVal = evaluateMathExpr(r.cash);
    const rcmVal = evaluateMathExpr(r.rcm);
    const badgeCol = r.entity==='bank' ? 'var(--bank)' : (r.entity==='neethi' ? 'var(--neethi)' : 'var(--depot)');
    return `
      <tr>
        <td style="font-weight:800;color:${badgeCol};text-transform:uppercase">${r.entity}</td>
        <td class="mono">${r.month}</td>
        <td class="mono" style="text-align:right">₹${fmtINR(rcmVal)}</td>
        <td class="mono" style="text-align:right;color:var(--green);font-weight:700">₹${fmtINR(itcVal)}</td>
        <td class="mono" style="text-align:right;color:var(--saf)">₹${fmtINR(cashVal)}</td>
        <td class="mono">${r.rcmcpin || r.regcpin || '—'}</td>
        <td><span class="badge b-green">${r.status || 'Saved'}</span></td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn-act" onclick="loadRecordFromMemory('${r.id}')">⚡ Load</button>
          <button class="btn-act" onclick="openEditModal('${r.id}')">✏️</button>
          <button class="btn-act" style="color:var(--red)" onclick="deleteRecord('${r.id}')">🗑️</button>
        </td>
      </tr>`;
  }).join('');
}

function loadRecordFromMemory(id){
  const rec = getSavedRecords().find(r => r.id === id);
  if(!rec) return;
  document.getElementById('soc-entity').value = rec.entity;
  document.getElementById('soc-month').value = rec.month;
  document.getElementById('soc-itc').value = rec.itc;
  document.getElementById('soc-totcash').value = rec.cash;
  document.getElementById('soc-rcmcash').value = rec.rcm;
  document.getElementById('soc-rcmcpin').value = rec.rcmcpin || '';
  document.getElementById('soc-regcpin').value = rec.regcpin || '';
  document.getElementById('soc-glstatus').value = rec.status || 'Saved';
  switchView('generator', document.querySelector('.nb'));
  runSetoffGenerator();
  showToast('Loaded ' + rec.month);
}

function openEditModal(id){
  const rec = getSavedRecords().find(r => r.id === id);
  if(!rec) return;
  document.getElementById('edit-id').value = rec.id;
  document.getElementById('edit-month').value = rec.month;
  document.getElementById('edit-itc').value = rec.itc;
  document.getElementById('edit-cash').value = rec.cash;
  document.getElementById('edit-rcm').value = rec.rcm;
  document.getElementById('edit-cpin').value = rec.rcmcpin || '';
  document.getElementById('edit-status').value = rec.status || '';
  document.getElementById('edit-modal').classList.add('active');
}

function closeEditModal(){
  document.getElementById('edit-modal').classList.remove('active');
}

function saveEditedRecord(){
  const id = document.getElementById('edit-id').value;
  const list = getSavedRecords();
  const idx = list.findIndex(r => r.id === id);
  if(idx < 0) return;
  list[idx].month = document.getElementById('edit-month').value.toUpperCase().trim();
  list[idx].itc = document.getElementById('edit-itc').value.trim();
  list[idx].cash = document.getElementById('edit-cash').value.trim();
  list[idx].rcm = document.getElementById('edit-rcm').value.trim();
  list[idx].rcmcpin = document.getElementById('edit-cpin').value.trim();
  list[idx].status = document.getElementById('edit-status').value.trim();
  setSavedRecords(list);
  closeEditModal();
  renderMemoryTable();
  showToast('Record updated!');
}

function deleteRecord(id){
  const list = getSavedRecords().filter(r => r.id !== id);
  setSavedRecords(list);
  renderMemoryTable();
  showToast('Record deleted.');
}

function renderBulkReconciler(){
  const entity = document.getElementById('bulk-entity').value;
  const records = getSavedRecords();
  const tbody = document.getElementById('bulk-tbody');
  const defRcm = entity==='bank' ? '3114' : (entity==='neethi' ? '900' : '694');

  tbody.innerHTML = MONTHS_FY2627.map(m => {
    const rec = records.find(r => r.entity === entity && r.month === m) || { rcm: defRcm, itc: '0', cash: '0', rcmcpin: '' };
    return `
      <tr data-month="${m}">
        <td class="mono" style="font-weight:700">${m}</td>
        <td><input type="text" class="grid-inp b-rcm" value="${rec.rcm}" oninput="recalcBulkTotals()"></td>
        <td><input type="text" class="grid-inp b-itc" value="${rec.itc}" oninput="recalcBulkTotals()"></td>
        <td><input type="text" class="grid-inp b-cash" value="${rec.cash}" oninput="recalcBulkTotals()"></td>
        <td class="mono b-row-tot" style="text-align:right;font-weight:700">₹0.00</td>
        <td><input type="text" class="grid-inp b-cpin" value="${rec.rcmcpin || ''}" style="text-align:left" oninput="recalcBulkTotals()"></td>
        <td><button class="btn-act" onclick="saveBulkRowToGenerator('${entity}','${m}',this)">⚡</button></td>
      </tr>`;
  }).join('');
  recalcBulkTotals();
}

function recalcBulkTotals(){
  let totRcm = 0, totItc = 0, totCash = 0;
  document.querySelectorAll('#bulk-tbody tr').forEach(tr => {
    const r = evaluateMathExpr(tr.querySelector('.b-rcm').value);
    const i = evaluateMathExpr(tr.querySelector('.b-itc').value);
    const c = evaluateMathExpr(tr.querySelector('.b-cash').value);
    totRcm += r; totItc += i; totCash += c;
    tr.querySelector('.b-row-tot').textContent = '₹' + fmtINR(r + i + c);
  });
  document.getElementById('bk-tot-rcm').textContent = '₹' + fmtINR(totRcm);
  document.getElementById('bk-tot-itc').textContent = '₹' + fmtINR(totItc);
  document.getElementById('bk-tot-cash').textContent = '₹' + fmtINR(totCash);

  const portalRaw = document.getElementById('bulk-portal-credit').value.trim();
  const varEl = document.getElementById('bk-variance');
  if(!portalRaw){
    varEl.textContent = 'Enter Portal Sum';
    varEl.style.color = 'var(--purple)';
  } else {
    const diff = totItc - evaluateMathExpr(portalRaw);
    if(Math.abs(diff) < 0.01){
      varEl.textContent = '₹0.00 ✓ Matched';
      varEl.style.color = 'var(--green)';
    } else {
      varEl.textContent = (diff > 0 ? '+₹' : '-₹') + fmtINR(Math.abs(diff));
      varEl.style.color = 'var(--red)';
    }
  }
}

function saveBulkRowToGenerator(entity, month, btn){
  const tr = btn.closest('tr');
  const id = `${entity}_${month}`;
  const rec = {
    id, entity, month,
    rcm: tr.querySelector('.b-rcm').value.trim(),
    itc: tr.querySelector('.b-itc').value.trim(),
    cash: tr.querySelector('.b-cash').value.trim(),
    rcmcpin: tr.querySelector('.b-cpin').value.trim(),
    regcpin: tr.querySelector('.b-cpin').value.trim(),
    status: 'Synced from Grid'
  };
  const list = getSavedRecords();
  const idx = list.findIndex(r => r.id === id);
  if(idx >= 0) list[idx] = rec; else list.push(rec);
  setSavedRecords(list);
  loadRecordFromMemory(id);
}

function syncSavedToBulk(){
  renderBulkReconciler();
  showToast('Synced grid from Saved History!');
}

function copyAllSetoffText(){
  const entity = document.getElementById('soc-entity').value;
  const month = (document.getElementById('soc-month').value || '2026-APRIL').toUpperCase();
  const itc = evaluateMathExpr(document.getElementById('soc-itc').value);
  const regcash = evaluateMathExpr(document.getElementById('soc-totcash').value);
  const rcmcash = evaluateMathExpr(document.getElementById('soc-rcmcash').value);
  const rcmcpin = document.getElementById('soc-rcmcpin').value.trim();
  const regcpin = document.getElementById('soc-regcpin').value.trim();

  let saCode='0200', slCode='7800', eName='Bank HO', prefix='BANK';
  if(entity==='neethi'){saCode='702';slCode='703';eName='Neethi Store';prefix='NEETHI';}
  else if(entity==='depot'){saCode='732';slCode='733';eName='Manure Depot';prefix='MANURE';}

  let text = `=== DITS PACSCORE GST SET-OFF VOUCHERS: ${eName} (${month}) ===\n\n`;
  if(rcmcash > 0){
    text += `ENTRY 0: RCM ROUTING & PAYMENT (Mid-Month)\n`;
    text += `1) Dr SL O/P (${slCode}) ₹${fmtINR(rcmcash)} / Cr 4445 ₹${fmtINR(rcmcash)}\n`;
    text += `   Narration: ${prefix}-GST-RCM-CASH-PAID-${month}${rcmcpin?' CPIN '+rcmcpin:''}\n`;
    text += `2) Dr 4445 ₹${fmtINR(rcmcash)} / Cr Bank Head 711 ₹${fmtINR(rcmcash)}\n`;
    text += `   Narration: ${prefix}-GST-RCM-CHALLAN-${month}${rcmcpin?' CPIN '+rcmcpin:''}\n\n`;
  }
  if(itc > 0){
    text += `ENTRY 1: MONTHLY ITC SET-OFF (By 25th)\n`;
    text += `Dr SL O/P (${slCode}) ₹${fmtINR(itc)} / Cr SA I/P (${saCode}) ₹${fmtINR(itc)}\n`;
    text += `Narration: ${prefix}-GST SET OFF ${month} ADJ.\n\n`;
  }
  if(regcash > 0){
    text += `ENTRY 2: REGULAR CASH ROUTING (By 25th)\n`;
    text += `Dr SL O/P (${slCode}) ₹${fmtINR(regcash)} / Cr 4445 ₹${fmtINR(regcash)}\n`;
    text += `Narration: ${prefix}-GST-CASH-PAID-${month}${regcpin?' CPIN '+regcpin:''}\n`;
  }
  copyText(text);
}

function toggleCalcModal(){
  const m = document.getElementById('calc-modal');
  m.classList.toggle('active');
  if(m.classList.contains('active')) computeGST();
}

function computeGST(){
  const entity = document.getElementById('calc-entity').value;
  const amt = evaluateMathExpr(document.getElementById('calc-amt').value);
  const rate = parseFloat(document.getElementById('calc-rate').value) || 18;
  const isIncl = document.getElementById('calc-mode-incl').checked;

  const taxable = isIncl ? amt / (1 + rate/100) : amt;
  const totalGst = isIncl ? amt - taxable : amt * (rate/100);
  const halfGst = totalGst / 2;
  const eligibleItc = entity === 'bank' ? totalGst / 2 : totalGst;
  const expPortion = entity === 'bank' ? totalGst / 2 : 0;

  document.getElementById('c-exp-row').style.display = entity === 'bank' ? 'table-row' : 'none';
  document.getElementById('c-taxable').textContent = '₹' + fmtINR(taxable);
  document.getElementById('c-tot').textContent = '₹' + fmtINR(isIncl ? amt : amt + totalGst);
  document.getElementById('c-gst').textContent = '₹' + fmtINR(totalGst);
  document.getElementById('c-halves').textContent = '₹' + fmtINR(halfGst) + ' each';
  document.getElementById('c-itc').textContent = '₹' + fmtINR(eligibleItc);
  document.getElementById('c-exp').textContent = '₹' + fmtINR(expPortion);

  const headCode = entity==='bank' ? '0200' : (entity==='neethi' ? '702' : '732');
  document.getElementById('c-narr').textContent = `TO GST PURCHASE BILL TAXABLE ₹${fmtINR(taxable)} (ITC Head ${headCode}: ₹${fmtINR(eligibleItc)})`;
}

function exportBackupJSON(){
  const payload = {
    exportedAt: new Date().toISOString(),
    bank: 'Vadakkumbad Service Co-operative Bank Ltd.',
    records: getSavedRecords()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `PacScore_GST_Backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  showToast('JSON Backup Downloaded!');
}

function importBackupJSON(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(evt){
    try {
      const data = JSON.parse(evt.target.result);
      if(Array.isArray(data.records)){
        setSavedRecords(data.records);
        renderMemoryTable();
        renderBulkReconciler();
        showToast('Imported ' + data.records.length + ' records!');
      }
    } catch(err){
      showToast('Invalid JSON backup file.');
    }
  };
  reader.readAsText(file);
}

function resetToAuditedDefaults(){
  localStorage.removeItem(STORAGE_KEYS.DRAFT);
  setSavedRecords([...DEFAULT_AUDITED_RECORDS]);
  loadGuidePreset('bank-apr26');
  renderMemoryTable();
  renderBulkReconciler();
  showToast('Restored September 2026 Audited Defaults!');
}

function switchView(viewId, btn){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + viewId).classList.add('active');
  if(btn) btn.classList.add('active');
  const titles = {
    generator: 'Interactive Monthly Set-Off Voucher Generator',
    memory: 'Saved PacScore Voucher History (LocalStorage)',
    reconciler: '12-Month Bulk Reconciler & Credit Ledger Audit'
  };
  document.getElementById('view-title').textContent = titles[viewId] || '';
  if(viewId === 'memory') renderMemoryTable();
  if(viewId === 'reconciler') renderBulkReconciler();
}

document.addEventListener('DOMContentLoaded', () => {
  getSavedRecords();
  updateMemoryBadge();
  loadDraftState();
  runSetoffGenerator();
});
</script>
</body>
</html>

```