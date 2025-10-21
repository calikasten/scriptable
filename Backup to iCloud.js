// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: cloud;

// === CONFIGURATION ===
const CONFIG = {
  overwriteOnlyIfChanged: true,
  backupFolderName: "Script Backups",
};

// === FILE MANAGEMENT ===
const fileManager = FileManager.iCloud();
const rootDirectory = fileManager.documentsDirectory();
const backupDirectory = fileManager.joinPath(
  rootDirectory,
  CONFIG.backupFolderName
);

// Ensure backup folder exists
if (!fileManager.fileExists(backupDirectory)) {
  fileManager.createDirectory(backupDirectory, true);
}

// === HELPER FUNCTIONS ===
// Ignore hidden files and system files
const isHiddenOrSystemFile = (fileName) => {
  const lower = fileName.toLowerCase();
  return (
    fileName.startsWith(".") ||
    lower.includes("__macosx") ||
    lower === ".ds_store"
  );
};

// Ignore unchanged scripts
const filesAreEqual = (path, content) => {
  try {
    return fileManager.readString(path) === content;
  } catch {
    return false;
  }
};

// Get all scripts (with .js extension)
let scriptFiles = [];
try {
  scriptFiles = fileManager
    .listContents(rootDirectory)
    .filter((name) => name.endsWith(".js") && !isHiddenOrSystemFile(name));
} catch (err) {
  console.error(`[Backup][ERROR] Unable to list root directory: ${err}`);
  throw err;
}

// === BACKUP SCRIPTS ===
let scriptsBackedUp = 0,
  scriptsSkipped = 0;
const backedUpFileNames = [];

for (const fileName of scriptFiles) {
  const sourcePath = fileManager.joinPath(rootDirectory, fileName);

  if (!fileManager.isFileDownloaded(sourcePath)) {
    scriptsSkipped++;
    console.warn(`[Backup][SKIP] File not downloaded: ${fileName}`);
    continue;
  }

  let content;
  try {
    content = fileManager.readString(sourcePath);
  } catch (err) {
    scriptsSkipped++;
    console.error(`[Backup][SKIP] Failed to read ${fileName}: ${err}`);
    continue;
  }

  const backupPath = fileManager.joinPath(backupDirectory, fileName);
  if (
    !CONFIG.overwriteOnlyIfChanged ||
    !fileManager.fileExists(backupPath) ||
    !filesAreEqual(backupPath, content)
  ) {
    try {
      fileManager.writeString(backupPath, content);
      scriptsBackedUp++;
      backedUpFileNames.push(fileName);
    } catch (err) {
      scriptsSkipped++;
      console.error(`[Backup][ERROR] Failed to write ${fileName}: ${err}`);
    }
  } else {
    scriptsSkipped++;
  }
}

// === CONFIRMATION ===
// Display alert summary
const summaryAlert = new Alert();
summaryAlert.title = "Backup Complete";
summaryAlert.message = `${scriptsBackedUp} script(s) backed up\n${scriptsSkipped} skipped`;
summaryAlert.addAction("OK");
await summaryAlert.present();

// Log names of scripts that were backed up
if (backedUpFileNames.length) {
  console.log("Backed up scripts:");
  backedUpFileNames.forEach(console.log);
}

Script.complete();
