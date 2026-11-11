# BLUEPRINT — GST Set-Off Voucher Studio (standalone offline web app with memory)

**For:** Antigravity CLI (build agent)
**Client:** Vadakkumbad Service Co-operative Bank Ltd., Kerala — 3 GSTINs
**Accounting software the output is typed into:** PacScore (cooperative bank core accounting)
**Status of inputs:** `GST_Accounting_Guide_FINAL.html`, `0_START_HERE.md`, `info.md` are in the workspace. If `Software/index.html` already exists, read it for reusable ideas, but **this blueprint is the source of truth**. Do not copy bugs listed in §12.

---

## 0. One-paragraph goal

Build a **single-folder, zero-dependency, offline-first web app** (open `index.html` by double-click, no server, no build step) that turns three numbers read from a *filed GSTR-3B PDF (Table 6.1)* into **balanced PacScore journal vouchers** (Entry 0 RCM, Entry 1 ITC set-off, Entry 2 regular cash), with ready-to-paste narrations. The app must **remember** everything: every month's figures per business unit, voucher status (draft / posted / reconciled), UI preferences, and an audit trail, and must support annual reconciliation against the GST portal with auto-generated reversal vouchers, plus JSON backup/restore.

---

## 1. Domain knowledge (read this before writing any code)

### 1.1 Business units (3 GSTINs, one legal entity)

| id | Name | GSTIN | SA (Input Tax, asset) | SL (Output Tax, liability) | Prefix | ITC rule |
|---|---|---|---|---|---|---|
| `bank` | Bank HO / Branches | 32AABAV5891L1Z1 | `0200` SA GST INPUT TAX (Bank) | `7800` SL GST OUTPUT TAX - 18% (Bank) | BANK | 50% ITC discarded upfront at purchase entry (Rule 38 treatment). `SA 0200` already holds only the eligible credit, so **the app never computes eligibility; it only mirrors the GSTR-3B figures** |
| `neethi` | Neethy Medical Store (spelled "Neethi" in the old HTML — use **Neethy** as display name, keep `neethi` as the internal id) | 32AABAV5891L2Z0 | `702` SA GST INPUT TAX - NEETHI STORE | `703` SL GST OUTPUT TAX - NEETHI STORE | NEETHI | 100% eligible |
| `depot` | Fertilizer / Manure Depot | 32AABAV5891L3ZZ | `732` SA GST INPUT TAX - MANURE | `733` SL GST OUTPUT TAX - MANURE | MANURE | 100% eligible |

Shared accounts (all entities):
- `4445` — **GST Paid to Govt (Clearing)**
- `711` — **Bank Account A/c** (operating bank)

All of the above must live in an **editable Settings table**, not hard-coded, because codes can change.

### 1.2 How GST flows through the books

- Sales post **output tax** as a credit to SL (liability). Purchases post **input tax** to SA (asset).
- Each month the GSTR-3B is filed. **Table 6.1** has two sections:
  - **Section (A) — other than reverse charge:** "Tax paid through ITC" (call it **①**) and "Tax paid in cash" (call it **②**).
  - **Section (B) — reverse charge (RCM, e.g., rent):** can only be paid in **cash by challan**, not through ITC. Call it **RCM cash**.
- In the books, filing does nothing by itself. The accountant must pass **set-off vouchers** so SL/SA balances match the portal:
  - ① consumed ITC → debit SL, credit SA.
  - ② and RCM cash were paid via challan (money out of bank) → debit SL, credit **4445 clearing** (the bank leg Dr 4445 / Cr 711 is passed on the challan payment date).
- GSTR-3B Table 6.1 shows figures split into IGST / CGST / SGST / Cess. Users type the **sum**, often as inline math, e.g. `186+11010+11196` (IGST+CGST+SGST). The books use single SA/SL heads, so the app works on **totals**. (Optional head-wise breakdown is v2; see §11.)

