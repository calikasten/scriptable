// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: rocket;

// Set API variables
const API_TOKEN = "INSERT API TOKEN HERE";
const APP_ID = "INSERT APP ID HERE";
const TABLE_ID = "INSERT TABLE ID HERE";

// Set constant for static text used in widget title
const TITLE = "TITLE";

// Function to get data from API
async function getData() {
  
  // API URL
  const url = `https://api.airtable.com/v0/${APP_ID}/${TABLE_ID}/?maxRecords=1`;

  // Try...catch for error handling
  try {
    
    // Create new API reequest
    const request = new Request(url);

    // Authentication for API request
    request.headers = { Authorization: `Bearer ${API_TOKEN}` };

    // Parameters for API request
    request.body = { field: "Timestamp", direction: "desc" };

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

// Helper function to extract fields from the response
function extractField(records, fieldName) {
  return records.length > 0 ? records[0].fields[fieldName] : null;
}

// Helper function to format date
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

// Helper function to calculate time duration in minutes
function calcuateDuration(duration) {
  return duration ? duration / 60 : 0;
}

// Helper function for handling boolean response
function determineBoolean(boolean) {
  if (boolean === undefined) return "false";
  return boolean;
}

// Helper function to dynamically add a new list element
function addNewListElement(widget, prefix, fieldValue) {
  const fieldText = widget.addText(`${prefix} ${fieldValue}`);
  applyTextStyle(fieldText);
  widget.addSpacer(SPACER);
}

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

// Function to create and customize widget UI
async function createWidget() {
  const widget = new ListWidget();

  // Add widget title
  const title = widget.addText(TITLE);
  title.font = Font.semiboldSystemFont(16);
  title.textColor = new Color("#FFFFFF");
  title.centerAlignText();
  widget.addSpacer(5);

  // Add "timestamp" from API response to widget list
  const timestamp = extractField(records, "Timestamp");
  const displayDateTime = widget.addText("1. " + formatDateTime(timestamp));
  applyTextStyle(displayDateTime);
  widget.addSpacer(SPACER);

  // Add calculated time difference in days to widget list
  const timeDifference = calculateTimeDifference(timestamp);
  const displayTimeDiff = widget.addText(`2. ${timeDifference} days`);
  applyTextStyle(displayTimeDiff);
  widget.addSpacer(SPACER);

  // Add calculated duration in minutes to widget list
  const duration = extractField(records, "Duration");
  const durationMins = calcuateDuration(duration);
  const displayDuration = widget.addText(`3. ${durationMins} minutes`);
  applyTextStyle(displayDuration);
  widget.addSpacer(SPACER);

  // Add "string" from API response to widget list
  addNewListElement(widget, "4.", extractField(records, "String"));

  // Add "number" from API response to widget list
  addNewListElement(widget, "5.", extractField(records, "Number"));

  // Add "boolean" from API response to widget list
  const boolean = extractField(records, "Boolean");
  const trueFalse = determineBoolean(boolean);
  const displayBoolean = widget.addText(`6. ${trueFalse}`);
  applyTextStyle(displayBoolean);
  widget.addSpacer(SPACER);

  // Add "single-select array" from API response to widget list
  const singleSelectArray = extractField(records, "Single-Select Array");
  addNewListElement(widget, "7.", singleSelectArray);

  // Add "multi-select array" from API response to widget list
  const multiSelectArray = extractField(records, "Multi-Select Array");
  addNewListElement(widget, "8.", multiSelectArray);

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
