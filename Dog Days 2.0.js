// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: paw;

// === CONFIGURATION ==
const CONFIG = {
  apiKey: "<INSERT API TOKEN HERE>",
  appId: "app1PnYsdLk3i0N6S",
  tableId: "tbl4cXnZhwuW1TBj4",
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
const timeDiff = (timestampStr) => {
  if (!timestampStr) return "N/A";
  const date = new Date(timestampStr ?? 0);
  const diffMS = new Date() - new Date(timestampStr ?? 0);
  return (diffMS / (1000 * 60 * 60)).toFixed(1);
};

// === API CLIENT ===
// Function to get data from API
async function fetchLatestTimestamp(viewName) {
  const url =
    `https://api.airtable.com/v0/${CONFIG.appId}/${CONFIG.tableId}` +
    `?maxRecords=1&view=${encodeURIComponent(viewName)}` +
    `&sort[0][field]=Timestamp&sort[0][direction]=desc`;
  try {
    const request = new Request(url);
    request.headers = {
      Authorization: `Bearer ${CONFIG.apiKey}`,
    };
    const response = await request.loadJSON(); // Check if the response is valid, log response, and return data
    if (response.records.length === 0) return null;
    return response.records[0].fields["Timestamp"];
  } catch (error) {
    console.error(`Error fetching data from API for ${viewName}.`);
    return null;
  }
}

// === UI COMPONENTS ===
// Generic text element
const createText = (widget, text, font, color, align = "left") => {
  const textElement = widget.addText(text);
  textElement.font = font;
  textElement.textColor = color;

  const alignMap = {
    left: () => textElement.leftAlignText(),
    center: () => textElement.centerAlignText(),
    right: () => textElement.rightAlignText(),
  };

  (alignMap[align] || alignMap.left)();

  return textElement;
};

// Title text
const addTitle = (stack, text) =>
  createText(stack, text, STYLES.fonts.title, STYLES.colors.title, "center");

// Individual "activity" lines
const addActivityLine = (stack, emoji, timestampStr) => {
  const activityLine = stack.addStack();
  activityLine.layoutHorizontally();
  activityLine.centerAlignContent();
  activityLine.setPadding(5, 6, 0, 0);
  createText(activityLine, `${emoji} `, STYLES.fonts.text, STYLES.colors.text);
  createText(
    activityLine,
    `${timestampStr} `,
    STYLES.fonts.text,
    STYLES.colors.text
  );
  const suffixText = activityLine.addStack();
  suffixText.layoutVertically();
  suffixText.addSpacer(4);
  createText(
    suffixText,
    "hours ago",
    STYLES.fonts.suffix,
    STYLES.colors.suffix
  );
  return activityLine;
};

// === WIDGET ASSEMBLY ===
async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = STYLES.colors.background; // Widget title
  addTitle(widget, "Barley 🐶");
  widget.addSpacer(); // Add a list entry for each activity with its most recent timestamp
  for (let view of views) {
    const timestamp = await fetchLatestTimestamp(view.name);
    addActivityLine(widget, view.emoji, timeDiff(timestamp));
  }
  widget.addSpacer(); // Return widget with its constructed UI elements

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

