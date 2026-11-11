in our banking software we need help regarding accounting of gst.
for purchase bills 
purchase head = dr. = taxable amount 
sa gst I/p tax head = dr. = cgst + sgst amount
similarly 
sales head = cr. = taxable amount 
sl gst o/p tax head = cr. = cgst + sgst amount
..
now after accounting for 01-04-2025 to 31-03-2025
both heads have balances.
how do I sett off using gst website uploaded data (which gst ca does for us).
what statements do I need to download and how to quickly cross check.

Jun 15

Synthesized GST reconciliation mechanics and portal data extraction strategy
Synthesized GST reconciliation mechanics and portal data extraction strategy
Good question — and a very common pain point when books and portal data are maintained by different people (you vs CA). Let me break this down cleanly.

First — A Small Correction
The period you mentioned: 01-04-2025 to 31-03-2025 is likely a typo. Assuming you mean FY 2025–26 (01-04-2025 to 31-03-2026).

How GST Set-off Works (Books Side)
Your current head balances after a full year of accounting:

Head  Nature  Balance
SA GST I/P Tax (CGST) Asset Dr balance
SA GST I/P Tax (SGST) Asset Dr balance
SL GST O/P Tax (CGST) Liability Cr balance
SL GST O/P Tax (SGST) Liability Cr balance
Set-off Rule (Post 2019 Amendment)
CGST ITC → settles CGST liability only
SGST ITC → settles SGST liability only
(Cross-utilization between CGST and SGST is not allowed)

Journal Entries for Set-off
Case 1 — Output > Input (Net Tax Payable)
SL GST O/P Tax (CGST)     Dr   [Full Cr balance]
    SA GST I/P Tax (CGST)      Cr   [ITC utilised]
    Bank / GST Cash Payable    Cr   [Difference paid in cash]

SL GST O/P Tax (SGST)     Dr   [Full Cr balance]
    SA GST I/P Tax (SGST)      Cr   [ITC utilised]
    Bank / GST Cash Payable    Cr   [Difference paid in cash]
Case 2 — Input > Output (ITC Remaining / Carry Forward)
SL GST O/P Tax (CGST)     Dr   [Full Cr balance]
    SA GST I/P Tax (CGST)      Cr   [Equal to output — fully absorbed]

[Remaining I/P CGST balance carries forward as asset to next year]
Note: After set-off entries, both output heads should be zero. Input heads will be zero (if fully utilised) or show a carried-forward Dr balance (if ITC excess).

What to Download from GST Portal
Ask your CA (or login yourself) and pull these 3 things:

1. GSTR-3B — All 12 Filed Returns (Apr 25 to Mar 26)
Where: GST Portal → Returns → Returns History → GSTR-3B → each month PDF/summary

What to extract from each month:

Table 3.1 → Outward supply taxable value + CGST + SGST
Table 4A → ITC claimed (CGST + SGST)
Table 6.1 → Tax paid (ITC utilised + Cash paid)
Sum all 12 months → Annual totals

2. Electronic Credit Ledger
Where: GST Portal → Services → Ledgers → Electronic Credit Ledger

Shows running ITC balance. The closing balance as on 31-03-2026 = what should remain in your SA GST I/P heads after set-off.

3. Electronic Cash Ledger
Where: GST Portal → Services → Ledgers → Electronic Cash Ledger

Shows all cash deposited and utilised for GST payment. Cross-verify against your Bank account debits for GST challan payments.

Quick Cross-Check Table
Run this verification after getting portal data:

What to Match Books Figure  Portal Figure Should Be
Total Output CGST (FY)  Sum of SL GST O/P CGST entries  Sum of GSTR-3B Table 3.1 CGST Equal
Total Output SGST (FY)  Sum of SL GST O/P SGST entries  Sum of GSTR-3B Table 3.1 SGST Equal
Total ITC CGST claimed  Sum of SA GST I/P CGST entries  Sum of GSTR-3B Table 4A CGST  Equal
Total ITC SGST claimed  Sum of SA GST I/P SGST entries  Sum of GSTR-3B Table 4A SGST  Equal
Cash paid CGST  Sum of bank debits (challan)  Electronic Cash Ledger CGST Equal
Cash paid SGST  Sum of bank debits (challan)  Electronic Cash Ledger SGST Equal
Closing ITC balance SA GST I/P heads after set-off  Electronic Credit Ledger closing  Equal
Practical Advice
If your CA files GSTR-3B monthly and pays tax monthly — then set-off should ideally be done month-by-month in books too, not just at year-end. Many small setups skip this and accumulate balances, then reconcile annually — which is what you're doing now.

