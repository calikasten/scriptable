// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: flag-checkered;

// === CONFIGURATION ===
const CONFIG = {
  apiKey: "<INSERT API KEY HERE>",
  locale: "en",
  apiUrl: "https://api.formula1.com/v1/event-tracker/next",
  logoUrl:
    "https://raw.githubusercontent.com/calikasten/scriptable/main/assets/f1-logo.png",
  flagBaseUrl:
    "https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/",
};

// === STYLES ===
// Define colors and image sizes
const STYLES = {
  colors: {
    background: Color.white(),
    accent: new Color("E10600"), // Official F1 red
    text: Color.black()
  },
  sizes: {
    logo: new Size(50, 25),
    flag: new Size(45, 27),
    circuit: new Size(115, 115)
  }
};

// === HELPERS ===
// Aliases for countries hosting multiple races
const COUNTRY_ALIAS = {
  Miami: "United States",
  "Las Vegas": "United States",
  "Emilia Romagna": "Italy",
};

// Map race location name to its canonical country name (if alias exists)
const aliasCountryName = (name) => COUNTRY_ALIAS[name?.trim()] || name?.trim();

// Determine the next race event based on start time and current date
function getNextEvent(events) {
  const now = new Date(); // Sort events chronologically and convert strings into date objects

  events.sort(
    (a, b) =>
      new Date(a.startTime + a.gmtOffset) - new Date(b.startTime + b.gmtOffset)
  ); // Find the next event based on current date/time

  const upcoming = events.find(
    (e) => new Date(e.startTime + e.gmtOffset) > now
  );

  return upcoming || null;
}

// Format date to weekday and time (24-hour format)
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

// Configure stacks for widget layout
function addStack(parent, layout = "horizontal", size = null, padding = null) {
  const stack = parent.addStack();
  if (layout === "vertical") stack.layoutVertically();
  else stack.layoutHorizontally();
  if (size) stack.size = size;
  if (padding) stack.setPadding(...padding);
  return stack;
}

// Calculate days, hours, and minutes remaining until a given date
function getCountdown(dateObj) {
  if (!dateObj) return [0, 0, 0];

  const now = new Date();
  const diffSec = (new Date(dateObj) - now) / 1000;
  if (diffSec < 0) return [0, 0, 0];

  const day = Math.floor(diffSec / 86400);
  const hour = Math.floor((diffSec % 86400) / 3600);
  const minute = Math.ceil((diffSec % 3600) / 60);

  return [day, hour, minute];
}

// Add formatted countdown text to the widget
function addCountdownText(stack, days, hours, minutes) {
  const display = [];
  if (days > 0) display.push(`${days}d`);
  if (hours > 0 || days > 0) display.push(`${hours}h`);
  display.push(`${minutes}m`);

  const text = stack.addText(display.join(" "));
  text.textColor = STYLES.colors.text;
  text.font = Font.semiboldSystemFont(18);
  return text;
}

// === NETWORK & API CLIENT ===
// Fetch race and schedule data from Formula 1 API
async function getData() {
  try {
    const request = new Request(CONFIG.apiUrl);
    request.headers = { apikey: CONFIG.apiKey, locale: CONFIG.locale };
    return await request.loadJSON();
  } catch (error) {
    console.error("Failed to fetch API data");
    return null;
  }
}

// Fetch images (flag, logo, or circuit)
async function getImage(url) {
  try {
    return await new Request(url).loadImage();
  } catch {
    return null;
  }
}

