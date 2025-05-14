// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: flag-checkered;

// ===== SET UP =====

// Constants
const CONFIG = {
  API_KEY: "INSERT API TOKEN HERE",
  LOCALE: "en",
  API_URL: "https://api.formula1.com/v1/event-tracker/next",
  LOGO_URL:
    "https://calikasten.wordpress.com/wp-content/uploads/2025/04/f1-logo.png",
  FLAG_BASE_URL:
    "https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/",
};

// Set country name aliasing for countries with multiple races
const COUNTRY_ALIAS = {
  Miami: "United States",
  "Las-Vegas": "United States",
  "Emilia-Romagna": "Italy",
};

// UI colors
const COLORS = {
  backgroundColor: Color.white(),
  accentColor: new Color("E10600"),
  textColor: Color.black(),
};

// UI image sizing
const SIZES = {
  logo: new Size(50, 25),
  flag: new Size(45, 27),
  circuit: new Size(130, 108),
};

// ===== HELPER FUNCTIONS =====

// Get data
async function getData() {
  try {
    const newRequest = await new Request(CONFIG.API_URL);
    newRequest.headers = {
      apikey: CONFIG.API_KEY,
      locale: CONFIG.LOCALE,
    };
    const response = await newRequest.loadJSON(); // Check if response is valid, log response, and return data
    return response;
  } catch (error) {
    console.error("Failed to fetch data from API."); // Don't return anything if API request fails
    return null;
  }
}

// Get images
async function getImage(url) {
  const newRequest = new Request(url);
  return await newRequest.loadImage();
}

// Alias country name
function aliasCountryName(countryName) {
  return COUNTRY_ALIAS[countryName] || countryName;
}

// Get next race event
function getNextEvent(events) {
  let now = new Date();

  // Select information to include about events
  let nextEvent = {
    description: "-",
    startTime: false,
    gmtOffset: 0,
  };

  // Sort events in chronological order
  events.sort((a, b) => (a.startTime < b.startTime ? -1 : 1));

  // Loop through events to filter on only the next upcoming event
  for (let event of events) {
    let startTime = new Date(event.startTime + event.gmtOffset);
    if (startTime > now) {
      nextEvent = event;
      break;
    }
  }
  return nextEvent;
}

// Adjust next event date/time formatting
function formatDateTime(dateObj) {
  const weekday = new Intl.DateTimeFormat("en", { weekday: "long" }).format(
    dateObj
  );
  const time = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dateObj);
  return `${weekday}, ${time}`;
}

// Calculate countdown until next race event
function getCountdown(nextEvent) {
  if (!nextEvent) {
    return ["--", "--", "--"];
  }

  const now = new Date();
  const eventDate = new Date(nextEvent);
  let diff = (eventDate - now) / 1000;

  // If all events are in the past display 0's
  if (diff < 0) return ["00", "00", "00"];

  const day = String(Math.floor(diff / 86400)).padStart(2, "0");
  const hour = String(Math.floor((diff % 86400) / 3600)).padStart(2, "0");
  const minute = String(Math.ceil((diff % 3600) / 60)).padStart(2, "0");

  return [day, hour, minute];
}

// Apply consistent styling to countdown text
function formatCountdownText(widget, value) {
  const countdown = widget.addText(value);
  countdown.textColor = Color.black();
  countdown.font = Font.semiboldSystemFont(18);
  return countdown;
}

