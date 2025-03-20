// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyphy: flag-checkered;

// Set API variables
const API_KEY = "<INSERT API KEY HERE>";
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
};

// Define variables from API response
const data = await getData();
	
	// Get F1 logo
	const f1LogoUrl = "https://1000logos.net/wp-content/uploads/2021/06/F1-logo.png";
	const fetchLogo = new Request(f1LogoUrl);
	const f1Logo = await fetchLogo.loadImage();
	
	// Get official race name
	const raceName = data.race.meetingOfficialName;

	// Get flag of race country
	const raceCountryName = data.race.meetingCountryName;
 	// Convert whitespace in country name to "-" characters for URL
	const country = raceCountryName.toLowerCase().replace(/\s/, "-");
	const countryFlagUrl = "https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/" + country + "-flag.png";
	const fetchCountryFlag = new Request(countryFlagUrl);
	const raceCountryFlag = await fetchCountryFlag.loadImage();

	// Get race circuit image
	const raceCircuit = data.circuitSmallImage.url;
	raceCircuit = raceCircuit.slice(0, -4) + "%20carbon.png";
	const raceCircuitImage = new Request(raceCircuit);
	const trackImage = await raceCircuitImage.loadImage();

	// Get next race date
	function getNextEvent(events) {
		events.sort((a, b) => (a.startTime < b.startTime) ? -1 : 1);
    		const nextEvent = {
		        description: "Race Today",
      			startTime: false,
      			gmtOffset: 0,
		} ;
  	const now  = new Date();
  	for (let event of events) {
  		const startTime = new Date(event.startTime + event.gmtOffset);
			if (startTime > now) {
    				nextEvent = event;
      				break;
      				};
    		};
    	return nextEvent;
	};

// Calculate countdown until race based on date difference
function getCountdown(dateStr) {
	if (!dateStr) {
		return ["00", "00", "00"];
	};
  	const diff = (Date.parse(dateStr) - Date.parse(new Date())) / 1000;
    
	// Set difference in days, hours, and minutes
	const d = Math.floor(diff / 60 / 60 / 24);
	const h = Math.floor(diff / 60 / 60 % 24);
	const m = Math.ceil(diff / 60 % 60);
    
  	d = d.toString().padStart(2, "0");
	h = h.toString().padStart(2, "0");
	m = m.toString().padStart(2, "0");
    
  	return [d, h, m];
};

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
   		header.setPadding(22, 20, 12, 16);
				
		const flag = header.addImage(raceCountryFlag);
    		flag.imageSize = new Size(45, 30);
    		flag.cornerRadius = 4;
    		flag.borderColor = Color.white();
    		flag.borderWidth = 3;
				
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
		const leftColumn = widget.addStack();
		leftColumn.setPadding(6, 16, 6, 16);
		    
		const leftColumnTopRow = leftColumn.addStack();
		leftColumnTopRow.layoutVertically();
		leftColumnTopRow.addSpacer();
    
		const events = data.seasonContext.timetables;
		const event = getNextEvent(events);
		const eventTime = event.startTime + event.gmtOffset;
    
    		const nextEventName = leftColumnTopRow.addText(event.description);
    		nextEventName.textColor = accentColor;
    		nextEventName.font = Font.boldSystemFont(16);
    
    		// Add countdown until next race event
    		const leftColumnBottomRow = leftColumnTopRow.addStack();
    		leftColumnBottomRow.bottomAlignContent();
    		leftColumnBottomRow.setPadding(8, 0, 0, 0);
    
   		const [d, h, m] = getCountdown(eventTime);
        
    		// Add remaining days
    		const remainingDays = leftColumnBottomRow.addText(d + ":");
    		remainingDays.textColor = Color.black();
   		remainingDays.font = Font.semiboldSystemFont(18);
    
    		// Add remaining hours
    		const remainingHours = leftColumnBottomRow.addText(h + ":");
    		remainingHours.textColor = Color.black();
    		remainingHours.font = Font.semiboldSystemFont(18);
        
		// Add remaining minutes
    		const remainingMinutes = leftColumnBottomRow.addText(m);
    		remainingMinutes.textColor = Color.black();
    		remainingMinutes.font = Font.semiboldSystemFont(18);
    		leftColumnTopRow.addSpacer(4);
    
    		// Add next race event date and time
    		const dateObj = new Date(eventTime);
    		const timeOptions1 = {
			weekday: "long",
    		}
   		const timeOptions2 = {
			hour: "numeric",
			minute: "numeric",
      			hour12: false
    		}
    		const weekday = Intl.DateTimeFormat("en", timeOptions1).format(dateObj);
    		const timeStr = Intl.DateTimeFormat("en", timeOptions2).format(dateObj);
    		const dateStr = weekday + ", " + timeStr;
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
};

// Display widget
const widget = createWidget(data);

// Check where the script is running
if (config.runsInWidget) {
	// Run inside a widget when added to the home screen 
	Script.setWidget(widget);
} else {
	// Otherwise show the medium widget preview inside the Scriptable app
  	widget.presentMedium();
};
Script.complete();
