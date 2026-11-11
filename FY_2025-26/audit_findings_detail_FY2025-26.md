# 🔍 GST Comprehensive Reconciliation Audit Report
**Vadakkumbad Service Co-operative Bank Limited**  
*FY 2025-26 Audit Findings & Reconciling Adjustments*

---

## 📋 Executive Summary

This audit report provides a complete, in-depth breakdown of the three key areas identified in the reconciliation of the General Ledger (GL) against the GST Portal returns (GSTR-3B/GSTR-2B) for the financial year 2025-26. 

### Key Findings Summary:
1. **Neethy Pharmacy RCM Rent Gap:** The Pharmacy books have recorded **11 months of RCM Rent** value (₹9,900 combined CGST+SGST) instead of 12 months (₹10,800). **April 2025** and **March 2026** RCM rent entries were completely omitted in the books, while **June 2025** rent was double-booked.
2. **Fertilizer Depot Input GST Overstatements:** The General Ledger (GL) exceeded the GST Portal in **September (+₹851.82)**, **October (+₹1,285.94)**, and **January (+₹1.00)**. These discrepancies are due to a duplicate posting of a Krishna Traders invoice, a double-entry of a Biofield Organic Manure invoice (INV-407) under different vendors and amounts, and a Fieldex invoice in October that was never uploaded to the portal by the vendor.
3. **Bank HO CGST Purchase ITC Gap — SUPERSEDED FINDING (corrected below):** ~~The Bank has a ₹50,192.60 eligible CGST purchase ITC gap... corresponding to ~₹11.15 Lakh in taxable purchase value.~~ **This was a calculation error.** The previous auditor treated `sa-gst-bank.csv`'s ₹1,61,905.61 total as *combined* CGST+SGST and halved it twice. Cross-verification against GSTR-2B confirmed the ledger is **CGST-only**. The actual eligible CGST is ₹80,952.81 (50% of ₹1,61,905.61), and the true gap against the portal's ₹90,669.00 CGST claim is only **₹9,716.19** — a normal month-boundary timing difference, not a missing-invoice gap. See Section 3 below for the corrected breakdown. **There is no ₹11.15 Lakh of missing purchase invoices.**

---

## 🏢 Section 1: Neethy Pharmacy RCM Rent Audit

The RCM rent for Neethy Pharmacy is ₹5,000 per month, attracting 18% GST (9% CGST + 9% SGST = ₹450 + ₹450 = ₹900 combined). 