### 1.3 The three standard monthly vouchers (from `info.md`, audited SOP)

| Entry | When | Debit | Credit | Amount source |
|---|---|---|---|---|
| **0 — RCM routing** | mid-month, ~18th (challan paid before filing) | SL | 4445 | Table 6.1 Section (B) cash / challan amount |
| **1 — ITC set-off ①** | by 25th, after GSTR-3B filing | SL | SA | Table 6.1 (A) "paid through ITC" total |
| **2 — Regular cash ②** | by 25th, only if cash > 0 | SL | 4445 | Table 6.1 (A) "paid in cash" total |

Skip any entry whose amount is 0 (e.g., Depot April 2026 ITC = 0, "no sales").

**Open conflict to expose as a setting (do not silently choose):**
- The old HTML generator makes Entry 0 a **4-line voucher**: `Dr SL / Cr 4445` (routing) **+** `Dr 4445 / Cr 711` (payment leg), with two narrations. Entry 2 in the same HTML omits the bank leg and says it "was already passed on the challan date".
- `info.md` defines Entry 0 as **2-line routing only**.
- → Add setting **"Entry 0 includes bank payment leg"** (default **OFF**, matching `info.md`; when ON, render the 4-line voucher exactly as the old generator did). Apply the same optional toggle to Entry 2 for consistency (default OFF).

### 1.4 Narrations

Two built-in narration profiles, selectable in Settings, plus fully editable templates. Placeholders: `{prefix}`, `{period}` (e.g. `2026-APRIL`), `{cpin}` (rendered as ` CPIN <n>` only when non-empty), `{fy}`.

| Voucher | Profile **SOP (default, from `info.md`)** | Profile **Legacy (old HTML)** |
|---|---|---|
| Entry 0 routing | `TO RCM CHALLAN ROUTING {period} ADJ.{cpin}` | `{prefix}-GST-RCM-CASH-PAID-{period}{cpin}` |
| Entry 0 payment leg (if enabled) | `TO RCM CHALLAN PAYMENT {period} ADJ.{cpin}` | `{prefix}-GST-RCM-CHALLAN-{period}{cpin}` |
| Entry 1 | `TO GST SET OFF {period} ADJ.` | `{prefix}-GST SET OFF {period} ADJ.` |
| Entry 2 | `TO GST REGULAR CASH ROUTING {period} ADJ.{cpin}` | `{prefix}-GST-CASH-PAID-{period}{cpin}` |
| Reversal (FY close) | `TO REVERSAL OF EXCESS FY {fy} SET-OFF ADJ.` | same |

Add a live **character counter** and a configurable max-length warning (default 60, user-editable; the true PacScore limit is unknown — see Open Questions).

### 1.5 Golden rule (must be visible in the UI)

> Never post a set-off amount from a spreadsheet, a chat, or an AI summary. Post only a number you can point to on a filed government document: GSTR-3B Table 6.1 or the Electronic Credit Ledger.

Implementation: each saved return has a **"Verified against filed GSTR-3B PDF"** checkbox (plus optional ARN and filing-date fields). Voucher copy buttons work always, but unverified returns show an amber banner "Not marked verified" and the copy log records `verified:false`.

### 1.6 Timeline hints (display only)

- ~18th: pay RCM challan, then Entry 0.
- 20th: GSTR-3B due date (monthly filers).
- By 25th: Entries 1 and 2 posted in PacScore.
- Financial year runs **April–March**; period label format `YYYY-MONTHNAME` in caps, e.g. `2026-APRIL`.

---

## 2. Tech constraints

