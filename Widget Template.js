// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: window-restore;

// === CONFIG ===

// Store API key in Scriptable keychain
Keychain.set(
  "AirtableApiKey",
  "<INSERT API KEY HERE>"
);

// Airtable details
const API_KEY = Keychain.get("AirtableApiKey");
const APP_ID = "appHEaSiBocpIp1Yw";
const TABLE_ID = "tblaiUHCIOq3LZiDy";

// Validate API key
if (!API_KEY) {
  throw new Error("Missing Airtable API Key in Keychain.");
}

// Define UI components
const TITLE_TEXT = "TITLE";
const TITLE_FONT_SIZE = 16;
const BODY_FONT_SIZE = 10;
const DATE_FORMAT = "MM-dd-yyyy";

// Define colors & fonts
const TEXT_COLOR = new Color("#FFFF00");
const TITLE_COLOR = new Color("#FFFFFF");
const ERROR_COLOR = new Color("#FF3B30");
const FONT = Font.semiboldSystemFont(BODY_FONT_SIZE);
const TITLE_FONT = Font.boldSystemFont(TITLE_FONT_SIZE);

// Use date formatter
const dateFormatter = new DateFormatter();
dateFormatter.dateFormat = DATE_FORMAT;

// === RETRIVE DATA ===

// Function to get data from API
async function getData() {
  // API URL
  const url = `https://api.airtable.com/v0/${APP_ID}/${TABLE_ID}?maxRecords=1&sort[0][field]=Timestamp&sort[0][direction]=desc`;

  // Create new API request
  const request = new Request(url);

  // Authentication for API request
  request.headers = { Authorization: `Bearer ${API_KEY}` };

  // Try/catch for error handling of loading API response
  try {
    // Make API request and load response
    const response = await request.loadJSON();

    // Return data from response
    return response?.records?.length ? response.records : null;
  } catch (error) {
    console.error("API Error: " + error.message);

    // Don't return anything if API request errors
    return null;
  }
}

// === UTILS ===

// Format date
function formatDateTime(date) {
  return isNaN(date.getTime()) ? "N/A" : dateFormatter.string(date);
}

// Calculate time difference in days
function calculateTimeDifference(date) {
  const diff = Date.now() - date.getTime();
  return isNaN(diff) ? "N/A" : Math.round(diff / 86400000);
}

// Convert boolean to string
function determineBoolean(value) {
  return value ? "true" : "false";
}

// Convert array to comma separated string
function formatArrayField(value) {
  return Array.isArray(value) ? value.join(", ") : value ?? "N/A";
}

// === CREATE WIDGET ===

function createWidget(records) {
  const widget = new ListWidget();

  // Title
  const title = widget.addText(TITLE_TEXT);
  title.font = TITLE_FONT;
  title.textColor = TITLE_COLOR;
  title.centerAlignText();
  widget.addSpacer(5);

  // Extract fields from data
  const fields = records?.[0]?.fields ?? {};
  const timestampRaw = fields.Timestamp;
  const timestamp = timestampRaw ? new Date(timestampRaw) : null;
  const duration = fields.Duration;
  const stringField = fields.String;
  const numberField = fields.Number;
  const booleanValue = fields.Boolean;
  const singleSelectArray = fields["Single-Select Array"];
  const multiSelectArray = fields["Multi-Select Array"];

  // Display data as new lines in widget
  const lines = [
    "1. " + (timestamp ? formatDateTime(timestamp) : "N/A"),
    "2. " + (timestamp ? calculateTimeDifference(timestamp) + " days" : "N/A"),
    "3. " + (stringField ?? "N/A"),
    "4. " + (numberField ?? "N/A"),
    "5. " + determineBoolean(booleanValue),
    "6. " + formatArrayField(singleSelectArray),
    "7. " + formatArrayField(multiSelectArray),
  ];

  const textBlock = widget.addText(lines.join("\n"));
  textBlock.font = FONT;
  textBlock.textColor = TEXT_COLOR;
  textBlock.leftAlignText();

  return widget;
}

// === EXECUTE SCRIPT  ===

// Use data retrieved from API response
const records = await getData();
const widget = records
  ? createWidget(records)
  : createErrorWidget("Unable to load data");

// Check where script is running
if (config.runsInWidget) {
  // Run inside a widget
  Script.setWidget(widget);
} else {
  // Otherwise show preview
  widget.presentSmall();
}

Script.complete();
