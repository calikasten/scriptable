// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: cloud;

// === CONFIG ===

const CONFIG = {
  includeTimestamps: false, // true = timestamped file names
  overwriteOnlyIfChanged: true, // false = overwrite all files on backup
  allowedExtensions: [".js"], // list of allowed file types by extension
  backupFolderName: "Script Backups"
};

// === FILE MANAGEMENT ===

const fileManager = FileManager.iCloud();
const rootDirectory = fileManager.documentsDirectory();
const backupDirectory = fileManager.joinPath(rootDirectory, CONFIG.backupFolderName);

// Ensure backup folder exists
if (!fileManager.fileExists(backupDirectory)) {
  fileManager.createDirectory(backupDirectory, true);
}

// === HELPER FUNCTIONS ===
function isValidScript(fileName) {
  return CONFIG.allowedExtensions.some((ext) => fileName.endsWith(ext));
}

function isHiddenOrSystemFile(fileName) {
  return (
    fileName.startsWith(".") ||
    fileName.includes("__MACOSX") ||
    fileName === ".DS_Store"
  );
}

function sanitizeFilename(name) {
  return name.replace(/[^\w.-]/g, "_");
}

function getTimestampedFilename(fileName) {
  // Remove file extension
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const extension = fileName.slice(fileName.lastIndexOf("."));
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${baseName}_${timestamp}${extension}`;
}

function log(msg) {
  console.log(`[Backup] ${msg}`);
}

// === BACK UP SCRIPTS ===

let scriptBackupCount = 0;
let skippedCount = 0;
const logMessages = [];

function backupScript(fileName) {
  if (!isValidScript(fileName) || isHiddenOrSystemFile(fileName)) {
    return;
  }

  const sourcePath = fileManager.joinPath(rootDirectory, fileName);
  if (!fileManager.isFileDownloaded(sourcePath)) {
    log(`Skipping (not downloaded): ${fileName}`);
    skippedCount++;
    return;
  }

  let content;
  try {
    content = fileManager.readString(sourcePath);
  } catch (err) {
    log(`Error reading: ${fileName} – ${err.message}`);
    skippedCount++;
    return;
  }

  const backupName = CONFIG.includeTimestamps
    ? getTimestampedFilename(fileName)
    : sanitizeFilename(fileName);

  const destPath = fileManager.joinPath(backupDirectory, backupName);

  let shouldWrite = true;

  if (CONFIG.overwriteOnlyIfChanged && fileManager.fileExists(destPath)) {
    const existing = fileManager.readString(destPath);
    shouldWrite = content !== existing;
  }

  if (shouldWrite) {
    try {
        fileManager.writeString(destPath, content);
      scriptBackupCount++;
      logMessages.push(`Backed up: ${fileName}`);
    } catch (err) {
      log(`Failed to write: ${fileName}`);
    }
  } else {
    skippedCount++;
    log(`Skipped (unchanged): ${fileName}`);
  }
}

// === EXECUTE SCRIPT ===

const allFiles = fileManager.listContents(rootDirectory);
allFiles.forEach(backupScript);

// === CONFIRMATION ===

const message = [
  `${scriptBackupCount} script(s) backed up`, `${skippedCount} skipped`
].join("\n");
const alert = new Alert();
alert.title = "Script Backup Complete";
alert.message = message;
alert.addAction("OK");
await alert.present();

logMessages.forEach(log);
Script.complete();
