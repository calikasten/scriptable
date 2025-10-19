// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: sticky-note;

// === CONFIG ===

const CONFIG = {
  folderName: "Sticky Note",
  fileName: "stickyNote.txt",
  imageFileName: "stickyNote.png",
  imageUrl:
    "https://calikasten.wordpress.com/wp-content/uploads/2025/10/sticky-note.png",
  zoomFactor: 1.1,
  widgetSize: 400,
  fontSize: 16,
  spacerTop: 20,
  textColor: Color.black(),
  font: Font.mediumRoundedSystemFont(16),
  // Set to true to re-download image
  forceImageRefresh: false,
};

// === FILE MANAGEMENT ===

const fileManager = FileManager.iCloud();
const documentsPath = fileManager.documentsDirectory();
const folderPath = fileManager.joinPath(documentsPath, CONFIG.folderName);
const filePath = fileManager.joinPath(folderPath, CONFIG.fileName);
const cachedImagePath = fileManager.joinPath(folderPath, CONFIG.imageFileName);

const ensureEnvironment = () => {
  if (!fileManager.fileExists(folderPath)) {
    try {
      fileManager.createDirectory(folderPath, true);
      console.log(`Created folder: ${folderPath}`);
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  }

  if (!fileManager.fileExists(filePath)) {
    try {
      fileManager.writeString(filePath, "");
      console.log(`Created file: ${filePath}`);
    } catch (error) {
      console.error("Failed to create file:", error);
    }
  }

  return filePath;
};

const loadData = () => {
  try {
    ensureEnvironment();
    return fileManager.readString(filePath) || "";
  } catch (error) {
    console.error("Error loading data:", error);
    return "";
  }
};

const saveData = (data) => {
  try {
    ensureEnvironment();
    fileManager.writeString(filePath, data);
    console.log("Sticky note saved.");
  } catch (error) {
    console.error("Error saving data:", error);
  }
};

// === USER INPUT ===

const editData = async (existingData) => {
  const editor = new Alert();
  editor.title = "Enter Sticky Note Text";
  editor.addTextField(existingData || "");
  editor.addCancelAction("Cancel");
  editor.addAction("Save");

  const response = await editor.present();
  return response === -1 ? existingData : editor.textFieldValue(0);
};

// === IMAGE HANDLING ===

// Return image (either from cache or downloading nad caching)
const getCachedImage = async () => {
  try {
    ensureEnvironment();

    const exists = fileManager.fileExists(cachedImagePath);

    if (CONFIG.forceImageRefresh || !exists) {
      console.log("Downloading and caching new image...");
      const req = new Request(CONFIG.imageUrl);
      const img = await req.load();
      fileManager.write(cachedImagePath, img);
    } else {
      console.log("Using cached image.");
    }

    return fileManager.readImage(cachedImagePath);
  } catch (error) {
    console.error("Failed to load image:", error);
    return null;
  }
};

const loadImage = async () => {
  const image = await getCachedImage();

  const context = new DrawContext();
  const size = CONFIG.widgetSize;
  context.size = new Size(size, size);
  context.opaque = false;
  context.respectScreenScale = true;

  if (!image) {
    console.warn("No image found. Using transparent background.");
    // Return transparent image as fallback
    return context.getImage();
  }

  const imageAspect = image.size.width / image.size.height;
  const widgetAspect = size / size;

  let drawWidth, drawHeight;

  if (imageAspect > widgetAspect) {
    drawHeight = size * CONFIG.zoomFactor;
    drawWidth = drawHeight * imageAspect;
  } else {
    drawWidth = size * CONFIG.zoomFactor;
    drawHeight = drawWidth / imageAspect;
  }

  const x = (size - drawWidth) / 2;
  const y = (size - drawHeight) / 2;

  context.drawImageInRect(image, new Rect(x, y, drawWidth, drawHeight));
  return context.getImage();
};

// === CREATE WIDGET ===

const createWidget = async (note) => {
  const widget = new ListWidget();
  widget.backgroundImage = await loadImage();

  widget.addSpacer(CONFIG.spacerTop);

  const noteText = widget.addText(note);
  noteText.textColor = CONFIG.textColor;
  noteText.font = CONFIG.font;
  noteText.centerAlignText();

  widget.addSpacer();

  return widget;
};

// === EXECUTE SCRIPT ===

const displayWidget = async () => {
  let note = loadData();

  if (config.runsInWidget) {
    const widget = await createWidget(note);
    Script.setWidget(widget);
  } else {
    note = await editData(note);
    saveData(note);

    const widget = await createWidget(note);
    await widget.presentLarge();
  }

  Script.complete();
};

await displayWidget();
