// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: globe;

// === CONFIGURATION ===
// List of satellites to track
const SATELLITES = [
  { name: "ISS (Zarya)", norad: 25544, category: "Space Station" },
  { name: "Tiangong", norad: 48274, category: "Space Station" },
  { name: "Hubble Space Telescope", norad: 20580, category: "Scientific" }, 
  
  // NOAA & Meteorological
  { name: "NOAA 15", norad: 25338, category: "Weather" },
  { name: "NOAA 17", norad: 27453, category: "Weather" },
  { name: "NOAA 18", norad: 28654, category: "Weather" },
  { name: "NOAA 19", norad: 33591, category: "Weather" },
  { name: "METEOR M2-2", norad: 44387, category: "Weather" },
  { name: "SUOMI NPP", norad: 37849, category: "Weather" },
  { name: "NOAA 20 (JPSS 1)", norad: 43013, category: "Weather" },
  { name: "NOAA-21 (JPSS-2)", norad: 54234, category: "Weather" }, 
  
  // Amateur Radio (AMSAT)
  { name: "AO-7", norad: 7530, category: "Amateur Radio" },
  { name: "AO-73 (FunCube-1)", norad: 39444, category: "Amateur Radio" },
  { name: "AO-85", norad: 40967, category: "Amateur Radio" },
  { name: "AO-91", norad: 43017, category: "Amateur Radio" },
  { name: "BISONSAT", norad: 40968, category: "Amateur Radio" },
  { name: "FO-29", norad: 24278, category: "Amateur Radio" },
  { name: "SO-50", norad: 27607, category: "Amateur Radio" },
  { name: "LilacSat-2", norad: 40908, category: "Amateur Radio" },
  { name: "DIWATA 2B", norad: 43678, category: "Amateur Radio" },
  { name: "HADES-R", norad: 62690, category: "Amateur Radio" },
  { name: "JY1SAT", norad: 43803, category: "Amateur Radio" },
  { name: "CAS-6", norad: 44881, category: "Amateur Radio" },
  { name: "DOSAAF-85 (RS-44)", norad: 44909, category: "Amateur Radio" },
  { name: "PCSAT", norad: 26931, category: "Amateur Radio" },
  { name: "ASRTU-1", norad: 61781, category: "Amateur Radio" },
  { name: "SONATE-2", norad: 59112, category: "Amateur Radio" },
  { name: "GRBALPHA", norad: 47941, category: "Amateur Radio" },
  { name: "LASARSAT", norad: 62391, category: "Amateur Radio" },
  { name: "CROCUBE", norad: 62394, category: "Amateur Radio" },
  { name: "CUBESAT XI-V", norad: 28895, category: "Amateur Radio" },
  { name: "CUBESAT XI-IV", norad: 27848, category: "Amateur Radio" },
  { name: "CATSAT", norad: 60246, category: "Amateur Radio" }, 
  
  // Earth Observation / Scientific
  { name: "Terra", norad: 25994, category: "Earth Observation" },
  { name: "Aqua", norad: 27424, category: "Earth Observation" },
];

const CONFIG = {
  // Fallback coordinates used when device location cannot be determined
  fallbackLatitude: 41.90421705471727,
  fallbackLongitude: -87.6626416108551,
  
  minimumSatelliteElevation: 70, // minimum elevation (degrees) for a pass to be considered
  hoursFromNow: 24, // within how many hours from now to search for passes
  
  apiUrl:
    "https://api.g7vrd.co.uk/v1/satellite-passes/{norad}/{lat}/{lon}.json",
  backgroundImageUrl:
    "https://raw.githubusercontent.com/calikasten/scriptable/main/assets/satellite.jpeg",
  
  refreshIntervalMs: 5 * 60 * 1000, // 5 minutes
};

// === STYLES ===
const STYLES = {
  colors: {
    title: new Color("#F58034"),
    subtitle: Color.white(),
    text: Color.gray(),
    gradient: [new Color("#000000", 0.4), new Color("#000000", 1)],
  },
  fonts: {
    title: Font.boldSystemFont(14),
    subtitle: Font.semiboldSystemFont(12),
    text: Font.systemFont(12),
  },
};

// === HELPERS ===
// Safely round numeric values coming from the API
function safeRound(value) {
  return Number.isFinite(value) ? Math.round(value) : "-";
}

// Formatter for human-readable dates
const dateFormatter = new DateFormatter();
dateFormatter.useMediumDateStyle();

// Formatter for compact time strings
const timeFormatter = new DateFormatter();
timeFormatter.useShortTimeStyle();

