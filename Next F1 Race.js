// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: flag-checkered;

// Set API variables
const API_KEY = "";
const LOCALE = "";

// Function to get data from API
async function getData() {
  const url = "https://api.formula1.com/v1/event-tracker";
  const newRequest = await new Request(url);
  newRequest.headers = {
    apikey: API_KEY,
    locale: LOCALE,
  };
  const response = await newRequest.loadJSON();
  return response;
}

// Define variables from API response
const data = await getData();

// Get F1 logo
var f1LogoUrl = "https://felix-bernhard.com/f1-logo.png";
var fetchLogo = new Request(f1LogoUrl);
var f1Logo = await fetchLogo.loadImage();

// Get flag of race country
var raceCountryName = data.race.meetingCountryName;
// Convert whitespace in country name to "-" characters for URL
var country = raceCountryName.toLowerCase().replace(/\s/, "-");
var countryFlagUrl =
  "https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/" +
  country +
  "-flag.png";
var fetchCountryFlag = new Request(countryFlagUrl);
var raceCountryFlag = await fetchCountryFlag.loadImage();

// Get race circuit image
var raceCircuit = data.circuitSmallImage.url;
raceCircuit = raceCircuit.slice(0, -4) + "%20carbon.png"; // dark version
var raceCircuitImage = new Request(raceCircuit);
var trackImage = await raceCircuitImage.loadImage();

// Get next race date
function getNextEvent(events) {
  events.sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
  var nextEvent = {
    description: "-",
    startTime: false,
    gmtOffset: 0,
  };
  var now = new Date();
  for (let event of events) {
    var startTime = new Date(event.startTime + event.gmtOffset);
    if (startTime > now) {
      nextEvent = event;
      break;
    }
  }
  return nextEvent;
}

// Calculate countdown until rased based on date difference
function getCountdown(dateStr) {
  if (!dateStr) {
    return ["--", "--", "--"];
  }
  var date = new Date(dateStr);
  var now = new Date();
  var diff = (date - now) / 1000;

  // Set difference in days, hours, and minutes
  var d = Math.floor(diff / 60 / 60 / 24);
  var h = Math.floor((diff / 60 / 60) % 24);
  var m = Math.ceil((diff / 60) % 60);

  d = d.toString().padStart(2, "0");
  h = h.toString().padStart(2, "0");
  m = m.toString().padStart(2, "0");

  return [d, h, m];
}

// Function to create and customize widget UI
function createWidget(data) {
  const widget = new ListWidget();

  // Set widget padding
  widget.setPadding(0, 0, 0, 0);
  // Set widget background
  widget.backgroundColor = new Color("FFFFFF");
  // Set widget accent color
  const accentColor = new Color("e10600");

  // Add header banner with race country name, race country flag, and F1 logo
  const header = widget.addStack();
  header.backgroundColor = accentColor;
  header.setPadding(12, 16, 12, 16);

  const raceCountry = header.addText(raceCountryName);
  raceCountry.textColor = Color.white();
  raceCountry.font = Font.boldSystemFont(20);

  header.addSpacer(8);

  const flag = header.addImage(raceCountryFlag);
  flag.imageSize = new Size(35, 25);
  flag.cornerRadius = 4;
  flag.borderColor = new Color("FFFFFF");
  flag.borderWidth = 2;

  header.addSpacer();

  const logo = header.addImage(f1Logo);
  logo.imageSize = new Size(50, 25);

  // Add race name
  var leftColumn = widget.addStack();
  leftColumn.setPadding(6, 16, 6, 16);

  var leftColumnTopRow = leftColumn.addStack();
  leftColumnTopRow.layoutVertically();
  leftColumnTopRow.addSpacer();

  var events = data.seasonContext.timetables;
  var event = getNextEvent(events);
  var eventTime = event.startTime + event.gmtOffset;

  var nextEventName = leftColumnTopRow.addText(event.description);
  nextEventName.textColor = accentColor;
  nextEventName.font = Font.boldSystemFont(20);

  // Add countdown until next race event
  var leftColumnBottomRow = leftColumnTopRow.addStack();
  leftColumnBottomRow.bottomAlignContent();
  leftColumnBottomRow.setPadding(8, 0, 0, 0);

  var [d, h, m] = getCountdown(eventTime);

  // Add remaining days
  var remainingDays = leftColumnBottomRow.addText(d + ":");
  remainingDays.textColor = Color.black();
  remainingDays.font = Font.semiboldSystemFont(18);

  // Add remaining hours
  var remainingHours = leftColumnBottomRow.addText(h + ":");
  remainingHours.textColor = Color.black();
  remainingHours.font = Font.semiboldSystemFont(18);

  // Add remaining minutes
  var remainingMinutes = leftColumnBottomRow.addText(m);
  remainingMinutes.textColor = Color.black();
  remainingMinutes.font = Font.semiboldSystemFont(18);

  // Add next race event date and time
  var dateObj = new Date(eventTime);
  var timeOptions1 = {
    weekday: "long",
  };
  var timeOptions2 = {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  };
  var weekday = Intl.DateTimeFormat("en", timeOptions1).format(dateObj);
  var timeStr = Intl.DateTimeFormat("en", timeOptions2).format(dateObj);
  var dateStr = weekday + ", " + timeStr;
  if (!eventTime) dateStr = "-";
  var nextEventTime = leftColumnTopRow.addText(dateStr);
  nextEventTime.textColor = Color.black();
  nextEventTime.font = Font.regularSystemFont(12);

  leftColumn.addSpacer();
  leftColumnTopRow.addSpacer();

  // Add image of race track circuit
  var raceCircuitImage = leftColumn.addImage(trackImage);
  raceCircuitImage.imageSize = new Size(120, 100);

  // Return customized widget UI
  return widget;
}

// Display widget
const nextF1Race = createWidget(data);

// Check where the script is running and run in widget
if (config.runsInWidget) {
  Script.setWidget(nextF1Race);
} else {
  nextF1Race.presentMedium();
}

Script.complete();
