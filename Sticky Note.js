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

// Function to create and customize widget UI
function createWidget(note) {
  let widget = new ListWidget()
  widget.setPadding(16, 16, 16, 8)

	// Set widget gradient background
	let startColor = new Color("#F8DE5F")
  let endColor = new Color("#FFCF00")
  let gradient = new LinearGradient()
  gradient.colors = [startColor, endColor]
  gradient.locations = [0.0, 1]
  widget.backgroundGradient = gradient

	// Add entered sticky note text to widget
  let noteText = widget.addText(note)
  noteText.textColor = Color.black()
  noteText.font = Font.mediumRoundedSystemFont(16)
  noteText.centerAlignText();
  
  //Return customized widget UI
  return widget;
}

// Check where script is running
if (config.runsInWidget) {
  
  // Load sticky note text data and display inside widget 
  let note = loadData()
  let widget = createWidget(note)
  Script.setWidget(widget)
  Script.complete()
} else {

  // Otherwise ask for input for sticky note text via alert
  let note = loadData()
  note = await editData(note)
  saveData(note)
  Script.complete()
}