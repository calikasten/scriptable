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
const STYLES = {
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
// Format timestap into localized date/time string
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

// Calculate countodnw string from now until timestamp
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
// Retrieve cached API data or fetch from API if cache is invalid
const getCachedData = async () => {
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
};

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
    console.error("Failed to cache/load image:", error);
    return null;
  }
};

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

// Mission name text
const addMissionText = (stack, missionName) =>
  createText(
    stack,
    missionName || "Unknown Mission",
    STYLES.fonts.title,
    STYLES.colors.text,
    "center"
  );

// Rocket type text
const addRocketType = (stack, rocketName) =>
  createText(
    stack,
    rocketName || "Unknown Rocket",
    STYLES.fonts.text,
    STYLES.colors.text,
    "center"
  );

// Launch date/time text
const addLaunchDateText = (stack, dateString) =>
  createText(
    stack,
    dateString || "Launch time TBD",
    STYLES.fonts.text,
    STYLES.colors.text,
    "center"
  );

// Divider line
const addDivider = (stack, length = 14) =>
  createText(
    stack,
    "—".repeat(length),
    STYLES.fonts.divider,
    STYLES.colors.divider,
    "center"
  );

// Countdown text
const addCountdownText = (stack, timestamp) => {
  const countdownString = getCountdown(timestamp);
  return createText(
    stack,
    countdownString,
    STYLES.fonts.countdown,
    countdownString === "Launched"
      ? STYLES.colors.launched
      : STYLES.colors.text,
    "center"
  );
};

// === WIDGET ASSEMBLY ===
const createWidget = async (launch) => {
  const widget = new ListWidget(); // Background image and gradient

  const background = await cacheImage(
    CONFIG.backgroundImageUrl,
    "launch_bg.jpg"
  );
  if (background) {
    widget.backgroundImage = background;
    const gradient = new LinearGradient();
    gradient.locations = [0, 1];
    gradient.colors = STYLES.colors.gradient;
    widget.backgroundGradient = gradient;
  } else {
    widget.backgroundColor = new Color("#000000");
  } // Main vertical stack

  const stack = widget.addStack();
  stack.layoutVertically();
  stack.centerAlignContent(); // Mission name

  addMissionText(stack, launch.mission?.name);
  stack.addSpacer(6); // Rocket type

  addRocketType(stack, launch.rocket?.configuration?.name);
  stack.addSpacer(4); // Launch date/time

  addLaunchDateText(stack, formatDateTime(launch.net)); // Divider before countdown

  stack.addSpacer(8);
  addDivider(stack);
  stack.addSpacer(6); // Countdown stack

  const countdown = stack.addStack();
  countdown.layoutHorizontally();
  countdown.addSpacer(); // Left flexible spacer
  addCountdownText(countdown, launch.net);
  countdown.addSpacer(); // Flexible spacer on right // Auto-refresh widget

  const now = Date.now();
  const launchMs = launch.net ? new Date(launch.net).getTime() : now;
  widget.refreshAfterDate = new Date(
    Math.min(now + CONFIG.refreshIntervalMs, launchMs)
  ); // Return widget with its constructed UI elements

  return widget;
};

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
