// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: paw;

// === CONFIGURATION ==
const API_TOKEN = "<INSERT API TOKEN HERE>";
const APP_ID = "app1PnYsdLk3i0N6S";
const TABLE_ID = "tbl4cXnZhwuW1TBj4";

// List of activities as Airtable views to surface as list elements
const views = [
  { name: "Pee", emoji: "💛" },
  { name: "Poop", emoji: "💩" },
  { name: "Walk", emoji: "🚶" },
  { name: "Food", emoji: "🍗" },
];

// === STYLES ===
// Format font sizes
const TITLE_FONT = Font.semiboldSystemFont(20);
const LIST_TEXT_FONT = Font.semiboldSystemFont(14);
const LIST_SUFFIX_FONT = Font.systemFont(12);

// Format font colors
const TEXT_COLOR = Color.white();
const SUFFIX_TEXT_COLOR = Color.white();

// Format background color
const WIDGET_BACKGROUND_COLOR = new Color("1C1B1D");

// === HELPERS ===
// Calculate time difference
function timeDiff(timestampStr) {
  if (!timestampStr) return "N/A";
  const date = new Date(timestampStr);
  const diffMS = new Date() - date;
  return (diffMS / (1000 * 60 * 60)).toFixed(1);
}

// Apply consistent styling to list elements
function applyTextStyle(widget, emoji, timeDiff) {
  const listElements = widget.addStack();
  listElements.centerAlignContent();
  listElements.layoutHorizontally();
  listElements.setPadding(5, 6, 0, 0); 
  
  // Style emoji
  const emojiText = listElements.addText(`${emoji} `);
  emojiText.font = Font.semiboldSystemFont(14); 
  
  // Style time difference text
  const timeDiffText = listElements.addText(`${timeDiff} `);
  timeDiffText.textColor = Color.white();
  timeDiffText.font = Font.semiboldSystemFont(14); 
  
  // Style "hours ago" suffix text
  const suffixStack = listElements.addStack();
  suffixStack.layoutVertically();
  suffixStack.addSpacer(4);
  const suffixText = suffixStack.addText("hours ago");
  suffixText.textColor = Color.gray();
  suffixText.font = Font.systemFont(12);
  return listElements;
}

// === API CLIENT ===
// Function to get data from API
async function fetchLatestTimestamp(viewName) {
  const url = `https://api.airtable.com/v0/${APP_ID}/${TABLE_ID}?maxRecords=1&view=${encodeURIComponent(
    viewName
  )}&sort[0][field]=Timestamp&sort[0][direction]=desc`;
  try {
    const request = new Request(url);
    request.headers = {
      Authorization: `Bearer ${API_TOKEN}`,
    };
    const response = await request.loadJSON(); 
    
    // Check if the response is valid, log response, and return data
    if (response.records.length === 0) return null;
    console.log(response.records[0].fields["Timestamp"]);
    return response.records[0].fields["Timestamp"];
  } catch (error) {
    console.error(`Error fetching data from API for ${viewName}.`);
    return null;
  }
}

// === UI COMPONENTS ===
async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#1C1B1D"); 
  
  // Widget title
  const title = widget.addText("Barley 🐶");
  title.centerAlignText();
  title.font = Font.semiboldSystemFont(20);
  title.textColor = new Color("#ffffff");
  widget.addSpacer(); 
  
  // Add a list entry for each activity with its most recent timestamp
  for (let view of views) {
    const timestamp = await fetchLatestTimestamp(view.name);
    applyTextStyle(widget, view.emoji, timeDiff(timestamp));
  }
  widget.addSpacer(); 
  
  // Return widget with its constructed UI elements
  return widget;
}

// === WIDGET ASSEMBLY ===
let widget = await createWidget();

// === MAIN EXECUTION ===
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentSmall();
}
Script.complete();
