// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: space-shuttle;
// Function to get data from API
async function getData() {
  	const url = "https://lldev.thespacedevs.com/2.2.0/launch/upcoming";
  	const newRequest = await new Request(url);
    const response = await newRequest.loadJSON();
    return response;
}

// Define variables from API response
const data = await getData();

	// Get background image
  var imageUrl = "https://media.wired.com/photos/5bbadf1c40061e2cf09198a9/master/w_2240,c_limit/SpaceX-1047301226a.jpg";
  var fetchImage = new Request(imageUrl);
  const image = await fetchImage.loadImage();

	// Get launch details
	var launchDetails = data.results;

	// Get mission name
	var missionDetails = launchDetails["0"]["mission"];
  var missionName = missionDetails.name;
	
  // Get type of rocket
  var rocketDetails = launchDetails["0"]["rocket"];
	var rocketType = rocketDetails.configuration.name;
    
  // Get launch time
  var launchTimestamp = launchDetails["0"]["net"];
  var launchDate = new Date(launchTimestamp);
  	var formatDate = {
			month: "numeric",
      day: "numeric",
      year: "2-digit"
    }
    var formatTime = {
			hour: "numeric",
			minute: "numeric",
      hour12: false
    }
    var dateString = Intl.DateTimeFormat("en", formatDate).format(launchDate);
    var timeString = Intl.DateTimeFormat("en", formatTime).format(launchDate);
    var launchDateTime = dateString + " at " + timeString;
  
// Function to create and customize widget UI
function createWidget(data) {
	const widget = new ListWidget();
  
    // Set background image to widget
    widget.backgroundImage = image;
  
  	// Add header displaying mission name 
  	const title = widget.addStack();
    let mission = title.addText(missionName);
    mission.textColor = Color.white();
    mission.font = Font.semiboldSystemFont(14);
    mission.centerAlignText();

		// Add footer displaying rocket type
    const footer1 = widget.addStack();
    footer1.layoutVertically();
    footer1.addSpacer();
    let launchRocket = footer1.addText(rocketType);
    launchRocket.textColor = Color.white();
    launchRocket.font = Font.semiboldSystemFont(12);
    
    // Add footer displaying launch date and time
		const footer2 = widget.addStack();
    footer2.layoutVertically();
    //footer2.addSpacer();
    let launchCountdown = footer2.addText(launchDateTime);
    launchCountdown.textColor = Color.white();
    launchCountdown.font = Font.semiboldSystemFont(12);
    
  	// Return customized widget UI
		return widget;
}

// Display widget
let widget = createWidget();

// Check where the script is running
if (config.runsInWidget) {
  // Run inside a widget when added to the home screen
	Script.setWidget(widget);
} else {
  // Otherwise show the medium widget preview inside the Scriptable app
	widget.presentSmall();
}
Script.complete();