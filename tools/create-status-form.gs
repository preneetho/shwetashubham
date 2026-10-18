/*
 * ONE-TIME SETUP FOR "UPDATE SOCIETY STATUS"
 *
 * 1. Open script.google.com while signed into the society Google account.
 * 2. Create a project, replace Code.gs with this file, and run
 *    createStatusUpdateForm().
 * 3. Approve Google's permission prompt.
 * 4. Open Execution log and save the FORM URL on the committee phones.
 *
 * The script creates a Google Form and connects it to the same spreadsheet
 * the website already reads. Committee members use only the form; they never
 * need to open or edit the response sheet.
 */

var STATUS_CONTENT_SHEET_ID = "1q5g835WiZntkqVduc4kMhLitrrsXT3ddp4ttI3AaiTs";
var STATUS_RESPONSE_TAB = "status_updates";

function createStatusUpdateForm() {
  var spreadsheet = SpreadsheetApp.openById(STATUS_CONTENT_SHEET_ID);
  if (spreadsheet.getSheetByName(STATUS_RESPONSE_TAB)) {
    throw new Error(
      "The '" + STATUS_RESPONSE_TAB + "' tab already exists. " +
      "Delete it only if this form has never been used, then run setup again."
    );
  }

  var oldIds = {};
  spreadsheet.getSheets().forEach(function (sheet) {
    oldIds[sheet.getSheetId()] = true;
  });

  var form = FormApp.create("Update Society Status")
    .setDescription(
      "Committee use only. Publish a short service update for residents, " +
      "mark everything normal, or show/hide the Society Status panel."
    )
    .setConfirmationMessage(
      "Status saved. The resident website normally updates within one minute."
    )
    .setCollectEmail(false)
    .setProgressBar(true);

  var action = form.addMultipleChoiceItem()
    .setTitle("Action")
    .setHelpText(
      "Enable/Disable controls whether residents see the whole status panel."
    )
    .setRequired(true);

  var updatePage = form.addPageBreakItem()
    .setTitle("Update one service")
    .setHelpText("Keep the message short and useful to residents.");

  form.addListItem()
    .setTitle("Service")
    .setChoiceValues([
      "Water supply",
      "Electricity / DG",
      "Lifts",
      "Swimming pool",
      "Gate access"
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Status")
    .setChoiceValues(["Normal", "Advisory", "Maintenance", "Disrupted"])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle("Resident message")
    .setHelpText(
      "Example: Block C lift is under repair. Expected to reopen by 2 PM."
    )
    .setRequired(true);

  form.addListItem()
    .setTitle("Valid for")
    .setChoiceValues(["1 hour", "4 hours", "End of today", "Until resolved"])
    .setRequired(true);

  updatePage.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  action.setChoices([
    action.createChoice("Update a service", updatePage),
    action.createChoice("Mark everything normal", FormApp.PageNavigationType.SUBMIT),
    action.createChoice("Enable Society Status on website", FormApp.PageNavigationType.SUBMIT),
    action.createChoice("Disable Society Status on website", FormApp.PageNavigationType.SUBMIT)
  ]);

  /* Print the links before connecting the response sheet. If Google takes
     longer than expected to create the tab, the form can still be recovered
     from the execution log without creating a duplicate. */
  console.log("FORM URL (save this on committee phones): " + form.getPublishedUrl());
  console.log("FORM EDIT URL (society account only): " + form.getEditUrl());

  form.setDestination(FormApp.DestinationType.SPREADSHEET, STATUS_CONTENT_SHEET_ID);
  var responseSheet = null;
  for (var attempt = 0; attempt < 12 && !responseSheet; attempt++) {
    Utilities.sleep(1000);
    SpreadsheetApp.flush();
    var refreshed = SpreadsheetApp.openById(STATUS_CONTENT_SHEET_ID);
    refreshed.getSheets().forEach(function (sheet) {
      if (!oldIds[sheet.getSheetId()]) responseSheet = sheet;
    });
  }
  if (!responseSheet) {
    throw new Error(
      "Google created the form but its response tab is still loading. " +
      "Do not run setup again. Refresh the spreadsheet and rename the new " +
      "'Form Responses' tab to '" + STATUS_RESPONSE_TAB + "'."
    );
  }
  responseSheet.setName(STATUS_RESPONSE_TAB);
  responseSheet.setFrozenRows(1);

  /* Safe default: the new feature remains invisible until a committee member
     deliberately chooses Enable in the form. */
  responseSheet.appendRow([
    new Date(),
    "Disable Society Status on website",
    "",
    "",
    "",
    ""
  ]);
}