1. **Vanilla HTML + CSS + JavaScript only.** No frameworks, no npm, no build, no CDN at runtime (must work fully offline).
2. Files: `Software/index.html`, `Software/styles.css`, `Software/core.js` (pure logic, no DOM), `Software/store.js` (persistence), `Software/app.js` (UI). Use **classic `<script>` tags, not ES modules**, because module scripts are blocked over `file://`.
3. `core.js` must be UMD-style (`module.exports` if available, else `window.GSTCore`) so it can be unit-tested with plain `node`.
4. **Money = integer paise** internally. Parse and format only at the edges. Never use floating-point arithmetic for totals. Display with Indian grouping: `new Intl.NumberFormat('en-IN',{minimumFractionDigits:2})`.
5. **No `eval` / `new Function`** for the inline-math field. Write a small recursive-descent parser (see §4.1).
6. Responsive: the owner often uses a phone and a laptop. Single column under 700 px; tap targets ≥ 40 px.
7. Dark theme by default (matches the old guide), with a light-theme toggle. Reuse the old palette: bank `#60a5fa`, neethy `#34d399`, depot `#fb923c`, red `#f87171`, saffron accent for primary actions, green `#34d399` for balanced ✓, purple for status.
8. Accessible: labels bound to inputs, visible focus, `aria-live="polite"` on the balance/status area.
9. Do not make network requests of any kind.

---

## 3. Data model & memory

### 3.1 Persistence layers ("memory")

| Layer | What | Where |
|---|---|---|
| **Records** | entities, returns, reversals, settings | `localStorage` key `gstvs.v1.db` (single JSON blob, data is tiny) |
| **UI memory** | last entity, last period, active tab, narration profile, copy format, theme, filter selections | `localStorage` key `gstvs.v1.ui` |
| **Audit log** | every copy / mark-posted / edit / delete / import / restore event, capped at 2,000 entries | inside the db blob: `audit[]` |
| **Backup** | manual JSON export/import + optional auto-backup file via File System Access API where supported | file download / user-picked file |

Rules:
- Call `navigator.storage.persist()` on first load (ignore failure).
- Every write goes through **one** `Store.commit(mutator)` function: deep-clone → mutate → validate → save → emit event. Wrap storage access in try/catch and show a visible red banner if saving fails (quota or private mode).
- `schemaVersion: 1` field plus a `migrate(db)` function skeleton for the future.
- **Backup nag:** show a non-blocking banner when more than 10 changes or more than 30 days have passed since the last export. "Clearing browser data erases this app's memory — export a backup."
- **Import** must show a diff-style preview (counts of new / changed / unchanged records) and require explicit confirmation; offer **Merge** (newer `updatedAt` wins) or **Replace**.
- Seed data (§10) loads only when the db is empty, via a "Load starter data" prompt (never silently overwrite).

### 3.2 Schema

```jsonc
{
  "schemaVersion": 1,
  "settings": {
    "narrationProfile": "sop",            // "sop" | "legacy" | "custom"
    "narrationTemplates": { "e0route": "...", "e0pay": "...", "e1": "...", "e2": "...", "rev": "..." },
    "entry0IncludePaymentLeg": false,
    "entry2IncludePaymentLeg": false,
    "narrationMaxLen": 60,
    "copyFormat": "tsv",                  // "tsv" | "text" | "json"  (see Open Questions)
    "accounts": { "clearing": {"code":"4445","name":"GST Paid to Govt (Clearing)"},
                  "bank":     {"code":"711","name":"Bank Account A/c"} }
  },
  "entities": [
    { "id":"bank","name":"Bank HO / Branches","gstin":"32AABAV5891L1Z1",
      "sa":{"code":"0200","name":"SA GST INPUT TAX (Bank)"},
      "sl":{"code":"7800","name":"SL GST OUTPUT TAX - 18% (Bank)"},
      "prefix":"BANK","color":"#60a5fa","note":"50% ITC discarded upfront at purchase (Rule 38)" }
    // neethi, depot ...
  ],
  "returns": [
    { "id":"uuid",
      "entityId":"bank",
      "period":"2026-04",                 // ISO YYYY-MM, display as 2026-APRIL
      "fy":"2026-27",
      "itcPaise": 2239200,                // ① Table 6.1(A) paid through ITC
      "cashPaise": 0,                     // ② Table 6.1(A) paid in cash
      "rcmPaise": 311400,                 // Table 6.1(B) RCM cash (challan)
      "rcmCpin":"2065126670",
      "regCpin":"",
      "arn":"", "filedOn":"",
      "verified": true,
      "outputTaxLiabilityPaise": null,    // optional: total output tax from 3B, for tie-out check
      "glStatus":"posted",                // "draft" | "posted" | "reconciled"
      "glPostedOn":"2026-07-22",
      "rawInputs": {"itc":"186+11010+11196","cash":"0","rcm":"3114"},  // keep what the user typed
      "notes":"",
      "createdAt":"ISO","updatedAt":"ISO" }
  ],
  "reversals": [
    { "id":"uuid","entityId":"neethi","fy":"2025-26",
      "glPostedPaise":64335774,"portalPaise":61968400,"diffPaise":2367374,
      "direction":"over",                 // "over" => Dr SA / Cr SL ; "under" => Dr SL / Cr SA
      "status":"cleared","clearedOn":"2026-07-28","narration":"..." }
  ],
  "audit": [ {"at":"ISO","action":"copy-voucher","entityId":"bank","period":"2026-04","detail":"entry1","verified":true} ]
}
```

