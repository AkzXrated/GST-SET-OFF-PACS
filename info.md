# 📚 Vadakkumbad Service Co-operative Bank Limited
## Master GST Audit, Reconciliation, & Return Filing SOP Reference (`info.md`)
**Financial Years: 2025-26 & 2026-27** · *Audited & Updated: September 2026*

---

## 📋 Summary of Cleared FY 2025-26 Prior-Period Reversal Vouchers

The following **prior-period reversal vouchers** have been mathematically verified, confirmed, and cleared for posting in FY 2026-27:

1. **Neethy Medical Store (`32AABAV5891L2Z0`):**
   * **Voucher Entry:** `Dr. SA GST INPUT TAX (702)` **₹23,673.74** / `Cr. SL GST OUTPUT TAX (703)` **₹23,673.74**
   * **Short Narration:** `TO REVERSAL OF EXCESS FY 2025-26 SET-OFF ADJ.`
   * **Root Cause:** GL posted ₹6,43,357.74 vs Portal Electronic Credit Ledger total ₹6,19,684.00 (Over-credited by ₹23,673.74).

2. **Bank Head Office (`32AABAV5891L1Z1`):**
   * **Voucher Entry:** `Dr. SA GST INPUT TAX (0200)` **₹2,385.02** / `Cr. SL GST OUTPUT TAX (7800)` **₹2,385.02**
   * **Short Narration:** `TO REVERSAL OF EXCESS FY 2025-26 SET-OFF ADJ.`
   * **Root Cause:** GL posted ₹1,90,919.02 vs Portal Electronic Credit Ledger total ₹1,88,534.00 (Over-credited by ₹2,385.02).

---

## 1. Introduction & Business Structure

Vadakkumbad Service Co-operative Bank Limited (Kerala, India) operates three distinct business units under separate GSTINs:

| # | Business Unit | GSTIN | Tax Rate | Input Tax Credit (ITC) Eligibility Rule | Account Codes |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **1** | **Bank Head Office (HO)** | `32AABAV5891L1Z1` | 18% | **Upfront Discard at Purchase Entry** (Purchases expensed 50% upfront, SA 0200 contains 100% eligible credit). | `SA 0200` / `SL 7800` |
| **2** | **Neethy Medicals (Pharmacy)** | `32AABAV5891L2Z0` | Various | **100% Eligible ITC** (Pure taxable pharmaceutical trading). | `SA 702` / `SL 703` |
| **3** | **Fertilizer/Manure Depot** | `32AABAV5891L3ZZ` | Various | **100% Eligible ITC** (Pure taxable agricultural goods trading). | `SA 732` / `SL 733` |

---

## 2. Standard Monthly Set-Off Accounting Journal Entries

For all business units, post **3 simple monthly vouchers** based directly on filed GSTR-3B return figures:

* **Entry 0 — RCM Rent Cash Payment Routing (Mid-Month):**
  * **Dr.** `SL GST OUTPUT TAX` (Code `7800` / `703` / `733`) : **₹ RCM Cash Amount**
  * **Cr.** `GST Paid to Govt (Clearing)` (Code `4445`) : **₹ RCM Cash Amount**
  * *Narration:* `TO RCM CHALLAN ROUTING [YYYY-MONTH] ADJ. CPIN [NO]`

* **Entry 1 — Set-Off Entry ① (Credit Ledger Absorption — Month End):**
  * **Dr.** `SL GST OUTPUT TAX` (Code `7800` / `703` / `733`) : **₹ GSTR-3B Paid Through Credit**
  * **Cr.** `SA GST INPUT TAX` (Code `0200` / `702` / `732`) : **₹ GSTR-3B Paid Through Credit**
  * *Narration:* `TO GST SET OFF [YYYY-MONTH] ADJ.`

* **Entry 2 — Regular Cash Payment Routing ② (Month End if Cash Paid):**
  * **Dr.** `SL GST OUTPUT TAX` (Code `7800` / `703` / `733`) : **₹ GSTR-3B Tax Paid in Cash**
  * **Cr.** `GST Paid to Govt (Clearing)` (Code `4445`) : **₹ GSTR-3B Tax Paid in Cash**
  * *Narration:* `TO GST REGULAR CASH ROUTING [YYYY-MONTH] ADJ. CPIN [NO]`

