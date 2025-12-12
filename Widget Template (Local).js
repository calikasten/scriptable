// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: window-maximize;

// === CONFIGURATION ===
// This section stores all "settings", nothing here should change during execution

const CONFIG = {
  // apiUrl: "https://example.com",
  // apiKey: "ASW123J1MS93MDLA2JA023KH18475YOUZ",
  // referenceFile: "example-file.json"
  // refreshIntervalMs: 5 * 60 * 1000, // 5 minutes
};

// === STYLES ===
// This section defines visual styling (how the UI looks)

// Define colors and fonts
const STYLES = {
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
const dateFormat = "MM-dd-yyyy";

const exampleHelper = () => {
};

// === NETWORK & API CLIENT ===
// This section contains all functions that use the internet (fetching from API, downloading images, saving/reading cached responses)

async function fetchData() {
  // const request = new Request(CONFIG.apiUrl);
  // return await request.loadJSON();
}

async function fetchImage(url) {
  // return await new Request(url).loadImage();
}

// === UI COMPONENTS ===
// Generic text element
const createText = (widget, text, font, color, align = "center") => {
  const textElement = widget.addText(text);
  textElement.font = font;
  textElement.textColor = color;

  const alignMap = {
    left: () => textElement.leftAlignText(),
    center: () => textElement.centerAlignText(),
    right: () => textElement.rightAlignText(),
  };

  (alignMap[align] || alignMap.center)();

  return textElement;
};

// Add title text element
const addTitle = (widget, text) =>
  createText(widget, text, STYLES.fonts.title, STYLES.colors.title, "center");

// Add text row element
const addTextRow = (widget, numberedLines) =>
  createText(
    widget,
    numberedLines.join("\n"),
    STYLES.fonts.text,
    STYLES.colors.text,
    "left"
  );

// === WIDGET ASSEMBLY  ===
// This section is where the widget's UI is created (add images, text, arrange layout, apply styles)

function createWidget() {
  const widget = new ListWidget(); // Widget title

  addTitle(widget, "TITLE"); // Data to display in widget
  widget.addSpacer(5);

  const widgetData = ["text", "or", "other", "data", "types"]; // Number each line of widget data

  const numberedLines = widgetData.map((value, i) => `${i + 1}. ${value}`);
  addTextRow(widget, numberedLines); // Return widget with its constructed UI elements

  return widget;
}

// === MAIN EXECUTION ===
// This section is where the program actually runs (fetches all required data, builds the widget, and displays the widget)

const data = await fetchData(); // Get data
const widget = await createWidget(); // Build widget

// Check if script is running inside a widget
if (config.runsInWidget) {
  // Run inside a widget
  Script.setWidget(widget);
} else {
  // Otherwise show preview
  widget.presentSmall(); // Display widget
}

Script.complete();
