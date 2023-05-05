// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: paw;
// Set API variables
const API_KEY = "INSERT API KEY HERE"
const APP_ID = "INSERT APP ID HERE"
const TABLE_NAME = "INSERT TABLE NAME HERE"

// Lastest 💛 pee timestamp 
async function timeSinceLastPee() {
// Start API call
const url = "https://api.airtable.com/v0/"+APP_ID+"/"+TABLE_NAME+"/?maxRecords=1&view=Pee"
const newRequest = new Request(url)
	newRequest.headers = {"Authorization": "Bearer "+API_KEY}
let json = await newRequest.loadJSON()
	// Isolate fields and values from API response
	const records = json["records"]
		const fields = records['0']["fields"]
		const timestamp = fields["Timestamp"]
// Get time difference between current time and response timestamp 
const timestampRaw = new Date(timestamp)
const now = new Date()
const timeDiffMS = now - timestampRaw
const timeDiff = (timeDiffMS/(1000*60*60)).toFixed(2)
// Function returns the time
return timeDiff
};

// Lastest 💩 poop timestamp
async function timeSinceLastPoop() {
// Start API call
const url = "https://api.airtable.com/v0/"+APP_ID+"/"+TABLE_NAME+"/?maxRecords=1&view=Poop"
const newRequest = new Request(url)
	newRequest.headers = {"Authorization": "Bearer "+API_KEY}
let json = await newRequest.loadJSON()
	// Isolate fields and values from API response
	const records = json["records"]
		const fields = records['0']["fields"]
		const timestamp = fields["Timestamp"]
// Get time difference between current time and response timestamp 
const timestampRaw = new Date(timestamp)
const now = new Date()
const timeDiffMS = now - timestampRaw
const timeDiff = (timeDiffMS/(1000*60*60)).toFixed(2)
// Function returns the time
return timeDiff
};

// Latest 🍗 food timestamp
async function timeSinceLastFood() {
// Start API call
const url = "https://api.airtable.com/v0/"+APP_ID+"/"+TABLE_NAME+"/?maxRecords=1&view=Food"
const newRequest = new Request(url)
	newRequest.headers = {"Authorization": "Bearer "+API_KEY}
let json = await newRequest.loadJSON()
	// Isolate fields and values from API response
	const records = json["records"]
		const fields = records['0']["fields"]
		const timestamp = fields["Timestamp"]
// Get time difference between current time and response timestamp 
const timestampRaw = new Date(timestamp)
const now = new Date()
const timeDiffMS = now - timestampRaw
const timeDiff = (timeDiffMS/(1000*60*60)).toFixed(2)
// Function returns the time
return timeDiff
};

// Lastest 💧 water timestamp 
async function timeSinceLastWater() {
// Start API call
const url = "https://api.airtable.com/v0/"+APP_ID+"/"+TABLE_NAME+"/?maxRecords=1&view=Water"
const newRequest = new Request(url)
	newRequest.headers = {"Authorization": "Bearer "+API_KEY}
let json = await newRequest.loadJSON()
	// Isolate fields and values from API response
	const records = json["records"]
		const fields = records['0']["fields"]
		const timestamp = fields["Timestamp"]
// Get time difference between current time and response timestamp 
const timestampRaw = new Date(timestamp)
const now = new Date()
const timeDiffMS = now - timestampRaw
const timeDiff = (timeDiffMS/(1000*60*60)).toFixed(2)
// Function returns the time
return timeDiff
};

// Latest 🚶‍♀️ walk timestamp
async function timeSinceLastWalk() {
// Start API call
const url = "https://api.airtable.com/v0/"+APP_ID+"/"+TABLE_NAME+"/?maxRecords=1&view=Exercise"
const newRequest = new Request(url)
	newRequest.headers = {"Authorization": "Bearer "+API_KEY}
let json = await newRequest.loadJSON()
	// Isolate fields and values from API response
	const records = json["records"]
		const fields = records['0']["fields"]
		const timestamp = fields["Timestamp"]
// Get time difference between current time and response timestamp 
const timestampRaw = new Date(timestamp)
const now = new Date()
const timeDiffMS = now - timestampRaw
const timeDiff = (timeDiffMS/(1000*60*60)).toFixed(2)
// Function returns the time
return timeDiff
};

// Start widget UI
let widget = await createWidget()

// Check where the script is running
if (config.runsInWidget) {
  Script.setWidget(widget)
} 
else {
  widget.presentSmall()
}
Script.complete();

// Create widget
async function createWidget() {
let dogDays = new ListWidget()
	// Add widget background
	let gradient = new LinearGradient()
  	gradient.locations = [0, 1]
  	gradient.colors = [new Color("#000000"), new Color("#1c1c1e")]
  	gradient.startPoint = new Point(0.5, 0)
  	gradient.endPoint = new Point(0.5, 1)
  	dogDays.backgroundGradient = gradient
	// Add widget heading	
	let heading = dogDays.addText("Barley 🐶")
  	heading.centerAlignText()
  	heading.font = Font.semiboldSystemFont(15)
  	heading.textColor = new Color("#ffffff")
dogDays.addSpacer()	
	// Add time since last pee
	const itemPee = dogDays.addStack()
		const lastPee = await timeSinceLastPee()
			let line1 = itemPee.addText("💛 "+lastPee+" hours ago")
				line1.font = Font.semiboldSystemFont(12)
				line1.leftAlignText()
	// Add time since last poop		
	const itemPoop = dogDays.addStack()	
		const lastPoop = await timeSinceLastPoop()
			let line2 = itemPoop.addText("💩 "+ lastPoop+" hours ago")
				line2.font = Font.semiboldSystemFont(12)
				line2.leftAlignText()
	// Add time since last food
	const itemFood = dogDays.addStack()	
		const lastFood = await timeSinceLastFood()
			let line3 = itemFood.addText("🍗 "+ lastFood+" hours ago")
				line3.font = Font.semiboldSystemFont(12)					
				line3.leftAlignText()
	// Add time since last water
	const itemWater = dogDays.addStack()	
		const lastWater = await timeSinceLastWater()
			let line4 = itemWater.addText("💧 "+ lastWater+" hours ago")
				line4.font = Font.semiboldSystemFont(12)					
				line4.leftAlignText()			
	// Add time since last walk
	const itemWalk = dogDays.addStack()
			const lastWalk = await timeSinceLastWalk()
			let line5 = itemWalk.addText("🚶‍♀️ "+ lastWalk+" hours ago")
				line5.font = Font.semiboldSystemFont(12)
				line5.leftAlignText()
dogDays.addSpacer()
// Display widget
return dogDays
};