Uniqueness: one return per (`entityId`, `period`). Saving a duplicate must prompt "Update existing record?".

---

## 4. Core logic (`core.js`) — all pure, all unit-tested

### 4.1 `evalMoney(str) -> {paise, ok, error}`
Grammar: numbers (digits, optional `.dd`, commas and `₹` and spaces stripped), `+ - * /`, parentheses, unary minus. Blank → 0. Invalid → `ok:false` with message (never throw to UI, never produce NaN). Result is rounded half-up to paise. Reject negative results with a clear message (GSTR-3B figures are non-negative).

### 4.2 `buildVouchers(returnRec, entity, settings) -> Voucher[]`
Each voucher: `{ key, title, whenHint, lines:[{side:'DR'|'CR', name, code, paise, purpose}], narrations:[{label,text}], totalDr, totalCr, balanced }`.

Entry rules:
- **E0** if `rcmPaise>0`: Dr `sl` / Cr `clearing`. If `entry0IncludePaymentLeg`: add Dr `clearing` / Cr `bank`.
- **E1** if `itcPaise>0`: Dr `sl` / Cr `sa`.
- **E2** if `cashPaise>0`: Dr `sl` / Cr `clearing`. If `entry2IncludePaymentLeg`: add Dr `clearing` / Cr `bank`; otherwise show an info note "Bank leg Dr 4445 / Cr 711 is passed on the challan payment date{cpin}".
- `balanced` = integer equality of totals; if false, show a red error and block copy.

### 4.3 `checkReturn(returnRec) -> Warning[]`
- ITC + cash vs `outputTaxLiabilityPaise` (if provided) must tie; otherwise warn with the difference.
- CPIN, if present, must be 10 digits.
- Non-whole-rupee amounts: info-level warning (portal returns whole rupees).
- Period outside the financial year chosen, or in the future: warning.
- Verified unchecked: amber banner.
- Duplicate narration/period conflicts.
- RCM = 0: info "No RCM this month?" (the bank usually has rent RCM monthly).

### 4.4 `reconcileFY(entityId, fy, glPostedPaise, portalPaise) -> {diffPaise, direction, reversalVoucher|null}`
- `diff = glPosted − portal`.
- `diff > 0` ("over-credited"): reversal **Dr SA / Cr SL** for `diff`, narration `TO REVERSAL OF EXCESS FY {fy} SET-OFF ADJ.` (this matches the cleared FY 2025-26 vouchers).
- `diff < 0` ("under"): **Dr SL / Cr SA** for `|diff|`, narration `TO ADDITIONAL SET-OFF FY {fy} ADJ.` (editable).
- `diff == 0`: "Matched — no reversal required" (Depot FY 2025-26).
- GL figure defaults to the sum of saved Entry 1 ITC amounts for that entity/FY, but the user can override it with the real GL balance. Portal figure is typed by the user from the Electronic Credit Ledger. Show both the app-computed and typed values side by side.

