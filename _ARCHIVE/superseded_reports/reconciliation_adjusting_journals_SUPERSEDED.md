# Adjusted GST Year-End Journal Entries (FY 2025-26) - REVISED
**Vadakkumbad Service Co-operative Bank Limited**  
*Audit Reference Document: Revised Books to Portal Reconciliation & Corrective Vouchers*

---

## 📋 EXECUTIVE SUMMARY & PRE-POSTING AUDIT ACTION LIST
This document has been revised to correct **three critical layout/valuation errors** and address the **major purchase invoice omissions** in the Bank and Depot ledgers. Follow the ordered action list below:

### Ordered Action List:
| Step | Action | Status / Urgency | Business Unit |
| :--- | :--- | :--- | :--- |
| **1** | Extract the actual closing balance of the `GST Paid to Govt` ledger from your software. | **Do First** | All 3 Entities |
| **2** | Ask the CA for the Depot's missing purchase invoice list (GSTR-2B details). | **Urgent** | Fertilizer Depot |
| **3** | Ask the CA for the Bank's complete GSTR-2B invoice listing to match portal claims. | **Urgent** | Bank (HO) |
| **4** | Pass **all Neethi entries** (Entries 2.1, 2.2A, 2.2B, 2.3). Neethi is clean and ready. | **Ready to Pass** | Neethy Pharmacy |
| **5** | Pass Depot 3.2 (Challan) and corrected 3.3 (Set-off). **Hold 3.1.** | **Ready to Pass** | Fertilizer Depot |
| **6** | Pass Bank entries 1.1, 1.2, 1.4. **Hold 1.3** until `GST Paid to Govt` balance is confirmed. | **Ready to Pass** | Bank (HO) |
| **7** | Once missing invoices are received from the CA, book them vendor-by-vendor and close. | **Pending Lists** | Bank & Depot |

---

## 1. HO BANK (GSTIN: 32AABAV5891L1Z1)
### Key Audit Updates:
*   **🚨 ₹9.1 Lakh Omitted Purchases:** GSTR-3B filings show ₹90,669.00 CGST credit claimed, but books only show ₹80,952.81 gross (equivalent to ₹40,476.40 eligible). The bank is missing ~₹9.1 Lakh of purchase invoices in its books. **Entry 1.3 is on HOLD** until the CA provides the GSTR-2B invoice details and they are entered.
*   **Rule 38 Reversal & RCM Accrual:** Entries 1.1, 1.2, and 1.4 can be passed now. Verify the rent contract amount before passing 1.2.

---

### Adjusting Journal Entries:

#### **Entry 1.1: Reversal of 50% Ineligible Regular Purchase ITC (Rule 38)**
*   **Status: PASS NOW**
*   **Accounting Voucher:**
    | Ledger Account Head | Dr/Cr | Amount (₹) |
    | :--- | :---: | :---: |
    | **GST Ineligible ITC Expense A/c** | **Dr** | **80,952.81** |
    | &nbsp;&nbsp;&nbsp;&nbsp;To SA GST Input Tax (CGST) | Cr | 40,476.40 |
    | &nbsp;&nbsp;&nbsp;&nbsp;To SA GST Input Tax (SGST) | Cr | 40,476.41 |
*   **Narration:** *Being permanent reversal of 50% ineligible Input Tax Credit on purchases under CGST Rule 38 for FY 2025-26.*

#### **Entry 1.2: Accrual of Omitted RCM Liabilities & Eligible Credit**
*   **Status: PASS NOW (Verify rent lease contract first)**
*   **Accounting Voucher:**
    | Ledger Account Head | Dr/Cr | Amount (₹) |
    | :--- | :---: | :---: |
    | **SA GST Input Tax (CGST) - RCM Eligible (50%)** | **Dr** | **9,184.50** |
    | **SA GST Input Tax (SGST) - RCM Eligible (50%)** | **Dr** | **9,184.50** |
    | **GST RCM Expense A/c (Ineligible 50% RCM Tax)** | **Dr** | **18,369.00** |
    | &nbsp;&nbsp;&nbsp;&nbsp;To SL GST Output Tax (CGST) - RCM Liability | Cr | 18,369.00 |
    | &nbsp;&nbsp;&nbsp;&nbsp;To SL GST Output Tax (SGST) - RCM Liability | Cr | 18,369.00 |