// === WIDGET ASSEMBLY ===
function createWidget({
  logo,
  flag,
  circuit,
  raceName,
  event,
  eventDate,
  eventFormatted,
}) {
  const widget = new ListWidget();
  widget.setPadding(0, 0, 0, 0);
  widget.backgroundColor = STYLES.colors.background; 
  
  // Add header
  const header = addStack(widget, "horizontal");
  header.backgroundColor = STYLES.colors.accent;
  header.setPadding(0, 15, 5, 45); 
  
  // Split header into three regions: left (flag), center (race name), right (F1 logo)
  const left = addStack(
    header,
    "horizontal",
    new Size(60, 60),
    [22.5, 10, 0, 2.5]
  );
  const center = addStack(
    header,
    "horizontal",
    new Size(180, 60),
    [15, 22.5, 0, 10]
  );
  center.centerAlignContent();
  const right = addStack(
    header,
    "horizontal",
    new Size(60, 60),
    [22.5, 10, 0, 0]
  ); 
  
  // Add country flag
  if (flag) {
    const imageFlag = left.addImage(flag);
    imageFlag.imageSize = STYLES.sizes.flag;
    imageFlag.cornerRadius = 4;
    imageFlag.borderColor = Color.white();
    imageFlag.borderWidth = 3;
  } 
  
  // Add race name text
  const textRace = center.addText(raceName || "No Race");
  textRace.textColor = Color.white();
  textRace.font = Font.boldSystemFont(12);
  textRace.centerAlignText();
  textRace.minimumScaleFactor = 0.75; 
  
  // Add F1 logo
  if (logo) {
    const imageLogo = right.addImage(logo);
    imageLogo.imageSize = STYLES.sizes.logo;
  } 
  
  // Add main content
  const mainStack = addStack(widget, "horizontal");
  mainStack.setPadding(0, 30, 0, 20);

  const eventStack = addStack(mainStack, "vertical");
  eventStack.addSpacer(15); 
  
  // If no upcoming event, show placeholder text and dashes
  if (!event) {
    const textEvent = eventStack.addText("Race");
    textEvent.textColor = STYLES.colors.accent;
    textEvent.font = Font.boldSystemFont(20);

    const textCountdown = eventStack.addText("---");
    textCountdown.textColor = STYLES.colors.text;
    textCountdown.font = Font.semiboldSystemFont(18);

    const textDate = eventStack.addText("In Progress");
    textDate.textColor = STYLES.colors.text;
    textDate.font = Font.regularSystemFont(12);
  } else {
    // Add event (session) name
    const textEvent = eventStack.addText(event?.description || "No Event");
    textEvent.textColor = STYLES.colors.accent;
    textEvent.font = Font.boldSystemFont(20); 
    
    // Add countdown timer below the event name
    const countdownStack = addStack(eventStack);
    countdownStack.bottomAlignContent();
    const [d, h, m] = getCountdown(eventDate);
    addCountdownText(countdownStack, d, h, m);
    countdownStack.setPadding(5, 0, 0, 0); 
    
    // Add formatted event date/time text
    const textDate = eventStack.addText(eventFormatted);
    textDate.textColor = STYLES.colors.text;
    textDate.font = Font.regularSystemFont(12);
  }

  mainStack.addSpacer();
  eventStack.addSpacer(); 
  
  // Add circuit image to the right side
  if (circuit) {
    const imageCircuit = mainStack.addImage(circuit);
    imageCircuit.imageSize = STYLES.sizes.circuit;
  } 
  
  // Return widget with its constructed UI elements
  return widget;
}

// === MAIN EXECUTION ===
// Fetch event tracker data
const data = await getData();
if (!data) {
  console.error("No data returned from API.");
  return;
}

// Extract relevant event and race information from API response
const events = data.seasonContext.timetables;
const raceName = data.race.meetingOfficialName;
const raceCountrySlug = aliasCountryName(data.race.meetingCountryName)
  .toLowerCase()
  .replace(/\s/g, "-");

// Fetch required images (logo, flag, and circuit image)
const [logo, flag, circuit] = await Promise.all([
  getImage(CONFIG.logoUrl),
  getImage(`${CONFIG.flagBaseUrl}${raceCountrySlug}-flag.png`),
  data.circuitSmallImage?.url
    ? getImage(data.circuitSmallImage.url.replace(/\.\w+$/, "%20carbon.png"))
    : Promise.resolve(null),
]);

// Determine the next upcoming session (or null if all past)
const event = getNextEvent(events);
const eventDate = event ? new Date(event.startTime + event.gmtOffset) : null;

// Calculate countdown
const eventFormatted = eventDate ? formatDateTime(eventDate) : "---";

// Display widget
const widget = createWidget({
  logo,
  flag,
  circuit,
  raceName,
  event,
  eventDate,
  eventFormatted,
});

// Run in widget or display preview
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}

Script.complete();