### 4.5 Helpers
`periodLabel('2026-04') → '2026-APRIL'`, `fyOf('2026-04') → '2026-27'`, `fmtINR(paise)`, `indianWords(paise)` (optional, for the voucher header), `uuid()`.

---

## 5. Screens & features

Top bar: app title, entity colour chips, global search, theme toggle, "Backup" button with a dot when overdue. Tab bar: **Dashboard · Generator · Register · Annual Reconcile · Settings & Backup**. Remember the last active tab.

### 5.1 Generator (port of the old `pg-setoffcalc`)
- Entity select, period picker (month input; show derived label `2026-APRIL`).
- Fields: ① ITC total, ② Cash total, RCM cash, RCM CPIN, Regular CPIN, optional ARN / filed-on / "Total output tax (for tie-out)". All money fields accept **inline math** and show the evaluated result under the field (e.g. `= ₹22,392.00`) or the red parse error. Keep the raw text.
- A **"Load saved month"** dropdown replaces the hard-coded presets (the old preset buttons: Bank Apr–Jul 26, Neethi Apr/Jul 26, Depot Jul 26, plus two reversal presets). Populate from the register, and offer a one-click "Previous month" and "Same as last month" (useful because RCM rent repeats).
- **Autosave draft**: unsaved input state is held in `ui` memory so a refresh or tab close loses nothing.
- Buttons: **Save to Register**, **Save & Next Month**, **Reset**.
- KPI cards (live): Entry 0 RCM, Entry 1 ITC, Entry 2 Cash, **Status** (computed: `Balanced ✓ / Needs attention / Not verified`), plus total GST paid for the month (RCM + ① + ②).
- Voucher cards for E0 / E1 / E2 (rendering as in the old tool: DR/CR badges, code column, purpose column, TOTAL row with ✓ Balanced, narration box).
  - Per-card **Copy PacScore Voucher**; global **Copy All Vouchers**; click-to-copy on each narration. Show a toast on copy ("Copied Entry 1 · Bank · 2026-APRIL").
  - Each card shows a status chip (Draft/Posted) with **Mark posted** (asks for the GL posting date).
- Show the "Golden rule" strip and the timeline hint at the top.

### 5.2 Dashboard
- **Matrix of 3 entities × months of the selected FY** (default current FY): each cell shows E0/E1/E2 amounts compactly and a status colour (empty / draft / posted / reconciled / unverified). Clicking a cell opens it in the Generator. This replicates the tables in `0_START_HERE.md`.
- Per-entity totals row (Apr–Jul figures to be reproduced exactly, see §10).
- "Next actions" list: missing months, unverified returns, drafts not yet posted, backup overdue.

### 5.3 Register
Sortable/filterable table (entity, FY, status, verified, text search over CPIN / notes). Row actions: open, duplicate, mark posted/reconciled, delete (with confirm, soft-warning: logged in audit). Export the filtered view as CSV (for CA/auditor) and print stylesheet for a clean A4 monthly summary.

### 5.4 Annual Reconcile
- Choose entity + FY. Show a 12-month grid (Apr→Mar) of saved ① amounts with the sum; **bulk paste from Excel** (tab/newline separated, 12 numbers) fills months; each cell also supports inline math.
- Inputs: **GL posted SA set-off total** (default = grid sum, overridable) and **Portal Electronic Credit Ledger total**.
- Output: difference, direction, reversal voucher card (same card component, copy buttons), and a button **Save as cleared reversal** (stores in `reversals[]`, with status and date).
- Preload the two cleared reversals (§10). Show the full derivation text for each ("GL posted ₹6,43,357.74 vs Portal ₹6,19,684.00 → over-credited by ₹23,673.74").
- Quarterly Q1–Q4 subtotals (Apr–Jun, Jul–Sep, Oct–Dec, Jan–Mar) and total output tax = ① + ② (+ RCM shown separately).

