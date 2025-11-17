// === STYLES ===
// Format date in MM-dd-yyyy
const DATE_FORMAT = "MM-dd-yyyy";

// Format font size and color
const STYLES = {
	titleFont: Font.boldSystemFont(16),
	titleColor: new Color("#FFFFFF"),
	textFont: Font.semiboldSystemFont(10),
	textColor: new Color("FFFF00")
};

// === UI COMPONENTS ===
function createWidget() {
  const widget = new ListWidget();

  // Widget title
  const title = widget.addText("TITLE");
  title.font = STYLES.titleFont;
  title.textColor = STYLES.titleColor;
  title.centerAlignText();
  widget.addSpacer(5);

  // Data to display in widget
  const widgetData = ["text", "or", "other", "data", "types"];

  // Number each line of widget data
  const lines = widgetData.map((value, i) => `${i + 1}. ${value}`);
  const textBlock = widget.addText(lines.join("\n"));
  textBlock.font = STYLES.textFont;
  textBlock.textColor = STYLES.textColor;
  textBlock.leftAlignText();

  // Return widget with its constructed UI elements
  return widget;
}

// === WIDGET ASSEMBLY  ===
const widget = await createWidget();

// === MAIN EXECUTION ===
// Check where script is running
if (config.runsInWidget) {
  // Run inside a widget
  Script.setWidget(widget);
} else {
  // Otherwise show preview
  widget.presentSmall();
}

Script.complete();
