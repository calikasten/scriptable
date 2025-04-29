// Set API variables
const API_KEY = "BQ1SiSmLUOsp460VzXBlLrh689kGgYEZ";
const LOCALE = "en";

// Function to get data from API
async function getData() {
  const url = "https://api.formula1.com/v1/event-tracker/next";
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
    var f1LogoUrl = "https://calikasten.wordpress.com/wp-content/uploads/2025/04/f1-logo.png";
    var fetchLogo = new Request(f1LogoUrl);
    var f1Logo = await fetchLogo.loadImage();
    
    // Get official race name
    const raceName = data.race.meetingOfficialName;

    // Get flag of race country
    var raceCountryName = data.race.meetingCountryName;
    
    // Determine correct country when multiple races happen in a country
    if (raceCountryName == "Miami" || raceCountryName == "Las Vegas") {
    	raceCountryName = "United States";
    } else if (raceCountryName == "Emilia-Romagna") {
    	raceCountryName = "Italy";
    }
    
     // Convert whitespace in country name to "-" characters for URL
    var country = raceCountryName.toLowerCase().replace(/\s/, "-");
    var countryFlagUrl = "https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/" + country + "-flag.png";
    var fetchCountryFlag = new Request(countryFlagUrl);
    var raceCountryFlag = await fetchCountryFlag.loadImage();

    // Get race circuit image
    var raceCircuit = data.circuitSmallImage.url;
    raceCircuit = raceCircuit.slice(0, -4) + "%20carbon.png";
    var raceCircuitImage = new Request(raceCircuit);
    var trackImage = await raceCircuitImage.loadImage();

    // Get next race date
    function getNextEvent(events) {
        events.sort((a, b) => (a.startTime < b.startTime) ? -1 : 1);
    var nextEvent = {
            description: "Race Today",
      startTime: false,
      gmtOffset: 0,
        } 
      var now  = new Date();
      for (let event of events) {
          var startTime = new Date(event.startTime + event.gmtOffset);
            if (startTime > now) {
            nextEvent = event;
          break;
      }
    }
    return nextEvent;
}

// Calculate countdown until race based on date difference
function getCountdown(dateStr) {
    if (!dateStr) {
        return ["00", "00", "00"];
    }
    const diff = (Date.parse(dateStr) - Date.parse(new Date())) / 1000;
    
  // Set difference in days, hours, and minutes
  var day = Math.floor(diff / 60 / 60 / 24);
  var hour = Math.floor(diff / 60 / 60 % 24);
  var minute = Math.ceil(diff / 60 % 60);
    
  day = day.toString().padStart(2, "0");
  hour = hour.toString().padStart(2, "0");
  minute = minute.toString().padStart(2, "0");
    
  return [day, hour, minute];
}

// Function to create and customize widget UI
function createWidget(data) {
    const widget = new ListWidget();
        
        // Set widget padding
        widget.setPadding(0, 0, 0, 0);
    
	// Set widget background
        widget.backgroundColor = Color.white();
    
	// Set widget accent color
        const accentColor = new Color("e10600");

        // Add header banner with race country name, race country flag, and F1 logo
    	const header = widget.addStack();
    	header.backgroundColor = accentColor;
    	header.setPadding(10, 20, 10, 20);
                
        const flag = header.addImage(raceCountryFlag);
    	flag.imageSize = new Size(45, 30);
    	flag.cornerRadius = 4;
    	flag.borderColor = Color.white();
    	flag.borderWidth = 2;
                
        header.addSpacer();
                
    // Add official race name
    const officialRaceName = header.addText(raceName);
    officialRaceName.textColor = Color.white();
    officialRaceName.font = Font.boldSystemFont(12);
    officialRaceName.centerAlignText();
    
    header.addSpacer();
    
    const logo = header.addImage(f1Logo);
    logo.imageSize = new Size(50, 25);
    
    // Add next race event details
    var leftColumn = widget.addStack();
    leftColumn.setPadding(5, 35, 5, 35);
    
    var leftColumnTopRow = leftColumn.addStack();
    leftColumnTopRow.layoutVertically();
    leftColumnTopRow.addSpacer();
    
    var events = data.seasonContext.timetables;
    var event = getNextEvent(events);
    var eventTime = event.startTime + event.gmtOffset;
    
    const nextEventName = leftColumnTopRow.addText(event.description);
    nextEventName.textColor = accentColor;
    nextEventName.font = Font.boldSystemFont(20);
    
    // Add countdown until next race event
    var leftColumnBottomRow = leftColumnTopRow.addStack();
    leftColumnBottomRow.bottomAlignContent();
    var [day, hour, minute] = getCountdown(eventTime);
        
    // Add remaining days
    const remainingDays = leftColumnBottomRow.addText(day + ":");
    remainingDays.textColor = Color.black();
    remainingDays.font = Font.semiboldSystemFont(18);
    
    // Add remaining hours
    const remainingHours = leftColumnBottomRow.addText(hour + ":");
    remainingHours.textColor = Color.black();
    remainingHours.font = Font.semiboldSystemFont(18);
        
    // Add remaining minutes
    const remainingMinutes = leftColumnBottomRow.addText(minute);
    remainingMinutes.textColor = Color.black();
    remainingMinutes.font = Font.semiboldSystemFont(18);
    leftColumnTopRow.addSpacer(0);
        
    // Add next race event date and time
    const dateObj = new Date(eventTime);
    var timeOptions1 = {
            weekday: "long",
    }
    var timeOptions2 = {
            hour: "numeric",
            minute: "numeric",
      hour12: false
    }
    var weekday = Intl.DateTimeFormat("en", timeOptions1).format(dateObj);
    var timeStr = Intl.DateTimeFormat("en", timeOptions2).format(dateObj);
    var dateStr = weekday + ", " + timeStr;
    if (!eventTime) dateStr = "";
    const nextEventTime = leftColumnTopRow.addText(dateStr);
    nextEventTime.textColor = Color.black();
    nextEventTime.font = Font.regularSystemFont(12);
            
    leftColumn.addSpacer();
    leftColumnTopRow.addSpacer();
    
    // Add image of race track circuit
    const raceCircuitImage = leftColumn.addImage(trackImage);
    raceCircuitImage.imageSize = new Size(120, 100);
    
    // Return customized widget UI
    return widget;
}

// Display widget
let widget = createWidget(data);

// Check where the script is running
if (config.runsInWidget) {
    
    // Run inside a widget when added to the home screen 
  Script.setWidget(widget);
} else {
    
    // Otherwise show the medium widget preview inside the Scriptable app
  widget.presentMedium();
}
Script.complete();
