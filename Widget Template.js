// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: window-restore;

// === CONFIGURATION ===
// This section stores all "settings", nothing here should change during execution

const config = {
	apiKey: "<INSERT API KEY HERE>",
	appId: "appHEaSiBocpIp1Yw",
	tableId: "tblaiUHCIOq3LZiDy",
	cacheFile: "airtable-cache.json",
	cacheDurationMs: 5 * 60 * 1000, // 5 minutes
};

// === STYLES ===
// This section defines visual styling (how the UI looks)

// Define colors and fonts
const styles = {
  colors: {
    title: new Color("#FFFFFF"),
    text: new Color("#FFFF00"),
  },
  fonts: {
    title: Font.boldSystemFont(16),
    text: Font.semiboldSystemFont(10),
  },
};

// === HELPERS ===
// This section contains utility functions that transform data (format, convert, calculate, etc.)

// Format date in MM-dd-yyyy
const dateFormatter = new DateFormatter();
dateFormatter.dateFormat = "MM-dd-yyyy";

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
    config.cacheFile
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
  if (cached && Date.now() - cached._fetched < config.cacheDurationMs)
    return cached.fields; // Otherwise, fetch data from API
  try {
    const request = new Request(
      `https://api.airtable.com/v0/${config.appId}/${config.tableId}?maxRecords=1&sort[0][field]=Timestamp&sort[0][direction]=desc`
    );
    request.headers = { Authorization: `Bearer ${config.apiKey}` };
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
// Create generic alignment for text elements
const alignText = (textElement, align) => {
  switch (align) {
    case "center":
      textElement.centerAlignText();
      break;
    case "right":
      textElement.rightAlignText();
      break;
    default:
      textElement.leftAlignText();
  }
};

// Create generic text element
const createText = (widget, text, font, color, align = "left") => {
  const textElement = widget.addText(text);
  textElement.font = font;
  textElement.textColor = color;

  alignText(textElement, align);
  return textElement;
};

// Add title as text element
const addTitle = (widget, text) =>
  createText(widget, text, styles.fonts.title, styles.colors.title, "center");

// Add row as text element
const addTextRow = (widget, numberedRows) =>
  createText(
    widget,
    numberedRows.join("\n"),
    styles.fonts.text,
    styles.colors.text,
    "left"
  );

// === WIDGET ASSEMBLY  ===
// This section is where the widget's UI is created (add images, text, arrange layout, apply styles)

function createWidget(fields) {
  const widget = new ListWidget(); 

  addTitle(widget, "TITLE"); // Widget title
  widget.addSpacer(5);
  
  const {
    Timestamp,
    String: string,
    Number: number,
    Boolean: boolean,
    "Single-Select Array": singleArray,
    "Multi-Select Array": multiArray,
  } = fields || {};

  const timestamp = Timestamp ? new Date(Timestamp) : null; 

  // Data to display in widget
  const widgetData = [
    timestamp ? dateFormatter.string(timestamp) : "N/A",
    daysSince(timestamp),
    string ?? "N/A",
    number ?? "N/A",
    boolean ? "true" : "false",
    arrayToString(singleArray),
    arrayToString(multiArray),
  ]; 
  const numberedRows = widgetData.map((value, i) => `${i + 1}. ${value}`);
  addTextRow(widget, numberedRows); // Number each row of widget data

  return widget; // Return widget with its constructed UI elements
}

// === MAIN EXECUTION ===
// This section is where the program actually runs (fetches all required data, builds the widget, and displays the widget)

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