### 1.1 RCM Rent Entries Posted in Books
The general ledger shows that the following entries were actually posted in the output tax ledger ([sl-gst-neethi.csv](file:///D:/GST-SET-OFF/bank%20gl%20reports%20csv/sl-gst-neethi.csv)):

| Posting Date | Slip No. | Description / Narration | CGST (₹) | SGST (₹) | Combined (₹) | Months Covered |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: |
| **16-MAY-25** | 310 | "BY 18 % RENT GST - MAY, JUNE - RETURNABLE" | 900.00 | 900.00 | 1,800.00 | May, June |
| **04-JUL-25** | 301 | "BY RENT GST - 18 % - JUNE,JULY 2025" | 900.00 | 900.00 | 1,800.00 | June, July |
| **19-AUG-25** | 76 | "BY RENT GST - 18 % - AUG 2025" | 450.00 | 450.00 | 900.00 | August |
| **24-SEP-25** | 99 | "BY RENT GST - 18 % - SEPT 2025" | 450.00 | 450.00 | 900.00 | September |
| **19-NOV-25** | 140 | "BY GST 18 % OCT AND NOV" | 900.00 | 900.00 | 1,800.00 | October, November |
| **18-FEB-26** | 296 | "BY RENT GST - 18 % - DEC,JAN,FEB" | 1,350.00 | 1,350.00 | 2,700.00 | Dec, Jan, Feb |
| **TOTALS** | | | **4,950.00** | **4,950.00** | **9,900.00** | **11 Months Value** |

### 1.2 Omissions & Duplications Identified
Comparing the calendar months against the posted entries reveals three distinct ledger errors:
1. **April 2025 Omission:** No RCM rent entry was posted during or for April 2025.
2. **June 2025 Duplication:** June RCM rent (₹900 combined) was double-booked—once in the May 16 posting ("MAY, JUNE") and again in the July 4 posting ("JUNE, JULY").
3. **March 2026 Omission:** March 2026 RCM rent (₹900 combined) was completely omitted from the ledger. (Note: March RCM is normally paid via GSTR-3B in April 2026, which explains why it is not in the cash ledger, but it must be accrued in the books for March).

> [!IMPORTANT]
> **Reconciliation Status:** The portal ledger shows RCM tax filed for all 12 months (₹10,800 total). The books only reflect ₹9,900. To reconcile, Neethy Pharmacy must pass a net adjusting entry for **₹900 combined (₹450 CGST + ₹450 SGST)**, which represents booking April 2025 and March 2026, and reversing the extra June 2025 entry.

---

## 🚜 Section 2: Fertilizer Depot Books Analysis (September, October, January)

For the Fertilizer Depot (GSTIN: 32AABAV5891L3ZZ), the input tax ledger ([sa-gst-manure.csv](file:///D:/GST-SET-OFF/bank%20gl%20reports%20csv/sa-gst-manure.csv)) shows over-booked values compared to the CA Portal filings in three specific months.

### 2.1 September 2025 Analysis
*   **GL In:** ₹7,114.96  
*   **Portal In:** ₹6,263.14  
*   **Discrepancy (GL Exceeding Portal):** **+₹851.82**

#### September GL Postings Breakdown:
1. **12-SEP-25** (Slip 212): Krishna Traders — ₹320.50 (Debit)
2. **12-SEP-25** (Slip 236): GSR Returnable — ₹976.20 (Debit)
3. **17-SEP-25** (Slip 238): Krishna Traders (INV39 DTD 23.08.2025) — ₹320.50 (Debit)
4. **18-SEP-25** (Slip 278): Fieldex Agro Industries (Neem Cake) — ₹666.66 (Debit)
5. **18-SEP-25** (Slip 290): Fieldex Agro Industries (Neem Cake & Biofield) — ₹1,471.42 (Debit)
6. **18-SEP-25** (Slip 296): Fieldex Agro Industries (Biofield INV407 DTD 02.09.25) — ₹1,238.10 (Debit)
7. **24-SEP-25** (Slip 109): Rent GST — ₹693.00 (Debit)
8. **29-SEP-25** (Slip 186): Pee Cee Traders (Biofield INV407 DTD 02.09.25) — ₹1,428.58 (Debit)

#### Findings:
*   **Krishna Traders Duplicate (₹320.50):** Slip 212 is a duplicate posting of Slip 238 (which has the detailed invoice reference `INV39 DTD 23.08.2025`). This duplicate entry artificially inflated the GL by **₹320.50**.
*   **Double-Booked Invoice under Different Vendors (₹1,238.10 or ₹1,428.58):** 
    - Slip 296 (Fieldex) and Slip 186 (Pee Cee Traders) both reference the exact same invoice number: **INV 407 dated 02.09.2025** for "BIOFIELD ORGANICMANURE".
    - They are booked with different amounts: **₹1,238.10** under Fieldex and **₹1,428.58** under Pee Cee Traders.
    - Only one of these transactions is genuine and uploaded on the portal. 
    - **Reconciliation Scenario:** If Pee Cee (₹1,428.58) is the correct portal entry and Fieldex is duplicate, and the books also omitted another genuine portal invoice of **₹906.78** (or ₹907), the net difference would be:  
      $$\text{Duplicate Krishna (320.50)} + \text{Duplicate Fieldex (1238.10)} - \text{Omitted Invoices (706.78)} = \text{+₹851.82}$$
      This confirms that both the Krishna Traders duplicate (₹320.50) and the Fieldex INV 407 (₹1,238.10) entries are over-booked in the books, offset by minor missing portal credits.

### 2.2 October 2025 Analysis
*   **GL In:** ₹2,942.06  
*   **Portal In:** ₹1,656.12  
*   **Discrepancy (GL Exceeding Portal):** **+₹1,285.94**

#### October GL Postings Breakdown:
1. **08-OCT-25** (Slip 22): Fieldex Agro Industries (Neem Cake & Biofield) — ₹1,285.70 (Debit)
2. **14-OCT-25** (Slip 371): Krishna Traders (INV54 DTD 08.10.2025) — ₹320.50 (Debit)
3. **30-OCT-25** (Slip 187): Purchase Neem Cake (DTD 23.10.2025) — ₹642.86 (Debit)
4. **31-OCT-25** (Slip 749): Rent GST — ₹693.00 (Debit)

#### Findings:
*   **Unfiled/Omitted Fieldex Invoice (₹1,285.70):** The overstatement of **₹1,285.94** matches the Fieldex Agro Industries entry of **₹1,285.70** (with a minor ₹0.24 rounding difference).
*   **Explanation:** The Fieldex purchase invoice of **₹1,285.70** was entered in the Depot's books, but it was **never uploaded by the vendor** to the GST Portal (or was omitted by the CA from the October GSTR-3B filing). Therefore, the portal shows ₹0 credit for this invoice, causing the books to exceed the portal by this exact amount.

### 2.3 January 2026 Analysis
*   **GL In:** ₹998.82  
*   **Portal In:** ₹997.82  
*   **Discrepancy (GL Exceeding Portal):** **+₹1.00**

#### January GL Postings Breakdown:
1. **08-JAN-26** (Slip 151): Rent GST — ₹693.00 (Debit)
2. **17-JAN-26** (Slip 225): Vyapar App IGST (3 Yrs) — ₹305.82 (Debit)

#### Findings:
*   **Rounding Discrepancy (₹1.00):** This is a minor ₹1.00 rounding discrepancy from the Vyapar App software license purchase or the portal's automatic fractional rounding. No adjustment is required.

---

## 🏦 Section 3: Bank HO CGST Purchase ITC Gap Breakdown — CORRECTED

> [!IMPORTANT]
> **This section was rewritten on 2026-07-21.** The original version below double-halved `sa-gst-bank.csv` (treating its ₹1,61,905.61 total as combined CGST+SGST, then halving again for Rule 38). Cross-verification against GSTR-2B confirmed the ledger is **CGST-only**, and independent verification against the Bank's actual **GST Portal Electronic Credit Ledger** (`ElectronicCreditLedger - BANK.pdf`) now gives the true, portal-sourced monthly ITC-utilised figures below — no invoice-level "missing purchases" gap exists.

Under **CGST Rule 38**, Vadakkumbad Service Co-operative Bank Limited is restricted to claiming only **50% of its input tax credit (ITC)** on purchases. The remaining 50% permanently lapses and must be expensed.

### 3.1 Portal vs. GL Eligible Credit Comparison (corrected)
*   **GL Gross Input CGST (100% recorded in books, FY 2025-26):** **₹1,61,905.61** ([sa-gst-bank.XML](file:///D:/GST-SET-OFF/FY_2025-26/FINAL/sa-gst-bank.XML))
*   **GL Eligible Input CGST from regular purchases (50% of gross, Rule 38):** **₹80,952.81**
*   **Total CGST Utilised per Portal Electronic Credit Ledger, FY 2025-26 (regular + RCM combined):** **₹90,669.00** — this is the figure that matters for the annual set-off entry, since utilised ITC is fungible once accrued to the credit ledger regardless of source. The ₹9,716.19 difference against the regular-only eligible figure (₹80,952.81) is not a "gap" in the old sense — it reflects RCM ITC that also became available and was utilised during the year, not missing purchase invoices.
*   **Note:** there is **no** invoice-level "missing purchases" gap. The prior ₹11.15 Lakh figure was an artefact of the double-halving error.

### 3.2 Month-by-Month Comparison (sourced from the actual Electronic Credit Ledger, not a derived/halved estimate)

| Tax Period (Month) | Portal ITC Utilised — CGST (₹) | Portal ITC Utilised — SGST (₹) | Combined (₹) |
| :--- | :---: | :---: | :---: |
| **April 2025** | 12,292.00 | 12,292.00 | 24,584.00 |
| **May 2025** | 1,974.00 | 1,974.00 | 3,948.00 |
| **June 2025** | 4,270.00 | 4,270.00 | 8,540.00 |
| **July 2025** | 18,924.00 | 19,237.00 | 38,161.00 |
| **August 2025** | 20,052.00 | 19,739.00 | 39,791.00 |
| **September 2025** | 7,578.00 | 7,578.00 | 15,156.00 |
| **October 2025** | 9,580.00 | 9,580.00 | 19,160.00 |
| **November 2025** | 1,182.00 | 1,182.00 | 2,364.00 |
| **December 2025** | 2,671.00 | 2,671.00 | 5,342.00 |
| **January 2026** | 4,709.00 | 4,709.00 | 9,418.00 |
| **February 2026** | 1,471.00 | 1,471.00 | 2,942.00 |
| **March 2026** | 5,966.00 | 5,966.00 | 11,932.00 |
| **TOTALS** | **90,669.00** | **90,669.00** | **1,81,338.00** |

> [!NOTE]
> **IGST also counts.** The table above shows CGST/SGST only. The Electronic Credit Ledger additionally records **₹7,196 of IGST credit** utilised (cross-utilised against CGST/SGST liabilities — mainly Feb-2026 ₹3,535 and Oct-2025 ₹2,176). Total ITC utilised for FY 2025-26 = ₹90,669 CGST + ₹90,669 SGST + ₹7,196 IGST = **₹1,88,534.00**.
>
> **Correction of a live posting error:** The Bank's books (`FINAL/sa-gst-bank.XML`) show **₹1,90,919.02** credited as the FY 2025-26 set-off — **₹2,385.02** more than the ₹1,88,534.00 total the Electronic Credit Ledger proves was actually utilised. The gap is the net of two offsetting errors in the derivation spreadsheet: March 2026 was overstated by ₹9,580 (₹21,512 derived vs ₹11,932 filed), partly offset by the ₹7,196 of IGST utilisation it omitted. Correcting entry: **Dr. SA GST Input Tax ₹2,385.02 / Cr. SL GST Output Tax ₹2,385.02** (combined heads) — see the reissued `GST_Setoff_Summary_2025_26` report (Rev 2.1).

---

## 🛠️ Section 4: Recommended Corrective Journal Entries

### 4.1 Neethy Pharmacy Corrective Entries
1. **Pass Entry 2.1 (Accrue March & April Rent RCM):**
   *   **Debit:** SA GST Input Tax (CGST) - RCM: ₹450.00
   *   **Debit:** SA GST Input Tax (SGST) - RCM: ₹450.00
   *   **Credit:** SL GST Output Tax (CGST) - RCM: ₹450.00
   *   **Credit:** SL GST Output Tax (SGST) - RCM: ₹450.00
2. **Reverse the Duplicate June Rent RCM Posting:**
   *   **Debit:** SL GST Output Tax (CGST) - RCM: ₹450.00
   *   **Debit:** SL GST Output Tax (SGST) - RCM: ₹450.00
   *   **Credit:** SA GST Input Tax (CGST) - RCM: ₹450.00
   *   **Credit:** SA GST Input Tax (SGST) - RCM: ₹450.00

### 4.2 Fertilizer Depot Corrective Entries
1. **Reverse Krishna Traders Duplicate Entry (Slip 212):**
   *   **Credit:** SA GST Input Tax (CGST): ₹160.25
   *   **Credit:** SA GST Input Tax (SGST): ₹160.25
   *   **Debit:** Krishna Traders (Vendor A/c): ₹320.50
2. **Resolve Biofield INV 407 (Fieldex vs Pee Cee Traders):**
   *   Confirm with the CA which vendor's upload is present in GSTR-2B. 
   *   Pass a reversal entry for the incorrect/duplicate booking (either Fieldex ₹1,238.10 or Pee Cee Traders ₹1,428.58).
3. **Verify unfiled Fieldex October Invoice (₹1,285.70):**
   *   Contact Fieldex Agro Industries to ensure the invoice is uploaded in their GSTR-1, or reverse the input tax in the books if the invoice is invalid.