The cleanest way to reconcile: Ask CA to give you a month-wise summary sheet with:

Output tax (CGST/SGST) per month
ITC utilised (CGST/SGST) per month
Cash paid per month
Then pass one composite annual set-off entry (or 12 monthly entries if your software needs month-wise detail) matching exactly those figures.

Once books match portal → your GST heads are clean for FY 2025–26.

Want me to build a small Excel reconciliation template where you paste the 12-month GSTR-3B data and it auto-calculates the set-off journal entry figures?

one more thing. 
we pay rent to unregistered individual so rcm also needs to be applied. 
ca properly show rcm in gst website. 
but we use 18 % of taxable rent on cr. at sl gst output tax and dr. at sa gst input tax so they cancels out.
help me with this, explain in simpler way with examples and all. first time doing. and yes generate a execl sheet for me for better understanding.

Jun 15

Architected multi-sheet Excel tracker clarifying RCM mechanics with practical examples
Architected multi-sheet Excel tracker clarifying RCM mechanics with practical examples
Let me first explain this clearly, then build the Excel.

RCM on Rent — Simple Explanation
What is happening here?
You pay rent to an unregistered person (no GST number). Normally, the seller collects GST and pays to government. But since your landlord is unregistered, you must calculate and pay the GST yourself on his behalf. This is called Reverse Charge Mechanism (RCM).

The Key Thing You're Missing
Your current approach of Dr I/P ↔ Cr O/P is correct in concept — but they should NOT just cancel and disappear. Here's why:

RCM Output tax MUST be paid in CASH to the government first. Only AFTER that cash payment, the ITC (Input) becomes available to you.

So the real flow is 3 steps, not 2:

Example — Monthly Rent = ₹20,000
Step 1 — Pay rent to landlord (no GST to him)

Rent Expense A/c        Dr   ₹20,000
    To Bank                      Cr   ₹20,000
Step 2 — Book RCM liability + ITC claim in books

SA GST I/P Tax (RCM-CGST)   Dr   ₹1,800   ← Your ITC asset
SA GST I/P Tax (RCM-SGST)   Dr   ₹1,800   ← Your ITC asset
    To SL GST O/P Tax (RCM-CGST)    Cr   ₹1,800   ← Your liability to Govt
    To SL GST O/P Tax (RCM-SGST)    Cr   ₹1,800   ← Your liability to Govt
Step 3 — Pay RCM cash to Government (via GST portal challan)

SL GST O/P Tax (RCM-CGST)   Dr   ₹1,800
SL GST O/P Tax (RCM-SGST)   Dr   ₹1,800
    To Bank                           Cr   ₹3,600
After Step 3 → O/P Tax = Zero. I/P Tax = ₹3,600 Dr (ITC asset sitting).

Step 4 — Use ITC to absorb your regular forward-charge output tax (at year end set-off)

SL GST O/P Tax (Regular)    Dr   ₹3,600
    SA GST I/P Tax (RCM)          Cr   ₹3,600
Why it can't just "cancel out" directly
Books O/P (Cr)  Books I/P (Dr)
Meaning Liability — you owe Govt ₹3,600 Asset — Govt owes you ₹3,600 back as ITC
When it clears  When you pay cash to Govt When you use ITC against forward charge output
Cash impact -₹3,600 from bank +₹3,600 ITC credit back from Govt
Net cash impact = Zero — but only AFTER the cash goes out and comes back as ITC. If you skip the cash payment, you have a GST liability pending.

Now let me build the Excel sheet:


Orchestrated Excel sheet with GST RCM calculations successfully
Orchestrated Excel sheet with GST RCM calculations successfully
Zero errors, 99 formulas — all clean. Let me share it:


