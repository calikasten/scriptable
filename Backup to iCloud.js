// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: cloud;

// === CONFIGURATION ===
const CONFIG = {
  overwriteOnlyIfChanged: true,
  backupFolderName: "Script Backups",
};

// === FILE MANAGEMENT ===
// Initialize iCloud file manager and set up paths
const fileManager = FileManager.iCloud();
const rootDirectory = fileManager.documentsDirectory();
const backupDirectory = fileManager.joinPath(
  rootDirectory,
  CONFIG.backupFolderName
);

// Create backup folder if it doesn't exist
if (!fileManager.fileExists(backupDirectory)) {
  fileManager.createDirectory(backupDirectory, true);
}

// === HELPER FUNCTIONS ===
// Check if a file is a hidden file or system file
const isHiddenOrSystemFile = (fileName) => {
  const lower = fileName.toLowerCase();
  return (
    fileName.startsWith(".") ||
    lower.includes("__macosx") ||
    lower === ".ds_store"
  );
};

// Check if a file's content matches existing content
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

  // Read script content
  let content;
  try {
    content = fileManager.readString(sourcePath);
  } catch (err) {
    scriptsSkipped++;
    console.error(`[Backup][SKIP] Failed to read ${fileName}: ${err}`);
    continue;
  }

  const backupPath = fileManager.joinPath(backupDirectory, fileName);

  // Determine whether to write backup
  if (
    !CONFIG.overwriteOnlyIfChanged ||
    !fileManager.fileExists(backupPath) ||
    !filesAreEqual(backupPath, content)
  ) {
    try {
      // Write or overwrite backup
      fileManager.writeString(backupPath, content);
      scriptsBackedUp++;
      backedUpFileNames.push(fileName);
    } catch (err) {
      scriptsSkipped++;
      console.error(`[Backup][ERROR] Failed to write ${fileName}: ${err}`);
    }
  } else {
    // Otherwise skip backup
    scriptsSkipped++;
  }
}

// === CONFIRMATION ===
// Display summary alert with counts of backups or skipped scripts
const summaryAlert = new Alert();
summaryAlert.title = "Backup Complete";
summaryAlert.message = `${scriptsBackedUp} script(s) backed up\n${scriptsSkipped} skipped`;
summaryAlert.addAction("OK");
await summaryAlert.present();

// Log names of scripts that were successfully  backed up
if (backedUpFileNames.length) {
  console.log("Backed up scripts:");
  backedUpFileNames.forEach(console.log);
}

Script.complete();
