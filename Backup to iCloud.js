// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: cloud;

// === MAIN EXECUTION ===
async function main() {
  // === CONFIGURATION ===
  const config = {
    overwriteOnlyIfChanged: true,
    folder: "Script Backups",
  };

  // === PATHS ===
  // Determine directories for documents and backups
  const fileManager = FileManager.iCloud();
  const rootDirectory = fileManager.documentsDirectory();
  const backupDirectory = fileManager.joinPath(rootDirectory, config.folder);

  // If backup folder doesn't exist, create it
  if (!fileManager.fileExists(backupDirectory)) {
    fileManager.createDirectory(backupDirectory, true);
  }

  // === HELPERS ===
  // Check if a file is a hidden file or system file
  const isHiddenOrSystemFile = (fileName) => {
    const lowercaseName = fileName.toLowerCase();
    return (
      fileName.startsWith(".") ||
      lowercaseName.includes("__macosx") ||
      lowercaseName === ".ds_store"
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

  // Get all scripts from root directory (with .js extension)
  const scriptFiles = (() => {
    try {
      return fileManager
        .listContents(rootDirectory)
        .filter((name) => name.endsWith(".js") && !isHiddenOrSystemFile(name));
    } catch (error) {
      console.error(`[Backup][ERROR] Unable to list root directory: ${error}`);
      throw error;
    }
  })();

  // === CORE SCRIPT LOGIC ===
  let scriptsBackedUp = 0;
  let scriptsSkipped = 0;
  const backedUpFileNames = [];

  // Process each script file and create or update backup
  for (const fileName of scriptFiles) {
    const sourcePath = fileManager.joinPath(rootDirectory, fileName);

    let content;

    // Read file content
    try {
      content = fileManager.readString(sourcePath);
    } catch (error) {
      scriptsSkipped++;
      console.error(`[Backup][SKIP] Failed to read ${fileName}: ${error}`);
      continue;
    }

    const backupPath = fileManager.joinPath(backupDirectory, fileName);

    // Criteria to create backup or overwrite existing backup
    const writeBackup =
      !config.overwriteOnlyIfChanged ||
      !fileManager.fileExists(backupPath) ||
      !filesAreEqual(backupPath, content);

    // Determine whether to write backup
    if (writeBackup) {
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
      scriptsSkipped++;
    }
  }

  // === UI COMPONENTS ===
  // Display summary alert with counts of backups and skipped scripts
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
}

// === MAIN EXECUTION ===
await main();