// === NETWORK & API CLIENT ===
// Fetch the earliest upcoming satellite pass across all tracked satellites
async function fetchSoonestSatellitePass(latitude, longitude) {
  let earliestPass = null; // Perform API requests in parallel for all satellites

  const requests = SATELLITES.map(async (satellite) => {
    const url =
      CONFIG.apiUrl
        .replace("{norad}", satellite.norad)
        .replace("{lat}", latitude)
        .replace("{lon}", longitude) +
      `?min_elevation=${CONFIG.minimumSatelliteElevation}&hours=${CONFIG.hoursFromNow}`;

    try {
      const response = await new Request(url).loadJSON();
      const passList = response.passes;

      if (passList?.length > 0) {
        const pass = passList.at(0);

        const normalizedPass = {
          name: response.satellite_name || satellite.name,
          norad: response.norad_id || satellite.norad,
          category: satellite.category,
          start: new Date(pass.start),
          end: new Date(pass.end),
          maxElevation: safeRound(pass.max_elevation),
          aosAzimuth: safeRound(pass.aos_azimuth),
          losAzimuth: safeRound(pass.los_azimuth),
        };

        if (!earliestPass || normalizedPass.start < earliestPass.start) {
          earliestPass = normalizedPass;
        }
      }
    } catch (_) {}
  });

  await Promise.all(requests);
  return earliestPass;
}

// Load image from cache or fetch and cache if not available
const cacheImage = async (url, fileName = "satellite.jpg") => {
  const fileManager = FileManager.local();
  const path = fileManager.joinPath(fileManager.cacheDirectory(), fileName);
  try {
    // Return cached image if it exists
    if (fileManager.fileExists(path)) {
      return fileManager.readImage(path);
    } // Otherwise fetch a new image
    const image = await new Request(url).loadImage();
    fileManager.writeImage(path, image);
    return image;
  } catch (error) {
    console.error(`Failed to cache/load image: ${error}`); // Return cached image if available
    if (fileManager.fileExists(path)) return fileManager.readImage(path);
    return null;
  }
};

// Load cached background image
const background = await cacheImage(CONFIG.backgroundImageUrl);

// === UI COMPONENT BUILDERS ===
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

// Add satellite name (title) as text element
const addNameText = (widget, value) => {
  const row = widget.addStack();
  createText(row, value, STYLES.fonts.title, STYLES.colors.title, "center");
};

// Add satellite category as text element
const addCategoryText = (widget, value) => {
  const row = widget.addStack();
  createText(row, value, STYLES.fonts.subtitle, STYLES.colors.subtitle, "left");
};

// Add individual data row element
const addDataRow = (widget, value) => {
  const row = widget.addStack();
  createText(row, value, STYLES.fonts.text, STYLES.colors.text, "left");
};

// === WIDGET ASSEMBLY ===
function buildWidget(nextPass) {
  const widget = new ListWidget();
  widget.setPadding(0, -5, 0, 0); // Apply background gradient
  const backgroundGradient = new LinearGradient();
  backgroundGradient.locations = [0, 1];
  backgroundGradient.colors = STYLES.colors.gradient;
  if (background) {
    widget.backgroundImage = background;
    widget.backgroundGradient = backgroundGradient;
  } else {
    widget.backgroundColor = new Color("#000000");
  } 
  
  // Populate widget with satellite pass data
  if (nextPass) {
    addNameText(widget, nextPass.name);
    widget.addSpacer(6);

    addCategoryText(widget, nextPass.category);
    widget.addSpacer(4);

    addDataRow(
      widget,
      `${timeFormatter.string(nextPass.start)} - ${timeFormatter.string(
        nextPass.end
      )}`
    );
    widget.addSpacer(2);

    addDataRow(widget, `Max El. ${nextPass.maxElevation}°`);
    widget.addSpacer(2);

    addDataRow(widget, `Az: ${nextPass.aosAzimuth}° / ${nextPass.losAzimuth}°`);
  } else {
    // Otherwise display a fallback message
    const row = widget.addStack();
    createText(
      row,
      "Can't determine next satellite pass.",
      STYLES.fonts.text,
      STYLES.colors.text,
      "center"
    );
  } 
  
  // Auto-refresh widget
  widget.refreshAfterDate = new Date(Date.now() + CONFIG.refreshIntervalMs);

  return widget;
}

// === MAIN EXECUTION ===
async function main() {
  let latitude = CONFIG.fallbackLatitude;
  let longitude = CONFIG.fallbackLongitude; 
  
  // Get current location
  try {
    Location.setAccuracyToBest();
    const location = await Location.current().catch(() => null);
    if (location?.latitude != null && location?.longitude != null) {
      latitude = location.latitude;
      longitude = location.longitude;
    }
  } catch (_) {}

  const earliestPass = await fetchSoonestSatellitePass(latitude, longitude);
  const widget = buildWidget(earliestPass);

  if (config.runsInWidget) Script.setWidget(widget);
  else widget.presentSmall();

  Script.complete();
}

main();
