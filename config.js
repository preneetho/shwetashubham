/* ============================================================
   SHWETA SHUBHAM — SITE CONFIGURATION
   ------------------------------------------------------------
   This is the ONLY file you need to touch to connect the
   website to your Google Sheet.

   1. Open your Google Sheet.
   2. Look at the address bar. It looks like:
      https://docs.google.com/spreadsheets/d/1AbCdEf...XyZ/edit#gid=0
                                             ^^^^^^^^^^^^^^^
                                             this is the ID
   3. Paste that ID between the quotes below.
   4. In the Sheet: Share → General access →
      "Anyone with the link" → Viewer.

   Leave it as "" and the website simply shows the built-in
   content instead. Nothing breaks.
   ============================================================ */

window.SS_CONFIG = {

  SHEET_ID: "",

  /* How long to remember sheet data before re-fetching, in minutes.
     Residents get instant page loads; edits appear within this window.
     Set to 0 to always fetch fresh. */
  CACHE_MINUTES: 10,

  /* Show a small "Updated from sheet" note in the footer. */
  SHOW_STATUS: true

};