// Create and customize widget UI
function createWidget({
  logo,
  flag,
  circuit,
  raceName,
  event,
  eventTime,
  eventFormatted,
}) {
  const widget = new ListWidget();
  widget.setPadding(0, 0, 0, 0);
  widget.backgroundColor = Color.white();

  const accentColor = new Color("E10600"); // Add red banner as header
  const header = widget.addStack();
  header.backgroundColor = accentColor;
  header.setPadding(5, 15, 5, 25);
  header.layoutHorizontally();

  // Create left, center, and right sections in header
  const leftStack = header.addStack();
  leftStack.layoutHorizontally();
  leftStack.size = new Size(60, 60);
  leftStack.setPadding(25, 0, 0, 10);

  const centerStack = header.addStack();
  centerStack.centerAlignContent();
  centerStack.size = new Size(180, 60);
  centerStack.setPadding(15, 0, 0, 15);

  const rightStack = header.addStack();
  rightStack.layoutHorizontally();
  rightStack.size = new Size(60, 60);
  rightStack.setPadding(25, 2.5, 0, 0);

  // Add race country flag to left stack of header
  const raceCountryFlag = leftStack.addImage(flag);
  raceCountryFlag.imageSize = new Size(45, 27);
  raceCountryFlag.cornerRadius = 3;
  raceCountryFlag.borderColor = Color.white();
  raceCountryFlag.borderWidth = 3;

  // Add race name to center stack of header
  const officialRaceName = centerStack.addText(raceName);
  officialRaceName.textColor = Color.white();
  officialRaceName.font = Font.boldSystemFont(11);
  officialRaceName.centerAlignText();
  officialRaceName.minimumScaleFactor = 0.75;

  // Add F1 logo to right stack of header
  const F1logo = rightStack.addImage(logo);
  F1logo.imageSize = new Size(50, 25); // Add next race event name

  const leftColumn = widget.addStack();
  leftColumn.setPadding(5, 35, 5, 35);

  const leftColumnTopRow = leftColumn.addStack();
  leftColumnTopRow.layoutVertically();
  leftColumnTopRow.addSpacer(15);

  const nextEventName = leftColumnTopRow.addText(
    event?.description || "No Event"
  );
  nextEventName.textColor = accentColor;
  nextEventName.font = Font.boldSystemFont(20); // Add countdown until next race event
  const leftColumnBottomRow = leftColumnTopRow.addStack();
  leftColumnBottomRow.bottomAlignContent();

  const [day, hour, minute] = getCountdown(eventTime);
  formatCountdownText(leftColumnBottomRow, day + ":");
  formatCountdownText(leftColumnBottomRow, hour + ":");
  formatCountdownText(leftColumnBottomRow, minute);

  leftColumnTopRow.addSpacer(0); // Add next race event date and time
  const nextEventTime = leftColumnTopRow.addText(eventFormatted);
  nextEventTime.textColor = Color.black();
  nextEventTime.font = Font.regularSystemFont(12);

  leftColumn.addSpacer();
  leftColumnTopRow.addSpacer(); // Add image of race track circuit
  const raceCircuit = leftColumn.addImage(circuit);
  raceCircuit.imageSize = new Size(130, 108); // Return customized widget UI
  return widget;
}

// ===== SCRIPT EXECUTION =====

// Parse API response for variables
const data = await getData();
const events = data.seasonContext.timetables;
const raceName = data.race.meetingOfficialName;
const raceCountryName = aliasCountryName(data.race.meetingCountryName)
  .toLowerCase()
  .replace(/\s/g, "-");

// Construct URL for race country flag
const flagUrl = `${CONFIG.FLAG_BASE_URL}${raceCountryName}-flag.png`;

// Construct URL for race circuit image
const circuitUrl = data.circuitSmallImage.url.slice(0, -4) + "%20carbon.png";

// Load all image assets (logo, flag, circuit)
const [logo, flag, circuit] = await Promise.all([
  getImage(CONFIG.LOGO_URL),
  getImage(flagUrl),
  getImage(circuitUrl),
]);

// Format next event date and time
const event = getNextEvent(events);
const eventTime = event.startTime + event.gmtOffset;
const eventFormatted = formatDateTime(new Date(eventTime));

// Display widget
const widget = createWidget({
  logo,
  flag,
  circuit,
  raceName,
  event,
  eventTime,
  eventFormatted,
});

// Check where the script is running
if (config.runsInWidget) {
  // Run inside widget
  Script.setWidget(widget);
} else {
  // Otherwise show preview
  widget.presentMedium();
}
Script.complete();
