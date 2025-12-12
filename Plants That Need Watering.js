// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: leaf;

// === CONFIGURATION ===
const config = {
  folder: "Plant Data",
  file: "plant-data.json",
};

// === GLOBAL VARIABLES ===
// Initialize iCloud file manager and set up paths
const fileManager = FileManager.iCloud();
const folderPath = fileManager.joinPath(
  fileManager.documentsDirectory(),
  config.folder
);
const filePath = fileManager.joinPath(folderPath, config.file);

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
const styles = {
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
const saveData = (fileManager, filePath, plantData) => {
  try {
    fileManager.writeString(filePath, JSON.stringify(plantData));
  } catch (error) {
    console.error(error);
  }
};

// Load cached data from JSON file
const loadData = (fileManager, filePath) => {
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
const analyzeWatering = (plantData) => {
  if (!plantData || typeof plantData !== "object") {
    return [];
  }

  return Object.entries(plantData)
    .filter(
      ([, plant]) =>
        plant.lastWatered &&
        plant.wateringSchedule &&
        daysSince(plant.lastWatered) >= Number(plant.wateringSchedule)
    )
    .map(([name]) => name);
};

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

// Add count as text element
const addCountText = (stack, count) =>
  createText(
    stack,
    `${count}`,
    styles.fonts.count,
    styles.colors.text,
    "center"
  );

// Add status as text element under count
const addStatusText = (stack, count) => {
  const text = count === 1 ? "plant needs watering." : "plants need watering.";
  return createText(
    stack,
    text,
    styles.fonts.title,
    styles.colors.text,
    "center"
  );
};

// Add individual plant name as text element
const addPlantName = (widget, name) => {
  const text = createText(
    widget,
    `• ${name}`,
    styles.fonts.plant,
    styles.colors.text,
    "left"
  );
  widget.addSpacer(styles.spacing.spacerSmall);
  return text;
};

// === WIDGET ASSEMBLY ===
function createWidget(plants) {
  const widget = new ListWidget();
  const [top, right, bottom, left] = styles.spacing.widgetPadding;
  widget.setPadding(top, right, bottom, left); // Gradient background

  const gradient = new LinearGradient();
  gradient.colors = [
    plants.length
      ? styles.colors.backgroundAlert
      : styles.colors.backgroundNeutral,
    styles.colors.gradientEnd,
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
      styles.fonts.alert,
      styles.colors.text,
      "center"
    );
  } else {
    const topStack = widget.addStack();
    topStack.layoutVertically();
    topStack.centerAlignContent();

    // Negative spacer pulls content upward for visual balance
    topStack.addSpacer(styles.spacing.spacerTop);

    addCountText(topStack, plants.length);
    addStatusText(topStack, plants.length);

    widget.addSpacer(styles.spacing.spacerMedium); 
	
	// List of plants that need watering
    for (const name of plants) {
      addPlantName(widget, name);
    }
  }

  return widget; // Return widget with its constructed UI elements
}

// === MAIN EXECUTION ===
// Load data from Shortcut parameter or file
let plantData = args.shortcutParameter;
if (typeof plantData === "string") {
  try {
    plantData = JSON.parse(plantData);
  } catch (error) {
    console.error(`Data parse failed: ${error}`);
  }
}
if (plantData) saveData(fileManager, filePath, plantData);
else plantData = loadData(fileManager, filePath);

// Analyze plants that need watering
const widget = createWidget(analyzeWatering(plantData));

// Check if script is running inside a widget
if (config.runsInWidget) {
  // Run inside a widget
  Script.setWidget(widget);
} else {
  // Otherwise show widget preview
  widget.presentSmall();
}

Script.complete();
