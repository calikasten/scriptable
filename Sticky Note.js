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
  font: Font.mediumRoundedSystemFont(16),
  spacerTop: 20,
  textColor: Color.black(),
  forceImageRefresh: false,
};

// === FILE MANAGEMENT ===

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

const getImage = async () => {
  if (CONFIG.forceImageRefresh || !fileManager.fileExists(cachedImagePath)) {
    const img = await new Request(CONFIG.imageUrl).load();
    fileManager.write(cachedImagePath, img);
  }
  const img = fileManager.readImage(cachedImagePath);
  if (!img) return null;

  const size = CONFIG.widgetSize;
  const ctx = new DrawContext();
  ctx.size = new Size(size, size);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const aspect = img.size.width / img.size.height;
  const drawWidth =
    aspect > 1 ? size * CONFIG.zoomFactor * aspect : size * CONFIG.zoomFactor;
  const drawHeight =
    aspect > 1 ? size * CONFIG.zoomFactor : (size * CONFIG.zoomFactor) / aspect;
  ctx.drawImageInRect(
    img,
    new Rect(
      (size - drawWidth) / 2,
      (size - drawHeight) / 2,
      drawWidth,
      drawHeight
    )
  );

  return ctx.getImage();
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
  let note = loadData();

  if (!config.runsInWidget) {
    note = await editData(note);
    saveData(note);
    const widget = await createWidget(note);
    await widget.presentLarge();
  } else {
    const widget = await createWidget(note);
    Script.setWidget(widget);
  }

  Script.complete();
};

await display();