*   **Narration:** *Being accrual of unregistered RCM liabilities and 50% eligible input credit on rent and other services for FY 2025-26.*

#### **Entry 1.3: Reallocation of Paid Challans (RCM & Regular Cash)**
*   **Status: HOLD (Pending GL balance verification & missing purchase invoices)**
*   **Accounting Voucher:**
    | Ledger Account Head | Dr/Cr | Amount (₹) |
    | :--- | :---: | :---: |
    | **SL GST Output Tax (CGST)** | **Dr** | **227,736.18** |
    | **SL GST Output Tax (SGST)** | **Dr** | **227,736.18** |
    | &nbsp;&nbsp;&nbsp;&nbsp;To GST Paid to Govt | Cr | 455,472.36 |
*   **Narration:** *Being transfer of challan payments from temporary ledger to close RCM and regular output liabilities.*

#### **Entry 1.4: Year-End Regular GST Set-Off**
*   **Status: PASS NOW**
*   **Accounting Voucher:**
    | Ledger Account Head | Dr/Cr | Amount (₹) |
    | :--- | :---: | :---: |
    | **SL GST Output Tax (CGST)** | **Dr** | **49,660.90** |
    | **SL GST Output Tax (SGST)** | **Dr** | **49,660.90** |
    | &nbsp;&nbsp;&nbsp;&nbsp;To SA GST Input Tax (CGST) | Cr | 49,660.90 |
    | &nbsp;&nbsp;&nbsp;&nbsp;To SA GST Input Tax (SGST) | Cr | 49,660.90 |
*   **Narration:** *Being year-end set-off of SL Output against available eligible SA Input credit (including RCM).*

---

## 2. NEETHY PHARMACY (GSTIN: 32AABAV5891L2Z0)
### Key Audit Updates:
*   **❌ Error Corrected:** Added **Entry 2.2B** to transfer Neethy's regular cash payments of **₹66,228.16** (₹33,114.08 CGST + ₹33,114.08 SGST) from `GST Paid to Govt`. This clears the remaining `SL GST Output` balance, matching the portal exactly.
*   **Status:** **CLEAN AND READY.** All Neethy entries can be passed today.

---

### Adjusting Journal Entries:

#### **Entry 2.1: Accrual of Missing 1-Month RCM Rent**
*   **Status: PASS NOW**
*   **Accounting Voucher:**
    | Ledger Account Head | Dr/Cr | Amount (₹) |
    | :--- | :---: | :---: |
    | **SA GST Input Tax (CGST) - RCM** | **Dr** | **450.00** |
    | **SA GST Input Tax (SGST) - RCM** | **Dr** | **450.00** |
    | &nbsp;&nbsp;&nbsp;&nbsp;To SL GST Output Tax (CGST) - RCM | Cr | 450.00 |
    | &nbsp;&nbsp;&nbsp;&nbsp;To SL GST Output Tax (SGST) - RCM | Cr | 450.00 |
*   **Narration:** *Being accrual of missed 1-month RCM Rent liability and input credit for FY 2025-26.*

#### **Entry 2.2A: Reallocation of RCM Challan Payments**
*   **Status: PASS NOW**
*   **Accounting Voucher:**
    | Ledger Account Head | Dr/Cr | Amount (₹) |
    | :--- | :---: | :---: |
    | **SL GST Output Tax (CGST) - RCM** | **Dr** | **5,400.00** |
    | **SL GST Output Tax (SGST) - RCM** | **Dr** | **5,400.00** |
    | &nbsp;&nbsp;&nbsp;&nbsp;To GST Paid to Govt | Cr | 10,800.00 |
*   **Narration:** *Being transfer of monthly RCM challan payments from GST Paid to Govt to close out RCM output liabilities.*

#### **Entry 2.2B: Reallocation of Regular Output Cash Payments**
*   **Status: PASS NOW**
*   **Accounting Voucher:**
    | Ledger Account Head | Dr/Cr | Amount (₹) |
    | :--- | :---: | :---: |
    | **SL GST Output Tax (CGST)** | **Dr** | **33,114.08** |
    | **SL GST Output Tax (SGST)** | **Dr** | **33,114.08** |
    | &nbsp;&nbsp;&nbsp;&nbsp;To GST Paid to Govt | Cr | 66,228.16 |
