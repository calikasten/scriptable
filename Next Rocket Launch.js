// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: space-shuttle;

// === CONFIGURATION ===
const CONFIG = {
  apiUrl: "https://lldev.thespacedevs.com/2.2.0/launch/upcoming",
  cacheDurationMs: 30 * 60 * 1000, // 30 minutes
  backgroundImageUrl:
    "https://calikasten.wordpress.com/wp-content/uploads/2025/10/spacex-1047301226a.webp",
  refreshIntervalMs: 5 * 60 * 1000, // 5 minutes
};

// === STYLES ===
// Define colors and fonts
const styles = {
  colors: {
    text: Color.white(),
    launched: Color.green(),
    divider: new Color("FFFFFF", 0.5),
    gradient: [new Color("#000000", 0.7), new Color("#000000", 0.2)],
  },
  fonts: {
    title: Font.semiboldSystemFont(14),
    text: Font.semiboldSystemFont(12),
    countdown: Font.semiboldSystemFont(16),
    divider: Font.lightSystemFont(10),
  },
};

// === HELPER FUNCTIONS ===
// Format timestamp into localized date/time string
const formatDateTime = (timestamp) => {
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
};

// Calculate countdown string from now until timestamp
const getCountdown = (timestamp) => {
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
};

// === NETWORK & API CLIENT ===
// Return cached API data or fetch from API if cache is invalid
async function getCachedData() {
  const fileManager = FileManager.local();
  const file = fileManager.joinPath(
    fileManager.cacheDirectory(),
    "launch_api_cache.json"
  );

  if (
    fileManager.fileExists(file) &&
    Date.now() - fileManager.modificationDate(file).getTime() <
      CONFIG.cacheDurationMs
  ) {
    try {
      return JSON.parse(fileManager.readString(file));
    } catch (error) {
      console.error(`Failed to read cache: ${error}`);
    }
  }

  try {
    const response = await new Request(CONFIG.apiUrl).loadJSON();
    if (!response?.results?.length) throw new Error("No data returned");
    fileManager.writeString(file, JSON.stringify(response));
    return response;
  } catch (error) {
    console.error(`Failed to fetch data: ${error}`);
    return null;
  }
}

// Load image from cache or fetch and cache if not available
const cacheImage = async (url, filename) => {
  const fileManager = FileManager.local();
  const path = fileManager.joinPath(fileManager.cacheDirectory(), filename);

  try {
    if (fileManager.fileExists(path)) return fileManager.readImage(path);
    const image = await new Request(url).loadImage();
    fileManager.writeImage(path, image);
    return image;
  } catch (error) {
    console.error(`Failed to cache/load image: ${error}`);
    return null;
  }
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
const createText = (widget, text, font, color, align = "center") => {
  const textElement = widget.addText(text);
  textElement.font = font;
  textElement.textColor = color;

  alignText(textElement, align);
  return textElement;
};

// Add mission name as text element
const addMissionText = (stack, missionName) =>
  createText(
    stack,
    missionName || "Unknown Mission",
    styles.fonts.title,
    styles.colors.text,
    "center"
  );

// Add rocket type as text element
const addRocketType = (stack, rocketName) =>
  createText(
    stack,
    rocketName || "Unknown Rocket",
    styles.fonts.text,
    styles.colors.text,
    "center"
  );

// Add launch date/time as text element
const addLaunchDateText = (stack, dateString) =>
  createText(
    stack,
    dateString || "Launch time TBD",
    styles.fonts.text,
    styles.colors.text,
    "center"
  );

// Add countdown of calculated tiem until launch as text element
const addCountdownText = (stack, timestamp) => {
  const countdownString = getCountdown(timestamp);
  return createText(
    stack,
    countdownString,
    styles.fonts.countdown,
    countdownString === "Launched"
      ? styles.colors.launched
      : styles.colors.text,
    "center"
  );
};

// Add divider line as text element
const addDividerText = (stack, length = 14) =>
  createText(
    stack,
    "—".repeat(length),
    styles.fonts.divider,
    styles.colors.divider,
    "center"
  );

// === WIDGET ASSEMBLY ===
async function createWidget(launch) {
  const widget = new ListWidget(); 
  
  // Load background image
  const background = await cacheImage(
    CONFIG.backgroundImageUrl,
    "launch_bg.jpg"
  ); 
  
  // Apply background gradient
  const backgroundGradient = new LinearGradient();
  backgroundGradient.locations = [0, 1];
  backgroundGradient.colors = styles.colors.gradient;
  if (background) {
    widget.backgroundImage = background;
    widget.backgroundGradient = backgroundGradient;
  } else {
    widget.backgroundColor = new Color("#000000");
  } 
  
  // Construct main text stack in widget
  const stack = widget.addStack();
  stack.layoutVertically();
  stack.centerAlignContent();

  addMissionText(stack, launch.mission?.name); // Mission name
  stack.addSpacer(6);

  addRocketType(stack, launch.rocket?.configuration?.name); // Rocket type
  stack.addSpacer(4);

  addLaunchDateText(stack, formatDateTime(launch.net)); // Launch date/time

  stack.addSpacer(8);
  addDividerText(stack); // Divider
  stack.addSpacer(6);

  const countdown = stack.addStack();
  countdown.layoutHorizontally(); 
  
  // Left flexible spacer
  countdown.addSpacer();

  addCountdownText(countdown, launch.net); // Countdown 
  
  // Flexible spacer on right
  countdown.addSpacer(); 
  
  // Auto-refresh widget
  const launchMs = launch.net ? new Date(launch.net).getTime() : Date.now();
  widget.refreshAfterDate = new Date(
    Math.min(Date.now() + CONFIG.refreshIntervalMs, launchMs)
  );

  return widget; // Return widget with its constructed UI elements
}

// === MAIN EXECUTION ===
// Load cached data
const data = await getCachedData();
if (!data) return console.error("No launch data available.");

const widget = await createWidget(data.results[0]);

// Check if script is running inside a widget
if (config.runsInWidget) {
  // Run inside a widget
  Script.setWidget(widget);
} else {
  // Otherwise show widget preview
  widget.presentSmall();
}

Script.complete();
