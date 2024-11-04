// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: sticky-note;

// Set variables
iCloud = FileManager.iCloud();
directory = iCloud.documentsDirectory();
const folderName = "Sticky Note";
const folderLocation = `/${folderName}`;
const directoryPath = `${directory}${folderLocation}`;

// Function to load saved sticky note text
function loadData() {
        try {
        let filePath = iCloud.joinPath(directoryPath, "sticky-note.txt")
        return iCloud.readString(filePath)
        } catch(error) {
                return data
        }
}

// Function to enter new text for sticky note
async function editData(data) {
        let editor = new Alert()
  editor.title = "Enter Sticky Note Text"
  editor.addTextField(data)
  editor.addCancelAction("Cancel")
  editor.addAction("Save")
  let action = await editor.present()
  if (action < 0) {
    return data
  } else {
    return editor.textFieldValue(0)
  }
}

// Function to create new directory location and save entered sticky note text
function saveData(data) {
	let filePath = iCloud.joinPath(directoryPath, "sticky-note.txt");
  iCloud.writeString(filePath, data);
}

// Retreive and modify background image for widget

	// Get image
	let image = await new Request("https://static.vecteezy.com/system/resources/previews/013/220/257/original/sticky-note-paper-in-yellow-colors-reminder-square-illustration-png.png").loadImage();

	// Define widget dimensions
	let widgetWidth = 400;
	let widgetHeight = 400;

	// Create a drawing context with the exact widget size
	let context = new DrawContext();
	context.size = new Size(widgetWidth, widgetHeight);
	context.opaque = false;
	context.respectScreenScale = true;

	// Calculate aspect ratio to scale image proportionally with a slight zoom to remove "border" that occurs based on image dimensions
	let zoomFactor = 1.1; 
	let imageAspectRatio = image.size.width / image.size.height;
	let widgetAspectRatio = widgetWidth / widgetHeight;

	let drawWidth, drawHeight;
	if (imageAspectRatio > widgetAspectRatio) {
  		
      // If image is wider than the widget, fit height and zoom in slightly
    drawHeight = widgetHeight * zoomFactor;
    drawWidth = drawHeight * imageAspectRatio;
	} else {
    
    // If image is taller than the widget, fit width and zoom in slightly
    drawWidth = widgetWidth * zoomFactor;
    drawHeight = drawWidth / imageAspectRatio;
	}

	// Center the zoomed image within the widget dimensions
	let x = (widgetWidth - drawWidth) / 2;
	let y = (widgetHeight - drawHeight) / 2;
	context.drawImageInRect(image, new Rect(x, y, drawWidth, drawHeight));

// Function to create and customize widget UI
function createWidget(note) {
  let widget = new ListWidget()

  // Set zoomed image as background for widget
	let zoomedImage = context.getImage();
	widget.backgroundImage = zoomedImage
  
	// Add entered sticky note text to widget
  widget.addSpacer(20);
  let noteText = widget.addText(note)
  noteText.textColor = Color.black()
  noteText.font = Font.mediumRoundedSystemFont(16)
  noteText.centerAlignText();
	widget.addSpacer();
    
  // Return customized widget UI
  return widget;
}

// Check where script is running, ask for input and display preview
let note = loadData()
if (config.runsInWidget) {
	let widget = createWidget(note)
  Script.setWidget(widget)
} else {
  note = await editData(note)
  saveData(note)
  let widget = createWidget(note)
  widget.presentLarge()
};

Script.complete();
