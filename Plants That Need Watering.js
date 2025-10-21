// === CONFIGURATION ===
const CONFIG = {
  folder: "Plant Data",
  file: "plantData.json",
  bgAlert: "#b00020",
  bgNeutral: "#001f3f",
  bgEnd: "#1c1c1e",
  titleFont: 12,
  plantFont: 10,
  countFont: 42,
};

// === FILE MANAGEMENT ===
// Set up iCloud file paths to ensure folder exists
const fileManager = FileManager.iCloud();
const folderPath = fileManager.joinPath(
  fileManager.documentsDirectory(),
  CONFIG.folder
);
const filePath = fileManager.joinPath(folderPath, CONFIG.file);

// Create folder if it doesn't exist
if (!fileManager.fileExists(folderPath))
  try {
    fileManager.createDirectory(folderPath, true);
  } catch (error) {
    console.error(error);
  }

// === HELPER FUNCTIONS ===
// Save data to JSON file (overwrite existing content)
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

// Calculate number of days since given date
const daysSince = (dateStr) => {
  const days = Date.parse(dateStr);
  return isNaN(days) ? 0 : Math.floor((Date.now() - days) / 86_400_000);
};

// Determine plants that need watering based on timestamp of last watering and number of days since then
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

// === CREATE WIDGET ===
const createWidget = (plants) => {
  const widget = new ListWidget();
  widget.setPadding(0, 10, 10, 10);

  // Set gradient background color depending on if any plants need to be watered
  const gradient = new LinearGradient();
  gradient.colors = [
    new Color(plants.length ? CONFIG.bgAlert : CONFIG.bgNeutral),
    new Color(CONFIG.bgEnd),
  ];
  gradient.locations = [0, 0.9];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(0, 1);
  widget.backgroundGradient = gradient;

  if (!plants.length) {
    // Show message if no plants need to be watered today
    const title = widget.addText("No plants need water today.");
    title.font = Font.boldSystemFont(CONFIG.titleFont);
    title.textColor = Color.white();
    title.centerAlignText();
  } else {
    // Otherwise display the number of plants that need watering
    const top = widget.addStack();
    top.layoutVertically();
    top.centerAlignContent();
    top.addSpacer(-12);

    const countText = top.addText(`${plants.length}`);
    countText.font = Font.boldSystemFont(CONFIG.countFont);
    countText.textColor = Color.white();
    countText.centerAlignText();

    const label = top.addText(
      plants.length === 1 ? "plant needs watering." : "plants need watering."
    );
    label.font = Font.systemFont(CONFIG.titleFont);
    label.textColor = Color.white();
    label.centerAlignText();
  }

  widget.addSpacer(8);

  // List of plants that need watering
  for (const name of plants) {
    const plantName = widget.addText(`• ${name}`);
    plantName.font = Font.systemFont(CONFIG.plantFont);
    plantName.textColor = Color.white();
    plantName.leftAlignText();
    widget.addSpacer(1);
  }

  return widget;
};

// === EXECUTE SCRIPT ===
// Load data from Shortcut parameter or file
let data = args.shortcutParameter;
if (typeof data === "string")
  try {
    data = JSON.parse(data);
  } catch {
    console.error("Data parse failed");
  }
if (data) saveData(data);
else data = loadData();

// Analyze plants that need watering
const widget = createWidget(analyzeWatering(data));

// Display the widget
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentSmall();
}

Script.complete();
