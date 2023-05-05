// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: laptop-code;
// Set API variables
const API_KEY = "INSERT API KEY HERE"
const APP_ID = "INSERT APP ID HERE"
const TABLE_NAME = "INSERT TABLE NAME HERE"

// Start API call
const url = "https://api.airtable.com/v0/"+APP_ID+"/"+TABLE_NAME+"/?maxRecords=1"
// Make new API call request
const newRequest = new Request(url)
	// Define query headers and specify Bearer token for authorization
	newRequest.headers = {"Authorization": "Bearer "+API_KEY}
// Return API response as JSON
let json = await newRequest.loadJSON()

// Isolate fields and values from API response
const records = json["records"]
	const fields = records['0']["fields"]
  const string = fields["String"]
	const timestamp = fields["Timestamp"]
	const duration = fields["Duration"]
  const boolean = fields["Boolean"]
  const singleSelectArray = fields["Single-Select Array"]
	const multiSelectArray = fields["Multi-Select Array"]

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
let apiResponseWidget = new ListWidget()
			
// Add API responses to the widget
let stringResponse = apiResponseWidget.addText(string)
	stringResponse.centerAlignText()

// Display widget
return apiResponseWidget
};