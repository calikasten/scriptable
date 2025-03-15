// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: cloud;

// Set configuration variables
const SCRIPT_EXTENSION = "js";
const FOLDER_NAME = "Script Backups";
const directory = FileManager.iCloud().documentsDirectory();
const folderLocation = `/${FOLDER_NAME}`;
const directoryPath = `${directory}${folderLocation}`;

// Create directory location for script backups
FileManager.iCloud().createDirectory(directoryPath, true);

// Retrieve list of files to backup
const runBackup = FileManager.iCloud().listContents(directory);
let scriptBackupCount = 0;

// Backup each file that was found
runBackup.forEach(backupScript);

// Function to create a file backup
function backupScript(item) {
    const filePath = `${directory}/${item}`;
    const extension = FileManager.iCloud().fileExtension(filePath);

		// Skip backups for non-Javascript (.js) files
    if (extension !== SCRIPT_EXTENSION) {
        return;
    }

    try {
        const file = FileManager.iCloud().read(filePath);
        FileManager.iCloud().write(`${directoryPath}/${item}`, file);
        scriptBackupCount++;
    } catch (error) {
        console.error(`Failed to back up ${item}: ${error.message}`);
    }
}

// Display success confirmation
const dialogue = new Alert();
dialogue.addAction("OK");
dialogue.title = "Success";
dialogue.message = `${scriptBackupCount} scripts backed up to iCloud.`;
dialogue.present();

Script.complete();