### 5.5 Settings & Backup
- Entities & account codes editor (validate GSTIN format `^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$`; must start with state code `32`; warn but allow override).
- Narration profile and templates editor with live preview.
- Entry 0 / Entry 2 payment-leg toggles; narration max length; copy format.
- Backup: Export JSON (filename `gst-voucher-studio-backup-YYYYMMDD-HHMM.json`), Import with preview (merge / replace), optional "Auto-backup to file" using File System Access API (hidden if unsupported), **Audit log viewer** with filter and CSV export, **Danger zone**: wipe all data (type `DELETE` to confirm).

---

## 6. Copy formats (PacScore paste)

The old HTML's `copyVoucherCard` / `copyAllSetoffText` bodies were not in the snippet. If they exist in `GST_Accounting_Guide_FINAL.html` (search for `function copyVoucherCard`, `function copyAllSetoffText`, `function copyText`, `function evaluateMathExpr`, `function loadGuidePreset`), **replicate their exact output format as the default** `text` format. Always offer:
- `text`: human-readable block, one voucher per section: header, `DR  code  name  amount`, `CR ...`, narration.
- `tsv`: `Side⇥Code⇥Account⇥Debit⇥Credit⇥Narration`, one line per leg (pastes into Excel/Sheets cleanly).
- `json`: machine-readable.
Amounts in copy output use plain `22392.00` (no ₹, no commas) to be paste-safe; on-screen display uses Indian grouping.

---

## 7. Edge cases to handle

- Any amount 0 → that voucher is omitted and its KPI shows "—".
- All three zero → "Nothing to post this month (nil return)" with the option to save a nil record (Depot April 2026 has ITC 0 but RCM 694).
- Period changed after typing → keep inputs, re-derive labels.
- Entity changed → re-derive account codes/prefix instantly; CPIN fields are not cleared.
- Import of a backup with a newer `schemaVersion` → refuse with a clear message.
- Two tabs open → listen to the `storage` event and show "Data changed in another tab — Reload" to avoid last-write-wins loss.
- Very large pastes into math fields (cap input length at 200 chars).
- Rounding: `22392.005` → 22392.01 (half-up), never `22392.0050000001`.

---

## 8. Security & robustness

- Escape every user-provided string before inserting into HTML (use `textContent` or an `esc()` helper).
- **Do not build `onclick="copyText('...')"` strings** — see §12. Use `data-*` attributes plus a single delegated event listener.
- Clipboard: use `navigator.clipboard.writeText`, with a `textarea` + `execCommand('copy')` fallback for `file://` contexts.
- No third-party code. No analytics. No external fonts (use system font stack).

---

## 9. Testing requirements

Create `Software/tests/core.test.js`, runnable with `node Software/tests/core.test.js` (no test framework; simple `assert`). Must cover:

1. `evalMoney`: `"186+11010+11196"` → 2239200 paise; `"1,000 + 2,500.50"`; `"(100+50)*2"`; `""` → 0; `"abc"` → error; `"5-10"` → negative rejected; `"1/0"` → error.
2. Voucher balance for every combination of E0/E1/E2 present/absent and both payment-leg toggles.
3. Golden vouchers (below) match expected lines and narration text exactly.
4. Reversal direction logic: over (+), under (−), equal (0), with paise amounts.
5. Period / FY helpers across March→April boundary.
6. Store: commit/validation, duplicate (entity, period) handling, migration skeleton, import merge/replace.

**Golden vouchers (SOP narration profile, payment legs OFF):**

