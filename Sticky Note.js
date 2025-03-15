// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: sticky-note;

// Set constants for file paths
const FOLDER_NAME = "Sticky Note";
const FILE_NAME = "sticky-note.txt";
const IMAGE_URL = "https://static.vecteezy.com/system/resources/previews/013/220/257/original/sticky-note-paper-in-yellow-colors-reminder-square-illustration-png.png";
const ZOOM_FACTOR = 1.1; // Image zoom factor

// Initialize iCloud file manager and directory paths
const iCloud = FileManager.iCloud();
const directory = iCloud.documentsDirectory();
const folderLocation = `/${FOLDER_NAME}`;
const directoryPath = `${directory}${folderLocation}`;

// Function to load saved sticky note text
function loadData() {
  try {
    const filePath = iCloud.joinPath(directoryPath, FILE_NAME);
    return iCloud.readString(filePath);
  } catch (error) {
    console.error("Error loading data: ", error);
    return '';  // Default fallback text
  }
}

// Function to enter new text for sticky note
async function editData(existingData) {
  const editor = new Alert();
  editor.title = "Enter Sticky Note Text";
  editor.addTextField(existingData);
  editor.addCancelAction("Cancel");
  editor.addAction("Save");

  const action = await editor.present();
  
  // Return updated text unless canceled
  if (action === -1) {
    return existingData;  
  } else {
    return editor.textFieldValue(0);  
  }
}

// Function to save entered sticky note text
function saveData(data) {
  const filePath = iCloud.joinPath(directoryPath, FILE_NAME);
  iCloud.writeString(filePath, data);
}

// Function to load and process the image
async function loadImage() {
  const image = await new Request(IMAGE_URL).loadImage();

  // Define widget dimensions
  const widgetWidth = 400;
  const widgetHeight = 400;

  // Create drawing context for the widget
  const context = new DrawContext();
  context.size = new Size(widgetWidth, widgetHeight);
  context.opaque = false;
  context.respectScreenScale = true;

  // Calculate aspect ratio to scale image proportionally
  const imageAspectRatio = image.size.width / image.size.height;
  const widgetAspectRatio = widgetWidth / widgetHeight;

  let drawWidth, drawHeight;
  if (imageAspectRatio > widgetAspectRatio) {
    drawHeight = widgetHeight * ZOOM_FACTOR;
    drawWidth = drawHeight * imageAspectRatio;
  } else {
    drawWidth = widgetWidth * ZOOM_FACTOR;
    drawHeight = drawWidth / imageAspectRatio;
  }

  // Center the image within the widget dimensions
  const x = (widgetWidth - drawWidth) / 2;
  const y = (widgetHeight - drawHeight) / 2;
  context.drawImageInRect(image, new Rect(x, y, drawWidth, drawHeight));

	// Return the modified image to use as the widget background
  return context.getImage(); 
}

// Function to create and customize the widget UI
async function createWidget(note) {
  const widget = new ListWidget();

  // Load and set the background image
  const image = await loadImage();
  widget.backgroundImage = image;

  // Add sticky note text to the widget
  widget.addSpacer(20);
  const noteText = widget.addText(note);
  noteText.textColor = Color.black();
  noteText.font = Font.mediumRoundedSystemFont(16);
  noteText.centerAlignText();
  widget.addSpacer();

  return widget;
}

// Load data and display widget
async function displayWidget() {
  let note = loadData();

  if (config.runsInWidget) {
    const widget = await createWidget(note);
    Script.setWidget(widget);
  } else {
    note = await editData(note);
    saveData(note);
    const widget = await createWidget(note);
    widget.presentLarge();
  }

  Script.complete();
}

displayWidget();
