// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: paw;

// Set API variables
const API_TOKEN = "<INSERT API KEY HERE>";
const APP_ID = "<INSERT APP ID HERE>";
const TABLE_ID = "<INSERT TABLE ID HERE>";

// Begin functions to get data from API

// Lastest pee timestamp
async function timeSinceLastPee() {
  
  // Start API call
  const url = "https://api.airtable.com/v0/" + APP_ID + "/" + TABLE_ID + "/?maxRecords=1&view=Pee";
  const newRequest = new Request(url);
  newRequest.headers = { Authorization: "Bearer " + API_TOKEN };
  const json = await newRequest.loadJSON();
  
  // Isolate fields and values from API response
  const records = json["records"];
  const fields = records["0"]["fields"];
  const timestamp = fields["Timestamp"];
        
  // Get time difference between current time and response timestamp
  let timestampRaw = new Date(timestamp);
  let now = new Date();
  let timeDiffMS = now - timestampRaw;
  let timeDiff = (timeDiffMS / (1000 * 60 * 60)).toFixed(2);
  
  // Function returns the time
  return timeDiff;
};

// Lastest  poop timestamp
async function timeSinceLastPoop() {
  
  // Start API call
  const url = "https://api.airtable.com/v0/" + APP_ID + "/" + TABLE_ID + "/?maxRecords=1&view=Poop";
  const newRequest = new Request(url);
  newRequest.headers = { Authorization: "Bearer " + API_TOKEN };
  const json = await newRequest.loadJSON();
        
  // Isolate fields and values from API response
  const records = json["records"];
  const fields = records["0"]["fields"];
  const timestamp = fields["Timestamp"];
        
  // Get time difference between current time and response timestamp
  let timestampRaw = new Date(timestamp);
  let now = new Date();
  let timeDiffMS = now - timestampRaw;
  let timeDiff = (timeDiffMS / (1000 * 60 * 60)).toFixed(2);
        
  // Function returns the time
  return timeDiff;
};

// Latest food timestamp
async function timeSinceLastFood() {
  
  // Start API call
  const url = "https://api.airtable.com/v0/" + APP_ID + "/" + TABLE_ID + "/?maxRecords=1&view=Food";
  const newRequest = new Request(url);
  newRequest.headers = { Authorization: "Bearer " + API_TOKEN };
  const json = await newRequest.loadJSON();
        
  // Isolate fields and values from API response
  const records = json["records"];
  const fields = records["0"]["fields"];
  const timestamp = fields["Timestamp"];
        
  // Get time difference between current time and response timestamp
  let timestampRaw = new Date(timestamp);
  let now = new Date();
  let timeDiffMS = now - timestampRaw;
  let timeDiff = (timeDiffMS / (1000 * 60 * 60)).toFixed(2);
        
  // Function returns the time
  return timeDiff;
};

// Lastest water timestamp
async function timeSinceLastWater() {
  
  // Start API call
  const url = "https://api.airtable.com/v0/" + APP_ID + "/" + TABLE_ID + "/?maxRecords=1&view=Water";
  const newRequest = new Request(url);
  newRequest.headers = { Authorization: "Bearer " + API_TOKEN };
  const json = await newRequest.loadJSON();
  
  // Isolate fields and values from API response
  const records = json["records"];
  const fields = records["0"]["fields"];
  const timestamp = fields["Timestamp"];
  
  // Get time difference between current time and response timestamp
  let timestampRaw = new Date(timestamp);
  let now = new Date();
  let timeDiffMS = now - timestampRaw;
  let timeDiff = (timeDiffMS / (1000 * 60 * 60)).toFixed(2);
  
  // Function returns the time
  return timeDiff;
};

// Latest walk timestamp
async function timeSinceLastWalk() {
  
  // Start API call
  const url = "https://api.airtable.com/v0/" + APP_ID + "/" + TABLE_ID + "/?maxRecords=1&view=Exercise";
  const newRequest = new Request(url);
  newRequest.headers = { Authorization: "Bearer " + API_TOKEN };
  const json = await newRequest.loadJSON();

  // Isolate fields and values from API response
  const records = json["records"];
  const fields = records["0"]["fields"];
  const timestamp = fields["Timestamp"];
  
  // Get time difference between current time and response timestamp
  let timestampRaw = new Date(timestamp);
  let now = new Date();
  let timeDiffMS = now - timestampRaw;
  let timeDiff = (timeDiffMS / (1000 * 60 * 60)).toFixed(2);
  
  // Function returns the time
  return timeDiff;
};

// Function to create and customize widget UI
async function createWidget() {
  const dogDays = new ListWidget();
  
  // Add widget background
  dogDays.backgroundColor = new Color("#1C1B1D");
  
  // Add widget heading
  const heading = dogDays.addText("Barley 🐶");
  heading.centerAlignText();
  heading.font = Font.semiboldSystemFont(15);
  heading.textColor = new Color("#ffffff");
  dogDays.addSpacer();
  
  // Add time since last pee
  const itemPee = dogDays.addStack();
  const lastPee = await timeSinceLastPee();
  let line1 = itemPee.addText("💛 " + lastPee + " hours ago");
  line1.font = Font.semiboldSystemFont(12);
  line1.leftAlignText();
  
  // Add time since last poop
  const itemPoop = dogDays.addStack();
  const lastPoop = await timeSinceLastPoop();
  let line2 = itemPoop.addText("💩 " + lastPoop + " hours ago");
  line2.font = Font.semiboldSystemFont(12);
  line2.leftAlignText();
  
  // Add time since last food
  const itemFood = dogDays.addStack();
  const lastFood = await timeSinceLastFood();
  let line3 = itemFood.addText("🍗 " + lastFood + " hours ago");
  line3.font = Font.semiboldSystemFont(12);
  line3.leftAlignText();
  
  // Add time since last water
  const itemWater = dogDays.addStack();
  const lastWater = await timeSinceLastWater();
  let line4 = itemWater.addText("💧 " + lastWater + " hours ago");
  line4.font = Font.semiboldSystemFont(12);
  line4.leftAlignText();
  
  // Add time since last walk
  const itemWalk = dogDays.addStack();
  const lastWalk = await timeSinceLastWalk();
  let line5 = itemWalk.addText("🚶‍♀️ " + lastWalk + " hours ago");
  line5.font = Font.semiboldSystemFont(12);
  line5.leftAlignText();
  dogDays.addSpacer();
  
  // Display widget
  return dogDays;
};

// Display widget
let widget = await createWidget();

// Check where the script is running
if (config.runsInWidget) {
        
  // Run inside a widget
  Script.setWidget(widget);
} else {

  // Otherwise show preview
  widget.presentSmall();
}
Script.complete();
