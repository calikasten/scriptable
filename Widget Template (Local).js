// === STYLES ===
// Format date in MM-dd-yyyy
const DATE_FORMAT = "MM-dd-yyyy";

// Format font style and size
const TITLE_FONT_SIZE = 16;
const BODY_FONT_SIZE = 10;
const TITLE_FONT = Font.boldSystemFont(TITLE_FONT_SIZE);
const FONT = Font.semiboldSystemFont(BODY_FONT_SIZE);

// Format text colors
const TEXT_COLOR = new Color("#FFFF00");
const TITLE_COLOR = new Color("#FFFFFF");
const ERROR_COLOR = new Color("#FF3B30");

// === UI COMPONENTS ===
function createWidget() {
  const widget = new ListWidget();

  // Widget title
  const title = widget.addText("TITLE");
  title.font = TITLE_FONT;
  title.textColor = TITLE_COLOR;
  title.centerAlignText();
  widget.addSpacer(5);

  // Data to display in widget
  const widgetData = ["text", "or", "other", "data", "types"];

  // Number each line of widget data
  const lines = widgetData.map((value, i) => `${i + 1}. ${value}`);
  const textBlock = widget.addText(lines.join("\n"));
  textBlock.font = FONT;
  textBlock.textColor = TEXT_COLOR;
  textBlock.leftAlignText();

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
