// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: window-restore;

// === CONFIGURATION ===
const API_KEY =
  "<INSERT API KEY HERE>";
const APP_ID = "appHEaSiBocpIp1Yw";
const TABLE_ID = "tblaiUHCIOq3LZiDy";
const CACHE_FILE = "airtable_cache.json";
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// === HELPER FUNCTIONS ===
// Format date in MM-dd-yyyy
const dateFormatter = new DateFormatter();
dateFormatter.dateFormat = "MM-dd-yyyy";

// Calculate time difference (in days)
const daysSince = (date) =>
  date instanceof Date ? Math.round((Date.now() - date) / 86400000) : "N/A";

// Convert array to comma separated string
const arrayToString = (array) =>
  Array.isArray(array) ? array.join(", ") : array ?? "N/A";

// === FETCH DATA ===
// Retrieve data from cache
async function getData(useCache = true) {
  const fileManager = FileManager.local();
  const cachePath = fileManager.joinPath(
    fileManager.documentsDirectory(),
    CACHE_FILE
  ); 
  
  // Read cached data
  const readCache = () => {
    if (!fileManager.fileExists(cachePath)) return null;
    try {
      return JSON.parse(fileManager.readString(cachePath));
    } catch {
      return null;
    }
  };
  const cached = useCache ? readCache() : null; 
  
  // Return cached fields if cached data is valid
  if (cached && Date.now() - cached._fetched < CACHE_DURATION_MS)
    return cached.fields; 
  
  // Otherwise, fetch data from API
  try {
    const request = new Request(
      `https://api.airtable.com/v0/${APP_ID}/${TABLE_ID}?maxRecords=1&sort[0][field]=Timestamp&sort[0][direction]=desc`
    );
    request.headers = { Authorization: `Bearer ${API_KEY}` };
    const response = await request.loadJSON();
    const fields = response.records?.[0]?.fields || null; 
    
    // Update cache with newly fetched data
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

// === WIDGET CREATION ===
function createWidget(fields) {
  const widget = new ListWidget(); 
  
  // Add title
  const title = widget.addText("TITLE");
  title.font = Font.boldSystemFont(16);
  title.textColor = new Color("#FFFFFF");
  title.centerAlignText();
  widget.addSpacer(5);

  const timestamp = fields?.Timestamp ? new Date(fields.Timestamp) : null; 
  
  // Add data fields
  const widgetData = [
    timestamp ? dateFormatter.string(timestamp) : "N/A",
    daysSince(timestamp),
    fields?.String ?? "N/A",
    fields?.Number ?? "N/A",
    fields?.Boolean ? "true" : "false",
    arrayToString(fields?.["Single-Select Array"]),
    arrayToString(fields?.["Multi-Select Array"]),
  ]; 
  
  // Number each line of text
  const lines = widgetData.map((value, i) => `${i + 1}. ${value}`);
  const text = widget.addText(lines.join("\n"));
  text.font = Font.semiboldSystemFont(10);
  text.textColor = new Color("#FFFF00");
  text.leftAlignText();

  return widget;
}

// === EXECUTE SCRIPT ===
(async () => {
  const data = await getData(true);
  const widget = createWidget(data); 
  
  // Check where script is running
  if (config.runsInWidget) {
    // Run inside a widget
    Script.setWidget(widget);
  } else {
    // Otherwise show widget preview
    widget.presentSmall();
  }

  Script.complete();
})();
