// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: globe;

// === CONFIGURATION ===
// Default fallback location if device location is unavailable
const CONFIG = {
  fallbackLatitude: 41.90421705471727,
  fallbackLongitude: -87.6626416108551,
  apiUrl: "",
  cacheDurationMs: 30 * 60 * 1000, // 30 minutes
  backgroundImageUrl:
    "https://calikasten.wordpress.com/wp-content/uploads/2025/12/satellite-2.jpeg",
  refreshIntervalMs: 15 * 60 * 1000, // 15 minutes
};

const SATELLITES = [
  { name: "ISS (Zarya)", norad: 25544, category: "Space Station" },
  { name: "Tiangong", norad: 48274, category: "Space Station" },
  { name: "Hubble Space Telescope", norad: 20580, category: "Scientific" }, // NOAA & Meteorological

  { name: "NOAA 15", norad: 25338, category: "Weather" },
  { name: "NOAA 17", norad: 27453, category: "Weather" },
  { name: "NOAA 18", norad: 28654, category: "Weather" },
  { name: "NOAA 19", norad: 33591, category: "Weather" },
  { name: "METEOR M2-2", norad: 44387, category: "Weather" },
  { name: "SUOMI NPP", norad: 37849, category: "Weather" },
  { name: "NOAA 20 (JPSS 1)", norad: 43013, category: "Weather" },
  { name: "NOAA-21 (JPSS-2)", norad: 54234, category: "Weather" }, // Amateur Radio (AMSAT)

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
  { name: "CATSAT", norad: 60246, category: "Amateur Radio" }, // Earth Observation / Scientific

  { name: "Terra", norad: 25994, category: "Earth Observation" },
  { name: "Aqua", norad: 27424, category: "Earth Observation" },
];

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
function round(value) {
  return Number.isFinite(value) ? Math.round(value) : "-";
}

const DATE_FORMATTER = new DateFormatter();
DATE_FORMATTER.useMediumDateStyle();

const TIME_FORMATTER = new DateFormatter();
TIME_FORMATTER.useShortTimeStyle();

// === NETWORK / API CLIENT ===
async function fetchNextSatellitePass(satellite, latitude, longitude) {
  const url =
    `https://api.g7vrd.co.uk/v1/satellite-passes/${satellite.norad}/` +
    `${latitude}/${longitude}.json?min_elevation=70&hours=24`;

  try {
    const response = await new Request(url).loadJSON();
    const passList = response.passes;

    if (passList?.length > 0) {
      const p = passList.at(0);
      return {
        name: response.satellite_name || satellite.name,
        norad: response.norad_id || satellite.norad,
        category: satellite.category,
        start: new Date(p.start),
        end: new Date(p.end),
        maxElevation: round(p.max_elevation),
        aosAzimuth: round(p.aos_azimuth),
        losAzimuth: round(p.los_azimuth),
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

  const soonest = results.reduce((earliest, pass) => {
    if (!pass) return earliest;
    if (!earliest || +pass.start < +earliest.start) return pass;
    return earliest;
  }, null);
  return soonest;
}

// Load image
const background = await new Request(CONFIG.backgroundImageUrl).loadImage();

// === UI COMPONENT BUILDERS ===
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

const addTitleText = (widget, value) => {
  const textElement = createText(
    widget,
    value,
    STYLES.fonts.title,
    STYLES.colors.title,
    "center"
  );
};

const subtitleText = (widget, value) => {
  const textElement = createText(
    widget,
    value,
    STYLES.fonts.title,
    STYLES.colors.title,
    "center"
  );
};

const dataText = (widget, value) => {
  const textElement = createText(
    widget,
    value,
    STYLES.fonts.title,
    STYLES.colors.title,
    "center"
  );
};

// === WIDGET ASSEMBLY ===
function buildWidget(nextPass) {
  const widget = new ListWidget();
  widget.setPadding(0, -5, 0, 0);

  if (background) {
    widget.backgroundImage = background;
    const gradient = new LinearGradient();
    gradient.locations = [0, 1];
    gradient.colors = STYLES.colors.gradient;
    widget.backgroundGradient = gradient;
  } else {
    widget.backgroundColor = new Color("#000000");
  }

  if (nextPass) {
    addTitleText(widget, nextPass.name);
    widget.addSpacer(6);

    addSubtitleText(widget, nextPass.category);
    widget.addSpacer(4);

    addDataText(
      widget,
      `${TIME_FORMATTER.string(nextPass.start)} - ${TIME_FORMATTER.string(
        nextPass.end
      )}`
    );
    widget.addSpacer(2);

    addDataText(widget, `Max El. ${nextPass.maxElevation}°`);
    widget.addSpacer(2);

    addDataText(
      widget,
      `Az: ${nextPass.aosAzimuth}° / ${nextPass.losAzimuth}°`
    );
  } else {
    createText(
      widget,
      "Can't determine next satellite pass.",
      STYLES.fonts.text,
      STYLES.colors.text,
      "center"
    );
  }

  return widget;
}

// === MAIN EXECUTION ===
async function main() {
  let latitude = CONFIG.fallbackLatitude;
  let longitude = CONFIG.fallbackLongitude;

  try {
    Location.setAccuracyToBest();
    const loc = await Location.current();
    if (loc?.latitude && loc?.longitude) {
      latitude = loc.latitude;
      longitude = loc.longitude;
    }
  } catch (_) {}

  const soonestPass = await fetchSoonestSatellitePass(
    SATELLITES,
    latitude,
    longitude
  );
  const widget = buildWidget(soonestPass);

  if (config.runsInWidget) Script.setWidget(widget);
  else widget.presentSmall();

  Script.complete();
}

main();
