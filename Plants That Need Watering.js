// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: leaf;

// === CONFIGURATION ===
const CONFIG = {
  folder: "Plant Data",
  file: "plant-data.json",
};

// === GLOBAL VARIABLES ===
// Initialize iCloud file manager and set up paths
const fileManager = FileManager.iCloud();
const folderPath = fileManager.joinPath(
  fileManager.documentsDirectory(),
  CONFIG.folder
);
const filePath = fileManager.joinPath(folderPath, CONFIG.file);

// Create folder if it doesn't exist
if (!fileManager.fileExists(folderPath)) {
  try {
    fileManager.createDirectory(folderPath, true);
  } catch (error) {
    console.error(error);
  }
}

// === STYLES ===
// Define colors, fonts, and layout spacing
const STYLES = {
  colors: {
    backgroundAlert: new Color("#B00020"),
    backgroundNeutral: new Color("#001F3F"),
    gradientEnd: new Color("#1C1C1E"),
    text: Color.white(),
  },
  fonts: {
    title: Font.systemFont(12),
    alert: Font.boldSystemFont(12),
    plant: Font.boldSystemFont(10),
    count: Font.boldSystemFont(42),
  },
  spacing: {
    widgetPadding: [0, 10, 10, 10],
    spacerSmall: 1,
    spacerMedium: 8,
    spacerTop: -12,
  },
};

// === HELPERS ===
// Save data to JSON file (overwrites existing content)
const saveData = (data) => {
  try {
    fileManager.writeString(filePath, JSON.stringify(data));
  } catch (error) {
    console.error(error);
  }
};

// Load cached data from JSON file
const loadData = () => {
  if (!fileManager.fileExists(filePath)) return null;
  try {
    return JSON.parse(fileManager.readString(filePath));
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Calculate number of days since a date string
const daysSince = (dateStr) => {
  const days = Date.parse(dateStr);
  return isNaN(days) ? 0 : Math.floor((Date.now() - days) / 86_400_000);
};

// Determine which plants need watering
const analyzeWatering = (data) =>
  data && typeof data === "object"
    ? Object.entries(data)
        .filter(
          ([, plant]) =>
            plant.lastWatered &&
            plant.wateringSchedule &&
            daysSince(plant.lastWatered) >= +plant.wateringSchedule
        )
        .map(([name]) => name)
    : [];

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

// Count number at top of widget
const addCountText = (stack, count) =>
  createText(
    stack,
    `${count}`,
    STYLES.fonts.count,
    STYLES.colors.text,
    "center"
  );

// Status text under count
const addStatusText = (stack, count) => {
  const text = count === 1 ? "plant needs watering." : "plants need watering.";
  return createText(
    stack,
    text,
    STYLES.fonts.title,
    STYLES.colors.text,
    "center"
  );
};

// Individual plant name in the list
const addPlantName = (stack, name) => {
  const text = createText(
    stack,
    `• ${name}`,
    STYLES.fonts.plant,
    STYLES.colors.text,
    "left"
  );
  stack.addSpacer(STYLES.spacing.spacerSmall);
  return text;
};

// === WIDGET ASSEMBLY ===
const createWidget = (plants) => {
  const widget = new ListWidget();
  const [top, right, bottom, left] = STYLES.spacing.widgetPadding;
  widget.setPadding(top, right, bottom, left);

  // Gradient background
  const gradient = new LinearGradient();
  gradient.colors = [
    plants.length
      ? STYLES.colors.backgroundAlert
      : STYLES.colors.backgroundNeutral,
    STYLES.colors.gradientEnd,
  ];
  gradient.locations = [0, 0.9];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(0, 1);
  widget.backgroundGradient = gradient;

  if (!plants.length) {
    // Show message if no plants need to be watered today
    createText(
      widget,
      "No plants need water today.",
      STYLES.fonts.alert,
      STYLES.colors.text,
      "center"
    );
  } else {
    const topStack = widget.addStack();
    topStack.layoutVertically();
    topStack.centerAlignContent();
    topStack.addSpacer(STYLES.spacing.spacerTop);

    addCountText(topStack, plants.length);
    addStatusText(topStack, plants.length);

    widget.addSpacer(STYLES.spacing.spacerMedium);

    // List of plants that need watering
    for (const name of plants) {
      addPlantName(widget, name);
    }
  }
  // Return widget with its constructed UI elements
  return widget;
};

// === MAIN EXECUTION ===
// Load data from Shortcut parameter or file
let data = args.shortcutParameter;
if (typeof data === "string") {
  try {
    data = JSON.parse(data);
  } catch {
    console.error("Data parse failed");
  }
}
if (data) saveData(data);
else data = loadData();

// Analyze plants that need watering
const widget = createWidget(analyzeWatering(data));

// Check if script is running inside a widget
if (config.runsInWidget) {
  // Run inside a widget
  Script.setWidget(widget);
} else {
  // Otherwise show widget preview
  widget.presentSmall();
}

Script.complete();
