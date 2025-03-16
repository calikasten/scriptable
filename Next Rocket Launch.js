// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: space-shuttle;

// Function to get data from the API
async function getData() {
  const url = "https://lldev.thespacedevs.com/2.2.0/launch/upcoming";

  try {
    const request = new Request(url);
    const response = await request.loadJSON();

    // Check if the response is valid
    if (!response || !response.results || response.results.length === 0) {
      throw new Error("No data returned from API");
    }

    // Log and return data from valid response
    console.log(response);
    return response;
  } catch (error) {
    console.error("Failed to fetch data from API", error);
    
    // Don't return anything if API request fails
    return null;
  }
}

// Function to format date and time
function formatDateTime(timestamp) {
  const launchDate = new Date(timestamp);
  const dateOptions = {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  };
  const timeOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  };

  const dateString = Intl.DateTimeFormat("en", dateOptions).format(launchDate);
  const timeString = Intl.DateTimeFormat("en", timeOptions).format(launchDate);

  return `${dateString} at ${timeString}`;
}

// Fetch data from API response
const data = await getData();

const launchDetails = data.results[0];
const missionName = launchDetails.mission.name || "Unknown 	Mission";
const rocketType = launchDetails.rocket.configuration.name || "Unknown Rocket";
const launchDateTime = formatDateTime(launchDetails.net);

if (!data) {
  console.error("No data available.");
  return;
}

// Function to create and customize widget UI
async function createWidget(data) {
  const widget = new ListWidget();

  // Get background image
  const imageRequest = new Request(
    "https://media.wired.com/photos/5bbadf1c40061e2cf09198a9/master/w_2240,c_limit/SpaceX-1047301226a.jpg"
  );

  // Fetch image
  try {
    widget.backgroundImage = await imageRequest.loadImage();
  } catch (error) {
    console.error("Failed to load background image", error);
  }

  // Add header displaying mission name
  const title = widget.addStack();
  const mission = title.addText(missionName);
  mission.textColor = Color.white();
  mission.font = Font.semiboldSystemFont(14);
  mission.centerAlignText();

  // Add footer displaying rocket type
  const footer1 = widget.addStack();
  footer1.layoutVertically();
  footer1.addSpacer();
  const launchRocket = footer1.addText(rocketType);
  launchRocket.textColor = Color.white();
  launchRocket.font = Font.semiboldSystemFont(12);

  // Add footer displaying launch date and time
  const footer2 = widget.addStack();
  footer2.layoutVertically();
  const launchCountdown = footer2.addText(launchDateTime);
  launchCountdown.textColor = Color.white();
  launchCountdown.font = Font.semiboldSystemFont(12);

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
  widget.presentSmall();
}
Script.complete();
