// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: paw;

// Set API variables
const API_TOKEN = "<INSERT API TOKEN HERE>";
const APP_ID = "<INSERT APP ID HERE>";
const TABLE_ID = "<INSERT TABLE ID HERE>";

const TITLE_TEXT = "Barley 🐶";

// List of activities as Airtable views to surface as list elements
const views = [
  { name: "Pee", emoji: "💛" },
  { name: "Poop", emoji: "💩" },
  { name: "Walk", emoji: "🚶" },
  { name: "Food", emoji: "🍗" },
];

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

// Function to calculate time difference
function timeDiff(timestampStr) {
  if (!timestampStr) return "N/A";
  const date = new Date(timestampStr);
  const diffMS = new Date() - date;
  return (diffMS / (1000 * 60 * 60)).toFixed(1);
}

// Helper function to apply consistent text styling to list elements
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

// Function to create and customize widget UI
async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#1C1B1D"); 
  
  // Add widget title
  const title = widget.addText(TITLE_TEXT);
  title.centerAlignText();
  title.font = Font.semiboldSystemFont(20);
  title.textColor = new Color("#ffffff");
  widget.addSpacer(); 
  
  // Loop through views for latest timestamp and add as list element to widget
  for (let view of views) {
    const timestamp = await fetchLatestTimestamp(view.name);
    applyTextStyle(widget, view.emoji, timeDiff(timestamp));
  }
  widget.addSpacer(); 

  // Return customized widget UI
  return widget;
}

// Display widget
let widget = await createWidget();

// Check where the script is running
if (config.runsInWidget) {
  // Run inside widget
  Script.setWidget(widget);
} else {
  // Otherwise show preview
  widget.presentSmall();
}
Script.complete();
