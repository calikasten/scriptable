// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: font;
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
let testWidget = new ListWidget()

// Add single, solid color background to widget
// testWidget.backgroundColor = new Color("#000000")

// Add gradient background to widget
let gradient = new LinearGradient()
	gradient.locations = [0 1]
	gradient.colors = [new Color("000000"), new Color("1c1c1e")]
	testWidget.backgroundGradient = gradient

// Add text to a widget
let widgetText = testWidget.addText("INSERT TEXT HERE")

	// Set widget text font and size
	widgetText.font = Font.boldSystemFont(15)
	
	// Set widget text color
	widgetText.textColor = new Color ("#ffffff")
		
	// Set widget text alignment
	widgetText.centerAlignText()
	
// Display widget
return testWidget
};
