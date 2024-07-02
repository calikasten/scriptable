// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: space-shuttle;

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
  	var launchTime = launchDetails["0"]["net"];
  	
// Function to create and customize widget UI
function createWidget(data) {
	const widget = new ListWidget();
  
    	// Set background image to widget
    	widget.backgroundImage = image;
  
  	// Add header displaying mission name 
  	const title = widget.addStack();
    	let mission = title.addText(missionName);
    	mission.textColor = Color.white();
    	mission.font = Font.boldSystemFont(14);
    
    	// Add subtitle to header displaying rocket type
	const subtitle = widget.addStack();
    	let rocket = subtitle.addText(rocketType);
    	rocket.textColor = Color.white();
    	rocket.font = Font.semiboldSystemFont(12);
    
    	// Add footer displaying launch date and time
	var footer = widget.addStack();
	footer.layoutVertically();
    	footer.addSpacer();
    	const date = footer.addText(launchTime);
    	date.textColor = Color.white();
    	date.font = Font.boldSystemFont(10);
      
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
