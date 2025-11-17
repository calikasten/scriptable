// === STYLES ===
// Format date in MM-dd-yyyy
const DATE_FORMAT = "MM-dd-yyyy";

// Define font size and color
const STYLES = { 
  fonts: {
    titleFont: Font.boldSystemFont(16),
	textFont: Font.semiboldSystemFont(10)
  },
  colors: {
    titleColor: new Color("#FFFFFF"),
	textColor: new Color("FFFF00")
  }
};

// === WIDGET ASSEMBLY ===
function createWidget() {
  const widget = new ListWidget();

  // Widget title
  const title = widget.addText("TITLE");
  title.font = STYLES.fonts.titleFont;
  title.textColor = STYLES.colors.titleColor;
  title.centerAlignText();
  widget.addSpacer(5);

  // Data to display in widget
  const widgetData = ["text", "or", "other", "data", "types"];

  // Number each line of widget data
  const lines = widgetData.map((value, i) => `${i + 1}. ${value}`);
  const textBlock = widget.addText(lines.join("\n"));
  textBlock.font = STYLES.fonts.textFont;
  textBlock.textColor = STYLES.colors.textColor;
  textBlock.leftAlignText();

  // Return widget with its constructed UI elements
  return widget;
}

// === MAIN EXECUTION ===
const widget = await createWidget();

// Check if script is running inside a widget
if (config.runsInWidget) {
  // Run inside a widget
  Script.setWidget(widget);
} else {
  // Otherwise show preview
  widget.presentSmall();
}

Script.complete();