---

## 3. Standalone Application Software (`Software/`)

The workspace includes a complete standalone web application suite inside **`Software/index.html`**:
* **Live Voucher Generator:** Generates Entry 0, 1, and 2 live with 1-click PacScore clipboard copy.
* **Inline Math Evaluator:** Allows typing sums like `100+200+300` directly into figure fields.
* **Bulk 12-Month Reconciler:** Excel copy/paste grid, auto-calculated total output tax, quarterly Q1–Q4 summaries, and annual master voucher generation. Preloaded with all 6 datasets across FY 2025-26 and FY 2026-27.
* **Data Persistence:** LocalStorage memory with edit/rename record modal and JSON backup/restore.

---

## 4. Current Year (FY 2026-27: April – July 2026) Audited Status

All returns filed and verified against Electronic Cash/Credit Ledgers:

### Bank Head Office (`32AABAV5891L1Z1` · `0200` / `7800`)
* **April 2026:** ITC Set-off ₹22,392.00 | Reg Cash ₹0.00 | RCM Cash ₹3,114.00 (CPIN 2065126670). *Posted in GL 22-Jul-2026.*
* **May 2026:** ITC Set-off ₹28,803.00 | Reg Cash ₹3,199.00 | RCM Cash ₹3,114.00 (CPIN 2067109044). *Posted in GL 22-Jul-2026.*
* **June 2026:** ITC Set-off ₹11,494.00 | Reg Cash ₹25,842.00 | RCM Cash ₹3,157.00 (CPIN 2069092457). *Posted in GL 22-Jul-2026.*
* **July 2026:** ITC Set-off ₹6,136.00 | Reg Cash ₹39,664.00 | RCM Cash ₹3,114.00 (CPIN 2072232735). *Posted in GL 22-Aug-2026.*
* **Total Apr–Jul:** ITC Set-off **₹68,825.00** | Reg Cash **₹68,705.00** | RCM Cash **₹12,499.00**.

### Neethy Medical Store (`32AABAV5891L2Z0` · `702` / `703`)
* **April 2026:** ITC Set-off ₹33,552.00 | Reg Cash ₹0.00 | RCM Cash ₹900.00 (CPIN 2065126671).
* **May 2026:** ITC Set-off ₹34,244.00 | Reg Cash ₹0.00 | RCM Cash ₹900.00 (CPIN 2067109045).
* **June 2026:** ITC Set-off ₹37,344.00 | Reg Cash ₹0.00 | RCM Cash ₹900.00 (CPIN 2069092458).
* **July 2026:** ITC Set-off ₹36,172.00 | Reg Cash ₹2,358.00 | RCM Cash ₹900.00 (CPIN 2072232736). *Posted in GL 22-Aug-2026.*
* **Total Apr–Jul:** ITC Set-off **₹141,312.00** | Reg Cash **₹2,358.00** | RCM Cash **₹3,600.00**.

### Fertilizer/Manure Depot (`32AABAV5891L3ZZ` · `732` / `733`)
* **April 2026:** ITC Set-off ₹0.00 *(No sales)* | Reg Cash ₹0.00 | RCM Cash ₹694.00 (CPIN 2065126672).
* **May 2026:** ITC Set-off ₹306.00 | Reg Cash ₹0.00 | RCM Cash ₹694.00 (CPIN 2067109046).
* **June 2026:** ITC Set-off ₹92.00 | Reg Cash ₹0.00 | RCM Cash ₹694.00 (CPIN 2069092459).
* **July 2026:** ITC Set-off ₹1,710.00 | Reg Cash ₹0.00 | RCM Cash ₹694.00 (CPIN 2072232737). *Posted in GL 22-Aug-2026.*
* **Total Apr–Jul:** ITC Set-off **₹2,108.00** | Reg Cash **₹0.00** | RCM Cash **₹2,776.00**.