*   **Narration:** *Being transfer of regular output cash payments from GST Paid to Govt to close out regular SL GST Output liability for FY 2025-26.*

#### **Entry 2.3: Year-End Regular GST Set-Off**
*   **Status: PASS NOW**
*   **Accounting Voucher:**
    | Ledger Account Head | Dr/Cr | Amount (₹) |
    | :--- | :---: | :---: |
    | **SL GST Output Tax (CGST)** | **Dr** | **321,678.87** |
    | **SL GST Output Tax (SGST)** | **Dr** | **321,678.87** |
    | &nbsp;&nbsp;&nbsp;&nbsp;To SA GST Input Tax (CGST) | Cr | 321,678.87 |
    | &nbsp;&nbsp;&nbsp;&nbsp;To SA GST Input Tax (SGST) | Cr | 321,678.87 |
*   **Narration:** *Being year-end set-off of outstanding output liability against available input tax credits.*

---

## 3. FERTILIZER DEPOT (GSTIN: 32AABAV5891L3ZZ)
### Key Audit Updates:
*   **❌ Error Corrected:** **Entry 3.3 set-off amount corrected to ₹8,169.29** (regular output only). Setting off ₹12,017 would have over-debited `SL GST Output` since RCM was already cleared via Entry 3.2.
*   **New Carry-Forward Balances:** Since Depot's ITC exceeds its output liability, there is no year-end cash payment. After set-off, the Depot has a net **SA GST Input carry-forward asset of ₹12,901.89 CGST + ₹12,901.89 SGST = ₹25,803.78 total** to carry forward as opening ITC in FY 2026-27.
*   **🚨 Procedural Block on Entry 3.1:** Do not book missing purchases as a generic credit to "Creditors". **Hold Entry 3.1** until the CA provides the GSTR-2B details to enter invoices vendor-by-vendor.

---

### Adjusting Journal Entries:

#### **Entry 3.1: Accrual of Missing Regular Purchase Invoices**
*   **Status: HOLD (Do not pass until detailed CA invoice listing is available)**
*   **Accounting Voucher:**
    | Ledger Account Head | Dr/Cr | Amount (₹) |
    | :--- | :---: | :---: |
    | **Purchase / Cost of Goods Sold A/c** | **Dr** | **122,464.22** |
    | **SA GST Input Tax (CGST) - Missing purchases** | **Dr** | **11,021.78** |
    | **SA GST Input Tax (SGST) - Missing purchases** | **Dr** | **11,021.78** |
    | &nbsp;&nbsp;&nbsp;&nbsp;To [Actual Vendor Ledgers (Separate Credits)] | Cr | 144,507.78 |
*   **Narration:** *Being booking of regular purchase invoices and inputs omitted from books in FY 2025-26 (to be entered individually).*

#### **Entry 3.2: Reallocation of RCM Challan Payments**
*   **Status: PASS NOW**
*   **Accounting Voucher:**
    | Ledger Account Head | Dr/Cr | Amount (₹) |
    | :--- | :---: | :---: |
    | **SL GST Output Tax (CGST) - RCM** | **Dr** | **4,158.00** |
    | **SL GST Output Tax (SGST) - RCM** | **Dr** | **4,158.00** |
    | &nbsp;&nbsp;&nbsp;&nbsp;To GST Paid to Govt | Cr | 8,316.00 |
*   **Narration:** *Being transfer of monthly RCM challan payments from GST Paid to Govt to close out RCM output liabilities.*

#### **Entry 3.3: Corrected Year-End Regular GST Set-Off**
*   **Status: PASS NOW**
*   **Accounting Voucher:**
    | Ledger Account Head | Dr/Cr | Amount (₹) |
    | :--- | :---: | :---: |
    | **SL GST Output Tax (CGST)** | **Dr** | **8,169.29** |
    | **SL GST Output Tax (SGST)** | **Dr** | **8,169.29** |
    | &nbsp;&nbsp;&nbsp;&nbsp;To SA GST Input Tax (CGST) | Cr | 8,169.29 |
    | &nbsp;&nbsp;&nbsp;&nbsp;To SA GST Input Tax (SGST) | Cr | 8,169.29 |
*   **Narration:** *Being year-end set-off of outstanding regular output liabilities against regular input tax credits (regular only).*