Presented file
Presented file
What's inside the Excel (4 sheets)
Sheet 1 — RCM Concept — All 4 journal entry steps with example amounts laid out clearly. Printable reference.

Sheet 2 — Monthly RCM Tracker — Enter your actual monthly rent in yellow cells (currently pre-filled ₹20,000 as example). It auto-calculates CGST, SGST, total RCM, and ITC available. Also enter what was actually paid to Govt — it shows if there's any shortfall.

Sheet 3 — Annual Journal Entry — The 4 consolidated annual entries auto-pull figures from Sheet 2. Ready to give to your CA or for your own books verification.

Sheet 4 — Portal Reconciliation — Enter your CA's portal figures in yellow cells. It compares with books and shows ✔ MATCH or ✘ MISMATCH with exact difference.

One Important Heads-Up for Your Bank
At the bottom of Sheet 4 I've flagged this — cooperative banks fall under Section 17(2) of CGST Act, which means ITC may be restricted based on the ratio of taxable vs exempt supplies. Your CA needs to confirm:

Whether full RCM ITC is claimable, or
Whether a portion needs to be reversed (reversed = treated as expense, not ITC)
If ITC is partially reversible, the I/P head should only show the eligible portion. The rest hits your expense head. Your CA handling the GST filing would already know this — just confirm it with them.


