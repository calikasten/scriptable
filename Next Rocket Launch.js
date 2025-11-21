// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: space-shuttle;

// === CONFIGURATION ===
const CONFIG = {
  apiUrl: "https://lldev.thespacedevs.com/2.2.0/launch/upcoming",
	cacheDurationMs: 30 * 60 * 1000, // 30 minutes
	backgroundImageUrl: "https://calikasten.wordpress.com/wp-content/uploads/2025/10/spacex-1047301226a.webp",
	refreshIntervalMs: 2 * 60 * 1000 // 15 minutes
}

// === STYLES ===
// Define colors and fonts
const STYLES = {
  colors: {
    text: Color.white(),
  		launched: Color.green(),
  		divider: new Color("FFFFFF", 0.5),
  		gradient: [new Color("#000000", 0.7), new Color("#000000", 0.2)]
  },
  fonts: {
    title: Font.semiboldSystemFont(14),
  		text: Font.semiboldSystemFont(12),
  		countdown: Font.semiboldSystemFont(16),
  		divider: Font.lightSystemFont(10)
  }
};

// === HELPER FUNCTIONS ===
// Format timestap into localized date/time string
function formatDateTime(timestamp) {
  if (!timestamp) return "Launch time TBD";
  const date = new Date(timestamp);
  const locale = Device.language();
  const dateString = Intl.DateTimeFormat(locale, {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  }).format(date);
  const timeString = Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(date);
  return `${dateString} at ${timeString}`;
}

// Calculate countodnw string from now until timestamp
function getCountdown(timestamp) {
  if (!timestamp) return "Countdown unavailable";
  const diffMs = new Date(timestamp) - new Date();
  if (diffMs <= 0) return "Launched";

  const totalMinutes = Math.floor(diffMs / 1000 / 60);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return `${days ? days + "d " : ""}${
    days || hours ? hours + "h " : ""
  }${minutes}m`;
}

// === NETWORK & API CLIENT ===
// Retrieve cached API data or fetch from API if cache is invalid
async function getCachedData() {
  const fileManager = FileManager.local();
  const file = fileManager.joinPath(fileManager.cacheDirectory(), "launch_api_cache.json");

  if (
    fileManager.fileExists(file) &&
    Date.now() - fileManager.modificationDate(file).getTime() < CONFIG.cacheDurationMs
  ) {
    try {
      return JSON.parse(fileManager.readString(file));
    } catch {}
  }

  try {
    const response = await new Request(CONFIG.apiUrl).loadJSON();
    if (!response?.results?.length) throw new Error("No data returned");
    fileManager.writeString(file, JSON.stringify(response));
    return response;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
}

// Load image from cache or fetch and cache if not available
async function cacheImage(url, filename) {
  const fileManager = FileManager.local();
  const path = fileManager.joinPath(fileManager.cacheDirectory(), filename);

  try {
    if (fileManager.fileExists(path)) return fileManager.readImage(path);
    const img = await new Request(url).loadImage();
    fileManager.writeImage(path, img);
    return img;
  } catch (err) {
    console.error("Failed to cache/load image:", err);
    return null;
  }
}

// === WIDGET ASSEMBLY ===
async function createWidget(launch) {
  const widget = new ListWidget();

  // Background image and gradient
  const background = await cacheImage(CONFIG.backgroundImageUrl, "launch_bg.jpg");
  if (background) {
    widget.backgroundImage = background;
    const gradient = new LinearGradient();
    gradient.locations = [0, 1];
    gradient.colors = STYLES.colors.gradient;
    widget.backgroundGradient = gradient;
  } else {
    widget.backgroundColor = new Color("#000000");
  }

  // Main vertical stack
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  mainStack.centerAlignContent();

  // Mission name
  const missionText = mainStack.addText(
    launch.mission?.name || "Unknown Mission"
  );
  missionText.font = STYLES.fonts.title;
  missionText.textColor = STYLES.colors.text;
  missionText.centerAlignText();

  mainStack.addSpacer(6);

  // Rocket type
  const rocketText = mainStack.addText(
    launch.rocket?.configuration?.name || "Unknown Rocket"
  );
  rocketText.font = STYLES.fonts.text;
  rocketText.textColor = STYLES.colors.text;
  rocketText.centerAlignText();

  mainStack.addSpacer(4);

  // Launch date/time
  const dateText = mainStack.addText(formatDateTime(launch.net));
  dateText.font = STYLES.fonts.text;
  dateText.textColor = STYLES.colors.text;
  dateText.centerAlignText();

  // Divider before countdown
  mainStack.addSpacer(8);
  const divider = mainStack.addText("─".repeat(12));
  divider.font = STYLES.fonts.divider;
  divider.textColor = STYLES.colors.divider;
  divider.centerAlignText();
  mainStack.addSpacer(6);

  // Countdown stack
  const countdownStack = mainStack.addStack();
  countdownStack.layoutHorizontally();
  countdownStack.addSpacer(); // Left flexible spacer

  // Countdown text
  const countdownString = getCountdown(launch.net);
  const countdownText = countdownStack.addText(countdownString);
  countdownText.font = STYLES.fonts.countdown;
  countdownText.textColor =
    countdownString === "Launched" ? STYLES.colors.launched : STYLES.colors.text
  countdownText.centerAlignText();

  countdownStack.addSpacer(); // Flexible spacer on right

  // Auto-refresh widget
  const now = Date.now();
  const launchMs = launch.net ? new Date(launch.net).getTime() : now;
  widget.refreshAfterDate = new Date(
    Math.min(now + CONFIG.refreshIntervalMs, launchMs)
  );

	// Return widget with its constructed UI elements
  return widget;
}

// === MAIN EXECUTION ===
// Load cached data
const data = await getCachedData();
if (!data) return console.error("No launch data available.");

const widget = await createWidget(data.results[0]);

// Check if script is running inside a widget
if (config.runsInWidget){
  // Run inside a widget
  Script.setWidget(widget);
} else {
  // Otherwise show widget preview
  widget.presentSmall();
}

Script.complete();
