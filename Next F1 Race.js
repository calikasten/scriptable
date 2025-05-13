// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: flag-checkered;

// Set API variables
const API_KEY = "INSERT API TOKEN HERE";
const LOCALE = "en";

// Function to get data from API
async function getData() {
  const url = "https://api.formula1.com/v1/event-tracker/next";
  try {
    const newRequest = await new Request(url);
    newRequest.headers = {
      apikey: API_KEY,
      locale: LOCALE,
    };
    const response = await newRequest.loadJSON(); 
    
    // Check if responsei s valid, log response, and return data
    //console.log(response);
    return response;
  } catch (error) {
    console.error("Failed to fetch data from API."); 
    
    // Don't return anything if API request fails
    return null;
  }
}

// Helper function to fetch images
async function getImage(url) {
  const newRequest = new Request(url);
  return await newRequest.loadImage();
}

// Set country name aliasing for countries with multiple races
const COUNTRY_ALIAS = {
  "Miami": "United States",
  "Las-Vegas": "United States",
  "Emilia-Romagna": "Italy",
};

// Helper function to alias country name
function aliasCountryName(countryName) {
  return COUNTRY_ALIAS[countryName] || countryName;
}

// Fetch data from API and parse response
const data = await getData();
const raceName = data.race.meetingOfficialName;
const raceCountryName = aliasCountryName(data.race.meetingCountryName)
  .toLowerCase()
  .replace(/\s/g, "-");
const flagUrl =
  "https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/" +
  raceCountryName +
  "-flag.png";
const circuitUrl = data.circuitSmallImage.url.slice(0, -4) + "%20carbon.png";

// Function to load all images (logo, flag, circuit)
const [logo, flag, circuit] = await Promise.all([
  getImage(
    "https://calikasten.wordpress.com/wp-content/uploads/2025/04/f1-logo.png"
  ),
  getImage(flagUrl),
  getImage(circuitUrl),
]);

// Function to get next race event
const events = data.seasonContext.timetables;
const event = getNextEvent(events);
const eventTime = event.startTime + event.gmtOffset

function getNextEvent(events) {
    let now  = new Date()
    
    // Select information to include about events
    let nextEvent = {
        description: "-",
        startTime: false,
        gmtOffset: 0,
    }
    
    // Sort events in chronological order
    events.sort((a, b) => (a.startTime < b.startTime) ? -1 : 1)
    
    // Loop through events to filter on only the next upcoming event
    for (let event of events) {
        let startTime = new Date(event.startTime + event.gmtOffset)
        if (startTime > now) {
            nextEvent = event;
            break;
        }
    }
    return nextEvent
    
}

// Adjust next event date/time formatting
let dateObj = new Date(eventTime);

let weekdayFormat = { weekday: "long" };
let timeFormat = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

let weekday = new Intl.DateTimeFormat("en", weekdayFormat).format(dateObj);
let time = new Intl.DateTimeFormat("en", timeFormat).format(dateObj);

let eventFormatted = `${weekday}, ${time}`;
console.log(eventFormatted)

// Function to calculate countdown until next race event
function getCountdown(nextEvent) {
    if (!nextEvent) {
       return ["--", "--", "--"];
    }
    
    // Calculate time difference until next event
    let date = new Date(nextEvent);
    let now  = new Date();
    let diff = (date - now) / 1000;
    
    // Set difference in days, hours, and minutes
    let day = Math.floor(diff / 60 / 60 / 24);
    let hour = Math.floor(diff / 60 / 60 % 24);
    let minute = Math.ceil(diff / 60 % 60);
    
    day = day.toString().padStart(2, "0");
    hour = hour.toString().padStart(2, "0");
    minute = minute.toString().padStart(2, "0");
    return [day, hour, minute]
}

// Helper function to apply consistent styling to countdown text
function formatCountdownText(widget, value) {
  const countdown = widget.addText(value);
  countdown.textColor = Color.black();
  countdown.font = Font.semiboldSystemFont(18);
  return countdown;
}

// Function to create and customize widget UI
function createWidget(data) {
  const widget = new ListWidget();
  widget.setPadding(0, 0, 0, 0);
  widget.backgroundColor = Color.white();

  const accentColor = new Color("E10600"); 
  
  // Add red banner as header 
  const header = widget.addStack();
  header.backgroundColor = accentColor;
  header.setPadding(5, 15, 5, 15);
  header.layoutHorizontally();
    
    // Create left, center, and right sections in header
    const leftStack = header.addStack();
    leftStack.layoutHorizontally();
    leftStack.size = new Size(60, 60);
    leftStack.setPadding(25, 0, 0, 15);
    
    const centerStack = header.addStack();
    //centerStack.layoutHorizontally();
    centerStack.centerAlignContent();
    centerStack.size = new Size(180, 60);
    centerStack.setPadding(15, 0, 0, 0)
    
    const rightStack = header.addStack();
    rightStack.layoutHorizontally();
    rightStack.size = new Size(60, 60);
    rightStack.setPadding(25, 15, 0, 0)
    
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
    F1logo.imageSize = new Size(50, 25);

  // Add next race event name
  const leftColumn = widget.addStack();
  leftColumn.setPadding(5, 35, 5, 35);

  const leftColumnTopRow = leftColumn.addStack();
  leftColumnTopRow.layoutVertically();
  leftColumnTopRow.addSpacer(15);

  const nextEventName = leftColumnTopRow.addText(event?.description || "No Event");
  nextEventName.textColor = accentColor;
  nextEventName.font = Font.boldSystemFont(20); 
  
  // Add countdown until next race event
  const leftColumnBottomRow = leftColumnTopRow.addStack();
  leftColumnBottomRow.bottomAlignContent();

  const [day, hour, minute] = getCountdown(eventTime);
  formatCountdownText(leftColumnBottomRow, day + ":");
  formatCountdownText(leftColumnBottomRow, hour + ":");
  formatCountdownText(leftColumnBottomRow, minute);

  leftColumnTopRow.addSpacer(0);
  
  // Add next race event date and time
  const nextEventTime = leftColumnTopRow.addText(eventFormatted);
  nextEventTime.textColor = Color.black();
  nextEventTime.font = Font.regularSystemFont(12);

  leftColumn.addSpacer();
  leftColumnTopRow.addSpacer(); 
  
  // Add image of race track circuit
  const raceCircuit = leftColumn.addImage(circuit);
  raceCircuit.imageSize = new Size(130, 108); 
  
  // Return customized widget UI
  return widget;
}

// Display widget
const widget = await createWidget(data);

// Check where the script is running
if (config.runsInWidget) {
  // Run inside widget
  Script.setWidget(widget);
} else {
  // Otherwise show preview
  widget.presentMedium();
}
Script.complete();
