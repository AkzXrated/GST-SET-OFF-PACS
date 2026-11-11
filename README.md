# GST Set-Off Voucher Studio

**Standalone Offline Web Application with Memory**  
*Client:* Vadakkumbad Service Co-operative Bank Ltd., Kerala (3 GSTINs)  
*Accounting System:* DITS PacScore Core Accounting  
*Location:* `Software/index.html` (Double-click to run in any browser offline)

---

## 📅 Standard Monthly Workflow (5-Minute Routine)

1. **Download Filed GSTR-3B PDF:**
   - Open government filed **GSTR-3B PDF, Table 6.1**.
   - Note **① Section (A) "Tax paid through ITC"** (sum of IGST+CGST+SGST).
   - Note **② Section (A) "Tax paid in cash"** (sum of IGST+CGST+SGST).
   - Note **Section (B) "Reverse charge" (RCM)** cash challan amount.

2. **Open `Software/index.html`:**
   - Double-click `Software/index.html` in Chrome, Edge, or Firefox.
   - Select your Business Unit (Bank HO, Neethy Store, or Manure Depot) and Tax Month.

3. **Type Figures & Inline Math:**
   - Enter ① ITC, ② Cash, and RCM Challan.
   - Inline math is supported directly (e.g. `186+11010+11196` resolves automatically).
   - Enter the 10-digit RCM / Regular Challan CPIN.

4. **Verify & Review Vouchers:**
   - Confirm the checkbox: **"Verified against filed GSTR-3B PDF Table 6.1"**.
   - Review live vouchers: **Entry 0** (RCM routing), **Entry 1** (ITC set-off), and **Entry 2** (Cash routing).
   - All entries are guaranteed balanced to integer paise.

5. **Copy & Post in PacScore:**
   - Click **"📋 Copy PacScore Voucher"** on each voucher card (or **"📋 Copy All Vouchers"**).
   - Click any narration box to copy the formatted short narration.
   - Post into PacScore core accounting before the 25th of the month.
   - Click **"✓ Mark Posted"** and **"💾 Save to Register"**.

6. **Monthly Backup Export:**
   - Click **"⬇️ Backup"** in the top bar to download a timestamped `.json` file.
   - Restoring data is instant via **"Settings & Backup" → "Import JSON Backup"**.

---

## 🧪 Automated Testing

Run the test suite from the project root:
```bash
node Software/tests/core.test.js
```
Verifies math parsing, voucher balancing, FY helpers, seed numbers, and storage migrations.
