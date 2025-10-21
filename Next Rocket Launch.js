// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: space-shuttle;

// === CONFIGURATION ===
const API_URL = "https://lldev.thespacedevs.com/2.2.0/launch/upcoming";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const BACKGROUND_IMAGE_URL =
  "https://calikasten.wordpress.com/wp-content/uploads/2025/10/spacex-1047301226a.webp";
const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// === HELPER FUNCTIONS ===
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

// === FETCH DATA ===
// Retrieve data from cache if  valid; otherwise, fetch from API and update cache
async function getCachedData() {
  const fileManager = FileManager.local();
  const file = fileManager.joinPath(fileManager.cacheDirectory(), "launch_api_cache.json");

  if (
    fileManager.fileExists(file) &&
    Date.now() - fileManager.modificationDate(file).getTime() < CACHE_DURATION_MS
  ) {
    try {
      return JSON.parse(fileManager.readString(file));
    } catch {}
  }

  try {
    const response = await new Request(API_URL).loadJSON();
    if (!response?.results?.length) throw new Error("No data returned");
    fileManager.writeString(file, JSON.stringify(response));
    return response;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
}

// Load image from cache if available, otherwise, fetch from URL and cache it before returning the image
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

// === CREATE WIDGET ===
async function createWidget(launch) {
  const widget = new ListWidget();

  // Background image + gradient
  const background = await cacheImage(BACKGROUND_IMAGE_URL, "launch_bg.jpg");
  if (background) {
    widget.backgroundImage = background;
    const gradient = new LinearGradient();
    gradient.locations = [0, 1];
    gradient.colors = [new Color("#000000", 0.7), new Color("#000000", 0.2)];
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
  missionText.font = Font.semiboldSystemFont(14);
  missionText.textColor = Color.white();
  missionText.centerAlignText();

  mainStack.addSpacer(6);

  // Rocket type
  const rocketText = mainStack.addText(
    launch.rocket?.configuration?.name || "Unknown Rocket"
  );
  rocketText.font = Font.semiboldSystemFont(12);
  rocketText.textColor = Color.white();
  rocketText.centerAlignText();

  mainStack.addSpacer(4);

  // Launch date/time
  const dateText = mainStack.addText(formatDateTime(launch.net));
  dateText.font = Font.semiboldSystemFont(12);
  dateText.textColor = Color.white();
  dateText.centerAlignText();

  // Divider before countdown
  mainStack.addSpacer(8);
  const divider = mainStack.addText("─".repeat(12));
  divider.font = Font.lightSystemFont(10);
  divider.textColor = new Color("#FFFFFF", 0.5);
  divider.centerAlignText();
  mainStack.addSpacer(6);

  // Countdown stack
  const countdownStack = mainStack.addStack();
  countdownStack.layoutHorizontally();

  // Flexible spacer on left
  countdownStack.addSpacer();

  // Countdown text
  const countdownStr = getCountdown(launch.net);
  const countdownText = countdownStack.addText(countdownStr);
  countdownText.font = Font.semiboldSystemFont(16);
  countdownText.textColor =
    countdownStr === "Launched" ? Color.green() : Color.white();
  countdownText.centerAlignText();

  // Flexible spacer on right
  countdownStack.addSpacer();

  // Auto-refresh
  const now = Date.now();
  const launchMs = launch.net ? new Date(launch.net).getTime() : now;
  widget.refreshAfterDate = new Date(
    Math.min(now + REFRESH_INTERVAL_MS, launchMs)
  );

  return widget;
}

// === EXECUTE SCRIPT ===
// Load cached data
const data = await getCachedData();
if (!data) return console.error("No launch data available.");

const widget = await createWidget(data.results[0]);

// Display widget
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentSmall();
}

Script.complete();
