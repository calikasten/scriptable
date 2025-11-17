// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: cloud;

const main = async () => {
  // === CONFIGURATION ===
  const CONFIG = {
    overwriteOnlyIfChanged: true,
    backupFolderName: "Script Backups",
  };

  // === PATHS ===
  const fileManager = FileManager.iCloud();
  const rootDirectory = fileManager.documentsDirectory();
  const backupDirectory = fileManager.joinPath(
    rootDirectory,
    CONFIG.backupFolderName
  );

  // If backup folder doesn't exist, create it
  if (!fileManager.fileExists(backupDirectory)) {
    fileManager.createDirectory(backupDirectory, true);
  }

  // === HELPERS ===
  // Check if a file is a hidden file or system file
  const isHiddenOrSystemFile = (fileName) => {
    const lower = fileName.toLowerCase();
    return (
      fileName.startsWith(".") ||
      lower.includes("__macosx") ||
      lower === ".ds_store"
    );
  };

  // Check if file content matches existing content
  const filesAreEqual = (path, content) => {
    try {
      return fileManager.readString(path) === content;
    } catch {
      return false;
    }
  };

  // === LOAD SCRIPTS ===
  // Get all scripts from root directory (with .js extension)
  let scriptFiles = [];
  try {
    scriptFiles = fileManager
      .listContents(rootDirectory)
      .filter((name) => name.endsWith(".js") && !isHiddenOrSystemFile(name));
  } catch (error) {
    console.error(`[Backup][ERROR] Unable to list root directory: ${err}`);
    throw error;
  }

  // === BACKUP FILES LOGIC ===
  let scriptsBackedUp = 0;
  let scriptsSkipped = 0;
  const backedUpFileNames = [];

  for (const fileName of scriptFiles) {
    const sourcePath = fileManager.joinPath(rootDirectory, fileName);

    let content;
    // Read file content
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
      // Write or overwrite backup
      try {
        fileManager.writeString(backupPath, content);
        scriptsBackedUp++;
        backedUpFileNames.push(fileName);
      } catch (error) {
        scriptsSkipped++;
        console.error(`[Backup][ERROR] Failed to write ${fileName}: ${error}`);
      }
    } else {
      // Otherwise skip backup
      scriptsSkipped++;
    }
  }

  // === USER INTERFACE (ALERT) ===
  // Display summary alert with counts of backups or scripped skips
  const summaryAlert = new Alert();
  summaryAlert.title = "Backup Complete";
  summaryAlert.message = `${scriptsBackedUp} script(s) backed up\n${scriptsSkipped} skipped`;
  summaryAlert.addAction("OK");
  await summaryAlert.present();

  if (backedUpFileNames.length > 0) {
    console.log("Backed up scripts:");
    backedUpFileNames.forEach((name) => console.log(name));
  }

  // === FINALIZE ===
  Script.complete();
};

// === RUN MAIN ===
await main();