*Bank HO — 2026-04* (RCM ₹3,114.00 CPIN 2065126670 · ITC ₹22,392.00 · cash 0)
- E0: `Dr 7800 SL GST OUTPUT TAX - 18% (Bank) 3114.00 / Cr 4445 GST Paid to Govt (Clearing) 3114.00` — `TO RCM CHALLAN ROUTING 2026-APRIL ADJ. CPIN 2065126670`
- E1: `Dr 7800 22392.00 / Cr 0200 SA GST INPUT TAX (Bank) 22392.00` — `TO GST SET OFF 2026-APRIL ADJ.`
- E2: not generated.

*Bank HO — 2026-06* (RCM ₹3,157 · ITC ₹11,494 · cash ₹25,842) → three vouchers, totals 3157 / 11494 / 25842.

*Neethy — 2026-07* (RCM 900 · ITC 36,172 · cash 2,358) → E0 `Dr 703 / Cr 4445`, E1 `Dr 703 / Cr 702`, E2 `Dr 703 / Cr 4445`.

*Depot — 2026-04* (RCM 694 · ITC 0) → only E0 `Dr 733 / Cr 4445 694.00`.

*Reversal — Neethy FY 2025-26:* GL 643357.74, Portal 619684.00 → over by 23673.74 → `Dr 702 SA / Cr 703 SL 23673.74` — `TO REVERSAL OF EXCESS FY 2025-26 SET-OFF ADJ.`
*Reversal — Bank FY 2025-26:* GL 190919.02, Portal 188534.00 → `Dr 0200 / Cr 7800 2385.02`.

---

## 10. Seed data (load on first run, with user confirmation)

All FY 2026-27 returns below are filed and verified (`verified:true`). `glStatus` as shown. Amounts in rupees (convert to paise). CPIN = the CPIN recorded in the SOP table for that month; treat it as the **RCM challan CPIN** (Regular-cash CPIN left blank because the source files do not give it).

**Bank HO (`bank`)** — RCM / ITC① / Cash② / CPIN / GL
| Period | RCM | ① | ② | CPIN | GL |
|---|---|---|---|---|---|
| 2026-04 | 3114 | 22392 | 0 | 2065126670 | posted 2026-07-22 |
| 2026-05 | 3114 | 28803 | 3199 | 2067109044 | posted 2026-07-22 |
| 2026-06 | 3157 | 11494 | 25842 | 2069092457 | posted 2026-07-22 |
| 2026-07 | 3114 | 6136 | 39664 | 2072232735 | posted 2026-08-22 |
Totals: RCM 12,499 · ① 68,825 · ② 68,705

**Neethy (`neethi`)**
| Period | RCM | ① | ② | CPIN | GL |
|---|---|---|---|---|---|
| 2026-04 | 900 | 33552 | 0 | 2065126671 | reconciled |
| 2026-05 | 900 | 34244 | 0 | 2067109045 | reconciled |
| 2026-06 | 900 | 37344 | 0 | 2069092458 | reconciled |
| 2026-07 | 900 | 36172 | 2358 | 2072232736 | posted 2026-08-22 |
Totals: RCM 3,600 · ① 141,312 · ② 2,358

**Depot (`depot`)**
| Period | RCM | ① | ② | CPIN | GL |
|---|---|---|---|---|---|
| 2026-04 | 694 | 0 (no sales) | 0 | 2065126672 | reconciled |
| 2026-05 | 694 | 306 | 0 | 2067109046 | reconciled |
| 2026-06 | 694 | 92 | 0 | 2069092459 | reconciled |
| 2026-07 | 694 | 1710 | 0 | 2072232737 | posted 2026-08-22 |
Totals: RCM 2,776 · ① 2,108 · ② 0

**Reversals (FY 2025-26), status `cleared`, clearedOn 2026-07-28:**
- Neethy: GL 643357.74, Portal 619684.00, diff 23673.74 (over)
- Bank HO: GL 190919.02, Portal 188534.00, diff 2385.02 (over)
- Depot: matched, none required