Gst rcm rent tracker fy2025 26
Spreadsheet · XLSX 
now this is not how I wanted the excel sheet to look like. 
format. 
first date range selection 
then 
detailed input fields for monthly data sa gst and sl gst. (as per general ledger aka bank's software)
then input data from gst portal (provide guidance on how to get them)
then input monthly rent details (right now rcm gst is accounted in sa gst and sl gst input and output tax heads)
..
provide complete guidance, any changes to make if required.
detailed excel software with dynamically adjustments and formulas.

Jun 15

Check recalc script location
Check recalc script location
Continue

Jun 15

Diagnosed spreadsheet formula errors and devised fixes
Diagnosed spreadsheet formula errors and devised fixes
Continue

Jun 16

Validated formulas and prepared deliverable
Validated formulas and prepared deliverable
Zero errors, 331 formulas — clean. Here it is:


Presented file
Presented file
What's in the file — 5 Sheets
Sheet 1 — Setup
FY dropdown (2022-23 to 2027-28) — change it and all months across every sheet auto-update
Org name, branch name
CGST and SGST rates (default 9% each — editable)
Colour legend and step-by-step workflow guide
Important note on the RCM accounting change you need to make
Sheet 2 — Books Monthly
Enter from your banking software general ledger for each month:

Section What to enter
SA GST I/P (columns C–F)  Regular ITC (CGST/SGST) + RCM ITC (CGST/SGST) separately
SL GST O/P (columns H–K)  Regular output (CGST/SGST) + RCM output (CGST/SGST) separately
RCM Cash Paid (columns M–N) Actual challan payment to Govt (CGST/SGST)
Set-off done (columns P–Q)  Only if you already passed set-off entry monthly
Cross-check columns S and T show ✔ OK if your RCM I/P = RCM O/P (as it must be). Net closing balances auto-calculate at the bottom.

Sheet 3 — Rent & RCM
Enter monthly rent amount (yellow) — CGST/SGST auto-calculate from Setup rates
Columns H and I pull RCM entries directly from Books Monthly sheet
Columns J and K show ✔ OK / ✘ DIFF — tells you instantly if your GL entries match
Enter cash paid to Govt — shows shortfall if any
Sheet 4 — Portal GSTR-3B
12 months of GSTR-3B data entry (all yellow — enter from CA's filings)
Four sections: Table 3.1(a) sales, Table 3.1(d) RCM, Table 4A ITC, Cash Ledger
Below the data table: full portal navigation guide — exactly where to click on the GST portal to find each number, what to look for, and what to type in
Sheet 5 — Reconciliation
Section A — Books vs Portal line-by-line: 11 comparison rows, each showing Books figure / Portal figure / Difference / ✔ MATCH or ✘ MISMATCH

Section B — Closing balances: Net ITC available (SA GST I/P) and Net O/P liability (SL GST O/P) auto-computed after adjusting for cash paid and set-offs

Section C — Year-end set-off journal entry auto-generated with exact CGST and SGST amounts — copy these directly into your banking software

Section D — Remaining carry-forward ITC and any remaining cash payable after set-off

One Thing to Do Immediately
In your banking software, for every month where RCM was booked, you need to check if the challan payment entry was also passed:

SL GST O/P Tax (RCM)   Dr   ₹3,600
    To Bank                      Cr   ₹3,600
If this is missing for any month, your SL GST O/P head is overstated by that amount. The Reconciliation sheet will catch this — it'll show a mismatch in the "RCM Cash Paid" row. Let me know if you want help tracing that.


Gst sa sl tax reconciliation tool
Spreadsheet · XLSX 

GST_SA_SL_Tax_Reconciliation_Tool.xlsx
xlsx

GSTR3B_32AABAV5891L3ZZ_072025.pdf
pdf


Electronic_Cash_Ledger.csv
csv

I started filling. 
Portal GSTR-3B sheet is very confusing. 
but your guide is helping me. 
check the inputted data. look for any improvements. 
analyse other details and guide.

Jun 18

Verified data integrity and prepared editing strategy
Verified data integrity and prepared editing strategy
continue.

Jun 19

Reconciled financial discrepancies and identified critical RCM cash obligations
Reconciled financial discrepancies and identified critical RCM cash obligations
Confirmed — ₹354 each (₹708 total) correctly isolated as the mandatory cash-only RCM obligation. Here's the updated file:


Presented file
Presented file
What I Checked and Found
I cross-referenced all three files: your filled Excel, the July 2025 GSTR-3B PDF, and the full-year Electronic Cash Ledger.

Good news first — your July entries in the Portal sheet match the PDF exactly (taxable value 39,370, CGST/SGST 694.25, RCM 347 each, ITC 4,658.25). Your April RCM entries also independently match the Cash Ledger perfectly. The tool and your data entry are both working correctly.

Finding 1 — The Cash Ledger let me fill 10 months for you (orange notes)
I noticed your "RCM Cash Paid" columns in both Books Monthly and Portal sheets were all zero, even though the Cash Ledger shows GST challan payments happening every single month. The portal organizes RCM payments by "Tax Period" — rent accrued in month X gets paid via challan in month X+1 (the normal return-filing lag). I traced this through the whole ledger and filled in the actual confirmed amounts for May, Jun, Aug–Feb (orange-tinted notes mark these as "from Cash Ledger — verify your Bank GL"). I left March as pending — that payment happens in April 2026, outside this FY's ledger window. This isn't an error, just the standard timing lag.

Action for you: Check your bank account statement on these challan-payment dates (19-May, 18-Jun, 17-Jul, 18-Aug, 17-Sep, 21-Oct, 19-Nov, 20-Dec, 15-Jan, 17-Feb, 18-Mar) and confirm a Dr SL GST O/P (RCM) / Cr Bank entry exists for each in your actual banking software. If it doesn't, that's a missing journal entry to pass.

Finding 2 — Important legal point the Reconciliation sheet now flags
I added a new line (Section D, row 3) showing ₹354 CGST + ₹354 SGST = ₹708 total RCM that's accrued in books but not yet cash-paid. This is almost entirely March's RCM (pending, normal) plus a tiny rounding gap. The critical point: this ₹708 must be paid in cash via challan — it can never be set off against your ITC pool, regardless of how healthy your overall ITC balance looks. The general set-off math in Section C treats all ITC and O/P as one pool for simplicity, but RCM specifically is cash-only by law. I've made this explicit now so it doesn't get accidentally netted away.

Finding 3 — A genuine ₹1/month rounding inconsistency (minor)
Your books booked RCM at a flat ₹347 every month. The portal's actual figures show ₹346 for August through February (7 months). On ₹3,850 rent, 9% is exactly ₹346.50 — your books round up, the portal rounded down for those months. Total impact: ₹7 per tax head for the year — immaterial, but worth asking your CA why the portal's self-invoice entry wasn't consistent. Easy to standardize going forward.

Finding 4 — The one that needs real investigation
For July, your books show Regular ITC of ₹1,243.52 (CGST), but the actual filed GSTR-3B shows ₹4,658.25. That's a ₹3,414 gap — too large to be timing alone. Common causes: some purchase bills for July hadn't been posted to the GST I/P head yet when you entered this row, or the GL entry captured only a partial batch of invoices. I'd suggest pulling your July purchase register and checking it against the GSTR-2B for that month before treating the annual reconciliation as final.

Smaller cleanup
I fixed a blank cell in your Portal sheet (August row, regular CGST column had gone blank instead of 0 — harmless for totals but worth tidying).

Once you get the remaining 10 months of Regular sales/ITC figures from your CA (the RCM portion is now done), the Reconciliation sheet's Section A will give you a true annual match. Want me to help you build a quick checklist or email to send your CA asking for exactly those 10 months in one summary table, so you're not hunting through PDFs?


Gst sa sl tax reconciliation tool updated
Spreadsheet · XLSX 
now one big issue. 
we dont have rent rcm heads. 
we have purchase 
sales 
sa gst input 
sl gst output 
that's all. 
we account rcm in sa and sl in equal amounts so they cancel out each year.

...
also a bigger note. 
we have 3 gstin no. 
neethi medicals store - 100 % output gst claimable
manure depot - 100 % output gst claimable
bank  - 50 % output gst claimable - due to cooperative banks kerala relaxation of taxes on interest.
... 
help me with updated accounting.  in simpler terms.

Show more
Jun 19

Reconciled multi-GSTIN ITC eligibility with simplified four-head accounting structure
Reconciled multi-GSTIN ITC eligibility with simplified four-head accounting structure
Got it — this changes things significantly. Let me reframe everything using only the four heads you actually have, and build in the GSTIN-specific ITC rules.

Part 1 — RCM Using Only Your 4 Existing Heads
Good news: you don't need new heads. The mistake isn't the heads you're using — it's that you're stopping after step 1. RCM has two distinct journal entries, not one combined "cancel-out" entry.

Step 1 — Book the liability and the ITC claim (at the time rent is paid)

Dr  SA GST I/P Tax     [CGST + SGST]
    Cr  SL GST O/P Tax       [CGST + SGST]
Step 2 — Actually pay that amount to the government in cash (separate entry, next month)

Dr  SL GST O/P Tax     [CGST + SGST]
    Cr  Bank                  [CGST + SGST]
Only Step 1 nets to zero on paper. It does not discharge your actual liability — that only happens through Step 2, when real money leaves your bank account via the GST challan. If you only post Step 1 every month and never post Step 2, two things go wrong silently: your SL GST O/P head keeps appearing artificially "settled" even though government still hasn't been paid that month, and the real cash that left your bank account for the challan has no matching entry in your GST head — it's probably landing in a suspense account or getting absorbed into "Bank charges" or similar by whoever's reconciling the bank statement.

The fix costs you nothing structurally — same 4 heads, just add the missing Step 2 entry every month, dated to match your actual challan payment date.

Part 2 — Three GSTINs, Three Different ITC Rules
This is the bigger one. Each GSTIN gets a different rule because of what kind of supply it makes:

GSTIN Why ITC You Can Actually Claim
Neethi Medical Store  Pure taxable trading, no exempt income  100% of GST paid
Manure/Fertilizer Depot Pure taxable trading, no exempt income  100% of GST paid
Bank (core banking) Interest income is GST-exempt; banks get a flat simplified option instead of complex pro-rata reversal  50% of GST paid (the other 50% permanently lapses — you can never claim it later)
The 50% rule for the bank is most likely Rule 38 of the CGST Rules — a simplified option specifically for banking companies and NBFCs, letting them claim a flat 50% instead of calculating exact exempt-vs-taxable ratios every month. Your CA would confirm if this is the exact rule being followed, but operationally it works exactly as you described: half claimable, half not, every single month, no carry-forward of the unclaimed half.

Where this changes your accounting
Sales side — no change for any GSTIN. Output tax is output tax; the 50% rule never touches what you charge customers or owe the government on sales. Continue crediting full SL GST O/P Tax everywhere.

Purchase side — this is where it splits.

For Medical Store and Depot purchases, nothing changes from what you're already doing:

Purchase ₹10,000 + GST 18% (900 CGST + 900 SGST)

Dr  Purchase                10,000
Dr  SA GST I/P Tax (CGST)      900
Dr  SA GST I/P Tax (SGST)      900
    Cr  Creditor/Bank              11,800
For Bank purchases, only half the tax becomes I/P Tax — the other half gets absorbed straight into the Purchase cost itself (since it's gone forever, it's effectively part of what the item cost you):

Same purchase, but under Bank's GSTIN

Dr  Purchase             10,900   ← 10,000 + the lapsed ₹900 (half of total tax)
Dr  SA GST I/P Tax (CGST)   450   ← only half of 900
Dr  SA GST I/P Tax (SGST)   450   ← only half of 900
    Cr  Creditor/Bank             11,800
Notice the total payable (₹11,800) is identical either way — you're not paying the vendor any differently. What changes is how much of that tax you can later recover from the government as ITC.

RCM rent, now combined with the 50% rule (if the rent is under the Bank's GSTIN)
This combines both fixes above. The full liability still goes to government in cash — the 50% rule only affects how much of it the bank gets back as ITC.

Rent ₹3,850/month, RCM @ 9%+9% = ₹346 + ₹346

STEP 1 — Pay rent to landlord (unchanged)
Dr  Purchase (Rent)        3,850
    Cr  Bank                       3,850

STEP 2 — Book RCM liability (FULL) + ITC (HALF only, since this is Bank's GSTIN)
Dr  Purchase (Rent)          346   ← the lapsed half of the tax, added to cost
Dr  SA GST I/P Tax (CGST)    173   ← half of 346
Dr  SA GST I/P Tax (SGST)    173   ← half of 346
    Cr  SL GST O/P Tax (CGST)      346   ← FULL liability, not halved
    Cr  SL GST O/P Tax (SGST)      346   ← FULL liability, not halved

STEP 3 — Pay RCM cash to government (FULL amount — RCM is always 100% cash, this never gets a 50% break)
Dr  SL GST O/P Tax (CGST)    346
Dr  SL GST O/P Tax (SGST)    346
    Cr  Bank                       692
The rule to remember: the 50% restriction only ever touches what lands in SA GST I/P Tax. It never reduces what you owe in SL GST O/P Tax, and RCM cash payment is always 100%, no exceptions.

If the same rent is paid under Depot's or Medical Store's GSTIN instead, skip the 50% split entirely and use the original 4-step version I gave you earlier — full ITC, no lapse.

One practical note: since these are three separate GSTINs, each one files its own GSTR-3B and has its own Electronic Cash/Credit Ledger on the portal — they can't be reconciled together in one combined "SA GST I/P" balance without losing visibility into which entity owns what. The Excel tool we built was tracking what's actually the Depot's GSTIN (32AABAV5891L3ZZ) specifically.

Want me to rebuild the Excel as three GSTIN-specific tabs — Bank (with the 50% split baked into formulas), Depot, and Medical Store — each with its own reconciliation, so they don't get mixed up?

more confusion lets avoid bank's gst (50% claim) for now talk about neethi and manure.
so instead of creating new rcm ip and op heads, lets use sa gst and sl gst heads.
but the confusion is that right now when we pay gst to the government,
we actually don't touch the sa gst or sl gst heads, 
the accounting is as followngs 
GST Paid to Govt. head. 
Dr. Amount paid to gvt (net amount after ca calculations I hope)
Cr. Bank account the same amount. 
-
we don't actually pay in cash. all are paid through challan generated at gst portal.

Jun 20

Identified structural gap between GST payment recording and liability heads
Identified structural gap between GST payment recording and liability heads
Good catch — this explains a lot. You actually have a third head in play (GST Paid to Govt) that's currently running completely disconnected from SA GST I/P and SL GST O/P. That disconnect is the real root cause of the "balances never shrink" problem. Let me untangle it using only your existing heads — no new ones needed.

First, to answer your parenthetical worry
Yes — the amount your CA gives you to debit to GST Paid to Govt is the correct net cash figure (output minus available ITC, with RCM topped up separately since RCM is always 100% cash). I checked this against your actual July GSTR-3B: your CA's calculation showed ₹694 regular output fully wiped out by ITC (zero cash needed there), and ₹347+₹347 RCM paid fully in cash. Net cash that month = ₹694, and that's almost certainly the figure that landed in your GST Paid to Govt entry for July. Your CA's math is correct.

The actual problem
Your current payment entry is:

Dr  GST Paid to Govt    694
    Cr  Bank                 694
This correctly records the cash leaving the bank. But it never touches SA GST I/P or SL GST O/P — so neither head ever shrinks. Meanwhile, the RCM booking entry you already do (Dr SA I/P / Cr SL O/P) keeps adding to both every month. Result: both heads just keep growing all year, completely disconnected from the real cash payment sitting in a separate head.

There are actually two missing entries, not one. Both use only heads you already have.

Missing Entry 1 — The set-off (no cash, no Bank involved)
Every month, some of your output tax gets wiped out by ITC, with zero cash changing hands. This needs its own journal line — it's currently not recorded anywhere.

Using July's real numbers (₹694 output fully covered by ITC):

Dr  SL GST O/P Tax (CGST)    694
Dr  SL GST O/P Tax (SGST)    694
    Cr  SA GST I/P Tax (CGST)     694
    Cr  SA GST I/P Tax (SGST)     694
Narration: "ITC utilised against July output, per GSTR-3B filed 19-Aug-2025"

Missing Entry 2 — Route the cash payment through SL O/P first
Instead of debiting GST Paid to Govt directly, the cash payment should first discharge the SL GST O/P liability it's actually settling (the RCM portion, ₹347+₹347 for July), and only then move to GST Paid to Govt → Bank:

Dr  SL GST O/P Tax (CGST)    347
Dr  SL GST O/P Tax (SGST)    347
    Cr  GST Paid to Govt          694

Dr  GST Paid to Govt          694
    Cr  Bank                          694
If GST Paid to Govt is just there for your own MIS visibility (a quick "how much cash GST did we pay this year" figure) rather than a head that needs to balance to zero, you can simplify this into one line and skip the middle step entirely:

Dr  SL GST O/P Tax (CGST)    347
Dr  SL GST O/P Tax (SGST)    347
    Cr  Bank                          694
What happens once you add these two entries every month
I ran the July numbers through both entries to check the math actually closes properly:

SA GST I/P for July: +₹4,658.25 (regular purchases) + ₹347 (RCM booking) − ₹694 (set-off used) = net +₹4,311.25 carried forward

This exactly matches your actual GSTR-3B's "Net ITC available" figure (₹5,005.25) minus what got used (₹694) that same month. Your books would now show the true unused ITC balance, matching the government portal in real time — not a mystery growing number.

SL GST O/P for July: +₹694.25 (sales) + ₹347 (RCM booking) − ₹694 (set-off) − ₹347 (cash paid) = net ≈ ₹0.25 left (just a rounding sliver, nothing to worry about)

This is the real win: once you add these two entries every month using the figures your CA already calculates for GSTR-3B, SL GST O/P settles to almost zero every single month, and SA GST I/P shows your genuine carried-forward ITC pool — both matching the portal. You stop needing a confusing year-end catch-up entirely; the heads stay clean continuously.

If doing this monthly feels like too much right now, you can still do exactly this — just once a year, using annual totals instead of monthly ones, which is what the Reconciliation sheet's Section C already calculates for you.

so what we did was. built up the sa and sl according to our book of records. 
never touched electronic cash or credit ledger, never tried gst 2b,3b,1 etc.
never sett off monthly.
and once our ca does all this and ask us to pay the challan generated by them, we pay I think the net amount and then just show it in our books with a head name GST Paid to govt. and credit entry the bank account. 
(unlike others when bank account is debited, we show that in credit side in our general ledger aka book of accounts.)
now understand the situation and give us step by step corrective measure for the entire year. 
and from now on so we can file monthly and set off.

Jun 20

Reconstructed disconnected GST accounting and formulated corrective methodology
Reconstructed disconnected GST accounting and formulated corrective methodology
This makes complete sense now — and it explains exactly why both heads have been growing unchecked all year. Let's fix it for Neethi Medical Store and Manure Depot, using only the heads you already have: Purchase, Sales, SA GST I/P, SL GST O/P, GST Paid to Govt, and Bank.

Why This Happened
GST Paid to Govt and SA/SL GST have been running as two completely separate, unconnected systems all year. One records "how much cash we sent to the government" (via Bank). The other records "how much output tax we owe minus how much input tax we can claim" (via your purchase/sales/RCM entries). Nothing ever told the second system that the first one had already settled part of the bill. So both kept climbing independently — they were never designed to talk to each other.

The fix doesn't need new heads. It needs one missing link: SL GST O/P should be the one getting reduced — both when ITC sets off against it, and when cash actually gets paid against it. Right now neither reduction is happening.

Part 1 — The One-Time Catch-Up for the Year Already Passed
You'll need two numbers for each GSTIN, for the full year:

Number 1 — Total ITC actually utilised against output (CGST and SGST separately). This is what your CA's monthly GSTR-3B calculations already work out internally (it's the "tax paid through ITC" line they use to figure out your challan amount) — ask them for the annual total of just this one line.

Number 2 — Total cash actually paid to government for the year. You already have this — it's simply the closing balance of your GST Paid to Govt head for the GSTIN, for the year. Since your transactions are all intra-state (no IGST anywhere, confirmed from the Depot's filed return), you can safely split that single figure 50:50 into CGST and SGST.

Once you have both numbers, pass this single corrective entry per GSTIN:

Dr  SL GST O/P Tax (CGST)    [Number 1 CGST + Number 2 CGST]
Dr  SL GST O/P Tax (SGST)    [Number 1 SGST + Number 2 SGST]
    Cr  SA GST I/P Tax (CGST)        [Number 1 CGST]
    Cr  SA GST I/P Tax (SGST)        [Number 1 SGST]
    Cr  GST Paid to Govt              [Number 2 CGST + Number 2 SGST combined]
What this does: SL GST O/P drops by everything that's actually been resolved all year (whether through ITC or through cash) — what's left over is your genuine outstanding liability (should be close to zero, or just one month's RCM if there's a timing lag). SA GST I/P drops by what ITC was actually used — what's left is your real carry-forward ITC balance. GST Paid to Govt finally closes to zero, since the cash sitting there has now been matched against the liability it was meant to pay.

A quick sanity check once you've done this: your leftover SA GST I/P balance should roughly match the Electronic Credit Ledger's closing balance on the portal, and your leftover SL GST O/P should be small. If either is wildly off, that's a sign some figure your CA gave you doesn't match what's actually filed — worth asking them to double check before finalising.

Part 2 — One New Monthly Habit, Going Forward
Your two existing monthly entries (recording purchases/sales, and the RCM Dr SA / Cr SL booking) stay exactly as they are — don't change those. You're just adding one new entry each month, right after your CA tells you the GSTR-3B figures (usually mid-following-month):

Dr  SL GST O/P Tax (CGST)    [this month's ITC used + this month's cash paid, CGST]
Dr  SL GST O/P Tax (SGST)    [this month's ITC used + this month's cash paid, SGST]
    Cr  SA GST I/P Tax (CGST)        [this month's ITC used, CGST]
    Cr  SA GST I/P Tax (SGST)        [this month's ITC used, SGST]
    Cr  GST Paid to Govt              [this month's cash paid, combined]
Then your existing payment entry continues unchanged:

Dr  GST Paid to Govt    [cash amount]
    Cr  Bank                  [cash amount]
All you need to ask your CA for, every month, is two numbers instead of one: not just "the challan amount," but "the challan amount, split into how much was ITC and how much was cash." Most CAs already have this split sitting in their working file — they're just giving you the final net number right now. Once you have both pieces every month, both your GST heads stay clean continuously, and you'll never need a year-end scramble again.

If you want, I can rebuild the Excel tool around this exact 6-head structure (dropping the separate RCM-head framing entirely) so it matches what you're actually doing in your software — want me to do that next?


