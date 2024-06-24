// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: rocket;

// Set API variables
const API_KEY = "";
const APP_ID = "";
const TABLE_NAME = "";

// Function to get data from API
async function getData() {
  
  // Query URL
	const url = "https://api.airtable.com/v0/" + APP_ID + "/" + TABLE_NAME + "/?maxRecords=1"
  
  // Make API request
  const newRequest = new Request(url);
  
  // Authenticate for API
  newRequest.headers = { Authorization: "Bearer " + API_KEY };
  
  // Return API response as JSON
	const response = await newRequest.loadJSON();
  return response
}

// Parse and isolate values from Airtable API resopnse 
  const json = await getData();
  const records = json["records"];
  const fields = records["0"]["fields"];
  const rawTimestamp = fields["Timestamp"];
  const rawString = fields["String"];
  const rawNumber = fields["Number"];
  const rawBoolean = fields["Boolean"];
  const rawDuration = fields["Duration"];
  const rawSingleSelectArray = fields["Single-Select Array"];
  const rawMultiSelectArray = fields["Multi-Select Array"];

// Function to create and customize widget UI
async function createWidget() {
  const widget = new ListWidget();
  
  // Add single, solid color background to widget
  //widget.backgroundColor = new Color("#1C1B1D");
  
  // Add gradient background to widget
  const gradient = new LinearGradient();
  gradient.locations = [1, .25];
  gradient.colors = [new Color("#000000"), new Color("#1C1B1D")];
  widget.backgroundGradient = gradient;
  
  // Add widget title
  const title = widget.addText("Title");
  title.font = Font.semiboldSystemFont(16);
  title.textColor = new Color("#ffffff");
  title.centerAlignText();
  widget.addSpacer(5);
  
  // Add static text to widget
	const widgetStaticText = widget.addText("1. Static text");
  widgetStaticText.font = Font.boldSystemFont(10);
  widgetStaticText.textColor = new Color("#ffffff");
  widgetStaticText.leftAlignText();
  widget.addSpacer(.5);

  // Parse day and time from API timestamp response and add to widget
	let timestamp = new Date(rawTimestamp);
  let formatDate = new DateFormatter();
  formatDate.dateFormat = 'MM-dd-YYYY'
  let apiTimestamp = widget.addText("2. " + formatDate.string(timestamp));
 	apiTimestamp.font = Font.semiboldSystemFont(10);
  apiTimestamp.leftAlignText();
  widget.addSpacer(.5);
  
  // Calculate time difference since API timestamp response and add to widget
	let currentDate = new Date();
	let timeDiffMS = currentDate - timestamp;
  let timeDiffSecs = (timeDiffMS / 1000)
  let timeDiffMins = (timeDiffSecs / 60)
  let timeDiffHrs = (timeDiffMins / 60)
  let timeDiffDays = (timeDiffHrs / 24)
  let apiTimeDiff = widget.addText("3. " + timeDiffDays.toFixed(0) + " days");
  apiTimeDiff.font = Font.semiboldSystemFont(10);
  apiTimeDiff.leftAlignText();
  widget.addSpacer(.5);

  // Add string (dynamic text) from API response to widget
	let apiString = widget.addText("4. " + rawString);
 	apiString.font = Font.semiboldSystemFont(10);
  apiString.leftAlignText();
  widget.addSpacer(.5);
  
  // Add number from API response to widget
	let apiNumber = widget.addText("5. " + rawNumber);
 	apiNumber.font = Font.semiboldSystemFont(10);
  apiNumber.leftAlignText();
  widget.addSpacer(.5);
  
  // Add boolean from API response to widget
	let apiBoolean = widget.addText("6. " + rawBoolean);
 	apiBoolean.font = Font.semiboldSystemFont(10);
  apiBoolean.leftAlignText();
  widget.addSpacer(.5);
  
  // Add duration from API response to widget
  let durationMins = (rawDuration / 60)
	let apiDuration = widget.addText("7. " + durationMins + " minutes");
 	apiDuration.font = Font.semiboldSystemFont(10);
  apiDuration.leftAlignText();
  widget.addSpacer(.5);
  
  // Add single select array value from API response to widget
	let apiSingleSelectArray = widget.addText("8. " + rawSingleSelectArray);
 	apiSingleSelectArray.font = Font.semiboldSystemFont(10);
  apiSingleSelectArray.leftAlignText();
  widget.addSpacer(.5);

  // Add multi select array value from API response to widget
	let apiMultiSelectArray = widget.addText("9. " + rawMultiSelectArray);
 	apiMultiSelectArray.font = Font.semiboldSystemFont(10);
  apiMultiSelectArray.leftAlignText(); 
  widget.addSpacer(.5);

  // Return customized widget UI
  return widget;
}

// Display widget
let widget = await createWidget();

// Check where the script is running
if (config.runsInWidget) {
  
  // Run inside a widget when added to the home screen
  Script.setWidget(widget);
} else {
  
  // Otherwise show the small widget preview inside the Scriptable app
  widget.presentSmall();
}
Script.complete();
