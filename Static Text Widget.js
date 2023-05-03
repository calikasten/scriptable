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
  // Add widget background
		testWidget.backgroundColor = new Color("#000000");
	// Add text to a widget
	let widgetText = testWidget.addText("INSERT TEXT HERE");
		widgetText.font = Font.boldSystemFont(15)
		widgetText.textColor = new Color ("#ffffff")
		widgetText.centerAlignText()
// Display widget
return testWidget
};
