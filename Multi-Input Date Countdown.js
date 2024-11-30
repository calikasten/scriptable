// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: calendar-minus;
// Created by u/flasozzi

// This widget allows for a countdown date to be supplied as a parameter when configuring the displayed widget (long press on widget, tap "Edit Widget").

// The paramaters should have the following format: image-name.png|padding-top|text-color|countdown-end-date|countdown-title

// Example of setting paramaters: |100|#FFFF00|December 25 2024|Quebec City

const widgetInput = args.widgetParameter;

// Throw error if no paramaters are provided
try {
	widgetInput.toString();
} catch(error) {
	throw new Error("Please provide parameters.");
}

// Parse provided paramaters
var input = widgetInput.toString();
var inputArgs = widgetInput.split("|");
var spacing = parseInt(inputArgs[1]);
var countdownEvent = inputArgs	[4].toString();


// Calculate countdown until race based on date difference
let countdownTo = inputArgs[3].toString();
function getCountdown(countdownTo) {
	const diff = (Date.parse(countdownTo) - Date.parse(new Date())) / 1000;
  const days = Math.floor(diff/60/60/24);
  return {
    days
  }
};

// Function to create and customize widget UI
function createWidget(data) {
	const widget = new ListWidget();
  
    // Set background image to widget
    widget.background = new Color ("#000000");
		
		// Set top padding
		widget.addSpacer(parseInt(spacing));
  
  	// Add countdown info
  	const countdown = widget.addStack();
		//let timeUntil = countdown.addText(inputArgs	[4].toString());
    let timeUntil = widget.addText(String(getCountdown(countdownTo).days + 1) + ' days until ' + countdownEvent + '.')
    timeUntil.textColor = new Color ("#FFF000")
    timeUntil.font = Font.boldSystemFont(28);
    timeUntil.centerAlignText();
		
		// Set bottom padding
		widget.addSpacer();
		widget.setPadding(0, 0, 0, 0);

// Return customized widget UI
return widget;
}

// Display widget
let widget = createWidget();
Script.setWidget(widget);
Script.complete();