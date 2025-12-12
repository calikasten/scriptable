// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: paw;

// === CONFIGURATION ==
const CONFIG = {
  apiKey: "<INSERT API TOKEN HERE>",
  appId: "app1PnYsdLk3i0N6S",
  tableId: "tbl4cXnZhwuW1TBj4",
};

// List of activities as Airtable views
const activityViews = [
  { name: "Pee", emoji: "💛" },
  { name: "Poop", emoji: "💩" },
  { name: "Walk", emoji: "🚶" },
  { name: "Food", emoji: "🍗" },
];

// === STYLES ===
// Format font size and color
const styles = {
  fonts: {
    title: Font.semiboldSystemFont(20),
    text: Font.semiboldSystemFont(14),
    suffix: Font.systemFont(8),
  },
  colors: {
    text: Color.white(),
    suffix: Color.gray(),
    background: new Color("1C1B1D"),
  },
};

// === HELPERS ===
// Calculate time difference
const calculateTimeDiff = (timestampStr) => {
  if (!timestampStr) return "N/A";
  const diffMS = new Date() - new Date(timestampStr ?? 0);
  return (diffMS / (1000 * 60 * 60)).toFixed(1);
};

// === API CLIENT ===
// Function to get data from API
async function fetchLatestTimestamp(viewName) {
  const url = `https://api.airtable.com/v0/${config.appId}/${
    config.tableId
  }?maxRecords=1&view=${encodeURIComponent(
    viewName
  )}&sort[0][field]=Timestamp&sort[0][direction]=desc`;
  try {
    const request = new Request(url);
    request.headers = {
      Authorization: `Bearer ${config.apiKey}`,
    };
    const response = await request.loadJSON(); 
    
    // Check if the response is valid, log response, and return data
    if (response.records.length === 0) return null;
    return response.records[0].fields["Timestamp"];
  } catch (error) {
    console.error(`Error fetching data from API for ${viewName}.`);
    return null;
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
  createText(widget, text, styles.fonts.title, styles.colors.text, "center");

// Add individual "activity" row element
const addActivityRow = (widget, emoji, timestampStr) => {
  const activity = widget.addStack();
  activity.layoutHorizontally();
  activity.centerAlignContent();
  activity.setPadding(5, 6, 0, 0);
  createText(activity, `${emoji} `, styles.fonts.text, styles.colors.text);
  createText(
    activity,
    `${timestampStr} `,
    styles.fonts.text,
    styles.colors.text
  );
  const suffix = activity.addStack();
  suffix.layoutVertically();
  suffix.addSpacer(4);
  createText(suffix, "hours ago", styles.fonts.suffix, styles.colors.suffix);
  return activity;
};

// === WIDGET ASSEMBLY ===
async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = styles.colors.background;

  addTitle(widget, "Barley 🐶"); // Widget title
  widget.addSpacer(); 
  
  // Data to display in widget
  for (let activityView of activityViews) {
    const timestamp = await fetchLatestTimestamp(activityView.name);
    addActivityRow(widget, activityView.emoji, calculateTimeDiff(timestamp));
  }
  widget.addSpacer();

  return widget; // Return widget with its constructed UI elements
}

// === MAIN EXECUTION ===
const widget = await createWidget();

// Check if script is running inside a widget
if (config.runsInWidget) {
  // Run inside a widget
  Script.setWidget(widget);
} else {
  // Otherwise show widget preview
  widget.presentSmall();
}
Script.complete();
