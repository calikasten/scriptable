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
function isHiddenOrSystemFile(fileName) {
  return (
    fileName.startsWith(".") ||
    fileName.includes("__MACOSX") ||
    fileName === ".DS_Store"
  );
}

// Ignore unchanged scripts
function filesAreEqual(filePath, content) {
  try {
    return fileManager.readString(filePath) === content;
  } catch {
    return false;
  }
}

// Get all scripts (with .js extension)
let scriptFiles;
try {
  scriptFiles = fileManager
    .listContents(rootDirectory)
    .filter(
      (fileName) =>
        fileName.endsWith(".js") &&
        fileName !== CONFIG.backupFolderName &&
        !isHiddenOrSystemFile(fileName)
    );
} catch (err) {
  console.error(
    `[Backup][ERROR] Unable to list root directory: ${err.message}`
  );
  throw err;
}

// === BACKUP SCRIPTS ===

let scriptsBackedUp = 0;
let scriptsSkipped = 0;
const backedUpFileNames = [];

for (const scriptFileName of scriptFiles) {
  const sourcePath = fileManager.joinPath(rootDirectory, scriptFileName);

  if (!fileManager.isFileDownloaded(sourcePath)) {
    scriptsSkipped++;
    continue;
  }

  let content;
  try {
    content = fileManager.readString(sourcePath);
  } catch {
    scriptsSkipped++;
    continue;
  }

  const backupPath = fileManager.joinPath(backupDirectory, scriptFileName);
  const backupExists = fileManager.fileExists(backupPath);
  const shouldWrite =
    !CONFIG.overwriteOnlyIfChanged ||
    !backupExists ||
    !filesAreEqual(backupPath, content);

  if (shouldWrite) {
    try {
      fileManager.writeString(backupPath, content);
      scriptsBackedUp++;
      backedUpFileNames.push(scriptFileName);
    } catch {
      scriptsSkipped++;
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

// Log names of backed-up scripts
if (backedUpFileNames.length) {
  console.log("Backed up scripts:");
  backedUpFileNames.forEach((fileName) => console.log(fileName));
}

Script.complete();