The dashboard totals must reproduce the table totals above **exactly**; add this as an automated test. Do **not** invent FY 2025-26 monthly data; the source files only mention that it exists in the older software, so leave those months empty for the user to fill or import from a backup.

---

## 11. Phasing

**Phase 1 (MVP — must ship):** core.js + tests, store with memory/backup, Generator, Register, seed data, copy formats, Settings (entities, narration, toggles).
**Phase 2:** Dashboard matrix, Annual Reconcile with bulk paste + reversal generator, audit log viewer, CSV export + print layout, two-tab sync warning.
**Phase 3 (optional):** head-wise IGST/CGST/SGST/Cess capture and tie-out, PWA manifest + service worker for install-to-home-screen, auto-backup via File System Access API, GSTR-3B PDF text-paste parser (the user pastes extracted text and the app proposes the ①/②/RCM numbers *for confirmation only*; it never auto-verifies).

Out of scope: any GST filing, GSTN login, network features, multi-user accounts.

---

## 12. Defects in the old snippet — do NOT reproduce

1. **Inline `onclick="copyText('...')"` with interpolated values** breaks on apostrophes/quotes and is an injection risk. Use delegated listeners and `data-` attributes.
2. **Narration style inconsistent with `info.md`** (hyphenated uppercase codes vs `TO ... ADJ.` style). Now configurable (§1.4).
3. **Entry 0 includes a bank leg, Entry 2 does not.** Now a setting (§1.3).
4. **Static "Ready to Post" status** regardless of validity. Now computed (§5.1).
5. **Float math and `toLocaleString` on JS numbers** — use integer paise.
6. **`evaluateMathExpr`** (not shown) — likely `eval`-based; replace with the safe parser.
7. **Hard-coded presets** with amounts baked into the HTML (including "Neethi Reversal (₹23.6k)" for ₹23,673.74). Replaced by saved records.
8. **Spelling:** "Neethi" vs "Neethy" — standardise display to *Neethy*.
9. The generator has no persistence: a refresh loses the inputs.
10. Period is a free-text field (`2026-APRIL`) — use a validated month picker.

---

## 13. Open questions (ask the owner; implement the default meanwhile)

1. **Narration style:** SOP (`TO GST SET OFF 2026-APRIL ADJ.`) or Legacy (`BANK-GST SET OFF 2026-APRIL ADJ.`) — which does PacScore posting actually use now? Default: SOP.
2. **Entry 0:** should it include the bank payment leg (Dr 4445 / Cr 711)? Default: no.
3. **PacScore paste format:** is the voucher typed manually, or pasted? What did the old "Copy PacScore Voucher" button put on the clipboard (a sample would let us match it exactly)? Default: `text` + `tsv`.
4. **Narration maximum length** accepted by PacScore. Default warning at 60 characters.
5. Does the **regular-cash challan CPIN** differ from the RCM CPIN every month? Seed data keeps it blank.
6. Should FY 2025-26 monthly data be imported from the older `Software/index.html` backup JSON? If a backup file is provided, write an importer for it.

---

## 14. Definition of done

- Opening `Software/index.html` from disk works offline in Chrome, Edge and Firefox, desktop and phone.
- Closing and reopening the browser restores all records, the last tab, entity and period, and any unsaved draft.
- Export → wipe → import restores the db byte-for-byte equivalent (ignoring timestamps added by the audit log).
- `node Software/tests/core.test.js` passes all tests in §9, including the seed-total checks.
- Every generated voucher is balanced to the paisa, and unbalanced states can never be copied.
- No `eval`, no `new Function`, no inline `on*=` handlers carrying data, no external requests.
- A short `README.md` (≤ 60 lines) documents the monthly workflow: read ①, ②, RCM from the filed GSTR-3B PDF → type → verify → copy → post in PacScore → mark posted → monthly backup.
