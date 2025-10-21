// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: sticky-note;

// === CONFIGURATION ===
const CONFIG = {
  folderName: "Sticky Note",
  fileName: "stickyNote.txt",
  imageFileName: "stickyNote.png",
  imageUrl:
    "https://calikasten.wordpress.com/wp-content/uploads/2025/10/sticky-note.png",
  zoomFactor: 1.1,
  widgetSize: 400,
  font: Font.mediumRoundedSystemFont(16),
  spacerTop: 20,
  textColor: Color.black(),
  forceImageRefresh: false,
};

// === FILE MANAGEMENT ===
// Initialize iCloud file manager and set up paths
const fileManager = FileManager.iCloud();
const folderPath = fileManager.joinPath(
  fileManager.documentsDirectory(),
  CONFIG.folderName
);
const filePath = fileManager.joinPath(folderPath, CONFIG.fileName);
const cachedImagePath = fileManager.joinPath(folderPath, CONFIG.imageFileName);

// Ensure folder and file exist
if (!fileManager.fileExists(folderPath))
  fileManager.createDirectory(folderPath, true);
if (!fileManager.fileExists(filePath)) fileManager.writeString(filePath, "");

// Load/save sticky note text
const loadData = () => fileManager.readString(filePath) || "";
const saveData = (data) => fileManager.writeString(filePath, data);

// === USER INPUT ===
// Ask user for text to display
const editData = async (existing) => {
  const alert = new Alert();
  alert.title = "Enter Sticky Note Text";
  alert.addTextField(existing || "");
  alert.addCancelAction("Cancel");
  alert.addAction("Save");

  const res = await alert.present();
  return res === -1 ? existing : alert.textFieldValue(0);
};

// === IMAGE HANDLING ===
// Load sticky note background image
const getImage = async () => {
  let image = fileManager.readImage(cachedImagePath);

  if (CONFIG.forceImageRefresh || !image) {
    image = await new Request(CONFIG.imageUrl).loadImage();
    fileManager.writeImage(cachedImagePath, image);
  }

  if (!image) return null; 
  
  // Resize and draw image to maintain aspect ratio and zoom factor
  const size = CONFIG.widgetSize;
  const aspect = image.size.width / image.size.height;
  const drawWidth = size * CONFIG.zoomFactor * (aspect > 1 ? aspect : 1);
  const drawHeight = size * CONFIG.zoomFactor * (aspect > 1 ? 1 : 1 / aspect);

  const context = new DrawContext();
  context.size = new Size(size, size);
  context.opaque = false;
  context.respectScreenScale = true;
  context.drawImageInRect(
    image,
    new Rect(
      (size - drawWidth) / 2,
      (size - drawHeight) / 2,
      drawWidth,
      drawHeight
    )
  );

  return context.getImage();
};

// === CREATE WIDGET ===
const createWidget = async (note) => {
  const widget = new ListWidget();
  widget.backgroundImage = await getImage();
  widget.addSpacer(CONFIG.spacerTop);

  const text = widget.addText(note);
  text.font = CONFIG.font;
  text.textColor = CONFIG.textColor;
  text.centerAlignText();

  widget.addSpacer();
  return widget;
};

// === EXECUTE SCRIPT ===
const display = async () => {
  // Load data
  let note = loadData();

  // Allow for text to be edited if running in app
  if (!config.runsInWidget) {
    note = await editData(note);
    saveData(note);
  }

  const widget = await createWidget(note);

  if (!config.runsInWidget) {
    await widget.presentLarge();
  } else {
    Script.setWidget(widget);
  }

  Script.complete();
};

await display();
