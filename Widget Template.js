// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: rocket;

// Set API variables
const API_TOKEN = "<INSERT API TOKEN HERE>";
const APP_ID = "<INSERT APP ID HERE>";
const TABLE_ID = "<INSERT TABLE ID HERE>";

// Function to get data from API
async function getData() {
  // API URL
  const url = `https://api.airtable.com/v0/${APP_ID}/${TABLE_ID}/?maxRecords=1`;

  // Try/Catch for error handling
  try {
    // Create new API reequest
    const request = new Request(url);

    // Authentication for API request
    request.headers = { Authorization: `Bearer ${API_TOKEN}` };

    // Make API request and load JSON response
    const response = await request.loadJSON();

    // Check if the response is valid
    if (!response || !response.records || response.records.length === 0) {
      throw new Error("No data returned from API.");
    }

    // Log and return data from valid response
    console.log(response);
    return response;
  } catch (error) {
    console.error("Error fetching data from API:", error);

    // Don't return anything if API request fails
    return { records: [] };
  }
}

// Fetch data from API response
const data = await getData();
const records = data["records"];

if (!data) {
  console.error("No data available.");
  return;
}

// Helper function to extract fields from the response
function extractField(records, fieldName) {
  return records.length > 0 ? records[0].fields[fieldName] : null;
}

// Helper function to format date and time
function formatDateTime(rawTimestamp) {
  const timestamp = new Date(rawTimestamp);
  if (isNaN(timestamp.getTime())) return "Invalid Date.";
  const formatDate = new DateFormatter();
  formatDate.dateFormat = DATE_FORMAT;
  return formatDate.string(timestamp);
}

// Helper function to calculate time difference in days
function calculateTimeDifference(timestamp) {
  const apiTimestamp = new Date(timestamp);
  const now = new Date();
  const timeDiffMS = now - apiTimestamp;

  // Convert from milliseconds to days
  return (timeDiffMS / (1000 * 60 * 60 * 24)).toFixed(0);
}

// Helper function to caluclate time duration in minutes
/* function calcuateDuration(duration) {
  const apiDuration = duration
} */

// Set style constants for UI
const DATE_FORMAT = "MM-dd-YYYY";
const TEXT_COLOR = new Color("#FFFF00");
const FONT_SIZE = 10;
const SPACER = 0.5;
const FONT = Font.semiboldSystemFont(FONT_SIZE);

// Helper function to apply consistent text styling to widget
function applyTextStyle(textElement) {
  textElement.font = FONT;
  textElement.textColor = TEXT_COLOR;
  textElement.leftAlignText();
}

// Helper function to dynamically add text fields to widget
function addTextField(widget, prefix, fieldValue) {
  const fieldText = widget.addText(`${prefix} ${fieldValue}`);
  applyTextStyle(fieldText);
  widget.addSpacer(SPACER);
}

// Function to create and customize widget UI
async function createWidget() {
  const widget = new ListWidget();

  // Add single, solid color background to widget
  widget.backgroundColor = new Color("#1C1B1D");

  /* // Add gradient background to widget
  const gradient = new LinearGradient();
  gradient.locations = [1, .25];
  gradient.colors = [new Color("#000000"), new Color("#1C1B1D")];
  widget.backgroundGradient = gradient; */

  // Add widget title
  const title = widget.addText("Title");
  title.font = Font.semiboldSystemFont(16);
  title.textColor = new Color("#FFFFFF");
  title.centerAlignText();
  widget.addSpacer(5);

  // Display date via "timestamp" from API response
  const timestamp = extractField(records, "Timestamp");
  const displayDateTime = widget.addText("1. " + formatDateTime(timestamp));
  applyTextStyle(displayDateTime);
  widget.addSpacer(SPACER);

  // Display calculated time difference in days
  const timeDifference = calculateTimeDifference(timestamp);
  const displayTimeDiff = widget.addText(`2. ${timeDifference} days`);
  applyTextStyle(displayTimeDiff);
  widget.addSpacer(SPACER);

  // Display "string" from API response
  addTextField(widget, "3.", extractField(records, "String"));

  // Display "number" from API response
  addTextField(widget, "4.", extractField(records, "Number"));

  // Display "boolean" from API response
  addTextField(widget, "5.", "testing");

  // Display calculated duration in minutes
  addTextField(widget, "6.", "testing2");

  // Display "single-select array" from API response
  const singleSelectArray = extractField(records, "Single-Select Array");
  addTextField(widget, "7.", singleSelectArray);

  // Display "multi-select array" from API repsonse
  const multiSelectArray = extractField(records, "Multi-Select Array");
  addTextField(widget, "8.", multiSelectArray);

  // Return customized widget UI
  return widget;
}

// Display widget
const widget = await createWidget(data);

// Check where the script is running
if (config.runsInWidget) {

  // Run inside a widget
  Script.setWidget(widget);
} else {
  
  // Otherwise show preview
  widget.presentSmall();
}
Script.complete();
