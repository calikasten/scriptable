// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: sticky-note;

// Set constants for file paths
const FOLDER_NAME = "Sticky Note";
const FILE_NAME = "stickyNote.txt";
const IMAGE_URL =
  "https://calikasten.wordpress.com/wp-content/uploads/2025/10/sticky-note.png";
const ZOOM_FACTOR = 1.1; // Image zoom factor

// Initialize iCloud file manager and directory paths
const fileManager = FileManager.iCloud();
const directory = fileManager.documentsDirectory();
const folderLocation = `/${FOLDER_NAME}`;
const directoryPath = `${directory}${folderLocation}`;

// Function to create designated folder for .txt file if it doens't already exist
function ensureFolderExists() {
  if (!fileManager.fileExists(directoryPath)) {
    try {
      fileManager.createDirectory(directoryPath, true);
      console.log(`Created folder: ${directoryPath}`);
    } catch (error) {
      console.error("Failed to create folder.");
    }
  }
}

// Function to create designated folder for .txt file if it doens't already exist
function ensureFileExists() {
  ensureFolderExists();
  const filePath = fileManager.joinPath(directoryPath, FILE_NAME);
  if (!fileManager.fileExists(filePath)) {
    try {
      fileManager.writeString(filePath, "");
      console.log(`Created file: ${filePath}`);
    } catch (error) {
      console.error("Failed to create file.");
    }
  }
  return filePath;
}

// Function to load saved sticky note text
function loadData() {
  try {
    const filePath = ensureFileExists(); // Ensures file and folder exist
    return fileManager.readString(filePath) || "";
  } catch (error) {
    console.error("Error loading data:", error);
    return "";
  }
}

// Function to enter new text for sticky note
async function editData(existingData) {
  const editor = new Alert();
  editor.title = "Enter Sticky Note Text";
  editor.addTextField(existingData);
  editor.addCancelAction("Cancel");
  editor.addAction("Save");

  const action = await editor.present(); // Return updated text unless canceled

  if (action === -1) {
    return existingData;
  } else {
    return editor.textFieldValue(0);
  }
}

// Function to save entered sticky note text
function saveData(data) {
  const filePath = ensureFileExists(); // Ensures file and folder exist
  fileManager.writeString(filePath, data);
  console.log("Sticky note saved.");
}

// Function to load and process the background image
async function loadImage() {
  const image = await new Request(IMAGE_URL).loadImage(); // Define widget dimensions

  const widgetWidth = 400;
  const widgetHeight = 400; // Create drawing context

  const context = new DrawContext();
  context.size = new Size(widgetWidth, widgetHeight);
  context.opaque = false;
  context.respectScreenScale = true; // Calculate aspect ratio to scale image proportionally

  const imageAspectRatio = image.size.width / image.size.height;
  const widgetAspectRatio = widgetWidth / widgetHeight;

  let drawWidth, drawHeight;
  if (imageAspectRatio > widgetAspectRatio) {
    drawHeight = widgetHeight * ZOOM_FACTOR;
    drawWidth = drawHeight * imageAspectRatio;
  } else {
    drawWidth = widgetWidth * ZOOM_FACTOR;
    drawHeight = drawWidth / imageAspectRatio;
  } // Center the image

  const x = (widgetWidth - drawWidth) / 2;
  const y = (widgetHeight - drawHeight) / 2;
  context.drawImageInRect(image, new Rect(x, y, drawWidth, drawHeight));

  return context.getImage();
}

// Function to create and customize widget UI
async function createWidget(note) {
  const widget = new ListWidget(); // Set background image

  const image = await loadImage();
  widget.backgroundImage = image; // Add sticky note text

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
    // Running inside widget
    const widget = await createWidget(note);
    Script.setWidget(widget);
  } else {
    // Running in the app
    note = await editData(note);
    saveData(note);
    const widget = await createWidget(note);
    widget.presentLarge();
  }

  Script.complete();
}

// Run the widget
displayWidget();
