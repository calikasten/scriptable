// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: paw;

// === CONFIGURATION ==
const CONFIG = {
  apiKey: "<INSERT API TOKEN HERE>",
  appId: "app1PnYsdLk3i0N6S",
  tableId: "tbl4cXnZhwuW1TBj4"
};

// List of activities as Airtable views to surface as list elements
const views = [
  { name: "Pee", emoji: "💛" },
  { name: "Poop", emoji: "💩" },
  { name: "Walk", emoji: "🚶" },
  { name: "Food", emoji: "🍗" },
];

// === STYLES ===
// Format font size and color
const STYLES = {
  fonts: {
    title: Font.semiboldSystemFont(20),
    text: Font.semiboldSystemFont(14),
    suffix: Font.systemFont(8)
  },
  colors: {
    text: Color.white(),
    suffix: Color.gray(),
  		background: new Color ("1C1B1D")
  }
};

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
  emojiText.font = STYLES.fonts.text;
  
  // Style time difference text
  const timeDiffText = listElements.addText(`${timeDiff} `);
  timeDiffText.font = STYLES.fonts.text;
  timeDiffText.textColor = STYLES.colors.text;
  
  // Style "hours ago" suffix text
  const suffixStack = listElements.addStack();
  suffixStack.layoutVertically();
  suffixStack.addSpacer(4);
  const suffixText = suffixStack.addText("hours ago");
  suffixText.font = STYLES.fonts.suffix;
  suffixText.textColor = STYLES.colors.suffix;
  return listElements;
}

// === API CLIENT ===
// Function to get data from API
async function fetchLatestTimestamp(viewName) {
  const url = `https://api.airtable.com/v0/${CONFIG.appId}/${CONFIG.tableId}?maxRecords=1&view=${encodeURIComponent(
    viewName
  )}&sort[0][field]=Timestamp&sort[0][direction]=desc`;
  try {
    const request = new Request(url);
    request.headers = {
      Authorization: `Bearer ${CONFIG.apiKey}`,
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

// === WIDGET ASSEMBLY ===
async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = STYLES.colors.background;
  
  // Widget title
  const title = widget.addText("Barley 🐶");
  title.centerAlignText();
  title.font = STYLES.fonts.title;
  title.textColor = STYLES.colors.text;
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

// === MAIN EXECUTION ===
let widget = await createWidget();

// Check if script is running inside a widget
if (config.runsInWidget) {
  // Run inside a widget
  Script.setWidget(widget);
} else {
  // Otherwise show widget preview
  widget.presentSmall();
}
Script.complete();
