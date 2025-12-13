// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: globe;

// === CONFIGURATION ===
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

// Default fallback location if device location is unavailable
const settings = {
  fallbackLatitude: "<LAT>",
  fallbackLongitude: "<LONG>",
  apiUrl: "",
  backgroundImageUrl:
    "https://calikasten.wordpress.com/wp-content/uploads/2025/12/satellite-2.jpeg",
  refreshIntervalMs: 5 * 60 * 1000, // 5 minutes
};

// === STYLES ===
const styles = {
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
function safeRound(value) {
  return Number.isFinite(value) ? Math.round(value) : "-";
}

const dateFormatter = new DateFormatter();
dateFormatter.useMediumDateStyle();

const timeFormatter = new DateFormatter();
timeFormatter.useShortTimeStyle();

// === NETWORK / API CLIENT ===
async function fetchNextSatellitePass(satellite, latitude, longitude) {
  const url =
    `https://api.g7vrd.co.uk/v1/satellite-passes/${satellite.norad}/${latitude}/${longitude}.json?min_elevation=70&hours=24`;

  try {
    const response = await new Request(url).loadJSON();
    const passList = response.passes;

    if (passList?.length > 0) {
      const pass = passList.at(0);
      return {
        name: response.satellite_name || satellite.name,
        norad: response.norad_id || satellite.norad,
        category: satellite.category,
        start: new Date(pass.start),
        end: new Date(pass.end),
        maxElevation: safeRound(pass.max_elevation),
        aosAzimuth: safeRound(pass.aos_azimuth),
        losAzimuth: safeRound(pass.los_azimuth),
      };
    }
  } catch (_) {}

  return null;
}

async function fetchSoonestSatellitePass(satellites, latitude, longitude) {
  const promises = satellites.map((satellite) =>
    fetchNextSatellitePass(satellite, latitude, longitude)
  );

  const results = await Promise.all(promises);

  let earliestPass = null;
  for (const pass of results) {
    if (!pass) continue;
    if (!earliestPass || pass.start < earliestPass.start) {
      earliestPass = pass;
    }
  }
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
const background = await cacheImage(settings.backgroundImageUrl);

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
  createText(row, value, styles.fonts.title, styles.colors.title, "center");
};

// Add satellite category as text element
const addCategoryText = (widget, value) => {
  const row = widget.addStack();
  createText(row, value, styles.fonts.subtitle, styles.colors.subtitle, "left");
};

// Add individual data row element
const addDataRow = (widget, value) => {
  const row = widget.addStack();
  createText(row, value, styles.fonts.text, styles.colors.text, "left");
};

// === WIDGET ASSEMBLY ===
function buildWidget(nextPass) {
  const widget = new ListWidget();
  widget.setPadding(0, -5, 0, 0); // Apply background gradient

  const backgroundGradient = new LinearGradient();
  backgroundGradient.locations = [0, 1];
  backgroundGradient.colors = styles.colors.gradient;
  if (background) {
    widget.backgroundImage = background;
    widget.backgroundGradient = backgroundGradient;
  } else {
    widget.backgroundColor = new Color("#000000");
  }

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
    const row = widget.addStack();
    createText(
      row,
      "Can't determine next satellite pass.",
      styles.fonts.text,
      styles.colors.text,
      "center"
    );
  } 
  
  // Auto-refresh widget
  widget.refreshAfterDate = new Date(Date.now() + settings.refreshIntervalMs);

  return widget;
}

// === MAIN EXECUTION ===
async function main() {
  let latitude = settings.fallbackLatitude;
  let longitude = settings.fallbackLongitude;

  try {
    Location.setAccuracyToBest();
    const location = await Location.current().catch(() => null);
    if (location?.latitude != null && location?.longitude != null) {
      latitude = location.latitude;
      longitude = location.longitude;
    }
  } catch (_) {}

  const earliestPass = await fetchSoonestSatellitePass(
    SATELLITES,
    latitude,
    longitude
  );
  const widget = buildWidget(earliestPass);

  if (config.runsInWidget) Script.setWidget(widget);
  else widget.presentSmall();

  Script.complete();
}

main();
