// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: window-restore;

// === CONFIGURATION ===
// This section stores all "settings", nothing here should change during execution

const CONFIG = {
	apiKey: "<INSERT API KEY HERE>",
	appId: "appHEaSiBocpIp1Yw",
	tableId: "tblaiUHCIOq3LZiDy",
	cacheFile: "airtable-cache.json",
	cacheDurationMs: 5 * 60 * 1000 // 5 minutes
};

// === STYLES ===
// This section defines visual styling (how the UI looks)

// Format date in MM-dd-yyyy
const dateFormatter = new DateFormatter();
dateFormatter.dateFormat = "MM-dd-yyyy";

// Define colors and fonts
const STYLES = {
  colors: {
    title: new Color("#FFFFFF"),
    text: new Color("FFFF00"),
  },
  fonts: {
    title: Font.boldSystemFont(16),
    text: Font.semiboldSystemFont(10),
  },
};

// === HELPERS ===
// This section contains utility functions that transform data (format, convert, calculate, etc.)

// Calculate time difference (in days)
const daysSince = (date) =>
  date instanceof Date ? Math.round((Date.now() - date) / 86400000) : "N/A";

// Convert array to comma separated string
const arrayToString = (array) =>
  Array.isArray(array) ? array.join(", ") : array ?? "N/A";

// === NETWORK & API CLIENT ===
// This section contains all functions that use the internet (fetching from API, downloading images, saving/reading cached responses)

// Retrieve data from cache if valid, otherwise fetch from API
async function getData(useCache = true) {
  const fileManager = FileManager.local();
  const cachePath = fileManager.joinPath(
    fileManager.documentsDirectory(),
    CONFIG.cacheFile
  ); // Read cached data
  const readCache = () => {
    if (!fileManager.fileExists(cachePath)) return null;
    try {
      return JSON.parse(fileManager.readString(cachePath));
    } catch {
      return null;
    }
  };
  const cached = useCache ? readCache() : null; // Return cached fields if cached data is valid
  if (cached && Date.now() - cached._fetched < CONFIG.cacheDurationMs)
    return cached.fields; // Otherwise, fetch data from API
  try {
    const request = new Request(
      `https://api.airtable.com/v0/${CONFIG.appId}/${CONFIG.tableId}?maxRecords=1&sort[0][field]=Timestamp&sort[0][direction]=desc`
    );
    request.headers = { Authorization: `Bearer ${CONFIG.apiKey}` };
    const response = await request.loadJSON();
    const fields = response.records?.[0]?.fields || null; // Update cache with newly fetched data
    if (fields)
      fileManager.writeString(
        cachePath,
        JSON.stringify({ _fetched: Date.now(), fields })
      );
    return fields;
  } catch (error) {
    console.error("API Error");
    return cached?.fields || null;
  }
}

// === UI COMPONENTS ===
// Generic text element
function createText(
  stack,
  text,
  font = STYLE.font,
  color = STYLE.color,
  align = "center"
) {
  const line = stack.addText(text);
  line.font = font;
  line.textColor = color;
  switch (align) {
    case "center":
      line.centerAlignText();
      break;
    case "left":
      line.leftAlignText();
      break;
    case "right":
      line.rightAlignText();
      break;
  }
  return line;
}

// Title text
function addTitle(widget, text) {
  return createText(
    widget,
    text,
    STYLES.fonts.title,
    STYLES.colors.title,
    "center"
  );
}

// Text rows
function addTextRow(widget, numberedLines) {
  return createText(
    widget,
    numberedLines.join("\n"),
    STYLES.fonts.text,
    STYLES.colors.text,
    "left"
  );
}

// === WIDGET ASSEMBLY  ===
// This section is where the widget's UI is created (add images, text, arrange layout, apply styles)

function createWidget(fields) {
  const widget = new ListWidget(); // Widget title
  addTitle(widget, "TITLE");
  widget.addSpacer(5);

  const timestamp = fields?.Timestamp ? new Date(fields.Timestamp) : null; // Data to display
  const widgetData = [
    timestamp ? dateFormatter.string(timestamp) : "N/A",
    daysSince(timestamp),
    fields?.String ?? "N/A",
    fields?.Number ?? "N/A",
    fields?.Boolean ? "true" : "false",
    arrayToString(fields?.["Single-Select Array"]),
    arrayToString(fields?.["Multi-Select Array"]),
  ]; // Number each line of widget data
  const numberedLines = widgetData.map((value, i) => `${i + 1}. ${value}`);
  addTextRow(widget, numberedLines); // Return widget with its constructed UI elements

  return widget;
}

// === MAIN EXECUTION ===
// This section is where the prgram actually runs (fetches all required data, builds the widget, and displays the widget)

const data = await getData(true); // Get data
const widget = createWidget(data); // Build widget
// Check if script is running inside a widget
if (config.runsInWidget) {
  // Run inside a widget
  Script.setWidget(widget);
} else {
  // Otherwise show widget preview
  widget.presentSmall(); // Display widget
}

Script.complete();
